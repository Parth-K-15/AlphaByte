import mongoose from "mongoose";

const speakerAuthSchema = new mongoose.Schema(
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

    bio: {
      type: String,
      default: "",
    },

    specializations: [
      {
        type: String,
      },
    ],

    socialLinks: {
      linkedin: { type: String, default: "" },
      twitter: { type: String, default: "" },
      website: { type: String, default: "" },
      github: { type: String, default: "" },
    },

    headshot: {
      type: String,
    },

    headshotPublicId: {
      type: String,
    },

    pastSpeakingRecords: [
      {
        eventName: { type: String },
        date: { type: Date },
        topic: { type: String },
        organizer: { type: String },
      },
    ],

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

export default mongoose.model("SpeakerAuth", speakerAuthSchema);
