import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    speaker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SpeakerAuth",
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    abstract: {
      type: String,
      default: "",
    },

    learningOutcomes: [
      {
        type: String,
      },
    ],

    time: {
      start: { type: Date },
      end: { type: Date },
    },

    room: {
      type: String,
      default: "",
    },

    track: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["draft", "pending", "confirmed", "rejected", "ongoing", "completed", "cancelled"],
      default: "draft",
    },

    assignment: {
      requestedAt: { type: Date },
      respondedAt: { type: Date },
      rejectionReason: { type: String, default: "" },
    },

    slides: [
      {
        name: { type: String },
        url: { type: String },
        publicId: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    avNeeds: {
      type: String,
      default: "",
    },

    updates: [
      {
        message: { type: String, required: true },
        type: {
          type: String,
          enum: ["general", "slides", "room_change", "time_change", "cancelled"],
          default: "general",
        },
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    registeredCount: {
      type: Number,
      default: 0,
    },

    checkedInCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Session", sessionSchema);
