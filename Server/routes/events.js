import express from 'express';
import Event from '../models/Event.js';
import User from '../models/User.js';
import Participant from '../models/Participant.js';
import Attendance from '../models/Attendance.js';
import Certificate from '../models/Certificate.js';
import Log from '../models/Log.js';
import mongoose from 'mongoose';
import { invalidateEventCache, invalidateDashboardCache, invalidateMultiple } from '../utils/cacheInvalidation.js';
import { CachePatterns } from '../utils/cacheKeys.js';

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
      rulebook,
      enableCertificates,
      certificateTemplate
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
      participants: [],
      enableCertificates: enableCertificates || false,
      certificateTemplate: certificateTemplate || 'default'
    });

    const populatedEvent = await Event.findById(event._id)
      .populate('teamLead', 'name email')
      .populate('createdBy', 'name email');

    // Create log entry for event creation
    console.log('📝 [Event Creation] Creating log for event:', event._id, event.title);
    const logEntry = await Log.create({
      eventId: event._id,
      eventName: event.title,
      actionType: 'EVENT_CREATED',
      entityType: 'EVENT',
      action: 'Event created',
      details: `Event "${event.title}" was created`,
      actorType: 'ADMIN',
      actorId: createdBy,
      actorName: populatedEvent.createdBy?.name || 'Admin',
      actorEmail: populatedEvent.createdBy?.email || '',
      severity: 'INFO',
      newState: {
        title: event.title,
        status: event.status,
        startDate: event.startDate,
        location: event.location,
        teamLead: event.teamLead
      }
    });
    console.log('✅ [Event Creation] Log created:', logEntry._id);
    // Invalidate caches
    await invalidateMultiple(CachePatterns.allEventLists, CachePatterns.allDashboards);

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

    // Get old event data before update
    const oldEvent = await Event.findById(id);

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

    // Create log entry for event update
    const changedFields = Object.keys(updateData).filter(key =>
      JSON.stringify(oldEvent[key]) !== JSON.stringify(updateData[key])
    );

    if (changedFields.length > 0) {
      await Log.create({
        eventId: event._id,
        eventName: event.title,
        actionType: 'EVENT_UPDATED',
        entityType: 'EVENT',
        action: 'Event information updated',
        details: `Event "${event.title}" was updated. Changed fields: ${changedFields.join(', ')}`,
        actorType: 'ADMIN',
        actorId: req.user?._id || event.createdBy,
        actorName: req.user?.name || event.createdBy?.name || 'Admin',
        actorEmail: req.user?.email || event.createdBy?.email || '',
        severity: 'INFO',
        oldState: changedFields.reduce((acc, field) => ({ ...acc, [field]: oldEvent[field] }), {}),
        newState: changedFields.reduce((acc, field) => ({ ...acc, [field]: updateData[field] }), {})
      });
    }
    // Invalidate caches
    await invalidateEventCache(id);
    await invalidateDashboardCache();

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

    // Invalidate caches
    await invalidateEventCache(id);
    await invalidateDashboardCache();

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

    const oldEvent = await Event.findById(id);
    const oldTeamLead = oldEvent.teamLead;

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

    // Create log entry for team lead assignment
    console.log('👔 [Team Lead] Assigning team lead:', user.name, 'to event:', event.title);
    const logEntry = await Log.create({
      eventId: event._id,
      eventName: event.title,
      actionType: oldTeamLead ? 'ROLE_CHANGED' : 'ROLE_ASSIGNED',
      entityType: 'ROLE',
      action: oldTeamLead ? 'Team lead changed' : 'Team lead assigned',
      details: `Team lead ${oldTeamLead ? 'changed to' : 'assigned:'} ${user.name} (${user.email})`,
      actorType: 'ADMIN',
      actorId: req.user?._id,
      actorName: req.user?.name || 'Admin',
      actorEmail: req.user?.email || '',
      severity: 'INFO',
      oldState: oldTeamLead ? { teamLead: oldTeamLead } : null,
      newState: { teamLead: teamLeadId, teamLeadName: user.name }
    });
    console.log('✅ [Team Lead] Log created:', logEntry._id);

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
    const { userId, permissions, startTime, endTime } = req.body;

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

    // Check if user is already in team with active status
    const existingMember = event.teamMembers.find(
      (m) => m.user.toString() === userId && m.status === 'active'
    );
    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already part of the team'
      });
    }

    // Add team lead with permissions and time bounds
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
      addedAt: Date.now(),
      startTime: (startTime && typeof startTime === 'string' && startTime.trim() !== '') ? new Date(startTime) : null,
      endTime: (endTime && typeof endTime === 'string' && endTime.trim() !== '') ? new Date(endTime) : null,
      status: 'active'
    });

    // If this is the first team lead, also set as primary team lead
    if (!event.teamLead) {
      event.teamLead = userId;
    }

    await event.save();

    const updatedEvent = await Event.findById(id)
      .populate('teamLead', 'name email')
      .populate('teamMembers.user', 'name email');

    // Log team lead addition
    await Log.create({
      eventId: event._id,
      eventName: event.title,
      actionType: 'TEAM_MEMBER_ADDED',
      entityType: 'TEAM',
      action: 'Team lead added to event',
      details: `${user.name} (${user.email}) added as team lead by admin`,
      actorType: 'ADMIN',
      actorId: req.user?._id,
      actorName: req.user?.name || 'Admin',
      actorEmail: req.user?.email || '',
      severity: 'INFO',
      newState: {
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        role: 'TEAM_LEAD',
        permissions
      }
    });

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

    const event = await Event.findById(id).populate('teamMembers.user', 'name email');
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Find the member being removed for logging
    const removedMember = event.teamMembers.find(m => m.user._id.toString() === userId);
    const removedUser = removedMember?.user;

    // Remove team lead from team members
    event.teamMembers = event.teamMembers.filter(
      (m) => m.user._id.toString() !== userId
    );

    // If removing the primary team lead, set new primary if other team leads exist
    if (event.teamLead?.toString() === userId) {
      const remainingTeamLead = event.teamMembers.find(m => m.role === 'TEAM_LEAD');
      event.teamLead = remainingTeamLead ? remainingTeamLead.user._id : null;
    }

    await event.save();

    const updatedEvent = await Event.findById(id)
      .populate('teamLead', 'name email')
      .populate('teamMembers.user', 'name email');

    // Log team lead removal
    if (removedUser) {
      await Log.create({
        eventId: event._id,
        eventName: event.title,
        actionType: 'TEAM_MEMBER_REMOVED',
        entityType: 'TEAM',
        action: 'Team lead removed from event',
        details: `${removedUser.name} (${removedUser.email}) removed as team lead by admin`,
        actorType: 'ADMIN',
        actorId: req.user?._id,
        actorName: req.user?.name || 'Admin',
        actorEmail: req.user?.email || '',
        severity: 'WARNING',
        oldState: {
          userId: removedUser._id,
          userName: removedUser.name,
          userEmail: removedUser.email,
          role: 'TEAM_LEAD'
        }
      });
    }

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

    const oldEvent = await Event.findById(id);
    const oldStatus = oldEvent.status;

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

    // Create log entry for status change
    await Log.create({
      eventId: event._id,
      eventName: event.title,
      actionType: 'EVENT_STATE_CHANGED',
      entityType: 'EVENT',
      action: 'Event status changed',
      details: `Event "${event.title}" status changed from ${oldStatus} to ${status}`,
      actorType: req.user?.role === 'ADMIN' ? 'ADMIN' : 'ORGANIZER',
      actorId: req.user?._id,
      actorName: req.user?.name || 'System',
      actorEmail: req.user?.email || '',
      severity: status === 'cancelled' ? 'WARNING' : 'INFO',
      oldState: { status: oldStatus },
      newState: { status: status }
    });

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
    const { userId, permissions, startTime, endTime } = req.body;

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

    // Check if user is already a team member with active status
    const existingMember = event.teamMembers.find(
      (m) => m.user.toString() === userId && m.status === 'active'
    );
    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already a team member'
      });
    }

    const memberPermissions = permissions || {
      canViewParticipants: true,
      canManageAttendance: true,
      canSendEmails: false,
      canGenerateCertificates: false,
      canEditEvent: false,
    };

    // Add team member with permissions and time bounds
    event.teamMembers.push({
      user: userId,
      role: 'TEAM_MEMBER',
      permissions: memberPermissions,
      addedAt: Date.now(),
      startTime: (startTime && typeof startTime === 'string' && startTime.trim() !== '') ? new Date(startTime) : null,
      endTime: (endTime && typeof endTime === 'string' && endTime.trim() !== '') ? new Date(endTime) : null,
      status: 'active'
    });

    await event.save();

    const updatedEvent = await Event.findById(id)
      .populate('teamLead', 'name email')
      .populate('teamMembers.user', 'name email');

    // Log team member addition
    await Log.create({
      eventId: event._id,
      eventName: event.title,
      actionType: 'TEAM_MEMBER_ADDED',
      entityType: 'TEAM',
      action: 'Team member added to event',
      details: `${user.name} (${user.email}) added as team member by admin`,
      actorType: 'ADMIN',
      actorId: req.user?._id,
      actorName: req.user?.name || 'Admin',
      actorEmail: req.user?.email || '',
      severity: 'INFO',
      newState: {
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        role: 'TEAM_MEMBER',
        permissions: memberPermissions
      }
    });

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

    const event = await Event.findById(id).populate('teamMembers.user', 'name email');
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Find the member being removed for logging
    const removedMember = event.teamMembers.find(m => m.user._id.toString() === userId);
    const removedUser = removedMember?.user;

    // Remove team member
    event.teamMembers = event.teamMembers.filter(
      (m) => m.user._id.toString() !== userId
    );

    await event.save();

    const updatedEvent = await Event.findById(id)
      .populate('teamLead', 'name email')
      .populate('teamMembers.user', 'name email');

    // Log team member removal
    if (removedUser) {
      await Log.create({
        eventId: event._id,
        eventName: event.title,
        actionType: 'TEAM_MEMBER_REMOVED',
        entityType: 'TEAM',
        action: 'Team member removed from event',
        details: `${removedUser.name} (${removedUser.email}) removed as team member by admin`,
        actorType: 'ADMIN',
        actorId: req.user?._id,
        actorName: req.user?.name || 'Admin',
        actorEmail: req.user?.email || '',
        severity: 'WARNING',
        oldState: {
          userId: removedUser._id,
          userName: removedUser.name,
          userEmail: removedUser.email,
          role: removedMember.role
        }
      });
    }

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

    const member = event.teamMembers[memberIndex];
    const oldPermissions = { ...member.permissions };

    // Update individual member's permissions
    event.teamMembers[memberIndex].permissions = {
      ...event.teamMembers[memberIndex].permissions,
      ...permissions
    };

    await event.save();

    const updatedEvent = await Event.findById(id)
      .populate('teamLead', 'name email')
      .populate('teamMembers.user', 'name email');

    // Log permission update
    await Log.create({
      eventId: event._id,
      eventName: event.title,
      actionType: 'TEAM_PERMISSIONS_UPDATED',
      entityType: 'TEAM',
      action: 'Team member permissions updated',
      details: `Permissions updated for ${member.user.name} (${member.user.email}) by admin`,
      actorType: 'ADMIN',
      actorId: req.user?._id,
      actorName: req.user?.name || 'Admin',
      actorEmail: req.user?.email || '',
      severity: 'INFO',
      oldState: {
        userId: member.user._id,
        userName: member.user.name,
        permissions: oldPermissions
      },
      newState: {
        userId: member.user._id,
        userName: member.user.name,
        permissions: event.teamMembers[memberIndex].permissions
      }
    });

    res.json({
      success: true,
      message: 'Permissions updated successfully',
      data: updatedEvent
    });
  } catch (error) {
    console.error('Error updating team member permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating permissions',
      error: error.message
    });
  }
});

// @desc    Get role history for a user across all events
// @route   GET /api/events/user/:userId/role-history
router.get('/user/:userId/role-history', async (req, res) => {
  try {
    const { userId } = req.params;
    const { includeActive, includeCompleted, includeRemoved } = req.query;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Build status filter
    const statusFilter = [];
    if (includeActive !== 'false') statusFilter.push('active');
    if (includeCompleted === 'true') statusFilter.push('completed');
    if (includeRemoved === 'true') statusFilter.push('removed');

    // Find all events where the user is a team member
    const events = await Event.find({
      'teamMembers.user': userId
    })
    .populate('createdBy', 'name email')
    .populate('teamLead', 'name email')
    .sort({ startDate: -1 });

    // Extract role history
    const roleHistory = [];
    for (const event of events) {
      const userRoles = event.teamMembers.filter(
        (member) => member.user.toString() === userId && 
        (statusFilter.length === 0 || statusFilter.includes(member.status))
      );

      for (const role of userRoles) {
        // Calculate if the role is currently active based on time bounds
        const now = new Date();
        const isTimeActive = (!role.startTime || new Date(role.startTime) <= now) &&
                            (!role.endTime || new Date(role.endTime) >= now);

        roleHistory.push({
          eventId: event._id,
          eventTitle: event.title,
          eventStartDate: event.startDate,
          eventEndDate: event.endDate,
          eventStatus: event.status,
          role: role.role,
          permissions: role.permissions,
          addedAt: role.addedAt,
          startTime: role.startTime,
          endTime: role.endTime,
          status: role.status,
          isTimeActive: isTimeActive,
          removalReason: role.removalReason,
          removedAt: role.removedAt,
          teamLead: event.teamLead ? {
            id: event.teamLead._id,
            name: event.teamLead.name,
            email: event.teamLead.email
          } : null
        });
      }
    }

    // Sort by added date (most recent first)
    roleHistory.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));

    res.json({
      success: true,
      count: roleHistory.length,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        },
        roleHistory: roleHistory
      }
    });
  } catch (error) {
    console.error('Error fetching role history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching role history',
      error: error.message
    });
  }
});

// @desc    Update time bounds for a team member
// @route   PUT /api/events/:eventId/team-members/:userId/time-bounds
router.put('/:eventId/team-members/:userId/time-bounds', async (req, res) => {
  try {
    const { eventId, userId } = req.params;
    const { startTime, endTime } = req.body;

    if (!isValidObjectId(eventId) || !isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const memberIndex = event.teamMembers.findIndex(
      (m) => m.user.toString() === userId && m.status === 'active'
    );

    if (memberIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found or not active'
      });
    }

    // Update time bounds
    event.teamMembers[memberIndex].startTime = (startTime && typeof startTime === 'string' && startTime.trim() !== '') ? new Date(startTime) : null;
    event.teamMembers[memberIndex].endTime = (endTime && typeof endTime === 'string' && endTime.trim() !== '') ? new Date(endTime) : null;

    await event.save();

    const updatedEvent = await Event.findById(eventId)
      .populate('teamMembers.user', 'name email');

    res.json({
      success: true,
      message: 'Time bounds updated successfully',
      data: {
        event: {
          id: event._id,
          title: event.title
        },
        member: updatedEvent.teamMembers[memberIndex]
      }
    });
  } catch (error) {
    console.error('Error updating time bounds:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating time bounds',
      error: error.message
    });
  }
});

// @desc    Mark team member role as completed or remove
// @route   PUT /api/events/:eventId/team-members/:userId/status
router.put('/:eventId/team-members/:userId/status', async (req, res) => {
  try {
    const { eventId, userId } = req.params;
    const { status, reason } = req.body;

    if (!isValidObjectId(eventId) || !isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }

    if (!['active', 'completed', 'removed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be active, completed, or removed'
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const memberIndex = event.teamMembers.findIndex(
      (m) => m.user.toString() === userId && m.status === 'active'
    );

    if (memberIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Active team member not found'
      });
    }

    // Update status
    event.teamMembers[memberIndex].status = status;
    
    if (status === 'removed') {
      event.teamMembers[memberIndex].removalReason = reason || '';
      event.teamMembers[memberIndex].removedAt = new Date();
    } else if (status === 'completed') {
      // Optionally set endTime to now if not already set
      if (!event.teamMembers[memberIndex].endTime) {
        event.teamMembers[memberIndex].endTime = new Date();
      }
    }

    await event.save();

    const updatedEvent = await Event.findById(eventId)
      .populate('teamMembers.user', 'name email');

    // Log status change
    await Log.create({
      eventId: event._id,
      eventName: event.title,
      actionType: 'TEAM_MEMBER_STATUS_CHANGED',
      entityType: 'TEAM',
      action: `Team member status changed to ${status}`,
      details: reason ? `Reason: ${reason}` : `Status changed to ${status}`,
      actorType: 'ADMIN',
      actorId: req.user?._id,
      actorName: req.user?.name || 'Admin',
      actorEmail: req.user?.email || '',
      severity: 'INFO'
    });

    res.json({
      success: true,
      message: `Team member status updated to ${status}`,
      data: {
        event: {
          id: event._id,
          title: event.title
        },
        member: updatedEvent.teamMembers[memberIndex]
      }
    });
  } catch (error) {
    console.error('Error updating member status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating member status',
      error: error.message
    });
  }
});

export default router;

