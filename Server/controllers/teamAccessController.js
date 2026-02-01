import Event from '../models/Event.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

// Helper to validate MongoDB ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id) && /^[a-fA-F0-9]{24}$/.test(id);

// Get team members for an event
export const getTeamMembers = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!isValidObjectId(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    }

    const event = await Event.findById(eventId)
      .populate('teamMembers.user', 'name email role')
      .select('teamMembers');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const teamMembers = event.teamMembers.map(member => ({
      _id: member._id || member.user._id,
      user: member.user,
      role: member.role || 'TEAM_MEMBER',
      permissions: member.permissions || {
        canViewParticipants: true,
        canManageAttendance: true,
        canSendEmails: false,
        canGenerateCertificates: false,
        canEditEvent: false
      },
      addedAt: member.addedAt || new Date()
    }));

    res.json({
      success: true,
      data: teamMembers
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching team members',
      error: error.message
    });
  }
};

// Add team member to an event
export const addTeamMember = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!isValidObjectId(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID format' });
    }

    const { email, name, permissions } = req.body;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Try to find existing user
    let user = await User.findOne({ email });
    
    // Check if email is already a team member
    if (user) {
      const existingMember = event.teamMembers?.find(
        m => m.user.toString() === user._id.toString()
      );
      if (existingMember) {
        return res.status(400).json({
          success: false,
          message: 'User is already a team member for this event'
        });
      }
    }

    // If user doesn't exist, create a pending user account
    if (!user) {
      // Create a temporary password (they'll need to reset it on first login)
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      
      user = await User.create({
        email,
        name: name || email.split('@')[0], // Use email username if name not provided
        password: hashedPassword,
        role: 'ORGANIZER',
        isActive: false, // Mark as inactive until they verify
        phone: '',
        invitedBy: event.teamLead,
        invitedAt: new Date()
      });

      // TODO: Send invitation email with temporary password
      // For now, we'll just log it
      console.log(`User invited: ${email}, temp password: ${tempPassword}`);
    }

    // Add team member
    const newMember = {
      user: user._id,
      role: 'TEAM_MEMBER',
      permissions: permissions || {
        canViewParticipants: true,
        canManageAttendance: true,
        canSendEmails: false,
        canGenerateCertificates: false,
        canEditEvent: false
      },
      addedAt: new Date()
    };

    if (!event.teamMembers) {
      event.teamMembers = [];
    }
    event.teamMembers.push(newMember);
    await event.save();

    res.status(201).json({
      success: true,
      message: user.isActive ? 'Team member added successfully' : 'Invitation sent! User will need to activate their account.',
      data: {
        _id: newMember.user,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email
        },
        role: newMember.role,
        permissions: newMember.permissions,
        addedAt: newMember.addedAt
      },
      message: 'Team member added successfully'
    });
  } catch (error) {
    console.error('Error adding team member:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding team member',
      error: error.message
    });
  }
};

// Remove team member from an event
export const removeTeamMember = async (req, res) => {
  try {
    const { eventId, memberId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const memberIndex = event.teamMembers?.findIndex(
      m => m.user.toString() === memberId || m._id?.toString() === memberId
    );

    if (memberIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    event.teamMembers.splice(memberIndex, 1);
    await event.save();

    res.json({
      success: true,
      message: 'Team member removed successfully'
    });
  } catch (error) {
    console.error('Error removing team member:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing team member',
      error: error.message
    });
  }
};

// Update team member permissions
export const updateTeamMemberPermissions = async (req, res) => {
  try {
    const { eventId, memberId } = req.params;
    const { permissions } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const member = event.teamMembers?.find(
      m => m.user.toString() === memberId || m._id?.toString() === memberId
    );

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    member.permissions = {
      ...member.permissions,
      ...permissions
    };

    await event.save();

    res.json({
      success: true,
      data: {
        permissions: member.permissions
      },
      message: 'Permissions updated successfully'
    });
  } catch (error) {
    console.error('Error updating permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating permissions',
      error: error.message
    });
  }
};
