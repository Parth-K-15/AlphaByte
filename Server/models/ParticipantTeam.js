import mongoose from "mongoose";

const participantTeamSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    teamName: {
      type: String,
      required: true,
    },

    captain: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Participant",
      required: true,
    },

    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Participant",
      },
    ],

    totalMembers: {
      type: Number,
      required: true,
    },

    registrationStatus: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'CANCELLED'],
      default: 'PENDING'
    },

    // Optional team metadata
    organizationName: {
      type: String,
      default: null
    },

    contactEmail: {
      type: String,
      default: null
    },

    contactPhone: {
      type: String,
      default: null
    },

    // Audit trail
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

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
      ref: "User",
      default: null
    },

    invalidationReason: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

// Compound unique index: same team name cannot be registered for the same event twice
participantTeamSchema.index({ teamName: 1, event: 1 }, { unique: true });

// Index for efficient queries
participantTeamSchema.index({ event: 1, registrationStatus: 1 });
participantTeamSchema.index({ captain: 1 });

export default mongoose.model("ParticipantTeam", participantTeamSchema);
