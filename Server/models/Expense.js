import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    budget: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Budget",
      required: true,
    },
    category: {
      type: String,
      required: true, // Should match one of the budget categories
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
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    description: {
      type: String,
      required: true,
    },
    incurredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiptUrl: {
      type: String,
      required: true, // Receipt is mandatory for expense tracking
    },
    receiptPublicId: String, // For Cloudinary
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "REIMBURSED"],
      default: "PENDING",
    },
    type: {
      type: String,
      enum: ["PERSONAL_SPEND", "DIRECT_INVOICE"],
      default: "PERSONAL_SPEND",
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    adminNotes: String,
    reimbursedAt: Date,
    reimbursedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Expense", expenseSchema);
