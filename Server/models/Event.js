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

    // Participation Type - Individual or Team Events
    participationType: {
      type: String,
      enum: ['INDIVIDUAL', 'TEAM'],
      default: 'INDIVIDUAL'
    },

    // Team Event Configuration (only applicable when participationType is 'TEAM')
    teamConfig: {
      minSize: {
        type: Number,
        default: 2,
        min: 1
      },
      maxSize: {
        type: Number,
        default: 5,
        min: 1
      },
      requireTeamName: {
        type: Boolean,
        default: true
      },
      allowMixedGender: {
        type: Boolean,
        default: true
      },
      minMembersForCertificate: {
        type: Number,
        default: null // null means all members must attend
      }
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

    rulebook: {
      type: String,
      default: ''
    },

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
        },
        // Time-bound role assignment
        startTime: {
          type: Date,
          default: null // null means active immediately
        },
        endTime: {
          type: Date,
          default: null // null means no end date (ongoing)
        },
        // Track if the role period has ended
        status: {
          type: String,
          enum: ['active', 'completed', 'removed'],
          default: 'active'
        },
        // Reason for removal if status is 'removed'
        removalReason: {
          type: String,
          default: ''
        },
        removedAt: {
          type: Date,
          default: null
        }
      },
    ],

    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Participant",
      },
    ],

    // Certificate Configuration
    enableCertificates: {
      type: Boolean,
      default: false
    },
    certificateTemplate: {
      type: String,
      enum: ['default', 'modern', 'classic'],
      default: 'default'
    },
    certificateSettings: {
      autoGenerate: {
        type: Boolean,
        default: false
      },
      autoSend: {
        type: Boolean,
        default: false
      }
    }
  },
  { timestamps: true }
);

export default mongoose.model("Event", eventSchema);
