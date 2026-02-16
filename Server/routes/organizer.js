import express from 'express';
import Event from '../models/Event.js';
import User from '../models/User.js';
import Participant from '../models/Participant.js';
import Attendance from '../models/Attendance.js';
import Certificate from '../models/Certificate.js';
import CertificateRequest from '../models/CertificateRequest.js';
import Communication from '../models/Communication.js';
import EventUpdate from '../models/EventUpdate.js';
import mongoose from 'mongoose';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { sendBulkEmails, testEmailConnection, sendCertificateEmail } from '../utils/emailService.js';
import certificateGenerator from '../utils/certificateGenerator.js';
import activeSessions from '../utils/sessionStore.js';
import { cache } from '../middleware/cache.js';
import { CacheKeys, CacheTTL } from '../utils/cacheKeys.js';

const router = express.Router();
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id) && /^[a-fA-F0-9]{24}$/.test(id);

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
    res.json({ success: true, data: { ...event.toObject(), participantCount, attendanceCount, certificateCount } });
  } catch (error) {
    console.error('Error fetching event details:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/events/:id', async (req, res) => {
  try {
    const { description, location, rules, guidelines, contactDetails, venueInstructions } = req.body;
    const event = await Event.findByIdAndUpdate(req.params.id, { description, location, rules, guidelines, contactDetails, venueInstructions, updatedAt: Date.now() }, { new: true, runValidators: true });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
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
    if (!isValidObjectId(eventId)) return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    const { filter, search } = req.query;
    let query = { event: eventId };
    if (filter === 'registered') query.registrationStatus = 'CONFIRMED';
    else if (filter === 'attended') query.attendanceStatus = 'ATTENDED';
    else if (filter === 'certified') query.certificateStatus = 'SENT';
    let participants = await Participant.find(query).sort({ createdAt: -1 });
    if (search) {
      const searchLower = search.toLowerCase();
      participants = participants.filter(p => p.name?.toLowerCase().includes(searchLower) || p.email?.toLowerCase().includes(searchLower));
    }
    const enrichedParticipants = await Promise.all(participants.map(async (p) => {
      const attendance = await Attendance.findOne({ event: eventId, participant: p._id });
      const certificate = await Certificate.findOne({ event: eventId, participant: p._id });
      return { 
        ...p.toObject(), 
        hasAttended: !!attendance || p.attendanceStatus === 'ATTENDED', 
        attendedAt: attendance?.scannedAt || p.updatedAt,
        attendanceStatus: attendance ? 'ATTENDED' : (p.attendanceStatus || 'ABSENT'),
        hasCertificate: !!certificate, 
        certificateStatus: certificate?.status 
      };
    }));
    res.json({ success: true, count: enrichedParticipants.length, data: enrichedParticipants });
  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/participants/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    if (!isValidObjectId(eventId)) return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    const { name, email, phone, college, year, branch } = req.body;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    const existing = await Participant.findOne({ email, event: eventId });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered for this event' });
    const participant = await Participant.create({ name, fullName: name, email, phone, college, year, branch, event: eventId, registrationStatus: 'CONFIRMED', registrationType: 'WALK_IN' });
    res.status(201).json({ success: true, message: 'Participant added successfully', data: participant });
  } catch (error) {
    console.error('Error adding participant:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/participants/:eventId/:participantId', async (req, res) => {
  try {
    const { eventId, participantId } = req.params;
    if (!isValidObjectId(eventId) || !isValidObjectId(participantId)) return res.status(400).json({ success: false, message: 'Invalid ID format' });
    const { name, email, phone } = req.body;
    const updateData = { email, phone };
    if (name) { updateData.name = name; updateData.fullName = name; }
    const participant = await Participant.findOneAndUpdate({ _id: participantId, event: eventId }, updateData, { new: true, runValidators: true });
    if (!participant) return res.status(404).json({ success: false, message: 'Participant not found' });
    res.json({ success: true, message: 'Participant updated successfully', data: participant });
  } catch (error) {
    console.error('Error updating participant:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/participants/:eventId/:participantId', async (req, res) => {
  try {
    const { eventId, participantId } = req.params;
    if (!isValidObjectId(eventId) || !isValidObjectId(participantId)) return res.status(400).json({ success: false, message: 'Invalid ID format' });
    const participant = await Participant.findOneAndDelete({ _id: participantId, event: eventId });
    if (!participant) return res.status(404).json({ success: false, message: 'Participant not found' });
    await Attendance.deleteOne({ event: eventId, participant: participantId });
    await Certificate.deleteOne({ event: eventId, participant: participantId });
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
    if (!isValidObjectId(eventId)) return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    const organizerId = req.body.organizerId || 'system';
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    const sessionId = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    const expiresAt = timestamp + (5 * 60 * 1000);
    activeSessions.set(sessionId, { eventId, organizerId, createdAt: timestamp, expiresAt });
    const qrData = { eventId, sessionId, timestamp, expiresAt };
    res.json({ success: true, data: { qrData: JSON.stringify(qrData), sessionId, expiresAt, expiresIn: 300 } });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/attendance/mark', async (req, res) => {
  try {
    const { eventId, sessionId, participantId, organizerId } = req.body;
    const session = activeSessions.get(sessionId);
    if (!session) return res.status(400).json({ success: false, message: 'Invalid or expired QR code' });
    if (Date.now() > session.expiresAt) { activeSessions.delete(sessionId); return res.status(400).json({ success: false, message: 'QR code has expired' }); }
    if (session.eventId !== eventId) return res.status(400).json({ success: false, message: 'QR code does not match event' });
    const participant = await Participant.findOne({ _id: participantId, event: eventId });
    if (!participant) return res.status(404).json({ success: false, message: 'Participant not registered for this event' });
    const existingAttendance = await Attendance.findOne({ event: eventId, participant: participantId });
    if (existingAttendance) return res.status(400).json({ success: false, message: 'Attendance already marked' });
    const attendance = await Attendance.create({ event: eventId, participant: participantId, sessionId, markedBy: organizerId || session.organizerId });
    await Participant.findByIdAndUpdate(participantId, { attendanceStatus: 'ATTENDED', attendedAt: Date.now() });
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
    res.json({ success: true, message: 'Attendance marked manually', data: attendance });
  } catch (error) {
    console.error('Error marking manual attendance:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.delete('/attendance/:eventId/unmark/:participantId', async (req, res) => {
  try {
    const { eventId, participantId } = req.params;
    if (!isValidObjectId(eventId) || !isValidObjectId(participantId)) return res.status(400).json({ success: false, message: 'Invalid ID format' });
    
    const attendance = await Attendance.findOneAndDelete({ event: eventId, participant: participantId });
    if (!attendance) return res.status(404).json({ success: false, message: 'Attendance record not found' });
    
    await Participant.findByIdAndUpdate(participantId, { 
      attendanceStatus: 'NOT_ATTENDED', 
      attendedAt: null 
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
    if (!isValidObjectId(eventId)) return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    const attendance = await Attendance.find({ event: eventId }).populate('participant', 'name email phone').populate('markedBy', 'name email').sort({ scannedAt: -1 });
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
    if (!isValidObjectId(eventId)) return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    
    const { organizerId, template = 'default', achievement = 'Participation', competitionName } = req.body;
    
    console.log('🎯 Generating certificates for event:', eventId);
    console.log('Request body:', req.body);
    console.log('Request params:', { organizerId, template, achievement, competitionName });
    
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
    
    // Get participants who attended but don't have certificates yet
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
    
    const existingCerts = await Certificate.find({ event: eventId });
    const certifiedParticipantIds = existingCerts.map(c => c.participant.toString());
    const eligibleParticipants = validAttendance.filter(a => 
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
    
    console.log(`\ud83d\udcdd Generating ${eligibleParticipants.length} certificates...`);
    
    const results = [];
    let successCount = 0;
    let failCount = 0;
    
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
        const certificateData = {
          template,
          participantName: participant.name || participant.fullName || 'Participant',
          eventName: event.title || event.name || 'Event',
          eventDate: event.startDate || event.createdAt || new Date(),
          certificateId: `CERT-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase(),
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
        console.error(`\u274c Error generating certificate for ${att.participant.name}:`, error);        console.error('Full error stack:', error.stack);        results.push({ 
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
    
    res.json({ 
      success: true, 
      message: `Generated ${successCount} certificates${failCount > 0 ? `, ${failCount} failed` : ''}`, 
      data: { 
        generated: successCount,
        failed: failCount,
        total: eligibleParticipants.length,
        results 
      } 
    });
  } catch (error) {
    console.error('Error generating certificates:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.post('/certificates/:eventId/send', async (req, res) => {
  try {
    const { eventId } = req.params;
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
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    const update = await EventUpdate.create({ event: eventId, message, type, isPinned, createdBy: organizerId });
    const populatedUpdate = await EventUpdate.findById(update._id).populate('createdBy', 'name email');
    res.status(201).json({ success: true, message: 'Update posted successfully', data: populatedUpdate });
  } catch (error) {
    console.error('Error creating event update:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/updates/:updateId', async (req, res) => {
  try {
    const { updateId } = req.params;
    const update = await EventUpdate.findByIdAndDelete(updateId);
    if (!update) return res.status(404).json({ success: false, message: 'Update not found' });
    res.json({ success: true, message: 'Update deleted successfully' });
  } catch (error) {
    console.error('Error deleting event update:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.patch('/updates/:updateId/pin', async (req, res) => {
  try {
    const { updateId } = req.params;
    const update = await EventUpdate.findById(updateId);
    if (!update) return res.status(404).json({ success: false, message: 'Update not found' });
    update.isPinned = !update.isPinned;
    await update.save();
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
    
    const stats = {
      total: requests.length,
      pending: requests.filter(r => r.status === 'PENDING').length,
      approved: requests.filter(r => r.status === 'APPROVED').length,
      generated: requests.filter(r => r.status === 'GENERATED').length,
      rejected: requests.filter(r => r.status === 'REJECTED').length
    };
    
    res.json({
      success: true,
      data: requests,
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
    
    if (!isValidObjectId(requestId)) {
      return res.status(400).json({ success: false, message: 'Invalid request ID' });
    }
    
    const request = await CertificateRequest.findById(requestId)
      .populate('participant')
      .populate('event');
    
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    
    if (request.status !== 'PENDING') {
      return res.status(400).json({ 
        success: false, 
        message: `Request already ${request.status.toLowerCase()}` 
      });
    }
    
    // Check if certificate already exists
    const existingCert = await Certificate.findOne({
      event: request.event._id,
      participant: request.participant._id
    });
    
    if (existingCert) {
      return res.status(400).json({
        success: false,
        message: 'Certificate already exists for this participant'
      });
    }
    
    // Generate certificate
    const certificateData = {
      template,
      participantName: request.participant.name || request.participant.fullName,
      eventName: request.event.title || request.event.name,
      eventDate: request.event.startDate || request.event.createdAt,
      certificateId: `CERT-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase(),
      organizationName: request.event.organizationName || 'PCET\'s Pimpri Chinchwad College of Engineering',
      departmentName: request.event.departmentName || 'Department of Computer Science & Engineering',
      competitionName: competitionName || request.event.title || request.event.name,
      achievement: achievement || 'Participation'
    };
    
    console.log(`📄 Generating certificate for ${request.participant.name} (Request: ${requestId})...`);
    
    const pdfResult = await certificateGenerator.generateCertificate(certificateData);
    
    if (pdfResult.success) {
      // Create certificate
      const certificate = await Certificate.create({
        event: request.event._id,
        participant: request.participant._id,
        certificateId: certificateData.certificateId,
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
      
      // Update request
      request.status = 'GENERATED';
      request.achievement = achievement || 'Participation';
      request.processedAt = new Date();
      request.processedBy = organizerId;
      request.certificate = certificate._id;
      await request.save();
      
      console.log(`✅ Certificate generated and request approved: ${requestId}`);
      
      res.json({
        success: true,
        message: 'Certificate generated successfully',
        data: {
          request,
          certificate
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to generate certificate'
      });
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
    
    const request = await CertificateRequest.findById(requestId);
    
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    
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
    const event = await Event.findById(eventId).populate('teamMembers.user', 'name email role').select('teamMembers');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    const teamMembers = event.teamMembers.map(member => ({ _id: member._id || member.user._id, user: member.user, role: member.role || 'TEAM_MEMBER', permissions: member.permissions || { canViewParticipants: true, canManageAttendance: true, canSendEmails: false, canGenerateCertificates: false, canEditEvent: false }, addedAt: member.addedAt || new Date() }));
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
    const { email, name, password, permissions } = req.body;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ success: false, message: 'Invalid email format' });
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    let user = await User.findOne({ email });
    if (user) {
      const existingMember = event.teamMembers?.find(m => m.user.toString() === user._id.toString());
      if (existingMember) return res.status(400).json({ success: false, message: 'User is already a team member for this event' });
    }
    if (!user) {
      const memberPassword = password || '12345678';
      const hashedPassword = await bcrypt.hash(memberPassword, 10);
      user = await User.create({ email, name: name || email.split('@')[0], password: hashedPassword, role: 'EVENT_STAFF', isActive: true, phone: '' });
      console.log(`User created: ${email}, password: ${memberPassword}`);
    }
    const newMember = { user: user._id, role: 'TEAM_MEMBER', permissions: permissions || { canViewParticipants: true, canManageAttendance: true, canSendEmails: false, canGenerateCertificates: false, canEditEvent: false }, addedAt: new Date() };
    if (!event.teamMembers) event.teamMembers = [];
    event.teamMembers.push(newMember);
    await event.save();
    res.status(201).json({ success: true, message: 'Team member added successfully', data: { _id: newMember.user, user: { _id: user._id, name: user.name, email: user.email }, role: newMember.role, permissions: newMember.permissions, addedAt: newMember.addedAt } });
  } catch (error) {
    console.error('Error adding team member:', error);
    res.status(500).json({ success: false, message: 'Error adding team member', error: error.message });
  }
});

router.delete('/team/:eventId/:memberId', async (req, res) => {
  try {
    const { eventId, memberId } = req.params;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    const memberIndex = event.teamMembers?.findIndex(m => m.user.toString() === memberId || m._id?.toString() === memberId);
    if (memberIndex === -1) return res.status(404).json({ success: false, message: 'Team member not found' });
    event.teamMembers.splice(memberIndex, 1);
    await event.save();
    res.json({ success: true, message: 'Team member removed successfully' });
  } catch (error) {
    console.error('Error removing team member:', error);
    res.status(500).json({ success: false, message: 'Error removing team member', error: error.message });
  }
});

router.put('/team/:eventId/:memberId/permissions', async (req, res) => {
  try {
    const { eventId, memberId } = req.params;
    const { permissions } = req.body;
    
    if (!isValidObjectId(eventId) || !isValidObjectId(memberId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid ID format' 
      });
    }
    
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    
    const member = event.teamMembers?.find(m => m.user.toString() === memberId || m._id?.toString() === memberId);
    if (!member) return res.status(404).json({ success: false, message: 'Team member not found' });
    
    // Update the member's permissions
    member.permissions = { ...member.permissions, ...permissions };
    await event.save();
    
    // Return the updated event with populated team members
    const updatedEvent = await Event.findById(eventId)
      .populate('teamMembers.user', 'name email role');
    
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

export default router;
