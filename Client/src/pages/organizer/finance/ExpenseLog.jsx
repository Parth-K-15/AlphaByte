import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Upload,
  CheckCircle,
  ArrowLeft,
  IndianRupee,
  Loader2,
  FileText,
  AlertCircle,
  Sparkles,
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

const ExpenseLog = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [budget, setBudget] = useState(null);
  const [form, setForm] = useState({
    category: "Food",
    amount: "",
    description: "",
    vendor: "",
    receiptUrl: "",
  });
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [ocrData, setOcrData] = useState(null);
  const [showOcrSuggestion, setShowOcrSuggestion] = useState(false);

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

  const handleOCRComplete = (data) => {
    if (data) {
      setOcrData(data);
      setShowOcrSuggestion(true);
      
      // Auto-fill only if form is empty
      if (!form.amount && !form.description) {
        applyOCRData(data);
      }
    }
  };

  const applyOCRData = (data) => {
    const updatedForm = { ...form };
    
    if (data.amount && !form.amount) {
      updatedForm.amount = data.amount.toString();
    }
    
    if (data.description && !form.description) {
      updatedForm.description = data.description;
    }
    
    if (data.vendor && !form.vendor) {
      updatedForm.vendor = data.vendor;
    }
    
    if (data.suggestedCategory) {
      updatedForm.category = data.suggestedCategory;
    }
    
    setForm(updatedForm);
    setShowOcrSuggestion(false);
  };

  const dismissOCRSuggestion = () => {
    setShowOcrSuggestion(false);
    setOcrData(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.amount || !form.description) {
      setError("Please fill in the amount and description.");
      return;
    }setOcrData(null);
      setShowOcrSuggestion(false);
      

    if (!budget) {
      setError("No approved budget found for this event.");
      return;
    }

    // Get user ID from multiple sources
    const userId = user?.id || user?.userId || user?._id || localStorage.getItem('userId');
    
    if (!userId) {
      setError("User authentication error. Please log in again.");
      console.error("User object:", user);
      return;
    }

    console.log("Submitting expense with userId:", userId);

    try {
      setLoading(true);
      await financeService.logExpense({
        eventId,
        budgetId: budget._id,
        category: form.category,
        amount: Number(form.amount),
        description: form.description,
        vendor: form.vendor || undefined,
        receiptUrl: form.receiptUrl || undefined,
        type: "PERSONAL_SPEND",
        incurredBy: userId,
      });

      // Reset form and refresh
      setForm({
        category: "Food",
        amount: "",
        description: "",
        vendor: "",
        receiptUrl: "",
      });
      await fetchBudgetAndExpenses();
    } catch (err) {
      setError(err.message || "Failed to log expense");
    } finally {
      setLoading(false);
    }
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

  const selectedBudget = getCategoryBudget(form.category);
  const selectedSpend = getCategorySpend(form.category);
  const selectedRemaining = selectedBudget - selectedSpend;

  const getStatusBadge = (status) => {
    const styles = {
      APPROVED: "bg-[#B9FF66] text-[#191A23]",
      PENDING:
        "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400",
      REJECTED: "bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400",
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
          Record an expense against your approved budget
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={16} className="text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-700 dark:text-red-400 font-medium">
            {error}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expense Form */}
        <div className="lg:col-span-2">
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-white/[0.03] rounded-3xl p-6 border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-[#B9FF66]/10 rounded-xl">
                <FileText
                  size={20}
                  className="text-[#191A23] dark:text-[#B9FF66]"
                />
              </div>
              <h3 className="font-bold text-[#191A23] dark:text-white text-lg">
                Expense Details
              </h3>
            </div>

            <div className="space-y-5">
              {/* Category & Amount Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-wider mb-2">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-semibold text-[#191A23] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#B9FF66]/30 focus:border-[#B9FF66] transition-all"
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
                        setForm({ ...form, amount: e.target.value })
                      }
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-semibold text-[#191A23] dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#B9FF66]/30 focus:border-[#B9FF66] transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Describe the expense (e.g., Catering for 200 participants)"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-semibold text-[#191A23] dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#B9FF66]/30 focus:border-[#B9FF66] transition-all resize-none"
                  required
                />
              </div>

              {/* Vendor */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-wider mb-2">
                  Vendor / Payee (Optional)
                </label>
                <input
                  type="text"
                  value={form.vendor}
                  onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                  placeholder="Name of vendor or shop"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-semibold text-[#191A23] dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#B9FF66]/30 focus:border-[#B9FF66] transition-all"
                />
              </div>

              {/* Receipt Upload */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-wider mb-3">
                  <span className="flex items-center gap-2">
                    Receipt / Bill
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400 text-[10px] font-bold rounded">
                      <Sparkles size={10} />
                      AI-Powered
                    </span>
                  </span>
                </label>
                <ReceiptUpload
                  onUpload={(url) => setForm({ ...form, receiptUrl: url })}
                  onOCRComplete={handleOCRComplete}
                  existingReceipt={form.receiptUrl ? { url: form.receiptUrl } : null}
                  disabled={loading}
                  enableOCR={true}
                />
              </div>

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
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-[#191A23] text-[#B9FF66] rounded-xl font-bold text-sm hover:shadow-lg hover:bg-[#2A2B33] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Logging...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Log Expense
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
                {categoryEmojis[form.category]} {form.category} Budget
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
