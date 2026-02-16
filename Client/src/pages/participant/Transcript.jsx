import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  RefreshCw,
  Clock,
  MapPin,
  Users,
  Mic,
  Shield,
  HandHelping,
  Calendar,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Download,
} from "lucide-react";

const API_BASE = "http://localhost:5000/api";

const ROLE_CONFIG = {
  participant: {
    label: "Participant",
    icon: Users,
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    dot: "bg-blue-500",
  },
  volunteer: {
    label: "Volunteer",
    icon: HandHelping,
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    dot: "bg-emerald-500",
  },
  speaker: {
    label: "Speaker",
    icon: Mic,
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    dot: "bg-purple-500",
  },
  organizer: {
    label: "Organizer",
    icon: Shield,
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    dot: "bg-amber-500",
  },
};

const Transcript = () => {
  const [transcript, setTranscript] = useState([]);
  const [summary, setSummary] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [expandedEvents, setExpandedEvents] = useState({});
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    syncAndFetch();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const syncAndFetch = async () => {
    try {
      setLoading(true);
      setError("");

      // Sync first
      await fetch(`${API_BASE}/transcript/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });

      // Then fetch
      await fetchTranscript();
    } catch (err) {
      console.error("Transcript sync/fetch error:", err);
      setError("Failed to load transcript. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTranscript = async () => {
    const response = await fetch(`${API_BASE}/transcript`, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    });
    const data = await response.json();

    if (data.success) {
      setTranscript(data.data.transcript || []);
      setSummary(data.data.summary || null);
      setStudent(data.data.student || null);

      // Auto-expand all events
      const expanded = {};
      (data.data.transcript || []).forEach((item, idx) => {
        expanded[idx] = true;
      });
      setExpandedEvents(expanded);
    } else {
      setError(data.message || "Failed to load transcript");
    }
  };

  const handleResync = async () => {
    try {
      setSyncing(true);
      await syncAndFetch();
    } finally {
      setSyncing(false);
    }
  };

  const toggleEvent = (index) => {
    setExpandedEvents((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (minutes) => {
    if (!minutes || minutes <= 0) return "N/A";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;
    return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
  };

  const filteredTranscript =
    roleFilter === "all"
      ? transcript
      : transcript
          .map((item) => ({
            ...item,
            roles: item.roles.filter((r) => r.role === roleFilter),
          }))
          .filter((item) => item.roles.length > 0);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-dark rounded-3xl p-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Role-Based Transcript
            </h1>
            <p className="text-dark-200">
              Your complete event participation record across all roles
            </p>
            {student && (
              <p className="text-dark-200 text-sm mt-1">
                {student.name} &bull; {student.email}
              </p>
            )}
          </div>
          <button
            onClick={handleResync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-lime/10 border border-lime/20 rounded-xl text-lime hover:bg-lime/20 transition-all disabled:opacity-50"
          >
            <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
            <span className="text-sm font-bold hidden sm:inline">
              {syncing ? "Syncing..." : "Sync"}
            </span>
          </button>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl">
              <p className="text-dark-200 text-xs mb-1">Total Events</p>
              <p className="text-lime font-bold text-2xl">
                {summary.totalEvents}
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl">
              <p className="text-dark-200 text-xs mb-1">Total Roles</p>
              <p className="text-lime font-bold text-2xl">
                {summary.totalRoles}
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl">
              <p className="text-dark-200 text-xs mb-1">Total Duration</p>
              <p className="text-lime font-bold text-2xl">
                {formatDuration(summary.totalMinutes)}
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl">
              <p className="text-dark-200 text-xs mb-1">Roles Breakdown</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {Object.entries(summary.roleCounts || {}).map(
                  ([role, count]) => {
                    const config = ROLE_CONFIG[role] || ROLE_CONFIG.participant;
                    return (
                      <span
                        key={role}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${config.color}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${config.dot}`}
                        ></span>
                        {count}
                      </span>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Role Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { key: "all", label: "All Roles" },
          { key: "participant", label: "Participant" },
          { key: "volunteer", label: "Volunteer" },
          { key: "speaker", label: "Speaker" },
          { key: "organizer", label: "Organizer" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setRoleFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              roleFilter === f.key
                ? "bg-dark text-lime"
                : "bg-white dark:bg-white/5 text-dark-300 dark:text-zinc-400 border border-light-400 dark:border-white/10 hover:bg-light-300 dark:hover:bg-white/10"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl p-4 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Transcript List */}
      {filteredTranscript.length === 0 ? (
        <div className="bg-white dark:bg-white/[0.03] rounded-3xl shadow-card dark:shadow-none p-12 text-center border border-light-400/50 dark:border-white/5">
          <div className="w-20 h-20 bg-dark rounded-3xl flex items-center justify-center mx-auto mb-4">
            <FileText size={32} className="text-lime" />
          </div>
          <h3 className="text-xl font-bold text-dark dark:text-white mb-2">
            No Transcript Records
          </h3>
          <p className="text-dark-300 dark:text-zinc-400 mb-6 text-sm">
            Your transcript will populate as you participate in events, speak at
            sessions, or volunteer.
          </p>
          <Link
            to="/participant"
            className="inline-flex items-center gap-2 px-6 py-3 bg-lime text-dark rounded-2xl font-bold hover:shadow-lime transition-all"
          >
            Explore Events <ArrowUpRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTranscript.map((item, index) => {
            const event = item.event;
            const roles = item.roles || [];
            const isExpanded = expandedEvents[index];

            return (
              <div
                key={event?._id || index}
                className="bg-white dark:bg-white/[0.03] rounded-3xl shadow-card dark:shadow-none border border-light-400/50 dark:border-white/5 overflow-hidden transition-all"
              >
                {/* Event Header */}
                <button
                  onClick={() => toggleEvent(index)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-light-200 dark:hover:bg-white/5 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-lg text-dark dark:text-white truncate">
                        {event?.title || "Event"}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                          event?.status === "completed"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : event?.status === "active" || event?.status === "ongoing"
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                              : "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-zinc-500 border-gray-200 dark:border-white/10"
                        }`}
                      >
                        {event?.status || "unknown"}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-dark-300 dark:text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(event?.startDate)}
                        {event?.endDate && ` — ${formatDate(event?.endDate)}`}
                      </span>
                      {event?.venue && (
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {event.venue}
                        </span>
                      )}
                    </div>
                    {/* Role badges */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {roles.map((role, rIdx) => {
                        const config =
                          ROLE_CONFIG[role.role] || ROLE_CONFIG.participant;
                        const Icon = config.icon;
                        return (
                          <span
                            key={rIdx}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${config.color}`}
                          >
                            <Icon size={12} />
                            {config.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="ml-3 text-dark-300 dark:text-zinc-400">
                    {isExpanded ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-light-400/50 dark:border-white/5 px-5 pb-5">
                    <div className="space-y-3 mt-4">
                      {roles.map((role, rIdx) => {
                        const config =
                          ROLE_CONFIG[role.role] || ROLE_CONFIG.participant;
                        const Icon = config.icon;
                        return (
                          <div
                            key={rIdx}
                            className="bg-light-200 dark:bg-white/[0.02] rounded-2xl p-4 border border-light-400/40 dark:border-white/5"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${config.color} border`}
                                >
                                  <Icon size={16} />
                                </div>
                                <div>
                                  <span className="font-bold text-dark dark:text-white text-sm">
                                    {config.label}
                                  </span>
                                  <span
                                    className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                                      role.status === "completed"
                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                        : role.status === "cancelled"
                                          ? "bg-red-500/10 text-red-500"
                                          : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                    }`}
                                  >
                                    {role.status}
                                  </span>
                                </div>
                              </div>
                              {role.durationMinutes > 0 && (
                                <span className="flex items-center gap-1 text-sm text-dark-300 dark:text-zinc-400 bg-white dark:bg-white/5 px-3 py-1 rounded-xl border border-light-400/40 dark:border-white/10">
                                  <Clock size={14} />
                                  {formatDuration(role.durationMinutes)}
                                </span>
                              )}
                            </div>

                            {/* Time Range */}
                            {(role.startTime || role.endTime) && (
                              <div className="text-xs text-dark-300 dark:text-zinc-500 mb-2">
                                {formatDateTime(role.startTime)}
                                {role.endTime &&
                                  ` — ${formatDateTime(role.endTime)}`}
                              </div>
                            )}

                            {/* Details */}
                            <div className="space-y-1">
                              {role.details?.topic && (
                                <p className="text-sm text-dark dark:text-zinc-300">
                                  <span className="font-semibold">Topic:</span>{" "}
                                  {role.details.topic}
                                </p>
                              )}
                              {role.details?.volunteerArea && (
                                <p className="text-sm text-dark dark:text-zinc-300">
                                  <span className="font-semibold">Area:</span>{" "}
                                  {role.details.volunteerArea}
                                </p>
                              )}
                              {role.details?.organizerRole && (
                                <p className="text-sm text-dark dark:text-zinc-300">
                                  <span className="font-semibold">
                                    Position:
                                  </span>{" "}
                                  {role.details.organizerRole === "TEAM_LEAD"
                                    ? "Team Lead"
                                    : "Event Staff"}
                                </p>
                              )}
                              {role.details?.sessionId?.title && (
                                <p className="text-sm text-dark dark:text-zinc-300">
                                  <span className="font-semibold">
                                    Session:
                                  </span>{" "}
                                  {role.details.sessionId.title}
                                </p>
                              )}
                              {role.details?.notes && (
                                <p className="text-sm text-dark-300 dark:text-zinc-400 italic">
                                  {role.details.notes}
                                </p>
                              )}
                            </div>

                            {/* Source Badge */}
                            <div className="mt-2">
                              <span className="text-xs text-dark-300 dark:text-zinc-500">
                                Source:{" "}
                                <span className="font-medium capitalize">
                                  {role.source}
                                </span>
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Transcript;
