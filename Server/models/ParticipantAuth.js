import mongoose from "mongoose";
import { maybeEncryptPii } from "../utils/piiCrypto.js";

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

    avatar: {
      type: String,
    },

    avatarPublicId: {
      type: String,
    },
  },
  { timestamps: true }
);

participantAuthSchema.pre("save", function (next) {
  if (this.isModified("phone")) {
    this.phone = maybeEncryptPii(this.phone);
  }
  next();
});

export default mongoose.model("ParticipantAuth", participantAuthSchema);
