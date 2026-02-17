import express from 'express';
import Certificate from '../models/Certificate.js';
import { tokenBucketRateLimit } from "../middleware/rateLimit.js";

const router = express.Router();

const verifyLimiter = tokenBucketRateLimit({
  name: "public:verify:certificate",
  capacity: 60,
  refillTokens: 60,
  refillIntervalMs: 60_000,
});

/**
 * @desc    Verify a certificate by its unique verificationId (public - no auth required)
 * @route   GET /api/verify/:verificationId
 * @access  Public
 */
router.get('/:verificationId', verifyLimiter, async (req, res) => {
  try {
    const { verificationId } = req.params;

    if (!verificationId || verificationId.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification ID',
      });
    }

    const certificate = await Certificate.findOne({ verificationId })
      .populate('event', 'title description category type status startDate endDate time location venue organizationName departmentName')
      .populate('participant', 'name fullName email college branch year')
      .populate('issuedBy', 'name email')
      .lean();

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found. This QR code may be invalid.',
      });
    }

    // Check if certificate is revoked
    if (certificate.status === 'REVOKED' || !certificate.isValid) {
      return res.json({
        success: true,
        data: {
          verified: false,
          status: 'REVOKED',
          message: 'This certificate has been revoked.',
          revokedAt: certificate.revokedAt,
          revocationReason: certificate.revocationReason,
          certificateId: certificate.certificateId,
        },
      });
    }

    // Build verification response
    const event = certificate.event || {};
    const participant = certificate.participant || {};
    const issuer = certificate.issuedBy || {};

    res.json({
      success: true,
      data: {
        verified: true,
        status: certificate.status,
        certificateId: certificate.certificateId,
        participant: {
          name: participant.name || participant.fullName || 'Unknown',
          email: participant.email,
          college: participant.college || null,
          branch: participant.branch || null,
          year: participant.year || null,
        },
        event: {
          name: event.title || 'Unknown Event',
          description: event.description || null,
          category: event.category || null,
          type: event.type || null,
          location: event.location || null,
          venue: event.venue || null,
          startDate: event.startDate,
          endDate: event.endDate,
          time: event.time || null,
        },
        achievement: certificate.achievement || 'Participation',
        competitionName: certificate.competitionName || event.title || null,
        organizer: {
          name: issuer.name || 'Event Organizer',
          organization: event.organizationName || 'PCET\'s Pimpri Chinchwad College of Engineering',
          department: event.departmentName || 'Department of Computer Science & Engineering',
        },
        issuedAt: certificate.issuedAt,
        template: certificate.template,
        cloudinaryUrl: certificate.cloudinaryUrl || null,
      },
    });
  } catch (error) {
    console.error('Certificate verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying certificate',
    });
  }
});

export default router;
