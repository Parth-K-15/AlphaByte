import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import financeService from "../../../services/financeService";
import {
  FileText,
  Calendar,
  User,
  DollarSign,
  Tag,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Download,
  MessageSquare,
} from "lucide-react";

const ExpenseDetail = () => {
  const { expenseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  useEffect(() => {
    fetchExpenseDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenseId]);

  const fetchExpenseDetail = async () => {
    try {
      setLoading(true);
      const data = await financeService.getExpenseDetail(expenseId);
      setExpense(data.data);
      setAdminNotes(data.data.adminNotes || "");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status) => {
    if (!adminNotes && status !== "APPROVED") {
      alert("Please add admin notes explaining your decision");
      return;
    }

    try {
      setActionLoading(true);
      await financeService.updateExpenseStatus(expenseId, {
        status,
        adminNotes,
        adminId: user?.id || user?.userId || user?._id,
      });
      alert(`Expense ${status.toLowerCase()} successfully`);
      fetchExpenseDetail();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "CHANGES_REQUESTED":
        return "bg-purple-100 text-purple-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "REIMBURSED":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryEmoji = (category) => {
    const emojiMap = {
      Food: "🍕",
      Printing: "🖨️",
      Travel: "🚕",
      Marketing: "📣",
      Logistics: "📦",
      Prizes: "🏆",
      Equipment: "🔧",
      Other: "📝",
    };
    return emojiMap[category] || "💰";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading expense details...</p>
        </div>
      </div>
    );
  }

  if (error || !expense) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{error || "Expense not found"}</p>
          <button
            onClick={() => navigate("/admin/finance/budgets")}
            className="mt-4 px-6 py-2 bg-lime-500 text-white rounded-lg hover:bg-lime-600"
          >
            Back to Finance Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/admin/finance/budgets")}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Finance</span>
            </button>
          </div>
          <span
            className={`px-4 py-2 rounded-full font-semibold ${getStatusColor(expense.status)}`}
          >
            {expense.status}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Expense Details Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
                <FileText className="w-6 h-6 text-lime-500" />
                <span>Expense Details</span>
              </h2>

              <div className="space-y-4">
                {/* Event */}
                <div className="flex items-start">
                  <div className="w-32 text-gray-500 font-medium">Event:</div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {expense.event.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(expense.event.eventDate).toLocaleDateString()} •{" "}
                      {expense.event.location}
                    </p>
                  </div>
                </div>

                {/* Category */}
                <div className="flex items-start">
                  <div className="w-32 text-gray-500 font-medium flex items-center space-x-2">
                    <Tag className="w-4 h-4" />
                    <span>Category:</span>
                  </div>
                  <div className="flex-1">
                    <span className="px-3 py-1 bg-gray-100 rounded-lg text-gray-900 font-medium">
                      {getCategoryEmoji(expense.category)} {expense.category}
                    </span>
                  </div>
                </div>

                {/* Amount */}
                <div className="flex items-start">
                  <div className="w-32 text-gray-500 font-medium flex items-center space-x-2">
                    <DollarSign className="w-4 h-4" />
                    <span>Amount:</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-2xl font-bold text-lime-600">
                      ₹{expense.amount.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Type */}
                <div className="flex items-start">
                  <div className="w-32 text-gray-500 font-medium">Type:</div>
                  <div className="flex-1">
                    <span
                      className={`px-3 py-1 rounded-lg font-medium ${
                        expense.type === "PERSONAL_SPEND"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {expense.type === "PERSONAL_SPEND"
                        ? "💳 Personal Spend (Reimbursement Required)"
                        : "💰 Admin Paid"}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div className="flex items-start">
                  <div className="w-32 text-gray-500 font-medium">
                    Description:
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900">{expense.description}</p>
                  </div>
                </div>

                {/* Incurred By */}
                <div className="flex items-start">
                  <div className="w-32 text-gray-500 font-medium flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Incurred By:</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {expense.incurredBy.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {expense.incurredBy.email}
                    </p>
                  </div>
                </div>

                {/* Reimbursement Payout Details */}
                <div className="flex items-start">
                  <div className="w-32 text-gray-500 font-medium">UPI ID:</div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {expense.incurredBy?.upiId || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-32 text-gray-500 font-medium">Payout QR:</div>
                  <div className="flex-1">
                    {expense.incurredBy?.payoutQrUrl ? (
                      <a
                        href={expense.incurredBy.payoutQrUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block"
                      >
                        <img
                          src={expense.incurredBy.payoutQrUrl}
                          alt="Payout QR"
                          className="w-24 h-24 rounded-lg border border-gray-200 object-cover hover:border-blue-400 transition-colors"
                        />
                      </a>
                    ) : (
                      <p className="text-sm text-gray-500">Not uploaded</p>
                    )}
                  </div>
                </div>

                {/* Date */}
                <div className="flex items-start">
                  <div className="w-32 text-gray-500 font-medium flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Submitted:</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900">
                      {new Date(expense.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Approved By */}
                {expense.approvedBy && (
                  <div className="flex items-start">
                    <div className="w-32 text-gray-500 font-medium">
                      Approved By:
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {expense.approvedBy.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {expense.approvedBy.email}
                      </p>
                    </div>
                  </div>
                )}

                {/* Reimbursed Info */}
                {expense.reimbursedBy && expense.reimbursedAt && (
                  <div className="flex items-start">
                    <div className="w-32 text-gray-500 font-medium">
                      Reimbursed:
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {expense.reimbursedBy.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(expense.reimbursedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Admin Notes */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-lime-500" />
                <span>Admin Notes</span>
              </h3>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes for your decision (required for rejection)..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 min-h-[120px]"
                disabled={expense.status !== "PENDING"}
              />
            </div>

            {/* Action Buttons */}
            {expense.status === "PENDING" && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => handleStatusUpdate("APPROVED")}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => handleStatusUpdate("CHANGES_REQUESTED")}
                    disabled={actionLoading || !adminNotes}
                    className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
                  >
                    <AlertCircle className="w-5 h-5" />
                    <span>Request Changes</span>
                  </button>
                  <button
                    onClick={() => handleStatusUpdate("REJECTED")}
                    disabled={actionLoading || !adminNotes}
                    className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                  >
                    <XCircle className="w-5 h-5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            )}

            {/* Reimbursement Action */}
            {expense.status === "APPROVED" &&
              expense.type === "PERSONAL_SPEND" && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="mb-4">
                    <p className="text-gray-700 mb-2">
                      Mark this expense as reimbursed once payment is completed.
                    </p>
                  </div>
                  <button
                    onClick={() => handleStatusUpdate("REIMBURSED")}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Mark as Reimbursed</span>
                  </button>
                </div>
              )}

            {/* Existing Admin Notes Display */}
            {expense.adminNotes && expense.status !== "PENDING" && (
              <div className="bg-gray-50 rounded-xl p-6 border-l-4 border-lime-500">
                <h4 className="font-semibold text-gray-900 mb-2">
                  Admin Decision Notes:
                </h4>
                <p className="text-gray-700">{expense.adminNotes}</p>
              </div>
            )}
          </div>

          {/* Sidebar - Receipt */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
              <h3 className="text-lg font-bold mb-4">Receipt</h3>
              {expense.receiptUrl ? (
                <div>
                  <div
                    className="relative cursor-pointer group"
                    onClick={() => setShowReceiptModal(true)}
                  >
                    <img
                      src={expense.receiptUrl}
                      alt="Receipt"
                      className="w-full rounded-lg border-2 border-gray-200 hover:border-lime-500 transition-colors"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity rounded-lg flex items-center justify-center">
                      <span className="text-white opacity-0 group-hover:opacity-100 font-semibold">
                        Click to enlarge
                      </span>
                    </div>
                  </div>
                  <a
                    href={expense.receiptUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Receipt</span>
                  </a>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No receipt uploaded</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && expense.receiptUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setShowReceiptModal(false)}
        >
          <div className="max-w-5xl max-h-[90vh] overflow-auto">
            <img
              src={expense.receiptUrl}
              alt="Receipt Full View"
              className="w-full h-auto"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <button
            onClick={() => setShowReceiptModal(false)}
            className="absolute top-4 right-4 text-white text-4xl font-bold hover:text-gray-300"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default ExpenseDetail;
