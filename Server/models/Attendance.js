import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  participant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Participant',
    required: true
  },

  // Team Event Fields
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParticipantTeam',
    default: null
  },

  teamAttendance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TeamAttendance',
    default: null
  },

  scannedAt: {
    type: Date,
    default: Date.now
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  sessionId: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['PRESENT', 'LATE', 'EXCUSED'],
    default: 'PRESENT'
  },
  // Retroactive Change & Audit Trail fields
  isValid: {
    type: Boolean,
    default: true
  },
  invalidatedAt: {
    type: Date,
    default: null
  },
  invalidatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  invalidationReason: {
    type: String,
    default: null
  },
  version: {
    type: Number,
    default: 1
  },
  previousVersion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attendance',
    default: null
  }
}, {
  timestamps: true
});

attendanceSchema.index({ event: 1, participant: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);
