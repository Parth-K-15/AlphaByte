import User from '../models/User.js';

// Get restricted users
export const getRestrictedUsers = async (req, res) => {
  try {
    const users = await User.find({ isActive: false })
      .select('-password')
      .populate('teamLead', 'name email')
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching restricted users',
      error: error.message
    });
  }
};

// Restrict user (deactivate)
export const restrictUser = async (req, res) => {
  try {
    const { userId, reason } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        isActive: false,
        restrictionReason: reason,
        restrictedAt: new Date()
      },
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
      message: 'User restricted successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error restricting user',
      error: error.message
    });
  }
};

// Unrestrict user (reactivate)
export const unrestrictUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        isActive: true,
        $unset: { restrictionReason: 1, restrictedAt: 1 }
      },
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
      message: 'User unrestricted successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error unrestricting user',
      error: error.message
    });
  }
};

// Suspend user (complete block)
export const suspendUser = async (req, res) => {
  try {
    const { userId, reason } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        isActive: false,
        isSuspended: true,
        suspensionReason: reason,
        suspendedAt: new Date()
      },
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
      message: 'User suspended successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error suspending user',
      error: error.message
    });
  }
};

// Get suspended users
export const getSuspendedUsers = async (req, res) => {
  try {
    const users = await User.find({ isSuspended: true })
      .select('-password')
      .sort({ suspendedAt: -1 });

    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching suspended users',
      error: error.message
    });
  }
};

// Unsuspend user
export const unsuspendUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        isActive: true,
        isSuspended: false,
        $unset: { suspensionReason: 1, suspendedAt: 1 }
      },
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
      message: 'User unsuspended successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error unsuspending user',
      error: error.message
    });
  }
};

// Delete user permanently
export const deleteUserPermanently = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted permanently'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};
