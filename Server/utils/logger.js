import Log from '../models/Log.js';

/**
 * Logger utility for creating log entries
 */
class Logger {
  /**
   * Create a log entry
   * @param {Object} options - Log options
   * @param {string} options.type - Log type (AUTH, EVENT, USER, SYSTEM, ACCESS, ERROR, MEMBER)
   * @param {string} options.level - Log level (info, success, warning, error)
   * @param {string} options.action - Action description
   * @param {string} options.details - Additional details
   * @param {string} options.user - User email or username
   * @param {string} options.userId - User ID
   * @param {string} options.eventId - Event ID
   * @param {string} options.eventName - Event name
   * @param {Object} options.metadata - Additional metadata
   */
  static async log(options) {
    try {
      const {
        type,
        level = 'info',
        action,
        details,
        user,
        userId,
        eventId,
        eventName,
        metadata,
      } = options;

      await Log.create({
        type,
        level,
        action,
        details,
        user,
        userId,
        eventId,
        eventName,
        metadata,
      });
    } catch (error) {
      console.error('Error creating log:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  // Convenience methods for different log types
  static async auth(action, user, level = 'info', details = '') {
    return this.log({
      type: 'AUTH',
      level,
      action,
      details,
      user: user?.email || user,
      userId: user?._id,
    });
  }

  static async event(action, eventData, user, level = 'info', details = '') {
    return this.log({
      type: 'EVENT',
      level,
      action,
      details,
      user: user?.email,
      userId: user?._id,
      eventId: eventData?._id || eventData,
      eventName: eventData?.title || eventData?.name,
    });
  }

  static async member(action, memberData, user, level = 'info', details = '') {
    return this.log({
      type: 'MEMBER',
      level,
      action,
      details,
      user: user?.email,
      userId: user?._id,
      metadata: {
        memberId: memberData?._id,
        memberEmail: memberData?.email,
        memberName: memberData?.name,
      },
    });
  }

  static async userAction(action, targetUser, performedBy, level = 'info', details = '') {
    return this.log({
      type: 'USER',
      level,
      action,
      details,
      user: performedBy?.email,
      userId: performedBy?._id,
      metadata: {
        targetUserId: targetUser?._id,
        targetUserEmail: targetUser?.email,
      },
    });
  }

  static async access(action, user, level = 'warning', details = '') {
    return this.log({
      type: 'ACCESS',
      level,
      action,
      details,
      user: user?.email,
      userId: user?._id,
    });
  }

  static async error(action, error, user = null, details = '') {
    return this.log({
      type: 'ERROR',
      level: 'error',
      action,
      details: details || error.message,
      user: user?.email,
      userId: user?._id,
      metadata: {
        stack: error.stack,
        name: error.name,
      },
    });
  }

  static async system(action, level = 'info', details = '') {
    return this.log({
      type: 'SYSTEM',
      level,
      action,
      details,
    });
  }
}

export default Logger;
