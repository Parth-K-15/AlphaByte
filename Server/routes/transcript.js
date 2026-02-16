import express from "express";
import mongoose from "mongoose";
import EventRole from "../models/EventRole.js";
import Event from "../models/Event.js";
import Participant from "../models/Participant.js";
import Attendance from "../models/Attendance.js";
import Session from "../models/Session.js";
import SpeakerAuth from "../models/SpeakerAuth.js";
import User from "../models/User.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// ===================================================================
// SYNC: populate EventRole from existing Participant / Session / User
// ===================================================================

// @desc    Sync roles for the currently logged-in student (by email)
// @route   POST /api/transcript/sync
router.post("/sync", verifyToken, async (req, res) => {
  try {
    const email =
      req.user?.email?.toLowerCase?.() ||
      req.body?.email?.toLowerCase?.();
    const name = req.user?.name || req.body?.name || "Unknown";

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    let created = 0;

    // 1) Participant roles (from Participant registrations)
    const registrations = await Participant.find({
      email: { $regex: new RegExp(`^${email}$`, "i") },
      registrationStatus: { $in: ["PENDING", "CONFIRMED"] },
    }).populate("event", "title startDate endDate status");

    // Track processed events to avoid duplicates
    const processedEvents = new Set();

    for (const reg of registrations) {
      if (!reg.event) continue;

      const eventId = reg.event._id.toString();
      
      // Skip if we already processed this event for this user
      if (processedEvents.has(eventId)) {
        console.log(`Skipping duplicate participant role for event ${eventId}`);
        continue;
      }

      const exists = await EventRole.findOne({
        email: { $regex: new RegExp(`^${email}$`, "i") },
        event: reg.event._id,
        role: "participant",
      });

      if (!exists) {
        // Check attendance for duration
        const attendance = await Attendance.findOne({
          event: reg.event._id,
          participant: reg._id,
        });

        const startTime = reg.event.startDate || reg.createdAt;
        const endTime = reg.event.endDate || undefined;
        let durationMinutes = 0;
        if (startTime && endTime) {
          durationMinutes = Math.round(
            (new Date(endTime) - new Date(startTime)) / 60000
          );
        }

        await EventRole.create({
          email: email.toLowerCase(),
          name: reg.fullName || reg.name || name,
          event: reg.event._id,
          role: "participant",
          startTime,
          endTime,
          durationMinutes: durationMinutes > 0 ? durationMinutes : 0,
          status:
            reg.event.status === "completed"
              ? "completed"
              : attendance
                ? "active"
                : "active",
          source: "auto",
          details: {
            notes: attendance ? "Attended" : "Registered",
          },
        });
        created++;
        processedEvents.add(eventId);
      } else {
        processedEvents.add(eventId);
      }
    }

    // 2) Speaker roles (from Session assignments)
    const speakerAccount = await SpeakerAuth.findOne({
      email: { $regex: new RegExp(`^${email}$`, "i") },
    });

    if (speakerAccount) {
      const sessions = await Session.find({
        speaker: speakerAccount._id,
        status: { $in: ["confirmed", "completed", "ongoing"] },
      }).populate("event", "title startDate endDate status");

      for (const session of sessions) {
        if (!session.event) continue;

        const exists = await EventRole.findOne({
          email: { $regex: new RegExp(`^${email}$`, "i") },
          event: session.event._id,
          role: "speaker",
          "details.sessionId": session._id,
        });

        if (!exists) {
          const startTime = session.time?.start || session.event.startDate;
          const endTime = session.time?.end || session.event.endDate;
          let durationMinutes = 0;
          if (startTime && endTime) {
            durationMinutes = Math.round(
              (new Date(endTime) - new Date(startTime)) / 60000
            );
          }

          await EventRole.create({
            email: email.toLowerCase(),
            name: speakerAccount.name || name,
            event: session.event._id,
            role: "speaker",
            startTime,
            endTime,
            durationMinutes: durationMinutes > 0 ? durationMinutes : 0,
            status:
              session.status === "completed" ? "completed" : "active",
            source: "auto",
            details: {
              topic: session.title || "",
              sessionId: session._id,
              notes: session.description || "",
            },
          });
          created++;
        }
      }
    }

    // 3) Organizer roles (from User + Event teamMembers / teamLead)
    const userAccount = await User.findOne({
      email: { $regex: new RegExp(`^${email}$`, "i") },
      role: { $in: ["TEAM_LEAD", "EVENT_STAFF"] },
    });

    if (userAccount) {
      const events = await Event.find({
        $or: [
          { teamLead: userAccount._id },
          { "teamMembers.user": userAccount._id },
        ],
      });

      for (const event of events) {
        const exists = await EventRole.findOne({
          email: { $regex: new RegExp(`^${email}$`, "i") },
          event: event._id,
          role: "organizer",
        });

        if (!exists) {
          const isLead =
            event.teamLead?.toString() === userAccount._id.toString();

          const startTime = event.startDate || event.createdAt;
          const endTime = event.endDate || undefined;
          let durationMinutes = 0;
          if (startTime && endTime) {
            durationMinutes = Math.round(
              (new Date(endTime) - new Date(startTime)) / 60000
            );
          }

          await EventRole.create({
            email: email.toLowerCase(),
            name: userAccount.name || name,
            event: event._id,
            role: "organizer",
            startTime,
            endTime,
            durationMinutes: durationMinutes > 0 ? durationMinutes : 0,
            status:
              event.status === "completed" ? "completed" : "active",
            source: "auto",
            details: {
              organizerRole: isLead ? "TEAM_LEAD" : "EVENT_STAFF",
              notes: isLead
                ? "Team Lead"
                : "Event Staff",
            },
          });
          created++;
        }
      }
    }

    res.json({
      success: true,
      message: `Sync complete. ${created} new role(s) added.`,
      data: { created },
    });
  } catch (error) {
    console.error("Transcript sync error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error syncing roles", error: error.message });
  }
});

// =============================
// TRANSCRIPT: get full record
// =============================

// @desc    Get role-based transcript for the logged-in student
// @route   GET /api/transcript
router.get("/", verifyToken, async (req, res) => {
  try {
    const email =
      req.user?.email?.toLowerCase?.() ||
      req.query?.email?.toLowerCase?.();

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const roles = await EventRole.find({ email })
      .populate("event", "title startDate endDate status location venue category type bannerImage")
      .populate("details.sessionId", "title time room track")
      .sort({ "event.startDate": -1, startTime: 1 });

    // Group by event
    const eventMap = {};
    for (const role of roles) {
      const eventId = role.event?._id?.toString();
      if (!eventId) continue;

      if (!eventMap[eventId]) {
        eventMap[eventId] = {
          event: role.event,
          roles: [],
        };
      }
      eventMap[eventId].roles.push({
        _id: role._id,
        role: role.role,
        startTime: role.startTime,
        endTime: role.endTime,
        durationMinutes: role.durationMinutes,
        details: role.details,
        status: role.status,
        source: role.source,
        createdAt: role.createdAt,
      });
    }

    const transcript = Object.values(eventMap).sort((a, b) => {
      const dateA = a.event?.startDate ? new Date(a.event.startDate) : 0;
      const dateB = b.event?.startDate ? new Date(b.event.startDate) : 0;
      return dateB - dateA; // newest first
    });

    // Summary stats
    const totalEvents = transcript.length;
    const totalRoles = roles.length;
    const roleCounts = {};
    let totalMinutes = 0;
    for (const role of roles) {
      roleCounts[role.role] = (roleCounts[role.role] || 0) + 1;
      totalMinutes += role.durationMinutes || 0;
    }

    res.json({
      success: true,
      data: {
        student: {
          email,
          name: roles[0]?.name || req.user?.name || "Unknown",
        },
        summary: {
          totalEvents,
          totalRoles,
          totalMinutes,
          roleCounts,
        },
        transcript,
      },
    });
  } catch (error) {
    console.error("Transcript fetch error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching transcript", error: error.message });
  }
});

// =============================
// MANUAL: add a role entry
// =============================

// @desc    Manually add a role to a student for an event (organizer use)
// @route   POST /api/transcript/role
router.post("/role", verifyToken, async (req, res) => {
  try {
    const {
      email,
      name,
      eventId,
      role,
      startTime,
      endTime,
      durationMinutes,
      details,
    } = req.body;

    if (!email || !eventId || !role) {
      return res.status(400).json({
        success: false,
        message: "email, eventId, and role are required",
      });
    }

    if (!["participant", "volunteer", "speaker", "organizer"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "role must be one of: participant, volunteer, speaker, organizer",
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    let computedDuration = durationMinutes || 0;
    if (!computedDuration && startTime && endTime) {
      computedDuration = Math.round(
        (new Date(endTime) - new Date(startTime)) / 60000
      );
    }

    const newRole = await EventRole.create({
      email: email.toLowerCase(),
      name: name || email,
      event: eventId,
      role,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      durationMinutes: computedDuration > 0 ? computedDuration : 0,
      details: details || {},
      source: "manual",
      status: "active",
    });

    res.status(201).json({
      success: true,
      message: "Role added successfully",
      data: newRole,
    });
  } catch (error) {
    console.error("Add role error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error adding role", error: error.message });
  }
});

// @desc    Delete a role entry
// @route   DELETE /api/transcript/role/:id
router.delete("/role/:id", verifyToken, async (req, res) => {
  try {
    const role = await EventRole.findByIdAndDelete(req.params.id);
    if (!role) {
      return res.status(404).json({ success: false, message: "Role not found" });
    }

    res.json({ success: true, message: "Role deleted" });
  } catch (error) {
    console.error("Delete role error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error deleting role", error: error.message });
  }
});

export default router;
