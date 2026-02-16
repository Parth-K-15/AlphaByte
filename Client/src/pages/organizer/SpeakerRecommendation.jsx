import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import {
  Search,
  Star,
  Mic,
  Calendar,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  TrendingUp,
  Award,
  Clock,
  Shield,
  FileText,
  BookOpen,
  Filter,
  Send,
  CheckCircle,
  XCircle,
  Mail,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const fetchApi = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    ...options,
  };
  if (options.body && typeof options.body === "object") {
    config.body = JSON.stringify(options.body);
  }
  const res = await fetch(`${API_BASE_URL}${endpoint}`, config);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

const SpeakerRecommendation = () => {
  const { theme } = useTheme();
  const dark = theme === "dark";

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [eventInfo, setEventInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [limit, setLimit] = useState(10);
  const [minRating, setMinRating] = useState(0);
  const [requestStatus, setRequestStatus] = useState({}); // { speakerId: 'pending'|'accepted'|'rejected'|'sending' }
  const [requestMessage, setRequestMessage] = useState("");

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setEventsLoading(true);
      const organizerId =
        localStorage.getItem("userId") ||
        localStorage.getItem("organizerId");
      const endpoint = organizerId
        ? `/organizer/events?organizerId=${organizerId}`
        : "/organizer/events";
      const data = await fetchApi(endpoint);
      if (data.success) {
        const eventList = data.data?.events || data.data || [];
        setEvents(eventList);
      }
    } catch (err) {
      console.error("Failed to load events:", err);
    } finally {
      setEventsLoading(false);
    }
  };

  const loadRecommendations = async (eventId) => {
    if (!eventId) return;
    try {
      setLoading(true);
      setRecommendations([]);
      setEventInfo(null);
      const data = await fetchApi(
        `/organizer/speakers/recommend/${eventId}?limit=${limit}&minRating=${minRating}`
      );
      if (data.success) {
        setRecommendations(data.data || []);
        setEventInfo(data.event || null);
      }
    } catch (err) {
      console.error("Failed to load recommendations:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEventChange = (e) => {
    const eventId = e.target.value;
    setSelectedEvent(eventId);
    setExpandedId(null);
    setRequestStatus({});
    setRequestMessage("");
    if (eventId) {
      loadRecommendations(eventId);
      loadExistingRequests(eventId);
    }
  };

  // Load existing request statuses for this event
  const loadExistingRequests = async (eventId) => {
    try {
      const data = await fetchApi(`/organizer/speakers/requests/${eventId}`);
      if (data.success && data.data) {
        const statusMap = {};
        data.data.forEach((req) => {
          statusMap[req.speaker._id] = req.status;
        });
        setRequestStatus(statusMap);
      }
    } catch (err) {
      console.error("Failed to load existing requests:", err);
    }
  };

  // Send request to a single speaker
  const handleSendSingleRequest = async (rec) => {
    if (!selectedEvent || requestStatus[rec.speaker._id]) return;
    setRequestStatus((prev) => ({ ...prev, [rec.speaker._id]: "sending" }));
    try {
      const data = await fetchApi("/organizer/speakers/request", {
        method: "POST",
        body: {
          eventId: selectedEvent,
          speakers: [
            {
              speakerId: rec.speaker._id,
              matchScore: rec.matchScore,
              rank: rec.rank,
            },
          ],
        },
      });

      if (data.success && data.data?.length > 0) {
        setRequestStatus((prev) => ({ ...prev, [rec.speaker._id]: "pending" }));
      } else if (data.errors?.length > 0) {
        setRequestStatus((prev) => ({ ...prev, [rec.speaker._id]: data.errors[0].status || "error" }));
      }
    } catch (err) {
      console.error("Failed to send request:", err);
      setRequestStatus((prev) => {
        const copy = { ...prev };
        delete copy[rec.speaker._id];
        return copy;
      });
    }
  };

  const handleApplyFilters = () => {
    if (selectedEvent) loadRecommendations(selectedEvent);
  };

  const renderStars = (rating) =>
    [...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={13}
        className={
          i < Math.round(rating)
            ? "text-yellow-400 fill-yellow-400"
            : dark
            ? "text-zinc-600"
            : "text-gray-300"
        }
      />
    ));

  const getScoreColor = (score) => {
    if (score >= 70) return "text-emerald-500";
    if (score >= 50) return "text-blue-500";
    if (score >= 30) return "text-amber-500";
    return dark ? "text-zinc-400" : "text-gray-500";
  };

  const getScoreBg = (score) => {
    if (score >= 70)
      return dark ? "bg-emerald-500/10 border-emerald-500/30" : "bg-emerald-50 border-emerald-200";
    if (score >= 50)
      return dark ? "bg-blue-500/10 border-blue-500/30" : "bg-blue-50 border-blue-200";
    if (score >= 30)
      return dark ? "bg-amber-500/10 border-amber-500/30" : "bg-amber-50 border-amber-200";
    return dark ? "bg-zinc-800 border-zinc-700" : "bg-gray-50 border-gray-200";
  };

  const getBarColor = (score, max) => {
    const pct = max > 0 ? (score / max) * 100 : 0;
    if (pct >= 70) return "bg-emerald-500";
    if (pct >= 50) return "bg-blue-500";
    if (pct >= 30) return "bg-amber-500";
    return dark ? "bg-zinc-500" : "bg-gray-400";
  };

  const breakdownLabels = {
    specializationMatch: { label: "Specialization Match", icon: Award },
    pastRecordRelevance: { label: "Past Record Relevance", icon: BookOpen },
    rating: { label: "Ratings & Reviews", icon: Star },
    sessionExperience: { label: "Session Experience", icon: Mic },
    reliability: { label: "Reliability", icon: Shield },
    recency: { label: "Recent Activity", icon: Clock },
    bioKeywordMatch: { label: "Bio Keyword Match", icon: FileText },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1
          className={`text-2xl font-bold flex items-center gap-2 ${
            dark ? "text-white" : "text-gray-900"
          }`}
        >
          <Sparkles size={24} className="text-amber-500" />
          Speaker Recommendations
        </h1>
        <p className={dark ? "text-zinc-400 mt-1" : "text-gray-500 mt-1"}>
          AI-powered speaker matching based on event requirements, expertise, ratings &amp; history
        </p>
      </div>

      {/* Event Selection & Filters */}
      <div
        className={`rounded-2xl border p-6 ${
          dark
            ? "bg-[#1a1a2e] border-zinc-800"
            : "bg-white border-gray-200"
        }`}
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Event Selector */}
          <div className="flex-1">
            <label
              className={`text-sm font-medium mb-1.5 block ${
                dark ? "text-zinc-300" : "text-gray-700"
              }`}
            >
              Select Event
            </label>
            {eventsLoading ? (
              <div className="flex items-center gap-2 py-2">
                <Loader2 size={16} className="animate-spin" />
                <span className={dark ? "text-zinc-400" : "text-gray-500"}>
                  Loading events...
                </span>
              </div>
            ) : (
              <select
                value={selectedEvent}
                onChange={handleEventChange}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm ${
                  dark
                    ? "bg-[#0f0f1a] border-zinc-700 text-white"
                    : "bg-white border-gray-200 text-gray-900"
                } focus:outline-none focus:ring-2 focus:ring-amber-500/30`}
              >
                <option value="">-- Choose an event --</option>
                {events.map((ev) => (
                  <option key={ev._id} value={ev._id}>
                    {ev.title} ({ev.category || "No category"} • {ev.type || "Offline"})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-end gap-3">
            <div>
              <label
                className={`text-sm font-medium mb-1.5 block ${
                  dark ? "text-zinc-300" : "text-gray-700"
                }`}
              >
                Max Results
              </label>
              <select
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value))}
                className={`px-3 py-2.5 rounded-xl border text-sm ${
                  dark
                    ? "bg-[#0f0f1a] border-zinc-700 text-white"
                    : "bg-white border-gray-200 text-gray-900"
                } focus:outline-none focus:ring-2 focus:ring-amber-500/30`}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
              </select>
            </div>
            <div>
              <label
                className={`text-sm font-medium mb-1.5 block ${
                  dark ? "text-zinc-300" : "text-gray-700"
                }`}
              >
                Min Rating
              </label>
              <select
                value={minRating}
                onChange={(e) => setMinRating(parseFloat(e.target.value))}
                className={`px-3 py-2.5 rounded-xl border text-sm ${
                  dark
                    ? "bg-[#0f0f1a] border-zinc-700 text-white"
                    : "bg-white border-gray-200 text-gray-900"
                } focus:outline-none focus:ring-2 focus:ring-amber-500/30`}
              >
                <option value={0}>Any</option>
                <option value={3}>3+ Stars</option>
                <option value={4}>4+ Stars</option>
                <option value={4.5}>4.5+ Stars</option>
              </select>
            </div>
            <button
              onClick={handleApplyFilters}
              disabled={!selectedEvent || loading}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors ${
                !selectedEvent || loading
                  ? dark
                    ? "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-amber-500 text-white hover:bg-amber-600"
              }`}
            >
              <Filter size={14} />
              Apply
            </button>
          </div>
        </div>

        {/* Event info bar */}
        {eventInfo && (
          <div
            className={`mt-4 flex flex-wrap gap-3 text-sm ${
              dark ? "text-zinc-400" : "text-gray-500"
            }`}
          >
            {eventInfo.category && (
              <span
                className={`px-3 py-1 rounded-full ${
                  dark
                    ? "bg-purple-500/10 text-purple-400"
                    : "bg-purple-50 text-purple-700"
                }`}
              >
                {eventInfo.category}
              </span>
            )}
            {eventInfo.type && (
              <span
                className={`px-3 py-1 rounded-full ${
                  dark
                    ? "bg-blue-500/10 text-blue-400"
                    : "bg-blue-50 text-blue-700"
                }`}
              >
                {eventInfo.type}
              </span>
            )}
            {(eventInfo.tags || []).map((tag, i) => (
              <span
                key={i}
                className={`px-3 py-1 rounded-full ${
                  dark
                    ? "bg-zinc-800 text-zinc-400"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2
            className="animate-spin text-amber-500"
            size={36}
          />
          <p className={dark ? "text-zinc-400" : "text-gray-500"}>
            Analyzing speakers and computing matches...
          </p>
        </div>
      ) : !selectedEvent ? (
        <div
          className={`text-center py-20 rounded-2xl border ${
            dark
              ? "bg-[#1a1a2e] border-zinc-800 text-zinc-400"
              : "bg-white border-gray-200 text-gray-500"
          }`}
        >
          <Sparkles size={48} className="mx-auto mb-4 opacity-40" />
          <p className="text-lg font-medium">Select an event to get started</p>
          <p className="text-sm mt-1">
            The recommendation engine will analyze speaker profiles and match them to your event
          </p>
        </div>
      ) : recommendations.length === 0 ? (
        <div
          className={`text-center py-20 rounded-2xl border ${
            dark
              ? "bg-[#1a1a2e] border-zinc-800 text-zinc-400"
              : "bg-white border-gray-200 text-gray-500"
          }`}
        >
          <Search size={48} className="mx-auto mb-4 opacity-40" />
          <p className="text-lg font-medium">No matching speakers found</p>
          <p className="text-sm mt-1">
            Try lowering the minimum rating or adding more tags to your event
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className={`text-sm ${dark ? "text-zinc-400" : "text-gray-500"}`}>
              Found <span className="font-semibold">{recommendations.length}</span> recommended speakers for{" "}
              <span className="font-semibold">{eventInfo?.title}</span>
            </p>
          </div>

          {/* Status Message */}
          {requestMessage && (
            <div
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${
                requestMessage.includes("Failed")
                  ? dark
                    ? "bg-red-500/10 border border-red-500/30 text-red-400"
                    : "bg-red-50 border border-red-200 text-red-700"
                  : dark
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                  : "bg-emerald-50 border border-emerald-200 text-emerald-700"
              }`}
            >
              {requestMessage.includes("Failed") ? <XCircle size={16} /> : <CheckCircle size={16} />}
              {requestMessage}
            </div>
          )}

          {recommendations.map((rec) => {
            const isExpanded = expandedId === rec.speaker._id;
            return (
              <div
                key={rec.speaker._id}
                className={`rounded-2xl border transition-all duration-300 ${
                  dark
                    ? "bg-[#1a1a2e] border-zinc-800"
                    : "bg-white border-gray-200"
                } ${isExpanded ? (dark ? "border-amber-500/40" : "border-amber-300") : ""}`}
              >
                {/* Main Card */}
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Rank Badge */}
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        rec.rank <= 3
                          ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white"
                          : dark
                          ? "bg-zinc-800 text-zinc-300"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      #{rec.rank}
                    </div>

                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {rec.speaker.headshot || rec.speaker.avatar ? (
                        <img
                          src={rec.speaker.headshot || rec.speaker.avatar}
                          alt={rec.speaker.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        rec.speaker.name?.charAt(0)?.toUpperCase() || "S"
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Link
                          to={`/organizer/speakers/${rec.speaker._id}`}
                          className={`font-semibold text-base hover:text-emerald-500 transition-colors ${
                            dark ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {rec.speaker.name}
                        </Link>
                        {/* Match score pill */}
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${getScoreBg(
                            rec.matchScore
                          )} ${getScoreColor(rec.matchScore)}`}
                        >
                          <TrendingUp size={11} />
                          {rec.matchScore}% match
                        </span>
                        {/* Request status badge */}
                        {requestStatus[rec.speaker._id] && (
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                              requestStatus[rec.speaker._id] === "accepted"
                                ? dark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-700"
                                : requestStatus[rec.speaker._id] === "rejected"
                                ? dark ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-700"
                                : dark ? "bg-amber-500/10 text-amber-400" : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {requestStatus[rec.speaker._id] === "accepted" ? (
                              <><CheckCircle size={11} /> Accepted</>
                            ) : requestStatus[rec.speaker._id] === "rejected" ? (
                              <><XCircle size={11} /> Rejected</>
                            ) : (
                              <><Mail size={11} /> Invited</>
                            )}
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-sm mt-0.5 ${
                          dark ? "text-zinc-400" : "text-gray-500"
                        }`}
                      >
                        {rec.speaker.email}
                      </p>

                      {/* Specializations */}
                      {rec.speaker.specializations?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {rec.speaker.specializations.slice(0, 5).map((spec, i) => (
                            <span
                              key={i}
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                dark
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : "bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              {spec}
                            </span>
                          ))}
                          {rec.speaker.specializations.length > 5 && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                dark ? "bg-zinc-700 text-zinc-300" : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              +{rec.speaker.specializations.length - 5}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right side stats */}
                    <div className="flex-shrink-0 flex flex-col items-end gap-2">
                      {/* Rating */}
                      <div className="flex items-center gap-1.5">
                        {renderStars(rec.avgRating)}
                        <span
                          className={`text-xs ml-1 ${
                            dark ? "text-zinc-500" : "text-gray-400"
                          }`}
                        >
                          {rec.avgRating > 0 ? rec.avgRating.toFixed(1) : "N/A"} ({rec.totalReviews})
                        </span>
                      </div>
                      {/* Sessions */}
                      <div
                        className={`flex items-center gap-1 text-xs ${
                          dark ? "text-zinc-400" : "text-gray-500"
                        }`}
                      >
                        <Mic size={12} />
                        {rec.completedSessions} completed / {rec.totalSessions} total
                      </div>
                      {/* Past Records */}
                      <div
                        className={`flex items-center gap-1 text-xs ${
                          dark ? "text-zinc-400" : "text-gray-500"
                        }`}
                      >
                        <Calendar size={12} />
                        {rec.speaker.pastSpeakingRecords?.length || 0} past events
                      </div>
                      {/* Send Request button for top 3 (visible without expanding) */}
                      {rec.rank <= 3 && (
                        requestStatus[rec.speaker._id] ? (
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg ${
                              requestStatus[rec.speaker._id] === "sending"
                                ? dark ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"
                                : requestStatus[rec.speaker._id] === "accepted"
                                ? dark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-700"
                                : requestStatus[rec.speaker._id] === "rejected"
                                ? dark ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-700"
                                : dark ? "bg-amber-500/10 text-amber-400" : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {requestStatus[rec.speaker._id] === "sending" ? (
                              <><Loader2 size={12} className="animate-spin" /> Sending...</>
                            ) : requestStatus[rec.speaker._id] === "accepted" ? (
                              <><CheckCircle size={12} /> Accepted</>
                            ) : requestStatus[rec.speaker._id] === "rejected" ? (
                              <><XCircle size={12} /> Rejected</>
                            ) : (
                              <><Mail size={12} /> Request Sent</>
                            )}
                          </span>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSendSingleRequest(rec); }}
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 transition-all shadow-sm"
                          >
                            <Send size={12} />
                            Send Request
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Bio preview */}
                  {rec.speaker.bio && (
                    <p
                      className={`text-sm mt-3 line-clamp-2 ${
                        dark ? "text-zinc-400" : "text-gray-600"
                      }`}
                    >
                      {rec.speaker.bio}
                    </p>
                  )}

                  {/* Expand/Collapse toggle */}
                  <button
                    onClick={() =>
                      setExpandedId(isExpanded ? null : rec.speaker._id)
                    }
                    className={`mt-3 text-xs font-medium flex items-center gap-1 transition-colors ${
                      dark
                        ? "text-amber-400 hover:text-amber-300"
                        : "text-amber-600 hover:text-amber-700"
                    }`}
                  >
                    {isExpanded ? (
                      <>
                        Hide Score Breakdown <ChevronUp size={14} />
                      </>
                    ) : (
                      <>
                        View Score Breakdown <ChevronDown size={14} />
                      </>
                    )}
                  </button>
                </div>

                {/* Expanded Breakdown */}
                {isExpanded && (
                  <div
                    className={`px-5 pb-5 border-t ${
                      dark ? "border-zinc-800" : "border-gray-100"
                    }`}
                  >
                    <h4
                      className={`text-sm font-semibold mt-4 mb-3 ${
                        dark ? "text-zinc-200" : "text-gray-700"
                      }`}
                    >
                      Score Breakdown
                    </h4>
                    <div className="space-y-3">
                      {Object.entries(rec.breakdown).map(([key, val]) => {
                        const config = breakdownLabels[key];
                        if (!config || val.score === undefined) return null;
                        const Icon = config.icon;
                        const pct = val.max > 0 ? (val.score / val.max) * 100 : 0;
                        return (
                          <div key={key}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <Icon
                                  size={13}
                                  className={dark ? "text-zinc-400" : "text-gray-500"}
                                />
                                <span
                                  className={`text-xs font-medium ${
                                    dark ? "text-zinc-300" : "text-gray-600"
                                  }`}
                                >
                                  {config.label}
                                </span>
                              </div>
                              <span
                                className={`text-xs font-bold ${getScoreColor(
                                  (val.score / val.max) * 100
                                )}`}
                              >
                                {val.score} / {val.max}
                              </span>
                            </div>
                            <div
                              className={`h-2 rounded-full overflow-hidden ${
                                dark ? "bg-zinc-800" : "bg-gray-100"
                              }`}
                            >
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${getBarColor(
                                  val.score,
                                  val.max
                                )}`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Past Speaking Records */}
                    {rec.speaker.pastSpeakingRecords?.length > 0 && (
                      <div className="mt-5">
                        <h4
                          className={`text-sm font-semibold mb-2 ${
                            dark ? "text-zinc-200" : "text-gray-700"
                          }`}
                        >
                          Past Speaking History
                        </h4>
                        <div className="space-y-2">
                          {rec.speaker.pastSpeakingRecords.map((record, i) => (
                            <div
                              key={i}
                              className={`flex items-center gap-3 text-xs p-2 rounded-lg ${
                                dark ? "bg-zinc-800/50" : "bg-gray-50"
                              }`}
                            >
                              <Calendar
                                size={12}
                                className={dark ? "text-zinc-500" : "text-gray-400"}
                              />
                              <span className={dark ? "text-zinc-300" : "text-gray-700"}>
                                {record.topic || record.eventName}
                              </span>
                              <span
                                className={`ml-auto ${
                                  dark ? "text-zinc-500" : "text-gray-400"
                                }`}
                              >
                                {record.eventName} •{" "}
                                {record.date
                                  ? new Date(record.date).toLocaleDateString()
                                  : "N/A"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="flex items-center gap-3 mt-5">
                      <Link
                        to={`/organizer/speakers/${rec.speaker._id}`}
                        className={`text-xs font-medium px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors ${
                          dark
                            ? "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <ExternalLink size={12} />
                        View Full Profile
                      </Link>
                      <Link
                        to="/organizer/sessions/assign"
                        className="text-xs font-medium px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 flex items-center gap-1.5 transition-colors"
                      >
                        <Mic size={12} />
                        Assign Session
                      </Link>
                      {/* Send Request Button (per speaker) */}
                      {requestStatus[rec.speaker._id] ? (
                        <span
                          className={`text-xs font-medium px-4 py-2 rounded-lg flex items-center gap-1.5 ${
                            requestStatus[rec.speaker._id] === "sending"
                              ? dark ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"
                              : requestStatus[rec.speaker._id] === "accepted"
                              ? dark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-700"
                              : requestStatus[rec.speaker._id] === "rejected"
                              ? dark ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-700"
                              : dark ? "bg-amber-500/10 text-amber-400" : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {requestStatus[rec.speaker._id] === "sending" ? (
                            <><Loader2 size={12} className="animate-spin" /> Sending...</>
                          ) : requestStatus[rec.speaker._id] === "accepted" ? (
                            <><CheckCircle size={12} /> Accepted</>
                          ) : requestStatus[rec.speaker._id] === "rejected" ? (
                            <><XCircle size={12} /> Rejected</>
                          ) : (
                            <><Mail size={12} /> Request Sent</>
                          )}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSendSingleRequest(rec)}
                          className="text-xs font-medium px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-1.5 transition-colors"
                        >
                          <Send size={12} />
                          Send Request
                        </button>
                      )}
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

export default SpeakerRecommendation;
