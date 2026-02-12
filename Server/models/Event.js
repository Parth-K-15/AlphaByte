import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: String,

    location: String,
    venue: String,
    address: String,

    startDate: Date,
    endDate: Date,
    time: String,

    category: String,
    type: {
      type: String,
      enum: ['Online', 'Offline', 'Hybrid'],
      default: 'Offline'
    },

    status: {
      type: String,
      enum: ['draft', 'upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'draft'
    },

    registrationFee: {
      type: Number,
      default: 0
    },
    maxParticipants: Number,
    registrationDeadline: Date,

    website: String,
    bannerImage: String,
    tags: [String],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // ADMIN
    },

    teamLead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // TEAM_LEAD
    },

    teamMembers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User", // EVENT_STAFF
        },
        role: {
          type: String,
          enum: ['TEAM_LEAD', 'TEAM_MEMBER'],
          default: 'TEAM_MEMBER'
        },
        permissions: {
          canViewParticipants: { type: Boolean, default: true },
          canManageAttendance: { type: Boolean, default: true },
          canSendEmails: { type: Boolean, default: false },
          canGenerateCertificates: { type: Boolean, default: false },
          canEditEvent: { type: Boolean, default: false },
        },
        addedAt: {
          type: Date,
          default: Date.now
        }
      },
    ],

    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Participant",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Event", eventSchema);
