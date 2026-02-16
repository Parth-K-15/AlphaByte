// Shared in-memory session store for QR attendance sessions
// Used by both organizer (generate QR) and participant (scan QR) routes

const activeSessions = new Map();

// Clean up expired sessions periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of activeSessions.entries()) {
    if (now > session.expiresAt) {
      activeSessions.delete(sessionId);
    }
  }
}, 5 * 60 * 1000);

export default activeSessions;
