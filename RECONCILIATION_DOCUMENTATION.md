# Participation Reconciliation Intelligence Engine

## Overview

The **Participation Reconciliation Intelligence Engine** is a feature that resolves conflicting participation data from multiple sources and produces one authoritative participation status for each student-event pair.

## Problem Solved

In a campus event system, student participation is recorded in multiple places:
- **Registration**: Student signs up for an event
- **Attendance**: Recorded via QR scanner or manual marking by organizers
- **Certificates**: Generated and issued to students

These sources can contradict each other, creating issues like:
- Student registered but attendance says absent
- Certificate issued without any attendance record
- Scanner says present but organizer manually marked absent

The Reconciliation Engine solves this by:
1. **Ingesting** all participation signals from different sources
2. **Applying trust scores** to each signal based on reliability
3. **Detecting conflicts** between signals
4. **Producing a canonical status** based on reconciliation rules
5. **Storing raw evidence** for audit trails

---

## Canonical Statuses

Every student-event pair gets assigned ONE of these statuses:

| Status | Meaning |
|--------|---------|
| `REGISTERED_ONLY` | Student registered but never attended |
| `ATTENDED_NO_CERTIFICATE` | Student physically attended but no certificate issued |
| `CERTIFIED` | Fully valid - student attended AND received certificate |
| `INVALIDATED` | Flagged as invalid/fraudulent - conflicts or revocations |

---

## Trust Scores

Signals are weighted by reliability:

| Source | Trust Score | Description |
|--------|-------------|-------------|
| `ATTENDANCE_SCANNER` | 95 | Automated QR scanning - highest trust |
| `CERTIFICATE` | 90 | System-generated certificate |
| `ORGANIZER_OVERRIDE` | 85 | Explicit organizer decision |
| `SYSTEM` | 80 | System-automated actions |
| `ATTENDANCE_MANUAL` | 70 | Manual attendance by organizer |
| `REGISTRATION` | 50 | Just registered - lowest trust |

---

## Architecture

### 1. ParticipationRecord Model
**Location**: `Server/models/ParticipationRecord.js`

Stores the reconciled participation status for each student-event pair.

**Key Fields**:
- `email` + `event`: Student-event pair (unique)
- `signals[]`: Array of all participation signals (raw evidence)
- `canonicalStatus`: The final reconciled status
- `reconciliation`: Metadata (confidence score, conflicts, version)
- `flags`: Quick indicators (hasConflicts, requiresManualReview, etc.)
- `statusBreakdown`: Boolean flags for quick queries
- `manualOverride`: Tracks manual corrections by authorized users

### 2. ReconciliationEngine
**Location**: `Server/utils/reconciliationEngine.js`

Core logic for reconciliation.

**Key Methods**:
- `reconcileParticipation(email, eventId)`: Reconcile a single student-event
- `reconcileEvent(eventId)`: Reconcile all participants for an event
- `manualOverride(email, eventId, newStatus, userId, reason)`: Manual correction
- `ingestAllSignals(email, eventId)`: Collect all signals from different sources
- `detectConflicts(signals)`: Find contradictions
- `determineCanonicalStatus(signals, conflicts)`: Apply reconciliation rules
- `calculateConfidenceScore(signals, conflicts, status)`: Compute confidence (0-100)

### 3. Reconciliation Middleware
**Location**: `Server/middleware/reconciliation.js`

Auto-triggers reconciliation when data changes.

**Features**:
- Mongoose hooks for `Participant`, `Attendance`, `Certificate` models
- Automatic reconciliation after save/update operations
- Express middleware for route-level reconciliation

### 4. API Routes
**Location**: `Server/routes/reconciliation.js`

**Endpoints**:

#### Reconcile Single Participation
```http
POST /api/reconciliation/single
Body: { email, eventId }
Auth: Required
```

#### Reconcile All Participants for Event
```http
POST /api/reconciliation/event/:eventId
Auth: Required
```

#### Get Reconciliation Status
```http
GET /api/reconciliation/status/:email/:eventId
Auth: Optional (public verification)
```

#### Get Event Records (with filters)
```http
GET /api/reconciliation/event/:eventId/records
Query: ?status=CERTIFIED&requiresReview=true
Auth: Required
```

#### Get Event Statistics
```http
GET /api/reconciliation/event/:eventId/stats
Auth: Required
```

#### Get Records Needing Review
```http
GET /api/reconciliation/needs-review
Query: ?eventId=...
Auth: Required
```

#### Manual Override
```http
POST /api/reconciliation/manual-override
Body: { email, eventId, newStatus, reason }
Auth: Required (ADMIN or TEAM_LEAD only)
```

#### Get Record Details
```http
GET /api/reconciliation/record/:recordId/details
Auth: Required
```

---

## How It Works

### Automatic Reconciliation

When any of these actions occur, reconciliation is **automatically triggered**:
- Participant registers for an event
- Attendance is marked (scanner or manual)
- Certificate is generated
- Certificate is revoked
- Participant is invalidated

**Implementation**: Mongoose post-save hooks in the models

### Manual Reconciliation

You can also manually trigger reconciliation via API:
```javascript
// Single participant
POST /api/reconciliation/single
{ email: "student@email.com", eventId: "..." }

// Entire event
POST /api/reconciliation/event/:eventId
```

### Conflict Detection

The engine detects these conflicts:
1. **Certificate without attendance** - Certificate issued but no attendance record
2. **Attendance contradiction** - Both present and absent signals exist
3. **Revoked with attendance** - Certificate revoked but attendance exists
4. **High-trust disagreement** - Multiple reliable sources conflict

### Reconciliation Logic

**Decision Matrix**:
```
IF invalidated → INVALIDATED
ELSE IF hasCertificate AND isPresent → CERTIFIED
ELSE IF hasCertificate AND NOT isPresent → INVALIDATED (suspicious)
ELSE IF isPresent AND NOT hasCertificate → ATTENDED_NO_CERTIFICATE
ELSE IF isRegistered AND NOT isPresent → REGISTERED_ONLY
ELSE → REGISTERED_ONLY (default)
```

### Confidence Score

Calculated as:
```
Base Score = Average trust score of all active signals
- Conflict Penalty: -15 per conflict
+ Consistency Bonus: +10 if no conflicts
- Suspicious Penalty: -20 if invalidated
= Final Score (0-100)
```

---

## Usage Examples

### 1. Check Participation Status
```javascript
// Frontend: Get status for verification
const response = await fetch(`/api/reconciliation/status/${email}/${eventId}`);
const { data } = await response.json();

console.log(data.canonicalStatus);        // "CERTIFIED"
console.log(data.confidenceScore);        // 92
console.log(data.hasConflicts);           // false
console.log(data.isVerified);             // true
```

### 2. Get Records Needing Review
```javascript
// Dashboard: Show organizers conflicts needing attention
const response = await fetch('/api/reconciliation/needs-review?eventId=...');
const { data } = await response.json();

// data = array of records with conflicts or low confidence
```

### 3. Manual Override
```javascript
// Admin corrects a mistake
const response = await fetch('/api/reconciliation/manual-override', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    email: 'student@email.com',
    eventId: '...',
    newStatus: 'CERTIFIED',
    reason: 'Attendance was recorded offline, certificate is valid'
  })
});
```

### 4. Event-Wide Reconciliation
```javascript
// After bulk import or data cleanup
const response = await fetch(`/api/reconciliation/event/${eventId}`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});

const { results } = await response.json();
console.log(results);
// { total: 150, reconciled: 148, failed: 2, conflicts: 5, requiresReview: 8 }
```

### 5. Event Statistics
```javascript
// Dashboard analytics
const response = await fetch(`/api/reconciliation/event/${eventId}/stats`);
const { data } = await response.json();

console.log(data);
// {
//   REGISTERED_ONLY: 20,
//   ATTENDED_NO_CERTIFICATE: 30,
//   CERTIFIED: 95,
//   INVALIDATED: 5,
//   total: 150,
//   conflictsCount: 5,
//   requiresReviewCount: 8,
//   suspiciousCount: 3,
//   verifiedCount: 120
// }
```

---

## Database Schema

### ParticipationRecord

```javascript
{
  email: "student@email.com",
  event: ObjectId("..."),
  participant: ObjectId("..."),
  
  signals: [
    {
      source: "REGISTRATION",              // Where signal came from
      signalType: "REGISTERED",            // What it indicates
      trustScore: 50,                      // Reliability (0-100)
      timestamp: "2026-02-15T10:00:00Z",
      recordedBy: ObjectId("..."),         // User who recorded it
      sourceRef: {
        model: "Participant",              // Source document
        id: ObjectId("...")
      },
      metadata: { ... },                   // Extra context
      isActive: true                       // Still valid?
    },
    {
      source: "ATTENDANCE_SCANNER",
      signalType: "PRESENT",
      trustScore: 95,
      timestamp: "2026-02-15T10:30:00Z",
      ...
    },
    {
      source: "CERTIFICATE",
      signalType: "CERTIFICATE_ISSUED",
      trustScore: 90,
      timestamp: "2026-02-15T18:00:00Z",
      ...
    }
  ],
  
  canonicalStatus: "CERTIFIED",
  
  reconciliation: {
    lastReconciledAt: "2026-02-15T18:05:00Z",
    reconciliationVersion: 3,
    confidenceScore: 92,
    conflicts: [],
    resolutionStrategy: "TRUST_SCORE"
  },
  
  flags: {
    hasConflicts: false,
    requiresManualReview: false,
    isSuspicious: false,
    isVerified: true
  },
  
  statusBreakdown: {
    isRegistered: true,
    hasAttendance: true,
    hasCertificate: true,
    isRevoked: false
  },
  
  manualOverride: {
    isOverridden: false,
    overriddenBy: null,
    overriddenAt: null,
    overrideReason: "",
    previousStatus: null
  }
}
```

---

## Testing

Test script: `Server/scripts/test-reconciliation.js`

```bash
cd Server
node scripts/test-reconciliation.js
```

---

## Integration Guide

### Step 1: Ensure Models Are Updated
The following models now have auto-reconciliation hooks:
- `Participant.js`
- `Attendance.js`
- `Certificate.js`

### Step 2: Use API Endpoints
Integrate the reconciliation endpoints into your frontend:
- Show reconciliation status on participant profiles
- Display conflicts needing review in organizer dashboard
- Allow admins to manually override statuses

### Step 3: Monitor Flags
Query records by flags for different views:
```javascript
// Dashboard: Show suspicious records
GET /api/reconciliation/event/:eventId/records?suspicious=true

// Organizer: Show records needing review
GET /api/reconciliation/needs-review?eventId=...

// Analytics: Show verified participants
GET /api/reconciliation/event/:eventId/records?verified=true
```

---

## Benefits

✅ **Single Source of Truth**: One canonical status per student-event pair  
✅ **Conflict Resolution**: Automatically detects and resolves contradictions  
✅ **Audit Trail**: All raw signals preserved for transparency  
✅ **Trust-Based**: Weights signals by reliability  
✅ **Suspicious Detection**: Flags potential fraud (e.g., certificate without attendance)  
✅ **Manual Override**: Authorized users can correct mistakes  
✅ **Auto-Sync**: Automatically reconciles when data changes  
✅ **Query Optimization**: Flags and breakdowns enable fast filtering  

---

## Future Enhancements

- **Machine Learning**: Use historical patterns to improve trust scores
- **Batch Processing**: Scheduled reconciliation for all events
- **Real-time Notifications**: Alert organizers when conflicts are detected
- **Blockchain Integration**: Immutable audit trail for certificates
- **Statistical Analysis**: Identify patterns in conflicts across events

---

## Support

For issues or questions, contact the development team or file an issue in the project repository.
