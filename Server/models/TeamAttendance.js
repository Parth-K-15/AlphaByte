import mongoose from 'mongoose';

const teamAttendanceSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },

  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParticipantTeam',
    required: true
  },

  teamName: {
    type: String,
    required: true
  },

  checkedInAt: {
    type: Date,
    default: Date.now
  },

  checkedInBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  status: {
    type: String,
    enum: ['PRESENT', 'ABSENT'],
    default: 'PRESENT'
  },

  // Auto-calculated from member attendance
  membersPresent: {
    type: Number,
    default: 0
  },

  membersAbsent: {
    type: Number,
    default: 0
  },

  totalMembers: {
    type: Number,
    required: true
  },

  attendancePercentage: {
    type: Number,
    default: 0
  },

  // Audit trail
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

  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
teamAttendanceSchema.index({ event: 1, team: 1 }, { unique: true });
teamAttendanceSchema.index({ event: 1, status: 1 });

// Method to update member attendance counts
teamAttendanceSchema.methods.updateMemberCounts = async function() {
  const Attendance = mongoose.model('Attendance');
  const ParticipantTeam = mongoose.model('ParticipantTeam');

  const team = await ParticipantTeam.findById(this.team);
  if (!team) return;

  const presentCount = await Attendance.countDocuments({
    event: this.event,
    team: this.team,
    status: 'PRESENT',
    isValid: true
  });

  this.membersPresent = presentCount;
  this.membersAbsent = team.totalMembers - presentCount;
  this.totalMembers = team.totalMembers;
  this.attendancePercentage = team.totalMembers > 0 
    ? Math.round((presentCount / team.totalMembers) * 100) 
    : 0;

  await this.save();
};

export default mongoose.model('TeamAttendance', teamAttendanceSchema);
