import mongoose from "mongoose";

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
      default: 'PENDING'
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
  },
  { timestamps: true }
);

export default mongoose.model("Participant", participantSchema);
