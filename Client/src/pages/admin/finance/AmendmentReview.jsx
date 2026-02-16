import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ChevronLeft,
  Check,
  X,
  Clock,
  User,
  Calendar,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { financeService } from "../../../services/financeService";

const AmendmentReview = () => {
  const { eventId, amendmentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [budget, setBudget] = useState(null);
  const [amendment, setAmendment] = useState(null);
  const [event, setEvent] = useState(null);
  const [allocations, setAllocations] = useState({});
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, amendmentId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await financeService.getBudget(eventId);
      
      if (response.success) {
        setBudget(response.data);
        setEvent(response.data.event);
        
        // Find the specific amendment
        const specificAmendment = response.data.amendments?.find(
          (a) => a._id === amendmentId
        );
        
        if (specificAmendment) {
          setAmendment(specificAmendment);
          
          // Initialize allocations with current values
          const initialAllocations = {};
          specificAmendment.requestedCategories.forEach((cat) => {
            initialAllocations[cat.name] = cat.requestedAmount;
          });
          setAllocations(initialAllocations);
        }
      }
    } catch (error) {
      console.error("Error fetching amendment:", error);
      alert("Failed to load amendment details");
    } finally {
      setLoading(false);
    }
  };

  const handleAllocationChange = (categoryName, value) => {
    setAllocations({
      ...allocations,
      [categoryName]: parseFloat(value) || 0,
    });
  };

  const handleApprove = async () => {
    if (!adminNotes.trim()) {
      alert("Please provide admin notes explaining your decision");
      return;
    }

    const totalAllocated = Object.values(allocations).reduce((sum, val) => sum + val, 0);
    
    if (totalAllocated === 0) {
      alert("Please allocate amounts to at least one category");
      return;
    }

    try {
      setSubmitting(true);
      
      const allocationArray = amendment.requestedCategories.map((cat) => ({
        name: cat.name,
        allocatedAmount: allocations[cat.name] || 0,
      }));

      await financeService.reviewAmendment(eventId, amendmentId, {
        status: "APPROVED",
        adminNotes: adminNotes.trim(),
        allocations: allocationArray,
      });

      alert("Amendment approved successfully!");
      navigate("/admin/finance/budgets");
    } catch (error) {
      console.error("Error approving amendment:", error);
      alert(error.message || "Failed to approve amendment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!adminNotes.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    if (!window.confirm("Are you sure you want to reject this amendment request?")) {
      return;
    }

    try {
      setSubmitting(true);
      await financeService.reviewAmendment(eventId, amendmentId, {
        status: "REJECTED",
        adminNotes: adminNotes.trim(),
      });

      alert("Amendment rejected");
      navigate("/admin/finance/budgets");
    } catch (error) {
      console.error("Error rejecting amendment:", error);
      alert(error.message || "Failed to reject amendment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!amendment || !budget) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Amendment not found</p>
        </div>
      </div>
    );
  }

  const totalRequested = amendment.requestedCategories.reduce(
    (sum, cat) => sum + cat.requestedAmount,
    0
  );
  const totalAllocated = Object.values(allocations).reduce((sum, val) => sum + val, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/finance/budgets"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Review Budget Amendment
            </h1>
            <p className="text-gray-600 mt-1">{event?.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReject}
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
            Reject
          </button>
          <button
            onClick={handleApprove}
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-5 h-5" />
            {submitting ? "Processing..." : "Approve"}
          </button>
        </div>
      </div>

      {/* Event Info Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Event Date</p>
              <p className="font-semibold text-gray-900">
                {new Date(event.eventDate).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Requested By</p>
              <p className="font-semibold text-gray-900">
                {amendment.requestedBy?.name || "Unknown"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Requested On</p>
              <p className="font-semibold text-gray-900">
                {new Date(amendment.requestedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Current Budget</p>
              <p className="font-semibold text-gray-900">
                ₹{budget.totalAllocatedAmount?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Amendment Reason */}
      {amendment.reason && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Reason for Amendment
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">{amendment.reason}</p>
            </div>
          </div>
        </div>
      )}

      {/* Categories Comparison */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Category-wise Amendment Details
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Allocation
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requested Amount
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Change
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Approve Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Justification
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {amendment.requestedCategories.map((category, index) => {
                const currentCategory = budget.categories.find(
                  (c) => c.name === category.name
                );
                const currentAmount = currentCategory?.allocatedAmount || 0;
                const change = category.requestedAmount - currentAmount;
                const changePercent =
                  currentAmount > 0
                    ? ((change / currentAmount) * 100).toFixed(1)
                    : 0;

                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {category.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                      ₹{currentAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                      ₹{category.requestedAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <span
                        className={`font-medium ${
                          change > 0
                            ? "text-green-600"
                            : change < 0
                            ? "text-red-600"
                            : "text-gray-600"
                        }`}
                      >
                        {change > 0 ? "+" : ""}₹{change.toLocaleString()}{" "}
                        {currentAmount > 0 && `(${changePercent}%)`}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={allocations[category.name] || 0}
                        onChange={(e) =>
                          handleAllocationChange(category.name, e.target.value)
                        }
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                        min="0"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 max-w-xs">
                        {category.justification}
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-300">
              <tr>
                <td className="px-6 py-4 text-sm font-bold text-gray-900">
                  TOTAL
                </td>
                <td className="px-6 py-4 text-sm text-right font-bold text-gray-900">
                  ₹{budget.totalAllocatedAmount?.toLocaleString() || 0}
                </td>
                <td className="px-6 py-4 text-sm text-right font-bold text-gray-900">
                  ₹{totalRequested.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm text-right">
                  <span
                    className={`font-bold ${
                      totalRequested - budget.totalAllocatedAmount > 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {totalRequested - budget.totalAllocatedAmount > 0 ? "+" : ""}
                    ₹
                    {(
                      totalRequested - (budget.totalAllocatedAmount || 0)
                    ).toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-right font-bold text-blue-600">
                  ₹{totalAllocated.toLocaleString()}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Admin Notes */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Admin Notes <span className="text-red-500">*</span>
        </h3>
        <textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="Provide notes explaining your decision (required)..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows="4"
        ></textarea>
        <p className="text-sm text-gray-600 mt-2">
          These notes will be visible to the organizer
        </p>
      </div>

      {/* Action Buttons (Bottom) */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={handleReject}
          disabled={submitting}
          className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X className="w-5 h-5" />
          Reject Amendment
        </button>
        <button
          onClick={handleApprove}
          disabled={submitting}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Check className="w-5 h-5" />
          {submitting ? "Processing..." : "Approve Amendment"}
        </button>
      </div>
    </div>
  );
};

export default AmendmentReview;
