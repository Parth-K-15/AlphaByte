import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CheckCircle,
  ArrowLeft,
  IndianRupee,
  Loader2,
  FileText,
  AlertCircle,
  Sparkles,
  Camera,
  Wand2,
  PenLine,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import financeService from "../../../services/financeService";
import ReceiptUpload from "../../../components/organizer/ReceiptUpload";

const CATEGORIES = [
  "Food",
  "Printing",
  "Travel",
  "Marketing",
  "Logistics",
  "Prizes",
  "Equipment",
  "Other",
];

const categoryEmojis = {
  Food: "🍕",
  Printing: "🖨️",
  Travel: "🚕",
  Marketing: "📣",
  Logistics: "📦",
  Prizes: "🏆",
  Equipment: "🔧",
  Other: "📝",
};

// AI badge component for auto-filled fields
const AiBadge = ({ visible }) => {
  if (!visible) return null;
  return (
    <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400 text-[10px] font-bold rounded-md animate-in">
      <Sparkles size={10} />
      AI-filled
    </span>
  );
};

// Skeleton shimmer for loading fields
const FieldSkeleton = () => (
  <div className="space-y-2">
    <div className="h-3 w-20 bg-gray-200 dark:bg-white/10 rounded animate-pulse"></div>
    <div className="h-11 bg-lime-50 dark:bg-lime-900/10 border border-lime-200 dark:border-lime-800/30 rounded-xl animate-pulse flex items-center px-4">
      <div className="flex items-center gap-2 text-lime-600 dark:text-lime-400 text-xs font-medium">
        <Wand2 size={14} className="animate-spin" style={{ animationDuration: '3s' }} />
        <span>AI is reading...</span>
      </div>
    </div>
  </div>
);

const ExpenseLog = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [budget, setBudget] = useState(null);
  const [recentExpenses, setRecentExpenses] = useState([]);

  const [form, setForm] = useState({
    category: "Other",
    amount: "",
    description: "",
    vendor: "",
    receiptUrl: "",
  });

  // AI / OCR states
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [autoFilled, setAutoFilled] = useState({}); // { amount: true, category: true, ... }
  const [ocrConfidence, setOcrConfidence] = useState(null);
  const [aiFieldCount, setAiFieldCount] = useState(0);
  const [editingExpense, setEditingExpense] = useState(null);

  useEffect(() => {
    fetchBudgetAndExpenses();
  }, [eventId]);

  const fetchBudgetAndExpenses = async () => {
    try {
      const budgetRes = await financeService.getBudget(eventId);
      setBudget(budgetRes.data);
    } catch {
      // Budget might not exist
    }
    try {
      const expenseRes = await financeService.getExpenses(eventId);
      setRecentExpenses(expenseRes.data || []);
    } catch {
      // No expenses
    }
  };

  // Called when OCR starts processing
  const handleOCRStart = () => {
    setOcrProcessing(true);
    setAutoFilled({});
    setOcrConfidence(null);
    setAiFieldCount(0);
  };

  // Called when OCR finishes
  const handleOCRComplete = (data) => {
    setOcrProcessing(false);

    if (!data) return;

    const filled = {};
    const updatedForm = { ...form };

    if (data.amount) {
      updatedForm.amount = data.amount.toString();
      filled.amount = true;
    }

    if (data.description) {
      updatedForm.description = data.description;
      filled.description = true;
    }

    if (data.vendor) {
      updatedForm.vendor = data.vendor;
      filled.vendor = true;
    }

    if (data.suggestedCategory && CATEGORIES.includes(data.suggestedCategory)) {
      updatedForm.category = data.suggestedCategory;
      filled.category = true;
    }

    setForm(updatedForm);
    setAutoFilled(filled);
    setOcrConfidence(data.confidence);
    setAiFieldCount(Object.keys(filled).length);
  };

  // Track manual edits to remove AI badge
  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (autoFilled[field]) {
      setAutoFilled((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.amount || !form.description) {
      setError("Please fill in the amount and description.");
      return;
    }

    if (!budget) {
      setError("No approved budget found for this event.");
      return;
    }

    const userId =
      user?.id || user?.userId || user?._id || localStorage.getItem("userId");

    if (!userId) {
      setError("User authentication error. Please log in again.");
      return;
    }

    try {
      setLoading(true);
      if (editingExpense?._id) {
        await financeService.resubmitExpense(editingExpense._id, {
          userId,
          category: form.category || "Other",
          amount: Number(form.amount),
          description: form.description,
          receiptUrl: form.receiptUrl || undefined,
        });
      } else {
        await financeService.logExpense({
          eventId,
          budgetId: budget._id,
          category: form.category || "Other",
          amount: Number(form.amount),
          description: form.description,
          vendor: form.vendor || undefined,
          receiptUrl: form.receiptUrl || undefined,
          type: "PERSONAL_SPEND",
          incurredBy: userId,
        });
      }

      setSuccess(true);
      setForm({
        category: "Other",
        amount: "",
        description: "",
        vendor: "",
        receiptUrl: "",
      });
      setEditingExpense(null);
      setAutoFilled({});
      setOcrConfidence(null);
      setAiFieldCount(0);
      await fetchBudgetAndExpenses();

      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err.message || "Failed to log expense");
    } finally {
      setLoading(false);
    }
  };

  const handleResubmitExpense = async (expense) => {
    setError("");
    setSuccess(false);
    setEditingExpense(expense);
    setForm({
      category: expense.category || "Other",
      amount: expense.amount?.toString() || "",
      description: expense.description || "",
      vendor: expense.vendor || "",
      receiptUrl: expense.receiptUrl || "",
    });
    setAutoFilled({});
    setOcrConfidence(null);
    setAiFieldCount(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getCategorySpend = (catName) => {
    return recentExpenses
      .filter((e) => e.category === catName)
      .reduce((sum, e) => sum + (e.amount || 0), 0);
  };

  const getCategoryBudget = (catName) => {
    if (!budget?.categories) return 0;
    const cat = budget.categories.find((c) => c.name === catName);
    return cat?.allocatedAmount || 0;
  };

  const activeCat = form.category || "Other";
  const selectedBudget = getCategoryBudget(activeCat);
  const selectedSpend = getCategorySpend(activeCat);
  const selectedRemaining = selectedBudget - selectedSpend;

  const getStatusBadge = (status) => {
    const styles = {
      APPROVED: "bg-[#B9FF66] text-[#191A23]",
      PENDING:
        "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400",
      CHANGES_REQUESTED:
        "bg-purple-100 text-purple-800 dark:bg-purple-500/10 dark:text-purple-400",
      REJECTED:
        "bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400",
      REIMBURSED:
        "bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400",
    };
    return (
      styles[status] ||
      "bg-gray-100 text-gray-800 dark:bg-white/5 dark:text-zinc-400"
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 dark:text-zinc-400 hover:text-[#191A23] dark:hover:text-white transition-colors mb-4 text-sm font-medium"
        >
          <ArrowLeft size={16} /> Back to Finance
        </button>
        <div className="inline-block">
          <h1 className="text-3xl font-black text-[#191A23] dark:text-white mb-2">
            Log Expense
          </h1>
          <div className="h-1 w-20 bg-[#B9FF66] rounded-full"></div>
        </div>
        <p className="text-gray-600 dark:text-zinc-400 mt-3 text-base font-medium">
          Upload a bill and AI will fill the details for you
        </p>
      </div>

      {/* Success Toast */}
      {success && (
        <div className="bg-lime-50 dark:bg-lime-950/50 border border-lime-300 dark:border-lime-800 rounded-xl p-4 flex items-center gap-3 animate-in">
          <CheckCircle size={18} className="text-lime-600 dark:text-lime-400" />
          <p className="text-sm text-lime-800 dark:text-lime-300 font-semibold">
            Expense logged successfully!
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={16} className="text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-700 dark:text-red-400 font-medium">
            {error}
          </p>
        </div>
      )}

      {recentExpenses.some((e) => e.status === "CHANGES_REQUESTED") && (
        <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-purple-800 dark:text-purple-300">
            Admin requested changes on these bills. Review old values, update, and resubmit.
          </p>
          <div className="space-y-2">
            {recentExpenses
              .filter((e) => e.status === "CHANGES_REQUESTED")
              .map((expense) => (
                <div
                  key={expense._id}
                  className="bg-white dark:bg-white/[0.03] border border-purple-200 dark:border-purple-800/40 rounded-lg p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-[#191A23] dark:text-white">
                        {expense.description}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-zinc-400">
                        Previous values: {expense.category} • ₹{expense.amount?.toLocaleString()} • {expense.vendor || "No vendor"}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-zinc-400">
                        Last submitted: {expense.createdAt ? new Date(expense.createdAt).toLocaleString() : "N/A"}
                      </p>
                      {expense.receiptUrl && (
                        <a
                          href={expense.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block mt-1"
                        >
                          <img
                            src={expense.receiptUrl}
                            alt="Previously uploaded bill"
                            className="w-24 h-24 object-cover rounded-lg border border-purple-200 dark:border-purple-800/40"
                          />
                        </a>
                      )}
                      {expense.adminNotes && (
                        <p className="text-xs text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/40 rounded p-2">
                          Admin note: {expense.adminNotes}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleResubmitExpense(expense)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
                    >
                      Edit & Resubmit
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {editingExpense && (
            <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40 rounded-xl p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-purple-800 dark:text-purple-300">
                  Editing previous bill for resubmission
                </p>
                <p className="text-xs text-purple-700 dark:text-purple-400 mt-1">
                  Old values: {editingExpense.category} • ₹{editingExpense.amount?.toLocaleString()} • {editingExpense.vendor || "No vendor"}
                </p>
                <p className="text-xs text-purple-700 dark:text-purple-400 mt-1">
                  Last submitted: {editingExpense.createdAt ? new Date(editingExpense.createdAt).toLocaleString() : "N/A"}
                </p>
                {editingExpense.receiptUrl && (
                  <a
                    href={editingExpense.receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block mt-2"
                  >
                    <img
                      src={editingExpense.receiptUrl}
                      alt="Previously uploaded bill"
                      className="w-24 h-24 object-cover rounded-lg border border-purple-200 dark:border-purple-800/40"
                    />
                  </a>
                )}
                {editingExpense.adminNotes && (
                  <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                    Admin note: {editingExpense.adminNotes}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingExpense(null);
                  setForm({
                    category: "Other",
                    amount: "",
                    description: "",
                    vendor: "",
                    receiptUrl: "",
                  });
                }}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/20"
              >
                Cancel Editing
              </button>
            </div>
          )}

          {/* ========== STEP 1: UPLOAD BILL ========== */}
          <div className="bg-white dark:bg-white/[0.03] rounded-3xl p-6 border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#B9FF66] text-[#191A23] text-xs font-black">
                1
              </div>
              <h3 className="font-bold text-[#191A23] dark:text-white text-lg flex items-center gap-2">
                <Camera size={20} />
                Upload Bill / Receipt
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400 text-[10px] font-bold rounded-md">
                <Sparkles size={10} />
                AI-Powered
              </span>
            </div>
            <p className="text-gray-500 dark:text-zinc-500 text-sm mb-5 ml-10">
              Upload your bill and AI will auto-extract amount, vendor, category & description
            </p>

            <ReceiptUpload
              onUpload={(url) => setForm((prev) => ({ ...prev, receiptUrl: url }))}
              onOCRComplete={handleOCRComplete}
              onOCRStart={handleOCRStart}
              existingReceipt={form.receiptUrl ? { url: form.receiptUrl } : null}
              disabled={loading}
              enableOCR={true}
            />
          </div>

          {/* ========== AI EXTRACTION SUMMARY ========== */}
          {aiFieldCount > 0 && !ocrProcessing && (
            <div className="flex items-center gap-3 px-5 py-3 bg-lime-50 dark:bg-lime-950/30 border border-lime-200 dark:border-lime-800/40 rounded-2xl">
              <div className="p-1.5 bg-lime-200 dark:bg-lime-800/50 rounded-lg">
                <Wand2 size={16} className="text-lime-700 dark:text-lime-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-lime-800 dark:text-lime-300">
                  AI extracted {aiFieldCount} field{aiFieldCount > 1 ? "s" : ""} from your bill
                  {ocrConfidence && (
                    <span className="ml-2 text-xs font-normal text-lime-600 dark:text-lime-500">
                      ({Math.round(ocrConfidence)}% confidence)
                    </span>
                  )}
                </p>
                <p className="text-xs text-lime-600 dark:text-lime-500 mt-0.5">
                  Review the details below and edit if anything looks incorrect
                </p>
              </div>
              <PenLine size={14} className="text-lime-500" />
            </div>
          )}

          {/* ========== STEP 2: EXPENSE DETAILS (Auto-filled) ========== */}
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-white/[0.03] rounded-3xl p-6 border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#B9FF66] text-[#191A23] text-xs font-black">
                2
              </div>
              <div className="p-2.5 bg-[#B9FF66]/10 rounded-xl">
                <FileText
                  size={20}
                  className="text-[#191A23] dark:text-[#B9FF66]"
                />
              </div>
              <h3 className="font-bold text-[#191A23] dark:text-white text-lg">
                Expense Details
              </h3>
              {ocrProcessing && (
                <span className="ml-auto flex items-center gap-2 text-lime-600 dark:text-lime-400 text-xs font-semibold">
                  <Loader2 size={14} className="animate-spin" />
                  AI is extracting...
                </span>
              )}
            </div>

            <div className="space-y-5">
              {/* Category & Amount Row */}
              {ocrProcessing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FieldSkeleton />
                  <FieldSkeleton />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-wider mb-2">
                      Category
                      <AiBadge visible={autoFilled.category} />
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) =>
                        handleFieldChange("category", e.target.value)
                      }
                      className={`w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border rounded-xl text-sm font-semibold text-[#191A23] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#B9FF66]/30 focus:border-[#B9FF66] transition-all ${
                        autoFilled.category
                          ? "border-lime-400 dark:border-lime-600 bg-lime-50/50 dark:bg-lime-900/10"
                          : "border-gray-200 dark:border-white/10"
                      }`}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {categoryEmojis[cat]} {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-wider mb-2">
                      Amount (₹)
                      <AiBadge visible={autoFilled.amount} />
                    </label>
                    <div className="relative">
                      <IndianRupee
                        size={14}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="number"
                        min="0"
                        value={form.amount}
                        onChange={(e) =>
                          handleFieldChange("amount", e.target.value)
                        }
                        placeholder="0.00"
                        className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-white/5 border rounded-xl text-sm font-semibold text-[#191A23] dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#B9FF66]/30 focus:border-[#B9FF66] transition-all ${
                          autoFilled.amount
                            ? "border-lime-400 dark:border-lime-600 bg-lime-50/50 dark:bg-lime-900/10"
                            : "border-gray-200 dark:border-white/10"
                        }`}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              {ocrProcessing ? (
                <div className="space-y-2">
                  <div className="h-3 w-24 bg-gray-200 dark:bg-white/10 rounded animate-pulse"></div>
                  <div className="h-20 bg-lime-50 dark:bg-lime-900/10 border border-lime-200 dark:border-lime-800/30 rounded-xl animate-pulse flex items-center px-4">
                    <div className="flex items-center gap-2 text-lime-600 dark:text-lime-400 text-xs font-medium">
                      <Wand2 size={14} className="animate-spin" style={{ animationDuration: '3s' }} />
                      <span>Generating description...</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-wider mb-2">
                    Description
                    <AiBadge visible={autoFilled.description} />
                  </label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) =>
                      handleFieldChange("description", e.target.value)
                    }
                    placeholder="Describe the expense (e.g., Catering for 200 participants)"
                    className={`w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border rounded-xl text-sm font-semibold text-[#191A23] dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#B9FF66]/30 focus:border-[#B9FF66] transition-all resize-none ${
                      autoFilled.description
                        ? "border-lime-400 dark:border-lime-600 bg-lime-50/50 dark:bg-lime-900/10"
                        : "border-gray-200 dark:border-white/10"
                    }`}
                    required
                  />
                </div>
              )}

              {/* Vendor */}
              {ocrProcessing ? (
                <FieldSkeleton />
              ) : (
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-wider mb-2">
                    Vendor / Payee (Optional)
                    <AiBadge visible={autoFilled.vendor} />
                  </label>
                  <input
                    type="text"
                    value={form.vendor}
                    onChange={(e) =>
                      handleFieldChange("vendor", e.target.value)
                    }
                    placeholder="Name of vendor or shop"
                    className={`w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border rounded-xl text-sm font-semibold text-[#191A23] dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#B9FF66]/30 focus:border-[#B9FF66] transition-all ${
                      autoFilled.vendor
                        ? "border-lime-400 dark:border-lime-600 bg-lime-50/50 dark:bg-lime-900/10"
                        : "border-gray-200 dark:border-white/10"
                    }`}
                  />
                </div>
              )}

              {/* Submit */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="text-gray-600 dark:text-zinc-400 hover:text-[#191A23] dark:hover:text-white font-semibold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || ocrProcessing}
                  className="flex items-center gap-2 px-6 py-3 bg-[#191A23] text-[#B9FF66] rounded-xl font-bold text-sm hover:shadow-lg hover:bg-[#2A2B33] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {editingExpense ? "Resubmitting..." : "Logging..."}
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      {editingExpense ? "Save & Resubmit" : "Log Expense"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Category Budget Status (Sidebar) */}
        <div className="space-y-6">
          {/* Selected Category Status */}
          <div className="bg-[#191A23] rounded-3xl p-6 shadow-2xl overflow-hidden relative">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>

            <div className="relative z-10">
              <h3 className="text-white font-bold text-sm mb-4">
                {categoryEmojis[activeCat]} {activeCat} Budget
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 text-xs mb-1">Allocated</p>
                  <p className="text-2xl font-black text-[#B9FF66]">
                    ₹{selectedBudget.toLocaleString()}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Spent</p>
                    <p className="text-lg font-bold text-white">
                      ₹{selectedSpend.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Remaining</p>
                    <p
                      className={`text-lg font-bold ${selectedRemaining < 0 ? "text-red-400" : "text-[#B9FF66]"}`}
                    >
                      ₹{selectedRemaining.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${selectedBudget > 0 && selectedSpend / selectedBudget > 0.9 ? "bg-red-400" : "bg-[#B9FF66]"}`}
                    style={{
                      width: `${selectedBudget > 0 ? Math.min((selectedSpend / selectedBudget) * 100, 100) : 0}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Expenses */}
          <div className="bg-white dark:bg-white/[0.03] rounded-3xl p-6 border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none">
            <h3 className="font-bold text-[#191A23] dark:text-white text-sm mb-4">
              Recent Expenses
            </h3>
            {recentExpenses.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-3xl mb-2">💸</div>
                <p className="text-gray-500 dark:text-zinc-500 text-xs font-medium">
                  No expenses yet
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentExpenses.slice(0, 5).map((expense) => (
                  <div
                    key={expense._id}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] hover:bg-[#B9FF66]/5 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {categoryEmojis[expense.category] || "📝"}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-[#191A23] dark:text-white truncate max-w-[120px]">
                          {expense.description}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-zinc-500">
                          {new Date(expense.createdAt).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" },
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-[#191A23] dark:text-white">
                        ₹{expense.amount?.toLocaleString()}
                      </p>
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded-full text-[8px] font-bold ${getStatusBadge(expense.status)}`}
                      >
                        {expense.status}
                      </span>
                      {expense.status === "CHANGES_REQUESTED" && (
                        <button
                          type="button"
                          onClick={() => handleResubmitExpense(expense)}
                          className="block mt-2 text-[10px] font-semibold text-blue-700 hover:text-blue-900"
                        >
                          Edit & Resubmit
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseLog;
