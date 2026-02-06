import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// GET /api/access-control/restricted - Get all restricted users
router.get('/restricted', async (req, res) => {
  try {
    const restrictedUsers = await User.find({ 
      isActive: false 
    }).select('name email role restrictionReason restrictedAt updatedAt');
    
    const formattedUsers = restrictedUsers.map(user => ({
      ...user.toObject(),
      restrictionType: 'Restricted',
      type: user.role === 'TEAM_LEAD' ? 'Team Lead' : 'Event Staff'
    }));
    
    res.json({ 
      success: true, 
      count: formattedUsers.length,
      data: formattedUsers 
    });
  } catch (error) {
    console.error('Error fetching restricted users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// GET /api/access-control/suspended - Get all suspended users
router.get('/suspended', async (req, res) => {
  try {
    const suspendedUsers = await User.find({ 
      isSuspended: true 
    }).select('name email role suspensionReason suspendedAt updatedAt');
    
    const formattedUsers = suspendedUsers.map(user => ({
      ...user.toObject(),
      restrictionType: 'Suspended',
      type: user.role === 'TEAM_LEAD' ? 'Team Lead' : 'Event Staff'
    }));
    
    res.json({ 
      success: true, 
      count: formattedUsers.length,
      data: formattedUsers 
    });
  } catch (error) {
    console.error('Error fetching suspended users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// POST /api/access-control/restrict - Restrict a user
router.post('/restrict', async (req, res) => {
  try {
    const { userId, reason } = req.body;
    
    if (!userId || !reason) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID and reason are required' 
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    user.isActive = false;
    user.restrictionReason = reason;
    user.restrictedAt = new Date();
    await user.save();
    
    res.json({ 
      success: true, 
      message: 'User restricted successfully',
      data: user
    });
  } catch (error) {
    console.error('Error restricting user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// POST /api/access-control/suspend - Suspend a user
router.post('/suspend', async (req, res) => {
  try {
    const { userId, reason } = req.body;
    
    if (!userId || !reason) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID and reason are required' 
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    user.isSuspended = true;
    user.suspensionReason = reason;
    user.suspendedAt = new Date();
    await user.save();
    
    res.json({ 
      success: true, 
      message: 'User suspended successfully',
      data: user
    });
  } catch (error) {
    console.error('Error suspending user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// DELETE /api/access-control/restrict/:userId - Unrestrict a user
router.delete('/restrict/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    user.isActive = true;
    user.restrictionReason = undefined;
    user.restrictedAt = undefined;
    await user.save();
    
    res.json({ 
      success: true, 
      message: 'User unrestricted successfully',
      data: user
    });
  } catch (error) {
    console.error('Error unrestricting user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// DELETE /api/access-control/suspend/:userId - Unsuspend a user
router.delete('/suspend/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    user.isSuspended = false;
    user.suspensionReason = undefined;
    user.suspendedAt = undefined;
    await user.save();
    
    res.json({ 
      success: true, 
      message: 'User unsuspended successfully',
      data: user
    });
  } catch (error) {
    console.error('Error unsuspending user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

export default router;
