import mongoose from "mongoose";

const eventRoleSchema = new mongoose.Schema(
  {
    // Universal student identifier (same email across ParticipantAuth, SpeakerAuth, User)
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
    },

    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    role: {
      type: String,
      enum: ["participant", "volunteer", "speaker", "organizer"],
      required: true,
    },

    // Time-aware: when did they serve in this role?
    startTime: {
      type: Date,
    },

    endTime: {
      type: Date,
    },

    // Duration in minutes (can be auto-computed or manually set)
    durationMinutes: {
      type: Number,
      default: 0,
    },

    // Role-specific details
    details: {
      // For speakers
      topic: { type: String, default: "" },
      sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Session",
      },

      // For volunteers
      volunteerArea: { type: String, default: "" },

      // For organizers
      organizerRole: { type: String, default: "" }, // e.g. "TEAM_LEAD", "EVENT_STAFF"

      // General notes
      notes: { type: String, default: "" },
    },

    // Source: how this role was assigned
    source: {
      type: String,
      enum: ["auto", "manual"],
      default: "auto",
    },

    // Status of the role
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Allow same email to hold multiple roles per event, but prevent exact duplicates
eventRoleSchema.index({ email: 1, event: 1, role: 1, "details.sessionId": 1 });

export default mongoose.model("EventRole", eventRoleSchema);
