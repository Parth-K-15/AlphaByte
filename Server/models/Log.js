import mongoose from 'mongoose';

const logSchema = new mongoose.Schema(
  {
    // Core identification
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      index: true,
    },
    eventName: {
      type: String,
    },
    participantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Participant',
      index: true,
    },
    participantName: {
      type: String,
    },
    participantEmail: {
      type: String,
    },
    
    // Action classification
    actionType: {
      type: String,
      required: true,
      enum: [
        // Event Lifecycle
        'EVENT_CREATED',
        'EVENT_PUBLISHED',
        'EVENT_STATE_CHANGED',
        'EVENT_UPDATED',
        'EVENT_ARCHIVED',
        
        // Participation & Attendance
        'STUDENT_REGISTERED',
        'REGISTRATION_CANCELLED',
        'PARTICIPANT_ADDED',
        'PARTICIPANT_UPDATED',
        'PARTICIPANT_REMOVED',
        'PARTICIPANT_INVALIDATED',
        'ATTENDANCE_RECORDED',
        'ATTENDANCE_MANUAL',
        'ATTENDANCE_INVALIDATED',
        'SCAN_REJECTED',
        'DUPLICATE_SCAN',
        
        // Reconciliation
        'RECONCILIATION_EXECUTED',
        'PARTICIPATION_STATUS_CHANGED',
        'CONFLICT_DETECTED',
        'PARTICIPATION_INVALIDATED',
        
        // Certificate
        'CERTIFICATE_GENERATED',
        'CERTIFICATE_ISSUED',
        'CERTIFICATE_REVOKED',
        'CERTIFICATE_VERIFIED',
        'CERTIFICATE_RESENT',
        'CERTIFICATE_REQUEST_APPROVED',
        'CERTIFICATE_REQUEST_REJECTED',
        'FRAUD_DETECTED',
        'CERTIFICATES_GENERATED', // Bulk certificate generation
        'CERTIFICATES_SENT', // Bulk certificate sending
        
        // Communication
        'EMAIL_SENT',
        'ANNOUNCEMENT_POSTED',
        'QR_GENERATED',
        'EVENT_UPDATE_POSTED',
        'EVENT_UPDATE_DELETED',
        'EVENT_UPDATE_PINNED',
        'EVENT_UPDATE_UNPINNED',
        
        // Role & Identity
        'ROLE_ASSIGNED',
        'ROLE_CHANGED',
        'ROLE_REMOVED',
        'ROLE_TIME_UPDATED',
        'TEAM_MEMBER_ADDED',
        'TEAM_MEMBER_REMOVED',
        'TEAM_PERMISSIONS_UPDATED',
        
        // Audit & Corrections
        'ATTENDANCE_CORRECTED',
        'CERTIFICATE_CORRECTION',
        'MANUAL_OVERRIDE',
        
        // Legacy types
        'AUTH',
        'EVENT',
        'USER',
        'SYSTEM',
        'ACCESS',
        'ERROR',
        'MEMBER',
      ],
    },
    
    entityType: {
      type: String,
      enum: ['EVENT', 'PARTICIPATION', 'ATTENDANCE', 'CERTIFICATE', 'ROLE', 'SYSTEM', 'USER', 'COMMUNICATION', 'TEAM'],
      required: true,
    },
    
    // State tracking
    oldState: {
      type: mongoose.Schema.Types.Mixed,
    },
    newState: {
      type: mongoose.Schema.Types.Mixed,
    },
    
    // Actor information
    actorType: {
      type: String,
      enum: ['STUDENT', 'ORGANIZER', 'ADMIN', 'SYSTEM'],
      required: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'actorType',
    },
    actorName: {
      type: String,
    },
    actorEmail: {
      type: String,
    },
    
    // Details
    action: {
      type: String,
      required: true,
    },
    details: {
      type: String,
    },
    reason: {
      type: String, // Mandatory for corrections/revocations
    },
    
    // Severity
    severity: {
      type: String,
      enum: ['INFO', 'WARNING', 'CRITICAL'],
      default: 'INFO',
    },
    level: {
      type: String,
      enum: ['info', 'success', 'warning', 'error'],
      default: 'info',
    },
    
    // Legacy fields (kept for compatibility)
    type: {
      type: String,
      enum: ['AUTH', 'EVENT', 'USER', 'SYSTEM', 'ACCESS', 'ERROR', 'MEMBER'],
    },
    user: {
      type: String,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    
    // Additional metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
logSchema.index({ createdAt: -1 });
logSchema.index({ type: 1 });
logSchema.index({ level: 1 });
logSchema.index({ userId: 1 });
logSchema.index({ eventId: 1, createdAt: -1 });
logSchema.index({ participantId: 1 });
logSchema.index({ actionType: 1 });
logSchema.index({ entityType: 1 });
logSchema.index({ severity: 1 });
logSchema.index({ actorType: 1 });

const Log = mongoose.model('Log', logSchema);

export default Log;
