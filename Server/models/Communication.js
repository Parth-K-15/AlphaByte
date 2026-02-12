import mongoose from 'mongoose';

const communicationSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['EMAIL', 'ANNOUNCEMENT', 'SMS'],
    default: 'EMAIL'
  },
  template: {
    type: String,
    enum: ['REMINDER', 'VENUE_UPDATE', 'CERTIFICATE', 'THANK_YOU', 'CUSTOM'],
    default: 'CUSTOM'
  },
  recipientFilter: {
    type: String,
    enum: ['ALL', 'REGISTERED', 'ATTENDED', 'NOT_ATTENDED', 'CERTIFIED', 'NOT_CERTIFIED'],
    default: 'ALL'
  },
  recipientCount: {
    type: Number,
    default: 0
  },
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['DRAFT', 'SENDING', 'SENT', 'FAILED'],
    default: 'SENT'
  }
}, {
  timestamps: true
});

export default mongoose.model('Communication', communicationSchema);
