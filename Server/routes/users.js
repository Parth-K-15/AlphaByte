import express from 'express';
import User from '../models/User.js';
import { verifyToken, authorizeRoles } from '../middleware/auth.js';
import { isEncryptedPii, maybeDecryptPii, maskPhone } from '../utils/piiCrypto.js';
import { auditPiiAccess } from '../utils/piiAudit.js';

const router = express.Router();

// Users endpoints are privileged (staff only)
router.use(verifyToken, authorizeRoles('ADMIN', 'TEAM_LEAD'));

// @desc    Get all users
// @route   GET /api/users
router.get('/', async (req, res) => {
  try {
    const { role, search, isActive } = req.query;
    
    let query = {};
    
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .populate('teamLead', 'name email')
      .populate('assignedEvent', 'title')
      .sort({ createdAt: -1 });

    const sanitized = users.map((u) => {
      const obj = u.toObject();
      obj.phone = maskPhone(maybeDecryptPii(obj.phone));
      return obj;
    });

    res.json({
      success: true,
      count: sanitized.length,
      data: sanitized
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// @desc    Get single user
// @route   GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('teamLead', 'name email')
      .populate('assignedEvent', 'title');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const wantsFull = (req.query?.pii || '').toString() === 'full';
    const reason = (req.query?.reason || '').toString().trim();

    const obj = user.toObject();
    if (wantsFull && reason) {
      obj.phone = maybeDecryptPii(obj.phone);
      if (isEncryptedPii(obj.phone)) {
        return res.status(503).json({
          success: false,
          message: 'PII decryption unavailable (missing/invalid encryption key)'
        });
      }
      await auditPiiAccess({
        req,
        entityType: 'USER',
        targetUserId: obj._id,
        fields: ['phone'],
        reason,
      });
    } else {
      obj.phone = maskPhone(maybeDecryptPii(obj.phone));
    }

    res.json({
      success: true,
      data: obj
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
});

// @desc    Toggle user active status
// @route   PUT /api/users/:id/toggle-status
router.put('/:id/toggle-status', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling user status',
      error: error.message
    });
  }
});

export default router;
