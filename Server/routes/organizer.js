import express from 'express';
import Event from '../models/Event.js';
import User from '../models/User.js';
import Participant from '../models/Participant.js';
import Attendance from '../models/Attendance.js';
import Certificate from '../models/Certificate.js';
import Communication from '../models/Communication.js';
import EventUpdate from '../models/EventUpdate.js';
import mongoose from 'mongoose';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

const router = express.Router();
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id) && /^[a-fA-F0-9]{24}$/.test(id);
const activeSessions = new Map();

router.get('/dashboard', async (req, res) => {
  try {
    const organizerId = req.query.organizerId;
    let eventQuery = organizerId ? { $or: [{ teamLead: organizerId }, { teamMembers: organizerId }] } : {};
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
    let query = organizerId ? { $or: [{ teamLead: organizerId }, { teamMembers: organizerId }] } : {};
    const events = await Event.find(query).populate('teamLead', 'name email').populate('teamMembers', 'name email').sort({ createdAt: -1 });
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
      return { ...p.toObject(), hasAttended: !!attendance, attendedAt: attendance?.scannedAt, hasCertificate: !!certificate, certificateStatus: certificate?.status };
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
    const attendance = await Attendance.create({ event: eventId, participant: participantId, markedBy: organizerId || 'manual', sessionId: 'manual' });
    await Participant.findByIdAndUpdate(participantId, { attendanceStatus: 'ATTENDED', attendedAt: Date.now() });
    res.json({ success: true, message: 'Attendance marked manually', data: attendance });
  } catch (error) {
    console.error('Error marking manual attendance:', error);
    res.status(500).json({ success: false, message: 'Server error' });
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
    res.json({ success: true, data: { attended: attendanceCount, registered: registeredCount, percentage: registeredCount > 0 ? Math.round((attendanceCount / registeredCount) * 100) : 0 } });
  } catch (error) {
    console.error('Error fetching live count:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Certificate routes
router.post('/certificates/:eventId/generate', async (req, res) => {
  try {
    const { eventId } = req.params;
    if (!isValidObjectId(eventId)) return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    const { organizerId, template = 'default' } = req.body;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    const attendedParticipants = await Attendance.find({ event: eventId }).populate('participant');
    const existingCerts = await Certificate.find({ event: eventId });
    const certifiedParticipantIds = existingCerts.map(c => c.participant.toString());
    const eligibleParticipants = attendedParticipants.filter(a => !certifiedParticipantIds.includes(a.participant._id.toString()));
    if (eligibleParticipants.length === 0) return res.json({ success: true, message: 'No new certificates to generate', data: { generated: 0 } });
    const certificates = await Promise.all(eligibleParticipants.map(async (att) => { return await Certificate.create({ event: eventId, participant: att.participant._id, issuedBy: organizerId, template, status: 'GENERATED' }); }));
    res.json({ success: true, message: `Generated ${certificates.length} certificates`, data: { generated: certificates.length, certificates } });
  } catch (error) {
    console.error('Error generating certificates:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/certificates/:eventId/send', async (req, res) => {
  try {
    const { eventId } = req.params;
    if (!isValidObjectId(eventId)) return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    const certificates = await Certificate.find({ event: eventId, status: 'GENERATED' }).populate('participant');
    if (certificates.length === 0) return res.json({ success: true, message: 'No certificates to send', data: { sent: 0 } });
    const sentCerts = await Promise.all(certificates.map(async (cert) => { cert.status = 'SENT'; cert.sentAt = Date.now(); await cert.save(); await Participant.findByIdAndUpdate(cert.participant._id, { certificateStatus: 'SENT' }); return cert; }));
    res.json({ success: true, message: `Sent ${sentCerts.length} certificates`, data: { sent: sentCerts.length } });
  } catch (error) {
    console.error('Error sending certificates:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/certificates/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const certificates = await Certificate.find({ event: eventId }).populate('participant', 'name email').populate('issuedBy', 'name').sort({ issuedAt: -1 });
    const totalAttended = await Attendance.countDocuments({ event: eventId });
    const generated = certificates.length;
    const sent = certificates.filter(c => c.status === 'SENT').length;
    res.json({ success: true, data: { certificates, stats: { totalAttended, generated, sent, pending: generated - sent } } });
  } catch (error) {
    console.error('Error fetching certificate logs:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/certificates/:certificateId/resend', async (req, res) => {
  try {
    const { certificateId } = req.params;
    const certificate = await Certificate.findById(certificateId).populate('participant');
    if (!certificate) return res.status(404).json({ success: false, message: 'Certificate not found' });
    certificate.sentAt = Date.now();
    certificate.status = 'SENT';
    await certificate.save();
    res.json({ success: true, message: 'Certificate resent successfully', data: certificate });
  } catch (error) {
    console.error('Error resending certificate:', error);
    res.status(500).json({ success: false, message: 'Server error' });
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
    if (!isValidObjectId(eventId)) return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    const allParticipants = await Participant.find({ event: eventId });
    let recipients = [];
    switch (recipientFilter) {
      case 'REGISTERED': recipients = allParticipants.filter(p => p.registrationStatus === 'CONFIRMED'); break;
      case 'ATTENDED': const attendedIds = (await Attendance.find({ event: eventId })).map(a => a.participant.toString()); recipients = allParticipants.filter(p => attendedIds.includes(p._id.toString())); break;
      case 'NOT_ATTENDED': const attendedIds2 = (await Attendance.find({ event: eventId })).map(a => a.participant.toString()); recipients = allParticipants.filter(p => !attendedIds2.includes(p._id.toString())); break;
      case 'CERTIFIED': const certifiedIds = (await Certificate.find({ event: eventId, status: 'SENT' })).map(c => c.participant.toString()); recipients = allParticipants.filter(p => certifiedIds.includes(p._id.toString())); break;
      case 'NOT_CERTIFIED': const certifiedIds2 = (await Certificate.find({ event: eventId })).map(c => c.participant.toString()); recipients = allParticipants.filter(p => !certifiedIds2.includes(p._id.toString())); break;
      default: recipients = allParticipants;
    }
    const recipientCount = recipients.length;
    if (recipientCount === 0) return res.status(400).json({ success: false, message: 'No recipients found for the selected filter' });
    const communication = await Communication.create({ event: eventId, subject, message, type: 'EMAIL', template, recipientFilter, recipientCount, sentBy: organizerId, status: 'SENT' });
    res.json({ success: true, message: `Email sent to ${recipientCount} participants`, data: communication });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/communication/announcement', async (req, res) => {
  try {
    const { eventId, subject, message, organizerId } = req.body;
    if (!isValidObjectId(eventId)) return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    const announcement = await Communication.create({ event: eventId, subject, message, type: 'ANNOUNCEMENT', template: 'CUSTOM', recipientFilter: 'ALL', recipientCount: 0, sentBy: organizerId, status: 'SENT' });
    res.json({ success: true, message: 'Announcement created successfully', data: announcement });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ success: false, message: 'Server error' });
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
    const { email, name, permissions } = req.body;
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
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      user = await User.create({ email, name: name || email.split('@')[0], password: hashedPassword, role: 'ORGANIZER', isActive: false, phone: '', invitedBy: event.teamLead, invitedAt: new Date() });
      console.log(`User invited: ${email}, temp password: ${tempPassword}`);
    }
    const newMember = { user: user._id, role: 'TEAM_MEMBER', permissions: permissions || { canViewParticipants: true, canManageAttendance: true, canSendEmails: false, canGenerateCertificates: false, canEditEvent: false }, addedAt: new Date() };
    if (!event.teamMembers) event.teamMembers = [];
    event.teamMembers.push(newMember);
    await event.save();
    res.status(201).json({ success: true, message: user.isActive ? 'Team member added successfully' : 'Invitation sent! User will need to activate their account.', data: { _id: newMember.user, user: { _id: user._id, name: user.name, email: user.email }, role: newMember.role, permissions: newMember.permissions, addedAt: newMember.addedAt } });
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
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    const member = event.teamMembers?.find(m => m.user.toString() === memberId || m._id?.toString() === memberId);
    if (!member) return res.status(404).json({ success: false, message: 'Team member not found' });
    member.permissions = { ...member.permissions, ...permissions };
    await event.save();
    res.json({ success: true, data: { permissions: member.permissions }, message: 'Permissions updated successfully' });
  } catch (error) {
    console.error('Error updating permissions:', error);
    res.status(500).json({ success: false, message: 'Error updating permissions', error: error.message });
  }
});

export default router;
