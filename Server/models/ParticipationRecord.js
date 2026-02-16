import mongoose from 'mongoose';

/**
 * ParticipationRecord Model
 * 
 * Stores the reconciled, canonical participation status for each student-event pair.
 * Ingests multiple signals (registration, attendance, certificate) and produces
 * one authoritative participation status based on trust/priority rules.
 */

const participationSignalSchema = new mongoose.Schema({
  // Source of this signal
  source: {
    type: String,
    enum: ['REGISTRATION', 'ATTENDANCE_SCANNER', 'ATTENDANCE_MANUAL', 'CERTIFICATE', 'ORGANIZER_OVERRIDE', 'SYSTEM'],
    required: true
  },
  
  // What this signal indicates
  signalType: {
    type: String,
    enum: ['REGISTERED', 'PRESENT', 'ABSENT', 'CERTIFICATE_ISSUED', 'CERTIFICATE_REVOKED', 'INVALIDATED'],
    required: true
  },
  
  // Trust score (0-100) - higher = more reliable
  trustScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  
  // When this signal was recorded
  timestamp: {
    type: Date,
    default: Date.now
  },
  
  // Who/what recorded this signal
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Reference to source document
  sourceRef: {
    model: {
      type: String,
      enum: ['Participant', 'Attendance', 'Certificate', 'EventRole'],
      default: null
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    }
  },
  
  // Additional metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Is this signal still valid?
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: false });

const participationRecordSchema = new mongoose.Schema({
  // Student-event pair
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  
  participant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Participant',
    default: null
  },
  
  // All participation signals (raw evidence)
  signals: [participationSignalSchema],
  
  // Canonical participation status (reconciled result)
  canonicalStatus: {
    type: String,
    enum: [
      'REGISTERED_ONLY',           // Signed up but never attended
      'ATTENDED_NO_CERTIFICATE',   // Physically present but no certificate
      'CERTIFIED',                 // Fully valid - attended AND certified
      'INVALIDATED'                // Flagged as invalid/fraudulent
    ],
    required: true,
    default: 'REGISTERED_ONLY'
  },
  
  // Reconciliation metadata
  reconciliation: {
    // When was this record last reconciled?
    lastReconciledAt: {
      type: Date,
      default: Date.now
    },
    
    // Reconciliation version (increments on each reconciliation)
    reconciliationVersion: {
      type: Number,
      default: 1
    },
    
    // Confidence score (0-100) in the canonical status
    confidenceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    
    // Conflicts detected during reconciliation
    conflicts: [{
      conflictType: String,
      description: String,
      detectedAt: {
        type: Date,
        default: Date.now
      }
    }],
    
    // Resolution strategy used
    resolutionStrategy: {
      type: String,
      enum: ['TRUST_SCORE', 'TIMESTAMP', 'MANUAL_OVERRIDE', 'SYSTEM_DEFAULT'],
      default: 'TRUST_SCORE'
    },
    
    // Notes about reconciliation
    notes: {
      type: String,
      default: ''
    }
  },
  
  // Flags for quick filtering
  flags: {
    hasConflicts: {
      type: Boolean,
      default: false
    },
    requiresManualReview: {
      type: Boolean,
      default: false
    },
    isSuspicious: {
      type: Boolean,
      default: false
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  
  // Status breakdown (for quick queries)
  statusBreakdown: {
    isRegistered: {
      type: Boolean,
      default: false
    },
    hasAttendance: {
      type: Boolean,
      default: false
    },
    hasCertificate: {
      type: Boolean,
      default: false
    },
    isRevoked: {
      type: Boolean,
      default: false
    }
  },
  
  // Manual overrides by authorized users
  manualOverride: {
    isOverridden: {
      type: Boolean,
      default: false
    },
    overriddenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    overriddenAt: {
      type: Date,
      default: null
    },
    overrideReason: {
      type: String,
      default: ''
    },
    previousStatus: {
      type: String,
      default: null
    }
  }
  
}, {
  timestamps: true
});

// Indexes for efficient queries
participationRecordSchema.index({ email: 1, event: 1 }, { unique: true });
participationRecordSchema.index({ canonicalStatus: 1 });
participationRecordSchema.index({ 'flags.requiresManualReview': 1 });
participationRecordSchema.index({ 'flags.isSuspicious': 1 });
participationRecordSchema.index({ event: 1, canonicalStatus: 1 });

// Virtual for getting all active signals
participationRecordSchema.virtual('activeSignals').get(function() {
  return this.signals.filter(signal => signal.isActive);
});

// Methods
participationRecordSchema.methods = {
  // Add a new signal and trigger reconciliation
  addSignal: function(signalData) {
    this.signals.push(signalData);
    return this.save();
  },
  
  // Get the highest trust score among active signals
  getHighestTrustScore: function() {
    const activeSignals = this.signals.filter(s => s.isActive);
    if (activeSignals.length === 0) return 0;
    return Math.max(...activeSignals.map(s => s.trustScore));
  },
  
  // Check if there are conflicting signals
  hasConflictingSignals: function() {
    const activeSignals = this.signals.filter(s => s.isActive);
    if (activeSignals.length < 2) return false;
    
    // Check for logical conflicts
    const hasPresent = activeSignals.some(s => s.signalType === 'PRESENT');
    const hasAbsent = activeSignals.some(s => s.signalType === 'ABSENT');
    const hasCertificate = activeSignals.some(s => s.signalType === 'CERTIFICATE_ISSUED');
    const hasRevoked = activeSignals.some(s => s.signalType === 'CERTIFICATE_REVOKED');
    
    // Conflict: both present and absent signals
    if (hasPresent && hasAbsent) return true;
    
    // Conflict: certificate issued but no attendance
    if (hasCertificate && !hasPresent) return true;
    
    // Conflict: both issued and revoked
    if (hasCertificate && hasRevoked) return true;
    
    return false;
  }
};

// Static methods
participationRecordSchema.statics = {
  // Find records that need reconciliation
  findNeedingReconciliation: function(eventId = null) {
    const query = {
      $or: [
        { 'flags.requiresManualReview': true },
        { 'flags.hasConflicts': true },
        { 'reconciliation.confidenceScore': { $lt: 50 } }
      ]
    };
    
    if (eventId) {
      query.event = eventId;
    }
    
    return this.find(query).populate('event participant');
  },
  
  // Get statistics for an event
  getEventStats: async function(eventId) {
    const stats = await this.aggregate([
      { $match: { event: mongoose.Types.ObjectId(eventId) } },
      {
        $group: {
          _id: '$canonicalStatus',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const result = {
      REGISTERED_ONLY: 0,
      ATTENDED_NO_CERTIFICATE: 0,
      CERTIFIED: 0,
      INVALIDATED: 0,
      total: 0
    };
    
    stats.forEach(stat => {
      result[stat._id] = stat.count;
      result.total += stat.count;
    });
    
    return result;
  }
};

export default mongoose.model('ParticipationRecord', participationRecordSchema);
