// MongoDB-backed session store for QR attendance sessions
// Used by both organizer (generate QR) and participant (scan QR) routes
// Replaces the previous in-memory Map which didn't work on serverless (Vercel)

import QRSession from '../models/QRSession.js';

const activeSessions = {
  async set(sessionId, data) {
    const updateData = {
      sessionId,
      eventId: data.eventId,
      organizerId: data.organizerId || 'system',
      createdAt: data.createdAt,
      expiresAt: data.expiresAt,
      expiresAtDate: new Date(data.expiresAt),
      // Geo-fence fields (only stored when organizer enables geo-fenced attendance)
      geoFenceEnabled: data.geoFenceEnabled || false,
    };
    if (data.geoFenceEnabled) {
      updateData.geoLatitude = data.geoLatitude;
      updateData.geoLongitude = data.geoLongitude;
      updateData.geoRadiusMeters = data.geoRadiusMeters || 200;
    }
    await QRSession.findOneAndUpdate(
      { sessionId },
      updateData,
      { upsert: true, new: true }
    );
  },

  async get(sessionId) {
    const session = await QRSession.findOne({ sessionId });
    if (!session) return undefined;
    const result = {
      eventId: session.eventId,
      organizerId: session.organizerId,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    };
    // Include geo-fence data if enabled
    if (session.geoFenceEnabled) {
      result.geoFence = {
        enabled: true,
        latitude: session.geoLatitude,
        longitude: session.geoLongitude,
        radiusMeters: session.geoRadiusMeters,
      };
    }
    return result;
  },

  async delete(sessionId) {
    await QRSession.deleteOne({ sessionId });
  },
};

export default activeSessions;
