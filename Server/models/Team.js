import mongoose from "mongoose";

const teamSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    teamLead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // EVENT_STAFF
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Team", teamSchema);
