import express from 'express';
import mongoose from 'mongoose';
import Event from '../models/Event.js';
import Participant from '../models/Participant.js';
import Attendance from '../models/Attendance.js';
import Certificate from '../models/Certificate.js';
import CertificateRequest from '../models/CertificateRequest.js';
import EventUpdate from '../models/EventUpdate.js';
import User from '../models/User.js';
import EventRole from '../models/EventRole.js';
import Log from '../models/Log.js';
import activeSessions from "../utils/sessionStore.js";
import { isWithinGeoFence } from "../utils/geoUtils.js";
import { cache } from "../middleware/cache.js";
import { CacheKeys, CacheTTL } from "../utils/cacheKeys.js";
import { invalidateEventCache, invalidateParticipantCache } from "../utils/cacheInvalidation.js";
import { CachePatterns } from "../utils/cacheKeys.js";
import { tokenBucketRateLimit } from "../middleware/rateLimit.js";
import IdempotencyKey from "../models/IdempotencyKey.js";
import crypto from "crypto";
import { maybeDecryptPii, maybeEncryptPii, maskPhone } from "../utils/piiCrypto.js";

const router = express.Router();

const attendanceScanLimiter = tokenBucketRateLimit({
  name: "participant:attendance:scan",
  capacity: 10,
  refillTokens: 10,
  refillIntervalMs: 60_000,
  identifier: (req) => {
    const xff = req.headers["x-forwarded-for"];
    const ip = typeof xff === "string" && xff.trim() ? xff.split(",")[0].trim() : (req.ip || "unknown");
    const email = (req.body?.email || "").toString().trim().toLowerCase();
    const eventId = (req.body?.eventId || "").toString().trim();
    return `${ip}:${email || "noemail"}:${eventId || "noevent"}`;
  },
});

const buildRequestHash = (payload) => {
  try {
    return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  } catch {
    return null;
  }
};

const getOrCreateIdempotencyRecord = async ({ scope, key, requestHash, ttlMs }) => {
  const existing = await IdempotencyKey.findOne({ scope, key }).lean();
  if (existing?.status === "COMPLETED") {
    return { kind: "HIT", record: existing };
  }

  const expiresAt = new Date(Date.now() + ttlMs);

  try {
    const created = await IdempotencyKey.create({
      scope,
      key,
      requestHash,
      status: "IN_PROGRESS",
      expiresAt,
    });
    return { kind: "MISS", record: created.toObject() };
  } catch (error) {
    // If another request created it concurrently, re-fetch
    if (error?.code === 11000) {
      const concurrent = await IdempotencyKey.findOne({ scope, key }).lean();
      if (concurrent?.status === "COMPLETED") {
        return { kind: "HIT", record: concurrent };
      }
      return { kind: "IN_PROGRESS", record: concurrent || null };
    }
    throw error;
  }
};

// Helper function to validate ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// =====================
// EVENT DISCOVERY APIs
// =====================

// GET /api/participant/events - Browse all available events
router.get(
  "/events",
  cache(CacheTTL.MEDIUM, (req) =>
    CacheKeys.eventList({
      search: req.query.search,
      status: req.query.status,
      category: req.query.category,
      type: req.query.type,
    }),
  ),
  async (req, res) => {
    try {
      const { search, status, category, type } = req.query;

      // Build filter - only show upcoming, ongoing events (not draft/cancelled)
      const filter = {
        status: { $in: ["upcoming", "ongoing"] },
      };

      // Apply status filter if provided
      if (status && ["upcoming", "ongoing", "completed"].includes(status)) {
        filter.status = status;
      }

      // Search by title, description, location
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { location: { $regex: search, $options: "i" } },
          { venue: { $regex: search, $options: "i" } },
        ];
      }

      // Category filter
      if (category) {
        filter.category = category;
      }

      // Type filter (Online/Offline/Hybrid)
      if (type) {
        filter.type = type;
      }

      const events = await Event.find(filter)
        .select(
          "title description location venue startDate endDate time status registrationFee maxParticipants registrationDeadline category type bannerImage tags",
        )
        .sort({ startDate: 1 });

      // Get participant counts for each event
      const eventsWithCounts = await Promise.all(
        events.map(async (event) => {
          const participantCount = await Participant.countDocuments({
            event: event._id,
            registrationStatus: { $in: ["PENDING", "CONFIRMED"] },
          });

          return {
            ...event.toObject(),
            participantCount,
            spotsLeft: event.maxParticipants
              ? event.maxParticipants - participantCount
              : null,
            isRegistrationOpen: event.registrationDeadline
              ? new Date(event.registrationDeadline) > new Date()
              : true,
          };
        }),
      );

      res.json({
        success: true,
        count: eventsWithCounts.length,
        data: eventsWithCounts,
      });
    } catch (error) {
      console.error("Error fetching events:", error);
      res
        .status(500)
        .json({
          success: false,
          message: "Server error",
          error: error.message,
        });
    }
  },
);

// GET /api/participant/events/:id - Get single event details
router.get(
  "/events/:id",
  cache(CacheTTL.LONG, (req) => CacheKeys.event(req.params.id)),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid event ID" });
      }

      const event = await Event.findById(id)
        .populate("teamLead", "name email")
        .populate("createdBy", "name");

      if (!event) {
        return res
          .status(404)
          .json({ success: false, message: "Event not found" });
      }

      // Get participant count
      const participantCount = await Participant.countDocuments({
        event: id,
        registrationStatus: { $in: ["PENDING", "CONFIRMED"] },
      });

      // Get event updates (visible ones only)
      const updates = await EventUpdate.find({
        event: id,
        isVisible: true,
      })
        .sort({ isPinned: -1, createdAt: -1 })
        .limit(10);

      res.json({
        success: true,
        data: {
          ...event.toObject(),
          participantCount,
          spotsLeft: event.maxParticipants
            ? event.maxParticipants - participantCount
            : null,
          isRegistrationOpen: event.registrationDeadline
            ? new Date(event.registrationDeadline) > new Date()
            : true,
          updates,
        },
      });
    } catch (error) {
      console.error("Error fetching event details:", error);
      res
        .status(500)
        .json({
          success: false,
          message: "Server error",
          error: error.message,
        });
    }
  },
);

// =====================
// REGISTRATION APIs
// =====================

// POST /api/participant/register - Register for an event
router.post("/register", async (req, res) => {
  try {
    const { eventId, fullName, email, phone, college, year, branch } = req.body;

    // Validate required fields
    if (!eventId || !fullName || !email) {
      return res.status(400).json({
        success: false,
        message: "Event ID, full name, and email are required",
      });
    }

    if (!isValidObjectId(eventId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid event ID" });
    }

    // Check if event exists and is open for registration
    const event = await Event.findById(eventId);
    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    // Check event status
    if (!["upcoming", "ongoing"].includes(event.status)) {
      return res.status(400).json({
        success: false,
        message: "Registration is not open for this event",
      });
    }

    // Check registration deadline
    if (
      event.registrationDeadline &&
      new Date(event.registrationDeadline) < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "Registration deadline has passed",
      });
    }

    // Check if already registered
    const existingRegistration = await Participant.findOne({
      event: eventId,
      email: email.toLowerCase(),
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: "You are already registered for this event",
        registration: existingRegistration,
      });
    }

    // Check max participants
    if (event.maxParticipants) {
      const currentCount = await Participant.countDocuments({
        event: eventId,
        registrationStatus: { $in: ["PENDING", "CONFIRMED"] },
      });

      if (currentCount >= event.maxParticipants) {
        return res.status(400).json({
          success: false,
          message: "Event is full. No more spots available.",
        });
      }
    }

    // Create participant registration
    const participant = new Participant({
      fullName,
      name: fullName,
      email: email.toLowerCase(),
      phone,
      college,
      year,
      branch,
      event: eventId,
      registrationStatus: event.registrationFee === 0 ? "CONFIRMED" : "PENDING", // Auto-confirm free events
      registrationType: "ONLINE",
      attendanceStatus: "PENDING",
      certificateStatus: "PENDING",
    });

    await participant.save();

    // Auto-create EventRole for transcript
    try {
      const existingRole = await EventRole.findOne({
        email: email.toLowerCase(),
        event: eventId,
        role: 'participant',
      });
      if (!existingRole) {
        await EventRole.create({
          email: email.toLowerCase(),
          name: fullName,
          event: eventId,
          role: 'participant',
          startTime: event.startDate || new Date(),
          endTime: event.endDate || undefined,
          durationMinutes: event.startDate && event.endDate
            ? Math.round((new Date(event.endDate) - new Date(event.startDate)) / 60000)
            : 0,
          status: 'active',
          source: 'auto',
          details: { notes: 'Registered' },
        });
      }
    } catch (roleErr) {
      console.error('EventRole auto-create error (non-blocking):', roleErr);
    }

    
    // Create log entry for registration
    await Log.create({
      eventId,
      eventName: event.title,
      participantId: participant._id,
      participantName: fullName,
      participantEmail: email.toLowerCase(),
      actionType: 'STUDENT_REGISTERED',
      entityType: 'PARTICIPATION',
      action: 'Student registered for event',
      details: `${fullName} registered for "${event.title}" (${event.registrationFee === 0 ? 'Free' : 'Paid'} event)`,
      actorType: 'STUDENT',
      actorId: participant._id,
      actorName: fullName,
      actorEmail: email.toLowerCase(),
      severity: 'INFO',
      newState: {
        registrationStatus: participant.registrationStatus,
        registrationType: 'ONLINE',
        fee: event.registrationFee
      }
    });
    
    // Invalidate caches for event and event lists
    await invalidateEventCache(eventId);

    res.status(201).json({
      success: true,
      message:
        event.registrationFee === 0
          ? "Registration successful! You are confirmed."
          : "Registration successful! Awaiting confirmation.",
      data: participant,
    });
  } catch (error) {
    console.error("Error registering for event:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
});

// =====================
// MY REGISTRATIONS APIs
// =====================

// GET /api/participant/my-events - Get participant's registered events
router.get("/my-events", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required to fetch registrations",
      });
    }

    const registrations = await Participant.find({
      email: email.toLowerCase(),
    })
      .populate(
        "event",
        "title description location venue startDate endDate time status bannerImage",
      )
      .sort({ createdAt: -1 });

    // Enrich with attendance (source of truth) and certificate info
    const enrichedRegistrations = await Promise.all(
      registrations.map(async (reg) => {
        const attendance = await Attendance.findOne({
          event: reg.event?._id || reg.event,
          participant: reg._id,
        });
        const certificate = await Certificate.findOne({
          participant: reg._id,
        });

        return {
          ...reg.toObject(),
          // Use Attendance collection as the source of truth
          attendanceStatus: attendance ? 'ATTENDED' : (reg.attendanceStatus === 'ATTENDED' ? 'ABSENT' : reg.attendanceStatus),
          attendedAt: attendance?.scannedAt || null,
          certificate: certificate
            ? {
                certificateId: certificate.certificateId,
                status: certificate.status,
                certificateUrl: certificate.certificateUrl,
              }
            : null,
        };
      }),
    );

    res.json({
      success: true,
      count: enrichedRegistrations.length,
      data: enrichedRegistrations,
    });
  } catch (error) {
    console.error("Error fetching registrations:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
});

// GET /api/participant/registration/:eventId - Check registration status for an event
router.get("/registration/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;
    const { email } = req.query;

    if (!isValidObjectId(eventId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid event ID" });
    }

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const registration = await Participant.findOne({
      event: eventId,
      email: email.toLowerCase(),
    });

    res.json({
      success: true,
      isRegistered: !!registration,
      data: registration,
    });
  } catch (error) {
    console.error("Error checking registration:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
});

// DELETE /api/participant/registration/:eventId - Cancel registration
router.delete("/registration/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;
    const { email } = req.query;

    if (!isValidObjectId(eventId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid event ID" });
    }

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const registration = await Participant.findOne({
      event: eventId,
      email: email.toLowerCase(),
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    // Check if attendance is already marked
    if (registration.attendanceStatus === "ATTENDED") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel registration after attendance is marked",
      });
    }

    // Update status to CANCELLED
    registration.registrationStatus = "CANCELLED";
    await registration.save();

    res.json({
      success: true,
      message: "Registration cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling registration:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
});

// =====================
// QR ATTENDANCE APIs
// =====================

// POST /api/participant/attendance/scan - Scan QR to mark attendance
router.post("/attendance/scan", attendanceScanLimiter, async (req, res) => {
  try {
    const { eventId, email, sessionId, latitude, longitude } = req.body;

    if (!eventId || !email) {
      return res.status(400).json({
        success: false,
        message: "Event ID and email are required",
      });
    }

    if (!isValidObjectId(eventId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid event ID" });
    }

    // Validate QR session if sessionId is provided (for dynamic QR codes)
    // Static QR codes (eventId only) are also supported
    if (sessionId) {
      const session = await activeSessions.get(sessionId);
      if (!session) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired dynamic QR code. Ask the organizer to generate a new one.',
          code: 'INVALID_SESSION'
        });
      }
      if (Date.now() > session.expiresAt) {
        await activeSessions.delete(sessionId);
        return res.status(400).json({
          success: false,
          message: 'Dynamic QR code has expired. Ask the organizer to generate a new one.',
          code: 'SESSION_EXPIRED'
        });
      }
      if (session.eventId !== eventId) {
        return res.status(400).json({
          success: false,
          message: 'QR code does not match this event.',
          code: 'EVENT_MISMATCH'
        });
      }

      // Geo-fence validation: only enforced when organizer enabled it for this session
      if (session.geoFence && session.geoFence.enabled) {
        if (latitude == null || longitude == null) {
          return res.status(400).json({
            success: false,
            message: 'Location is required for this event. Please enable GPS and try again.',
            code: 'LOCATION_REQUIRED'
          });
        }
        const geoCheck = isWithinGeoFence(
          { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
          session.geoFence
        );
        if (!geoCheck.allowed) {
          return res.status(403).json({
            success: false,
            message: `You are ${geoCheck.distance}m away from the event venue. You must be within ${session.geoFence.radiusMeters}m to mark attendance.`,
            code: 'OUT_OF_RANGE',
            distance: geoCheck.distance,
            requiredRadius: session.geoFence.radiusMeters,
          });
        }
      }
    }

    // Idempotency: after basic QR validations, but before any DB writes.
    // If client provides Idempotency-Key, we honor it. Otherwise we derive one from payload.
    const providedKey = (req.get("Idempotency-Key") || "").trim();
    const derivedKey = crypto
      .createHash("sha256")
      .update(`${eventId}|${email.toLowerCase()}|${sessionId}`)
      .digest("hex");
    const idempotencyKey = providedKey || derivedKey;
    const scope = `ATTENDANCE_SCAN:${eventId}:${email.toLowerCase()}`;
    const requestHash = buildRequestHash({ eventId, email: email.toLowerCase(), sessionId });

    const idem = await getOrCreateIdempotencyRecord({
      scope,
      key: idempotencyKey,
      requestHash,
      ttlMs: 24 * 60 * 60 * 1000,
    });

    if (idem.kind === "HIT") {
      return res.status(idem.record.statusCode || 200).json(idem.record.responseBody);
    }

    if (idem.kind === "IN_PROGRESS") {
      res.setHeader("Retry-After", "1");
      return res.status(409).json({
        success: false,
        message: "Attendance scan is already being processed. Please retry.",
        code: "IDEMPOTENCY_IN_PROGRESS",
      });
    }

    // Verify event exists and is active
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
        code: "EVENT_NOT_FOUND",
      });
    }

    // Find the participant
    const participant = await Participant.findOne({
      event: eventId,
      email: email.toLowerCase(),
    });

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: "You are not registered for this event",
        code: "NOT_REGISTERED",
      });
    }

    // Check if registration is confirmed
    if (participant.registrationStatus === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "Your registration has been cancelled",
        code: "CANCELLED",
      });
    }

    // Check if attendance already marked
    const existingAttendance = await Attendance.findOne({
      event: eventId,
      participant: participant._id,
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: "Attendance already marked",
        code: "ALREADY_MARKED",
        scannedAt: existingAttendance.scannedAt,
      });
    }

    // Mark attendance
    const attendanceData = {
      event: eventId,
      participant: participant._id,
      scannedAt: new Date(),
      status: "PRESENT",
    };
    if (sessionId) {
      attendanceData.sessionId = sessionId;
    }
    // markedBy expects a User ObjectId – look up the linked user, else skip
    if (participant.user) {
      attendanceData.markedBy = participant.user;
    }
    const attendance = new Attendance(attendanceData);

    try {
      await attendance.save();
    } catch (saveError) {
      // Unique index exists on (event, participant). If a concurrent request already inserted, treat as already marked.
      if (saveError?.code === 11000) {
        const already = await Attendance.findOne({
          event: eventId,
          participant: participant._id,
        });
        if (already) {
          const body = {
            success: true,
            message: "Attendance already marked",
            code: "ALREADY_MARKED",
            data: {
              participantName: participant.fullName,
              eventId,
              eventTitle: event.title,
              scannedAt: already.scannedAt,
            },
          };
          await IdempotencyKey.updateOne(
            { scope, key: idempotencyKey },
            {
              $set: {
                status: "COMPLETED",
                statusCode: 200,
                responseBody: body,
                completedAt: new Date(),
              },
            },
          );
          return res.json(body);
        }
      }
      throw saveError;
    }

    // Update participant's attendance status
    participant.attendanceStatus = "ATTENDED";
    if (participant.registrationStatus === "PENDING") {
      participant.registrationStatus = "CONFIRMED";
    }
    await participant.save();

    const responseBody = {
      success: true,
      message: "Attendance marked successfully!",
      code: "SUCCESS",
      data: {
        participantName: participant.fullName,
        eventId,
        eventTitle: event.title,
        scannedAt: attendance.scannedAt,
      },
    };

    await IdempotencyKey.updateOne(
      { scope, key: idempotencyKey },
      {
        $set: {
          status: "COMPLETED",
          statusCode: 200,
          responseBody,
          completedAt: new Date(),
        },
      },
    );

    res.json(responseBody);
  } catch (error) {
    console.error("Error marking attendance:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// GET /api/participant/attendance/:eventId - Check attendance status
router.get("/attendance/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;
    const { email } = req.query;

    if (!isValidObjectId(eventId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid event ID" });
    }

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const participant = await Participant.findOne({
      event: eventId,
      email: email.toLowerCase(),
    });

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    const attendance = await Attendance.findOne({
      event: eventId,
      participant: participant._id,
    });

    res.json({
      success: true,
      isAttended: !!attendance,
      attendanceStatus: participant.attendanceStatus,
      scannedAt: attendance?.scannedAt,
    });
  } catch (error) {
    console.error("Error checking attendance:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
});

// =====================
// CERTIFICATE APIs
// =====================

// Old simple route removed - using detailed route below (line ~870)
// that returns certificates, attended events, all events, and stats

// GET /api/participant/certificates/:certificateId - Get single certificate
router.get("/certificates/:certificateId", async (req, res) => {
  try {
    const { certificateId } = req.params;

    const certificate = await Certificate.findOne({ certificateId })
      .populate({
        path: "event",
        select: "title description startDate endDate location venue",
      })
      .populate({
        path: "participant",
        select: "fullName email college branch year",
      });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    res.json({
      success: true,
      data: certificate,
    });
  } catch (error) {
    console.error("Error fetching certificate:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
});

// PUT /api/participant/certificates/:certificateId/download - Mark certificate as downloaded
router.put("/certificates/:certificateId/download", async (req, res) => {
  try {
    const { certificateId } = req.params;

    const certificate = await Certificate.findOne({ certificateId });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    certificate.status = "DOWNLOADED";
    await certificate.save();

    // Update participant's certificate status
    await Participant.findByIdAndUpdate(certificate.participant, {
      certificateStatus: "SENT",
    });

    res.json({
      success: true,
      message: "Certificate download recorded",
      data: certificate,
    });
  } catch (error) {
    console.error("Error recording download:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
});

// =====================
// HISTORY APIs
// =====================

// GET /api/participant/history - Get complete participation history
router.get("/history", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const history = await Participant.find({
      email: email.toLowerCase(),
    })
      .populate(
        "event",
        "title description location venue startDate endDate status bannerImage",
      )
      .sort({ createdAt: -1 });

    // Enrich with certificate and attendance details
    const enrichedHistory = await Promise.all(
      history.map(async (record) => {
        const attendance = await Attendance.findOne({
          participant: record._id,
        });
        const certificate = await Certificate.findOne({
          participant: record._id,
        });

        return {
          ...record.toObject(),
          attendance: attendance
            ? {
                scannedAt: attendance.scannedAt,
                status: attendance.status,
              }
            : null,
          certificate: certificate
            ? {
                certificateId: certificate.certificateId,
                status: certificate.status,
                certificateUrl: certificate.certificateUrl,
                issuedAt: certificate.issuedAt,
              }
            : null,
        };
      }),
    );

    // Calculate stats
    const stats = {
      totalRegistrations: history.length,
      attended: history.filter((h) => h.attendanceStatus === "ATTENDED").length,
      certificatesEarned: enrichedHistory.filter((h) => h.certificate).length,
      upcomingEvents: history.filter(
        (h) => h.event && h.event.status === "upcoming",
      ).length,
    };

    res.json({
      success: true,
      stats,
      data: enrichedHistory,
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
});

// =====================
// EVENT UPDATES APIs
// =====================

// GET /api/participant/updates/:eventId - Get event updates
router.get("/updates/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!isValidObjectId(eventId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid event ID" });
    }

    const updates = await EventUpdate.find({
      event: eventId,
      isVisible: true,
    }).sort({ isPinned: -1, createdAt: -1 });

    res.json({
      success: true,
      count: updates.length,
      data: updates,
    });
  } catch (error) {
    console.error("Error fetching updates:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
});

// =====================
// PROFILE APIs
// =====================

// GET /api/participant/profile - Get participant profile
router.get("/profile", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Get the most recent participant record to build profile
    const latestParticipant = await Participant.findOne({
      email: email.toLowerCase(),
    }).sort({ createdAt: -1 });

    if (!latestParticipant) {
      return res.status(404).json({
        success: false,
        message:
          "Profile not found. Register for an event to create your profile.",
      });
    }

    // Get participation stats
    const totalRegistrations = await Participant.countDocuments({
      email: email.toLowerCase(),
    });

    const attendedCount = await Participant.countDocuments({
      email: email.toLowerCase(),
      attendanceStatus: "ATTENDED",
    });

    const participantIds = await Participant.find({
      email: email.toLowerCase(),
    }).select("_id");

    const certificatesCount = await Certificate.countDocuments({
      participant: { $in: participantIds.map((p) => p._id) },
    });

    res.json({
      success: true,
      data: {
        fullName: latestParticipant.fullName,
        email: latestParticipant.email,
        phone: maskPhone(maybeDecryptPii(latestParticipant.phone)),
        college: latestParticipant.college,
        branch: latestParticipant.branch,
        year: latestParticipant.year,
        stats: {
          totalRegistrations,
          attendedCount,
          certificatesCount,
        },
        memberSince: latestParticipant.createdAt,
      },
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
});

// PUT /api/participant/profile - Update participant profile
router.put("/profile", async (req, res) => {
  try {
    const { email, fullName, phone, college, branch, year } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Update all participant records for this email
    const updateResult = await Participant.updateMany(
      { email: email.toLowerCase() },
      {
        $set: {
          fullName: fullName || undefined,
          name: fullName || undefined,
          phone: phone !== undefined ? maybeEncryptPii(phone || "") : undefined,
          college: college || undefined,
          branch: branch || undefined,
          year: year || undefined,
        },
      },
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      modifiedCount: updateResult.modifiedCount,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
});

// =====================
// CALENDAR APIs
// =====================

// GET /api/participant/calendar - Get events for calendar view
router.get("/calendar", async (req, res) => {
  try {
    const { email, month, year } = req.query;

    // Get all public events for the calendar
    const filter = {
      status: { $in: ["upcoming", "ongoing", "completed"] },
    };

    // Filter by month/year if provided
    if (month && year) {
      const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endOfMonth = new Date(
        parseInt(year),
        parseInt(month),
        0,
        23,
        59,
        59,
      );
      filter.startDate = { $gte: startOfMonth, $lte: endOfMonth };
    }

    const events = await Event.find(filter)
      .select("title startDate endDate status location venue")
      .sort({ startDate: 1 });

    // If email provided, mark which events the participant is registered for
    let registeredEventIds = [];
    if (email) {
      const registrations = await Participant.find({
        email: email.toLowerCase(),
        registrationStatus: { $ne: "CANCELLED" },
      }).select("event");
      registeredEventIds = registrations.map((r) => r.event.toString());
    }

    const calendarEvents = events.map((event) => ({
      ...event.toObject(),
      isRegistered: registeredEventIds.includes(event._id.toString()),
    }));

    res.json({
      success: true,
      count: calendarEvents.length,
      data: calendarEvents,
    });
  } catch (error) {
    console.error("Error fetching calendar:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
});

// =====================
// CERTIFICATE APIs
// =====================

// GET /api/participant/certificates - Get all certificates for a participant by email
router.get("/certificates", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    console.log(`📋 Fetching certificates for participant: ${email}`);

    // Find ALL participant records for this email (across all events)
    const allParticipantRecords = await Participant.find({
      email: email.toLowerCase(),
    }).populate("event", "title name startDate endDate status");

    console.log(`📊 Found ${allParticipantRecords.length} participant records`);

    // Log each participant record details
    allParticipantRecords.forEach((record, index) => {
      console.log(`  Record ${index + 1}:`, {
        id: record._id,
        email: record.email,
        event: record.event
          ? {
              id: record.event._id,
              title: record.event.title || record.event.name,
              status: record.event.status,
            }
          : "NO EVENT",
        attendanceStatus: record.attendanceStatus,
      });
    });

    const participantIds = allParticipantRecords.map((p) => p._id);

    // Get all certificates for any of this participant's records
    const certificates = await Certificate.find({
      participant: { $in: participantIds },
    })
      .populate("event", "title name startDate endDate status")
      .populate("issuedBy", "name email")
      .sort({ issuedAt: -1 });

    console.log(`🏆 Found ${certificates.length} certificates`);

    // Get QR-scanned attendance records
    const qrAttendance = await Attendance.find({
      participant: { $in: participantIds },
    });
    const qrAttendedEventIds = qrAttendance.map((a) => a.event.toString());

    console.log(`✅ QR Attendance records: ${qrAttendance.length}`);
    if (qrAttendance.length > 0) {
      console.log(`   QR Event IDs: ${qrAttendedEventIds.join(", ")}`);
    }

    // Build attended events list (includes BOTH QR scanned AND manual attendance)
    const attendedEvents = [];
    const certificateEventIds = certificates.map((c) => c.event._id.toString());

    console.log(
      `\n📋 Analyzing ${allParticipantRecords.length} participant records for attended events...`,
    );

    for (const record of allParticipantRecords) {
      if (!record.event) {
        console.log(`⚠️ Skipping record ${record._id} - No event populated`);
        continue;
      }

      const eventId = record.event._id.toString();
      const hasQrAttendance = qrAttendedEventIds.includes(eventId);
      const hasManualAttendance = record.attendanceStatus === "ATTENDED";
      const hasCertificate = certificateEventIds.includes(eventId);
      const isCompleted =
        record.event.status &&
        record.event.status.toLowerCase() === "completed";

      console.log(`\n  Event: ${record.event.title || record.event.name}`);
      console.log(`    - Event ID: ${eventId}`);
      console.log(
        `    - Event Status: "${record.event.status}" (isCompleted: ${isCompleted})`,
      );
      console.log(`    - QR Attendance: ${hasQrAttendance}`);
      console.log(
        `    - Manual Attendance Status: "${record.attendanceStatus}" (hasManualAttendance: ${hasManualAttendance})`,
      );
      console.log(`    - Has Certificate: ${hasCertificate}`);
      console.log(
        `    - Eligible: ${(hasQrAttendance || hasManualAttendance) && isCompleted && !hasCertificate}`,
      );

      // Include if: (QR scanned OR manually marked) AND event is completed AND no certificate yet
      if (
        (hasQrAttendance || hasManualAttendance) &&
        isCompleted &&
        !hasCertificate
      ) {
        console.log(`    ✅ ADDED to attended events list`);
        attendedEvents.push({
          ...record.event.toObject(),
          attendanceType: hasQrAttendance ? "QR Scanned" : "Manual",
          participantRecordId: record._id,
        });
      } else {
        console.log(`    ❌ NOT ADDED - Missing criteria`);
      }
    }

    console.log(
      `\n📝 Attended events without certificates: ${attendedEvents.length}`,
    );
    console.log(
      `   - Events: ${attendedEvents.map((e) => e.title || e.name).join(", ")}`,
    );

    // All registered events with status
    const allEvents = allParticipantRecords
      .filter((p) => p.event)
      .map((p) => {
        const eventId = p.event._id.toString();
        const hasQrAttendance = qrAttendedEventIds.includes(eventId);
        const hasManualAttendance = p.attendanceStatus === "ATTENDED";

        return {
          ...p.event.toObject(),
          hasAttendance: hasQrAttendance || hasManualAttendance,
          attendanceType: hasQrAttendance
            ? "QR"
            : hasManualAttendance
              ? "Manual"
              : "None",
          hasCertificate: certificateEventIds.includes(eventId),
          participantRecordId: p._id,
        };
      });

    
    // Calculate total attended events (WITH or WITHOUT certificates)
    const totalAttendedEvents = allEvents.filter(e => e.hasAttendance).length;
    
    res.json({
      success: true,
      data: {
        certificates,
        attendedEventsWithoutCertificate: attendedEvents,
        allEvents,
        stats: {
          total: certificates.length,
          attended: totalAttendedEvents,
          registered: allEvents.length
        }
      }
    });
  } catch (error) {
    console.error("Error fetching certificates:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
});

// POST /api/participant/certificates/request - Request a certificate
router.post("/certificates/request", async (req, res) => {
  try {
    const { participantId, eventId } = req.body;

    if (!isValidObjectId(participantId) || !isValidObjectId(eventId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid participant or event ID" });
    }

    // Check if participant attended the event
    const attendance = await Attendance.findOne({
      participant: participantId,
      event: eventId,
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message:
          "You did not attend this event. Only participants who attended can request certificates.",
      });
    }

    // Check if certificate already exists
    const existingCert = await Certificate.findOne({
      participant: participantId,
      event: eventId,
    });

    if (existingCert) {
      return res.status(400).json({
        success: false,
        message: "You already have a certificate for this event.",
      });
    }

    // Check if request already exists
    const existingRequest = await CertificateRequest.findOne({
      participant: participantId,
      event: eventId,
      status: { $in: ["PENDING", "APPROVED"] },
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "You have already requested a certificate for this event.",
      });
    }

    // Create request
    const request = await CertificateRequest.create({
      participant: participantId,
      event: eventId,
    });

    const populatedRequest = await CertificateRequest.findById(request._id)
      .populate("event", "title name startDate")
      .populate("participant", "name email");

    res.json({
      success: true,
      message:
        "Certificate request submitted successfully. The organizer will process it soon.",
      data: populatedRequest,
    });
  } catch (error) {
    console.error("Error requesting certificate:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
});

export default router;
