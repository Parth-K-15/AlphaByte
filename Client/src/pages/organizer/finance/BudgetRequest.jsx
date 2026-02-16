import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Plus,
  Trash2,
  CheckCircle,
  ArrowLeft,
  IndianRupee,
  Loader2,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import financeService from "../../../services/financeService";

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

const BudgetRequest = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([
    { name: "Food", requestedAmount: "", justification: "" },
  ]);
  const [error, setError] = useState("");

  const handleAddItem = () => {
    setItems([
      ...items,
      { name: "Other", requestedAmount: "", justification: "" },
    ]);
  };

  const handleRemoveItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const handleChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const invalidItems = items.some(
      (item) => !item.requestedAmount || !item.justification,
    );
    if (invalidItems) {
      setError(
        "Please fill in all fields (Amount and Justification) for each category.",
      );
      return;
    }

    try {
      setLoading(true);
      await financeService.requestBudget({
        eventId,
        userId: user?._id || user?.id,
        categories: items.map((item) => ({
          ...item,
          requestedAmount: Number(item.requestedAmount),
        })),
      });
      navigate(`/organizer/events/${eventId}/finance`);
    } catch (err) {
      setError(err.message || "Failed to submit budget request");
    } finally {
      setLoading(false);
    }
  };

  const totalRequested = items.reduce(
    (sum, item) => sum + (Number(item.requestedAmount) || 0),
    0,
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 dark:text-zinc-400 hover:text-[#191A23] dark:hover:text-white transition-colors mb-4 text-sm font-medium"
          >
            <ArrowLeft size={16} /> Back to Finance
          </button>
          <div className="inline-block">
            <h1 className="text-3xl font-black text-[#191A23] dark:text-white mb-2">
              Create Budget Request
            </h1>
            <div className="h-1 w-20 bg-[#B9FF66] rounded-full"></div>
          </div>
          <p className="text-gray-600 dark:text-zinc-400 mt-3 text-base font-medium">
            Submit a detailed budget proposal for this event
          </p>
        </div>

        {/* Total Summary */}
        <div className="bg-[#191A23] rounded-2xl p-5 text-center mt-4 md:mt-0 min-w-[200px]">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">
            Total Requested
          </p>
          <p className="text-3xl font-black text-[#B9FF66]">
            ₹{totalRequested.toLocaleString()}
          </p>
          <p className="text-gray-500 text-xs mt-1">
            {items.length} {items.length === 1 ? "category" : "categories"}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <Trash2 size={16} className="text-red-600 dark:text-red-400" />
          </div>
          <p className="text-sm text-red-700 dark:text-red-400 font-medium">
            {error}
          </p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Budget Items */}
        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="group bg-white dark:bg-white/[0.03] rounded-2xl p-5 border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none hover:shadow-md dark:hover:shadow-black/10 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {categoryEmojis[item.name] || "📝"}
                  </span>
                  <span className="font-bold text-[#191A23] dark:text-white text-sm">
                    Category {index + 1}
                  </span>
                </div>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Category Select */}
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-wider mb-2">
                    Category
                  </label>
                  <select
                    value={item.name}
                    onChange={(e) =>
                      handleChange(index, "name", e.target.value)
                    }
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-semibold text-[#191A23] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#B9FF66]/30 focus:border-[#B9FF66] transition-all"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount Input */}
                <div className="md:col-span-3">
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
                      value={item.requestedAmount}
                      onChange={(e) =>
                        handleChange(index, "requestedAmount", e.target.value)
                      }
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-semibold text-[#191A23] dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#B9FF66]/30 focus:border-[#B9FF66] transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Justification Input */}
                <div className="md:col-span-6">
                  <label className="block text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-wider mb-2">
                    Justification
                  </label>
                  <input
                    type="text"
                    value={item.justification}
                    onChange={(e) =>
                      handleChange(index, "justification", e.target.value)
                    }
                    placeholder="Why is this budget needed?"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-semibold text-[#191A23] dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#B9FF66]/30 focus:border-[#B9FF66] transition-all"
                    required
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Category Button */}
        <button
          type="button"
          onClick={handleAddItem}
          className="w-full flex items-center justify-center gap-2 px-5 py-4 border-2 border-dashed border-gray-300 dark:border-white/10 rounded-2xl text-sm font-bold text-gray-600 dark:text-zinc-400 hover:border-[#B9FF66] hover:text-[#191A23] dark:hover:text-[#B9FF66] hover:bg-[#B9FF66]/5 transition-all"
        >
          <Plus size={18} />
          Add Another Category
        </button>

        {/* Submit Row */}
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
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                Submit Budget Request
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BudgetRequest;
