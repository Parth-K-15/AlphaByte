import Log from "../models/Log.js";
import crypto from "crypto";

const getRequestId = (req) => {
  const direct = req?.requestId;
  if (typeof direct === "string" && direct.trim()) return direct.trim();
  const header = req?.headers?.["x-request-id"];
  if (typeof header === "string" && header.trim()) return header.trim();
  return crypto.randomUUID();
};

const getActor = (req) => {
  if (req?.isParticipant) {
    return {
      actorType: "STUDENT",
      actorId: req.userId,
      actorName: req.user?.name,
      actorEmail: req.user?.email,
    };
  }

  const role = req?.user?.role;
  const actorType = role === "ADMIN" ? "ADMIN" : "ORGANIZER";

  // Staff roles: ADMIN / TEAM_LEAD / EVENT_STAFF
  return {
    actorType,
    actorId: req.userId,
    actorName: req.user?.name,
    actorEmail: req.user?.email,
  };
};

export const auditPiiAccess = async ({
  req,
  entityType,
  targetUserId,
  targetParticipantId,
  fields,
  reason,
}) => {
  try {
    const requestId = getRequestId(req);
    const ipAddress =
      (typeof req?.headers?.["x-forwarded-for"] === "string" &&
        req.headers["x-forwarded-for"].split(",")[0].trim()) ||
      req?.ip;

    const actor = getActor(req);

    await Log.create({
      actionType: "ACCESS",
      entityType: entityType || "USER",
      action: "PII_DECRYPTED",
      details: "Privileged PII access",
      severity: "INFO",
      level: "info",
      ...actor,
      userId: req?.userId,
      participantId: targetParticipantId,
      metadata: {
        requestId,
        pii: {
          fields: Array.isArray(fields) ? fields : [],
          reason: reason || null,
          targetUserId: targetUserId || null,
          targetParticipantId: targetParticipantId || null,
        },
      },
      ipAddress,
      userAgent: req?.headers?.["user-agent"],
    });
  } catch (error) {
    // Audit logs should never block the main request
    console.warn("⚠️  Failed to write PII audit log:", error?.message);
  }
};
