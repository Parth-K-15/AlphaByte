import mongoose from 'mongoose';

const eventUpdateSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['INFO', 'WARNING', 'URGENT', 'ANNOUNCEMENT'],
    default: 'INFO'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  isPinned: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

eventUpdateSchema.index({ event: 1, createdAt: -1 });

export default mongoose.model('EventUpdate', eventUpdateSchema);
