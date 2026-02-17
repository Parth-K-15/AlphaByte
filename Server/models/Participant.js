import mongoose from "mongoose";
import { maybeEncryptPii } from "../utils/piiCrypto.js";

const participantSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
    },

    phone: String,

    college: String,
    year: String,
    branch: String,

    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    registrationStatus: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'CANCELLED'],
      default: 'PENDING'
    },

    registrationType: {
      type: String,
      enum: ['ONLINE', 'WALK_IN'],
      default: 'ONLINE'
    },

    attendanceStatus: {
      type: String,
      enum: ['PENDING', 'ATTENDED', 'ABSENT'],
      default: 'ABSENT'
    },

    certificateStatus: {
      type: String,
      enum: ['PENDING', 'GENERATED', 'SENT'],
      default: 'PENDING'
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Lead or EVENT_STAFF who added walk-in participant
    },

    // Retroactive Change & Audit Trail fields
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
    },
    version: {
      type: Number,
      default: 1
    },
    previousVersion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Participant",
      default: null
    }
  },
  { timestamps: true }
);

// Compound unique index: same email can register for multiple events, but not the same event twice
participantSchema.index({ email: 1, event: 1 }, { unique: true });

participantSchema.pre("save", function (next) {
  if (this.isModified("phone")) {
    this.phone = maybeEncryptPii(this.phone);
  }
  next();
});

export default mongoose.model("Participant", participantSchema);
