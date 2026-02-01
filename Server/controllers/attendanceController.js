import Attendance from '../models/Attendance.js';
import Participant from '../models/Participant.js';
import Event from '../models/Event.js';
import crypto from 'crypto';
import mongoose from 'mongoose';

// Helper to validate MongoDB ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id) && /^[a-fA-F0-9]{24}$/.test(id);

const activeSessions = new Map();

// @desc    Generate QR code data for attendance
// @route   POST /api/organizer/attendance/generate-qr/:eventId
export const generateQRCode = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    if (!isValidObjectId(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    }
    
    const organizerId = req.body.organizerId || 'system';

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const sessionId = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    const expiresAt = timestamp + (5 * 60 * 1000);

    activeSessions.set(sessionId, { eventId, organizerId, createdAt: timestamp, expiresAt });

    const qrData = { eventId, sessionId, timestamp, expiresAt };

    res.json({
      success: true,
      data: { qrData: JSON.stringify(qrData), sessionId, expiresAt, expiresIn: 300 }
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Mark attendance via QR scan
// @route   POST /api/organizer/attendance/mark
export const markAttendance = async (req, res) => {
  try {
    const { eventId, sessionId, participantId, organizerId } = req.body;

    const session = activeSessions.get(sessionId);
    if (!session) {
      return res.status(400).json({ success: false, message: 'Invalid or expired QR code' });
    }

    if (Date.now() > session.expiresAt) {
      activeSessions.delete(sessionId);
      return res.status(400).json({ success: false, message: 'QR code has expired' });
    }

    if (session.eventId !== eventId) {
      return res.status(400).json({ success: false, message: 'QR code does not match event' });
    }

    const participant = await Participant.findOne({ _id: participantId, event: eventId });
    if (!participant) {
      return res.status(404).json({ success: false, message: 'Participant not registered for this event' });
    }

    const existingAttendance = await Attendance.findOne({ event: eventId, participant: participantId });
    if (existingAttendance) {
      return res.status(400).json({ success: false, message: 'Attendance already marked' });
    }

    const attendance = await Attendance.create({
      event: eventId,
      participant: participantId,
      sessionId,
      markedBy: organizerId || session.organizerId
    });

    await Participant.findByIdAndUpdate(participantId, { attendanceStatus: 'ATTENDED', attendedAt: Date.now() });

    res.json({ success: true, message: 'Attendance marked successfully', data: attendance });
  } catch (error) {
    console.error('Error marking attendance:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Attendance already marked' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get attendance logs for an event
// @route   GET /api/organizer/attendance/:eventId
export const getAttendanceLogs = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!isValidObjectId(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    }

    const attendance = await Attendance.find({ event: eventId })
      .populate('participant', 'name email phone')
      .populate('markedBy', 'name email')
      .sort({ scannedAt: -1 });

    const totalRegistered = await Participant.countDocuments({ event: eventId });

    res.json({
      success: true,
      data: {
        attendance,
        stats: {
          totalRegistered,
          totalAttended: attendance.length,
          attendanceRate: totalRegistered > 0 ? Math.round((attendance.length / totalRegistered) * 100) : 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching attendance logs:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get live attendance count
// @route   GET /api/organizer/attendance/:eventId/live
export const getLiveAttendanceCount = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!isValidObjectId(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    }

    const attendanceCount = await Attendance.countDocuments({ event: eventId });
    const registeredCount = await Participant.countDocuments({ event: eventId });

    res.json({
      success: true,
      data: {
        attended: attendanceCount,
        registered: registeredCount,
        percentage: registeredCount > 0 ? Math.round((attendanceCount / registeredCount) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Error fetching live count:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Manual attendance marking
// @route   POST /api/organizer/attendance/:eventId/manual/:participantId
export const markManualAttendance = async (req, res) => {
  try {
    const { eventId, participantId } = req.params;
    const { organizerId } = req.body;

    if (!isValidObjectId(eventId) || !isValidObjectId(participantId)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    // Check if participant exists for this event
    const participant = await Participant.findOne({ _id: participantId, event: eventId });
    if (!participant) {
      return res.status(404).json({ success: false, message: 'Participant not found for this event' });
    }

    const existing = await Attendance.findOne({ event: eventId, participant: participantId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Attendance already marked' });
    }

    const attendance = await Attendance.create({
      event: eventId,
      participant: participantId,
      markedBy: organizerId || 'manual',
      sessionId: 'manual'
    });

    await Participant.findByIdAndUpdate(participantId, { 
      attendanceStatus: 'ATTENDED', 
      attendedAt: Date.now() 
    });

    res.json({ success: true, message: 'Attendance marked manually', data: attendance });
  } catch (error) {
    console.error('Error marking manual attendance:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
