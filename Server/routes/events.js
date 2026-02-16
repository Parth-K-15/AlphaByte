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
      createdBy,
      rulebook
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
      rulebook: rulebook || '',
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

// @desc    Assign team lead to event (legacy - sets single team lead)
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

// @desc    Add team lead to event (supports multiple team leads)
// @route   POST /api/events/:id/team-leads
router.post('/:id/team-leads', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, permissions } = req.body;

    if (!isValidObjectId(id) || !isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is already in team
    const existingMember = event.teamMembers.find(
      (m) => m.user.toString() === userId
    );
    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already part of the team'
      });
    }

    // Add team lead with permissions
    event.teamMembers.push({
      user: userId,
      role: 'TEAM_LEAD',
      permissions: permissions || {
        canViewParticipants: true,
        canManageAttendance: true,
        canSendEmails: true,
        canGenerateCertificates: true,
        canEditEvent: true,
      },
      addedAt: Date.now()
    });

    // If this is the first team lead, also set as primary team lead
    if (!event.teamLead) {
      event.teamLead = userId;
    }

    await event.save();
    
    const updatedEvent = await Event.findById(id)
      .populate('teamLead', 'name email')
      .populate('teamMembers.user', 'name email');

    res.json({
      success: true,
      message: 'Team lead added successfully',
      data: updatedEvent
    });
  } catch (error) {
    console.error('Error adding team lead:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding team lead',
      error: error.message
    });
  }
});

// @desc    Remove team lead from event
// @route   DELETE /api/events/:id/team-leads/:userId
router.delete('/:id/team-leads/:userId', async (req, res) => {
  try {
    const { id, userId } = req.params;

    if (!isValidObjectId(id) || !isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Remove team lead from team members
    event.teamMembers = event.teamMembers.filter(
      (m) => m.user.toString() !== userId
    );

    // If removing the primary team lead, set new primary if other team leads exist
    if (event.teamLead?.toString() === userId) {
      const remainingTeamLead = event.teamMembers.find(m => m.role === 'TEAM_LEAD');
      event.teamLead = remainingTeamLead ? remainingTeamLead.user : null;
    }

    await event.save();
    
    const updatedEvent = await Event.findById(id)
      .populate('teamLead', 'name email')
      .populate('teamMembers.user', 'name email');

    res.json({
      success: true,
      message: 'Team lead removed successfully',
      data: updatedEvent
    });
  } catch (error) {
    console.error('Error removing team lead:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing team lead',
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

// @desc    Add team member to event
// @route   POST /api/events/:id/team-members
router.post('/:id/team-members', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, permissions } = req.body;

    if (!isValidObjectId(id) || !isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is already a team member
    const existingMember = event.teamMembers.find(
      (m) => m.user.toString() === userId
    );
    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already a team member'
      });
    }

    // Add team member with permissions
    event.teamMembers.push({
      user: userId,
      role: 'TEAM_MEMBER',
      permissions: permissions || {
        canViewParticipants: true,
        canManageAttendance: true,
        canSendEmails: false,
        canGenerateCertificates: false,
        canEditEvent: false,
      },
      addedAt: Date.now()
    });

    await event.save();
    
    const updatedEvent = await Event.findById(id)
      .populate('teamLead', 'name email')
      .populate('teamMembers.user', 'name email');

    res.json({
      success: true,
      message: 'Team member added successfully',
      data: updatedEvent
    });
  } catch (error) {
    console.error('Error adding team member:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding team member',
      error: error.message
    });
  }
});

// @desc    Remove team member from event
// @route   DELETE /api/events/:id/team-members/:userId
router.delete('/:id/team-members/:userId', async (req, res) => {
  try {
    const { id, userId } = req.params;

    if (!isValidObjectId(id) || !isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Remove team member
    event.teamMembers = event.teamMembers.filter(
      (m) => m.user.toString() !== userId
    );

    await event.save();
    
    const updatedEvent = await Event.findById(id)
      .populate('teamLead', 'name email')
      .populate('teamMembers.user', 'name email');

    res.json({
      success: true,
      message: 'Team member removed successfully',
      data: updatedEvent
    });
  } catch (error) {
    console.error('Error removing team member:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing team member',
      error: error.message
    });
  }
});

// @desc    Update event-specific permissions for team lead and members
// @route   PUT /api/events/:id/permissions
router.put('/:id/permissions', async (req, res) => {
  try {
    const { id } = req.params;
    const { teamLeadPermissions, teamMemberPermissions } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format'
      });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Update team lead permissions if team lead exists
    if (event.teamLead && teamLeadPermissions) {
      const leadMemberIndex = event.teamMembers.findIndex(
        (m) => m.user.toString() === event.teamLead.toString()
      );

      if (leadMemberIndex >= 0) {
        event.teamMembers[leadMemberIndex].permissions = {
          ...event.teamMembers[leadMemberIndex].permissions,
          ...teamLeadPermissions
        };
      } else {
        // Add team lead to teamMembers if not already there
        event.teamMembers.push({
          user: event.teamLead,
          role: 'TEAM_LEAD',
          permissions: teamLeadPermissions,
          addedAt: Date.now()
        });
      }
    }

    // Update permissions for all team members (excluding team lead)
    if (teamMemberPermissions) {
      event.teamMembers.forEach((member) => {
        if (member.role === 'TEAM_MEMBER') {
          member.permissions = {
            ...member.permissions,
            ...teamMemberPermissions
          };
        }
      });
    }

    await event.save();
    
    const updatedEvent = await Event.findById(id)
      .populate('teamLead', 'name email')
      .populate('teamMembers.user', 'name email');

    res.json({
      success: true,
      message: 'Permissions updated successfully',
      data: updatedEvent
    });
  } catch (error) {
    console.error('Error updating permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating permissions',
      error: error.message
    });
  }
});

// @desc    Update individual team member permissions
// @route   PUT /api/events/:id/team-members/:userId/permissions
router.put('/:id/team-members/:userId/permissions', async (req, res) => {
  try {
    const { id, userId } = req.params;
    const { permissions } = req.body;

    if (!isValidObjectId(id) || !isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const memberIndex = event.teamMembers.findIndex(
      (m) => m.user.toString() === userId
    );

    if (memberIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    // Update individual member's permissions
    event.teamMembers[memberIndex].permissions = {
      ...event.teamMembers[memberIndex].permissions,
      ...permissions
    };

    await event.save();
    
    const updatedEvent = await Event.findById(id)
      .populate('teamLead', 'name email')
      .populate('teamMembers.user', 'name email');

    res.json({
      success: true,
      message: 'Member permissions updated successfully',
      data: updatedEvent
    });
  } catch (error) {
    console.error('Error updating member permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating member permissions',
      error: error.message
    });
  }
});

export default router;
