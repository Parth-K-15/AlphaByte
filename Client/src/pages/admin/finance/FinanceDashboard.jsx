import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import {
  IndianRupee,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Calendar,
  TrendingUp,
  Loader2,
  Eye,
  Check,
} from "lucide-react";
import financeService from "../../../services/financeService";

const FinanceDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("budgets");
  const [loading, setLoading] = useState(true);
  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [amendments, setAmendments] = useState([]);
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [stats, setStats] = useState({
    pendingBudgets: 0,
    approvedBudgets: 0,
    rejectedBudgets: 0,
    pendingExpenses: 0,
    pendingAmendments: 0,
    totalAllocated: 0,
    totalSpent: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [budgetsRes, expensesRes, amendmentsRes] = await Promise.all([
        financeService.getAllBudgets(),
        financeService.getAllPendingExpenses(),
        financeService.getPendingAmendments(),
      ]);

      setBudgets(budgetsRes.data || []);
      setExpenses(expensesRes.data || []);
      setAmendments(amendmentsRes.data || []);

      // Calculate stats
      const pendingBudgets = budgetsRes.data.filter(
        (b) => b.status === "REQUESTED"
      ).length;
      const approvedBudgets = budgetsRes.data.filter(
        (b) => b.status === "APPROVED" || b.status === "PARTIALLY_APPROVED"
      ).length;
      const rejectedBudgets = budgetsRes.data.filter(
        (b) => b.status === "REJECTED"
      ).length;
      const totalAllocated = budgetsRes.data.reduce(
        (sum, b) => sum + (b.totalAllocatedAmount || 0),
        0
      );

      setStats({
        pendingBudgets,
        approvedBudgets,
        rejectedBudgets,
        pendingExpenses: expensesRes.data.length,
        pendingAmendments: amendmentsRes.data.length,
        totalAllocated,
        totalSpent: 0, // Would need to calculate from all expenses
      });
    } catch (err) {
      console.error("Error fetching finance data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (status) => {
    if (selectedExpenses.length === 0) {
      alert("Please select at least one expense");
      return;
    }

    const confirmMessage =
      status === "APPROVED"
        ? `Approve ${selectedExpenses.length} expense(s)?`
        : `Reject ${selectedExpenses.length} expense(s)?`;

    if (!confirm(confirmMessage)) return;

    try {
      setBulkActionLoading(true);
      await financeService.bulkUpdateExpenses({
        expenseIds: selectedExpenses,
        status,
        adminNotes: `Bulk ${status.toLowerCase()} by admin`,
        adminId: user.userId,
      });
      alert(`Successfully ${status.toLowerCase()} ${selectedExpenses.length} expense(s)`);
      setSelectedExpenses([]);
      fetchData(); // Refresh data
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const toggleExpenseSelection = (expenseId) => {
    setSelectedExpenses((prev) =>
      prev.includes(expenseId)
        ? prev.filter((id) => id !== expenseId)
        : [...prev, expenseId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedExpenses.length === expenses.length) {
      setSelectedExpenses([]);
    } else {
      setSelectedExpenses(expenses.map((e) => e._id));
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      REQUESTED: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-green-100 text-green-800",
      PARTIALLY_APPROVED: "bg-blue-100 text-blue-800",
      REJECTED: "bg-red-100 text-red-800",
      PENDING: "bg-yellow-100 text-yellow-800",
      REIMBURSED: "bg-green-100 text-green-800",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          styles[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status.replace(/_/g, " ")}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Finance Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Manage budgets and expenses across all events
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/admin/finance/reports")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            View Reports
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Budgets</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">
                {stats.pendingBudgets}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved Budgets</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {stats.approvedBudgets}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Expenses</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                {stats.pendingExpenses}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Allocated</p>
              <div className="flex items-center gap-1 mt-2">
                <IndianRupee className="h-6 w-6 text-blue-600" />
                <p className="text-2xl font-bold text-blue-600">
                  {stats.totalAllocated.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex gap-8 px-6">
            <button
              onClick={() => setActiveTab("budgets")}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === "budgets"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Budget Requests
                {stats.pendingBudgets > 0 && (
                  <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                    {stats.pendingBudgets}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab("expenses")}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === "expenses"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <IndianRupee className="h-5 w-5" />
                Expense Approvals
                {stats.pendingExpenses > 0 && (
                  <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded-full">
                    {stats.pendingExpenses}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab("amendments")}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === "amendments"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Budget Amendments
                {stats.pendingAmendments > 0 && (
                  <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
                    {stats.pendingAmendments}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Budgets Tab */}
        {activeTab === "budgets" && (
          <div className="p-6">
            {budgets.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No budget requests found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {budgets.map((budget) => (
                  <div
                    key={budget._id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {budget.event?.title || "Unknown Event"}
                          </h3>
                          {getStatusBadge(budget.status)}
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mt-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            {budget.event?.eventDate
                              ? new Date(
                                  budget.event.eventDate
                                ).toLocaleDateString()
                              : "No date"}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            Requested{" "}
                            {new Date(budget.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="flex items-center gap-6 mt-4">
                          <div>
                            <p className="text-xs text-gray-600">Requested</p>
                            <div className="flex items-center gap-1 text-gray-900 font-semibold">
                              <IndianRupee className="h-4 w-4" />
                              {(
                                budget.totalRequestAmount || 0
                              ).toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Allocated</p>
                            <div className="flex items-center gap-1 text-blue-600 font-semibold">
                              <IndianRupee className="h-4 w-4" />
                              {(
                                budget.totalAllocatedAmount || 0
                              ).toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Categories</p>
                            <p className="font-semibold text-gray-900">
                              {budget.categories?.length || 0}
                            </p>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          navigate(
                            `/admin/finance/budgets/${budget.event._id}`
                          )
                        }
                        className="ml-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Expenses Tab */}
        {activeTab === "expenses" && (
          <div className="p-6">
            {expenses.length === 0 ? (
              <div className="text-center py-12">
                <IndianRupee className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No pending expenses found</p>
              </div>
            ) : (
              <div>
                {/* Bulk Actions Bar */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedExpenses.length === expenses.length}
                        onChange={toggleSelectAll}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Select All ({selectedExpenses.length} selected)
                      </span>
                    </label>
                  </div>

                  {selectedExpenses.length > 0 && (
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleBulkAction("APPROVED")}
                        disabled={bulkActionLoading}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Approve Selected</span>
                      </button>
                      <button
                        onClick={() => handleBulkAction("REJECTED")}
                        disabled={bulkActionLoading}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject Selected</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Expenses List */}
                <div className="space-y-4">
                  {expenses.map((expense) => (
                    <div
                      key={expense._id}
                      className={`bg-gray-50 rounded-lg p-4 border-2 transition-colors ${
                        selectedExpenses.includes(expense._id)
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Checkbox */}
                        <div className="pt-1">
                          <input
                            type="checkbox"
                            checked={selectedExpenses.includes(expense._id)}
                            onChange={() => toggleExpenseSelection(expense._id)}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {expense.event?.title || "Unknown Event"}
                            </h3>
                            {getStatusBadge(expense.status)}
                            {expense.type === "PERSONAL_SPEND" && (
                              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded">
                                Reimbursement
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-gray-600 mb-3">
                            {expense.description}
                          </p>

                          <div className="grid md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-xs text-gray-600">Category</p>
                              <p className="font-medium text-gray-900">
                                {expense.category}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Amount</p>
                              <div className="flex items-center gap-1 text-gray-900 font-semibold">
                                <IndianRupee className="h-4 w-4" />
                                {expense.amount.toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">
                                Incurred By
                              </p>
                              <p className="font-medium text-gray-900">
                                {expense.incurredBy?.name || "Unknown"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Date</p>
                              <p className="font-medium text-gray-900">
                                {new Date(
                                  expense.createdAt
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* View Button */}
                        <button
                          onClick={() =>
                            navigate(`/admin/finance/expenses/${expense._id}`)
                          }
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                        >
                          <Eye className="h-4 w-4" />
                          <span>View</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Amendments Tab */}
            {activeTab === "amendments" && (
              <div className="p-6">
                {amendments.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No pending amendments</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {amendments.map((item) => (
                      <div
                        key={item.amendment._id}
                        className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-start gap-4">
                              <div className="p-3 bg-purple-100 rounded-lg">
                                <AlertCircle className="h-6 w-6 text-purple-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {item.event?.title || "Unknown Event"}
                                  </h3>
                                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                                    Amendment Pending
                                  </span>
                                </div>
                                <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {new Date(item.event?.eventDate).toLocaleDateString()}
                                  </div>
                                  <div>
                                    Requested by: {item.amendment.requestedBy?.name || "Unknown"}
                                  </div>
                                  <div>
                                    {new Date(item.amendment.requestedAt).toLocaleDateString()}
                                  </div>
                                </div>
                                {item.amendment.reason && (
                                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                                    <strong>Reason:</strong> {item.amendment.reason}
                                  </p>
                                )}
                                <div className="mt-3 flex items-center gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-600">Categories:</span>{" "}
                                    <span className="font-medium text-gray-900">
                                      {item.amendment.requestedCategories?.length || 0}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Total Requested:</span>{" "}
                                    <span className="font-bold text-green-600">
                                      ₹{item.amendment.requestedCategories?.reduce((sum, cat) => sum + cat.requestedAmount, 0).toLocaleString() || 0}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Review Button */}
                          <button
                            onClick={() =>
                              navigate(`/admin/finance/amendments/${item.budgetId}/${item.amendment._id}`)
                            }
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                          >
                            <Eye className="h-4 w-4" />
                            <span>Review</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FinanceDashboard;
