import mongoose from "mongoose";

const qrSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    eventId: {
      type: String,
      required: true,
    },
    organizerId: {
      type: String,
      default: "system",
    },
    createdAt: {
      type: Number,
      required: true,
    },
    expiresAt: {
      type: Number,
      required: true,
    },
    // Geo-fence fields (optional - only set when organizer enables geo-fenced attendance)
    geoFenceEnabled: {
      type: Boolean,
      default: false,
    },
    geoLatitude: {
      type: Number,
    },
    geoLongitude: {
      type: Number,
    },
    geoRadiusMeters: {
      type: Number,
      default: 200,
    },
  },
  { timestamps: false }
);

// TTL index: auto-delete documents 10 minutes after expiresAt (stored as epoch ms)
// MongoDB TTL works on Date fields, so we add a separate Date field for cleanup
qrSessionSchema.add({
  expiresAtDate: {
    type: Date,
    required: true,
    index: { expires: 0 }, // TTL: remove when current time passes this date
  },
});

const QRSession = mongoose.model("QRSession", qrSessionSchema);

export default QRSession;
