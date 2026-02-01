import Certificate from '../models/Certificate.js';
import Participant from '../models/Participant.js';
import Attendance from '../models/Attendance.js';
import Event from '../models/Event.js';
import mongoose from 'mongoose';

// Helper to validate MongoDB ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id) && /^[a-fA-F0-9]{24}$/.test(id);

// @desc    Generate certificates for attended participants
// @route   POST /api/organizer/certificates/generate/:eventId
export const generateCertificates = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    if (!isValidObjectId(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    }
    
    const { organizerId, template = 'default' } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const attendedParticipants = await Attendance.find({ event: eventId }).populate('participant');
    const existingCerts = await Certificate.find({ event: eventId });
    const certifiedParticipantIds = existingCerts.map(c => c.participant.toString());

    const eligibleParticipants = attendedParticipants.filter(
      a => !certifiedParticipantIds.includes(a.participant._id.toString())
    );

    if (eligibleParticipants.length === 0) {
      return res.json({ success: true, message: 'No new certificates to generate', data: { generated: 0 } });
    }

    const certificates = await Promise.all(
      eligibleParticipants.map(async (att) => {
        return await Certificate.create({
          event: eventId,
          participant: att.participant._id,
          issuedBy: organizerId,
          template,
          status: 'GENERATED'
        });
      })
    );

    res.json({
      success: true,
      message: `Generated ${certificates.length} certificates`,
      data: { generated: certificates.length, certificates }
    });
  } catch (error) {
    console.error('Error generating certificates:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Send certificates to all eligible participants
// @route   POST /api/organizer/certificates/send/:eventId
export const sendCertificates = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!isValidObjectId(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    }

    const certificates = await Certificate.find({ event: eventId, status: 'GENERATED' }).populate('participant');

    if (certificates.length === 0) {
      return res.json({ success: true, message: 'No certificates to send', data: { sent: 0 } });
    }

    const sentCerts = await Promise.all(
      certificates.map(async (cert) => {
        cert.status = 'SENT';
        cert.sentAt = Date.now();
        await cert.save();
        await Participant.findByIdAndUpdate(cert.participant._id, { certificateStatus: 'SENT' });
        return cert;
      })
    );

    res.json({ success: true, message: `Sent ${sentCerts.length} certificates`, data: { sent: sentCerts.length } });
  } catch (error) {
    console.error('Error sending certificates:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get certificate logs for an event
// @route   GET /api/organizer/certificates/:eventId
export const getCertificateLogs = async (req, res) => {
  try {
    const { eventId } = req.params;

    const certificates = await Certificate.find({ event: eventId })
      .populate('participant', 'name email')
      .populate('issuedBy', 'name')
      .sort({ issuedAt: -1 });

    const totalAttended = await Attendance.countDocuments({ event: eventId });
    const generated = certificates.length;
    const sent = certificates.filter(c => c.status === 'SENT').length;

    res.json({
      success: true,
      data: {
        certificates,
        stats: { totalAttended, generated, sent, pending: generated - sent }
      }
    });
  } catch (error) {
    console.error('Error fetching certificate logs:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Resend certificate to a participant
// @route   POST /api/organizer/certificates/resend/:certificateId
export const resendCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;

    const certificate = await Certificate.findById(certificateId).populate('participant');
    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    certificate.sentAt = Date.now();
    certificate.status = 'SENT';
    await certificate.save();

    res.json({ success: true, message: 'Certificate resent successfully', data: certificate });
  } catch (error) {
    console.error('Error resending certificate:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
