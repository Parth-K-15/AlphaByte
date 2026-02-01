import express from 'express';
import Event from '../models/Event.js';
import User from '../models/User.js';
import Participant from '../models/Participant.js';
import Attendance from '../models/Attendance.js';
import Certificate from '../models/Certificate.js';
import mongoose from 'mongoose';

const router = express.Router();

// Helper to validate MongoDB ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id) && /^[a-fA-F0-9]{24}$/.test(id);

// @desc    Get all events (Admin)
// @route   GET /api/events
router.get('/', async (req, res) => {
  try {
    const { status, search, teamLead } = req.query;
    
    let query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (teamLead && isValidObjectId(teamLead)) {
      query.teamLead = teamLead;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const events = await Event.find(query)
      .populate('teamLead', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // Get counts for each event
    const eventsWithCounts = await Promise.all(events.map(async (event) => {
      const participantCount = await Participant.countDocuments({ event: event._id });
      const attendanceCount = await Attendance.countDocuments({ event: event._id });
      const certificateCount = await Certificate.countDocuments({ event: event._id });

      return {
        ...event.toObject(),
        participantCount,
        attendanceCount,
        certificateCount
      };
    }));

    res.json({
      success: true,
      count: eventsWithCounts.length,
      data: eventsWithCounts
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching events',
      error: error.message
    });
  }
});

// @desc    Get single event details
// @route   GET /api/events/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format'
      });
    }

    const event = await Event.findById(id)
      .populate('teamLead', 'name email phone')
      .populate('createdBy', 'name email')
      .populate('teamMembers.user', 'name email');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const participantCount = await Participant.countDocuments({ event: event._id });
    const attendanceCount = await Attendance.countDocuments({ event: event._id });
    const certificateCount = await Certificate.countDocuments({ event: event._id });

    res.json({
      success: true,
      data: {
        ...event.toObject(),
        participantCount,
        attendanceCount,
        certificateCount
      }
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching event',
      error: error.message
    });
  }
});

// @desc    Create new event (Admin)
// @route   POST /api/events
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      venue,
      address,
      startDate,
      endDate,
      time,
      category,
      type,
      status,
      registrationFee,
      maxParticipants,
      registrationDeadline,
      website,
      bannerImage,
      tags,
      teamLead,
      createdBy
    } = req.body;

    // Validate required fields
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }

    if (teamLead && !isValidObjectId(teamLead)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid team lead ID'
      });
    }

    const event = await Event.create({
      title,
      description,
      location,
      venue,
      address,
      startDate,
      endDate,
      time,
      category,
      type: type || 'Offline',
      status: status || 'draft',
      registrationFee: registrationFee || 0,
      maxParticipants,
      registrationDeadline,
      website,
      bannerImage,
      tags: tags || [],
      teamLead,
      createdBy,
      teamMembers: [],
      participants: []
    });

    const populatedEvent = await Event.findById(event._id)
      .populate('teamLead', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: populatedEvent
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating event',
      error: error.message
    });
  }
});

// @desc    Update event (Admin)
// @route   PUT /api/events/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format'
      });
    }

    const updateData = { ...req.body, updatedAt: Date.now() };
    
    // Remove fields that shouldn't be directly updated
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.__v;

    const event = await Event.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('teamLead', 'name email')
      .populate('createdBy', 'name email');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: event
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating event',
      error: error.message
    });
  }
});

// @desc    Delete event (Admin)
// @route   DELETE /api/events/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format'
      });
    }

    const event = await Event.findByIdAndDelete(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Clean up related data
    await Participant.deleteMany({ event: id });
    await Attendance.deleteMany({ event: id });
    await Certificate.deleteMany({ event: id });

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting event',
      error: error.message
    });
  }
});

// @desc    Assign team lead to event
// @route   PUT /api/events/:id/assign-lead
router.put('/:id/assign-lead', async (req, res) => {
  try {
    const { id } = req.params;
    const { teamLeadId } = req.body;

    if (!isValidObjectId(id) || !isValidObjectId(teamLeadId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }

    const user = await User.findById(teamLeadId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const event = await Event.findByIdAndUpdate(
      id,
      { teamLead: teamLeadId },
      { new: true }
    ).populate('teamLead', 'name email');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      message: 'Team lead assigned successfully',
      data: event
    });
  } catch (error) {
    console.error('Error assigning team lead:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning team lead',
      error: error.message
    });
  }
});

// @desc    Update event lifecycle status
// @route   PUT /api/events/:id/lifecycle
router.put('/:id/lifecycle', async (req, res) => {
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

    const event = await Event.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    )
      .populate('teamLead', 'name email phone')
      .populate('createdBy', 'name email');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

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

export default router;
