import express from 'express';
import Event from '../models/Event.js';
import User from '../models/User.js';
import Participant from '../models/Participant.js';
import Attendance from '../models/Attendance.js';
import Certificate from '../models/Certificate.js';
import CertificateRequest from '../models/CertificateRequest.js';
import Communication from '../models/Communication.js';
import EventUpdate from '../models/EventUpdate.js';
import SpeakerAuth from '../models/SpeakerAuth.js';
import Session from '../models/Session.js';
import SpeakerReview from '../models/SpeakerReview.js';
import SpeakerRequest from '../models/SpeakerRequest.js';
import Log from '../models/Log.js';
import IdempotencyKey from '../models/IdempotencyKey.js';
import mongoose from 'mongoose';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { sendBulkEmails, testEmailConnection, sendCertificateEmail } from '../utils/emailService.js';
import certificateGenerator from '../utils/certificateGenerator.js';
import activeSessions from '../utils/sessionStore.js';
import { getRecommendedSpeakers } from '../utils/speakerRecommendation.js';
import { verifyToken, isOrganizer } from '../middleware/auth.js';
import { cache } from '../middleware/cache.js';
import { CacheKeys, CacheTTL } from '../utils/cacheKeys.js';
import { isEncryptedPii, maybeDecryptPii, maybeEncryptPii, maskPhone } from '../utils/piiCrypto.js';
import { auditPiiAccess } from '../utils/piiAudit.js';

const router = express.Router();
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id) && /^[a-fA-F0-9]{24}$/.test(id);

const buildRequestHash = (payload) => {
  try {
    return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  } catch {
    return null;
  }
};

const getOrCreateIdempotencyRecord = async ({ scope, key, requestHash, ttlMs }) => {
  const existing = await IdempotencyKey.findOne({ scope, key }).lean();
  if (existing?.status === 'COMPLETED') {
    return { kind: 'HIT', record: existing };
  }

  const expiresAt = new Date(Date.now() + ttlMs);

  try {
    const created = await IdempotencyKey.create({
      scope,
      key,
      requestHash,
      status: 'IN_PROGRESS',
      expiresAt,
    });
    return { kind: 'MISS', record: created.toObject() };
  } catch (error) {
    if (error?.code === 11000) {
      const concurrent = await IdempotencyKey.findOne({ scope, key }).lean();
      if (concurrent?.status === 'COMPLETED') {
        return { kind: 'HIT', record: concurrent };
      }
      return { kind: 'IN_PROGRESS', record: concurrent || null };
    }
    throw error;
  }
};

const finalizeIdempotency = async ({ scope, key, statusCode, responseBody }) => {
  await IdempotencyKey.updateOne(
    { scope, key },
    {
      $set: {
        status: 'COMPLETED',
        statusCode,
        responseBody,
        completedAt: new Date(),
      },
    },
  );
};

// ─── Apply verifyToken + isOrganizer to ALL organizer routes ───
router.use(verifyToken, isOrganizer);

// ─── Permission helper: checks if the authenticated user has a specific permission for an event ───
// Team Leads (event.teamLead) get ALL permissions automatically.
// Event Staff get only what's explicitly granted in their teamMembers.permissions.
// Also checks time-bound access: if startTime is in the future or endTime is in the past, deny.
async function checkPermission(req, eventId, permissionKey) {
  const userId = req.user._id.toString();

  // ADMIN gets everything
  if (req.user.role === 'ADMIN') return { allowed: true };

  if (!eventId || !isValidObjectId(eventId)) {
    return { allowed: false, status: 400, message: 'Invalid event ID' };
  }

  const event = await Event.findById(eventId);
  if (!event) {
    return { allowed: false, status: 404, message: 'Event not found' };
  }

  // Team Lead of the event gets all permissions
  if (event.teamLead && event.teamLead.toString() === userId) {
    return { allowed: true, event };
  }

  // Check if TEAM_LEAD role in teamMembers array
  if (req.user.role === 'TEAM_LEAD') {
    const teamLeadEntry = event.teamMembers?.find(
      m => m.user.toString() === userId && m.role === 'TEAM_LEAD' && m.status === 'active'
    );
    if (teamLeadEntry) {
      return { allowed: true, event };
    }
  }

  // For EVENT_STAFF, find their membership and check specific permission
  const membership = event.teamMembers?.find(
    m => m.user.toString() === userId && m.status === 'active'
  );

  if (!membership) {
    return { allowed: false, status: 403, message: 'You are not assigned to this event' };
  }

  // Check time bounds
  const now = new Date();
  if (membership.startTime && new Date(membership.startTime) > now) {
    return { allowed: false, status: 403, message: 'Your access to this event has not started yet' };
  }
  if (membership.endTime && new Date(membership.endTime) < now) {
    return { allowed: false, status: 403, message: 'Your access to this event has expired' };
  }

  // If no specific permission is required (just event membership), allow
  if (!permissionKey) {
    return { allowed: true, event, membership };
  }

  // Check the specific permission
  if (!membership.permissions || !membership.permissions[permissionKey]) {
    return { allowed: false, status: 403, message: `Access denied. You do not have '${permissionKey}' permission for this event.` };
  }

  return { allowed: true, event, membership };
}

// ─── GET /my-permissions/:eventId — Return the current user's permissions for an event ───
router.get('/my-permissions/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id.toString();

    if (!isValidObjectId(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Team Lead gets all permissions
    const isTeamLead = (event.teamLead && event.teamLead.toString() === userId) ||
      event.teamMembers?.some(m => m.user.toString() === userId && m.role === 'TEAM_LEAD' && m.status === 'active');

    if (req.user.role === 'ADMIN' || isTeamLead) {
      return res.json({
        success: true,
        data: {
          isTeamLead: true,
          permissions: {
            canViewParticipants: true,
            canManageAttendance: true,
            canSendEmails: true,
            canGenerateCertificates: true,
            canEditEvent: true,
          },
          canManageTeam: true,
          canManageSpeakers: true,
          canViewLogs: true,
        }
      });
    }

    // Find membership
    const membership = event.teamMembers?.find(
      m => m.user.toString() === userId && m.status === 'active'
    );

    if (!membership) {
      return res.status(403).json({ success: false, message: 'Not assigned to this event' });
    }

    // Check time bounds
    const now = new Date();
    const isTimeBound = (membership.startTime && new Date(membership.startTime) > now) ||
      (membership.endTime && new Date(membership.endTime) < now);

    if (isTimeBound) {
      return res.json({
        success: true,
        data: {
          isTeamLead: false,
          expired: true,
          permissions: {
            canViewParticipants: false,
            canManageAttendance: false,
            canSendEmails: false,
            canGenerateCertificates: false,
            canEditEvent: false,
          },
          canManageTeam: false,
          canManageSpeakers: false,
          canViewLogs: false,
        }
      });
    }

    return res.json({
      success: true,
      data: {
        isTeamLead: false,
        permissions: membership.permissions || {},
        canManageTeam: false,
        canManageSpeakers: membership.permissions?.canEditEvent || false,
        canViewLogs: true,
      }
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Test email configuration endpoint
router.get('/email/test', async (req, res) => {
  try {
    console.log('🔍 [Email Test] Checking email configuration...');

    const config = {
      emailUser: process.env.EMAIL_USER,
      emailPassword: process.env.EMAIL_PASSWORD ? '********' : undefined,
      emailFromName: process.env.EMAIL_FROM_NAME || 'Event Management System',
      configured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD)
    };

    console.log('📧 [Email Test] Configuration:', config);

    if (!config.configured) {
      return res.json({
        success: false,
        message: 'Email not configured',
        config,
        instructions: 'Add EMAIL_USER and EMAIL_PASSWORD to your .env file'
      });
    }

    const testResult = await testEmailConnection();

    res.json({
      success: testResult.success,
      message: testResult.success ? 'Email configuration is valid' : `Email configuration error: ${testResult.error}`,
      config,
      testResult
    });
  } catch (error) {
    console.error('❌ [Email Test] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error testing email configuration',
      error: error.message
    });
  }
});

// Get email sending logs for an event
router.get('/email/logs/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    // Permission check: canSendEmails
    const perm = await checkPermission(req, eventId, 'canSendEmails');
    if (!perm.allowed) return res.status(perm.status).json({ success: false, message: perm.message });

    if (!isValidObjectId(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID' });
    }

    // Get all certificates with email sending details
    const certificates = await Certificate.find({ event: eventId })
      .populate('participant', 'name email')
      .sort({ sentAt: -1, issuedAt: -1 })
      .select('participant status sentAt issuedAt certificateId cloudinaryUrl');

    const logs = certificates.map(cert => ({
      certificateId: cert.certificateId,
      participant: cert.participant?.name || 'Unknown',
      email: cert.participant?.email || 'N/A',
      status: cert.status,
      generatedAt: cert.issuedAt,
      sentAt: cert.sentAt || null,
      cloudinaryUrl: cert.cloudinaryUrl,
      timeSinceGeneration: cert.issuedAt ? Math.floor((Date.now() - new Date(cert.issuedAt)) / 1000 / 60) : null, // minutes
      timeSinceSent: cert.sentAt ? Math.floor((Date.now() - new Date(cert.sentAt)) / 1000 / 60) : null // minutes
    }));

    const summary = {
      total: certificates.length,
      sent: logs.filter(l => l.status === 'SENT').length,
      pending: logs.filter(l => l.status === 'GENERATED').length,
      failed: logs.filter(l => l.status === 'FAILED').length
    };

    res.json({
      success: true,
      data: logs,
      summary
    });
  } catch (error) {
    console.error('Error fetching email logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching email logs',
      error: error.message
    });
  }
});


router.get('/dashboard', async (req, res) => {
  try {
    const organizerId = req.query.organizerId;
    let eventQuery = organizerId ? { $or: [{ teamLead: organizerId }, { 'teamMembers.user': organizerId }] } : {};
    const events = await Event.find(eventQuery);
    const eventIds = events.map(e => e._id);
    const totalEvents = events.length;
    const activeEvents = events.filter(e => e.status === 'PUBLISHED' || e.status === 'ONGOING').length;
    const completedEvents = events.filter(e => e.status === 'COMPLETED').length;
    const upcomingEvents = events.filter(e => e.status === 'DRAFT' || e.status === 'PUBLISHED').length;
    const totalParticipants = await Participant.countDocuments({ event: { $in: eventIds } });
    const totalAttendance = await Attendance.countDocuments({ event: { $in: eventIds } });
    const totalCertificates = await Certificate.countDocuments({ event: { $in: eventIds } });
    const recentEvents = await Event.find(eventQuery).sort({ createdAt: -1 }).limit(5).populate('teamLead', 'name email');
    res.json({ success: true, data: { stats: { totalEvents, activeEvents, completedEvents, upcomingEvents, totalParticipants, totalAttendance, totalCertificates }, recentEvents } });
  } catch (error) {
    console.error('Error fetching organizer dashboard:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/events', async (req, res) => {
  try {
    const organizerId = req.query.organizerId;

    // Security: Require organizerId to prevent returning all events
    if (!organizerId) {
      console.warn('⚠️ [Events] No organizerId provided in query');
      return res.status(400).json({
        success: false,
        message: 'Organizer ID is required'
      });
    }

    console.log('🔍 [Events] Fetching events for organizer:', organizerId);

    // Find events where user is teamLead OR a teamMember
    let query = { $or: [{ teamLead: organizerId }, { 'teamMembers.user': organizerId }] };
    const events = await Event.find(query).populate('teamLead', 'name email').populate('teamMembers', 'name email').sort({ createdAt: -1 });

    console.log(`✅ [Events] Found ${events.length} events for organizer ${organizerId}`);

    const eventsWithCounts = await Promise.all(events.map(async (event) => {
      const participantCount = await Participant.countDocuments({ event: event._id });
      const attendanceCount = await Attendance.countDocuments({ event: event._id });
      const certificateCount = await Certificate.countDocuments({ event: event._id });
      return { ...event.toObject(), participantCount, attendanceCount, certificateCount };
    }));
    res.json({ success: true, count: eventsWithCounts.length, data: eventsWithCounts });
  } catch (error) {
    console.error('Error fetching assigned events:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/events/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('teamLead', 'name email phone').populate('teamMembers', 'name email phone').populate('createdBy', 'name email');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    const participantCount = await Participant.countDocuments({ event: event._id });
    const attendanceCount = await Attendance.countDocuments({ event: event._id });
    const certificateCount = await Certificate.countDocuments({ event: event._id });

    const eventObj = event.toObject();
    if (eventObj.teamLead) {
      eventObj.teamLead.phone = maskPhone(maybeDecryptPii(eventObj.teamLead.phone));
    }
    if (Array.isArray(eventObj.teamMembers)) {
      eventObj.teamMembers = eventObj.teamMembers.map((member) => ({
        ...member,
        phone: maskPhone(maybeDecryptPii(member.phone)),
      }));
    }

    res.json({ success: true, data: { ...eventObj, participantCount, attendanceCount, certificateCount } });
  } catch (error) {
    console.error('Error fetching event details:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/events/:id', async (req, res) => {
  try {
    // Permission check: canEditEvent
    const perm = await checkPermission(req, req.params.id, 'canEditEvent');
    if (!perm.allowed) return res.status(perm.status).json({ success: false, message: perm.message });

    const { description, location, rules, guidelines, contactDetails, venueInstructions, organizerId } = req.body;
    const oldEvent = await Event.findById(req.params.id);
    if (!oldEvent) return res.status(404).json({ success: false, message: 'Event not found' });

    const event = await Event.findByIdAndUpdate(req.params.id, { description, location, rules, guidelines, contactDetails, venueInstructions, updatedAt: Date.now() }, { new: true, runValidators: true });

    // Log event update
    const organizer = (organizerId && isValidObjectId(organizerId)) ? await User.findById(organizerId) : null;
    await Log.create({
      eventId: event._id,
      eventName: event.title || event.name,
      actionType: 'EVENT_UPDATED',
      action: 'Event details updated by organizer',
      details: `Updated event information (description, location, rules, etc.)`,
      entityType: 'EVENT',
      actorType: organizer ? (organizer.role === 'ADMIN' ? 'ADMIN' : 'ORGANIZER') : 'SYSTEM',
      actorId: organizer?._id,
      actorName: organizer?.name || 'Organizer',
      actorEmail: organizer?.email,
      severity: 'INFO',
      oldState: { description: oldEvent.description, location: oldEvent.location },
      newState: { description, location }
    });

    res.json({ success: true, data: event });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Update event lifecycle status (organizer)
// @route   PUT /api/organizer/events/:id/lifecycle
router.put('/events/:id/lifecycle', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Permission check: canEditEvent
    const perm = await checkPermission(req, id, 'canEditEvent');
    if (!perm.allowed) return res.status(perm.status).json({ success: false, message: perm.message });

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format'
      });
    }

    const validStatuses = ['draft', 'upcoming', 'ongoing', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    // Find the event and verify it's assigned to this organizer
    const event = await Event.findById(id).populate('teamLead', 'name email');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Update the event status
    event.status = status;
    await event.save();

    // Get participant count
    const participantCount = await Participant.countDocuments({ event: event._id });

    res.json({
      success: true,
      message: 'Event status updated successfully',
      data: {
        ...event.toObject(),
        participantCount
      }
    });
  } catch (error) {
    console.error('Error updating event lifecycle:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating event lifecycle',
      error: error.message
    });
  }
});

// Participants routes
router.get('/participants/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    // Permission check: canViewParticipants
    const perm = await checkPermission(req, eventId, 'canViewParticipants');
    if (!perm.allowed) return res.status(perm.status).json({ success: false, message: perm.message });

    if (!isValidObjectId(eventId)) return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    const { filter, search } = req.query;
    let query = { event: eventId };
    if (filter === 'registered') query.registrationStatus = 'CONFIRMED';
    else if (filter === 'attended') query.attendanceStatus = 'ATTENDED';
    else if (filter === 'certified') query.certificateStatus = 'SENT';
    let participants = await Participant.find(query).populate('team').sort({ createdAt: -1 });
    if (search) {
      const searchLower = search.toLowerCase();
      participants = participants.filter(p => p.name?.toLowerCase().includes(searchLower) || p.email?.toLowerCase().includes(searchLower));
    }
    const enrichedParticipants = await Promise.all(participants.map(async (p) => {
      const attendance = await Attendance.findOne({ event: eventId, participant: p._id });
      const certificate = await Certificate.findOne({ event: eventId, participant: p._id });
      return {
        ...p.toObject(),
        phone: maskPhone(maybeDecryptPii(p.phone)),
        hasAttended: !!attendance || p.attendanceStatus === 'ATTENDED',
        attendedAt: attendance?.scannedAt || p.updatedAt,
        attendanceStatus: attendance ? 'ATTENDED' : (p.attendanceStatus || 'ABSENT'),
        hasCertificate: !!certificate,
        certificateStatus: certificate?.status,
        teamName: p.team?.teamName || null,
        teamRole: p.isCaptain ? 'Captain' : (p.memberRole || (p.team ? 'Member' : null))
      };
    }));
    res.json({ success: true, count: enrichedParticipants.length, data: enrichedParticipants });
  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Privileged PII fetch (requires reason)
// GET /api/organizer/participants/:eventId/:participantId/pii?reason=...
router.get('/participants/:eventId/:participantId/pii', async (req, res) => {
  try {
    const { eventId, participantId } = req.params;
    const reason = (req.query?.reason || '').toString().trim();

    // Permission check: canViewParticipants
    const perm = await checkPermission(req, eventId, 'canViewParticipants');
    if (!perm.allowed) return res.status(perm.status).json({ success: false, message: perm.message });

    // Only ADMIN / TEAM_LEAD can decrypt PII
    if (!['ADMIN', 'TEAM_LEAD'].includes(req.user?.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Reason is required to view PII' });
    }

    if (!isValidObjectId(eventId) || !isValidObjectId(participantId)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    const participant = await Participant.findOne({ _id: participantId, event: eventId });
    if (!participant) {
      return res.status(404).json({ success: false, message: 'Participant not found' });
    }

    const phone = maybeDecryptPii(participant.phone);
    if (isEncryptedPii(phone)) {
      return res.status(503).json({
        success: false,
        message: 'PII decryption unavailable (missing/invalid encryption key)'
      });
    }

    await auditPiiAccess({
      req,
      entityType: 'USER',
      targetParticipantId: participant._id,
      fields: ['phone'],
      reason,
    });

    return res.json({
      success: true,
      data: {
        participantId: participant._id,
        eventId,
        phone,
      },
    });
  } catch (error) {
    console.error('Error fetching participant PII:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/participants/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    // Permission check: canViewParticipants (covers add/manage)
    const perm = await checkPermission(req, eventId, 'canViewParticipants');
    if (!perm.allowed) return res.status(perm.status).json({ success: false, message: perm.message });

    if (!isValidObjectId(eventId)) return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    const { name, email, phone, college, year, branch, organizerId } = req.body;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    const existing = await Participant.findOne({ email, event: eventId });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered for this event' });
    const participant = await Participant.create({ name, fullName: name, email, phone, college, year, branch, event: eventId, registrationStatus: 'CONFIRMED', registrationType: 'WALK_IN' });

    // Log participant addition
    const organizer = (organizerId && isValidObjectId(organizerId)) ? await User.findById(organizerId) : null;
    await Log.create({
      eventId: event._id,
      eventName: event.title || event.name,
      participantId: participant._id,
      participantName: participant.name,
      participantEmail: participant.email,
      actionType: 'PARTICIPANT_ADDED',
      action: 'Participant added by organizer',
      details: `${participant.name} (${participant.email}) added as walk-in participant`,
      entityType: 'PARTICIPATION',
      actorType: organizer ? (organizer.role === 'ADMIN' ? 'ADMIN' : 'ORGANIZER') : 'SYSTEM',
      actorId: organizer?._id,
      actorName: organizer?.name || 'Organizer',
      actorEmail: organizer?.email,
      severity: 'INFO',
      newState: { name, email, registrationType: 'WALK_IN', registrationStatus: 'CONFIRMED' }
    });

    const participantObj = participant.toObject();
    participantObj.phone = maskPhone(maybeDecryptPii(participantObj.phone));
    res.status(201).json({ success: true, message: 'Participant added successfully', data: participantObj });
  } catch (error) {
    console.error('Error adding participant:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/participants/:eventId/:participantId', async (req, res) => {
  try {
    const { eventId, participantId } = req.params;
    // Permission check: canViewParticipants (covers edit)
    const perm = await checkPermission(req, eventId, 'canViewParticipants');
    if (!perm.allowed) return res.status(perm.status).json({ success: false, message: perm.message });

    if (!isValidObjectId(eventId) || !isValidObjectId(participantId)) return res.status(400).json({ success: false, message: 'Invalid ID format' });
    const { name, email, phone, organizerId } = req.body;
    const oldParticipant = await Participant.findOne({ _id: participantId, event: eventId });
    if (!oldParticipant) return res.status(404).json({ success: false, message: 'Participant not found' });

    const updateData = {};
    if (email !== undefined) {
      updateData.email = email;
    }
    if (phone !== undefined) {
      updateData.phone = maybeEncryptPii(phone);
    }
    if (name) { updateData.name = name; updateData.fullName = name; }
    const participant = await Participant.findOneAndUpdate({ _id: participantId, event: eventId }, updateData, { new: true, runValidators: true });

    // Log participant update
    const event = await Event.findById(eventId);
    const organizer = (organizerId && isValidObjectId(organizerId)) ? await User.findById(organizerId) : null;
    await Log.create({
      eventId: event._id,
      eventName: event.title || event.name,
      participantId: participant._id,
      participantName: participant.name,
      participantEmail: participant.email,
      actionType: 'PARTICIPANT_UPDATED',
      action: 'Participant information updated',
      details: `Updated participant details for ${participant.name}`,
      entityType: 'PARTICIPATION',
      actorType: organizer ? (organizer.role === 'ADMIN' ? 'ADMIN' : 'ORGANIZER') : 'SYSTEM',
      actorId: organizer?._id,
      actorName: organizer?.name || 'Organizer',
      actorEmail: organizer?.email,
      severity: 'INFO',
      oldState: { name: oldParticipant.name, email: oldParticipant.email },
      newState: { name: participant.name, email: participant.email }
    });

    const participantObj = participant.toObject();
    participantObj.phone = maskPhone(maybeDecryptPii(participantObj.phone));
    res.json({ success: true, message: 'Participant updated successfully', data: participantObj });
  } catch (error) {
    console.error('Error updating participant:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/participants/:eventId/:participantId', async (req, res) => {
  try {
    const { eventId, participantId } = req.params;
    const { organizerId } = req.body;
    // Permission check: canViewParticipants (covers remove)
    const perm = await checkPermission(req, eventId, 'canViewParticipants');
    if (!perm.allowed) return res.status(perm.status).json({ success: false, message: perm.message });

    if (!isValidObjectId(eventId) || !isValidObjectId(participantId)) return res.status(400).json({ success: false, message: 'Invalid ID format' });
    const participant = await Participant.findOne({ _id: participantId, event: eventId });
    if (!participant) return res.status(404).json({ success: false, message: 'Participant not found' });

    const event = await Event.findById(eventId);
    const deletedParticipant = await Participant.findOneAndDelete({ _id: participantId, event: eventId });
    await Attendance.deleteOne({ event: eventId, participant: participantId });
    await Certificate.deleteOne({ event: eventId, participant: participantId });

    // Log participant removal
    const organizer = (organizerId && isValidObjectId(organizerId)) ? await User.findById(organizerId) : null;
    await Log.create({
      eventId: event._id,
      eventName: event.title || event.name,
      participantId: participant._id,
      participantName: participant.name,
      participantEmail: participant.email,
      actionType: 'PARTICIPANT_REMOVED',
      action: 'Participant removed from event',
      details: `${participant.name} (${participant.email}) removed from event. Associated attendance and certificates deleted.`,
      entityType: 'PARTICIPATION',
      actorType: organizer ? (organizer.role === 'ADMIN' ? 'ADMIN' : 'ORGANIZER') : 'SYSTEM',
      actorId: organizer?._id,
      actorName: organizer?.name || 'Organizer',
      actorEmail: organizer?.email,
      severity: 'WARNING',
      oldState: { name: participant.name, email: participant.email, registrationStatus: participant.registrationStatus }
    });

    res.json({ success: true, message: 'Participant removed successfully' });
  } catch (error) {
    console.error('Error removing participant:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Attendance routes
router.post('/attendance/:eventId/generate-qr', async (req, res) => {
  try {
    const { eventId } = req.params;
    // Permission check: canManageAttendance
    const perm = await checkPermission(req, eventId, 'canManageAttendance');
    if (!perm.allowed) return res.status(perm.status).json({ success: false, message: perm.message });

    if (!isValidObjectId(eventId)) return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    const organizerId = req.body.organizerId || 'system';
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    const sessionId = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    const expiresAt = timestamp + (5 * 60 * 1000);

    // Build session data with optional geo-fence
    const sessionData = { eventId, organizerId, createdAt: timestamp, expiresAt };

    // Geo-fence: organizer can optionally enable location-based attendance
    const { geoFenceEnabled, geoLatitude, geoLongitude, geoRadius } = req.body;
    if (geoFenceEnabled && geoLatitude != null && geoLongitude != null) {
      sessionData.geoFenceEnabled = true;
      sessionData.geoLatitude = parseFloat(geoLatitude);
      sessionData.geoLongitude = parseFloat(geoLongitude);
      sessionData.geoRadiusMeters = parseInt(geoRadius) || 200;
    }

    await activeSessions.set(sessionId, sessionData);
    const qrData = { eventId, sessionId, timestamp, expiresAt };

    // Log QR generation
    console.log('🎯 [QR Generation] Creating log for QR generation...');
    const organizer = (organizerId && isValidObjectId(organizerId)) ? await User.findById(organizerId) : null;
    await Log.create({
      eventId: event._id,
      eventName: event.title || event.name,
      actionType: 'QR_GENERATED',
      action: 'Attendance QR code generated',
      details: `Attendance QR code generated for event. Expires in 5 minutes.`,
      entityType: 'ATTENDANCE',
      actorType: organizer ? (organizer.role === 'ADMIN' ? 'ADMIN' : 'ORGANIZER') : 'SYSTEM',
      actorId: organizer?._id,
      actorName: organizer?.name || 'System',
      actorEmail: organizer?.email,
      severity: 'INFO',
      newState: { sessionId, expiresAt, expiresIn: 300 }
    });
    console.log('✅ [QR Generation] Log created successfully');

    res.json({ success: true, data: { qrData: JSON.stringify(qrData), sessionId, expiresAt, expiresIn: 300 } });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/attendance/mark', async (req, res) => {
  try {
    const { eventId, sessionId, participantId, organizerId } = req.body;
    // Permission check: canManageAttendance
    const perm = await checkPermission(req, eventId, 'canManageAttendance');
    if (!perm.allowed) return res.status(perm.status).json({ success: false, message: perm.message });

    const session = await activeSessions.get(sessionId);
    if (!session) return res.status(400).json({ success: false, message: 'Invalid or expired QR code' });
    if (Date.now() > session.expiresAt) { await activeSessions.delete(sessionId); return res.status(400).json({ success: false, message: 'QR code has expired' }); }
    if (session.eventId !== eventId) return res.status(400).json({ success: false, message: 'QR code does not match event' });
    const participant = await Participant.findOne({ _id: participantId, event: eventId });
    if (!participant) return res.status(404).json({ success: false, message: 'Participant not registered for this event' });
    const existingAttendance = await Attendance.findOne({ event: eventId, participant: participantId });
    if (existingAttendance) return res.status(400).json({ success: false, message: 'Attendance already marked' });
    const attendance = await Attendance.create({ event: eventId, participant: participantId, sessionId, markedBy: organizerId || session.organizerId });
    await Participant.findByIdAndUpdate(participantId, { attendanceStatus: 'ATTENDED', attendedAt: Date.now() });

    // Create log entry for attendance
    const event = await Event.findById(eventId);
    await Log.create({
      eventId,
      eventName: event?.title || 'Unknown Event',
      participantId,
      participantName: participant.name,
      participantEmail: participant.email,
      actionType: 'ATTENDANCE_RECORDED',
      entityType: 'ATTENDANCE',
      action: 'Attendance marked via QR scan',
      details: `${participant.name} marked present via QR code scan`,
      actorType: 'ORGANIZER',
      actorId: organizerId || session.organizerId,
      severity: 'INFO',
      newState: { attendanceStatus: 'ATTENDED', method: 'QR_SCAN' }
    });

    res.json({ success: true, message: 'Attendance marked successfully', data: attendance });
  } catch (error) {
    console.error('Error marking attendance:', error);
    if (error.code === 11000) return res.status(400).json({ success: false, message: 'Attendance already marked' });
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/attendance/:eventId/manual/:participantId', async (req, res) => {
  try {
    const { eventId, participantId } = req.params;
    const { organizerId } = req.body;
    // Permission check: canManageAttendance
    const perm = await checkPermission(req, eventId, 'canManageAttendance');
    if (!perm.allowed) return res.status(perm.status).json({ success: false, message: perm.message });

    if (!isValidObjectId(eventId) || !isValidObjectId(participantId)) return res.status(400).json({ success: false, message: 'Invalid ID format' });
    const participant = await Participant.findOne({ _id: participantId, event: eventId });
    if (!participant) return res.status(404).json({ success: false, message: 'Participant not found for this event' });
    const existing = await Attendance.findOne({ event: eventId, participant: participantId });
    if (existing) return res.status(400).json({ success: false, message: 'Attendance already marked' });

    // Use organizerId if provided, otherwise get from event's teamLead
    let markedById = organizerId;
    if (!markedById || !isValidObjectId(markedById)) {
      const event = await Event.findById(eventId);
      markedById = event?.teamLead || event?.createdBy;
    }

    const attendance = await Attendance.create({
      event: eventId,
      participant: participantId,
      markedBy: markedById,
      sessionId: 'manual',
      scannedAt: Date.now()
    });
    await Participant.findByIdAndUpdate(participantId, { attendanceStatus: 'ATTENDED', attendedAt: Date.now() });

    // Create log entry for manual attendance
    const event = await Event.findById(eventId);
    const marker = await User.findById(markedById);
    await Log.create({
      eventId,
      eventName: event?.title || 'Unknown Event',
      participantId,
      participantName: participant.name,
      participantEmail: participant.email,
      actionType: 'ATTENDANCE_MANUAL',
      entityType: 'ATTENDANCE',
      action: 'Attendance marked manually',
      details: `${participant.name} marked present manually by ${marker?.name || 'organizer'}`,
      actorType: 'ORGANIZER',
      actorId: markedById,
      actorName: marker?.name || 'Organizer',
      actorEmail: marker?.email || '',
      severity: 'INFO',
      reason: 'Manual attendance marking',
      newState: { attendanceStatus: 'ATTENDED', method: 'MANUAL' }
    });

    res.json({ success: true, message: 'Attendance marked manually', data: attendance });
  } catch (error) {
    console.error('Error marking manual attendance:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.delete('/attendance/:eventId/unmark/:participantId', async (req, res) => {
  try {
    const { eventId, participantId } = req.params;
    // Permission check: canManageAttendance
    const perm = await checkPermission(req, eventId, 'canManageAttendance');
    if (!perm.allowed) return res.status(perm.status).json({ success: false, message: perm.message });

    if (!isValidObjectId(eventId) || !isValidObjectId(participantId)) return res.status(400).json({ success: false, message: 'Invalid ID format' });

    const participant = await Participant.findById(participantId);
    const attendance = await Attendance.findOneAndDelete({ event: eventId, participant: participantId });
    if (!attendance) return res.status(404).json({ success: false, message: 'Attendance record not found' });

    await Participant.findByIdAndUpdate(participantId, {
      attendanceStatus: 'ABSENT',
      attendedAt: null
    });

    // Create log entry for attendance removal
    const event = await Event.findById(eventId);
    await Log.create({
      eventId,
      eventName: event?.title || 'Unknown Event',
      participantId,
      participantName: participant?.name || 'Unknown',
      participantEmail: participant?.email || '',
      actionType: 'ATTENDANCE_INVALIDATED',
      entityType: 'ATTENDANCE',
      action: 'Attendance unmarked',
      details: `Attendance removed for ${participant?.name || 'participant'}`,
      actorType: 'ORGANIZER',
      actorId: req.user?._id,
      actorName: req.user?.name || 'Organizer',
      actorEmail: req.user?.email || '',
      severity: 'WARNING',
      reason: 'Attendance record removed by organizer',
      oldState: { attendanceStatus: 'ATTENDED' },
      newState: { attendanceStatus: 'ABSENT' }
    });

    res.json({ success: true, message: 'Attendance unmarked successfully' });
  } catch (error) {
    console.error('Error unmarking attendance:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.get('/attendance/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    // Permission check: canManageAttendance
    const perm = await checkPermission(req, eventId, 'canManageAttendance');
    if (!perm.allowed) return res.status(perm.status).json({ success: false, message: perm.message });

    if (!isValidObjectId(eventId)) return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    const attendanceDocs = await Attendance.find({ event: eventId })
      .populate('participant', 'name email phone')
      .populate('markedBy', 'name email')
      .sort({ scannedAt: -1 });

    const attendance = attendanceDocs.map((a) => {
      const obj = a.toObject();
      if (obj.participant) {
        obj.participant.phone = maskPhone(maybeDecryptPii(obj.participant.phone));
      }
      return obj;
    });
    const totalRegistered = await Participant.countDocuments({ event: eventId });
    res.json({ success: true, data: { attendance, stats: { totalRegistered, totalAttended: attendance.length, attendanceRate: totalRegistered > 0 ? Math.round((attendance.length / totalRegistered) * 100) : 0 } } });
  } catch (error) {
    console.error('Error fetching attendance logs:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/attendance/:eventId/live', async (req, res) => {
  try {
    const { eventId } = req.params;
    // Permission check: canManageAttendance
    const perm = await checkPermission(req, eventId, 'canManageAttendance');
    if (!perm.allowed) return res.status(perm.status).json({ success: false, message: perm.message });

    if (!isValidObjectId(eventId)) return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    const attendanceCount = await Attendance.countDocuments({ event: eventId });
    const registeredCount = await Participant.countDocuments({ event: eventId });
    res.json({
      success: true,
      data: {
        present: attendanceCount,
        total: registeredCount,
        percentage: registeredCount > 0 ? Math.round((attendanceCount / registeredCount) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Error fetching live count:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Certificate routes
// Get certificate generation statistics
router.get('/certificates/:eventId/stats', async (req, res) => {
  try {
    const { eventId } = req.params;
    // Permission check: canGenerateCertificates
    const perm = await checkPermission(req, eventId, 'canGenerateCertificates');
    if (!perm.allowed) return res.status(perm.status).json({ success: false, message: perm.message });

    if (!isValidObjectId(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    }

    // Get total registered participants
    const totalRegistered = await Participant.countDocuments({ event: eventId });

    // Get participants who marked attendance
    const attendanceRecords = await Attendance.find({ event: eventId }).populate('participant');
    const totalAttended = attendanceRecords.length;

    // Count valid attendance (with participant data)
    const validAttendance = attendanceRecords.filter(a => a.participant && a.participant._id);

    // Get existing certificates
    const existingCerts = await Certificate.find({ event: eventId });
    const totalCertificatesIssued = existingCerts.length;

    // Calculate eligible participants (attended but no certificate)
    const certifiedParticipantIds = existingCerts.map(c => c.participant.toString());
    const eligibleForCertificates = validAttendance.filter(a =>
      !certifiedParticipantIds.includes(a.participant._id.toString())
    ).length;

    // Get detailed participant info
    const attendedParticipants = validAttendance.map(a => ({
      id: a.participant._id,
      name: a.participant.name || a.participant.fullName,
      email: a.participant.email,
      attendedAt: a.scannedAt,
      hasCertificate: certifiedParticipantIds.includes(a.participant._id.toString())
    }));

    res.json({
      success: true,
      data: {
        totalRegistered,
        totalAttended,
        totalCertificatesIssued,
        eligibleForCertificates,
        attendanceRate: totalRegistered > 0 ? Math.round((totalAttended / totalRegistered) * 100) : 0,
        certificateRate: totalAttended > 0 ? Math.round((totalCertificatesIssued / totalAttended) * 100) : 0,
        participants: attendedParticipants
      }
    });
  } catch (error) {
    console.error('Error fetching certificate stats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/certificates/:eventId/generate', async (req, res) => {
  try {
    const { eventId } = req.params;
    // Permission check: canGenerateCertificates
    const perm = await checkPermission(req, eventId, 'canGenerateCertificates');
    if (!perm.allowed) return res.status(perm.status).json({ success: false, message: perm.message });

    if (!isValidObjectId(eventId)) return res.status(400).json({ success: false, message: 'Invalid event ID format' });

    const { organizerId, template = 'default', achievement = 'Participation', competitionName, participantIds } = req.body;

    // Idempotency for bulk generation (prevents duplicate concurrent bulk runs)
    const providedKey = (req.get('Idempotency-Key') || '').trim();
    const derivedKey = crypto
      .createHash('sha256')
      .update(
        JSON.stringify({ eventId, organizerId, template, achievement, competitionName: competitionName || null }),
      )
      .digest('hex');
    const idempotencyKey = providedKey || derivedKey;
    const idemScope = `CERT_GENERATE_EVENT:${eventId}`;
    const idemHash = buildRequestHash({ organizerId, template, achievement, competitionName: competitionName || null });

    const idem = await getOrCreateIdempotencyRecord({
      scope: idemScope,
      key: idempotencyKey,
      requestHash: idemHash,
      ttlMs: 24 * 60 * 60 * 1000,
    });

    if (idem.kind === 'HIT') {
      return res.status(idem.record.statusCode || 200).json(idem.record.responseBody);
    }

    if (idem.kind === 'IN_PROGRESS') {
      res.setHeader('Retry-After', '2');
      return res.status(409).json({
        success: false,
        message: 'Certificate generation is already in progress for this event. Please retry.',
        code: 'IDEMPOTENCY_IN_PROGRESS',
      });
    }

    console.log('🎯 Generating certificates for event:', eventId);
    console.log('Request body:', req.body);
    console.log('Request params:', { organizerId, template, achievement, competitionName, participantIds });

    // Validate organizerId
    if (!organizerId) {
      console.log('❌ ERROR: organizerId is missing from request body');
      return res.status(400).json({
        success: false,
        message: 'organizerId is required. Please provide the organizer/user ID who is generating the certificates.'
      });
    }

    if (!isValidObjectId(organizerId)) {
      console.log('❌ ERROR: organizerId is not a valid ObjectId:', organizerId);
      return res.status(400).json({
        success: false,
        message: 'Invalid organizerId format'
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      console.log('❌ Event not found');
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    console.log('✅ Event found:', event.title || event.name);

    // Get existing certificates to check for duplicates
    const existingCerts = await Certificate.find({ event: eventId });

    let eligibleParticipants = [];

    // If participantIds are provided (for winner certificates), generate only for those
    if (participantIds && Array.isArray(participantIds) && participantIds.length > 0) {
      console.log(`🎖️ Generating individual certificates for ${participantIds.length} specific participant(s)`);
      
      // Fetch attendance records for the specific participants
      const attendanceRecords = await Attendance.find({
        event: eventId,
        participant: { $in: participantIds }
      }).populate('participant');

      eligibleParticipants = attendanceRecords.filter(a => {
        if (!a.participant || !a.participant._id) return false;
        
        // Check if this participant already has a certificate with the same achievement
        const existingCert = existingCerts.find(c =>
          c.participant.toString() === a.participant._id.toString() &&
          c.achievement === achievement
        );
        return !existingCert;
      });

      if (eligibleParticipants.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Selected participant(s) either have not attended or already have certificates with this achievement type.',
          data: { generated: 0, failed: 0 }
        });
      }
    } else {
      // Original bulk generation logic for all attended participants
      console.log('Querying attendance for event:', eventId);
      const attendedParticipants = await Attendance.find({ event: eventId }).populate('participant');
      console.log(`Found ${attendedParticipants.length} attendance records`);

      if (attendedParticipants.length === 0) {
        console.log('NO ATTENDANCE RECORDS FOUND! Please mark attendance first.');
        return res.status(400).json({
          success: false,
          message: 'No attendance records found. Please mark participants as present using the Attendance QR page before generating certificates.',
          data: { generated: 0, failed: 0 }
        });
      }

      // Filter out records with missing participant data
      const validAttendance = attendedParticipants.filter(a => a.participant && a.participant._id);
      console.log(`Valid attendance with participant data: ${validAttendance.length}`);

      if (validAttendance.length === 0) {
        console.log('Attendance exists but participant data is null/missing');
        return res.status(400).json({
          success: false,
          message: 'Attendance records exist but participant information is missing.',
          data: { generated: 0, failed: 0 }
        });
      }

      const certifiedParticipantIds = existingCerts.map(c => c.participant.toString());
      eligibleParticipants = validAttendance.filter(a =>
        !certifiedParticipantIds.includes(a.participant._id.toString())
      );

      console.log(`📋 Certificate Status - Total Attended: ${validAttendance.length}, Already Issued: ${existingCerts.length}, Eligible: ${eligibleParticipants.length}`);

      if (eligibleParticipants.length === 0) {
        console.log('✅ All participants already have certificates');
        return res.json({
          success: true,
          message: `All ${validAttendance.length} participant${validAttendance.length === 1 ? '' : 's'} already have certificates. No new certificates to generate.`,
          data: { generated: 0, alreadyIssued: existingCerts.length, totalAttended: validAttendance.length }
        });
      }
    }

    console.log(`\ud83d\udcdd Generating ${eligibleParticipants.length} certificates...`);

    const results = [];
    let successCount = 0;
    let failCount = 0;
    let alreadyIssuedCount = 0;

    for (const att of eligibleParticipants) {
      try {
        const participant = att.participant;

        if (!participant || !participant.name) {
          console.log('⚠️ Skipping participant with missing data');
          failCount++;
          results.push({
            participant: 'Unknown',
            status: 'FAILED',
            error: 'Participant data missing'
          });
          continue;
        }

        // Prepare certificate data with all required fields
        const certVerificationId = `${Date.now().toString(16)}-${Math.random().toString(16).substring(2, 10)}-${Math.random().toString(16).substring(2, 10)}`;
        const certificateData = {
          template,
          participantName: participant.name || participant.fullName || 'Participant',
          eventName: event.title || event.name || 'Event',
          eventDate: event.startDate || event.createdAt || new Date(),
          certificateId: `CERT-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase(),
          verificationId: certVerificationId,
          organizationName: event.organizationName || 'PCET\'s Pimpri Chinchwad College of Engineering',
          departmentName: event.departmentName || 'Department of Computer Science & Engineering',
          competitionName: competitionName || event.title || event.name || 'Competition',
          achievement: achievement || 'Participation'
        };

        // Generate Certificate JPG
        console.log(`📄 Generating certificate for ${participant.name}...`);
        console.log(`📋 Certificate data:`, {
          participantName: certificateData.participantName,
          eventName: certificateData.eventName,
          certificateId: certificateData.certificateId,
          achievement: certificateData.achievement
        });

        const pdfResult = await certificateGenerator.generateCertificate(certificateData);
        console.log(`✅ Certificate Generation Result:`, {
          success: pdfResult.success,
          filename: pdfResult.filename,
          hasCloudinaryUrl: !!pdfResult.cloudinaryUrl,
          hasPublicId: !!pdfResult.cloudinaryPublicId
        });

        if (pdfResult.success) {
          // Save certificate record to database
          console.log(`💾 Saving certificate to database for ${participant.name}...`);
          console.log(`📋 Certificate data to save:`, {
            event: eventId,
            participant: participant._id,
            certificateId: certificateData.certificateId,
            issuedBy: organizerId,
            template,
            achievement,
            competitionName: competitionName || event.title || event.name,
            status: 'GENERATED'
          });

          try {
            const certificate = await Certificate.create({
              event: eventId,
              participant: participant._id,
              certificateId: certificateData.certificateId,
              verificationId: certVerificationId,
              issuedBy: organizerId,
              template,
              achievement,
              competitionName: competitionName || event.title || event.name,
              pdfPath: pdfResult.filepath,
              pdfFilename: pdfResult.filename,
              certificateUrl: pdfResult.url,
              cloudinaryUrl: pdfResult.cloudinaryUrl,
              cloudinaryPublicId: pdfResult.cloudinaryPublicId,
              status: 'GENERATED'
            });
            console.log(`✅ Certificate saved successfully with ID: ${certificate._id}`);
            console.log(`☁️ Cloudinary URL: ${certificate.cloudinaryUrl}`);

            results.push({ participant: participant.name, status: 'SUCCESS', certificate });
            successCount++;
            console.log(`✅ Generated certificate for ${participant.name} (${successCount}/${eligibleParticipants.length})`);
          } catch (dbError) {
            // If another concurrent process created it first, treat as already issued
            if (dbError?.code === 11000) {
              const existing = await Certificate.findOne({
                event: eventId,
                participant: participant._id,
              });
              if (existing) {
                results.push({ participant: participant.name, status: 'ALREADY_EXISTS', certificate: existing });
                alreadyIssuedCount++;
                console.log(`ℹ️ Certificate already exists for ${participant.name} (duplicate prevented)`);
                continue;
              }
            }
            console.error(`❌ DATABASE ERROR saving certificate:`, dbError);
            console.error('Error name:', dbError.name);
            console.error('Error message:', dbError.message);
            console.error('Error stack:', dbError.stack);
            results.push({
              participant: participant.name,
              status: 'FAILED',
              error: `Database error: ${dbError.message}`
            });
            failCount++;
          }
        } else {
          console.log(`❌ PDF generation failed for ${participant.name}`);
          results.push({ participant: participant.name, status: 'FAILED', error: 'PDF generation failed' });
          failCount++;
        }
      } catch (error) {
        console.error(`\u274c Error generating certificate for ${att.participant.name}:`, error); console.error('Full error stack:', error.stack); results.push({
          participant: att.participant.name,
          status: 'FAILED',
          error: error.message
        });
        failCount++;
      }
    }

    console.log(`\n========================================`);
    console.log(`✅ CERTIFICATE GENERATION COMPLETE`);
    console.log(`========================================`);
    console.log(`📊 Summary:`);
    console.log(`   - Total Eligible: ${eligibleParticipants.length}`);
    console.log(`   - Successfully Generated: ${successCount}`);
    console.log(`   - Failed: ${failCount}`);
    console.log(`   - All uploaded to Cloudinary: ${successCount > 0 ? 'YES ☁️' : 'N/A'}`);
    console.log(`========================================\n`);

    // Log certificate generation
    if (successCount > 0) {
      console.log('📝 [Certificates] Creating log for certificate generation...');
      const organizer = (organizerId && isValidObjectId(organizerId)) ? await User.findById(organizerId) : null;
      await Log.create({
        eventId: event._id,
        eventName: event.title || event.name,
        actionType: 'CERTIFICATES_GENERATED',
        action: 'Bulk certificate generation',
        details: `Generated ${successCount} certificates for event participants${failCount > 0 ? `. ${failCount} failed.` : ''}`,
        entityType: 'CERTIFICATE',
        actorType: organizer ? (organizer.role === 'ADMIN' ? 'ADMIN' : 'ORGANIZER') : 'SYSTEM',
        actorId: organizer?._id,
        actorName: organizer?.name || 'System',
        actorEmail: organizer?.email,
        severity: failCount > 0 ? 'WARNING' : 'INFO',
        newState: { generated: successCount, failed: failCount, total: eligibleParticipants.length, template, achievement }
      });
      console.log('✅ [Certificates] Log created successfully');
    }

    const responseBody = {
      success: true,
      message: `Generated ${successCount} certificates${alreadyIssuedCount > 0 ? `, ${alreadyIssuedCount} already existed` : ''}${failCount > 0 ? `, ${failCount} failed` : ''}`,
      data: {
        generated: successCount,
        alreadyIssued: alreadyIssuedCount,
        failed: failCount,
        total: eligibleParticipants.length,
        results
      }
    };

    await finalizeIdempotency({
      scope: idemScope,
      key: idempotencyKey,
      statusCode: 200,
      responseBody,
    });

    res.json(responseBody);
  } catch (error) {
    console.error('Error generating certificates:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.post('/certificates/:eventId/send', async (req, res) => {
  try {
    const { eventId } = req.params;
    // Permission check: canGenerateCertificates + canSendEmails
    const perm = await checkPermission(req, eventId, 'canGenerateCertificates');
    if (!perm.allowed) return res.status(perm.status).json({ success: false, message: perm.message });
    const permEmail = await checkPermission(req, eventId, 'canSendEmails');
    if (!permEmail.allowed) return res.status(permEmail.status).json({ success: false, message: permEmail.message });

    if (!isValidObjectId(eventId)) return res.status(400).json({ success: false, message: 'Invalid event ID format' });

    console.log('📧 [Bulk Send] Sending certificates for event:', eventId);

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    // Get all generated but not sent certificates
    const certificates = await Certificate.find({
      event: eventId,
      status: 'GENERATED'
    }).populate('participant');

    if (certificates.length === 0) {
      console.log('ℹ️  [Bulk Send] No certificates to send');
      return res.json({
        success: true,
        message: 'No certificates to send',
        data: { sent: 0, failed: 0, results: [] }
      });
    }

    console.log(`📨 [Bulk Send] Sending ${certificates.length} certificates via email...`);
    console.log(`📧 [Bulk Send] Email Configuration Check:`, {
      emailUser: process.env.EMAIL_USER ? '✓ Configured' : '✗ Missing',
      emailPassword: process.env.EMAIL_PASSWORD ? '✓ Configured' : '✗ Missing'
    });

    let sentCount = 0;
    let failedCount = 0;
    const results = [];

    for (const cert of certificates) {
      try {
        const recipient = cert.participant;

        if (!recipient || !recipient.email) {
          console.error(`⚠️  [Bulk Send] Skipping certificate ${cert._id}: No recipient email`);
          failedCount++;
          results.push({
            certificateId: cert._id,
            participant: recipient?.name || 'Unknown',
            email: recipient?.email || 'N/A',
            status: 'FAILED',
            error: 'No email address found'
          });
          continue;
        }

        console.log(`📤 [Bulk Send] Sending to: ${recipient.email}`);

        // Verify certificate URL exists (Cloudinary URL)
        const certificateUrl = cert.cloudinaryUrl;
        if (!certificateUrl) {
          console.error(`⚠️  [Bulk Send] No Cloudinary URL for certificate ${cert._id}`);
          failedCount++;
          results.push({
            certificateId: cert._id,
            participant: recipient.name,
            email: recipient.email,
            status: 'FAILED',
            error: 'Certificate URL not found. Please regenerate the certificate.'
          });
          continue;
        }

        // Send email with certificate URL (no local file attachment)
        const emailResult = await sendCertificateEmail(
          recipient,
          event,
          null, // No local file path - using Cloudinary URL only
          certificateUrl
        );

        if (emailResult.success) {
          cert.status = 'SENT';
          cert.sentAt = Date.now();
          await cert.save();

          // Update participant status
          await Participant.findByIdAndUpdate(recipient._id, {
            certificateStatus: 'SENT'
          });

          sentCount++;
          results.push({
            certificateId: cert._id,
            participant: recipient.name,
            email: recipient.email,
            status: 'SENT',
            messageId: emailResult.messageId,
            sentAt: new Date().toISOString()
          });
          console.log(`✅ [Bulk Send] Certificate sent to ${recipient.email} (MessageID: ${emailResult.messageId})`);
        } else {
          failedCount++;
          results.push({
            certificateId: cert._id,
            participant: recipient.name,
            email: recipient.email,
            status: 'FAILED',
            error: emailResult.error || 'Unknown error',
            troubleshooting: emailResult.error?.includes('auth') || emailResult.error?.includes('credentials')
              ? 'Check EMAIL_USER and EMAIL_PASSWORD in .env'
              : 'Check email service configuration'
          });
          console.error(`❌ [Bulk Send] Failed to send certificate to ${recipient.email}: ${emailResult.error}`);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`❌ [Bulk Send] Error sending certificate to ${cert.participant.email}:`, error);
        failedCount++;
        results.push({
          certificateId: cert._id,
          participant: cert.participant.name,
          email: cert.participant.email,
          status: 'FAILED',
          error: error.message
        });
      }
    }

    console.log(`\n📊 [Bulk Send] Summary:`);
    console.log(`   ✅ Sent: ${sentCount}`);
    console.log(`   ❌ Failed: ${failedCount}`);
    console.log(`   📧 Total: ${certificates.length}`);

    // Log failed ones for debugging
    if (failedCount > 0) {
      console.log(`\n⚠️  Failed Emails Details:`);
      results.filter(r => r.status === 'FAILED').forEach(r => {
        console.log(`   - ${r.email}: ${r.error}`);
      });
    }

    // Log certificate sending
    if (sentCount > 0) {
      console.log('📧 [Certificates Send] Creating log for bulk certificate sending...');
      const organizerId = req.body.organizerId;
      const organizer = (organizerId && isValidObjectId(organizerId)) ? await User.findById(organizerId) : null;
      await Log.create({
        eventId: event._id,
        eventName: event.title || event.name,
        actionType: 'CERTIFICATES_SENT',
        action: 'Bulk certificates sent via email',
        details: `Sent ${sentCount} certificates via email${failedCount > 0 ? `. ${failedCount} failed.` : ''}`,
        entityType: 'CERTIFICATE',
        actorType: organizer ? (organizer.role === 'ADMIN' ? 'ADMIN' : 'ORGANIZER') : 'SYSTEM',
        actorId: organizer?._id,
        actorName: organizer?.name || 'System',
        actorEmail: organizer?.email,
        severity: failedCount > 0 ? 'WARNING' : 'INFO',
        newState: { sent: sentCount, failed: failedCount, total: certificates.length }
      });
      console.log('✅ [Certificates Send] Log created successfully');
    }

    res.json({
      success: true,
      message: `Sent ${sentCount} certificates${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
      data: {
        sent: sentCount,
        failed: failedCount,
        total: certificates.length,
        results,
        emailConfig: {
          configured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD),
          emailUser: process.env.EMAIL_USER || 'Not configured'
        }
      }
    });
  } catch (error) {
    console.error('❌ [Bulk Send] Error sending certificates:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.get('/certificates/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    // Permission check: canGenerateCertificates
    const perm = await checkPermission(req, eventId, 'canGenerateCertificates');
    if (!perm.allowed) return res.status(perm.status).json({ success: false, message: perm.message });

    const certificates = await Certificate.find({ event: eventId })
      .populate('participant', 'name email')
      .populate('issuedBy', 'name')
      .sort({ issuedAt: -1 });

    // Get certificate requests
    const requests = await CertificateRequest.find({ event: eventId })
      .populate('participant', 'name email fullName')
      .populate('processedBy', 'name')
      .sort({ requestedAt: -1 });

    const totalAttended = await Attendance.countDocuments({ event: eventId });
    const generated = certificates.length;
    const sent = certificates.filter(c => c.status === 'SENT').length;
    const pendingRequests = requests.filter(r => r.status === 'PENDING').length;

    res.json({
      success: true,
      data: certificates,
      requests: requests,
      stats: {
        totalAttended,
        generated,
        sent,
        pending: generated - sent,
        pendingRequests
      }
    });
  } catch (error) {
    console.error('Error fetching certificate logs:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/certificates/:certificateId/resend', async (req, res) => {
  try {
    const { certificateId } = req.params;

    // Look up certificate to find event for permission check
    const certForPerm = await Certificate.findById(certificateId);
    if (certForPerm) {
      const perm = await checkPermission(req, certForPerm.event.toString(), 'canGenerateCertificates');
      if (!perm.allowed) return res.status(perm.status).json({ success: false, message: perm.message });
      const permEmail = await checkPermission(req, certForPerm.event.toString(), 'canSendEmails');
      if (!permEmail.allowed) return res.status(permEmail.status).json({ success: false, message: permEmail.message });
    }

    console.log('📧 [Resend] Attempting to resend certificate:', certificateId);

    const certificate = await Certificate.findById(certificateId)
      .populate('participant')
      .populate('event');

    if (!certificate) {
      console.error('❌ [Resend] Certificate not found:', certificateId);
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    if (!certificate.participant) {
      console.error('❌ [Resend] No participant associated with certificate');
      return res.status(400).json({ success: false, message: 'No participant associated with certificate' });
    }

    if (!certificate.event) {
      console.error('❌ [Resend] No event associated with certificate');
      return res.status(400).json({ success: false, message: 'No event associated with certificate' });
    }

    // Verify certificate URL exists (Cloudinary URL)
    const certificateUrl = certificate.cloudinaryUrl;
    if (!certificateUrl) {
      console.error(`❌ [Resend] No Cloudinary URL found for certificate ${certificateId}`);
      return res.status(400).json({
        success: false,
        message: 'Certificate URL not found. The certificate may need to be regenerated.',
        emailDetails: {
          error: 'Missing certificate URL',
          troubleshooting: 'Try regenerating the certificate from the Generate tab'
        }
      });
    }

    console.log(`📤 [Resend] Sending certificate to: ${certificate.participant.email}`);
    console.log(`📄 [Resend] Certificate URL: ${certificateUrl}`);

    // Send email with certificate URL (no local file attachment)
    const emailResult = await sendCertificateEmail(
      certificate.participant,
      certificate.event,
      null, // No local file path - using Cloudinary URL only
      certificateUrl
    );

    if (emailResult.success) {
      certificate.sentAt = Date.now();
      certificate.status = 'SENT';
      await certificate.save();

      // Update participant status
      await Participant.findByIdAndUpdate(certificate.participant._id, {
        certificateStatus: 'SENT'
      });

      console.log(`✅ [Resend] Certificate successfully sent to ${certificate.participant.email}`);
      console.log(`📬 [Resend] Email Message ID: ${emailResult.messageId}`);

      // Log certificate resend
      const organizerId = req.body.organizerId || req.user?._id;
      const organizer = organizerId ? await User.findById(organizerId) : null;

      await Log.create({
        eventId: certificate.event._id,
        eventName: certificate.event.title || certificate.event.name,
        participantId: certificate.participant._id,
        participantName: certificate.participant.name,
        participantEmail: certificate.participant.email,
        actionType: 'CERTIFICATE_RESENT',
        entityType: 'CERTIFICATE',
        action: 'Certificate resent to participant',
        details: `Certificate resent to ${certificate.participant.name} (${certificate.participant.email})`,
        actorType: organizer ? (organizer.role === 'ADMIN' ? 'ADMIN' : 'ORGANIZER') : 'SYSTEM',
        actorId: organizer?._id,
        actorName: organizer?.name || 'Organizer',
        actorEmail: organizer?.email || '',
        severity: 'INFO',
        newState: {
          certificateId: certificate.certificateId,
          status: 'SENT',
          sentAt: certificate.sentAt
        }
      });

      res.json({
        success: true,
        message: 'Certificate sent successfully via email',
        data: certificate,
        emailDetails: {
          recipient: certificate.participant.email,
          messageId: emailResult.messageId,
          sentAt: new Date().toISOString()
        }
      });
    } else {
      console.error(`❌ [Resend] Failed to send email to ${certificate.participant.email}`);
      console.error(`❌ [Resend] Error: ${emailResult.error}`);

      res.status(500).json({
        success: false,
        message: `Failed to send email: ${emailResult.error}`,
        emailDetails: {
          recipient: certificate.participant.email,
          error: emailResult.error,
          troubleshooting: 'Check email configuration in .env file (EMAIL_USER and EMAIL_PASSWORD)'
        }
      });
    }
  } catch (error) {
    console.error('❌ [Resend] Error resending certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending certificate',
      error: error.message
    });
  }
});

// Event Updates routes
router.get('/updates/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const updates = await EventUpdate.find({ event: eventId }).populate('createdBy', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, count: updates.length, data: updates });
  } catch (error) {
    console.error('Error fetching event updates:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/updates', async (req, res) => {
  try {
    const { eventId, message, type = 'INFO', isPinned = false, organizerId } = req.body;
    // Permission check: canEditEvent
    const perm = await checkPermission(req, eventId, 'canEditEvent');
    if (!perm.allowed) return res.status(perm.status).json({ success: false, message: perm.message });

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    const update = await EventUpdate.create({ event: eventId, message, type, isPinned, createdBy: organizerId });
    const populatedUpdate = await EventUpdate.findById(update._id).populate('createdBy', 'name email');

    // Log event update posting
    const organizer = (organizerId && isValidObjectId(organizerId)) ? await User.findById(organizerId) : null;
    await Log.create({
      eventId: event._id,
      eventName: event.title || event.name,
      actionType: 'EVENT_UPDATE_POSTED',
      action: 'Event update posted',
      details: `Posted update: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}" (Type: ${type})`,
      entityType: 'COMMUNICATION',
      actorType: organizer ? (organizer.role === 'ADMIN' ? 'ADMIN' : 'ORGANIZER') : 'SYSTEM',
      actorId: organizer?._id,
      actorName: organizer?.name || 'Organizer',
      actorEmail: organizer?.email,
      severity: type === 'CRITICAL' ? 'CRITICAL' : type === 'WARNING' ? 'WARNING' : 'INFO',
      newState: { type, isPinned, messageLength: message.length }
    });

    res.status(201).json({ success: true, message: 'Update posted successfully', data: populatedUpdate });
  } catch (error) {
    console.error('Error creating event update:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/updates/:updateId', async (req, res) => {
  try {
    const { updateId } = req.params;
    const { organizerId } = req.body;
    const update = await EventUpdate.findById(updateId);
    if (!update) return res.status(404).json({ success: false, message: 'Update not found' });

    // Permission check: canEditEvent
    const perm = await checkPermission(req, update.event.toString(), 'canEditEvent');
    if (!perm.allowed) return res.status(perm.status).json({ success: false, message: perm.message });

    const event = await Event.findById(update.event);
    await EventUpdate.findByIdAndDelete(updateId);

    // Log update deletion
    const organizer = (organizerId && isValidObjectId(organizerId)) ? await User.findById(organizerId) : null;
    await Log.create({
      eventId: event._id,
      eventName: event.title || event.name,
      actionType: 'EVENT_UPDATE_DELETED',
      action: 'Event update deleted',
      details: `Deleted event update: "${update.message.substring(0, 100)}${update.message.length > 100 ? '...' : ''}"`,
      entityType: 'COMMUNICATION',
      actorType: organizer ? (organizer.role === 'ADMIN' ? 'ADMIN' : 'ORGANIZER') : 'SYSTEM',
      actorId: organizer?._id,
      actorName: organizer?.name || 'Organizer',
      actorEmail: organizer?.email,
      severity: 'INFO',
      oldState: { message: update.message, type: update.type }
    });

    res.json({ success: true, message: 'Update deleted successfully' });
  } catch (error) {
    console.error('Error deleting event update:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.patch('/updates/:updateId/pin', async (req, res) => {
  try {
    const { updateId } = req.params;
    const { organizerId } = req.body;
    const update = await EventUpdate.findById(updateId);
    if (!update) return res.status(404).json({ success: false, message: 'Update not found' });

    // Permission check: canEditEvent
    const perm = await checkPermission(req, update.event.toString(), 'canEditEvent');
    if (!perm.allowed) return res.status(perm.status).json({ success: false, message: perm.message });

    const wasPinned = update.isPinned;
    update.isPinned = !update.isPinned;
    await update.save();

    // Log pin/unpin action
    const event = await Event.findById(update.event);
    const organizer = (organizerId && isValidObjectId(organizerId)) ? await User.findById(organizerId) : null;
    await Log.create({
      eventId: event._id,
      eventName: event.title || event.name,
      actionType: update.isPinned ? 'EVENT_UPDATE_PINNED' : 'EVENT_UPDATE_UNPINNED',
      action: update.isPinned ? 'Event update pinned' : 'Event update unpinned',
      details: `${update.isPinned ? 'Pinned' : 'Unpinned'} event update`,
      entityType: 'COMMUNICATION',
      actorType: organizer ? (organizer.role === 'ADMIN' ? 'ADMIN' : 'ORGANIZER') : 'SYSTEM',
      actorId: organizer?._id,
      actorName: organizer?.name || 'Organizer',
      actorEmail: organizer?.email,
      severity: 'INFO',
      oldState: { isPinned: wasPinned },
      newState: { isPinned: update.isPinned }
    });

    res.json({ success: true, message: update.isPinned ? 'Update pinned' : 'Update unpinned', data: update });
  } catch (error) {
    console.error('Error toggling pin:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Certificate Request Management Routes
// GET /api/organizer/certificates/:eventId/requests - Get all certificate requests for an event
router.get('/certificates/:eventId/requests', async (req, res) => {
  try {
    const { eventId } = req.params;
    // Permission check: canGenerateCertificates
    const perm = await checkPermission(req, eventId, 'canGenerateCertificates');
    if (!perm.allowed) return res.status(perm.status).json({ success: false, message: perm.message });

    if (!isValidObjectId(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    }

    const { status } = req.query;
    const filter = { event: eventId };

    if (status) {
      filter.status = status;
    }

    const requests = await CertificateRequest.find(filter)
      .populate('participant', 'name email fullName phone')
      .populate('event', 'title name startDate')
      .populate('processedBy', 'name email')
      .populate('certificate')
      .sort({ requestedAt: -1 });

    const sanitizedRequests = requests.map((r) => {
      const obj = r.toObject();
      if (obj.participant) {
        obj.participant.phone = maskPhone(maybeDecryptPii(obj.participant.phone));
      }
      return obj;
    });

    const stats = {
      total: requests.length,
      pending: requests.filter(r => r.status === 'PENDING').length,
      approved: requests.filter(r => r.status === 'APPROVED').length,
      generated: requests.filter(r => r.status === 'GENERATED').length,
      rejected: requests.filter(r => r.status === 'REJECTED').length
    };

    res.json({
      success: true,
      data: sanitizedRequests,
      stats
    });
  } catch (error) {
    console.error('Error fetching certificate requests:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// POST /api/organizer/certificates/request/:requestId/approve - Approve and generate certificate
router.post('/certificates/request/:requestId/approve', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { achievement, competitionName, template = 'default', organizerId } = req.body;

    // Idempotency for single certificate issuance
    const providedKey = (req.get('Idempotency-Key') || '').trim();
    const derivedKey = crypto
      .createHash('sha256')
      .update(JSON.stringify({ requestId, organizerId, template, achievement: achievement || null, competitionName: competitionName || null }))
      .digest('hex');
    const idempotencyKey = providedKey || derivedKey;
    const idemScope = `CERT_ISSUE_REQUEST:${requestId}`;
    const idemHash = buildRequestHash({ organizerId, template, achievement: achievement || null, competitionName: competitionName || null });

    const idem = await getOrCreateIdempotencyRecord({
      scope: idemScope,
      key: idempotencyKey,
      requestHash: idemHash,
      ttlMs: 24 * 60 * 60 * 1000,
    });

    if (idem.kind === 'HIT') {
      return res.status(idem.record.statusCode || 200).json(idem.record.responseBody);
    }

    if (idem.kind === 'IN_PROGRESS') {
      res.setHeader('Retry-After', '2');
      return res.status(409).json({
        success: false,
        message: 'Certificate issuance is already in progress. Please retry.',
        code: 'IDEMPOTENCY_IN_PROGRESS',
      });
    }

    if (!isValidObjectId(requestId)) {
      return res.status(400).json({ success: false, message: 'Invalid request ID' });
    }

    const request = await CertificateRequest.findById(requestId)
      .populate('participant')
      .populate('event');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Permission check: canGenerateCertificates
    const perm = await checkPermission(req, request.event._id.toString(), 'canGenerateCertificates');
    if (!perm.allowed) return res.status(perm.status).json({ success: false, message: perm.message });

    if (request.status !== 'PENDING') {
      const body = {
        success: true,
        message: `Request already ${request.status.toLowerCase()}`,
        data: { request },
      };
      await finalizeIdempotency({ scope: idemScope, key: idempotencyKey, statusCode: 200, responseBody: body });
      return res.json(body);
    }

    // Check if certificate already exists
    const existingCert = await Certificate.findOne({
      event: request.event._id,
      participant: request.participant._id
    });

    if (existingCert) {
      // Treat as idempotent success: certificate already issued
      request.status = 'GENERATED';
      request.processedAt = request.processedAt || new Date();
      request.processedBy = request.processedBy || organizerId;
      request.certificate = request.certificate || existingCert._id;
      await request.save();

      const body = {
        success: true,
        message: 'Certificate already exists for this participant',
        code: 'ALREADY_EXISTS',
        data: {
          request,
          certificate: existingCert,
        },
      };
      await finalizeIdempotency({ scope: idemScope, key: idempotencyKey, statusCode: 200, responseBody: body });
      return res.json(body);
    }

    // Generate certificate
    const certVerificationId = `${Date.now().toString(16)}-${Math.random().toString(16).substring(2, 10)}-${Math.random().toString(16).substring(2, 10)}`;
    const certificateData = {
      template,
      participantName: request.participant.name || request.participant.fullName,
      eventName: request.event.title || request.event.name,
      eventDate: request.event.startDate || request.event.createdAt,
      certificateId: `CERT-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase(),
      verificationId: certVerificationId,
      organizationName: request.event.organizationName || 'PCET\'s Pimpri Chinchwad College of Engineering',
      departmentName: request.event.departmentName || 'Department of Computer Science & Engineering',
      competitionName: competitionName || request.event.title || request.event.name,
      achievement: achievement || 'Participation'
    };

    console.log(`📄 Generating certificate for ${request.participant.name} (Request: ${requestId})...`);

    const pdfResult = await certificateGenerator.generateCertificate(certificateData);

    if (pdfResult.success) {
      // Create certificate
      let certificate;
      try {
        certificate = await Certificate.create({
          event: request.event._id,
          participant: request.participant._id,
          certificateId: certificateData.certificateId,
          verificationId: certVerificationId,
          issuedBy: organizerId,
          template,
          achievement: achievement || 'Participation',
          competitionName: competitionName || request.event.title || request.event.name,
          pdfPath: pdfResult.filepath,
          pdfFilename: pdfResult.filename,
          certificateUrl: pdfResult.url,
          cloudinaryUrl: pdfResult.cloudinaryUrl,
          cloudinaryPublicId: pdfResult.cloudinaryPublicId,
          status: 'GENERATED'
        });
      } catch (dbError) {
        if (dbError?.code === 11000) {
          const existing = await Certificate.findOne({
            event: request.event._id,
            participant: request.participant._id,
          });
          if (existing) {
            certificate = existing;
          } else {
            throw dbError;
          }
        } else {
          throw dbError;
        }
      }

      // Update request
      request.status = 'GENERATED';
      request.achievement = achievement || 'Participation';
      request.processedAt = new Date();
      request.processedBy = organizerId;
      request.certificate = certificate._id;
      await request.save();

      console.log(`✅ Certificate generated and request approved: ${requestId}`);

      // Log certificate request approval
      const organizer = (organizerId && isValidObjectId(organizerId)) ? await User.findById(organizerId) : null;
      await Log.create({
        eventId: request.event._id,
        eventName: request.event.title || request.event.name,
        participantId: request.participant._id,
        participantName: request.participant.name,
        participantEmail: request.participant.email,
        actionType: 'CERTIFICATE_REQUEST_APPROVED',
        action: 'Certificate request approved',
        details: `Approved certificate request for ${request.participant.name}. Certificate generated.`,
        entityType: 'CERTIFICATE',
        actorType: organizer ? (organizer.role === 'ADMIN' ? 'ADMIN' : 'ORGANIZER') : 'SYSTEM',
        actorId: organizer?._id,
        actorName: organizer?.name || 'Organizer',
        actorEmail: organizer?.email,
        severity: 'INFO',
        newState: { status: 'GENERATED', certificateId: certificate.certificateId, achievement }
      });

      const responseBody = {
        success: true,
        message: 'Certificate generated successfully',
        data: {
          request,
          certificate
        }
      };

      await finalizeIdempotency({
        scope: idemScope,
        key: idempotencyKey,
        statusCode: 200,
        responseBody,
      });

      res.json(responseBody);
    } else {
      const responseBody = {
        success: false,
        message: 'Failed to generate certificate'
      };
      await finalizeIdempotency({
        scope: idemScope,
        key: idempotencyKey,
        statusCode: 500,
        responseBody,
      });
      res.status(500).json(responseBody);
    }
  } catch (error) {
    console.error('Error approving certificate request:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// POST /api/organizer/certificates/request/:requestId/reject - Reject certificate request
router.post('/certificates/request/:requestId/reject', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason, organizerId } = req.body;

    if (!isValidObjectId(requestId)) {
      return res.status(400).json({ success: false, message: 'Invalid request ID' });
    }

    const request = await CertificateRequest.findById(requestId).populate('event');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Permission check: canGenerateCertificates
    const perm = await checkPermission(req, request.event._id.toString(), 'canGenerateCertificates');
    if (!perm.allowed) return res.status(perm.status).json({ success: false, message: perm.message });

    if (request.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Request already ${request.status.toLowerCase()}`
      });
    }

    request.status = 'REJECTED';
    request.rejectionReason = reason || 'Request rejected by organizer';
    request.processedAt = new Date();
    request.processedBy = organizerId;
    await request.save();

    // Log certificate request rejection
    const event = await Event.findById(request.event);
    const participant = await Participant.findById(request.participant);
    const organizer = (organizerId && isValidObjectId(organizerId)) ? await User.findById(organizerId) : null;
    await Log.create({
      eventId: event._id,
      eventName: event.title || event.name,
      participantId: participant._id,
      participantName: participant.name,
      participantEmail: participant.email,
      actionType: 'CERTIFICATE_REQUEST_REJECTED',
      action: 'Certificate request rejected',
      details: `Rejected certificate request for ${participant.name}. Reason: ${reason || 'No reason provided'}`,
      entityType: 'CERTIFICATE',
      actorType: organizer ? (organizer.role === 'ADMIN' ? 'ADMIN' : 'ORGANIZER') : 'SYSTEM',
      actorId: organizer?._id,
      actorName: organizer?.name || 'Organizer',
      actorEmail: organizer?.email,
      severity: 'WARNING',
      reason: reason || 'No reason provided',
      newState: { status: 'REJECTED' }
    });

    res.json({
      success: true,
      message: 'Certificate request rejected',
      data: request
    });
  } catch (error) {
    console.error('Error rejecting certificate request:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Communication routes
router.get('/communication/templates', async (req, res) => {
  try {
    const templates = [
      { id: 'REMINDER', name: 'Event Reminder', subject: 'Reminder: {{eventName}} is coming up!', body: 'Dear {{participantName}},\n\nThis is a reminder that {{eventName}} is scheduled for {{eventDate}}.\n\nLocation: {{venue}}\n\nWe look forward to seeing you there!\n\nBest regards,\nThe Organizing Team' },
      { id: 'VENUE_UPDATE', name: 'Venue Update', subject: 'Important: Venue Update for {{eventName}}', body: 'Dear {{participantName}},\n\nPlease note that the venue for {{eventName}} has been updated.\n\nNew Location: {{venue}}\n\nPlease plan accordingly.\n\nBest regards,\nThe Organizing Team' },
      { id: 'CERTIFICATE', name: 'Certificate Delivery', subject: 'Your Certificate for {{eventName}}', body: 'Dear {{participantName}},\n\nCongratulations on completing {{eventName}}!\n\nPlease find your certificate attached to this email.\n\nBest regards,\nThe Organizing Team' },
      { id: 'THANK_YOU', name: 'Thank You Note', subject: 'Thank You for Attending {{eventName}}', body: 'Dear {{participantName}},\n\nThank you for attending {{eventName}}. We hope you had a great experience!\n\nWe would love to hear your feedback.\n\nBest regards,\nThe Organizing Team' }
    ];
    res.json({ success: true, data: templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Test email configuration
router.get('/communication/test', async (req, res) => {
  try {
    const result = await testEmailConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Email configuration test failed',
      error: error.message
    });
  }
});

// Debug endpoint to check participants
router.get('/communication/debug-participants/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    if (!isValidObjectId(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID' });
    }

    const event = await Event.findById(eventId);
    const allParticipants = await Participant.find({ event: eventId });
    const attended = await Attendance.find({ event: eventId });
    const certified = await Certificate.find({ event: eventId });

    // Also get ALL participants to check if event field issue
    const allParticipantsInDB = await Participant.find({}).limit(5);

    res.json({
      success: true,
      data: {
        eventId,
        eventExists: !!event,
        eventTitle: event?.title || 'N/A',
        totalParticipants: allParticipants.length,
        participants: allParticipants.map(p => ({
          id: p._id,
          name: p.name,
          email: p.email,
          eventField: p.event?.toString(),
          registrationStatus: p.registrationStatus,
          attendanceStatus: p.attendanceStatus
        })),
        attendanceRecords: attended.length,
        certificateRecords: certified.length,
        sampleParticipantsInDB: allParticipantsInDB.map(p => ({
          id: p._id,
          name: p.name,
          eventId: p.event?.toString()
        }))
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/communication/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    // Permission check: canSendEmails
    const perm = await checkPermission(req, eventId, 'canSendEmails');
    if (!perm.allowed) return res.status(perm.status).json({ success: false, message: perm.message });

    if (!isValidObjectId(eventId)) return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    const communications = await Communication.find({ event: eventId }).populate('sentBy', 'name email').sort({ sentAt: -1 });
    res.json({ success: true, count: communications.length, data: communications });
  } catch (error) {
    console.error('Error fetching communication history:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/communication/email', async (req, res) => {
  try {
    const { eventId, subject, message, recipientFilter = 'ALL', template = 'CUSTOM', organizerId } = req.body;
    // Permission check: canSendEmails
    const perm = await checkPermission(req, eventId, 'canSendEmails');
    if (!perm.allowed) return res.status(perm.status).json({ success: false, message: perm.message });

    console.log('\n📧 Email Send Request:');
    console.log('Event ID:', eventId);
    console.log('Subject:', subject);
    console.log('Recipient Filter:', recipientFilter);
    console.log('Organizer ID:', organizerId);

    if (!isValidObjectId(eventId)) {
      console.log('❌ Invalid event ID format');
      return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    }

    // Get event details
    const event = await Event.findById(eventId);
    if (!event) {
      console.log('❌ Event not found:', eventId);
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    console.log('✅ Event found:', event.title);

    // Get all participants
    const allParticipants = await Participant.find({ event: eventId });
    console.log(`📊 Total participants for event '${event.title}' (${eventId}): ${allParticipants.length}`);
    if (allParticipants.length > 0) {
      console.log('First participant:', { name: allParticipants[0].name, email: allParticipants[0].email, status: allParticipants[0].registrationStatus });
    }
    let recipients = [];

    // Filter recipients based on criteria
    switch (recipientFilter) {
      case 'REGISTERED':
        recipients = allParticipants.filter(p => p.registrationStatus === 'CONFIRMED');
        break;
      case 'ATTENDED':
        const attendedIds = (await Attendance.find({ event: eventId })).map(a => a.participant.toString());
        recipients = allParticipants.filter(p => attendedIds.includes(p._id.toString()));
        break;
      case 'NOT_ATTENDED':
        const attendedIds2 = (await Attendance.find({ event: eventId })).map(a => a.participant.toString());
        recipients = allParticipants.filter(p => !attendedIds2.includes(p._id.toString()));
        break;
      case 'CERTIFIED':
        const certifiedIds = (await Certificate.find({ event: eventId, status: 'SENT' })).map(c => c.participant.toString());
        recipients = allParticipants.filter(p => certifiedIds.includes(p._id.toString()));
        break;
      case 'NOT_CERTIFIED':
        const certifiedIds2 = (await Certificate.find({ event: eventId })).map(c => c.participant.toString());
        recipients = allParticipants.filter(p => !certifiedIds2.includes(p._id.toString()));
        break;
      default:
        recipients = allParticipants;
    }

    const recipientCount = recipients.length;
    console.log(`Recipients after filter '${recipientFilter}': ${recipientCount}`);

    if (recipientCount === 0) {
      return res.status(400).json({
        success: false,
        message: `No recipients found for filter '${recipientFilter}'. Total participants: ${allParticipants.length}. Please check if participants match this filter criteria.`
      });
    }

    // Send emails using the email service
    console.log(`Sending emails to ${recipientCount} participants...`);
    const emailResults = await sendBulkEmails(recipients, subject, message, event);

    // Save communication record
    const communication = await Communication.create({
      event: eventId,
      subject,
      message,
      type: 'EMAIL',
      template,
      recipientFilter,
      recipientCount: emailResults.sent,
      sentBy: organizerId,
      status: emailResults.sent > 0 ? 'SENT' : 'FAILED'
    });

    // Log email sending
    if (emailResults.sent > 0) {
      console.log('📧 [Email] Creating log for bulk email send...');
      const organizer = (organizerId && isValidObjectId(organizerId)) ? await User.findById(organizerId) : null;
      await Log.create({
        eventId: event._id,
        eventName: event.title || event.name,
        actionType: 'EMAIL_SENT',
        action: 'Bulk email sent to participants',
        details: `Sent "${subject}" to ${emailResults.sent} participants (Filter: ${recipientFilter})${emailResults.failed > 0 ? `. ${emailResults.failed} failed.` : ''}`,
        entityType: 'COMMUNICATION',
        actorType: organizer ? (organizer.role === 'ADMIN' ? 'ADMIN' : 'ORGANIZER') : 'SYSTEM',
        actorId: organizer?._id,
        actorName: organizer?.name || 'System',
        actorEmail: organizer?.email,
        severity: emailResults.failed > 0 ? 'WARNING' : 'INFO',
        newState: { subject, recipientFilter, sent: emailResults.sent, failed: emailResults.failed, total: recipientCount }
      });
      console.log('✅ [Email] Log created successfully');
    }

    res.json({
      success: true,
      message: `Successfully sent ${emailResults.sent} emails. ${emailResults.failed > 0 ? `Failed to send ${emailResults.failed} emails.` : ''}`,
      data: {
        ...communication.toObject(),
        emailResults: {
          sent: emailResults.sent,
          failed: emailResults.failed,
          total: recipientCount
        }
      }
    });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending emails',
      error: error.message
    });
  }
});

router.post('/communication/announcement', async (req, res) => {
  try {
    const { eventId, message, type = 'INFO', organizerId } = req.body;
    // Permission check: canSendEmails
    const perm = await checkPermission(req, eventId, 'canSendEmails');
    if (!perm.allowed) return res.status(perm.status).json({ success: false, message: perm.message });

    if (!isValidObjectId(eventId)) return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    // Create announcement with message as subject too (for consistency)
    const subject = `[${type}] ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`;
    const announcement = await Communication.create({
      event: eventId,
      subject,
      message,
      type: 'ANNOUNCEMENT',
      template: 'CUSTOM',
      recipientFilter: 'ALL',
      recipientCount: 0,
      sentBy: organizerId,
      status: 'SENT'
    });

    // Log announcement creation
    console.log('📢 [Announcement] Creating log for announcement...');
    const organizer = (organizerId && isValidObjectId(organizerId)) ? await User.findById(organizerId) : null;
    await Log.create({
      eventId: event._id,
      eventName: event.title || event.name,
      actionType: 'ANNOUNCEMENT_POSTED',
      action: 'Announcement posted',
      details: `Posted announcement: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}" (Type: ${type})`,
      entityType: 'COMMUNICATION',
      actorType: organizer ? (organizer.role === 'ADMIN' ? 'ADMIN' : 'ORGANIZER') : 'SYSTEM',
      actorId: organizer?._id,
      actorName: organizer?.name || 'System',
      actorEmail: organizer?.email,
      severity: type === 'CRITICAL' ? 'CRITICAL' : type === 'WARNING' ? 'WARNING' : 'INFO',
      newState: { type, messageLength: message.length }
    });
    console.log('✅ [Announcement] Log created successfully');

    res.json({ success: true, message: 'Announcement created successfully', data: announcement });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Team Access routes
router.get('/team/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    if (!isValidObjectId(eventId)) return res.status(400).json({ success: false, message: 'Invalid event ID format' });

    // Team Lead only: check if user is the event's team lead
    const userId = req.user._id.toString();
    const eventCheck = await Event.findById(eventId);
    if (!eventCheck) return res.status(404).json({ success: false, message: 'Event not found' });
    const isLead = (eventCheck.teamLead && eventCheck.teamLead.toString() === userId) ||
      eventCheck.teamMembers?.some(m => m.user.toString() === userId && m.role === 'TEAM_LEAD' && m.status === 'active') ||
      req.user.role === 'ADMIN';
    if (!isLead) return res.status(403).json({ success: false, message: 'Only Team Leads can manage team members' });

    const event = await Event.findById(eventId).populate('teamMembers.user', 'name email role').select('teamMembers');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    const teamMembers = event.teamMembers.map(member => ({ 
      _id: member._id || member.user._id, 
      user: member.user, 
      role: member.role || 'TEAM_MEMBER', 
      permissions: member.permissions || { canViewParticipants: true, canManageAttendance: true, canSendEmails: false, canGenerateCertificates: false, canEditEvent: false }, 
      addedAt: member.addedAt || new Date(),
      startTime: member.startTime || null,
      endTime: member.endTime || null,
      status: member.status || 'active'
    }));
    res.json({ success: true, data: teamMembers });
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ success: false, message: 'Error fetching team members', error: error.message });
  }
});

router.post('/team/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    if (!isValidObjectId(eventId)) return res.status(400).json({ success: false, message: 'Invalid event ID format' });

    // Team Lead only
    const userId = req.user._id.toString();
    const eventCheck = await Event.findById(eventId);
    if (!eventCheck) return res.status(404).json({ success: false, message: 'Event not found' });
    const isLead = (eventCheck.teamLead && eventCheck.teamLead.toString() === userId) ||
      eventCheck.teamMembers?.some(m => m.user.toString() === userId && m.role === 'TEAM_LEAD' && m.status === 'active') ||
      req.user.role === 'ADMIN';
    if (!isLead) return res.status(403).json({ success: false, message: 'Only Team Leads can add team members' });

    const { email, name, password, permissions, startTime, endTime } = req.body;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ success: false, message: 'Invalid email format' });
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    
    let user = await User.findOne({ email });
    
    if (user) {
      // Check for existing active members with overlapping time periods
      const existingActiveMembers = event.teamMembers?.filter(
        m => m.user.toString() === user._id.toString() && m.status === 'active'
      ) || [];
      
      if (existingActiveMembers.length > 0) {
        const newStart = startTime && typeof startTime === 'string' && startTime.trim() !== '' 
          ? new Date(startTime) 
          : new Date(); // If no start time, starts now
        const newEnd = endTime && typeof endTime === 'string' && endTime.trim() !== '' 
          ? new Date(endTime) 
          : null; // null means no end
        
        // Check if there's any overlap with existing assignments
        const hasOverlap = existingActiveMembers.some(existing => {
          const existingStart = existing.startTime ? new Date(existing.startTime) : new Date(existing.addedAt);
          const existingEnd = existing.endTime ? new Date(existing.endTime) : null;
          
          // If either has no end date, they overlap if new starts before existing ends
          if (!newEnd || !existingEnd) {
            // Check if they overlap in any way
            if (!existingEnd && !newEnd) return true; // Both ongoing indefinitely - overlap
            if (!existingEnd) return newStart < existingStart ? false : true; // Existing ongoing
            if (!newEnd) return existingStart < newStart ? existingEnd > newStart : true; // New ongoing
          }
          
          // Both have end dates - check for any overlap
          return (newStart < existingEnd && newEnd > existingStart);
        });
        
        if (hasOverlap) {
          return res.status(400).json({ 
            success: false, 
            message: 'User already has an active assignment that overlaps with this time period. Please remove the existing assignment or set non-overlapping time bounds.'
          });
        }
      }
    }
    
    if (!user) {
      const memberPassword = password || '12345678';
      const hashedPassword = await bcrypt.hash(memberPassword, 10);
      user = await User.create({ email, name: name || email.split('@')[0], password: hashedPassword, role: 'EVENT_STAFF', isActive: true, phone: '' });
      console.log(`User created: ${email}, password: ${memberPassword}`);
    }
    
    const newMember = { 
      user: user._id, 
      role: 'TEAM_MEMBER', 
      permissions: permissions || { canViewParticipants: true, canManageAttendance: true, canSendEmails: false, canGenerateCertificates: false, canEditEvent: false }, 
      addedAt: new Date(),
      startTime: (startTime && typeof startTime === 'string' && startTime.trim() !== '') ? new Date(startTime) : null,
      endTime: (endTime && typeof endTime === 'string' && endTime.trim() !== '') ? new Date(endTime) : null,
      status: 'active'
    };
    if (!event.teamMembers) event.teamMembers = [];
    event.teamMembers.push(newMember);
    await event.save();

    // Log team member addition
    const organizerId = req.body.organizerId;
    const organizer = (organizerId && isValidObjectId(organizerId)) ? await User.findById(organizerId) : null;
    await Log.create({
      eventId: event._id,
      eventName: event.title || event.name,
      actionType: 'TEAM_MEMBER_ADDED',
      action: 'Team member added',
      details: `Added ${user.name || user.email} as team member`,
      entityType: 'TEAM',
      actorType: organizer ? (organizer.role === 'ADMIN' ? 'ADMIN' : 'ORGANIZER') : 'SYSTEM',
      actorId: organizer?._id,
      actorName: organizer?.name || 'Organizer',
      actorEmail: organizer?.email,
      severity: 'INFO',
      newState: { memberName: user.name, memberEmail: user.email, role: 'TEAM_MEMBER', permissions: newMember.permissions }
    });

    res.status(201).json({ 
      success: true, 
      message: 'Team member added successfully', 
      data: { 
        _id: newMember.user, 
        user: { 
          _id: user._id, 
          name: user.name, 
          email: user.email 
        }, 
        role: newMember.role, 
        permissions: newMember.permissions, 
        addedAt: newMember.addedAt,
        startTime: newMember.startTime,
        endTime: newMember.endTime,
        status: newMember.status
      } 
    });
  } catch (error) {
    console.error('Error adding team member:', error);
    res.status(500).json({ success: false, message: 'Error adding team member', error: error.message });
  }
});

router.delete('/team/:eventId/:memberId', async (req, res) => {
  try {
    const { eventId, memberId } = req.params;
    const { organizerId } = req.body;

    // Team Lead only
    const userId = req.user._id.toString();
    const checkEvent = await Event.findById(eventId);
    if (!checkEvent) return res.status(404).json({ success: false, message: 'Event not found' });
    const isLead = (checkEvent.teamLead && checkEvent.teamLead.toString() === userId) ||
      checkEvent.teamMembers?.some(m => m.user.toString() === userId && m.role === 'TEAM_LEAD' && m.status === 'active') ||
      req.user.role === 'ADMIN';
    if (!isLead) return res.status(403).json({ success: false, message: 'Only Team Leads can remove team members' });

    const event = await Event.findById(eventId).populate('teamMembers.user', 'name email');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    const memberIndex = event.teamMembers?.findIndex(m => m.user._id.toString() === memberId || m._id?.toString() === memberId);
    if (memberIndex === -1) return res.status(404).json({ success: false, message: 'Team member not found' });

    const removedMember = event.teamMembers[memberIndex];
    const memberUser = removedMember.user;

    event.teamMembers.splice(memberIndex, 1);
    await event.save();

    // Log team member removal
    const organizer = (organizerId && isValidObjectId(organizerId)) ? await User.findById(organizerId) : null;
    await Log.create({
      eventId: event._id,
      eventName: event.title || event.name,
      actionType: 'TEAM_MEMBER_REMOVED',
      action: 'Team member removed',
      details: `Removed ${memberUser.name || memberUser.email} from team`,
      entityType: 'TEAM',
      actorType: organizer ? (organizer.role === 'ADMIN' ? 'ADMIN' : 'ORGANIZER') : 'SYSTEM',
      actorId: organizer?._id,
      actorName: organizer?.name || 'Organizer',
      actorEmail: organizer?.email,
      severity: 'WARNING',
      oldState: { memberName: memberUser.name, memberEmail: memberUser.email, role: removedMember.role }
    });

    res.json({ success: true, message: 'Team member removed successfully' });
  } catch (error) {
    console.error('Error removing team member:', error);
    res.status(500).json({ success: false, message: 'Error removing team member', error: error.message });
  }
});

router.put('/team/:eventId/:memberId/permissions', async (req, res) => {
  try {
    const { eventId, memberId } = req.params;
    const { permissions, organizerId } = req.body;

    // Team Lead only
    const userId = req.user._id.toString();
    const checkEvent = await Event.findById(eventId);
    if (!checkEvent) return res.status(404).json({ success: false, message: 'Event not found' });
    const isLead = (checkEvent.teamLead && checkEvent.teamLead.toString() === userId) ||
      checkEvent.teamMembers?.some(m => m.user.toString() === userId && m.role === 'TEAM_LEAD' && m.status === 'active') ||
      req.user.role === 'ADMIN';
    if (!isLead) return res.status(403).json({ success: false, message: 'Only Team Leads can update permissions' });

    console.log('🔧 [Team Permissions] Update request received:', {
      eventId,
      memberId,
      permissions,
      organizerId
    });

    if (!isValidObjectId(eventId) || !isValidObjectId(memberId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    console.log('🔍 [Team Permissions] Team members in event:', event.teamMembers?.length);

    const member = event.teamMembers?.find(m => m.user.toString() === memberId || m._id?.toString() === memberId);
    if (!member) {
      console.error('❌ [Team Permissions] Member not found:', { memberId, teamMembersCount: event.teamMembers?.length });
      return res.status(404).json({ success: false, message: 'Team member not found' });
    }

    console.log('✅ [Team Permissions] Found member:', { userId: member.user, memberId: member._id });

    const oldPermissions = { ...member.permissions };

    // Update the member's permissions
    member.permissions = { ...member.permissions, ...permissions };
    await event.save();

    // Return the updated event with populated team members
    const updatedEvent = await Event.findById(eventId)
      .populate('teamMembers.user', 'name email role');

    const memberUser = updatedEvent.teamMembers.find(m => m.user._id.toString() === memberId);

    // Log permissions update
    const organizer = (organizerId && isValidObjectId(organizerId)) ? await User.findById(organizerId) : null;

    console.log('📝 [Team Permissions] Creating log entry:', {
      organizerId,
      organizerFound: !!organizer,
      organizerName: organizer?.name
    });

    await Log.create({
      eventId: event._id,
      eventName: event.title || event.name,
      actionType: 'TEAM_PERMISSIONS_UPDATED',
      action: 'Team member permissions updated',
      details: `Updated permissions for ${memberUser?.user?.name || 'team member'}`,
      entityType: 'TEAM',
      actorType: organizer ? (organizer.role === 'ADMIN' ? 'ADMIN' : 'ORGANIZER') : 'SYSTEM',
      actorId: organizer?._id,
      actorName: organizer?.name || 'Organizer',
      actorEmail: organizer?.email,
      severity: 'INFO',
      oldState: { permissions: oldPermissions },
      newState: { permissions: member.permissions }
    });

    console.log('✅ [Team Permissions] Log entry created successfully');

    res.json({
      success: true,
      data: { permissions: member.permissions },
      message: 'Permissions updated successfully'
    });
  } catch (error) {
    console.error('Error updating permissions:', error);
    res.status(500).json({ success: false, message: 'Error updating permissions', error: error.message });
  }
});

// ===== SPEAKER MANAGEMENT ROUTES =====

// @desc    Get all registered speakers
// @route   GET /api/organizer/speakers
router.get('/speakers', async (req, res) => {
  try {
    const { search } = req.query;
    const filter = { isActive: true };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { specializations: { $regex: search, $options: 'i' } },
      ];
    }

    const speakers = await SpeakerAuth.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    // Get review stats for each speaker
    const speakersWithStats = await Promise.all(
      speakers.map(async (speaker) => {
        const reviews = await SpeakerReview.find({ speaker: speaker._id });
        const avgRating = reviews.length > 0
          ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
          : 0;
        const sessionCount = await Session.countDocuments({ speaker: speaker._id });

        return {
          ...speaker.toObject(),
          avgRating: parseFloat(avgRating),
          totalReviews: reviews.length,
          totalSessions: sessionCount,
        };
      })
    );

    res.json({
      success: true,
      data: speakersWithStats,
    });
  } catch (error) {
    console.error('Get speakers error:', error);
    res.status(500).json({ success: false, message: 'Error fetching speakers', error: error.message });
  }
});

// @desc    Get single speaker profile with past records and reviews
// @route   GET /api/organizer/speakers/:id
router.get('/speakers/:id', async (req, res) => {
  try {
    const speaker = await SpeakerAuth.findById(req.params.id).select('-password');

    if (!speaker) {
      return res.status(404).json({ success: false, message: 'Speaker not found' });
    }

    const sessions = await Session.find({ speaker: speaker._id })
      .populate('event', 'title startDate endDate status')
      .sort({ 'time.start': -1 });

    const reviews = await SpeakerReview.find({ speaker: speaker._id })
      .populate('organizer', 'name')
      .populate('event', 'title')
      .populate('session', 'title')
      .sort({ createdAt: -1 });

    const avgRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        ...speaker.toObject(),
        sessions,
        reviews,
        avgRating: parseFloat(avgRating),
        totalReviews: reviews.length,
      },
    });
  } catch (error) {
    console.error('Get speaker profile error:', error);
    res.status(500).json({ success: false, message: 'Error fetching speaker profile', error: error.message });
  }
});

// @desc    Add a review/rating for a speaker
// @route   POST /api/organizer/speakers/:id/review
router.post('/speakers/:id/review', async (req, res) => {
  try {
    const { rating, review, eventId, sessionId } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const speaker = await SpeakerAuth.findById(req.params.id);
    if (!speaker) {
      return res.status(404).json({ success: false, message: 'Speaker not found' });
    }

    // Get organizer ID from query param or request user
    const organizerId = req.query.organizerId || req.body.organizerId;
    if (!organizerId) {
      return res.status(400).json({ success: false, message: 'Organizer ID is required' });
    }

    const reviewData = {
      speaker: req.params.id,
      organizer: organizerId,
      rating,
      review: review || '',
    };
    if (eventId) reviewData.event = eventId;
    if (sessionId) reviewData.session = sessionId;

    // Upsert — one review per organizer per session
    const newReview = await SpeakerReview.findOneAndUpdate(
      { organizer: organizerId, session: sessionId || null },
      reviewData,
      { upsert: true, new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Review submitted successfully',
      data: newReview,
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ success: false, message: 'Error adding review', error: error.message });
  }
});

// @desc    Get recommended speakers for an event (AI Recommendation Engine)
// @route   GET /api/organizer/speakers/recommend/:eventId
router.get('/speakers/recommend/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { limit = 10, minRating = 0 } = req.query;

    if (!isValidObjectId(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const recommendations = await getRecommendedSpeakers(eventId, {
      limit: parseInt(limit) || 10,
      minRating: parseFloat(minRating) || 0,
    });

    res.json({
      success: true,
      event: {
        _id: event._id,
        title: event.title,
        category: event.category,
        tags: event.tags,
        type: event.type,
        startDate: event.startDate,
        endDate: event.endDate,
      },
      count: recommendations.length,
      data: recommendations,
    });
  } catch (error) {
    console.error('Speaker recommendation error:', error);
    res.status(500).json({ success: false, message: 'Error getting recommendations', error: error.message });
  }
});

// @desc    Send speaker request/invitation for an event (top 3 from recommendations)
// @route   POST /api/organizer/speakers/request
router.post('/speakers/request', async (req, res) => {
  try {
    const { eventId, speakers } = req.body;
    // speakers: [{ speakerId, matchScore, rank, message }]

    if (!eventId || !speakers || !Array.isArray(speakers) || speakers.length === 0) {
      return res.status(400).json({ success: false, message: 'Event ID and speakers array are required' });
    }

    if (speakers.length > 3) {
      return res.status(400).json({ success: false, message: 'You can send requests to a maximum of 3 speakers at a time' });
    }

    if (!isValidObjectId(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const organizerId = req.user._id;
    const results = [];
    const errors = [];

    for (const s of speakers) {
      try {
        if (!isValidObjectId(s.speakerId)) {
          errors.push({ speakerId: s.speakerId, error: 'Invalid speaker ID' });
          continue;
        }

        const speaker = await SpeakerAuth.findById(s.speakerId);
        if (!speaker) {
          errors.push({ speakerId: s.speakerId, error: 'Speaker not found' });
          continue;
        }

        // Check if request already exists
        const existing = await SpeakerRequest.findOne({ speaker: s.speakerId, event: eventId });
        if (existing) {
          errors.push({ speakerId: s.speakerId, name: speaker.name, error: 'Request already sent', status: existing.status });
          continue;
        }

        const request = await SpeakerRequest.create({
          speaker: s.speakerId,
          event: eventId,
          organizer: organizerId,
          message: s.message || `You are invited to speak at "${event.title}". Your expertise is a great match for this event.`,
          matchScore: s.matchScore || 0,
          rank: s.rank || 0,
          status: 'pending',
        });

        const populated = await SpeakerRequest.findById(request._id)
          .populate('speaker', 'name email specializations')
          .populate('event', 'title category type startDate endDate')
          .populate('organizer', 'name email');

        results.push(populated);
      } catch (err) {
        if (err.code === 11000) {
          errors.push({ speakerId: s.speakerId, error: 'Request already exists for this speaker and event' });
        } else {
          errors.push({ speakerId: s.speakerId, error: err.message });
        }
      }
    }

    res.status(201).json({
      success: true,
      message: `${results.length} request(s) sent successfully${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
      data: results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Send speaker request error:', error);
    res.status(500).json({ success: false, message: 'Error sending speaker requests', error: error.message });
  }
});

// @desc    Get speaker request status for an event (check which speakers already have requests)
// @route   GET /api/organizer/speakers/requests/:eventId
router.get('/speakers/requests/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!isValidObjectId(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID' });
    }

    const requests = await SpeakerRequest.find({ event: eventId })
      .populate('speaker', 'name email specializations headshot')
      .populate('event', 'title category type startDate endDate')
      .populate('organizer', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    console.error('Get speaker requests error:', error);
    res.status(500).json({ success: false, message: 'Error fetching speaker requests', error: error.message });
  }
});

// @desc    Create a session and assign to a speaker
// @route   POST /api/organizer/sessions
router.post('/sessions', async (req, res) => {
  try {
    const { eventId, speakerId, title, description, time, room, track } = req.body;

    // Permission check: canEditEvent (speaker/session management)
    const perm = await checkPermission(req, eventId, 'canEditEvent');
    if (!perm.allowed) return res.status(perm.status).json({ success: false, message: perm.message });

    if (!eventId || !speakerId || !title) {
      return res.status(400).json({ success: false, message: 'Event, speaker, and title are required' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const speaker = await SpeakerAuth.findById(speakerId);
    if (!speaker) {
      return res.status(404).json({ success: false, message: 'Speaker not found' });
    }

    const session = await Session.create({
      event: eventId,
      speaker: speakerId,
      title,
      description: description || '',
      time: time || {},
      room: room || '',
      track: track || '',
      status: 'pending',
      assignment: {
        requestedAt: new Date(),
        rejectionReason: '',
      },
    });

    const populated = await Session.findById(session._id)
      .populate('event', 'title startDate endDate')
      .populate('speaker', 'name email');

    res.status(201).json({
      success: true,
      message: 'Session created and sent to speaker for confirmation',
      data: populated,
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ success: false, message: 'Error creating session', error: error.message });
  }
});

// @desc    Get all sessions for an event
// @route   GET /api/organizer/sessions/:eventId
router.get('/sessions/:eventId', async (req, res) => {
  try {
    const sessions = await Session.find({ event: req.params.eventId })
      .populate('speaker', 'name email headshot specializations')
      .sort({ 'time.start': 1 });

    res.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ success: false, message: 'Error fetching sessions', error: error.message });
  }
});

// @desc    Update session status or details (organizer)
// @route   PUT /api/organizer/sessions/:sessionId
router.put('/sessions/:sessionId', async (req, res) => {
  try {
    const { title, description, time, room, track, status, registeredCount, checkedInCount } = req.body;

    const session = await Session.findById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Permission check: canEditEvent
    const perm = await checkPermission(req, session.event.toString(), 'canEditEvent');
    if (!perm.allowed) return res.status(perm.status).json({ success: false, message: perm.message });

    if (title !== undefined) session.title = title;
    if (description !== undefined) session.description = description;
    if (time !== undefined) session.time = time;
    if (room !== undefined) session.room = room;
    if (track !== undefined) session.track = track;
    if (status !== undefined) session.status = status;
    if (registeredCount !== undefined) session.registeredCount = registeredCount;
    if (checkedInCount !== undefined) session.checkedInCount = checkedInCount;

    await session.save();

    const populated = await Session.findById(session._id)
      .populate('speaker', 'name email')
      .populate('event', 'title');

    res.json({
      success: true,
      message: 'Session updated successfully',
      data: populated,
    });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ success: false, message: 'Error updating session', error: error.message });
  }
});

// @desc    Delete a session
// @route   DELETE /api/organizer/sessions/:sessionId
router.delete('/sessions/:sessionId', async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Permission check: canEditEvent
    const perm = await checkPermission(req, session.event.toString(), 'canEditEvent');
    if (!perm.allowed) return res.status(perm.status).json({ success: false, message: perm.message });

    await Session.findByIdAndDelete(req.params.sessionId);

    res.json({
      success: true,
      message: 'Session deleted successfully',
    });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ success: false, message: 'Error deleting session', error: error.message });
  }
});

// @desc    Approve/reject a session update from speaker
// @route   PUT /api/organizer/sessions/:sessionId/updates/:updateIndex
router.put('/sessions/:sessionId/updates/:updateIndex', verifyToken, isOrganizer, async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be approved or rejected' });
    }

    const session = await Session.findById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Permission check: canEditEvent
    const perm = await checkPermission(req, session.event.toString(), 'canEditEvent');
    if (!perm.allowed) return res.status(perm.status).json({ success: false, message: perm.message });

    const updateIndex = parseInt(req.params.updateIndex);
    if (updateIndex < 0 || updateIndex >= session.updates.length) {
      return res.status(400).json({ success: false, message: 'Invalid update index' });
    }

    session.updates[updateIndex].status = status;
    await session.save();

    res.json({
      success: true,
      message: `Update ${status} successfully`,
      data: session,
    });
  } catch (error) {
    console.error('Approve/reject update error:', error);
    res.status(500).json({ success: false, message: 'Error updating status', error: error.message });
  }
});

// @route   GET /api/organizer/logs
// @desc    Get logs for events owned by the organizer (Team Lead)
// @access  Private/Organizer
router.get('/logs', async (req, res) => {
  try {
    const organizerId = req.query.organizerId;

    // Security: Require organizerId to prevent returning all logs
    if (!organizerId) {
      console.warn('⚠️ [Logs] No organizerId provided in query');
      return res.status(400).json({
        success: false,
        message: 'Organizer ID is required',
      });
    }

    console.log('🔍 [Logs] Fetching logs for organizer:', organizerId);

    // Debug: Check total logs in database
    const totalLogsInDb = await Log.countDocuments({});
    console.log('📊 [Logs] Total logs in database:', totalLogsInDb);

    // Get query parameters for filtering
    const {
      eventId,
      participantId,
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
    } = req.query;

    // Find all events owned by this organizer (created by them, assigned as team lead, or team member)
    const ownedEvents = await Event.find({
      $or: [
        { createdBy: organizerId },
        { teamLead: organizerId },
        { 'teamMembers.user': organizerId }
      ]
    }).select('_id title');

    console.log('📋 [Logs] Found events:', ownedEvents.length, ownedEvents.map(e => ({ id: e._id, title: e.title })));

    const eventIds = ownedEvents.map(e => e._id);
    console.log('🎯 [Logs] Event IDs to query:', eventIds.map(id => id.toString()));

    if (eventIds.length === 0) {
      console.log('⚠️ [Logs] No events found for this organizer');
      return res.json({
        success: true,
        logs: [],
        pagination: {
          total: 0,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: 0,
        },
      });
    }

    // Build query - only logs for owned events
    const query = {
      eventId: { $in: eventIds },
    };

    // Debug: Check logs for these events before filters
    const logsForEvents = await Log.countDocuments({ eventId: { $in: eventIds } });
    console.log('🔢 [Logs] Total logs for these events (before filters):', logsForEvents);

    // Apply filters
    if (eventId && isValidObjectId(eventId)) {
      query.eventId = eventId;
    }

    if (participantId && isValidObjectId(participantId)) {
      query.participantId = participantId;
    }

    if (participantName) {
      query.$or = [
        { participantName: { $regex: participantName, $options: 'i' } },
        { participantEmail: { $regex: participantName, $options: 'i' } },
      ];
    }

    if (actionType) {
      query.actionType = actionType;
    }

    if (entityType) {
      query.entityType = entityType;
    }

    if (actorType) {
      query.actorType = actorType;
    }

    if (severity) {
      query.severity = severity;
    }

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

    console.log('🔎 [Logs] Query:', JSON.stringify(query, null, 2));
    console.log('📄 [Logs] Pagination - Page:', page, 'Limit:', limit, 'Skip:', skip);

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

    console.log('✅ [Logs] Found', total, 'total logs, returning', logs.length, 'logs');
    if (logs.length > 0) {
      console.log('📝 [Logs] Sample log:', {
        action: logs[0].action,
        actionType: logs[0].actionType,
        eventName: logs[0].eventName,
        createdAt: logs[0].createdAt
      });
    }

    // Get unique events for filter dropdown
    const uniqueEvents = await Event.find({
      _id: { $in: eventIds }
    }).select('_id title').lean();

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
        events: uniqueEvents,
        actionTypes: [
          // Event Lifecycle
          'EVENT_CREATED',
          'EVENT_UPDATED',
          'EVENT_STATE_CHANGED',
          'ROLE_ASSIGNED',
          'ROLE_CHANGED',

          // Participants
          'STUDENT_REGISTERED',
          'PARTICIPANT_ADDED',
          'PARTICIPANT_UPDATED',
          'PARTICIPANT_REMOVED',

          // Attendance
          'QR_GENERATED',
          'ATTENDANCE_RECORDED',
          'ATTENDANCE_MANUAL',
          'ATTENDANCE_INVALIDATED',

          // Certificates
          'CERTIFICATES_GENERATED',
          'CERTIFICATES_SENT',
          'CERTIFICATE_RESENT',
          'CERTIFICATE_REQUEST_APPROVED',
          'CERTIFICATE_REQUEST_REJECTED',

          // Communication
          'EMAIL_SENT',
          'ANNOUNCEMENT_POSTED',

          // Event Updates/Timeline
          'EVENT_UPDATE_POSTED',
          'EVENT_UPDATE_DELETED',
          'EVENT_UPDATE_PINNED',
          'EVENT_UPDATE_UNPINNED',

          // Team Management
          'TEAM_MEMBER_ADDED',
          'TEAM_MEMBER_REMOVED',
          'TEAM_PERMISSIONS_UPDATED',
        ],
        entityTypes: ['EVENT', 'PARTICIPATION', 'ATTENDANCE', 'CERTIFICATE', 'ROLE', 'COMMUNICATION', 'TEAM'],
        actorTypes: ['STUDENT', 'ORGANIZER', 'ADMIN', 'SYSTEM'],
        severities: ['INFO', 'WARNING', 'CRITICAL'],
      },
    });
  } catch (error) {
    console.error('Error fetching organizer logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching logs',
      error: error.message,
    });
  }
});

// ============================================================================
// RETROACTIVE CHANGE & AUDIT TRAIL ENGINE
// ============================================================================

// @desc    Invalidate attendance record (with reason)
// @route   POST /api/organizer/attendance/:attendanceId/invalidate
router.post('/attendance/:attendanceId/invalidate', async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { reason, organizerId } = req.body;

    console.log('🔄 [Attendance Invalidation] Starting invalidation for:', attendanceId);

    // Validate reason
    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required and must be at least 10 characters'
      });
    }

    // Find attendance record
    const attendance = await Attendance.findById(attendanceId)
      .populate('participant', 'name email')
      .populate('event', 'title');

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    if (!attendance.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Attendance record is already invalidated'
      });
    }

    // Get organizer info
    const organizer = organizerId ? await User.findById(organizerId) : null;

    // Store old state for audit
    const oldState = {
      isValid: attendance.isValid,
      status: attendance.status,
      scannedAt: attendance.scannedAt
    };

    // Update attendance record (soft delete)
    attendance.isValid = false;
    attendance.invalidatedAt = Date.now();
    attendance.invalidatedBy = organizerId;
    attendance.invalidationReason = reason.trim();
    attendance.version += 1;

    await attendance.save();

    console.log('✅ [Attendance Invalidation] Record invalidated successfully');

    // Create audit log
    await Log.create({
      eventId: attendance.event._id,
      eventName: attendance.event.title,
      participantId: attendance.participant._id,
      participantName: attendance.participant.name,
      participantEmail: attendance.participant.email,
      actionType: 'ATTENDANCE_INVALIDATED',
      entityType: 'ATTENDANCE',
      action: 'Attendance record invalidated',
      details: `Attendance invalidated for ${attendance.participant.name}`,
      actorType: organizer ? (organizer.role === 'ADMIN' ? 'ADMIN' : 'ORGANIZER') : 'SYSTEM',
      actorId: organizer?._id,
      actorName: organizer?.name || 'Organizer',
      actorEmail: organizer?.email || '',
      severity: 'WARNING',
      reason: reason.trim(),
      oldState,
      newState: {
        isValid: false,
        invalidatedAt: attendance.invalidatedAt,
        invalidationReason: attendance.invalidationReason
      }
    });

    console.log('✅ [Attendance Invalidation] Audit log created');

    res.json({
      success: true,
      message: 'Attendance record invalidated successfully',
      data: attendance
    });
  } catch (error) {
    console.error('❌ [Attendance Invalidation] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error invalidating attendance record',
      error: error.message
    });
  }
});

// @desc    Revoke certificate (with reason)
// @route   POST /api/organizer/certificates/:certificateId/revoke
router.post('/certificates/:certificateId/revoke', async (req, res) => {
  try {
    const { certificateId } = req.params;
    const { reason, organizerId } = req.body;

    console.log('🔄 [Certificate Revocation] Starting revocation for:', certificateId);

    // Validate reason
    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required and must be at least 10 characters'
      });
    }

    // Find certificate
    const certificate = await Certificate.findById(certificateId)
      .populate('participant', 'name email')
      .populate('event', 'title');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    if (!certificate.isValid || certificate.status === 'REVOKED') {
      return res.status(400).json({
        success: false,
        message: 'Certificate is already revoked'
      });
    }

    // Get organizer info
    const organizer = organizerId ? await User.findById(organizerId) : null;

    // Store old state for audit
    const oldState = {
      isValid: certificate.isValid,
      status: certificate.status,
      issuedAt: certificate.issuedAt
    };

    // Update certificate (revoke)
    certificate.isValid = false;
    certificate.status = 'REVOKED';
    certificate.revokedAt = Date.now();
    certificate.revokedBy = organizerId;
    certificate.revocationReason = reason.trim();
    certificate.version += 1;

    await certificate.save();

    // Update participant certificate status
    await Participant.findByIdAndUpdate(certificate.participant._id, {
      certificateStatus: 'PENDING'
    });

    console.log('✅ [Certificate Revocation] Certificate revoked successfully');

    // Create audit log
    await Log.create({
      eventId: certificate.event._id,
      eventName: certificate.event.title,
      participantId: certificate.participant._id,
      participantName: certificate.participant.name,
      participantEmail: certificate.participant.email,
      actionType: 'CERTIFICATE_REVOKED',
      entityType: 'CERTIFICATE',
      action: 'Certificate revoked',
      details: `Certificate ${certificate.certificateId} revoked for ${certificate.participant.name}`,
      actorType: organizer ? (organizer.role === 'ADMIN' ? 'ADMIN' : 'ORGANIZER') : 'SYSTEM',
      actorId: organizer?._id,
      actorName: organizer?.name || 'Organizer',
      actorEmail: organizer?.email || '',
      severity: 'CRITICAL',
      reason: reason.trim(),
      oldState,
      newState: {
        isValid: false,
        status: 'REVOKED',
        revokedAt: certificate.revokedAt,
        revocationReason: certificate.revocationReason
      }
    });

    console.log('✅ [Certificate Revocation] Audit log created');

    res.json({
      success: true,
      message: 'Certificate revoked successfully',
      data: certificate
    });
  } catch (error) {
    console.error('❌ [Certificate Revocation] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error revoking certificate',
      error: error.message
    });
  }
});

// @desc    Invalidate participant record (with reason)
// @route   POST /api/organizer/participants/:participantId/invalidate
router.post('/participants/:participantId/invalidate', async (req, res) => {
  try {
    const { participantId } = req.params;
    const { reason, organizerId } = req.body;

    console.log('🔄 [Participant Invalidation] Starting invalidation for:', participantId);

    // Validate reason
    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required and must be at least 10 characters'
      });
    }

    // Find participant
    const participant = await Participant.findById(participantId)
      .populate('event', 'title');

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found'
      });
    }

    if (!participant.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Participant is already invalidated'
      });
    }

    // Get organizer info
    const organizer = organizerId ? await User.findById(organizerId) : null;

    // Store old state for audit
    const oldState = {
      isValid: participant.isValid,
      registrationStatus: participant.registrationStatus,
      attendanceStatus: participant.attendanceStatus,
      certificateStatus: participant.certificateStatus
    };

    // Update participant (soft delete)
    participant.isValid = false;
    participant.invalidatedAt = Date.now();
    participant.invalidatedBy = organizerId;
    participant.invalidationReason = reason.trim();
    participant.registrationStatus = 'CANCELLED';
    participant.version += 1;

    await participant.save();

    console.log('✅ [Participant Invalidation] Participant invalidated successfully');

    // Create audit log
    await Log.create({
      eventId: participant.event._id,
      eventName: participant.event.title,
      participantId: participant._id,
      participantName: participant.name,
      participantEmail: participant.email,
      actionType: 'PARTICIPANT_INVALIDATED',
      entityType: 'PARTICIPATION',
      action: 'Participant record invalidated',
      details: `Participant ${participant.name} invalidated`,
      actorType: organizer ? (organizer.role === 'ADMIN' ? 'ADMIN' : 'ORGANIZER') : 'SYSTEM',
      actorId: organizer?._id,
      actorName: organizer?.name || 'Organizer',
      actorEmail: organizer?.email || '',
      severity: 'CRITICAL',
      reason: reason.trim(),
      oldState,
      newState: {
        isValid: false,
        registrationStatus: 'CANCELLED',
        invalidatedAt: participant.invalidatedAt,
        invalidationReason: participant.invalidationReason
      }
    });

    console.log('✅ [Participant Invalidation] Audit log created');

    res.json({
      success: true,
      message: 'Participant invalidated successfully',
      data: participant
    });
  } catch (error) {
    console.error('❌ [Participant Invalidation] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error invalidating participant',
      error: error.message
    });
  }
});

// @desc    Get audit trail for an entity
// @route   GET /api/organizer/audit-trail/:entityType/:entityId
router.get('/audit-trail/:entityType/:entityId', async (req, res) => {
  try {
    const { entityType, entityId } = req.params;

    console.log(`🔍 [Audit Trail] Fetching for ${entityType}:`, entityId);

    // Validate entity type
    const validTypes = ['attendance', 'certificate', 'participant'];
    if (!validTypes.includes(entityType.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid entity type. Must be: attendance, certificate, or participant'
      });
    }

    // Get the entity based on type
    let entity;
    let Model;
    let logEntityType;

    switch (entityType.toLowerCase()) {
      case 'attendance':
        Model = Attendance;
        logEntityType = 'ATTENDANCE';
        break;
      case 'certificate':
        Model = Certificate;
        logEntityType = 'CERTIFICATE';
        break;
      case 'participant':
        Model = Participant;
        logEntityType = 'PARTICIPATION';
        break;
    }

    // Get current entity with appropriate population based on type
    if (entityType.toLowerCase() === 'participant') {
      // Participants don't have a 'participant' field, they ARE the participant
      entity = await Model.findById(entityId)
        .populate('event', 'title');
    } else {
      // Attendance and Certificate have both event and participant references
      entity = await Model.findById(entityId)
        .populate('event', 'title')
        .populate('participant', 'name email');
    }

    if (!entity) {
      return res.status(404).json({
        success: false,
        message: `${entityType} not found`
      });
    }

    // Get all versions (follow previousVersion chain)
    const versions = [entity];
    let currentVersion = entity;
    while (currentVersion.previousVersion) {
      let prevVersion;
      if (entityType.toLowerCase() === 'participant') {
        prevVersion = await Model.findById(currentVersion.previousVersion)
          .populate('event', 'title');
      } else {
        prevVersion = await Model.findById(currentVersion.previousVersion)
          .populate('event', 'title')
          .populate('participant', 'name email');
      }
      if (prevVersion) {
        versions.push(prevVersion);
        currentVersion = prevVersion;
      } else {
        break;
      }
    }

    // Get all related logs - different query based on entity type
    let logs;
    if (entityType.toLowerCase() === 'participant') {
      // For participants, search by participantId
      console.log(`🔍 [Audit Trail] Searching for participant logs:`, {
        participantId: entityId,
        entityType: logEntityType
      });
      logs = await Log.find({
        participantId: entityId,
        entityType: logEntityType
      })
        .sort({ createdAt: -1 });
    } else {
      // For attendance/certificate, search by participant or event
      console.log(`🔍 [Audit Trail] Searching for ${entityType} logs:`, {
        participantId: entity.participant?._id,
        eventId: entity.event?._id,
        entityType: logEntityType
      });
      logs = await Log.find({
        $or: [
          { participantId: entity.participant?._id, entityType: logEntityType },
          { eventId: entity.event?._id, entityType: logEntityType }
        ]
      })
        .sort({ createdAt: -1 });
    }

    console.log(`✅ [Audit Trail] Found ${versions.length} versions and ${logs.length} logs`);

    res.json({
      success: true,
      data: {
        current: entity,
        versions: versions.reverse(), // Oldest first
        logs,
        totalVersions: versions.length
      }
    });
  } catch (error) {
    console.error('❌ [Audit Trail] Error:', error);
    console.error('❌ [Audit Trail] Error message:', error.message);
    console.error('❌ [Audit Trail] Error stack:', error.stack);
    console.error('❌ [Audit Trail] Entity Type:', req.params.entityType);
    console.error('❌ [Audit Trail] Entity ID:', req.params.entityId);
    res.status(500).json({
      success: false,
      message: 'Error fetching audit trail',
      error: error.message,
      details: error.stack
    });
  }
});

export default router;
