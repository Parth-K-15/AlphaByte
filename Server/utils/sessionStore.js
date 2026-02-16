// MongoDB-backed session store for QR attendance sessions
// Used by both organizer (generate QR) and participant (scan QR) routes
// Replaces the previous in-memory Map which didn't work on serverless (Vercel)

import QRSession from '../models/QRSession.js';

const activeSessions = {
  async set(sessionId, data) {
    await QRSession.findOneAndUpdate(
      { sessionId },
      {
        sessionId,
        eventId: data.eventId,
        organizerId: data.organizerId || 'system',
        createdAt: data.createdAt,
        expiresAt: data.expiresAt,
        expiresAtDate: new Date(data.expiresAt),
      },
      { upsert: true, new: true }
    );
  },

  async get(sessionId) {
    const session = await QRSession.findOne({ sessionId });
    if (!session) return undefined;
    return {
      eventId: session.eventId,
      organizerId: session.organizerId,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    };
  },

  async delete(sessionId) {
    await QRSession.deleteOne({ sessionId });
  },
};

export default activeSessions;
