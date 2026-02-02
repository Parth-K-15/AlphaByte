import mongoose from "mongoose";

const participantAuthSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    phone: {
      type: String,
    },

    password: {
      type: String,
      required: true,
    },

    college: {
      type: String,
    },

    branch: {
      type: String,
    },

    year: {
      type: String,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isSuspended: {
      type: Boolean,
      default: false,
    },

    suspensionReason: {
      type: String,
    },

    suspendedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ParticipantAuth", participantAuthSchema);
