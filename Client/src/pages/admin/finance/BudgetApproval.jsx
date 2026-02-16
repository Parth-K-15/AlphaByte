import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  ArrowLeft,
  IndianRupee,
  Calendar,
  User,
  FileText,
  Clock,
  Loader2,
  History,
  Receipt,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import financeService from "../../../services/financeService";

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

const BudgetApproval = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("details");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [budget, setBudget] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchBudget = useCallback(async () => {
    try {
      setLoading(true);
      const [budgetResponse, expensesResponse] = await Promise.all([
        financeService.getBudget(eventId),
        financeService.getExpenses(eventId).catch(() => ({ data: [] })),
      ]);
      
      if (budgetResponse.data) {
        setBudget(budgetResponse.data);
        // Initialize allocations with requested amounts
        setAllocations(
          budgetResponse.data.categories.map((cat) => ({
            name: cat.name,
            requestedAmount: cat.requestedAmount,
            allocatedAmount: cat.allocatedAmount || cat.requestedAmount,
          }))
        );
      }
      
      setExpenses(expensesResponse.data || []);
    } catch (err) {
      setError(err.message || "Failed to fetch budget");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchBudget();
  }, [fetchBudget]);

  const handleAllocationChange = (index, value) => {
    const newAllocations = [...allocations];
    newAllocations[index].allocatedAmount = Number(value) || 0;
    setAllocations(newAllocations);
  };

  const handleApprove = async (status) => {
    if (!approvalNotes.trim()) {
      setError("Please provide approval notes");
      return;
    }

    // Check if all allocations are filled
    const invalidAllocations = allocations.some(
      (alloc) => alloc.allocatedAmount === null || alloc.allocatedAmount < 0
    );
    if (invalidAllocations) {
      setError("Please provide valid allocation amounts for all categories");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      await financeService.approveBudget(eventId, {
        status,
        allocations: allocations.map((a) => ({
          name: a.name,
          allocatedAmount: a.allocatedAmount,
        })),
        approvalNotes,
        adminId: user?._id || user?.id,
      });

      setSuccess(`Budget ${status.toLowerCase()} successfully!`);
      setTimeout(() => navigate("/admin/finance/budgets"), 2000);
    } catch (err) {
      setError(err.message || "Failed to process budget");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!approvalNotes.trim()) {
      setError("Please provide reason for rejection");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      await financeService.approveBudget(eventId, {
        status: "REJECTED",
        approvalNotes,
        adminId: user?._id || user?.id,
      });

      setSuccess("Budget rejected successfully");
      setTimeout(() => navigate("/admin/finance/budgets"), 2000);
    } catch (err) {
      setError(err.message || "Failed to reject budget");
    } finally {
      setSubmitting(false);
    }
  };

  const totalRequested = allocations.reduce(
    (sum, alloc) => sum + alloc.requestedAmount,
    0
  );
  const totalAllocated = allocations.reduce(
    (sum, alloc) => sum + alloc.allocatedAmount,
    0
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">No budget found for this event</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin/finance/budgets")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Budget Approval
            </h1>
            <p className="text-gray-600 mt-1">
              Review and approve budget request
            </p>
          </div>
        </div>
        <div
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            budget.status === "REQUESTED"
              ? "bg-yellow-100 text-yellow-800"
              : budget.status === "APPROVED"
              ? "bg-green-100 text-green-800"
              : budget.status === "REJECTED"
              ? "bg-red-100 text-red-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {budget.status}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Event Info */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Event Information
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {budget.event && (
            <>
              <div className="flex items-center gap-3 text-gray-700">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="font-medium">{budget.event.title}</span>
              </div>
              {budget.event.eventDate && (
                <div className="flex items-center gap-3 text-gray-700">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span>
                    {new Date(budget.event.eventDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </>
          )}
          <div className="flex items-center gap-3 text-gray-700">
            <User className="h-5 w-5 text-blue-600" />
            <span>
              Requested by: {budget.createdBy?.name || "Unknown"}
            </span>
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <Clock className="h-5 w-5 text-blue-600" />
            <span>
              {new Date(budget.createdAt).toLocaleDateString()} at{" "}
              {new Date(budget.createdAt).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex gap-8 px-6">
            <button
              onClick={() => setActiveTab("details")}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === "details"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Budget Details
              </div>
            </button>
            <button
              onClick={() => setActiveTab("timeline")}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === "timeline"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Timeline
              </div>
            </button>
          </div>
        </div>

        {/* Details Tab */}
        {activeTab === "details" && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Budget Categories
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Review and allocate amounts for each category
            </p>

            <div className="space-y-4">
          {allocations.map((alloc, index) => {
            const category = budget.categories[index];
            return (
              <div
                key={index}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {categoryEmojis[alloc.name]}
                    </span>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {alloc.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {category.justification}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Requested Amount
                    </label>
                    <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                      <IndianRupee className="h-5 w-5" />
                      {alloc.requestedAmount.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Allocated Amount *
                    </label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="number"
                        value={alloc.allocatedAmount}
                        onChange={(e) =>
                          handleAllocationChange(index, e.target.value)
                        }
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                        disabled={submitting || budget.status !== "REQUESTED"}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
            </div>

            {/* Summary */}
            <div className="mt-6 p-6 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex justify-between items-center text-lg font-semibold mb-2">
                <span className="text-gray-700">Total Requested:</span>
                <div className="flex items-center gap-1 text-gray-900">
                  <IndianRupee className="h-5 w-5" />
                  {totalRequested.toLocaleString()}
                </div>
              </div>
              <div className="flex justify-between items-center text-lg font-semibold">
                <span className="text-gray-700">Total Allocated:</span>
                <div className="flex items-center gap-1 text-blue-600">
                  <IndianRupee className="h-5 w-5" />
                  {totalAllocated.toLocaleString()}
                </div>
              </div>
              {totalAllocated !== totalRequested && (
                <p className="text-sm text-amber-600 mt-2">
                  ⚠️ Allocated amount differs from requested amount
                </p>
              )}
            </div>
          </div>
        )}

        {/* Timeline Tab */}
        {activeTab === "timeline" && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Budget Lifecycle Timeline
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Complete history from request to reimbursement
            </p>

            <div className="relative">
              {/* Vertical Timeline Line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

              <div className="space-y-6">
                {/* Budget History Events */}
                {budget.history && budget.history.map((item, index) => {
                  const getActionIcon = (action) => {
                    switch (action) {
                      case "CREATED":
                      case "UPDATED":
                        return <FileText className="h-5 w-5 text-blue-600" />;
                      case "APPROVED":
                        return <CheckCircle className="h-5 w-5 text-green-600" />;
                      case "REJECTED":
                        return <XCircle className="h-5 w-5 text-red-600" />;
                      default:
                        return <Clock className="h-5 w-5 text-gray-600" />;
                    }
                  };

                  const getActionColor = (action) => {
                    switch (action) {
                      case "CREATED":
                      case "UPDATED":
                        return "bg-blue-100 border-blue-300";
                      case "APPROVED":
                        return "bg-green-100 border-green-300";
                      case "REJECTED":
                        return "bg-red-100 border-red-300";
                      default:
                        return "bg-gray-100 border-gray-300";
                    }
                  };

                  return (
                    <div key={`budget-${index}`} className="relative flex gap-4 items-start">
                      {/* Icon */}
                      <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 bg-white ${getActionColor(item.action)}`}>
                        {getActionIcon(item.action)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              Budget {item.action}
                            </h3>
                            {item.performedBy && (
                              <p className="text-sm text-gray-600">
                                by {item.performedBy.name}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(item.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {item.note && (
                          <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-2 rounded">
                            {item.note}
                          </p>
                        )}
                        {item.newStatus && (
                          <div className="mt-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              item.newStatus === "APPROVED" 
                                ? "bg-green-100 text-green-800"
                                : item.newStatus === "REJECTED"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}>
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
                      <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 bg-purple-100 border-purple-300">
                        <Receipt className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          Expenses ({expenses.length})
                        </h3>
                      </div>
                    </div>

                    {expenses.map((expense, index) => (
                      <div key={`expense-${index}`} className="relative flex gap-4 items-start ml-8">
                        <div className="relative z-10 flex items-center justify-center w-6 h-6 rounded-full border-2 bg-purple-50 border-purple-200">
                          <IndianRupee className="h-4 w-4 text-purple-600" />
                        </div>

                        <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {expense.category} - ₹{expense.amount.toLocaleString()}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {expense.description}
                              </p>
                              {expense.incurredBy && (
                                <p className="text-xs text-gray-500 mt-1">
                                  by {expense.incurredBy.name}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-xs text-gray-500">
                                {new Date(expense.createdAt).toLocaleDateString()}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                expense.status === "APPROVED"
                                  ? "bg-green-100 text-green-800"
                                  : expense.status === "REIMBURSED"
                                  ? "bg-blue-100 text-blue-800"
                                  : expense.status === "REJECTED"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}>
                                {expense.status}
                              </span>
                            </div>
                          </div>
                          {expense.type && (
                            <span className="text-xs text-gray-500">
                              Type: {expense.type.replace(/_/g, " ")}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* Empty State */}
                {(!budget.history || budget.history.length === 0) && expenses.length === 0 && (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No timeline events yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Approval Notes */}
      {budget.status === "REQUESTED" && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Approval Notes *
          </label>
          <textarea
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Provide notes about your decision..."
            disabled={submitting}
          />
        </div>
      )}

      {/* Action Buttons */}
      {budget.status === "REQUESTED" && (
        <div className="flex justify-end gap-4">
          <button
            onClick={handleReject}
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
            Reject
          </button>
          <button
            onClick={() =>
              handleApprove(
                totalAllocated === totalRequested
                  ? "APPROVED"
                  : "PARTIALLY_APPROVED"
              )
            }
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <CheckCircle className="h-5 w-5" />
            )}
            {totalAllocated === totalRequested
              ? "Approve Fully"
              : "Approve Partially"}
          </button>
        </div>
      )}
    </div>
  );
};

export default BudgetApproval;
