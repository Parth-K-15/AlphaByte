import mongoose from 'mongoose';

const speakerRequestSchema = new mongoose.Schema({
  speaker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SpeakerAuth',
    required: true,
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  message: {
    type: String,
    default: '',
  },
  matchScore: {
    type: Number,
    default: 0,
  },
  rank: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
  respondedAt: {
    type: Date,
    default: null,
  },
  rejectionReason: {
    type: String,
    default: '',
  },
}, { timestamps: true });

// Prevent duplicate requests — one request per speaker per event
speakerRequestSchema.index({ speaker: 1, event: 1 }, { unique: true });

export default mongoose.model('SpeakerRequest', speakerRequestSchema);
