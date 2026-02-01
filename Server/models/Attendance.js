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
  scannedAt: {
    type: Date,
    default: Date.now
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['PRESENT', 'LATE', 'EXCUSED'],
    default: 'PRESENT'
  }
}, {
  timestamps: true
});

attendanceSchema.index({ event: 1, participant: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);
