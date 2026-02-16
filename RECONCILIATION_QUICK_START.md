# Participation Reconciliation - Quick Start Guide

## What Was Built

✅ **ParticipationRecord Model** - Stores reconciled participation status  
✅ **ReconciliationEngine** - Core logic for resolving conflicts  
✅ **Reconciliation Middleware** - Auto-triggers on data changes  
✅ **API Routes** - 8 endpoints for reconciliation operations  
✅ **Documentation** - Complete guide and examples  
✅ **Test Suite** - Automated tests to verify functionality  

---

## Files Created/Modified

### New Files
1. **Models**
   - `Server/models/ParticipationRecord.js` - Main reconciliation model

2. **Services**
   - `Server/utils/reconciliationEngine.js` - Reconciliation logic engine

3. **Middleware**
   - `Server/middleware/reconciliation.js` - Auto-reconciliation hooks

4. **Routes**
   - `Server/routes/reconciliation.js` - API endpoints

5. **Documentation**
   - `AlphaByte/RECONCILIATION_DOCUMENTATION.md` - Full documentation
   - `AlphaByte/RECONCILIATION_QUICK_START.md` - This file

6. **Tests**
   - `Server/scripts/test-reconciliation.js` - Test suite

### Modified Files
1. `Server/app.js` - Added reconciliation route registration
2. `Server/models/Participant.js` - Added auto-reconciliation hooks
3. `Server/models/Attendance.js` - Added auto-reconciliation hooks
4. `Server/models/Certificate.js` - Added auto-reconciliation hooks

---

## How to Use

### 1. Start Your Server
```bash
cd Server
npm start
```

The reconciliation hooks are now active. Any time a participant registers, attendance is marked, or a certificate is issued, reconciliation happens automatically in the background.

### 2. Test the Implementation
Run the test suite to verify everything works:
```bash
cd Server
node scripts/test-reconciliation.js
```

Expected output:
```
✅ TEST 1 PASSED - REGISTERED_ONLY
✅ TEST 2 PASSED - ATTENDED_NO_CERTIFICATE
✅ TEST 3 PASSED - CERTIFIED
✅ TEST 4 PASSED - Conflict Detection
✅ TEST 5 PASSED - Manual Override
✅ TEST 6 PASSED - Event Reconciliation
✅ TEST 7 PASSED - Statistics

✅ ALL TESTS PASSED! 🎉
```

### 3. Try the API Endpoints

#### Get Reconciliation Status (Public)
```bash
curl http://localhost:5000/api/reconciliation/status/student@email.com/EVENT_ID
```

#### Reconcile Single Participant
```bash
curl -X POST http://localhost:5000/api/reconciliation/single \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "email": "student@email.com",
    "eventId": "EVENT_ID"
  }'
```

#### Get Event Statistics
```bash
curl http://localhost:5000/api/reconciliation/event/EVENT_ID/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get Records Needing Review
```bash
curl http://localhost:5000/api/reconciliation/needs-review?eventId=EVENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Manual Override (Admin Only)
```bash
curl -X POST http://localhost:5000/api/reconciliation/manual-override \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "email": "student@email.com",
    "eventId": "EVENT_ID",
    "newStatus": "CERTIFIED",
    "reason": "Attendance recorded offline"
  }'
```

---

## Integration with Frontend

### Example: Display Participation Status

```javascript
// React component example
import { useState, useEffect } from 'react';

function ParticipantStatus({ email, eventId }) {
  const [status, setStatus] = useState(null);
  
  useEffect(() => {
    fetch(`/api/reconciliation/status/${email}/${eventId}`)
      .then(res => res.json())
      .then(data => setStatus(data.data));
  }, [email, eventId]);
  
  if (!status) return <div>Loading...</div>;
  
  const statusColors = {
    CERTIFIED: 'green',
    ATTENDED_NO_CERTIFICATE: 'blue',
    REGISTERED_ONLY: 'yellow',
    INVALIDATED: 'red'
  };
  
  return (
    <div>
      <h3>Participation Status</h3>
      <div style={{ color: statusColors[status.canonicalStatus] }}>
        {status.canonicalStatus}
      </div>
      <p>Confidence: {status.confidenceScore}%</p>
      {status.hasConflicts && (
        <div className="warning">⚠️ Conflicts detected</div>
      )}
      {status.isVerified && (
        <div className="success">✅ Verified</div>
      )}
    </div>
  );
}
```

### Example: Organizer Dashboard - Conflicts View

```javascript
function ConflictsView({ eventId }) {
  const [records, setRecords] = useState([]);
  
  useEffect(() => {
    fetch(`/api/reconciliation/needs-review?eventId=${eventId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setRecords(data.data));
  }, [eventId]);
  
  return (
    <div>
      <h2>Records Needing Review ({records.length})</h2>
      {records.map(record => (
        <div key={record._id} className="conflict-card">
          <p>{record.participant?.fullName}</p>
          <p>Status: {record.canonicalStatus}</p>
          <p>Conflicts: {record.reconciliation.conflicts.length}</p>
          <button onClick={() => reviewRecord(record._id)}>
            Review
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## Common Scenarios

### Scenario 1: Student Claims They Attended But Not Marked

**Problem**: Student says they attended, but attendance record says absent.

**Solution**:
1. Check reconciliation record:
   ```bash
   GET /api/reconciliation/status/:email/:eventId
   ```
2. If incorrect, manually override:
   ```bash
   POST /api/reconciliation/manual-override
   {
     "email": "student@email.com",
     "eventId": "...",
     "newStatus": "ATTENDED_NO_CERTIFICATE",
     "reason": "Student provided proof of attendance"
   }
   ```

### Scenario 2: Certificate Issued by Mistake

**Problem**: Certificate was issued to someone who didn't attend.

**Solution**:
1. Revoke certificate in your system
2. Reconciliation will automatically update status to INVALIDATED
3. Or manually override:
   ```bash
   POST /api/reconciliation/manual-override
   {
     "newStatus": "INVALIDATED",
     "reason": "Certificate issued in error"
   }
   ```

### Scenario 3: Bulk Data Import

**Problem**: Imported 500 participants and need to reconcile all.

**Solution**:
```bash
POST /api/reconciliation/event/:eventId
```

This will reconcile all participants for the event in one go.

### Scenario 4: Check Event Quality

**Problem**: Want to see how clean the participation data is.

**Solution**:
```bash
GET /api/reconciliation/event/:eventId/stats
```

Returns:
- Total participants
- Status breakdown (CERTIFIED, ATTENDED_NO_CERTIFICATE, etc.)
- Number of conflicts
- Number requiring review
- Number of suspicious records

---

## Automatic Reconciliation

Reconciliation happens automatically when:
- ✅ New participant registers
- ✅ Attendance is marked (scanner or manual)
- ✅ Certificate is generated
- ✅ Certificate is revoked
- ✅ Participant record is updated
- ✅ Attendance record is updated

You don't need to manually trigger reconciliation in normal operations. It's all automatic!

---

## Querying Reconciliation Data

### Get All Certified Participants
```javascript
GET /api/reconciliation/event/:eventId/records?status=CERTIFIED
```

### Get Suspicious Records
```javascript
GET /api/reconciliation/event/:eventId/records?suspicious=true
```

### Get Verified Records
```javascript
GET /api/reconciliation/event/:eventId/records?verified=true
```

### Combine Filters
```javascript
GET /api/reconciliation/event/:eventId/records?status=CERTIFIED&verified=true
```

---

## Troubleshooting

### Reconciliation Not Triggering

**Check**: Ensure models have hooks added
```javascript
// In Participant.js, Attendance.js, Certificate.js
import { addReconciliationHooks } from '../middleware/reconciliation.js';
addReconciliationHooks(schema, 'modelType');
```

### Low Confidence Scores

**Reason**: Conflicting signals or low-trust sources

**Solution**: 
1. Check conflicts: `GET /api/reconciliation/record/:recordId/details`
2. Review signals and trust scores
3. Manually override if needed

### Records Not Found

**Reason**: Reconciliation happens asynchronously (after 1 second delay)

**Solution**: Wait a moment after data changes, or manually trigger:
```bash
POST /api/reconciliation/single
{
  "email": "student@email.com",
  "eventId": "..."
}
```

---

## Performance Considerations

- Reconciliation runs in background (non-blocking)
- Uses `setImmediate()` to avoid blocking response
- Queries use indexes for fast lookups
- Batch reconciliation available for events

---

## Security

- Public endpoints: Status verification (read-only)
- Protected endpoints: Reconciliation operations (requires auth)
- Manual override: Admin/Team Lead only

---

## Next Steps

1. ✅ **Test the implementation** - Run test suite
2. ✅ **Try API endpoints** - Use curl or Postman
3. 📱 **Integrate with frontend** - Add status displays and conflict views
4. 📊 **Create dashboards** - Show reconciliation stats
5. 🔔 **Add notifications** - Alert organizers of conflicts

---

## Need Help?

- **Full Documentation**: See `RECONCILIATION_DOCUMENTATION.md`
- **API Reference**: See routes in `Server/routes/reconciliation.js`
- **Code Examples**: See test script in `Server/scripts/test-reconciliation.js`

---

## Summary

You now have a complete **Participation Reconciliation Intelligence Engine** that:

✅ Automatically resolves conflicting participation data  
✅ Produces one canonical status per student-event pair  
✅ Detects and flags suspicious patterns  
✅ Provides audit trails with all raw signals  
✅ Allows manual overrides by authorized users  
✅ Integrates seamlessly with existing data models  

**The system is production-ready and will automatically reconcile participation data as events happen!**
