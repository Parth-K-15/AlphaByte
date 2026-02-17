import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Eye, IndianRupee, QrCode, User } from "lucide-react";
import financeService from "../../../services/financeService";

const Reimbursements = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [groups, setGroups] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await financeService.getPendingReimbursementsByUser();
      const data = res?.data || [];
      setGroups(data);
      if (data.length > 0 && !selectedUserId) {
        setSelectedUserId(data[0].userId);
      }
    } catch (err) {
      setError(err.message || "Failed to load reimbursements");
    } finally {
      setLoading(false);
    }
  };

  const selected = groups.find((g) => g.userId === selectedUserId) || null;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reimbursements</h1>
        <p className="text-gray-600 mt-2">
          Total pending reimbursement by user. Click a user to see all related bills.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          {groups.length === 0 ? (
            <p className="text-sm text-gray-500">No approved reimbursements pending.</p>
          ) : (
            groups.map((group) => (
              <button
                key={group.userId}
                onClick={() => setSelectedUserId(group.userId)}
                className={`w-full text-left rounded-lg border p-4 transition-colors ${
                  selectedUserId === group.userId
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{group.user?.name || "Unknown"}</p>
                    <p className="text-xs text-gray-500">{group.user?.email || "N/A"}</p>
                    <p className="text-xs text-gray-500 mt-1">{group.billCount} bill(s)</p>
                  </div>
                  <p className="font-bold text-blue-700">₹{group.totalAmount.toLocaleString()}</p>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5">
          {!selected ? (
            <p className="text-sm text-gray-500">Select a user to view bill details.</p>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selected.user?.name}</h2>
                  <p className="text-sm text-gray-600">{selected.user?.email}</p>
                  <p className="text-sm text-gray-600 mt-1">UPI: {selected.user?.upiId || "Not provided"}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Total to reimburse</p>
                  <p className="text-2xl font-black text-blue-700">₹{selected.totalAmount.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {selected.user?.payoutQrUrl ? (
                  <a
                    href={selected.user.payoutQrUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-blue-700 hover:text-blue-900 text-sm font-medium"
                  >
                    <QrCode className="w-4 h-4" />
                    View payout QR
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                    <AlertCircle className="w-4 h-4" />
                    QR not uploaded
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {selected.expenses.map((expense) => (
                  <div key={expense._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">{expense.event?.title || "Unknown Event"}</p>
                        <p className="text-sm text-gray-600">{expense.category} • {new Date(expense.createdAt).toLocaleDateString()}</p>
                        <p className="text-sm text-gray-700 mt-1">{expense.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">₹{expense.amount.toLocaleString()}</p>
                        <button
                          onClick={() => navigate(`/admin/finance/expenses/${expense._id}`)}
                          className="mt-2 inline-flex items-center gap-1 text-sm text-blue-700 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                          Open bill
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  After transferring payment via UPI/QR, open each bill and mark it as reimbursed.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reimbursements;
