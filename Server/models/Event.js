import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: String,

    location: String,

    startDate: Date,
    endDate: Date,

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
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // EVENT_STAFF
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
