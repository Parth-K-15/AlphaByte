import Log from '../models/Log.js';

/**
 * Create a log entry in the database
 * @param {Object} logData - Log data
 * @param {string} logData.type - Type of log (AUTH, EVENT, USER, SYSTEM, ACCESS, ERROR, MEMBER)
 * @param {string} logData.level - Level of log (info, success, warning, error)
 * @param {string} logData.action - Action performed
 * @param {string} logData.details - Additional details
 * @param {string} logData.user - Email or username
 * @param {string} logData.userId - User ID
 * @param {string} logData.eventId - Event ID (optional)
 * @param {string} logData.eventName - Event name (optional)
 * @param {Object} logData.metadata - Additional metadata (optional)
 */
export const createLog = async (logData) => {
  try {
    await Log.create({
      type: logData.type,
      level: logData.level || 'info',
      action: logData.action,
      details: logData.details,
      user: logData.user,
      userId: logData.userId,
      eventId: logData.eventId,
      eventName: logData.eventName,
      metadata: logData.metadata,
    });
  } catch (error) {
    // Don't throw error to prevent disrupting main functionality
    console.error('Error creating log:', error.message);
  }
};

/**
 * Create an authentication log
 */
export const logAuth = async (action, user, details = '', level = 'info') => {
  return createLog({
    type: 'AUTH',
    level,
    action,
    details,
    user: user.email || user,
    userId: user._id || user.id,
  });
};

/**
 * Create an event log
 */
export const logEvent = async (action, user, eventData, details = '', level = 'info') => {
  return createLog({
    type: 'EVENT',
    level,
    action,
    details,
    user: user.email,
    userId: user._id || user.id,
    eventId: eventData._id || eventData.id,
    eventName: eventData.name || eventData.title,
  });
};

/**
 * Create a user management log
 */
export const logUser = async (action, performedBy, targetUser, details = '', level = 'info') => {
  return createLog({
    type: 'USER',
    level,
    action,
    details,
    user: performedBy.email,
    userId: performedBy._id || performedBy.id,
    metadata: {
      targetUser: targetUser.email,
      targetUserId: targetUser._id || targetUser.id,
    },
  });
};

/**
 * Create a system log
 */
export const logSystem = async (action, details = '', level = 'info') => {
  return createLog({
    type: 'SYSTEM',
    level,
    action,
    details,
  });
};

/**
 * Create an access control log
 */
export const logAccess = async (action, user, details = '', level = 'info') => {
  return createLog({
    type: 'ACCESS',
    level,
    action,
    details,
    user: user.email,
    userId: user._id || user.id,
  });
};

/**
 * Create an error log
 */
export const logError = async (action, error, user = null, details = '') => {
  return createLog({
    type: 'ERROR',
    level: 'error',
    action,
    details: details || error.message,
    user: user?.email,
    userId: user?._id || user?.id,
    metadata: {
      errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    },
  });
};

/**
 * Create a member log
 */
export const logMember = async (action, user, details = '', level = 'info', metadata = {}) => {
  return createLog({
    type: 'MEMBER',
    level,
    action,
    details,
    user: user.email,
    userId: user._id || user.id,
    metadata,
  });
};
