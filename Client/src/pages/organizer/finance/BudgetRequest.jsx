import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Plus,
  Trash2,
  CheckCircle,
  ArrowLeft,
  IndianRupee,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Lightbulb,
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
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  useEffect(() => {
    fetchAISuggestions();
  }, [eventId]);

  const fetchAISuggestions = async () => {
    try {
      setLoadingSuggestions(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/finance/ai/budget-suggestions/${eventId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setAiSuggestions(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch AI suggestions:', err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const applySuggestions = () => {
    const suggestedCategories = aiSuggestions?.suggestions?.suggestions;
    if (!suggestedCategories || typeof suggestedCategories !== "object") return;

    const newItems = Object.entries(suggestedCategories)
      .map(([category, data]) => ({
        name: category,
        requestedAmount: String(data?.suggested ?? ""),
        justification: data?.reasoning || `Budget allocation for ${category}`,
      }))
      .filter((item) => Number(item.requestedAmount) > 0);

    if (newItems.length > 0) {
      setItems(newItems);
    }
    setShowSuggestions(false);
  };

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

      {/* AI Suggestions Panel */}
      {aiSuggestions && (
        <div className="bg-gradient-to-br from-lime-50 to-green-50 dark:from-lime-950/20 dark:to-green-950/20 border-2 border-lime-300 dark:border-lime-700 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-lime-100 to-green-100 dark:from-lime-900/30 dark:to-green-900/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-lime-500 rounded-xl">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-black text-[#191A23] dark:text-white text-lg">
                    AI Budget Recommendations
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    Based on {aiSuggestions.basedOn?.similarEvents || 0} similar past events • {aiSuggestions.confidence || 0}% confidence
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="p-2 hover:bg-white/50 dark:hover:bg-black/30 rounded-lg transition-colors"
              >
                {showSuggestions ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
          </div>

          {/* Content */}
          {showSuggestions && (
            <div className="p-5 space-y-4">
              {loadingSuggestions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={32} className="animate-spin text-lime-600" />
                </div>
              ) : (
                <>
                  {/* Summary */}
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-white/5 rounded-xl border border-lime-200 dark:border-lime-800">
                    <div>
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Suggested Total Budget
                      </p>
                      <p className="text-2xl font-black text-lime-700 dark:text-lime-400 mt-1">
                        ₹{aiSuggestions.suggestions.estimatedTotal?.toLocaleString() || 0}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {aiSuggestions.suggestions.basedOn === 'HISTORICAL_DATA' ? 'Based on historical data' : 'Based on industry standards'}
                      </p>
                    </div>
                    <button
                      onClick={applySuggestions}
                      className="px-4 py-2.5 bg-lime-600 hover:bg-lime-700 text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
                    >
                      <Sparkles size={16} />
                      Apply to Form
                    </button>
                  </div>

                  {/* Category Suggestions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(aiSuggestions.suggestions.suggestions || {}).map(([category, data]) => (
                      <div key={category} className="p-4 bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{categoryEmojis[category] || "📝"}</span>
                            <span className="font-bold text-sm text-[#191A23] dark:text-white">{category}</span>
                          </div>
                          <span className="text-xs font-bold text-lime-700 dark:text-lime-400 bg-lime-100 dark:bg-lime-900/30 px-2 py-1 rounded">
                            {data.percentage}%
                          </span>
                        </div>
                        <p className="text-xl font-black text-gray-800 dark:text-white mb-1">
                          ₹{data.suggested?.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                          {data.reasoning}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Insights */}
                  {aiSuggestions.suggestions.insights && aiSuggestions.suggestions.insights.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb size={16} className="text-lime-600 dark:text-lime-400" />
                        <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          AI Insights
                        </p>
                      </div>
                      {aiSuggestions.suggestions.insights.map((insight, idx) => (
                        <div key={idx} className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                          insight.type === 'WARNING' ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800' :
                          insight.type === 'SUCCESS' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' :
                          'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                        }`}>
                          <span className="text-sm">{insight.icon}</span>
                          <span className={`font-medium ${
                            insight.type === 'WARNING' ? 'text-amber-800 dark:text-amber-300' :
                            insight.type === 'SUCCESS' ? 'text-green-800 dark:text-green-300' :
                            'text-blue-800 dark:text-blue-300'
                          }`}>
                            {insight.message}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
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
