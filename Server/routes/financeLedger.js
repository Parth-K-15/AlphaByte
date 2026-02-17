import express from "express";
import { verifyToken, authorizeRoles } from "../middleware/auth.js";
import Log from "../models/Log.js";
import {
  createTransaction,
  getEventBalance,
  listTransactionsForEvent,
  reverseTransaction,
} from "../utils/financeLedgerRepo.js";

const router = express.Router();

router.use(verifyToken, authorizeRoles("ADMIN", "TEAM_LEAD"));

const isMongoObjectId = (value) => /^[a-fA-F0-9]{24}$/.test((value || "").toString());

router.post("/transactions", async (req, res) => {
  try {
    const {
      eventId,
      direction,
      kind,
      amountCents,
      currency,
      note,
      reason,
      metadata,
    } = req.body || {};

    if (!isMongoObjectId(eventId)) {
      return res.status(400).json({ success: false, message: "Invalid eventId" });
    }

    if (!["DEBIT", "CREDIT"].includes(direction)) {
      return res.status(400).json({ success: false, message: "direction must be DEBIT or CREDIT" });
    }

    const cents = Number(amountCents);
    if (!Number.isFinite(cents) || cents <= 0) {
      return res.status(400).json({ success: false, message: "amountCents must be a positive number" });
    }

    if (!kind || typeof kind !== "string") {
      return res.status(400).json({ success: false, message: "kind is required" });
    }

    const requestId = req.requestId;

    const tx = await createTransaction({
      eventId,
      actorUserId: req.userId,
      direction,
      kind,
      amountCents: Math.trunc(cents),
      currency,
      note,
      reason,
      metadata,
      requestId,
    });

    await Log.create({
      actionType: "SYSTEM",
      entityType: "SYSTEM",
      action: "FINANCE_TX_CREATED",
      details: `Ledger transaction created (${direction} ${Math.trunc(cents)} ${currency || "INR"})`,
      severity: "INFO",
      level: "info",
      actorType: req.user?.role === "ADMIN" ? "ADMIN" : "ORGANIZER",
      actorId: req.userId,
      actorName: req.user?.name,
      actorEmail: req.user?.email,
      metadata: {
        requestId,
        finance: {
          eventId,
          txId: tx.id,
          direction,
          kind,
          amountCents: Math.trunc(cents),
          currency: currency || "INR",
          reason: reason || null,
        },
      },
    });

    return res.json({ success: true, data: tx });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

router.post("/transactions/:id/reverse", async (req, res) => {
  try {
    const { id } = req.params;
    const reason = (req.body?.reason || "").toString().trim();

    if (!reason) {
      return res.status(400).json({ success: false, message: "reason is required" });
    }

    const requestId = req.requestId;

    const tx = await reverseTransaction({
      referenceTransactionId: id,
      actorUserId: req.userId,
      reason,
      requestId,
    });

    if (!tx) {
      return res.status(404).json({ success: false, message: "Reference transaction not found" });
    }

    await Log.create({
      actionType: "SYSTEM",
      entityType: "SYSTEM",
      action: "FINANCE_TX_REVERSED",
      details: `Ledger reversal created for ${id}`,
      severity: "WARNING",
      level: "warning",
      actorType: req.user?.role === "ADMIN" ? "ADMIN" : "ORGANIZER",
      actorId: req.userId,
      actorName: req.user?.name,
      actorEmail: req.user?.email,
      metadata: {
        requestId,
        finance: { txId: tx.id, reversalOf: id, reason },
      },
    });

    return res.json({ success: true, data: tx });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

router.get("/events/:eventId/balance", async (req, res) => {
  try {
    const { eventId } = req.params;
    const currency = (req.query?.currency || "INR").toString();

    if (!isMongoObjectId(eventId)) {
      return res.status(400).json({ success: false, message: "Invalid eventId" });
    }

    const balance = await getEventBalance({ eventId, currency });
    return res.json({ success: true, data: balance });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

router.get("/events/:eventId/transactions", async (req, res) => {
  try {
    const { eventId } = req.params;
    const limit = Number(req.query?.limit || 50);

    if (!isMongoObjectId(eventId)) {
      return res.status(400).json({ success: false, message: "Invalid eventId" });
    }

    const rows = await listTransactionsForEvent({ eventId, limit });
    return res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

export default router;
