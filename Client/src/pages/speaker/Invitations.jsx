import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import * as speakerApi from "../../services/speakerApi";
import {
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  MapPin,
  Tag,
  User,
  Loader2,
  Sparkles,
  Filter,
  MessageSquare,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const Invitations = () => {
  const { theme } = useTheme();
  const dark = theme === "dark";

  const [requests, setRequests] = useState([]);
  const [counts, setCounts] = useState({ total: 0, pending: 0, accepted: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [respondingId, setRespondingId] = useState(null);
  const [rejectModal, setRejectModal] = useState(null); // { requestId }
  const [rejectReason, setRejectReason] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter !== "all") params.status = filter;
      const data = await speakerApi.getRequests(params);
      if (data.success) {
        setRequests(data.data || []);
        setCounts(data.counts || { total: 0, pending: 0, accepted: 0, rejected: 0 });
      }
    } catch (err) {
      console.error("Failed to load requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleAccept = async (requestId) => {
    setRespondingId(requestId);
    try {
      const data = await speakerApi.respondToRequest(requestId, "accepted");
      if (data.success) {
        await loadRequests();
      }
    } catch (err) {
      console.error("Failed to accept request:", err);
    } finally {
      setRespondingId(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectModal) return;
    setRespondingId(rejectModal.requestId);
    try {
      const data = await speakerApi.respondToRequest(
        rejectModal.requestId,
        "rejected",
        rejectReason || undefined
      );
      if (data.success) {
        setRejectModal(null);
        setRejectReason("");
        await loadRequests();
      }
    } catch (err) {
      console.error("Failed to reject request:", err);
    } finally {
      setRespondingId(null);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "pending":
        return dark
          ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
          : "bg-amber-50 text-amber-700 border-amber-200";
      case "accepted":
        return dark
          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
          : "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "rejected":
        return dark
          ? "bg-red-500/10 text-red-400 border-red-500/30"
          : "bg-red-50 text-red-700 border-red-200";
      default:
        return dark ? "bg-zinc-800 text-zinc-400" : "bg-gray-100 text-gray-600";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock size={14} />;
      case "accepted":
        return <CheckCircle size={14} />;
      case "rejected":
        return <XCircle size={14} />;
      default:
        return <Mail size={14} />;
    }
  };

  const filterTabs = [
    { key: "all", label: "All", count: counts.total },
    { key: "pending", label: "Pending", count: counts.pending },
    { key: "accepted", label: "Accepted", count: counts.accepted },
    { key: "rejected", label: "Rejected", count: counts.rejected },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1
          className={`text-2xl font-bold flex items-center gap-2 ${
            dark ? "text-white" : "text-gray-900"
          }`}
        >
          <Mail size={24} className="text-blue-500" />
          Invitations
        </h1>
        <p className={dark ? "text-zinc-400 mt-1" : "text-gray-500 mt-1"}>
          View and respond to event speaking invitations from organizers
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: counts.total, icon: Mail, color: "blue" },
          { label: "Pending", value: counts.pending, icon: Clock, color: "amber" },
          { label: "Accepted", value: counts.accepted, icon: CheckCircle, color: "emerald" },
          { label: "Rejected", value: counts.rejected, icon: XCircle, color: "red" },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`rounded-2xl border p-4 ${
              dark ? "bg-[#1a1a2e] border-zinc-800" : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  dark ? `bg-${stat.color}-500/10` : `bg-${stat.color}-50`
                }`}
              >
                <stat.icon
                  size={20}
                  className={dark ? `text-${stat.color}-400` : `text-${stat.color}-600`}
                />
              </div>
              <div>
                <p className={`text-2xl font-bold ${dark ? "text-white" : "text-gray-900"}`}>
                  {stat.value}
                </p>
                <p className={`text-xs ${dark ? "text-zinc-400" : "text-gray-500"}`}>
                  {stat.label}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div
        className={`flex gap-2 p-1 rounded-xl ${
          dark ? "bg-[#1a1a2e]" : "bg-gray-100"
        }`}
      >
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === tab.key
                ? dark
                  ? "bg-blue-500/20 text-blue-400 shadow"
                  : "bg-white text-blue-700 shadow"
                : dark
                ? "text-zinc-400 hover:text-white hover:bg-white/5"
                : "text-gray-500 hover:text-gray-900 hover:bg-white/60"
            }`}
          >
            {tab.label}
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full ${
                filter === tab.key
                  ? dark
                    ? "bg-blue-500/30 text-blue-300"
                    : "bg-blue-100 text-blue-700"
                  : dark
                  ? "bg-zinc-700 text-zinc-400"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Request Cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="animate-spin text-blue-500" size={36} />
          <p className={dark ? "text-zinc-400" : "text-gray-500"}>
            Loading invitations...
          </p>
        </div>
      ) : requests.length === 0 ? (
        <div
          className={`text-center py-20 rounded-2xl border ${
            dark
              ? "bg-[#1a1a2e] border-zinc-800 text-zinc-400"
              : "bg-white border-gray-200 text-gray-500"
          }`}
        >
          <Mail size={48} className="mx-auto mb-4 opacity-40" />
          <p className="text-lg font-medium">
            {filter === "all"
              ? "No invitations yet"
              : `No ${filter} invitations`}
          </p>
          <p className="text-sm mt-1">
            Invitations from event organizers will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const isExpanded = expandedId === req._id;
            return (
              <div
                key={req._id}
                className={`rounded-2xl border transition-all duration-300 ${
                  dark ? "bg-[#1a1a2e] border-zinc-800" : "bg-white border-gray-200"
                } ${
                  req.status === "pending"
                    ? dark
                      ? "border-l-4 border-l-amber-500"
                      : "border-l-4 border-l-amber-400"
                    : ""
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Event Icon */}
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                        dark
                          ? "bg-blue-500/10"
                          : "bg-blue-50"
                      }`}
                    >
                      <Sparkles
                        size={22}
                        className={dark ? "text-blue-400" : "text-blue-600"}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3
                          className={`font-semibold text-base ${
                            dark ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {req.event?.title || "Unknown Event"}
                        </h3>
                        {/* Status Badge */}
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${getStatusStyle(
                            req.status
                          )}`}
                        >
                          {getStatusIcon(req.status)}
                          {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                        </span>
                        {/* Match Score */}
                        {req.matchScore > 0 && (
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                              dark
                                ? "bg-purple-500/10 text-purple-400"
                                : "bg-purple-50 text-purple-700"
                            }`}
                          >
                            <TrendingUp size={11} />
                            {req.matchScore}% match
                          </span>
                        )}
                      </div>

                      {/* Event Details */}
                      <div
                        className={`flex flex-wrap items-center gap-3 mt-2 text-xs ${
                          dark ? "text-zinc-400" : "text-gray-500"
                        }`}
                      >
                        {req.event?.category && (
                          <span className="flex items-center gap-1">
                            <Tag size={12} />
                            {req.event.category}
                          </span>
                        )}
                        {req.event?.type && (
                          <span className="flex items-center gap-1">
                            <Filter size={12} />
                            {req.event.type}
                          </span>
                        )}
                        {req.event?.startDate && (
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(req.event.startDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                            {req.event.endDate && (
                              <>
                                {" – "}
                                {new Date(req.event.endDate).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </>
                            )}
                          </span>
                        )}
                        {(req.event?.location || req.event?.venue) && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} />
                            {req.event.venue || req.event.location}
                          </span>
                        )}
                      </div>

                      {/* Organizer / Invited by */}
                      {req.organizer && (
                        <p
                          className={`text-xs mt-2 ${
                            dark ? "text-zinc-500" : "text-gray-400"
                          }`}
                        >
                          <User
                            size={11}
                            className="inline mr-1"
                          />
                          Invited by{" "}
                          <span className={dark ? "text-zinc-300" : "text-gray-600"}>
                            {req.organizer.name}
                          </span>{" "}
                          • {new Date(req.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons (right side) */}
                    <div className="flex-shrink-0 flex flex-col items-end gap-2">
                      {req.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleAccept(req._id)}
                            disabled={respondingId === req._id}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50"
                          >
                            {respondingId === req._id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <CheckCircle size={13} />
                            )}
                            Accept
                          </button>
                          <button
                            onClick={() =>
                              setRejectModal({ requestId: req._id })
                            }
                            disabled={respondingId === req._id}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                              dark
                                ? "bg-zinc-800 text-red-400 hover:bg-zinc-700"
                                : "bg-red-50 text-red-600 hover:bg-red-100"
                            }`}
                          >
                            <XCircle size={13} />
                            Reject
                          </button>
                        </>
                      )}
                      {req.status === "accepted" && req.respondedAt && (
                        <span
                          className={`text-xs ${
                            dark ? "text-zinc-500" : "text-gray-400"
                          }`}
                        >
                          Accepted on{" "}
                          {new Date(req.respondedAt).toLocaleDateString()}
                        </span>
                      )}
                      {req.status === "rejected" && req.respondedAt && (
                        <span
                          className={`text-xs ${
                            dark ? "text-zinc-500" : "text-gray-400"
                          }`}
                        >
                          Rejected on{" "}
                          {new Date(req.respondedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Message preview */}
                  {req.message && (
                    <button
                      onClick={() =>
                        setExpandedId(isExpanded ? null : req._id)
                      }
                      className={`mt-3 text-xs font-medium flex items-center gap-1 transition-colors ${
                        dark
                          ? "text-blue-400 hover:text-blue-300"
                          : "text-blue-600 hover:text-blue-700"
                      }`}
                    >
                      <MessageSquare size={13} />
                      {isExpanded ? (
                        <>
                          Hide Message <ChevronUp size={14} />
                        </>
                      ) : (
                        <>
                          View Message <ChevronDown size={14} />
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Expanded Message */}
                {isExpanded && req.message && (
                  <div
                    className={`px-5 pb-5 border-t ${
                      dark ? "border-zinc-800" : "border-gray-100"
                    }`}
                  >
                    <div
                      className={`mt-4 p-4 rounded-xl text-sm ${
                        dark
                          ? "bg-zinc-800/50 text-zinc-300"
                          : "bg-gray-50 text-gray-700"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{req.message}</p>
                    </div>
                    {/* Event description */}
                    {req.event?.description && (
                      <div className="mt-3">
                        <p
                          className={`text-xs font-semibold mb-1 ${
                            dark ? "text-zinc-400" : "text-gray-500"
                          }`}
                        >
                          Event Description
                        </p>
                        <p
                          className={`text-sm ${
                            dark ? "text-zinc-400" : "text-gray-600"
                          }`}
                        >
                          {req.event.description}
                        </p>
                      </div>
                    )}
                    {/* Tags */}
                    {req.event?.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {req.event.tags.map((tag, i) => (
                          <span
                            key={i}
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              dark
                                ? "bg-zinc-700 text-zinc-300"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Rejection reason */}
                    {req.status === "rejected" && req.rejectionReason && (
                      <div
                        className={`mt-3 p-3 rounded-lg text-sm ${
                          dark
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        <p className="font-medium text-xs mb-1">Your reason:</p>
                        <p>{req.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setRejectModal(null);
              setRejectReason("");
            }}
          />
          <div
            className={`relative z-50 w-full max-w-md mx-4 rounded-2xl border p-6 shadow-2xl ${
              dark ? "bg-[#1a1a2e] border-zinc-700" : "bg-white border-gray-200"
            }`}
          >
            <h3
              className={`text-lg font-bold mb-2 ${
                dark ? "text-white" : "text-gray-900"
              }`}
            >
              Decline Invitation
            </h3>
            <p className={`text-sm mb-4 ${dark ? "text-zinc-400" : "text-gray-500"}`}>
              Are you sure you want to reject this invitation? You can optionally provide a reason.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for declining (optional)"
              rows={3}
              className={`w-full px-4 py-3 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500/30 ${
                dark
                  ? "bg-[#0f0f1a] border-zinc-700 text-white placeholder-zinc-600"
                  : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"
              }`}
            />
            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setRejectModal(null);
                  setRejectReason("");
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dark
                    ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={respondingId}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {respondingId ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <XCircle size={14} />
                )}
                Reject Invitation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invitations;
