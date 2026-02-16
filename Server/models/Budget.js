import mongoose from "mongoose";

const budgetCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: [
      "Food",
      "Printing",
      "Travel",
      "Marketing",
      "Logistics",
      "Prizes",
      "Equipment",
      "Other",
    ],
  },
  requestedAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  allocatedAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  justification: {
    type: String,
    required: true,
  },
});

const budgetHistorySchema = new mongoose.Schema({
  action: {
    type: String,
    enum: [
      "CREATED",
      "UPDATED",
      "SUBMITTED",
      "APPROVED",
      "REJECTED",
      "ALLOCATED",
      "CLOSED",
      "AMENDMENT_REQUESTED",
      "AMENDMENT_APPROVED",
      "AMENDMENT_REJECTED",
    ],
    required: true,
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  note: String,
  previousStatus: String,
  newStatus: String,
});

const budgetAmendmentSchema = new mongoose.Schema({
  requestedCategories: [budgetCategorySchema],
  reason: {
    type: String,
    required: true,
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["PENDING", "APPROVED", "REJECTED"],
    default: "PENDING",
  },
  adminNotes: String,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  reviewedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const budgetSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      unique: true, // One budget per event
    },
    totalRequestAmount: {
      type: Number,
      default: 0,
    },
    totalAllocatedAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: [
        "DRAFT",
        "REQUESTED",
        "PARTIALLY_APPROVED",
        "APPROVED",
        "REJECTED",
        "CLOSED",
      ],
      default: "DRAFT",
    },
    categories: [budgetCategorySchema],
    approvalNotes: String,
    amendments: [budgetAmendmentSchema],
    history: [budgetHistorySchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

// Calculate totals before saving
budgetSchema.pre("save", function () {
  if (this.categories) {
    this.totalRequestAmount = this.categories.reduce(
      (sum, cat) => sum + (cat.requestedAmount || 0),
      0,
    );
    this.totalAllocatedAmount = this.categories.reduce(
      (sum, cat) => sum + (cat.allocatedAmount || 0),
      0,
    );
  }
});

export default mongoose.model("Budget", budgetSchema);
