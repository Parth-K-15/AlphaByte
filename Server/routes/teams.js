import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../models/User.js';

const router = express.Router();

// Helper function to validate ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// GET /api/teams/leads - Get all team leads
router.get('/leads', async (req, res) => {
  try {
    const teamLeads = await User.find({ 
      role: 'TEAM_LEAD',
      isActive: true 
    }).select('name email phone');
    
    res.json({ 
      success: true, 
      count: teamLeads.length,
      data: teamLeads 
    });
  } catch (error) {
    console.error('Error fetching team leads:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// GET /api/teams/members - Get all team members
router.get('/members', async (req, res) => {
  try {
    const teamMembers = await User.find({ 
      role: 'EVENT_STAFF',
      isActive: true 
    })
    .populate('teamLead', 'name email')
    .select('name email phone teamLead assignedEvent');
    
    res.json({ 
      success: true, 
      count: teamMembers.length,
      data: teamMembers 
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// POST /api/teams/leads - Create a team lead
router.post('/leads', async (req, res) => {
  try {
    const { name, email, password = '12345678' } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name and email are required' 
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create team lead
    const teamLead = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'TEAM_LEAD',
      isActive: true
    });
    
    await teamLead.save();
    
    res.status(201).json({ 
      success: true, 
      message: 'Team lead created successfully',
      data: {
        _id: teamLead._id,
        name: teamLead.name,
        email: teamLead.email,
        role: teamLead.role
      }
    });
  } catch (error) {
    console.error('Error creating team lead:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// POST /api/teams/members - Create a team member
router.post('/members', async (req, res) => {
  try {
    const { name, email, teamLead, password = '12345678' } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name and email are required' 
      });
    }
    
    // Validate teamLead ID if provided
    if (teamLead && !isValidObjectId(teamLead)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid team lead ID' 
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create team member
    const member = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'EVENT_STAFF',
      teamLead: teamLead || null,
      isActive: true
    });
    
    await member.save();
    
    // Populate teamLead for response
    await member.populate('teamLead', 'name email');
    
    res.status(201).json({ 
      success: true, 
      message: 'Team member created successfully',
      data: {
        _id: member._id,
        name: member.name,
        email: member.email,
        role: member.role,
        teamLead: member.teamLead
      }
    });
  } catch (error) {
    console.error('Error creating team member:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// TODO: Implement other team routes
router.get('/', (req, res) => {
  res.json({ success: true, data: [], message: 'Team routes - to be implemented' });
});

export default router;
