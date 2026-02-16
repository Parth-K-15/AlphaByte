import mongoose from "mongoose";

const speakerReviewSchema = new mongoose.Schema(
  {
    speaker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SpeakerAuth",
      required: true,
    },

    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
    },

    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    review: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// One review per organizer per session
speakerReviewSchema.index({ organizer: 1, session: 1 }, { unique: true });

export default mongoose.model("SpeakerReview", speakerReviewSchema);
