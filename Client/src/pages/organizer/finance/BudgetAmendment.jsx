import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import financeService from "../../../services/financeService";
import {
  DollarSign,
  Plus,
  Trash2,
  ArrowLeft,
  AlertCircle,
  Loader2,
  FileText,
} from "lucide-react";

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

const BudgetAmendment = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [budget, setBudget] = useState(null);
  const [reason, setReason] = useState("");
  const [categories, setCategories] = useState([
    {
      name: "Food",
      requestedAmount: "",
      justification: "",
    },
  ]);

  useEffect(() => {
    fetchBudget();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const fetchBudget = async () => {
    try {
      const response = await financeService.getBudget(eventId);
      setBudget(response.data);
    } catch (error) {
      console.error("Failed to load budget:", error);
      setError("Failed to load budget");
    }
  };

  const addCategory = () => {
    setCategories([
      ...categories,
      { name: "Food", requestedAmount: "", justification: "" },
    ]);
  };

  const removeCategory = (index) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const updateCategory = (index, field, value) => {
    const updated = [...categories];
    updated[index][field] = value;
    setCategories(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!reason.trim()) {
      setError("Please provide a reason for the amendment");
      return;
    }

    if (categories.some((c) => !c.requestedAmount || !c.justification)) {
      setError("Please fill in all category amounts and justifications");
      return;
    }

    try {
      setLoading(true);
      await financeService.requestAmendment(eventId, {
        requestedCategories: categories.map((c) => ({
          ...c,
          requestedAmount: Number(c.requestedAmount),
        })),
        reason,
        userId: user.userId,
      });

      alert("Budget amendment requested successfully!");
      navigate(`/organizer/events/${eventId}/finance`);
    } catch (error) {
      console.error("Failed to request amendment:", error);
      setError(error.message || "Failed to request amendment");
    } finally {
      setLoading(false);
    }
  };

  const getCurrentAllocation = (catName) => {
    if (!budget?.categories) return 0;
    const cat = budget.categories.find((c) => c.name === catName);
    return cat?.allocatedAmount || 0;
  };

  return (
    <div className="min-h-screen bg-[#F3F3F3] dark:bg-[#191A23] p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 dark:text-zinc-400 hover:text-[#191A23] dark:hover:text-white transition-colors mb-4 text-sm font-medium"
          >
            <ArrowLeft size={16} /> Back to Finance
          </button>
          <h1 className="text-3xl font-bold text-[#191A23] dark:text-white mb-2">
            Request Budget Amendment
          </h1>
          <p className="text-gray-600 dark:text-zinc-400">
            Request additional funding or reallocation of existing budget
          </p>
        </div>

        {/* Alert */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Current Budget Info */}
        {budget && (
          <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6">
            <h2 className="text-lg font-bold text-[#191A23] dark:text-white mb-4 flex items-center gap-2">
              <FileText size={20} className="text-[#B9FF66]" />
              Current Budget Status
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-zinc-500 uppercase tracking-wide mb-1">
                  Status
                </p>
                <p className="text-lg font-semibold text-[#191A23] dark:text-white">
                  {budget.status.replace(/_/g, " ")}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-zinc-500 uppercase tracking-wide mb-1">
                  Total Allocated
                </p>
                <p className="text-lg font-semibold text-[#B9FF66]">
                  ₹{budget.totalAllocatedAmount?.toLocaleString() || 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-zinc-500 uppercase tracking-wide mb-1">
                  Categories
                </p>
                <p className="text-lg font-semibold text-[#191A23] dark:text-white">
                  {budget.categories?.length || 0}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Amendment Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Reason for Amendment */}
          <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6">
            <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-wider mb-3">
              Reason for Amendment *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why you need additional budget or reallocation..."
              className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-semibold text-[#191A23] dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#B9FF66]/30 focus:border-[#B9FF66] transition-all min-h-[100px]"
              required
            />
          </div>

          {/* Requested Categories */}
          <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#191A23] dark:text-white">
                Requested Budget Changes
              </h2>
              <button
                type="button"
                onClick={addCategory}
                className="flex items-center gap-2 px-4 py-2 bg-[#B9FF66] text-[#191A23] rounded-lg font-semibold text-sm hover:shadow-lg transition-all"
              >
                <Plus size={16} />
                Add Category
              </button>
            </div>

            <div className="space-y-4">
              {categories.map((category, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10"
                >
                  <div className="grid gap-4">
                    {/* Category Name */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-wider mb-2">
                          Category
                        </label>
                        <select
                          value={category.name}
                          onChange={(e) =>
                            updateCategory(index, "name", e.target.value)
                          }
                          className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-semibold text-[#191A23] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#B9FF66]/30 focus:border-[#B9FF66] transition-all"
                          required
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
                          Requested Amount (₹) *
                        </label>
                        <input
                          type="number"
                          value={category.requestedAmount}
                          onChange={(e) =>
                            updateCategory(
                              index,
                              "requestedAmount",
                              e.target.value
                            )
                          }
                          placeholder="Enter amount"
                          className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-semibold text-[#191A23] dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#B9FF66]/30 focus:border-[#B9FF66] transition-all"
                          required
                          min="0"
                        />
                        {getCurrentAllocation(category.name) > 0 && (
                          <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">
                            Current: ₹
                            {getCurrentAllocation(category.name).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Justification */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-wider mb-2">
                        Justification *
                      </label>
                      <textarea
                        value={category.justification}
                        onChange={(e) =>
                          updateCategory(index, "justification", e.target.value)
                        }
                        placeholder="Explain why you need this amount..."
                        className="w-full px-4 py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-semibold text-[#191A23] dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#B9FF66]/30 focus:border-[#B9FF66] transition-all min-h-[80px]"
                        required
                      />
                    </div>

                    {/* Remove Button */}
                    {categories.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCategory(index)}
                        className="flex items-center gap-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-semibold self-start"
                      >
                        <Trash2 size={14} />
                        Remove Category
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-between pt-4">
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
                  Submitting...
                </>
              ) : (
                <>
                  <DollarSign size={16} />
                  Submit Amendment Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BudgetAmendment;
