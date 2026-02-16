import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Receipt,
  PieChart,
  Plus,
  FileText,
  ArrowUpRight,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Banknote,
  IndianRupee,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import financeService from "../../../services/financeService";

const FinanceDashboard = () => {
  const { eventId } = useParams();
  const { user } = useAuth();
  const [budget, setBudget] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchFinanceData();
  }, [eventId]);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch budget
      try {
        const budgetRes = await financeService.getBudget(eventId);
        setBudget(budgetRes.data);
      } catch {
        // Budget might not exist yet
      }

      // Fetch expenses
      try {
        const expenseRes = await financeService.getExpenses(eventId);
        setExpenses(expenseRes.data || []);
      } catch {
        // No expenses logged yet
      }
    } catch (err) {
      setError("Failed to load financial data");
      console.error("Error fetching finance data:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalAllocated = budget?.totalAllocatedAmount || 0;
  const remaining = totalAllocated - totalSpent;
  const utilization =
    totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;

  const getStatusBadge = (status) => {
    const styles = {
      APPROVED: "bg-[#B9FF66] text-[#191A23]",
      PENDING:
        "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400",
      REJECTED: "bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400",
      REIMBURSED:
        "bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400",
      REQUESTED:
        "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400",
      DRAFT: "bg-gray-100 text-gray-800 dark:bg-white/5 dark:text-zinc-400",
      PARTIALLY_APPROVED:
        "bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400",
      CLOSED: "bg-gray-100 text-gray-800 dark:bg-white/5 dark:text-zinc-400",
    };
    return styles[status] || styles.DRAFT;
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#B9FF66] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-zinc-400 font-medium">
            Loading financial data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <div className="inline-block">
            <h1 className="text-3xl font-black text-[#191A23] dark:text-white mb-2">
              Finance & Budget
            </h1>
            <div className="h-1 w-20 bg-[#B9FF66] rounded-full"></div>
          </div>
          <p className="text-gray-600 dark:text-zinc-400 mt-3 text-base font-medium">
            Track budget allocation, expenses, and reimbursements
          </p>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <Link
            to={`/organizer/events/${eventId}/finance/request`}
            className="flex items-center gap-2 px-5 py-2.5 border-2 border-gray-300 dark:border-white/10 text-[#191A23] dark:text-zinc-300 rounded-xl font-semibold text-sm hover:bg-gray-50 dark:hover:bg-white/5 hover:border-[#191A23] dark:hover:border-white/30 transition-all"
          >
            <FileText size={16} />
            {budget ? "Update Budget" : "Request Budget"}
          </Link>
          <Link
            to={`/organizer/events/${eventId}/finance/expense`}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              budget &&
              (budget.status === "APPROVED" ||
                budget.status === "PARTIALLY_APPROVED")
                ? "bg-[#191A23] text-[#B9FF66] hover:shadow-lg hover:bg-[#2A2B33]"
                : "bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-white/5 dark:text-zinc-600"
            }`}
          >
            <Plus size={16} />
            Log Expense
          </Link>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={20} className="text-red-600" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Budget Status */}
        <div className="relative bg-[#B9FF66]/10 dark:bg-[#B9FF66]/5 rounded-2xl p-5 border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none hover:shadow-lg dark:hover:shadow-black/20 transition-all duration-300 hover:-translate-y-1 group overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br from-[#B9FF66] to-[#A8EE55] rounded-full opacity-10 group-hover:opacity-20 transition-opacity blur-2xl"></div>
          <div className="relative z-0">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#B9FF66] to-[#A8EE55] shadow-md w-fit mb-3">
              <Wallet size={20} strokeWidth={2.5} className="text-[#191A23]" />
            </div>
            <p className="text-gray-600 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">
              Budget Status
            </p>
            <h3 className="text-2xl font-black text-[#191A23] dark:text-white mb-1">
              {budget?.status || "N/A"}
            </h3>
            <span
              className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${getStatusBadge(budget?.status)}`}
            >
              {budget?.status || "NOT REQUESTED"}
            </span>
          </div>
        </div>

        {/* Total Allocated */}
        <div className="relative bg-[#191A23]/5 dark:bg-white/[0.03] rounded-2xl p-5 border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none hover:shadow-lg dark:hover:shadow-black/20 transition-all duration-300 hover:-translate-y-1 group overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br from-[#191A23] to-[#2A2B33] rounded-full opacity-10 group-hover:opacity-20 transition-opacity blur-2xl"></div>
          <div className="relative z-0">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#191A23] to-[#2A2B33] shadow-md w-fit mb-3">
              <IndianRupee
                size={20}
                strokeWidth={2.5}
                className="text-[#B9FF66]"
              />
            </div>
            <p className="text-gray-600 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">
              Total Allocated
            </p>
            <h3 className="text-2xl font-black text-[#191A23] dark:text-white">
              ₹{totalAllocated.toLocaleString()}
            </h3>
          </div>
        </div>

        {/* Total Spent */}
        <div className="relative bg-[#191A23]/5 dark:bg-white/[0.03] rounded-2xl p-5 border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none hover:shadow-lg dark:hover:shadow-black/20 transition-all duration-300 hover:-translate-y-1 group overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full opacity-10 group-hover:opacity-20 transition-opacity blur-2xl"></div>
          <div className="relative z-0">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-gray-400 to-gray-500 shadow-md w-fit mb-3">
              <TrendingUp size={20} strokeWidth={2.5} className="text-white" />
            </div>
            <p className="text-gray-600 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">
              Total Spent
            </p>
            <h3 className="text-2xl font-black text-[#191A23] dark:text-white">
              ₹{totalSpent.toLocaleString()}
            </h3>
            <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">
              {expenses.length} transactions
            </p>
          </div>
        </div>

        {/* Remaining */}
        <div className="relative bg-[#B9FF66]/10 dark:bg-[#B9FF66]/5 rounded-2xl p-5 border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none hover:shadow-lg dark:hover:shadow-black/20 transition-all duration-300 hover:-translate-y-1 group overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br from-[#B9FF66] to-[#A8EE55] rounded-full opacity-10 group-hover:opacity-20 transition-opacity blur-2xl"></div>
          <div className="relative z-0">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#B9FF66] to-[#A8EE55] shadow-md w-fit mb-3">
              <Banknote
                size={20}
                strokeWidth={2.5}
                className="text-[#191A23]"
              />
            </div>
            <p className="text-gray-600 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">
              Remaining
            </p>
            <h3
              className={`text-2xl font-black ${remaining < 0 ? "text-red-500" : "text-[#191A23] dark:text-white"}`}
            >
              ₹{remaining.toLocaleString()}
            </h3>
            <div className="w-full h-1.5 bg-gray-200 dark:bg-white/10 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${utilization > 90 ? "bg-red-500" : "bg-[#B9FF66]"}`}
                style={{ width: `${Math.min(utilization, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">
              {utilization}% utilized
            </p>
          </div>
        </div>
      </div>

      {/* Budget Breakdown Table */}
      <div className="bg-white dark:bg-white/[0.03] rounded-3xl p-6 border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#B9FF66]/10 rounded-xl">
              <PieChart
                size={20}
                className="text-[#191A23] dark:text-[#B9FF66]"
              />
            </div>
            <h3 className="font-bold text-[#191A23] dark:text-white text-lg">
              Budget Breakdown
            </h3>
          </div>
        </div>

        {!budget ? (
          <div className="text-center py-16">
            <div className="p-4 bg-[#B9FF66]/10 rounded-2xl inline-block mb-4">
              <Wallet
                size={48}
                className="text-[#191A23] dark:text-zinc-400 opacity-50"
              />
            </div>
            <h3 className="text-lg font-bold text-[#191A23] dark:text-white mb-2">
              No budget request yet
            </h3>
            <p className="text-gray-600 dark:text-zinc-400 mb-4 font-medium">
              Create a budget request to start tracking finances
            </p>
            <Link
              to={`/organizer/events/${eventId}/finance/request`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#B9FF66] text-[#191A23] rounded-xl hover:bg-[#A8EE55] transition-colors text-sm font-bold"
            >
              <Plus size={16} /> Create Budget Request
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/5">
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-wider">
                    Requested
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-wider">
                    Allocated
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-wider">
                    Spent
                  </th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-wider">
                    Utilization
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {budget.categories.map((cat, idx) => {
                  const spentInCat = expenses
                    .filter((e) => e.category === cat.name)
                    .reduce((sum, e) => sum + e.amount, 0);
                  const catUtil =
                    cat.allocatedAmount > 0
                      ? Math.round((spentInCat / cat.allocatedAmount) * 100)
                      : 0;

                  return (
                    <tr
                      key={idx}
                      className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">
                            {categoryEmojis[cat.name] || "📝"}
                          </span>
                          <span className="font-bold text-[#191A23] dark:text-white text-sm">
                            {cat.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-zinc-400">
                        ₹{cat.requestedAmount?.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-sm font-bold text-[#191A23] dark:text-white">
                        ₹{cat.allocatedAmount?.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-sm font-bold text-[#191A23] dark:text-[#B9FF66]">
                        ₹{spentInCat.toLocaleString()}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-20 h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${catUtil > 90 ? "bg-red-500" : "bg-[#B9FF66]"}`}
                              style={{
                                width: `${Math.min(catUtil, 100)}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-xs font-bold text-gray-500 dark:text-zinc-500">
                            {catUtil}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Expenses */}
      <div className="bg-white dark:bg-white/[0.03] rounded-3xl p-6 border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#191A23]/5 dark:bg-white/5 rounded-xl">
              <Receipt
                size={20}
                className="text-[#191A23] dark:text-[#B9FF66]"
              />
            </div>
            <h3 className="font-bold text-[#191A23] dark:text-white text-lg">
              Recent Expenses
            </h3>
          </div>
          {expenses.length > 5 && (
            <button className="text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-[#191A23] dark:hover:text-white flex items-center gap-1">
              View All <ArrowUpRight size={14} />
            </button>
          )}
        </div>

        {expenses.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">💸</div>
            <p className="text-gray-600 dark:text-zinc-400 font-medium">
              No expenses logged yet
            </p>
            <p className="text-gray-500 dark:text-zinc-500 text-sm">
              Start logging expenses to track spending
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.slice(0, 6).map((expense) => (
              <div
                key={expense._id}
                className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/[0.03] hover:bg-[#B9FF66]/10 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-[#B9FF66]/20"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {categoryEmojis[expense.category] || "📝"}
                  </div>
                  <div>
                    <div className="font-semibold text-[#191A23] dark:text-white text-sm">
                      {expense.description}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">
                      {expense.category} •{" "}
                      {new Date(expense.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      • {expense.incurredBy?.name || "Unknown"}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[#191A23] dark:text-white text-sm">
                    ₹{expense.amount?.toLocaleString()}
                  </div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${getStatusBadge(expense.status)}`}
                  >
                    {expense.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit History */}
      {budget?.history && budget.history.length > 0 && (
        <div className="bg-[#191A23] rounded-3xl p-6 shadow-2xl overflow-hidden relative">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>

          <div className="relative z-10">
            <h3 className="font-bold text-white text-lg mb-4">
              Budget History
            </h3>
            <div className="space-y-3">
              {budget.history
                .slice(-5)
                .reverse()
                .map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        entry.action === "APPROVED"
                          ? "bg-[#B9FF66]/20"
                          : entry.action === "REJECTED"
                            ? "bg-red-500/20"
                            : "bg-white/10"
                      }`}
                    >
                      {entry.action === "APPROVED" ? (
                        <CheckCircle size={16} className="text-[#B9FF66]" />
                      ) : entry.action === "REJECTED" ? (
                        <XCircle size={16} className="text-red-400" />
                      ) : (
                        <Clock size={16} className="text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">
                        {entry.action}
                      </p>
                      {entry.note && (
                        <p className="text-gray-400 text-xs mt-0.5">
                          {entry.note}
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(entry.timestamp).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceDashboard;
