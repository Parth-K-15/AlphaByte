import express from "express";
import Budget from "../models/Budget.js";
import Expense from "../models/Expense.js";
import Event from "../models/Event.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { cache } from "../middleware/cache.js";
import { CacheKeys, CacheTTL } from "../utils/cacheKeys.js";
import { invalidateFinanceCache } from "../utils/cacheInvalidation.js";

const router = express.Router();

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// =====================
// BUDGET ROUTES
// =====================

/**
 * @desc    Create or Update Budget Request (Organizer)
 * @route   POST /api/finance/budget/request
 */
router.post("/budget/request", async (req, res) => {
  try {
    const { eventId, categories, userId } = req.body;

    if (!isValidObjectId(eventId) || !isValidObjectId(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });
    }

    const event = await Event.findById(eventId);
    if (!event)
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });

    // Verify user is team lead or authorized member
    const isTeamLead = event.teamLead?.toString() === userId;
    const isAuthorizedMember = event.teamMembers?.some(
      (m) => m.user?.toString() === userId && m.role === "TEAM_LEAD",
    );

    if (!isTeamLead && !isAuthorizedMember) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized to request budget" });
    }

    // Check if budget already exists
    let budget = await Budget.findOne({ event: eventId });

    if (budget) {
      if (["APPROVED", "CLOSED"].includes(budget.status)) {
        return res.status(400).json({
          success: false,
          message: "Cannot modify approved or closed budget",
        });
      }

      // Update existing budget
      budget.categories = categories;
      budget.status = "REQUESTED"; // Reset to requested if it was DRAFT or REJECTED
      budget.history.push({
        action: "UPDATED",
        performedBy: userId,
        note: "Budget request updated",
        newStatus: "REQUESTED",
      });
    } else {
      // Create new budget
      budget = new Budget({
        event: eventId,
        categories,
        status: "REQUESTED",
        createdBy: userId,
        history: [
          {
            action: "CREATED",
            performedBy: userId,
            note: "Budget request created",
            newStatus: "REQUESTED",
          },
        ],
      });
    }

    await budget.save();

    // Calculate total requested for response
    const totalRequested = categories.reduce(
      (sum, cat) => sum + (Number(cat.requestedAmount) || 0),
      0,
    );

    // Invalidate finance cache
    await invalidateFinanceCache(eventId);

    res.json({
      success: true,
      message: "Budget request submitted successfully",
      data: { ...budget.toObject(), totalRequested },
    });
  } catch (error) {
    console.error("Error in budget request:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
});

/**
 * @desc    Get Budget Details
 * @route   GET /api/finance/budget/:eventId
 */
router.get(
  "/budget/:eventId",
  cache(CacheTTL.MEDIUM, (req) => CacheKeys.budget(req.params.eventId)),
  async (req, res) => {
  try {
    const { eventId } = req.params;
    if (!isValidObjectId(eventId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid event ID" });

    const budget = await Budget.findOne({ event: eventId })
      .populate("history.performedBy", "name email")
      .populate("createdBy", "name email");

    if (!budget) {
      // Return 200 with null to avoid noisy console errors in frontend during initial load
      return res.json({
        success: true,
        data: null,
        message: "No budget found for this event",
      });
    }

    // Calculate usage stats
    const expenses = await Expense.find({ budget: budget._id });
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    res.json({
      success: true,
      data: {
        ...budget.toObject(),
        stats: {
          totalAllocated: budget.totalAllocatedAmount,
          totalSpent,
          remaining: budget.totalAllocatedAmount - totalSpent,
          utilization:
            budget.totalAllocatedAmount > 0
              ? Math.round((totalSpent / budget.totalAllocatedAmount) * 100)
              : 0,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching budget:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
});

/**
 * @desc    Approve/Reject/Allocate Budget (Admin)
 * @route   PUT /api/finance/budget/:eventId/approval
 */
router.put("/budget/:eventId/approval", async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status, allocations, approvalNotes, adminId } = req.body; // allocations = [{ categoryName, allocatedAmount }]

    if (!isValidObjectId(eventId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid event ID" });

    if (adminId && !isValidObjectId(adminId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid admin ID format" });
    }

    const budget = await Budget.findOne({ event: eventId });
    if (!budget)
      return res
        .status(404)
        .json({ success: false, message: "Budget not found" });

    if (status === "APPROVED" || status === "PARTIALLY_APPROVED") {
      // Update allocations per category
      if (allocations && Array.isArray(allocations)) {
        budget.categories = budget.categories.map((cat) => {
          const allocation = allocations.find((a) => a.name === cat.name);
          return allocation
            ? { ...cat, allocatedAmount: allocation.allocatedAmount }
            : cat;
        });
      }
    }

    budget.status = status;
    budget.approvalNotes = approvalNotes;

    budget.history.push({
      action: status === "REJECTED" ? "REJECTED" : "APPROVED",
      performedBy: adminId,
      note: approvalNotes,
      newStatus: status,
    });

    await budget.save();

    // Invalidate finance cache
    await invalidateFinanceCache(eventId);

    res.json({
      success: true,
      message: `Budget ${status.toLowerCase()} successfully`,
      data: budget,
    });
  } catch (error) {
    console.error("Error approving budget:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
});

// =====================
// EXPENSE ROUTES
// =====================

/**
 * @desc    Log New Expense (Organizer)
 * @route   POST /api/finance/expense
 */
router.post("/expense", async (req, res) => {
  try {
    const {
      eventId,
      category,
      amount,
      description,
      incurredBy,
      receiptUrl,
      type,
    } = req.body;

    if (!isValidObjectId(eventId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid event ID" });

    const budget = await Budget.findOne({ event: eventId });
    if (!budget)
      return res.status(400).json({
        success: false,
        message: "No active budget found for this event",
      });

    if (
      budget.status !== "APPROVED" &&
      budget.status !== "PARTIALLY_APPROVED"
    ) {
      return res.status(400).json({
        success: false,
        message: "Budget must be approved before logging expenses",
      });
    }

    // Verify category exists in budget
    const budgetCategory = budget.categories.find((c) => c.name === category);
    if (!budgetCategory) {
      return res.status(400).json({
        success: false,
        message: `Category '${category}' not found in budget`,
      });
    }

    const expense = new Expense({
      event: eventId,
      budget: budget._id,
      category,
      amount,
      description,
      incurredBy,
      receiptUrl,
      type: type || "PERSONAL_SPEND",
      status: "PENDING",
    });

    await expense.save();

    // Invalidate finance cache
    await invalidateFinanceCache(eventId);

    res.status(201).json({
      success: true,
      message: "Expense logged successfully",
      data: expense,
    });
  } catch (error) {
    console.error("Error logging expense:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
});

/**
 * @desc    Get All Expenses for Event
 * @route   GET /api/finance/expenses/:eventId
 */
router.get(
  "/expenses/:eventId",
  cache(CacheTTL.SHORT, (req) => CacheKeys.expenses(req.params.eventId)),
  async (req, res) => {
  try {
    const { eventId } = req.params;
    if (!isValidObjectId(eventId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid event ID" });

    const expenses = await Expense.find({ event: eventId })
      .populate("incurredBy", "name email")
      .populate("approvedBy", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: expenses.length, data: expenses });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
});

/**
 * @desc    Get All Expenses requiring action (Admin Dashboard)
 * @route   GET /api/finance/expenses/pending/all
 */
router.get(
  "/expenses/pending/all",
  cache(CacheTTL.SHORT, () => CacheKeys.expensesPending()),
  async (req, res) => {
  try {
    const expenses = await Expense.find({ status: "PENDING" })
      .populate("event", "title")
      .populate("incurredBy", "name email")
      .sort({ createdAt: 1 });

    res.json({ success: true, count: expenses.length, data: expenses });
  } catch (error) {
    console.error("Error fetching pending expenses:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
});

/**
 * @desc    Update Expense Status (Admin - Approve/Reimburse)
 * @route   PUT /api/finance/expense/:expenseId/status
 */
router.put("/expense/:expenseId/status", async (req, res) => {
  try {
    const { expenseId } = req.params;
    const { status, adminNotes, adminId } = req.body; // status: APPROVED, REJECTED, REIMBURSED

    if (!isValidObjectId(expenseId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid expense ID" });

    const expense = await Expense.findById(expenseId);
    if (!expense)
      return res
        .status(404)
        .json({ success: false, message: "Expense not found" });

    expense.status = status;
    expense.adminNotes = adminNotes;

    if (status === "APPROVED") {
      expense.approvedBy = adminId;
    } else if (status === "REIMBURSED") {
      expense.reimbursedBy = adminId;
      expense.reimbursedAt = Date.now();
    }

    await expense.save();

    // Invalidate finance cache
    await invalidateFinanceCache(expense.event.toString());

    res.json({
      success: true,
      message: `Expense marked as ${status}`,
      data: expense,
    });
  } catch (error) {
    console.error("Error updating expense status:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
});

export default router;
