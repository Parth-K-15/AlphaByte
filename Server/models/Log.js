import mongoose from 'mongoose';

const logSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['AUTH', 'EVENT', 'USER', 'SYSTEM', 'ACCESS', 'ERROR', 'MEMBER'],
      required: true,
    },
    level: {
      type: String,
      enum: ['info', 'success', 'warning', 'error'],
      default: 'info',
    },
    action: {
      type: String,
      required: true,
    },
    details: {
      type: String,
    },
    user: {
      type: String, // Email or username
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
    },
    eventName: {
      type: String,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed, // Store additional data
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
logSchema.index({ createdAt: -1 });
logSchema.index({ type: 1 });
logSchema.index({ level: 1 });
logSchema.index({ userId: 1 });
logSchema.index({ eventId: 1 });

const Log = mongoose.model('Log', logSchema);

export default Log;
