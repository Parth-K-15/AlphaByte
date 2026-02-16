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
budgetSchema.pre("save", function (next) {
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
  next();
});

export default mongoose.model("Budget", budgetSchema);
