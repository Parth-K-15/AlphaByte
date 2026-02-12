import express from 'express';
import Log from '../models/Log.js';
import { verifyToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/logs
// @desc    Get all logs (admin only)
// @access  Private/Admin
router.get('/', verifyToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const { type, level, startDate, endDate, limit = 100 } = req.query;

    // Build query
    const query = {};

    if (type) query.type = type;
    if (level) query.level = level;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Fetch logs with pagination
    const logs = await Log.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      logs,
      count: logs.length,
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching logs',
      error: error.message,
    });
  }
});

// @route   POST /api/logs
// @desc    Create a new log entry
// @access  Private
router.post('/', verifyToken, async (req, res) => {
  try {
    const { type, level, action, details, eventId, eventName, metadata } = req.body;

    const log = await Log.create({
      type,
      level,
      action,
      details,
      user: req.user.email,
      userId: req.user._id,
      eventId,
      eventName,
      metadata,
    });

    res.status(201).json({
      success: true,
      log,
    });
  } catch (error) {
    console.error('Error creating log:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating log',
      error: error.message,
    });
  }
});

// @route   DELETE /api/logs/clear
// @desc    Clear old logs (admin only)
// @access  Private/Admin
router.delete('/clear', verifyToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const { olderThan } = req.query; // Date string

    if (!olderThan) {
      return res.status(400).json({
        success: false,
        message: 'Please provide olderThan date parameter',
      });
    }

    const result = await Log.deleteMany({
      createdAt: { $lt: new Date(olderThan) },
    });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} logs`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Error clearing logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing logs',
      error: error.message,
    });
  }
});

export default router;
