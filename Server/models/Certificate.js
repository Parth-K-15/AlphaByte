import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
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
  certificateId: {
    type: String,
    unique: true,
    required: true
  },
  certificateUrl: {
    type: String,
    default: null
  },
  issuedAt: {
    type: Date,
    default: Date.now
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sentAt: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['GENERATED', 'SENT', 'DOWNLOADED', 'FAILED'],
    default: 'GENERATED'
  },
  template: {
    type: String,
    default: 'default'
  }
}, {
  timestamps: true
});

certificateSchema.index({ event: 1, participant: 1 }, { unique: true });

certificateSchema.pre('validate', function(next) {
  if (!this.certificateId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    this.certificateId = `CERT-${timestamp}-${random}`.toUpperCase();
  }
  next();
});

export default mongoose.model('Certificate', certificateSchema);
