import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ParticipantAuth from '../models/ParticipantAuth.js';
import SpeakerAuth from '../models/SpeakerAuth.js';

// Read JWT_SECRET at runtime to ensure dotenv has loaded
const getJwtSecret = () => process.env.JWT_SECRET || 'alphabyte_jwt_secret_key_2026';

// Verify JWT token middleware
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, getJwtSecret());

    // Check if user is a participant, speaker, or staff
    let user;
    if (decoded.isParticipant) {
      user = await ParticipantAuth.findById(decoded.id).select('-password');
    } else if (decoded.isSpeaker) {
      user = await SpeakerAuth.findById(decoded.id).select('-password');
      if (user) {
        user = { ...user.toObject(), role: 'SPEAKER' };
      }
    } else {
      user = await User.findById(decoded.id).select('-password');
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user is suspended
    if (user.isSuspended) {
      return res.status(403).json({
        success: false,
        message: `Account suspended: ${user.suspensionReason || 'Contact admin'}`,
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;
    req.isParticipant = decoded.isParticipant || false;
    req.isSpeaker = decoded.isSpeaker || false;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message,
    });
  }
};

// Authorize specific roles middleware
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`,
      });
    }

    next();
  };
};

// Admin only middleware
export const isAdmin = authorizeRoles('ADMIN');

// Team Lead only middleware
export const isTeamLead = authorizeRoles('TEAM_LEAD');

// Organizers (Team Lead + Event Staff) middleware
export const isOrganizer = authorizeRoles('TEAM_LEAD', 'EVENT_STAFF');

// Participant only middleware
export const isParticipant = authorizeRoles('PARTICIPANT');

// Speaker only middleware
export const isSpeaker = authorizeRoles('SPEAKER');

export default {
  verifyToken,
  authorizeRoles,
  isAdmin,
  isTeamLead,
  isOrganizer,
  isParticipant,
  isSpeaker,
};
