import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Presentation,
  Clock,
  MapPin,
  Calendar,
  Filter,
  Search,
  ArrowRight,
} from "lucide-react";
import * as speakerApi from "../../services/speakerApi";

const Sessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetchSessions();
  }, [filter]);

  const fetchSessions = async () => {
    try {
      const params = {};
      if (filter !== "all") params.status = filter;
      const response = await speakerApi.getSessions(params);
      if (response.success) {
        setSessions(response.data);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = sessions.filter((s) =>
    search
      ? s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.event?.title?.toLowerCase().includes(search.toLowerCase())
      : true
  );

  const statusColors = {
    draft: "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-zinc-400",
    pending:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400",
    confirmed:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    rejected:
      "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
    ongoing:
      "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
    completed:
      "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
    cancelled:
      "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  };

  const handleDecision = async (e, sessionId, decision) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setDecisionLoading(true);
      if (decision === 'reject') {
        const reason = rejectionReason.trim();
        if (!reason) return;
        await speakerApi.respondToAssignment(sessionId, 'reject', reason);
      } else {
        await speakerApi.respondToAssignment(sessionId, 'confirm');
      }
      setRejectingId(null);
      setRejectionReason('');
      await fetchSessions();
    } catch (error) {
      console.error('Error updating decision:', error);
    } finally {
      setDecisionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          My Sessions
        </h1>
        <p className="text-gray-600 dark:text-zinc-400 mt-1">
          View and manage your assigned sessions
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search sessions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-[#1a1a2e]/80 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "pending", "draft", "confirmed", "rejected", "ongoing", "completed"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === f
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                  : "bg-white/80 dark:bg-[#1a1a2e]/80 text-gray-600 dark:text-zinc-400 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Sessions List */}
      {filteredSessions.length > 0 ? (
        <div className="grid gap-4">
          {filteredSessions.map((session) => (
            <Link
              key={session._id}
              to={`/speaker/sessions/${session._id}`}
              className="bg-white/80 dark:bg-[#1a1a2e]/80 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-white/5 p-5 sm:p-6 hover:shadow-lg transition-all duration-300 group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Presentation size={22} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {session.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-zinc-500 mt-0.5">
                        {session.event?.title}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                        statusColors[session.status] || statusColors.draft
                      }`}
                    >
                      {session.status}
                    </span>
                  </div>

                  {session.status === 'pending' && (
                    <div className="mt-3 flex flex-col gap-2">
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => handleDecision(e, session._id, 'confirm')}
                          disabled={decisionLoading}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setRejectingId(session._id);
                          }}
                          disabled={decisionLoading}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>

                      {rejectingId === session._id && (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Reason for rejection"
                            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-[#1a1a2e]/80 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-red-500/30"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                          />
                          <button
                            onClick={(e) => handleDecision(e, session._id, 'reject')}
                            disabled={decisionLoading || !rejectionReason.trim()}
                            className="px-3 py-2 rounded-xl text-xs font-medium bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                          >
                            Submit
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setRejectingId(null);
                              setRejectionReason('');
                            }}
                            disabled={decisionLoading}
                            className="px-3 py-2 rounded-xl text-xs font-medium bg-white/80 dark:bg-[#1a1a2e]/80 text-gray-600 dark:text-zinc-400 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {session.status === 'rejected' && session.assignment?.rejectionReason && (
                    <p className="mt-3 text-xs text-gray-500 dark:text-zinc-500">
                      Rejection reason: {session.assignment.rejectionReason}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500 dark:text-zinc-500">
                    {session.time?.start && (
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} />
                        {new Date(session.time.start).toLocaleDateString()} at{" "}
                        {new Date(session.time.start).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                    {session.room && (
                      <span className="flex items-center gap-1.5">
                        <MapPin size={14} />
                        {session.room}
                      </span>
                    )}
                    {session.track && (
                      <span className="flex items-center gap-1.5">
                        <Filter size={14} />
                        {session.track}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-400 dark:text-zinc-600">
                    <span>{session.registeredCount || 0} registered</span>
                    <span>{session.checkedInCount || 0} checked in</span>
                    <span>{session.slides?.length || 0} materials</span>
                  </div>
                </div>
                <ArrowRight
                  size={20}
                  className="text-gray-300 dark:text-zinc-700 group-hover:text-emerald-500 transition-colors flex-shrink-0 mt-1"
                />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white/80 dark:bg-[#1a1a2e]/80 rounded-2xl border border-gray-100 dark:border-white/5 p-12 text-center">
          <Calendar
            size={48}
            className="mx-auto text-gray-300 dark:text-zinc-700 mb-4"
          />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Sessions Found
          </h3>
          <p className="text-gray-500 dark:text-zinc-500 text-sm">
            {filter !== "all"
              ? `No ${filter} sessions. Try a different filter.`
              : "You haven't been assigned any sessions yet."}
          </p>
        </div>
      )}
    </div>
  );
};

export default Sessions;
