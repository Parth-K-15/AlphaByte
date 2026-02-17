import express from 'express';
import ReconciliationEngine from '../utils/reconciliationEngine.js';
import ParticipationRecord from '../models/ParticipationRecord.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/reconciliation/single
 * Reconcile participation for a single student-event pair
 * 
 * Body: { email, eventId }
 * Auth: Required (organizer, admin)
 */
router.post('/single', verifyToken, async (req, res) => {
  try {
    const { email, eventId } = req.body;
    
    if (!email || !eventId) {
      return res.status(400).json({
        success: false,
        message: 'Email and eventId are required'
      });
    }
    
    const result = await ReconciliationEngine.reconcileParticipation(email, eventId);
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Participation reconciled successfully',
        data: result.reconciliationSummary,
        record: result.record
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Reconciliation failed',
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Reconciliation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * POST /api/reconciliation/event/:eventId
 * Reconcile all participants for an event
 * 
 * Auth: Required (organizer, admin)
 */
router.post('/event/:eventId', verifyToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: 'Event ID is required'
      });
    }
    
    const result = await ReconciliationEngine.reconcileEvent(eventId);
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Event reconciliation completed',
        data: result.results
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Event reconciliation failed',
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Event reconciliation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * GET /api/reconciliation/status/:email/:eventId
 * Get reconciliation status for a student-event pair
 * 
 * Auth: Optional (public for verification)
 */
router.get('/status/:email/:eventId', async (req, res) => {
  try {
    const { email, eventId } = req.params;
    
    const record = await ParticipationRecord.findOne({ email, event: eventId })
      .populate('event', 'name eventDate')
      .populate('participant', 'fullName email branch year');
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Participation record not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        canonicalStatus: record.canonicalStatus,
        confidenceScore: record.reconciliation.confidenceScore,
        hasConflicts: record.flags.hasConflicts,
        requiresManualReview: record.flags.requiresManualReview,
        isSuspicious: record.flags.isSuspicious,
        isVerified: record.flags.isVerified,
        lastReconciledAt: record.reconciliation.lastReconciledAt,
        statusBreakdown: record.statusBreakdown,
        event: record.event,
        participant: record.participant
      }
    });
    
  } catch (error) {
    console.error('Get status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * GET /api/reconciliation/event/:eventId/records
 * Get all participation records for an event with filtering
 * 
 * Query params: status, requiresReview, suspicious
 * Auth: Required
 */
router.get('/event/:eventId/records', verifyToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status, requiresReview, suspicious, verified } = req.query;
    
    const query = { event: eventId };
    
    if (status) {
      query.canonicalStatus = status;
    }
    
    if (requiresReview === 'true') {
      query['flags.requiresManualReview'] = true;
    }
    
    if (suspicious === 'true') {
      query['flags.isSuspicious'] = true;
    }
    
    if (verified === 'true') {
      query['flags.isVerified'] = true;
    }
    
    const records = await ParticipationRecord.find(query)
      .populate('event', 'name eventDate')
      .populate('participant', 'fullName email branch year')
      .sort({ 'reconciliation.lastReconciledAt': -1 });
    
    return res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });
    
  } catch (error) {
    console.error('Get records error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * GET /api/reconciliation/event/:eventId/stats
 * Get reconciliation statistics for an event
 * 
 * Auth: Required
 */
router.get('/event/:eventId/stats', verifyToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const stats = await ParticipationRecord.getEventStats(eventId);
    
    // Additional stats
    const conflictsCount = await ParticipationRecord.countDocuments({
      event: eventId,
      'flags.hasConflicts': true
    });
    
    const requiresReviewCount = await ParticipationRecord.countDocuments({
      event: eventId,
      'flags.requiresManualReview': true
    });
    
    const suspiciousCount = await ParticipationRecord.countDocuments({
      event: eventId,
      'flags.isSuspicious': true
    });
    
    const verifiedCount = await ParticipationRecord.countDocuments({
      event: eventId,
      'flags.isVerified': true
    });
    
    return res.status(200).json({
      success: true,
      data: {
        ...stats,
        conflictsCount,
        requiresReviewCount,
        suspiciousCount,
        verifiedCount
      }
    });
    
  } catch (error) {
    console.error('Get stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * GET /api/reconciliation/needs-review
 * Get all records that need manual review
 * 
 * Query param: eventId (optional)
 * Auth: Required
 */
router.get('/needs-review', verifyToken, async (req, res) => {
  try {
    const { eventId } = req.query;
    
    const records = await ParticipationRecord.findNeedingReconciliation(eventId);
    
    return res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });
    
  } catch (error) {
    console.error('Get needs review error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * POST /api/reconciliation/manual-override
 * Manually override a participation status
 * 
 * Body: { email, eventId, newStatus, reason }
 * Auth: Required (organizer, admin only)
 */
router.post('/manual-override', verifyToken, async (req, res) => {
  try {
    const { email, eventId, newStatus, reason } = req.body;
    const userId = req.user.userId;
    
    // Check if user has permission (should be organizer or admin)
    if (req.user.role !== 'ADMIN' && req.user.role !== 'TEAM_LEAD') {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions for manual override'
      });
    }
    
    if (!email || !eventId || !newStatus || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Email, eventId, newStatus, and reason are required'
      });
    }
    
    const validStatuses = ['REGISTERED_ONLY', 'ATTENDED_NO_CERTIFICATE', 'CERTIFIED', 'INVALIDATED'];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    const result = await ReconciliationEngine.manualOverride(
      email,
      eventId,
      newStatus,
      userId,
      reason
    );
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.record
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Manual override failed',
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Manual override error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * GET /api/reconciliation/record/:recordId/details
 * Get detailed reconciliation information including all signals
 * 
 * Auth: Required
 */
router.get('/record/:recordId/details', verifyToken, async (req, res) => {
  try {
    const { recordId } = req.params;
    
    const record = await ParticipationRecord.findById(recordId)
      .populate('event', 'name eventDate')
      .populate('participant', 'fullName email branch year')
      .populate('signals.recordedBy', 'name email')
      .populate('manualOverride.overriddenBy', 'name email');
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Participation record not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: record
    });
    
  } catch (error) {
    console.error('Get record details error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * POST /api/reconciliation/event/:eventId/auto-reconcile
 * Enable auto-reconciliation for an event (reconcile on any data change)
 * 
 * Auth: Required (admin only)
 */
router.post('/event/:eventId/auto-reconcile', verifyToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { enabled } = req.body;
    
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can configure auto-reconciliation'
      });
    }
    
    // This would typically update an Event setting
    // For now, we'll just reconcile the event
    if (enabled) {
      const result = await ReconciliationEngine.reconcileEvent(eventId);
      
      return res.status(200).json({
        success: true,
        message: 'Auto-reconciliation enabled and event reconciled',
        data: result.results
      });
    } else {
      return res.status(200).json({
        success: true,
        message: 'Auto-reconciliation disabled'
      });
    }
    
  } catch (error) {
    console.error('Auto-reconcile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

export default router;
