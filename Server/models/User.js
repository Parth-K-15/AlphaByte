import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
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

    role: {
      type: String,
      enum: ["ADMIN", "TEAM_LEAD", "EVENT_STAFF"],
      default: "EVENT_STAFF",
    },

    assignedEvent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
    },

    teamLead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // points to TEAM_LEAD
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Permissions fields
    permissions: {
      canCreateEvents: {
        type: Boolean,
        default: false,
      },
      canManageTeams: {
        type: Boolean,
        default: false,
      },
      canViewReports: {
        type: Boolean,
        default: false,
      },
      canManageParticipants: {
        type: Boolean,
        default: false,
      },
    },

    // Restriction fields
    restrictionReason: {
      type: String,
    },
    restrictedAt: {
      type: Date,
    },

    // Suspension fields
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

export default mongoose.model("User", userSchema);
