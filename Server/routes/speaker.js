import express from 'express';
import { verifyToken, isSpeaker } from '../middleware/auth.js';
import Session from '../models/Session.js';
import SpeakerAuth from '../models/SpeakerAuth.js';
import SpeakerReview from '../models/SpeakerReview.js';
import EventRole from '../models/EventRole.js';
import { isEncryptedPii, maybeDecryptPii, maybeEncryptPii } from '../utils/piiCrypto.js';

const router = express.Router();

// All routes require speaker authentication
router.use(verifyToken, isSpeaker);

// @desc    Get speaker dashboard stats
// @route   GET /api/speaker/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const speakerId = req.userId;

    const sessions = await Session.find({ speaker: speakerId })
      .populate('event', 'title startDate endDate status location venue')
      .sort({ 'time.start': 1 });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaySessions = sessions.filter(s => {
      if (!s.time?.start) return false;
      const sessionDate = new Date(s.time.start);
      return sessionDate >= today && sessionDate < tomorrow;
    });

    const upcomingSessions = sessions.filter(s => {
      if (!s.time?.start) return false;
      return new Date(s.time.start) >= tomorrow;
    });

    const completedSessions = sessions.filter(s => s.status === 'completed');

    const totalRegistered = sessions.reduce((sum, s) => sum + (s.registeredCount || 0), 0);
    const totalCheckedIn = sessions.reduce((sum, s) => sum + (s.checkedInCount || 0), 0);

    // Get reviews
    const reviews = await SpeakerReview.find({ speaker: speakerId });
    const avgRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        totalSessions: sessions.length,
        todaySessions: todaySessions.length,
        upcomingSessions: upcomingSessions.length,
        completedSessions: completedSessions.length,
        totalRegistered,
        totalCheckedIn,
        avgRating: parseFloat(avgRating),
        totalReviews: reviews.length,
        todaySessionsList: todaySessions,
        upcomingSessionsList: upcomingSessions.slice(0, 5),
      },
    });
  } catch (error) {
    console.error('Speaker dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message,
    });
  }
});

// @desc    Get all sessions for speaker
// @route   GET /api/speaker/sessions
router.get('/sessions', async (req, res) => {
  try {
    const speakerId = req.userId;
    const { status, sort } = req.query;

    const filter = { speaker: speakerId };
    if (status) filter.status = status;

    const sortOrder = sort === 'oldest' ? 1 : -1;

    const sessions = await Session.find(filter)
      .populate('event', 'title startDate endDate status location venue bannerImage')
      .sort({ 'time.start': sortOrder });

    res.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sessions',
      error: error.message,
    });
  }
});

// @desc    Get single session details
// @route   GET /api/speaker/sessions/:id
router.get('/sessions/:id', async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      speaker: req.userId,
    }).populate('event', 'title startDate endDate status location venue bannerImage');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching session',
      error: error.message,
    });
  }
});

// @desc    Update session details (bio, abstract, learning outcomes, AV needs)
// @route   PUT /api/speaker/sessions/:id
router.put('/sessions/:id', async (req, res) => {
  try {
    const { abstract, learningOutcomes, avNeeds, description } = req.body;

    const session = await Session.findOne({
      _id: req.params.id,
      speaker: req.userId,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    if (abstract !== undefined) session.abstract = abstract;
    if (learningOutcomes !== undefined) session.learningOutcomes = learningOutcomes;
    if (avNeeds !== undefined) session.avNeeds = avNeeds;
    if (description !== undefined) session.description = description;

    await session.save();

    res.json({
      success: true,
      message: 'Session updated successfully',
      data: session,
    });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating session',
      error: error.message,
    });
  }
});

// @desc    Confirm or reject an assigned session
// @route   PUT /api/speaker/sessions/:id/assignment
router.put('/sessions/:id/assignment', async (req, res) => {
  try {
    const { decision, reason } = req.body;

    if (!['confirm', 'reject'].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: "Decision must be 'confirm' or 'reject'",
      });
    }

    const session = await Session.findOne({
      _id: req.params.id,
      speaker: req.userId,
    }).populate('event', 'title startDate endDate status location venue bannerImage');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    if (session.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This session is not pending confirmation',
      });
    }

    session.assignment = session.assignment || {};
    session.assignment.respondedAt = new Date();

    if (decision === 'confirm') {
      session.status = 'confirmed';
      session.assignment.rejectionReason = '';
    } else {
      if (!reason || !String(reason).trim()) {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is required',
        });
      }
      session.status = 'rejected';
      session.assignment.rejectionReason = String(reason).trim();
    }

    await session.save();

    // Auto-create EventRole when speaker confirms
    if (decision === 'confirm') {
      try {
        const speaker = await SpeakerAuth.findById(req.userId);
        if (speaker) {
          const existingRole = await EventRole.findOne({
            email: speaker.email.toLowerCase(),
            event: session.event._id,
            role: 'speaker',
            'details.sessionId': session._id,
          });
          if (!existingRole) {
            const startTime = session.time?.start || session.event?.startDate;
            const endTime = session.time?.end || session.event?.endDate;
            let durationMinutes = 0;
            if (startTime && endTime) {
              durationMinutes = Math.round(
                (new Date(endTime) - new Date(startTime)) / 60000
              );
            }
            await EventRole.create({
              email: speaker.email.toLowerCase(),
              name: speaker.name || speaker.email,
              event: session.event._id,
              role: 'speaker',
              startTime,
              endTime,
              durationMinutes: durationMinutes > 0 ? durationMinutes : 0,
              status: 'active',
              source: 'auto',
              details: {
                topic: session.title || '',
                sessionId: session._id,
                notes: session.description || '',
              },
            });
          }
        }
      } catch (roleErr) {
        console.error('EventRole auto-create error (non-blocking):', roleErr);
      }
    }

    res.json({
      success: true,
      message: decision === 'confirm' ? 'Session confirmed' : 'Session rejected',
      data: session,
    });
  } catch (error) {
    console.error('Assignment decision error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating assignment decision',
      error: error.message,
    });
  }
});

// @desc    Upload materials/slides to a session
// @route   POST /api/speaker/sessions/:id/materials
router.post('/sessions/:id/materials', async (req, res) => {
  try {
    const { name, url, publicId } = req.body;

    if (!name || !url) {
      return res.status(400).json({
        success: false,
        message: 'Material name and URL are required',
      });
    }

    const session = await Session.findOne({
      _id: req.params.id,
      speaker: req.userId,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    session.slides.push({
      name,
      url,
      publicId: publicId || '',
      uploadedAt: new Date(),
    });

    await session.save();

    res.json({
      success: true,
      message: 'Material uploaded successfully',
      data: session,
    });
  } catch (error) {
    console.error('Upload material error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading material',
      error: error.message,
    });
  }
});

// @desc    Delete a material from session
// @route   DELETE /api/speaker/sessions/:id/materials/:materialId
router.delete('/sessions/:id/materials/:materialId', async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      speaker: req.userId,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    session.slides = session.slides.filter(
      (s) => s._id.toString() !== req.params.materialId
    );

    await session.save();

    res.json({
      success: true,
      message: 'Material deleted successfully',
      data: session,
    });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting material',
      error: error.message,
    });
  }
});

// @desc    Post a session update
// @route   POST /api/speaker/sessions/:id/updates
router.post('/sessions/:id/updates', async (req, res) => {
  try {
    const { message, type } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Update message is required',
      });
    }

    const session = await Session.findOne({
      _id: req.params.id,
      speaker: req.userId,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    session.updates.push({
      message,
      type: type || 'general',
      status: 'pending',
      createdAt: new Date(),
    });

    await session.save();

    res.json({
      success: true,
      message: 'Update posted successfully (pending organizer approval)',
      data: session,
    });
  } catch (error) {
    console.error('Post update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error posting update',
      error: error.message,
    });
  }
});

// @desc    Get session analytics
// @route   GET /api/speaker/sessions/:id/analytics
router.get('/sessions/:id/analytics', async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      speaker: req.userId,
    }).populate('event', 'title');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    res.json({
      success: true,
      data: {
        sessionTitle: session.title,
        eventTitle: session.event?.title,
        registeredCount: session.registeredCount,
        checkedInCount: session.checkedInCount,
        status: session.status,
        updatesCount: session.updates.length,
        materialsCount: session.slides.length,
      },
    });
  } catch (error) {
    console.error('Session analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching session analytics',
      error: error.message,
    });
  }
});

// @desc    Get speaker profile
// @route   GET /api/speaker/profile
router.get('/profile', async (req, res) => {
  try {
    const speaker = await SpeakerAuth.findById(req.userId).select('-password');

    if (!speaker) {
      return res.status(404).json({
        success: false,
        message: 'Speaker not found',
      });
    }

    // Get reviews
    const reviews = await SpeakerReview.find({ speaker: req.userId })
      .populate('organizer', 'name')
      .populate('event', 'title')
      .populate('session', 'title')
      .sort({ createdAt: -1 });

    const avgRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        ...speaker.toObject(),
        phone: (() => {
          const v = maybeDecryptPii(speaker.phone);
          return isEncryptedPii(v) ? null : v;
        })(),
        reviews,
        avgRating: parseFloat(avgRating),
        totalReviews: reviews.length,
      },
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

// @desc    Update speaker profile
// @route   PUT /api/speaker/profile
router.put('/profile', async (req, res) => {
  try {
    const { name, phone, bio, specializations, socialLinks, headshot, headshotPublicId, pastSpeakingRecords } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = maybeEncryptPii(phone);
    if (bio !== undefined) updateData.bio = bio;
    if (specializations !== undefined) updateData.specializations = specializations;
    if (socialLinks !== undefined) updateData.socialLinks = socialLinks;
    if (headshot !== undefined) updateData.headshot = headshot;
    if (headshotPublicId !== undefined) updateData.headshotPublicId = headshotPublicId;
    if (pastSpeakingRecords !== undefined) updateData.pastSpeakingRecords = pastSpeakingRecords;

    const speaker = await SpeakerAuth.findByIdAndUpdate(
      req.userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!speaker) {
      return res.status(404).json({
        success: false,
        message: 'Speaker not found',
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        ...speaker.toObject(),
        phone: (() => {
          const v = maybeDecryptPii(speaker.phone);
          return isEncryptedPii(v) ? null : v;
        })(),
      },
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

export default router;
