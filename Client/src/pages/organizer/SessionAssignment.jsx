import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import {
  Plus,
  Loader2,
  Calendar,
  Clock,
  MapPin,
  User,
  Search,
  CheckCircle,
  Trash2,
  Edit3,
  X,
  Check,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const fetchApi = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.message) message = data.message;
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }
  return res.json();
};

const SessionAssignment = () => {
  const { theme } = useTheme();
  const dark = theme === "dark";

  const [events, setEvents] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    event: "",
    speaker: "",
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    room: "",
    track: "",
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      loadSessions(selectedEvent);
    }
  }, [selectedEvent]);

  const loadInitialData = async () => {
    try {
      const organizerId = localStorage.getItem("userId") || localStorage.getItem("organizerId");
      const eventsEndpoint = organizerId ? `/organizer/events?organizerId=${organizerId}` : "/organizer/events";
      const [eventsData, speakersData] = await Promise.all([
        fetchApi(eventsEndpoint),
        fetchApi("/organizer/speakers"),
      ]);
      if (eventsData.success) setEvents(eventsData.data?.events || eventsData.data || []);
      if (speakersData.success) setSpeakers(speakersData.data || []);
    } catch (err) {
      console.error("Failed to load data:", err);
    }
  };

  const loadSessions = async (eventId) => {
    try {
      setLoading(true);
      const data = await fetchApi(`/organizer/sessions/${eventId}`);
      if (data.success) setSessions(data.data || []);
    } catch (err) {
      console.error("Failed to load sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.event || !form.speaker || !form.title) {
      setMsg("Event, speaker, and title are required");
      return;
    }
    try {
      setCreating(true);
      const body = {
        eventId: form.event,
        speakerId: form.speaker,
        title: form.title,
        description: form.description,
        room: form.room,
        track: form.track,
      };
      if (form.startTime || form.endTime) {
        body.time = {};
        if (form.startTime) body.time.start = form.startTime;
        if (form.endTime) body.time.end = form.endTime;
      }

      const data = await fetchApi("/organizer/sessions", {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (data.success) {
        setMsg("Session created!");
        setShowForm(false);
        setForm({ event: "", speaker: "", title: "", description: "", startTime: "", endTime: "", room: "", track: "" });
        if (selectedEvent === form.event) loadSessions(selectedEvent);
      }
    } catch (err) {
      setMsg(err?.message || "Failed to create session");
    } finally {
      setCreating(false);
      setTimeout(() => setMsg(""), 3000);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!confirm("Delete this session?")) return;
    try {
      await fetchApi(`/organizer/sessions/${sessionId}`, {
        method: "DELETE",
      });
      if (selectedEvent) loadSessions(selectedEvent);
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  const handleStatusChange = async (sessionId, status) => {
    try {
      await fetchApi(`/organizer/sessions/${sessionId}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      if (selectedEvent) loadSessions(selectedEvent);
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const cardClass = dark
    ? "bg-[#1a1a2e] border-zinc-800"
    : "bg-white border-gray-200";
  const textPrimary = dark ? "text-white" : "text-gray-900";
  const textSecondary = dark ? "text-zinc-400" : "text-gray-500";
  const inputClass = dark
    ? "bg-[#1a1a2e] border-zinc-700 text-white"
    : "bg-white border-gray-200 text-gray-900";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${textPrimary}`}>
            Session Assignment
          </h1>
          <p className={textSecondary}>
            Create sessions and assign speakers
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-colors"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Cancel" : "New Session"}
        </button>
      </div>

      {msg && (
        <div
          className={`p-3 rounded-xl text-sm ${
            msg.includes("created") || msg.includes("success")
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {msg}
        </div>
      )}

      {/* Create Session Form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className={`rounded-2xl border p-6 ${cardClass}`}
        >
          <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>
            Create New Session
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`text-xs font-medium block mb-1.5 ${textSecondary}`}>
                Event *
              </label>
              <select
                value={form.event}
                onChange={(e) => setForm({ ...form, event: e.target.value })}
                required
                className={`w-full text-sm px-3 py-2.5 rounded-xl border ${inputClass}`}
              >
                <option value="">Select event</option>
                {events.map((ev) => (
                  <option key={ev._id} value={ev._id}>
                    {ev.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={`text-xs font-medium block mb-1.5 ${textSecondary}`}>
                Speaker *
              </label>
              <select
                value={form.speaker}
                onChange={(e) => setForm({ ...form, speaker: e.target.value })}
                required
                className={`w-full text-sm px-3 py-2.5 rounded-xl border ${inputClass}`}
              >
                <option value="">Select speaker</option>
                {speakers.map((sp) => (
                  <option key={sp._id} value={sp._id}>
                    {sp.name} ({sp.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className={`text-xs font-medium block mb-1.5 ${textSecondary}`}>
                Session Title *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                className={`w-full text-sm px-3 py-2.5 rounded-xl border ${inputClass}`}
                placeholder="e.g. Introduction to AI in Healthcare"
              />
            </div>
            <div className="md:col-span-2">
              <label className={`text-xs font-medium block mb-1.5 ${textSecondary}`}>
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className={`w-full text-sm px-3 py-2.5 rounded-xl border resize-none ${inputClass}`}
                placeholder="Session description..."
              />
            </div>
            <div>
              <label className={`text-xs font-medium block mb-1.5 ${textSecondary}`}>
                Start Time
              </label>
              <input
                type="datetime-local"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className={`w-full text-sm px-3 py-2.5 rounded-xl border ${inputClass}`}
              />
            </div>
            <div>
              <label className={`text-xs font-medium block mb-1.5 ${textSecondary}`}>
                End Time
              </label>
              <input
                type="datetime-local"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className={`w-full text-sm px-3 py-2.5 rounded-xl border ${inputClass}`}
              />
            </div>
            <div>
              <label className={`text-xs font-medium block mb-1.5 ${textSecondary}`}>
                Room / Venue
              </label>
              <input
                type="text"
                value={form.room}
                onChange={(e) => setForm({ ...form, room: e.target.value })}
                className={`w-full text-sm px-3 py-2.5 rounded-xl border ${inputClass}`}
                placeholder="e.g. Hall A"
              />
            </div>
            <div>
              <label className={`text-xs font-medium block mb-1.5 ${textSecondary}`}>
                Track
              </label>
              <input
                type="text"
                value={form.track}
                onChange={(e) => setForm({ ...form, track: e.target.value })}
                className={`w-full text-sm px-3 py-2.5 rounded-xl border ${inputClass}`}
                placeholder="e.g. Main Stage"
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm flex items-center gap-2 disabled:opacity-50 transition-colors"
            >
              {creating ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Plus size={14} />
              )}
              Create Session
            </button>
          </div>
        </form>
      )}

      {/* Select Event to View Sessions */}
      <div className={`rounded-2xl border p-6 ${cardClass}`}>
        <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>
          Event Sessions
        </h3>
        <div className="mb-4">
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className={`text-sm px-3 py-2.5 rounded-xl border w-full max-w-md ${inputClass}`}
          >
            <option value="">Select an event to view sessions</option>
            {events.map((ev) => (
              <option key={ev._id} value={ev._id}>
                {ev.title}
              </option>
            ))}
          </select>
        </div>

        {!selectedEvent ? (
          <p className={`text-sm ${textSecondary}`}>
            Select an event above to see its sessions
          </p>
        ) : loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className={`animate-spin ${textSecondary}`} size={24} />
          </div>
        ) : sessions.length === 0 ? (
          <p className={`text-sm ${textSecondary}`}>
            No sessions for this event yet
          </p>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session._id}
                className={`rounded-xl border p-4 ${
                  dark ? "border-zinc-700 bg-zinc-800/30" : "border-gray-100 bg-gray-50"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-medium ${textPrimary}`}>
                      {session.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <span className={`text-xs flex items-center gap-1 ${textSecondary}`}>
                        <User size={12} />
                        {session.speaker?.name || "Unassigned"}
                      </span>
                      {session.time?.start && (
                        <span className={`text-xs flex items-center gap-1 ${textSecondary}`}>
                          <Clock size={12} />
                          {new Date(session.time.start).toLocaleString()}
                        </span>
                      )}
                      {session.room && (
                        <span className={`text-xs flex items-center gap-1 ${textSecondary}`}>
                          <MapPin size={12} />
                          {session.room}
                        </span>
                      )}
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          session.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : session.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : session.status === "confirmed"
                            ? "bg-blue-100 text-blue-700"
                            : session.status === "ongoing"
                            ? "bg-yellow-100 text-yellow-700"
                            : session.status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : session.status === "cancelled"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {session.status}
                      </span>
                    </div>

                    {session.status === "rejected" && session.assignment?.rejectionReason && (
                      <p className={`text-xs mt-2 ${textSecondary}`}>
                        Rejection reason: {session.assignment.rejectionReason}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <select
                      value={session.status}
                      onChange={(e) =>
                        handleStatusChange(session._id, e.target.value)
                      }
                      disabled={session.status === "pending"}
                      className={`text-xs px-2 py-1 rounded-lg border ${inputClass}`}
                    >
                      <option value="draft">Draft</option>
                      <option value="pending" disabled>
                        Pending
                      </option>
                      <option value="confirmed">Confirmed</option>
                      <option value="rejected">Rejected</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <button
                      onClick={() => handleDeleteSession(session._id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionAssignment;
