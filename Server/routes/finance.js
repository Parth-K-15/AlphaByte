import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import Budget from "../models/Budget.js";
import Expense from "../models/Expense.js";
import Event from "../models/Event.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { cache } from "../middleware/cache.js";
import { CacheKeys, CacheTTL } from "../utils/cacheKeys.js";
import { invalidateFinanceCache } from "../utils/cacheInvalidation.js";

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for memory storage (receipt uploads)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept images and PDFs
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype === "application/pdf"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only image and PDF files are allowed"), false);
    }
  },
});

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
 * @desc    Get All Budgets Requiring Action (Admin Dashboard)
 * @route   GET /api/finance/budgets/pending
 */
router.get(
  "/budgets/pending",
  cache(CacheTTL.SHORT, () => CacheKeys.budgetsPending()),
  async (req, res) => {
  try {
    const budgets = await Budget.find({ 
      status: { $in: ["REQUESTED", "PARTIALLY_APPROVED"] } 
    })
      .populate("event", "title eventDate location")
      .populate("createdBy", "name email")
      .sort({ createdAt: 1 });

    res.json({ success: true, count: budgets.length, data: budgets });
  } catch (error) {
    console.error("Error fetching pending budgets:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
});

/**
 * @desc    Get All Budgets (Admin)
 * @route   GET /api/finance/budgets/all
 */
router.get(
  "/budgets/all",
  cache(CacheTTL.MEDIUM, () => CacheKeys.allBudgets()),
  async (req, res) => {
  try {
    const budgets = await Budget.find()
      .populate("event", "title eventDate location status")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: budgets.length, data: budgets });
  } catch (error) {
    console.error("Error fetching all budgets:", error);
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

    console.log("Received expense request:", {
      eventId,
      category,
      amount,
      description,
      incurredBy,
      type,
      hasReceipt: !!receiptUrl,
    });

    if (!isValidObjectId(eventId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid event ID" });

    if (!incurredBy || !isValidObjectId(incurredBy))
      return res
        .status(400)
        .json({ success: false, message: "Invalid or missing user ID" });

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
 * @desc    Get Single Expense Detail (Admin)
 * @route   GET /api/finance/expense/:expenseId
 */
router.get("/expense/:expenseId", async (req, res) => {
  try {
    const { expenseId } = req.params;

    if (!isValidObjectId(expenseId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid expense ID" });

    const expense = await Expense.findById(expenseId)
      .populate("event", "title eventDate location")
      .populate("budget")
      .populate("incurredBy", "name email")
      .populate("approvedBy", "name email")
      .populate("reimbursedBy", "name email");

    if (!expense)
      return res
        .status(404)
        .json({ success: false, message: "Expense not found" });

    res.json({ success: true, data: expense });
  } catch (error) {
    console.error("Error fetching expense detail:", error);
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

/**
 * @desc    Bulk Update Expense Status (Admin)
 * @route   PUT /api/finance/expenses/bulk-update
 */
router.put("/expenses/bulk-update", async (req, res) => {
  try {
    const { expenseIds, status, adminNotes, adminId } = req.body;

    if (!Array.isArray(expenseIds) || expenseIds.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No expense IDs provided" });
    }

    if (!["APPROVED", "REJECTED", "REIMBURSED"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }

    const updateData = {
      status,
      adminNotes,
    };

    if (status === "APPROVED") {
      updateData.approvedBy = adminId;
    } else if (status === "REIMBURSED") {
      updateData.reimbursedBy = adminId;
      updateData.reimbursedAt = Date.now();
    }

    const result = await Expense.updateMany(
      { _id: { $in: expenseIds } },
      { $set: updateData },
    );

    // Invalidate all related event caches
    const expenses = await Expense.find({ _id: { $in: expenseIds } });
    const eventIds = [...new Set(expenses.map(e => e.event.toString()))];
    for (const eventId of eventIds) {
      await invalidateFinanceCache(eventId);
    }

    res.json({
      success: true,
      message: `${result.modifiedCount} expenses updated to ${status}`,
      data: { modified: result.modifiedCount },
    });
  } catch (error) {
    console.error("Error bulk updating expenses:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
});

// =====================
// BUDGET AMENDMENT ROUTES
// =====================

/**
 * @desc    Request Budget Amendment (Organizer)
 * @route   POST /api/finance/budget/:eventId/amendment
 */
router.post("/budget/:eventId/amendment", async (req, res) => {
  try {
    const { eventId } = req.params;
    const { requestedCategories, reason, userId } = req.body;

    if (!isValidObjectId(eventId) || !isValidObjectId(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });
    }

    const budget = await Budget.findOne({ event: eventId });
    if (!budget) {
      return res
        .status(404)
        .json({ success: false, message: "Budget not found" });
    }

    if (!["APPROVED", "PARTIALLY_APPROVED"].includes(budget.status)) {
      return res.status(400).json({
        success: false,
        message: "Can only amend approved budgets",
      });
    }

    // Add amendment request
    budget.amendments.push({
      requestedCategories,
      reason,
      requestedBy: userId,
      status: "PENDING",
    });

    budget.history.push({
      action: "AMENDMENT_REQUESTED",
      performedBy: userId,
      note: reason,
    });

    await budget.save();

    // Invalidate cache
    await invalidateFinanceCache(eventId);

    res.json({
      success: true,
      message: "Budget amendment requested successfully",
      data: budget,
    });
  } catch (error) {
    console.error("Error requesting budget amendment:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
});

/**
 * @desc    Review Budget Amendment (Admin)
 * @route   PUT /api/finance/budget/:eventId/amendment/:amendmentId
 */
router.put("/budget/:eventId/amendment/:amendmentId", async (req, res) => {
  try {
    const { eventId, amendmentId } = req.params;
    const { status, adminNotes, adminId, allocations } = req.body;

    if (!isValidObjectId(eventId) || !isValidObjectId(adminId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });
    }

    const budget = await Budget.findOne({ event: eventId });
    if (!budget) {
      return res
        .status(404)
        .json({ success: false, message: "Budget not found" });
    }

    const amendment = budget.amendments.id(amendmentId);
    if (!amendment) {
      return res
        .status(404)
        .json({ success: false, message: "Amendment not found" });
    }

    // Update amendment status
    amendment.status = status;
    amendment.adminNotes = adminNotes;
    amendment.reviewedBy = adminId;
    amendment.reviewedAt = Date.now();

    if (status === "APPROVED" && allocations) {
      // Apply the amendments to the budget categories
      amendment.requestedCategories.forEach((reqCat) => {
        const existingCat = budget.categories.find(
          (c) => c.name === reqCat.name
        );
        const allocation = allocations.find((a) => a.name === reqCat.name);

        if (existingCat && allocation) {
          existingCat.allocatedAmount = allocation.allocatedAmount;
          existingCat.requestedAmount = reqCat.requestedAmount;
          existingCat.justification = reqCat.justification;
        } else if (allocation) {
          // New category
          budget.categories.push({
            name: reqCat.name,
            requestedAmount: reqCat.requestedAmount,
            allocatedAmount: allocation.allocatedAmount,
            justification: reqCat.justification,
          });
        }
      });
    }

    budget.history.push({
      action: status === "APPROVED" ? "AMENDMENT_APPROVED" : "AMENDMENT_REJECTED",
      performedBy: adminId,
      note: adminNotes,
    });

    await budget.save();

    // Invalidate cache
    await invalidateFinanceCache(eventId);

    res.json({
      success: true,
      message: `Amendment ${status.toLowerCase()} successfully`,
      data: budget,
    });
  } catch (error) {
    console.error("Error reviewing amendment:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
});

/**
 * @desc    Get Pending Amendments (Admin)
 * @route   GET /api/finance/amendments/pending
 */
router.get("/amendments/pending", async (req, res) => {
  try {
    const budgets = await Budget.find({
      "amendments.status": "PENDING",
    })
      .populate("event", "title eventDate location")
      .populate("amendments.requestedBy", "name email")
      .sort({ updatedAt: -1 });

    // Extract only budgets with pending amendments
    const pendingAmendments = budgets
      .map((budget) => {
        const pending = budget.amendments.filter((a) => a.status === "PENDING");
        return pending.map((amendment) => ({
          budgetId: budget._id,
          event: budget.event,
          amendment,
        }));
      })
      .flat();

    res.json({
      success: true,
      count: pendingAmendments.length,
      data: pendingAmendments,
    });
  } catch (error) {
    console.error("Error fetching pending amendments:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
});

// =====================
// FINANCIAL REPORTS ROUTES
// =====================

/**
 * @desc    Get Event-wise Expense Summary (Admin)
 * @route   GET /api/finance/reports/event-wise
 */
router.get("/reports/event-wise", async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    
    // Build event filter
    const eventFilter = {};
    if (startDate || endDate) {
      eventFilter.eventDate = {};
      if (startDate) eventFilter.eventDate.$gte = new Date(startDate);
      if (endDate) eventFilter.eventDate.$lte = new Date(endDate);
    }
    if (status) eventFilter.status = status;

    // Get all events with their budgets
    const events = await Event.find(eventFilter)
      .select("title eventDate status")
      .lean();

    const eventIds = events.map((e) => e._id);

    // Get budgets for these events
    const budgets = await Budget.find({ event: { $in: eventIds } })
      .select("event totalAllocatedAmount status")
      .lean();

    // Get expenses for these events
    const expenses = await Expense.find({ event: { $in: eventIds } })
      .select("event amount status")
      .lean();

    // Build report data
    const reportData = events.map((event) => {
      const budget = budgets.find((b) => b.event.toString() === event._id.toString());
      const eventExpenses = expenses.filter((e) => e.event.toString() === event._id.toString());
      
      const totalSpent = eventExpenses
        .filter((e) => e.status === "APPROVED" || e.status === "REIMBURSED")
        .reduce((sum, e) => sum + e.amount, 0);
      
      const pendingExpenses = eventExpenses.filter((e) => e.status === "PENDING").length;
      const allocatedAmount = budget?.totalAllocatedAmount || 0;
      const remaining = allocatedAmount - totalSpent;
      const utilization = allocatedAmount > 0 ? (totalSpent / allocatedAmount) * 100 : 0;

      return {
        eventId: event._id,
        eventTitle: event.title,
        eventDate: event.eventDate,
        eventStatus: event.status,
        budgetStatus: budget?.status || "NOT_REQUESTED",
        allocatedAmount,
        totalSpent,
        remaining,
        utilization: Math.round(utilization * 100) / 100,
        pendingExpenses,
        totalExpenses: eventExpenses.length,
        isOverBudget: totalSpent > allocatedAmount && allocatedAmount > 0,
      };
    });

    // Sort by event date (most recent first)
    reportData.sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate));

    res.json({
      success: true,
      count: reportData.length,
      data: reportData,
    });
  } catch (error) {
    console.error("Error generating event-wise report:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

/**
 * @desc    Get Category-wise Spending Analysis (Admin)
 * @route   GET /api/finance/reports/category-wise
 */
router.get("/reports/category-wise", async (req, res) => {
  try {
    const { eventId, startDate, endDate } = req.query;

    // Build expense filter
    const expenseFilter = {
      status: { $in: ["APPROVED", "REIMBURSED"] },
    };
    if (eventId) expenseFilter.event = eventId;
    if (startDate || endDate) {
      expenseFilter.createdAt = {};
      if (startDate) expenseFilter.createdAt.$gte = new Date(startDate);
      if (endDate) expenseFilter.createdAt.$lte = new Date(endDate);
    }

    // Get all approved/reimbursed expenses
    const expenses = await Expense.find(expenseFilter)
      .select("category amount event")
      .populate("event", "title")
      .lean();

    // Group by category
    const categoryMap = {};
    expenses.forEach((expense) => {
      if (!categoryMap[expense.category]) {
        categoryMap[expense.category] = {
          category: expense.category,
          totalSpent: 0,
          expenseCount: 0,
          events: new Set(),
        };
      }
      categoryMap[expense.category].totalSpent += expense.amount;
      categoryMap[expense.category].expenseCount += 1;
      if (expense.event) {
        categoryMap[expense.category].events.add(expense.event._id.toString());
      }
    });

    // Convert to array and add percentages
    const categoryData = Object.values(categoryMap).map((cat) => ({
      category: cat.category,
      totalSpent: cat.totalSpent,
      expenseCount: cat.expenseCount,
      eventsCount: cat.events.size,
      avgSpendPerExpense: Math.round((cat.totalSpent / cat.expenseCount) * 100) / 100,
    }));

    const totalSpent = categoryData.reduce((sum, cat) => sum + cat.totalSpent, 0);
    categoryData.forEach((cat) => {
      cat.percentage = totalSpent > 0 ? Math.round((cat.totalSpent / totalSpent) * 10000) / 100 : 0;
    });

    // Sort by total spent (descending)
    categoryData.sort((a, b) => b.totalSpent - a.totalSpent);

    res.json({
      success: true,
      totalSpent,
      data: categoryData,
    });
  } catch (error) {
    console.error("Error generating category-wise report:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

/**
 * @desc    Get Over-Budget Alerts (Admin)
 * @route   GET /api/finance/reports/over-budget
 */
router.get("/reports/over-budget", async (req, res) => {
  try {
    // Get all approved budgets
    const budgets = await Budget.find({
      status: { $in: ["APPROVED", "PARTIALLY_APPROVED"] },
    })
      .populate("event", "title eventDate status")
      .populate("createdBy", "name email")
      .lean();

    const budgetIds = budgets.map((b) => b._id);

    // Get all approved/reimbursed expenses for these budgets
    const expenses = await Expense.find({
      budget: { $in: budgetIds },
      status: { $in: ["APPROVED", "REIMBURSED"] },
    })
      .select("budget category amount")
      .lean();

    // Analyze each budget for over-budget categories
    const alerts = [];

    budgets.forEach((budget) => {
      const budgetExpenses = expenses.filter(
        (e) => e.budget.toString() === budget._id.toString()
      );

      const totalSpent = budgetExpenses.reduce((sum, e) => sum + e.amount, 0);
      const totalAllocated = budget.totalAllocatedAmount;

      // Check overall budget
      if (totalSpent > totalAllocated) {
        alerts.push({
          type: "OVERALL_OVERBUDGET",
          severity: "HIGH",
          eventId: budget.event._id,
          eventTitle: budget.event.title,
          eventDate: budget.event.eventDate,
          budgetId: budget._id,
          organizer: budget.createdBy,
          allocated: totalAllocated,
          spent: totalSpent,
          overage: totalSpent - totalAllocated,
          overagePercentage: Math.round(((totalSpent - totalAllocated) / totalAllocated) * 10000) / 100,
        });
      }

      // Check category-wise
      budget.categories.forEach((category) => {
        const categoryExpenses = budgetExpenses.filter((e) => e.category === category.name);
        const categorySpent = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
        const categoryAllocated = category.allocatedAmount;

        if (categorySpent > categoryAllocated) {
          const overagePercentage = Math.round(((categorySpent - categoryAllocated) / categoryAllocated) * 10000) / 100;
          alerts.push({
            type: "CATEGORY_OVERBUDGET",
            severity: overagePercentage > 50 ? "HIGH" : overagePercentage > 20 ? "MEDIUM" : "LOW",
            eventId: budget.event._id,
            eventTitle: budget.event.title,
            eventDate: budget.event.eventDate,
            budgetId: budget._id,
            organizer: budget.createdBy,
            category: category.name,
            allocated: categoryAllocated,
            spent: categorySpent,
            overage: categorySpent - categoryAllocated,
            overagePercentage,
          });
        }
      });

      // Check for near-budget warnings (>90% utilization)
      budget.categories.forEach((category) => {
        const categoryExpenses = budgetExpenses.filter((e) => e.category === category.name);
        const categorySpent = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
        const categoryAllocated = category.allocatedAmount;
        const utilization = categoryAllocated > 0 ? (categorySpent / categoryAllocated) * 100 : 0;

        if (utilization >= 90 && utilization <= 100) {
          alerts.push({
            type: "NEAR_BUDGET_LIMIT",
            severity: "MEDIUM",
            eventId: budget.event._id,
            eventTitle: budget.event.title,
            eventDate: budget.event.eventDate,
            budgetId: budget._id,
            organizer: budget.createdBy,
            category: category.name,
            allocated: categoryAllocated,
            spent: categorySpent,
            remaining: categoryAllocated - categorySpent,
            utilization: Math.round(utilization * 100) / 100,
          });
        }
      });
    });

    // Sort by severity and overage
    const severityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    alerts.sort((a, b) => {
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[b.severity] - severityOrder[a.severity];
      }
      return (b.overage || 0) - (a.overage || 0);
    });

    res.json({
      success: true,
      count: alerts.length,
      summary: {
        high: alerts.filter((a) => a.severity === "HIGH").length,
        medium: alerts.filter((a) => a.severity === "MEDIUM").length,
        low: alerts.filter((a) => a.severity === "LOW").length,
      },
      data: alerts,
    });
  } catch (error) {
    console.error("Error generating over-budget alerts:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

/**
 * @desc    Export Financial Data to CSV
 * @route   GET /api/finance/reports/export
 */
router.get("/reports/export", async (req, res) => {
  try {
    const { type, eventId, startDate, endDate } = req.query;

    let data = [];
    let filename = "financial_report.csv";

    if (type === "expenses") {
      const filter = {};
      if (eventId) filter.event = eventId;
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      const expenses = await Expense.find(filter)
        .populate("event", "title")
        .populate("incurredBy", "name email")
        .populate("approvedBy", "name")
        .sort({ createdAt: -1 })
        .lean();

      // Convert to CSV format
      const csvHeader = "Date,Event,Category,Description,Amount,Type,Status,Incurred By,Approved By,Receipt URL\n";
      const csvRows = expenses.map((exp) => {
        return [
          new Date(exp.createdAt).toLocaleDateString(),
          `"${exp.event?.title || 'N/A'}"`,
          exp.category,
          `"${exp.description.replace(/"/g, '""')}"`,
          exp.amount,
          exp.type,
          exp.status,
          `"${exp.incurredBy?.name || 'Unknown'}"`,
          `"${exp.approvedBy?.name || 'N/A'}"`,
          exp.receiptUrl || 'N/A',
        ].join(",");
      }).join("\n");

      data = csvHeader + csvRows;
      filename = `expenses_${new Date().toISOString().split('T')[0]}.csv`;

    } else if (type === "budgets") {
      const filter = {};
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      const budgets = await Budget.find(filter)
        .populate("event", "title eventDate")
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .lean();

      const csvHeader = "Event,Event Date,Organizer,Requested Amount,Allocated Amount,Status,Categories Count,Created Date\n";
      const csvRows = budgets.map((budget) => {
        return [
          `"${budget.event?.title || 'N/A'}"`,
          budget.event?.eventDate ? new Date(budget.event.eventDate).toLocaleDateString() : 'N/A',
          `"${budget.createdBy?.name || 'Unknown'}"`,
          budget.totalRequestAmount,
          budget.totalAllocatedAmount,
          budget.status,
          budget.categories.length,
          new Date(budget.createdAt).toLocaleDateString(),
        ].join(",");
      }).join("\n");

      data = csvHeader + csvRows;
      filename = `budgets_${new Date().toISOString().split('T')[0]}.csv`;
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(data);

  } catch (error) {
    console.error("Error exporting data:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// =====================
// RECEIPT UPLOAD ROUTE
// =====================

/**
 * @desc    Upload receipt to Cloudinary
 * @route   POST /api/finance/upload-receipt
 */
router.post("/upload-receipt", upload.single("receipt"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Upload to Cloudinary using stream
    const uploadPromise = new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "receipts",
          resource_type: "auto", // Handles images and PDFs
          allowed_formats: ["jpg", "jpeg", "png", "gif", "pdf"],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      stream.end(req.file.buffer);
    });

    const result = await uploadPromise;

    res.json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        resourceType: result.resource_type,
      },
    });
  } catch (error) {
    console.error("Receipt upload error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload receipt",
      error: error.message,
    });
  }
});

// =====================
// AI BUDGET SUGGESTIONS
// =====================

/**
 * @desc    Get AI-powered budget suggestions based on historical data
 * @route   GET /api/finance/ai/budget-suggestions/:eventId
 */
router.get("/ai/budget-suggestions/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;
    const { category } = req.query;

    if (!isValidObjectId(eventId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID"
      });
    }

    // Get current event details
    const currentEvent = await Event.findById(eventId);
    if (!currentEvent) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    // Find similar past events (same category or type)
    const similarEventsQuery = {
      _id: { $ne: eventId },
      status: 'completed',
      $or: [
        { category: currentEvent.category },
        { type: currentEvent.type }
      ]
    };

    const similarEvents = await Event.find(similarEventsQuery)
      .populate({
        path: 'teamLead',
        select: 'name'
      })
      .sort({ startDate: -1 })
      .limit(10);

    // Get budgets and expenses for these events
    const historicalData = [];
    for (const event of similarEvents) {
      const budget = await Budget.findOne({ event: event._id, status: 'APPROVED' });
      if (budget) {
        const expenses = await Expense.find({ event: event._id });
        historicalData.push({
          eventId: event._id,
          eventName: event.title,
          eventCategory: event.category,
          eventType: event.type,
          budget: budget,
          totalExpenses: expenses.reduce((sum, exp) => sum + exp.amount, 0),
          attendees: event.maxParticipants || 50
        });
      }
    }

    // Generate suggestions based on historical data
    const suggestions = generateBudgetSuggestions(historicalData, currentEvent);

    res.json({
      success: true,
      data: {
        suggestions,
        basedOn: {
          similarEvents: historicalData.length,
          eventType: currentEvent.type,
          eventCategory: currentEvent.category
        },
        historicalData: historicalData.map(h => ({
          eventName: h.eventName,
          totalBudget: h.budget.categories.reduce((sum, cat) => sum + cat.allocatedAmount, 0),
          totalSpent: h.totalExpenses
        }))
      }
    });

  } catch (error) {
    console.error("Error generating budget suggestions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate budget suggestions",
      error: error.message
    });
  }
});

/**
 * Helper function to generate budget suggestions from historical data
 */
function generateBudgetSuggestions(historicalData, currentEvent) {
  const CATEGORIES = ['Food', 'Printing', 'Travel', 'Marketing', 'Logistics', 'Prizes', 'Equipment', 'Other'];
  
  // Budget templates based on event type
  const templates = {
    'WORKSHOP': { Food: 0.40, Printing: 0.15, Travel: 0.10, Marketing: 0.10, Logistics: 0.10, Prizes: 0.05, Equipment: 0.10 },
    'HACKATHON': { Food: 0.35, Printing: 0.05, Travel: 0.05, Marketing: 0.15, Logistics: 0.10, Prizes: 0.25, Equipment: 0.05 },
    'SEMINAR': { Food: 0.30, Printing: 0.20, Travel: 0.15, Marketing: 0.15, Logistics: 0.10, Prizes: 0.05, Equipment: 0.05 },
    'CULTURAL': { Food: 0.25, Printing: 0.10, Travel: 0.05, Marketing: 0.20, Logistics: 0.15, Prizes: 0.15, Equipment: 0.10 },
    'COMPETITION': { Food: 0.25, Printing: 0.10, Travel: 0.10, Marketing: 0.15, Logistics: 0.10, Prizes: 0.25, Equipment: 0.05 }
  };

  const costPerAttendee = {
    'WORKSHOP': 200,
    'HACKATHON': 400,
    'SEMINAR': 150,
    'CULTURAL': 250,
    'COMPETITION': 300
  };

  let template = templates[currentEvent.category?.toUpperCase()] || templates['WORKSHOP'];
  let baseCost = costPerAttendee[currentEvent.category?.toUpperCase()] || 200;
  let confidence = 60;

  // If we have historical data, refine the suggestions
  if (historicalData.length > 0) {
    const avgSpending = {};
    let totalSpending = 0;

    // Calculate average spending per category
    historicalData.forEach(event => {
      event.budget.categories.forEach(cat => {
        if (!avgSpending[cat.name]) {
          avgSpending[cat.name] = { total: 0, count: 0 };
        }
        avgSpending[cat.name].total += cat.allocatedAmount;
        avgSpending[cat.name].count++;
        totalSpending += cat.allocatedAmount;
      });
    });

    // Calculate percentages
    if (totalSpending > 0) {
      template = {};
      CATEGORIES.forEach(cat => {
        if (avgSpending[cat]) {
          const avg = avgSpending[cat].total / avgSpending[cat].count;
          template[cat] = avg / (totalSpending / historicalData.length);
        }
      });

      // Calculate average cost per attendee
      const avgAttendees = historicalData.reduce((sum, e) => sum + e.attendees, 0) / historicalData.length;
      baseCost = (totalSpending / historicalData.length) / avgAttendees;
      
      confidence = Math.min(60 + (historicalData.length * 5), 95);
    }
  }

  const expectedAttendees = currentEvent.maxParticipants || 50;
  const estimatedTotal = Math.round(baseCost * expectedAttendees);

  const suggestions = {};
  CATEGORIES.forEach(category => {
    const percentage = template[category] || 0.05;
    suggestions[category] = {
      suggested: Math.round(estimatedTotal * percentage),
      percentage: Math.round(percentage * 100),
      reasoning: getCategoryReasoning(category, currentEvent.category || 'WORKSHOP')
    };
  });

  const insights = [];
  if (historicalData.length === 0) {
    insights.push({ type: 'INFO', message: 'No historical data available. Suggestions based on industry standards.', icon: '💡' });
  } else {
    insights.push({ type: 'SUCCESS', message: `Suggestions based on ${historicalData.length} similar past event(s).`, icon: '📊' });
  }

  if (expectedAttendees > 100) {
    insights.push({ type: 'WARNING', message: 'Large attendance expected. Consider bulk discounts for food and printing.', icon: '👥' });
  }

  if (currentEvent.category === 'HACKATHON') {
    insights.push({ type: 'TIP', message: 'Hackathons typically require 24-hour food coverage. Budget accordingly.', icon: '🍕' });
  }

  return {
    estimatedTotal,
    basedOn: historicalData.length > 0 ? 'HISTORICAL_DATA' : 'TEMPLATE',
    suggestions,
    confidence,
    insights
  };
}

/**
 * Helper to get reasoning for each category
 */
function getCategoryReasoning(category, eventType) {
  const reasons = {
    Food: {
      WORKSHOP: 'Meals and refreshments for participants during sessions',
      HACKATHON: 'Extended event requires multiple meals and continuous refreshments',
      SEMINAR: 'Basic refreshments and lunch for attendees',
      CULTURAL: 'Snacks and refreshments for performers and audience',
      COMPETITION: 'Meals for participants during competition rounds'
    },
    Printing: {
      WORKSHOP: 'Course materials, certificates, and handouts',
      HACKATHON: 'Schedule posters and participant badges',
      SEMINAR: 'Conference materials and informational brochures',
      CULTURAL: 'Event posters, tickets, and promotional materials',
      COMPETITION: 'Question papers, answer sheets, and certificates'
    },
    Travel: {
      WORKSHOP: 'Guest speaker/trainer transportation',
      HACKATHON: 'Mentor and judge travel reimbursements',
      SEMINAR: 'Chief guest and speaker travel expenses',
      CULTURAL: 'Artist and performer transportation',
      COMPETITION: 'Judge and coordinator travel costs'
    },
    Marketing: {
      WORKSHOP: 'Social media promotion and registration campaigns',
      HACKATHON: 'Wide outreach campaigns across colleges',
      SEMINAR: 'Professional promotion and event publicity',
      CULTURAL: 'Extensive marketing for audience reach',
      COMPETITION: 'Inter-college promotional activities'
    },
    Logistics: {
      WORKSHOP: 'Venue setup, seating arrangements, signage',
      HACKATHON: 'Extended venue booking, Wi-Fi, power backup',
      SEMINAR: 'Stage setup, audio systems, seating',
      CULTURAL: 'Stage decoration, lighting, sound systems',
      COMPETITION: 'Venue arrangement, timekeeping equipment'
    },
    Prizes: {
      WORKSHOP: 'Participation certificates and small goodies',
      HACKATHON: 'Winner prizes, runner-up awards, special category prizes',
      SEMINAR: 'Token of appreciation for speakers',
      CULTURAL: 'Performance prizes and recognition awards',
      COMPETITION: 'Winner prizes, medals, and trophies'
    },
    Equipment: {
      WORKSHOP: 'Projector, laptops, microphones, whiteboards',
      HACKATHON: 'Additional power strips, network equipment',
      SEMINAR: 'AV equipment, presentation system',
      CULTURAL: 'Stage equipment, instruments, props',
      COMPETITION: 'Specialized equipment based on competition type'
    },
    Other: {
      WORKSHOP: 'Miscellaneous expenses',
      HACKATHON: 'Miscellaneous expenses',
      SEMINAR: 'Miscellaneous expenses',
      CULTURAL: 'Miscellaneous expenses',
      COMPETITION: 'Miscellaneous expenses'
    }
  };

  return reasons[category]?.[eventType] || `Standard allocation for ${category} expenses`;
}

export default router;
