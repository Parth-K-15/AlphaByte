import Participant from '../models/Participant.js';
import Attendance from '../models/Attendance.js';
import Certificate from '../models/Certificate.js';
import Event from '../models/Event.js';
import mongoose from 'mongoose';

// Helper to validate MongoDB ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id) && /^[a-fA-F0-9]{24}$/.test(id);

// @desc    Get participants for an event
// @route   GET /api/organizer/participants/:eventId
export const getParticipants = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    if (!isValidObjectId(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    }
    
    const { filter, search } = req.query;

    let query = { event: eventId };

    if (filter === 'registered') query.registrationStatus = 'CONFIRMED';
    else if (filter === 'attended') query.attendanceStatus = 'ATTENDED';
    else if (filter === 'certified') query.certificateStatus = 'SENT';

    let participants = await Participant.find(query).sort({ createdAt: -1 });

    if (search) {
      const searchLower = search.toLowerCase();
      participants = participants.filter(p =>
        p.name?.toLowerCase().includes(searchLower) ||
        p.email?.toLowerCase().includes(searchLower)
      );
    }

    const enrichedParticipants = await Promise.all(
      participants.map(async (p) => {
        const attendance = await Attendance.findOne({ event: eventId, participant: p._id });
        const certificate = await Certificate.findOne({ event: eventId, participant: p._id });
        return {
          ...p.toObject(),
          hasAttended: !!attendance,
          attendedAt: attendance?.scannedAt,
          hasCertificate: !!certificate,
          certificateStatus: certificate?.status
        };
      })
    );

    res.json({ success: true, count: enrichedParticipants.length, data: enrichedParticipants });
  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Add a walk-in participant
// @route   POST /api/organizer/participants/:eventId
export const addParticipant = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    if (!isValidObjectId(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    }
    
    const { name, email, phone, college, year, branch } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const existing = await Participant.findOne({ email, event: eventId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered for this event' });
    }

    const participant = await Participant.create({
      name,
      fullName: name, // Set both for compatibility
      email,
      phone,
      college,
      year,
      branch,
      event: eventId,
      registrationStatus: 'CONFIRMED',
      registrationType: 'WALK_IN'
    });

    res.status(201).json({ success: true, message: 'Participant added successfully', data: participant });
  } catch (error) {
    console.error('Error adding participant:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Remove a participant
// @route   DELETE /api/organizer/participants/:eventId/:participantId
export const removeParticipant = async (req, res) => {
  try {
    const { eventId, participantId } = req.params;

    if (!isValidObjectId(eventId) || !isValidObjectId(participantId)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    const participant = await Participant.findOneAndDelete({ _id: participantId, event: eventId });
    if (!participant) {
      return res.status(404).json({ success: false, message: 'Participant not found' });
    }

    await Attendance.deleteOne({ event: eventId, participant: participantId });
    await Certificate.deleteOne({ event: eventId, participant: participantId });

    res.json({ success: true, message: 'Participant removed successfully' });
  } catch (error) {
    console.error('Error removing participant:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update participant details
// @route   PUT /api/organizer/participants/:eventId/:participantId
export const updateParticipant = async (req, res) => {
  try {
    const { eventId, participantId } = req.params;

    if (!isValidObjectId(eventId) || !isValidObjectId(participantId)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    const { name, email, phone } = req.body;

    const updateData = { email, phone };
    if (name) {
      updateData.name = name;
      updateData.fullName = name; // Set both for compatibility
    }

    const participant = await Participant.findOneAndUpdate(
      { _id: participantId, event: eventId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!participant) {
      return res.status(404).json({ success: false, message: 'Participant not found' });
    }

    res.json({ success: true, message: 'Participant updated successfully', data: participant });
  } catch (error) {
    console.error('Error updating participant:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
