import mongoose from "mongoose";

const participantSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
    },

    phone: String,

    college: String,

    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    assignedTeamLead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    assignedTeamMember: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Lead or EVENT_STAFF who added participant
    },
  },
  { timestamps: true }
);

export default mongoose.model("Participant", participantSchema);
