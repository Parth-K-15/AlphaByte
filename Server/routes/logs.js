import express from 'express';
import mongoose from 'mongoose';
import Log from '../models/Log.js';
import { verifyToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/logs
// @desc    Get all logs (admin only)
// @access  Private/Admin
router.get('/', verifyToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const {
      type,
      level,
      eventId,
      participantName,
      actionType,
      entityType,
      actorType,
      severity,
      startDate,
      endDate,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      searchTerm,
    } = req.query;

    // Build query
    const query = {};

    // Legacy filters
    if (type) query.type = type;
    if (level) query.level = level;

    // New structured filters
    if (eventId) query.eventId = eventId;
    if (actionType) query.actionType = actionType;
    if (entityType) query.entityType = entityType;
    if (actorType) query.actorType = actorType;
    if (severity) query.severity = severity;

    // Participant search (name or email)
    if (participantName) {
      query.$or = [
        { participantName: { $regex: participantName, $options: 'i' } },
        { participantEmail: { $regex: participantName, $options: 'i' } },
      ];
    }

    // General search term
    if (searchTerm) {
      query.$or = [
        { action: { $regex: searchTerm, $options: 'i' } },
        { details: { $regex: searchTerm, $options: 'i' } },
        { eventName: { $regex: searchTerm, $options: 'i' } },
        { participantName: { $regex: searchTerm, $options: 'i' } },
        { actorName: { $regex: searchTerm, $options: 'i' } },
        { user: { $regex: searchTerm, $options: 'i' } },
      ];
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Fetch logs with pagination
    const [logs, total] = await Promise.all([
      Log.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('eventId', 'title date')
        .populate('participantId', 'name email')
        .lean(),
      Log.countDocuments(query),
    ]);

    // Get unique values for filter dropdowns
    const [uniqueEvents, uniqueActionTypes, uniqueEntityTypes, uniqueActorTypes] = await Promise.all([
      Log.distinct('eventId').then(ids => 
        mongoose.model('Event').find({ _id: { $in: ids } }).select('_id title').lean()
      ),
      Log.distinct('actionType'),
      Log.distinct('entityType'),
      Log.distinct('actorType'),
    ]);

    res.json({
      success: true,
      logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
      filterOptions: {
        events: uniqueEvents || [],
        actionTypes: uniqueActionTypes || [],
        entityTypes: uniqueEntityTypes || [],
        actorTypes: uniqueActorTypes || [],
        severities: ['INFO', 'WARNING', 'CRITICAL'],
        levels: ['info', 'success', 'warning', 'error'],
        types: ['AUTH', 'EVENT', 'USER', 'SYSTEM', 'ACCESS', 'ERROR', 'MEMBER'],
      },
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
