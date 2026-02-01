import Communication from '../models/Communication.js';
import Participant from '../models/Participant.js';
import Attendance from '../models/Attendance.js';
import Certificate from '../models/Certificate.js';
import Event from '../models/Event.js';
import mongoose from 'mongoose';

// Helper to validate MongoDB ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id) && /^[a-fA-F0-9]{24}$/.test(id);

// @desc    Send email to participants
// @route   POST /api/organizer/communication/send/:eventId
export const sendEmail = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    if (!isValidObjectId(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    }
    
    const { subject, message, recipientFilter = 'ALL', template = 'CUSTOM', organizerId } = req.body;

    const allParticipants = await Participant.find({ event: eventId });
    let recipients = [];

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

    if (recipientCount === 0) {
      return res.status(400).json({ success: false, message: 'No recipients found for the selected filter' });
    }

    const communication = await Communication.create({
      event: eventId, subject, message, type: 'EMAIL', template, recipientFilter, recipientCount, sentBy: organizerId, status: 'SENT'
    });

    res.json({ success: true, message: `Email sent to ${recipientCount} participants`, data: communication });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get communication history for an event
// @route   GET /api/organizer/communication/:eventId
export const getCommunicationHistory = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!isValidObjectId(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    }

    const communications = await Communication.find({ event: eventId })
      .populate('sentBy', 'name email')
      .sort({ sentAt: -1 });

    res.json({ success: true, count: communications.length, data: communications });
  } catch (error) {
    console.error('Error fetching communication history:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create an announcement for event page
// @route   POST /api/organizer/communication/announce/:eventId
export const createAnnouncement = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    if (!isValidObjectId(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    }
    
    const { subject, message, organizerId } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const announcement = await Communication.create({
      event: eventId, subject, message, type: 'ANNOUNCEMENT', template: 'CUSTOM', recipientFilter: 'ALL', recipientCount: 0, sentBy: organizerId, status: 'SENT'
    });

    res.json({ success: true, message: 'Announcement created successfully', data: announcement });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get email templates
// @route   GET /api/organizer/communication/templates
export const getEmailTemplates = async (req, res) => {
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
};
