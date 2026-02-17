import express from 'express';
import bcrypt from 'bcrypt';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import ParticipantAuth from '../models/ParticipantAuth.js';
import { verifyToken } from '../middleware/auth.js';
import { isEncryptedPii, maybeDecryptPii } from '../utils/piiCrypto.js';

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// @desc    Get participant profile
// @route   GET /api/participant/profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    // req.userId is set by verifyToken middleware
    const participantDoc = await ParticipantAuth.findById(req.userId).select('-password');
    
    if (!participantDoc) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found',
      });
    }

    const participant = participantDoc.toObject();
    participant.phone = maybeDecryptPii(participant.phone);
    if (isEncryptedPii(participant.phone)) participant.phone = null;

    res.json({
      success: true,
      data: participant,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message,
    });
  }
});

// @desc    Update participant profile
// @route   PUT /api/participant/profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { name, phone, college, branch, year } = req.body;
    
    const participant = await ParticipantAuth.findById(req.userId);
    
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found',
      });
    }

    // Update allowed fields
    if (name) participant.name = name;
    if (phone !== undefined) participant.phone = phone;
    if (college !== undefined) participant.college = college;
    if (branch !== undefined) participant.branch = branch;
    if (year !== undefined) participant.year = year;

    await participant.save();

    // Return without password
    const updatedDoc = await ParticipantAuth.findById(req.userId).select('-password');
    const updatedParticipant = updatedDoc ? updatedDoc.toObject() : null;
    if (updatedParticipant) {
      updatedParticipant.phone = maybeDecryptPii(updatedParticipant.phone);
      if (isEncryptedPii(updatedParticipant.phone)) updatedParticipant.phone = null;
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedParticipant,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message,
    });
  }
});

// @desc    Change password
// @route   PUT /api/participant/profile/password
router.put('/profile/password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate inputs
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long',
      });
    }

    const participant = await ParticipantAuth.findById(req.userId);
    
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found',
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, participant.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    participant.password = hashedPassword;
    await participant.save();

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message,
    });
  }
});

// @desc    Upload avatar
// @route   POST /api/participant/profile/avatar
router.post('/profile/avatar', verifyToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided',
      });
    }

    const participant = await ParticipantAuth.findById(req.userId);
    
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found',
      });
    }

    // Delete old avatar from cloudinary if exists
    if (participant.avatar && participant.avatarPublicId) {
      try {
        await cloudinary.uploader.destroy(participant.avatarPublicId);
      } catch (error) {
        console.error('Error deleting old avatar:', error);
      }
    }

    // Upload to Cloudinary using stream
    const uploadStream = () => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'alphabyte/participants',
            transformation: [
              { width: 400, height: 400, crop: 'fill', gravity: 'face' },
              { quality: 'auto' }
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });
    };

    const uploadResult = await uploadStream();

    // Update participant with new avatar
    participant.avatar = uploadResult.secure_url;
    participant.avatarPublicId = uploadResult.public_id;
    await participant.save();

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        avatar: uploadResult.secure_url,
      },
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading avatar',
      error: error.message,
    });
  }
});

// @desc    Delete avatar
// @route   DELETE /api/participant/profile/avatar
router.delete('/profile/avatar', verifyToken, async (req, res) => {
  try {
    const participant = await ParticipantAuth.findById(req.userId);
    
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found',
      });
    }

    // Delete from cloudinary if exists
    if (participant.avatar && participant.avatarPublicId) {
      try {
        await cloudinary.uploader.destroy(participant.avatarPublicId);
      } catch (error) {
        console.error('Error deleting avatar from cloudinary:', error);
      }
    }

    // Remove avatar from database
    participant.avatar = undefined;
    participant.avatarPublicId = undefined;
    await participant.save();

    res.json({
      success: true,
      message: 'Avatar deleted successfully',
    });
  } catch (error) {
    console.error('Delete avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting avatar',
      error: error.message,
    });
  }
});

export default router;
