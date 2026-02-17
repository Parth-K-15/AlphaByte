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
  History,
  User,
  Calendar,
  AlertTriangle,
  BarChart3,
  Flame,
  Activity,
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart as RechartsPie, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { useAuth } from "../../../context/AuthContext";
import financeService from "../../../services/financeService";
import { detectAnomalies, calculateBurnRate, checkExpenseAnomaly } from "../../../services/anomalyDetectionService";

const FinanceDashboard = () => {
  const { eventId } = useParams();
  const { user } = useAuth();
  const [budget, setBudget] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [anomalies, setAnomalies] = useState(null);
  const [burnRate, setBurnRate] = useState(null);
  const isEventStaff = user?.role === "EVENT_STAFF";
  useEffect(() => {
    fetchFinanceData();
  }, [eventId]);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      let budgetData = null;
      let expensesData = [];

      // Fetch budget
      try {
        const budgetRes = await financeService.getBudget(eventId);
        budgetData = budgetRes.data;
        setBudget(budgetData);
      } catch {
        // Budget might not exist yet
      }

      // Fetch expenses
      try {
        const expenseRes = await financeService.getExpenses(eventId);
        expensesData = expenseRes.data || [];
        setExpenses(expensesData);
      } catch {
        // No expenses logged yet
      }

      // Detect anomalies
      if (expensesData.length > 0) {
        const detectedAnomalies = detectAnomalies(expensesData, budgetData);
        setAnomalies(detectedAnomalies);
        
        const burnRateData = calculateBurnRate(expensesData, budgetData);
        setBurnRate(burnRateData);
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
  const changeRequestedExpenses = expenses.filter(
    (e) => e.status === "CHANGES_REQUESTED"
  );
  const utilization =
    totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;

  const getStatusBadge = (status) => {
    const styles = {
      APPROVED: "bg-[#B9FF66] text-[#191A23]",
      PENDING:
        "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400",
      REJECTED: "bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400",
      CHANGES_REQUESTED:
        "bg-purple-100 text-purple-800 dark:bg-purple-500/10 dark:text-purple-400",
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

  const canRequestOrResubmitBudget =
    !isEventStaff && (!budget || budget.status === "REJECTED");

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
          {canRequestOrResubmitBudget && (
            <Link
              to={`/organizer/events/${eventId}/finance/request`}
              className="flex items-center gap-2 px-5 py-2.5 border-2 border-gray-300 dark:border-white/10 text-[#191A23] dark:text-zinc-300 rounded-xl font-semibold text-sm hover:bg-gray-50 dark:hover:bg-white/5 hover:border-[#191A23] dark:hover:border-white/30 transition-all"
            >
              <FileText size={16} />
              {budget?.status === "REJECTED"
                ? "Resubmit Budget Request"
                : "Request Budget"}
            </Link>
          )}
          {budget && (budget.status === "APPROVED" || budget.status === "PARTIALLY_APPROVED") && (
            <Link
              to={`/organizer/events/${eventId}/finance/amendment`}
              className="flex items-center gap-2 px-5 py-2.5 border-2 border-blue-300 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 rounded-xl font-semibold text-sm hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-500 transition-all"
            >
              <ArrowUpRight size={16} />
              Request Amendment
            </Link>
          )}
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

      {changeRequestedExpenses.length > 0 && (
        <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-purple-700 dark:text-purple-400" />
            <p className="text-sm font-semibold text-purple-800 dark:text-purple-300">
              {changeRequestedExpenses.length} expense
              {changeRequestedExpenses.length > 1 ? "s" : ""} need
              {changeRequestedExpenses.length > 1 ? "" : "s"} changes from admin.
            </p>
          </div>
          <Link
            to={`/organizer/events/${eventId}/finance/expense`}
            className="text-sm font-semibold text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-200"
          >
            Open Expense Form
          </Link>
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

      {/* AI Insights & Anomaly Detection */}
      {expenses.length > 0 && (anomalies?.alerts?.length > 0 || burnRate) && (
        <div className="space-y-6">
          {/* Anomaly Alerts */}
          {anomalies?.alerts?.length > 0 && (
            <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border border-orange-200 dark:border-orange-800/50 rounded-2xl p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-orange-500 rounded-xl">
                  <AlertTriangle size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                    🤖 AI Anomaly Detection
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-zinc-400">
                    {anomalies.alerts.length} unusual pattern{anomalies.alerts.length > 1 ? 's' : ''} detected
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                {anomalies.alerts.slice(0, 5).map((alert, idx) => (
                  <div 
                    key={idx}
                    className={`flex items-start gap-3 p-3 rounded-xl ${
                      alert.severity === 'CRITICAL' 
                        ? 'bg-red-100 dark:bg-red-950/50 border border-red-300 dark:border-red-800' 
                        : alert.severity === 'WARNING'
                        ? 'bg-orange-100 dark:bg-orange-950/50 border border-orange-300 dark:border-orange-800'
                        : 'bg-blue-100 dark:bg-blue-950/50 border border-blue-300 dark:border-blue-800'
                    }`}
                  >
                    {alert.severity === 'CRITICAL' ? (
                      <XCircle size={16} className="text-red-600 dark:text-red-400 mt-0.5" />
                    ) : alert.severity === 'WARNING' ? (
                      <AlertTriangle size={16} className="text-orange-600 dark:text-orange-400 mt-0.5" />
                    ) : (
                      <AlertCircle size={16} className="text-blue-600 dark:text-blue-400 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {alert.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">
                        Type: {alert.type.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                      alert.severity === 'CRITICAL' 
                        ? 'bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200' 
                        : alert.severity === 'WARNING'
                        ? 'bg-orange-200 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
                        : 'bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                    }`}>
                      {alert.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Burn Rate Indicator */}
          {burnRate && burnRate.dailyBurnRate > 0 && (
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border border-purple-200 dark:border-purple-800/50 rounded-2xl p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-purple-500 rounded-xl">
                  <Flame size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                    💰 Spending Burn Rate
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-zinc-400">
                    Real-time spending analysis
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-white/5 rounded-xl p-3 border border-purple-200 dark:border-purple-800/30">
                  <p className="text-xs text-gray-600 dark:text-zinc-400 mb-1">Daily Burn Rate</p>
                  <p className="text-lg font-black text-purple-600 dark:text-purple-400">
                    ₹{Math.round(burnRate.dailyBurnRate).toLocaleString()}/day
                  </p>
                </div>
                <div className="bg-white dark:bg-white/5 rounded-xl p-3 border border-purple-200 dark:border-purple-800/30">
                  <p className="text-xs text-gray-600 dark:text-zinc-400 mb-1">Days Tracked</p>
                  <p className="text-lg font-black text-gray-900 dark:text-white">
                    {Math.round(burnRate.daysCounted)} days
                  </p>
                </div>
                <div className="bg-white dark:bg-white/5 rounded-xl p-3 border border-purple-200 dark:border-purple-800/30">
                  <p className="text-xs text-gray-600 dark:text-zinc-400 mb-1">Budget Lasts</p>
                  <p className={`text-lg font-black ${
                    burnRate.estimatedDaysRemaining < 7 
                      ? 'text-red-600 dark:text-red-400' 
                      : burnRate.estimatedDaysRemaining < 14
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    {burnRate.estimatedDaysRemaining === Infinity 
                      ? '∞' 
                      : `${Math.round(burnRate.estimatedDaysRemaining)}d`
                    }
                  </p>
                </div>
                <div className="bg-white dark:bg-white/5 rounded-xl p-3 border border-purple-200 dark:border-purple-800/30">
                  <p className="text-xs text-gray-600 dark:text-zinc-400 mb-1">Projected Status</p>
                  <p className={`text-xs font-bold px-2 py-1 rounded-full inline-block ${
                    burnRate.status === 'CRITICAL' 
                      ? 'bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200' 
                      : burnRate.status === 'WARNING'
                      ? 'bg-orange-200 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
                      : 'bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-200'
                  }`}>
                    {burnRate.status}
                  </p>
                </div>
              </div>
              
              {burnRate.projectedOverspend > 0 && (
                <div className="mt-3 p-3 bg-red-100 dark:bg-red-950/50 border border-red-300 dark:border-red-800 rounded-xl">
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">
                    ⚠️ At current spending rate, you may exceed budget by ₹{Math.round(burnRate.projectedOverspend).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Spending Trends Charts */}
      {expenses.length > 0 && budget && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Breakdown Chart */}
          <div className="bg-white dark:bg-white/[0.03] rounded-2xl p-6 border border-gray-200 dark:border-white/5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500 rounded-xl">
                <BarChart3 size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                  Category Spending Breakdown
                </h3>
                <p className="text-xs text-gray-600 dark:text-zinc-400">
                  Budget vs Actual comparison
                </p>
              </div>
            </div>
            
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={
                budget?.categories?.map(cat => {
                  const spent = expenses
                    .filter(e => e.category === cat.name)
                    .reduce((sum, e) => sum + e.amount, 0);
                  return {
                    category: cat.name,
                    allocated: cat.allocatedAmount || 0,
                    spent: spent,
                    emoji: categoryEmojis[cat.name] || '📝'
                  };
                }) || []
              }>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis 
                  dataKey="category" 
                  tick={{ fill: '#666', fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tickFormatter={(value) => {
                    return `${categoryEmojis[value] || '📝'} ${value}`;
                  }}
                />
                <YAxis tick={{ fill: '#666', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid #ddd',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => `₹${value.toLocaleString()}`}
                />
                <Legend />
                <Bar dataKey="allocated" fill="#B9FF66" name="Allocated" radius={[8, 8, 0, 0]} />
                <Bar dataKey="spent" fill="#191A23" name="Spent" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Spending Timeline */}
          <div className="bg-white dark:bg-white/[0.03] rounded-2xl p-6 border border-gray-200 dark:border-white/5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-500 rounded-xl">
                <Activity size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                  Spending Over Time
                </h3>
                <p className="text-xs text-gray-600 dark:text-zinc-400">
                  Cumulative expense trend
                </p>
              </div>
            </div>
            
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={(() => {
                const sortedExpenses = [...expenses].sort((a, b) => 
                  new Date(a.createdAt) - new Date(b.createdAt)
                );
                let cumulative = 0;
                return sortedExpenses.map(exp => {
                  cumulative += exp.amount;
                  return {
                    date: new Date(exp.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    amount: cumulative,
                    budget: totalAllocated
                  };
                });
              })()}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 11 }} />
                <YAxis tick={{ fill: '#666', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid #ddd',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => `₹${value.toLocaleString()}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#191A23" 
                  strokeWidth={3}
                  name="Cumulative Spent"
                  dot={{ fill: '#191A23', r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="budget" 
                  stroke="#B9FF66" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Total Budget"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tabs Section */}
      <div className="bg-white dark:bg-white/[0.03] rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none overflow-hidden">
        <div className="border-b border-gray-200 dark:border-white/5">
          <div className="flex gap-8 px-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-4 px-2 border-b-2 font-bold transition-colors ${
                activeTab === "overview"
                  ? "border-[#B9FF66] text-[#191A23] dark:text-white"
                  : "border-transparent text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Overview
              </div>
            </button>
            <button
              onClick={() => setActiveTab("timeline")}
              className={`py-4 px-2 border-b-2 font-bold transition-colors ${
                activeTab === "timeline"
                  ? "border-[#B9FF66] text-[#191A23] dark:text-white"
                  : "border-transparent text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Timeline
              </div>
            </button>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="p-6">
            {/* Budget Breakdown */}
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
              <div>
                {budget.status === "REJECTED" && !isEventStaff && (
                  <div className="mb-5 p-4 rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-950/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-red-700 dark:text-red-300">
                        Budget request was rejected.
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400">
                        Update categories/amounts and submit a new request.
                      </p>
                    </div>
                    <Link
                      to={`/organizer/events/${eventId}/finance/request`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#B9FF66] text-[#191A23] rounded-lg hover:bg-[#A8EE55] transition-colors text-sm font-bold"
                    >
                      <Plus size={15} /> Resubmit Budget Request
                    </Link>
                  </div>
                )}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-[#191A23] dark:text-white text-lg">
                    Budget Breakdown by Category
                  </h3>
                </div>
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
              </div>
            )}
          </div>
        )}

        {/* Timeline Tab */}
        {activeTab === "timeline" && (
          <div className="p-6">
            <h3 className="font-bold text-[#191A23] dark:text-white text-lg mb-4">
              Budget & Expense Timeline
            </h3>
            <p className="text-sm text-gray-600 dark:text-zinc-400 mb-6">
              Track your budget journey from request to spending
            </p>

            <div className="relative">
              {/* Vertical Timeline Line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-white/10"></div>

              <div className="space-y-6">
                {/* Budget History Events */}
                {budget?.history && budget.history.map((item, index) => {
                  const getActionIcon = (action) => {
                    switch (action) {
                      case "CREATED":
                      case "UPDATED":
                        return <FileText className="h-5 w-5" />;
                      case "APPROVED":
                        return <CheckCircle className="h-5 w-5" />;
                      case "REJECTED":
                        return <XCircle className="h-5 w-5" />;
                      default:
                        return <Clock className="h-5 w-5" />;
                    }
                  };

                  const getActionColor = (action) => {
                    switch (action) {
                      case "CREATED":
                      case "UPDATED":
                        return "bg-[#B9FF66]/20 border-[#B9FF66] text-[#191A23]";
                      case "APPROVED":
                        return "bg-green-100 border-green-500 text-green-700 dark:bg-green-500/20 dark:text-green-400";
                      case "REJECTED":
                        return "bg-red-100 border-red-500 text-red-700 dark:bg-red-500/20 dark:text-red-400";
                      default:
                        return "bg-gray-100 border-gray-400 text-gray-700 dark:bg-white/5 dark:text-zinc-400";
                    }
                  };

                  return (
                    <div key={`budget-${index}`} className="relative flex gap-4 items-start">
                      {/* Icon */}
                      <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 bg-white dark:bg-[#191A23] ${getActionColor(item.action)}`}>
                        {getActionIcon(item.action)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/5 rounded-xl p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-bold text-[#191A23] dark:text-white">
                              Budget {item.action}
                            </h4>
                            {item.performedBy && (
                              <p className="text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1 mt-1">
                                <User className="h-3 w-3" />
                                {item.performedBy.name}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 dark:text-zinc-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(item.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        {item.note && (
                          <p className="text-sm text-gray-700 dark:text-zinc-300 mt-2 bg-white dark:bg-white/5 p-2 rounded-lg">
                            {item.note}
                          </p>
                        )}
                        {item.newStatus && (
                          <div className="mt-2">
                            <span className={`text-xs px-2 py-1 rounded-full font-bold ${getStatusBadge(item.newStatus)}`}>
                              Status: {item.newStatus}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Expense Events */}
                {expenses.length > 0 && (
                  <>
                    <div className="relative flex gap-4 items-center">
                      <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 bg-purple-100 dark:bg-purple-500/20 border-purple-500 text-purple-700 dark:text-purple-400">
                        <Receipt className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-[#191A23] dark:text-white">
                          Expenses ({expenses.length})
                        </h4>
                      </div>
                    </div>

                    {expenses.slice(0, 10).map((expense, index) => (
                      <div key={`expense-${index}`} className="relative flex gap-4 items-start ml-8">
                        <div className="relative z-10 flex items-center justify-center w-6 h-6 rounded-full border-2 bg-purple-50 dark:bg-purple-500/10 border-purple-300 text-purple-600 dark:text-purple-400">
                          <IndianRupee className="h-4 w-4" />
                        </div>

                        <div className="flex-1 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/5 rounded-xl p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-bold text-[#191A23] dark:text-white">
                                {categoryEmojis[expense.category]} {expense.category} - ₹{expense.amount.toLocaleString()}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-zinc-400">
                                {expense.description}
                              </p>
                              {expense.incurredBy && (
                                <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1 flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {expense.incurredBy.name}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-xs text-gray-500 dark:text-zinc-500 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(expense.createdAt).toLocaleDateString()}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full font-bold ${getStatusBadge(expense.status)}`}>
                                {expense.status}
                              </span>
                            </div>
                          </div>
                          {expense.type && (
                            <span className="text-xs text-gray-500 dark:text-zinc-500">
                              Type: {expense.type.replace(/_/g, " ")}
                            </span>
                          )}
                          {expense.status === "CHANGES_REQUESTED" &&
                            expense.adminNotes && (
                              <div className="mt-2 text-xs text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/40 p-2 rounded-lg">
                                Admin note: {expense.adminNotes}
                              </div>
                            )}
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* Empty State */}
                {(!budget?.history || budget.history.length === 0) && expenses.length === 0 && (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 text-gray-400 dark:text-zinc-600 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-[#191A23] dark:text-white mb-1">
                      No timeline events yet
                    </h3>
                    <p className="text-gray-600 dark:text-zinc-400">
                      Create a budget request to start tracking
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Budget Breakdown Table - Removed as it's now in Overview tab */}

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
            {expenses.slice(0, 6).map((expense) => {
              const anomalyCheck = checkExpenseAnomaly(expense, expenses);
              return (
                <div
                  key={expense._id}
                  className={`flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/[0.03] hover:bg-[#B9FF66]/10 dark:hover:bg-white/5 transition-colors border ${
                    anomalyCheck.isAnomaly 
                      ? 'border-orange-300 dark:border-orange-800/50 bg-orange-50/50 dark:bg-orange-950/20' 
                      : 'border-transparent hover:border-[#B9FF66]/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {categoryEmojis[expense.category] || "📝"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#191A23] dark:text-white text-sm">
                          {expense.description}
                        </span>
                        {anomalyCheck.isAnomaly && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-500 text-white text-[10px] font-bold rounded-full">
                            <AlertTriangle size={10} />
                            ANOMALY
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">
                        {expense.category} •{" "}
                        {new Date(expense.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        • {expense.incurredBy?.name || "Unknown"}
                      </div>
                      {anomalyCheck.isAnomaly && anomalyCheck.message && (
                        <div className="text-[10px] text-orange-600 dark:text-orange-400 mt-1 font-medium">
                          {anomalyCheck.message}
                        </div>
                      )}
                      {expense.status === "CHANGES_REQUESTED" &&
                        expense.adminNotes && (
                          <div className="text-[11px] text-purple-700 dark:text-purple-300 mt-1 font-medium">
                            Admin note: {expense.adminNotes}
                          </div>
                        )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold text-sm ${anomalyCheck.isAnomaly ? 'text-orange-600 dark:text-orange-400' : 'text-[#191A23] dark:text-white'}`}>
                      ₹{expense.amount?.toLocaleString()}
                    </div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${getStatusBadge(expense.status)}`}
                    >
                      {expense.status}
                    </span>
                  </div>
                </div>
              );
            })}
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
