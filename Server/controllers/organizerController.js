import Event from '../models/Event.js';
import User from '../models/User.js';
import Participant from '../models/Participant.js';
import Attendance from '../models/Attendance.js';
import Certificate from '../models/Certificate.js';

// @desc    Get organizer dashboard stats
// @route   GET /api/organizer/dashboard
export const getDashboardStats = async (req, res) => {
  try {
    const organizerId = req.query.organizerId;

    let eventQuery = {};
    if (organizerId) {
      eventQuery = {
        $or: [
          { teamLead: organizerId },
          { teamMembers: organizerId }
        ]
      };
    }

    const events = await Event.find(eventQuery);
    const eventIds = events.map(e => e._id);

    const totalEvents = events.length;
    const activeEvents = events.filter(e => e.status === 'PUBLISHED' || e.status === 'ONGOING').length;
    const completedEvents = events.filter(e => e.status === 'COMPLETED').length;
    const upcomingEvents = events.filter(e => e.status === 'DRAFT' || e.status === 'PUBLISHED').length;

    const totalParticipants = await Participant.countDocuments({ event: { $in: eventIds } });
    const totalAttendance = await Attendance.countDocuments({ event: { $in: eventIds } });
    const totalCertificates = await Certificate.countDocuments({ event: { $in: eventIds } });

    const recentEvents = await Event.find(eventQuery)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('teamLead', 'name email');

    res.json({
      success: true,
      data: {
        stats: {
          totalEvents,
          activeEvents,
          completedEvents,
          upcomingEvents,
          totalParticipants,
          totalAttendance,
          totalCertificates
        },
        recentEvents
      }
    });
  } catch (error) {
    console.error('Error fetching organizer dashboard:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get assigned events for organizer
// @route   GET /api/organizer/events
export const getAssignedEvents = async (req, res) => {
  try {
    const organizerId = req.query.organizerId;

    let query = {};
    if (organizerId) {
      query = {
        $or: [
          { teamLead: organizerId },
          { teamMembers: organizerId }
        ]
      };
    }

    const events = await Event.find(query)
      .populate('teamLead', 'name email')
      .populate('teamMembers', 'name email')
      .sort({ createdAt: -1 });

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
    console.error('Error fetching assigned events:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single event details for organizer
// @route   GET /api/organizer/events/:id
export const getEventDetails = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('teamLead', 'name email phone')
      .populate('teamMembers', 'name email phone')
      .populate('createdBy', 'name email');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
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
    console.error('Error fetching event details:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update event info
// @route   PUT /api/organizer/events/:id
export const updateEventInfo = async (req, res) => {
  try {
    const { description, location, rules, guidelines, contactDetails, venueInstructions } = req.body;

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { description, location, rules, guidelines, contactDetails, venueInstructions, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.json({ success: true, data: event });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
