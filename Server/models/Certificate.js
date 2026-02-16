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
  verificationId: {
    type: String,
    unique: true,
    sparse: true
  },
  certificateUrl: {
    type: String,
    default: null
  },
  cloudinaryUrl: {
    type: String,
    default: null
  },
  cloudinaryPublicId: {
    type: String,
    default: null
  },
  pdfPath: {
    type: String,
    default: null
  },
  pdfFilename: {
    type: String,
    default: null
  },
  achievement: {
    type: String,
    default: 'Participation'
  },
  competitionName: {
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
    enum: ['GENERATED', 'SENT', 'DOWNLOADED', 'FAILED', 'REVOKED'],
    default: 'GENERATED'
  },
  template: {
    type: String,
    default: 'default'
  },
  // Retroactive Change & Audit Trail fields
  isValid: {
    type: Boolean,
    default: true
  },
  revokedAt: {
    type: Date,
    default: null
  },
  revokedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  revocationReason: {
    type: String,
    default: null
  },
  version: {
    type: Number,
    default: 1
  },
  previousVersion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certificate',
    default: null
  }
}, {
  timestamps: true
});

certificateSchema.index({ event: 1, participant: 1 }, { unique: true });

certificateSchema.pre('validate', function () {
  if (!this.certificateId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    this.certificateId = `CERT-${timestamp}-${random}`.toUpperCase();
  }
  if (!this.verificationId) {
    // Generate a unique verification ID using timestamp + random hex
    const ts = Date.now().toString(16);
    const r1 = Math.random().toString(16).substring(2, 10);
    const r2 = Math.random().toString(16).substring(2, 10);
    this.verificationId = `${ts}-${r1}-${r2}`;
  }
});

export default mongoose.model('Certificate', certificateSchema);
