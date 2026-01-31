import User from '../models/User.js';
import Team from '../models/Team.js';
import Event from '../models/Event.js';
import bcrypt from 'bcryptjs';

// Get all team leads
export const getTeamLeads = async (req, res) => {
  try {
    const teamLeads = await User.find({ role: 'TEAM_LEAD' })
      .select('-password')
      .populate('assignedEvent', 'title');

    // Get events managed count for each team lead
    const teamLeadsWithStats = await Promise.all(
      teamLeads.map(async (lead) => {
        const eventsManaged = await Event.countDocuments({ teamLead: lead._id });
        return {
          ...lead.toObject(),
          eventsManaged
        };
      })
    );

    res.json({
      success: true,
      count: teamLeads.length,
      data: teamLeadsWithStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching team leads',
      error: error.message
    });
  }
};

// Get all event staff (members)
export const getEventStaff = async (req, res) => {
  try {
    const { teamLeadId } = req.query;
    
    let query = { role: 'EVENT_STAFF' };
    
    if (teamLeadId) {
      query.teamLead = teamLeadId;
    }

    const staff = await User.find(query)
      .select('-password')
      .populate('teamLead', 'name email')
      .populate('assignedEvent', 'title');

    res.json({
      success: true,
      count: staff.length,
      data: staff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching event staff',
      error: error.message
    });
  }
};

// Create team lead
export const createTeamLead = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || 'tempPassword123', salt);

    const teamLead = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: 'TEAM_LEAD',
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Team lead created successfully',
      data: {
        _id: teamLead._id,
        name: teamLead.name,
        email: teamLead.email,
        role: teamLead.role,
        isActive: teamLead.isActive,
        createdAt: teamLead.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating team lead',
      error: error.message
    });
  }
};

// Create event staff member
export const createEventStaff = async (req, res) => {
  try {
    const { name, email, phone, password, teamLeadId, eventId } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || 'tempPassword123', salt);

    const staff = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: 'EVENT_STAFF',
      teamLead: teamLeadId || undefined,
      assignedEvent: eventId || undefined,
      isActive: true
    });

    // If event is assigned, add staff to event's teamMembers
    if (eventId) {
      await Event.findByIdAndUpdate(eventId, {
        $addToSet: { teamMembers: staff._id }
      });
    }

    const populatedStaff = await User.findById(staff._id)
      .select('-password')
      .populate('teamLead', 'name email')
      .populate('assignedEvent', 'title');

    res.status(201).json({
      success: true,
      message: 'Event staff created successfully',
      data: populatedStaff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating event staff',
      error: error.message
    });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { name, email, phone, teamLeadId, eventId } = req.body;

    const updateData = { name, email, phone };
    
    if (teamLeadId) updateData.teamLead = teamLeadId;
    if (eventId) updateData.assignedEvent = eventId;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .select('-password')
      .populate('teamLead', 'name email')
      .populate('assignedEvent', 'title');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove user from events
    await Event.updateMany(
      { teamMembers: req.params.id },
      { $pull: { teamMembers: req.params.id } }
    );

    await Event.updateMany(
      { teamLead: req.params.id },
      { $unset: { teamLead: 1 } }
    );

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};

// Reset user password
export const resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { password: hashedPassword },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message
    });
  }
};

// Get role permissions
export const getPermissions = async (req, res) => {
  try {
    // Default permissions matrix
    const permissions = {
      TEAM_LEAD: {
        editEvent: true,
        deleteEvent: true,
        sendCertificates: true,
        addParticipants: true,
        viewReports: true,
        manageMembers: true,
        archiveEvent: true
      },
      EVENT_STAFF: {
        editEvent: false,
        deleteEvent: false,
        sendCertificates: true,
        addParticipants: false,
        viewReports: true,
        manageMembers: false,
        archiveEvent: false
      }
    };

    res.json({
      success: true,
      data: permissions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching permissions',
      error: error.message
    });
  }
};

// Update role permissions (store in a separate collection or config)
export const updatePermissions = async (req, res) => {
  try {
    const { permissions } = req.body;

    // In a real app, store this in a Permissions collection or config
    // For now, just return success
    res.json({
      success: true,
      message: 'Permissions updated successfully',
      data: permissions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating permissions',
      error: error.message
    });
  }
};
