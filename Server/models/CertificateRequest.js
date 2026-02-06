import mongoose from 'mongoose';

const certificateRequestSchema = new mongoose.Schema({
  participant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Participant',
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'GENERATED'],
    default: 'PENDING'
  },
  achievement: {
    type: String,
    default: null // Will be set by organizer (Winner, Participant, etc.)
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date,
    default: null
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },
  certificate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certificate',
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
certificateRequestSchema.index({ event: 1, participant: 1 });
certificateRequestSchema.index({ status: 1 });
certificateRequestSchema.index({ event: 1, status: 1 });

export default mongoose.model('CertificateRequest', certificateRequestSchema);
