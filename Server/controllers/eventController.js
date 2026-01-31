import Event from '../models/Event.js';
import User from '../models/User.js';

// Get all events
export const getAllEvents = async (req, res) => {
  try {
    const { status, search } = req.query;
    
    let query = {};
    
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const events = await Event.find(query)
      .populate('teamLead', 'name email')
      .populate('createdBy', 'name')
      .populate('teamMembers', 'name email')
      .sort({ createdAt: -1 });

    // Add computed status based on dates
    const eventsWithStatus = events.map(event => {
      const now = new Date();
      const eventObj = event.toObject();
      
      if (!event.startDate) {
        eventObj.status = 'Draft';
      } else if (now < new Date(event.startDate)) {
        eventObj.status = 'Upcoming';
      } else if (now >= new Date(event.startDate) && now <= new Date(event.endDate)) {
        eventObj.status = 'Live';
      } else {
        eventObj.status = 'Completed';
      }
      
      eventObj.participantCount = event.participants?.length || 0;
      return eventObj;
    });

    res.json({
      success: true,
      count: events.length,
      data: eventsWithStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching events',
      error: error.message
    });
  }
};

// Get single event
export const getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('teamLead', 'name email')
      .populate('createdBy', 'name')
      .populate('teamMembers', 'name email')
      .populate('participants');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching event',
      error: error.message
    });
  }
};

// Create event
export const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      startDate,
      endDate,
      teamLead,
      teamMembers,
      category,
      maxParticipants,
      enableCertificates
    } = req.body;

    const event = await Event.create({
      title,
      description,
      location,
      startDate,
      endDate,
      teamLead: teamLead || undefined,
      teamMembers: teamMembers || [],
      createdBy: req.body.createdBy, // Will come from auth middleware later
    });

    // If team lead is assigned, update their assignedEvent
    if (teamLead) {
      await User.findByIdAndUpdate(teamLead, { assignedEvent: event._id });
    }

    // Update team members' assignedEvent
    if (teamMembers && teamMembers.length > 0) {
      await User.updateMany(
        { _id: { $in: teamMembers } },
        { assignedEvent: event._id }
      );
    }

    const populatedEvent = await Event.findById(event._id)
      .populate('teamLead', 'name email')
      .populate('teamMembers', 'name email');

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: populatedEvent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating event',
      error: error.message
    });
  }
};

// Update event
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('teamLead', 'name email')
      .populate('teamMembers', 'name email');

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
    res.status(500).json({
      success: false,
      message: 'Error updating event',
      error: error.message
    });
  }
};

// Delete event
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Remove event reference from assigned users
    await User.updateMany(
      { assignedEvent: req.params.id },
      { $unset: { assignedEvent: 1 } }
    );

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting event',
      error: error.message
    });
  }
};

// Assign team lead to event
export const assignTeamLead = async (req, res) => {
  try {
    const { teamLeadId } = req.body;

    // Verify user exists and is a TEAM_LEAD
    const teamLead = await User.findById(teamLeadId);
    if (!teamLead) {
      return res.status(404).json({
        success: false,
        message: 'Team lead not found'
      });
    }

    if (teamLead.role !== 'TEAM_LEAD') {
      return res.status(400).json({
        success: false,
        message: 'User is not a team lead'
      });
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { teamLead: teamLeadId },
      { new: true }
    ).populate('teamLead', 'name email');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Update team lead's assigned event
    await User.findByIdAndUpdate(teamLeadId, { assignedEvent: event._id });

    res.json({
      success: true,
      message: 'Team lead assigned successfully',
      data: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error assigning team lead',
      error: error.message
    });
  }
};

// Update event lifecycle status
export const updateEventLifecycle = async (req, res) => {
  try {
    const { status } = req.body;
    
    // Status is computed from dates, but we can archive manually
    const updateData = {};
    
    if (status === 'archived') {
      updateData.isArchived = true;
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      updateData,
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
      message: 'Event lifecycle updated',
      data: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating event lifecycle',
      error: error.message
    });
  }
};
