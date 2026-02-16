import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  QrCode,
  Award,
  Mail,
  Edit,
  Settings,
  ChevronRight,
  Globe,
  DollarSign,
  Tag,
  User,
  Phone,
  ExternalLink,
  Pin,
  MessageSquare,
  Trash2,
} from "lucide-react";
import {
  getEventDetails,
  getEventUpdates,
  createEventUpdate,
  deleteEventUpdate,
  togglePinUpdate,
} from "../../services/organizerApi";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const EventDetails = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [speakerUpdates, setSpeakerUpdates] = useState([]);
  const [speakerUpdatesLoading, setSpeakerUpdatesLoading] = useState(true);
  const [speakerUpdateActionKey, setSpeakerUpdateActionKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [newUpdate, setNewUpdate] = useState({ message: "", type: "INFO" });
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (eventId) {
      fetchEventData();
    } else {
      setLoading(false);
      setEvent(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const fetchEventData = async () => {
    if (!eventId) return;

    try {
      setSpeakerUpdatesLoading(true);
      const [eventRes, updatesRes] = await Promise.all([
        getEventDetails(eventId),
        getEventUpdates(eventId),
      ]);
      if (eventRes.data.success) setEvent(eventRes.data.data);
      if (updatesRes.data.success) setUpdates(updatesRes.data.data);

      // Fetch sessions for this event so we can show speaker-posted updates here
      const token = localStorage.getItem("token");
      const sessionsRes = await fetch(
        `${API_BASE_URL}/organizer/sessions/${eventId}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );
      const sessionsData = await sessionsRes.json();
      const sessions = sessionsData?.success ? sessionsData.data || [] : [];

      const flattenedUpdates = (sessions || []).flatMap((session) =>
        (session.updates || []).map((u, updateIndex) => ({
          ...u,
          _sessionId: session._id,
          _updateIndex: updateIndex,
          _sessionTitle: session.title,
          _speaker: session.speaker,
          _speakerName: session.speaker?.name,
        })),
      );

      flattenedUpdates.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      );

      setSpeakerUpdates(flattenedUpdates);
    } catch (error) {
      console.error("Error fetching event data:", error);
    } finally {
      setLoading(false);
      setSpeakerUpdatesLoading(false);
    }
  };

  const handleSpeakerUpdateDecision = async (sessionId, updateIndex, status) => {
    const actionKey = `${sessionId}:${updateIndex}`;
    try {
      setSpeakerUpdateActionKey(actionKey);
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE_URL}/organizer/sessions/${sessionId}/updates/${updateIndex}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ status }),
        },
      );
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to update status");
      }

      setSpeakerUpdates((prev) =>
        prev.map((u) =>
          u._sessionId === sessionId && u._updateIndex === updateIndex
            ? { ...u, status }
            : u,
        ),
      );
    } catch (error) {
      console.error("Error updating speaker update status:", error);
    } finally {
      setSpeakerUpdateActionKey(null);
    }
  };

  const handleCreateUpdate = async () => {
    try {
      const response = await createEventUpdate({
        eventId,
        ...newUpdate,
      });
      if (response.data.success) {
        setUpdates([response.data.data, ...updates]);
        setShowUpdateModal(false);
        setNewUpdate({ message: "", type: "INFO" });
      }
    } catch (error) {
      console.error("Error creating update:", error);
    }
  };

  const handleDeleteUpdate = async (updateId) => {
    try {
      await deleteEventUpdate(updateId);
      setUpdates(updates.filter((u) => u._id !== updateId));
    } catch (error) {
      console.error("Error deleting update:", error);
    }
  };

  const handleTogglePin = async (updateId) => {
    try {
      const response = await togglePinUpdate(updateId);
      if (response.data.success) {
        setUpdates(
          updates.map((u) =>
            u._id === updateId ? { ...u, isPinned: !u.isPinned } : u,
          ),
        );
      }
    } catch (error) {
      console.error("Error toggling pin:", error);
    }
  };

  const getLifecycleStageIndex = (status) => {
    if (!status) return 0;
    const stages = ["draft", "upcoming", "ongoing", "completed", "cancelled"];
    const index = stages.indexOf(status.toLowerCase());
    return index === -1 ? 0 : index;
  };

  // Map real event data to display format
  const displayEvent = event
    ? {
        ...event,
        name: event.title || event.name,
        date: event.startDate,
        venue: event.venue || event.location,
        address: event.address || event.location,
        organizer: event.teamLead || event.organizer,
        participantCount: event.participantCount || 0,
        attendanceCount: event.attendanceCount || 0,
        certificateCount: event.certificateCount || 0,
      }
    : null;
  const displayUpdates = updates;

  const updateTypeColors = {
    INFO: "bg-blue-50 text-blue-700 border border-blue-200",
    WARNING: "bg-amber-50 text-amber-700 border border-amber-200",
    URGENT: "bg-red-50 text-red-700 border border-red-200",
    ANNOUNCEMENT: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  };

  const statusColors = {
    upcoming: "bg-blue-50 text-blue-700 border border-blue-200",
    ongoing: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    completed: "bg-gray-50 text-gray-700 border border-gray-200",
    draft: "bg-amber-50 text-amber-700 border border-amber-200",
  };

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "timeline", label: "Timeline Updates" },
    { key: "settings", label: "Settings" },
  ];

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-48 bg-gray-200 dark:bg-white/10 rounded-2xl" />
        <div className="h-8 bg-gray-200 dark:bg-white/10 rounded w-1/3" />
        <div className="h-4 bg-gray-100 dark:bg-white/5 rounded w-2/3" />
      </div>
    );
  }

  if (!event || !eventId) {
    return (
      <div className="space-y-6">
        <Link
          to="/organizer/events"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <div className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </div>
          <span className="font-medium">Back to Events</span>
        </Link>

        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Calendar
            size={64}
            className="text-gray-300 dark:text-zinc-600 mb-4"
          />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            No Event Selected
          </h2>
          <p className="text-gray-500 dark:text-zinc-400 mb-6">
            Please select an event from your events list to view details and
            updates.
          </p>
          <Link to="/organizer/events" className="btn-primary">
            Go to My Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        to="/organizer/events"
        className="group inline-flex items-center gap-2 text-gray-600 dark:text-zinc-400 hover:text-[#191A23] dark:hover:text-white transition-all font-bold"
      >
        <div className="p-2.5 hover:bg-[#B9FF66]/10 rounded-xl transition-all group-hover:scale-110">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </div>
        <span>Back to Events</span>
      </Link>

      {/* Event Header */}
      <div className="relative bg-[#191A23] rounded-2xl p-8 border border-[#191A23]/10 shadow-2xl overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <span
              className={`px-3 py-1.5 rounded-full text-sm font-black ${statusColors[displayEvent.status]} shadow-lg`}
            >
              {displayEvent.status?.charAt(0).toUpperCase() +
                displayEvent.status?.slice(1)}
            </span>
            <span className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-sm font-bold text-[#B9FF66] shadow-lg">
              {displayEvent.category}
            </span>
          </div>
          <h1 className="text-4xl font-black mb-3 text-white">
            {displayEvent.name}
          </h1>
          <p className="text-gray-300 max-w-2xl font-semibold">
            {displayEvent.description}
          </p>

          <div className="flex flex-wrap items-center gap-6 mt-6 text-white">
            <div className="flex items-center gap-2 font-bold bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl">
              <Calendar size={18} strokeWidth={2.5} />
              <span>
                {new Date(displayEvent.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-2 font-bold bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl">
              <Clock size={18} strokeWidth={2.5} />
              <span>{displayEvent.time}</span>
            </div>
            <div className="flex items-center gap-2 font-bold bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl">
              <MapPin size={18} strokeWidth={2.5} />
              <span>{displayEvent.venue}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          to={`/organizer/participants?event=${eventId}`}
          className="group relative bg-white dark:bg-white/[0.03] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-md dark:shadow-none hover:shadow-2xl transition-all duration-300 flex items-center gap-4 overflow-hidden hover:-translate-y-1"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#B9FF66]/10 rounded-full blur-2xl group-hover:bg-[#B9FF66]/20 transition-all"></div>
          <div className="relative p-3 bg-[#191A23] rounded-xl shadow-lg">
            <Users size={24} className="text-[#B9FF66]" strokeWidth={2.5} />
          </div>
          <div className="relative">
            <p className="text-3xl font-black text-gray-900 dark:text-white">
              {displayEvent.participantCount}
            </p>
            <p className="text-sm text-gray-700 dark:text-zinc-400 font-bold">
              Participants
            </p>
          </div>
        </Link>
        <Link
          to={`/organizer/attendance/qr?event=${eventId}`}
          className="group relative bg-white dark:bg-white/[0.03] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-md dark:shadow-none hover:shadow-2xl transition-all duration-300 flex items-center gap-4 overflow-hidden hover:-translate-y-1"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#B9FF66]/10 rounded-full blur-2xl group-hover:bg-[#B9FF66]/20 transition-all"></div>
          <div className="relative p-3 bg-[#B9FF66] rounded-xl shadow-lg">
            <QrCode size={24} className="text-[#191A23]" strokeWidth={2.5} />
          </div>
          <div className="relative">
            <p className="text-3xl font-black text-gray-900 dark:text-white">
              {displayEvent.attendanceCount}
            </p>
            <p className="text-sm text-gray-700 dark:text-zinc-400 font-bold">
              Attendance
            </p>
          </div>
        </Link>
        <Link
          to={`/organizer/certificates/generate?event=${eventId}`}
          className="group relative bg-white dark:bg-white/[0.03] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-md dark:shadow-none hover:shadow-2xl transition-all duration-300 flex items-center gap-4 overflow-hidden hover:-translate-y-1"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#191A23]/5 rounded-full blur-2xl group-hover:bg-[#191A23]/10 transition-all"></div>
          <div className="relative p-3 bg-[#191A23] rounded-xl shadow-lg">
            <Award size={24} className="text-[#B9FF66]" strokeWidth={2.5} />
          </div>
          <div className="relative">
            <p className="text-3xl font-black text-gray-900 dark:text-white">
              {displayEvent.certificateCount}
            </p>
            <p className="text-sm text-gray-700 dark:text-zinc-400 font-bold">
              Certificates
            </p>
          </div>
        </Link>
        <Link
          to={`/organizer/communication/email?event=${eventId}`}
          className="group relative bg-white dark:bg-white/[0.03] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-md dark:shadow-none hover:shadow-2xl transition-all duration-300 flex items-center gap-4 overflow-hidden hover:-translate-y-1"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#B9FF66]/10 rounded-full blur-2xl group-hover:bg-[#B9FF66]/20 transition-all"></div>
          <div className="relative p-3 bg-[#B9FF66] rounded-xl shadow-lg">
            <Mail size={24} className="text-[#191A23]" strokeWidth={2.5} />
          </div>
          <div className="relative">
            <p className="text-3xl font-black text-gray-900 dark:text-white">
              Send
            </p>
            <p className="text-sm text-gray-700 dark:text-zinc-400 font-bold">
              Communication
            </p>
          </div>
        </Link>
      </div>

      {/* Tabs */}
      <div className="bg-white/80 dark:bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-white/60 dark:border-white/5 shadow-lg dark:shadow-none">
        <div className="border-b border-gray-100 dark:border-white/5">
          <div className="flex gap-6 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative py-4 font-black text-sm transition-all duration-300 ${
                  activeTab === tab.key
                    ? "text-[#191A23] dark:text-white"
                    : "text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300"
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#B9FF66] rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Event Lifecycle Timeline */}
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-white text-lg mb-4">
                  Event Status
                </h3>
                <div className="bg-gradient-to-br from-gray-50 to-white dark:from-white/[0.03] dark:to-transparent rounded-xl p-6 border border-gray-100 dark:border-white/5">
                  {/* Progress Line */}
                  <div className="relative mb-8">
                    <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 rounded-full" />
                    <div
                      className="absolute top-5 left-0 h-1 bg-[#B9FF66] rounded-full transition-all duration-500"
                      style={{
                        width: `${(getLifecycleStageIndex(displayEvent.status) / 4) * 100}%`,
                      }}
                    />
                    <div className="relative flex justify-between">
                      {[
                        {
                          key: "draft",
                          label: "Draft",
                          icon: "📝",
                          color: "gray",
                        },
                        {
                          key: "upcoming",
                          label: "Upcoming",
                          icon: "⏰",
                          color: "blue",
                        },
                        {
                          key: "ongoing",
                          label: "Ongoing",
                          icon: "▶️",
                          color: "green",
                        },
                        {
                          key: "completed",
                          label: "Completed",
                          icon: "✅",
                          color: "purple",
                        },
                        {
                          key: "cancelled",
                          label: "Cancelled",
                          icon: "❌",
                          color: "red",
                        },
                      ].map((stage, index) => {
                        const isCurrent = displayEvent.status === stage.key;
                        const currentIndex = getLifecycleStageIndex(
                          displayEvent.status,
                        );
                        const isPast =
                          index < currentIndex &&
                          displayEvent.status !== "cancelled";
                        const isCancelled =
                          displayEvent.status === "cancelled" &&
                          stage.key === "cancelled";

                        return (
                          <div
                            key={stage.key}
                            className="flex flex-col items-center"
                          >
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-300 ${
                                isCurrent || isCancelled
                                  ? stage.color === "gray"
                                    ? "bg-gray-900 text-white shadow-lg scale-110"
                                    : stage.color === "blue"
                                      ? "bg-blue-600 text-white shadow-lg scale-110"
                                      : stage.color === "green"
                                        ? "bg-green-600 text-white shadow-lg scale-110"
                                        : stage.color === "purple"
                                          ? "bg-purple-600 text-white shadow-lg scale-110"
                                          : "bg-red-600 text-white shadow-lg scale-110"
                                  : isPast
                                    ? "bg-green-500 text-white"
                                    : "bg-gray-200 text-gray-400"
                              }`}
                            >
                              {stage.icon}
                            </div>
                            <span
                              className={`mt-2 text-xs font-medium ${
                                isCurrent || isCancelled
                                  ? "text-gray-900"
                                  : isPast
                                    ? "text-green-600"
                                    : "text-gray-400"
                              }`}
                            >
                              {stage.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Current Status Info */}
                  <div className="bg-white dark:bg-white/[0.03] rounded-lg p-4 border border-gray-100 dark:border-white/5">
                    <p className="text-sm text-gray-500 dark:text-zinc-500 mb-1">
                      Current Status
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                      {displayEvent.status}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Event Info */}
                <div className="space-y-6">
                  <h3 className="font-semibold text-gray-800 dark:text-white text-lg">
                    Event Information
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Globe size={18} className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-zinc-500">
                          Event Type
                        </p>
                        <p className="text-gray-800 dark:text-zinc-300">
                          {displayEvent.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <DollarSign size={18} className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-zinc-500">
                          Registration Fee
                        </p>
                        <p className="text-gray-800 dark:text-zinc-300">
                          ${displayEvent.registrationFee || "Free"}
                        </p>
                      </div>
                    </div>
                    {displayEvent.maxParticipants && (
                      <div className="flex items-center gap-3">
                        <Users size={18} className="text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">
                            Max Participants
                          </p>
                          <p className="text-gray-800 dark:text-zinc-300">
                            {displayEvent.maxParticipants}
                          </p>
                        </div>
                      </div>
                    )}
                    {displayEvent.registrationDeadline && (
                      <div className="flex items-center gap-3">
                        <Calendar size={18} className="text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">
                            Registration Deadline
                          </p>
                          <p className="text-gray-800 dark:text-zinc-300">
                            {new Date(
                              displayEvent.registrationDeadline,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {displayEvent.tags && displayEvent.tags.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {displayEvent.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Organizer Info */}
                <div className="space-y-6">
                  <h3 className="font-semibold text-gray-800 dark:text-white text-lg">
                    Organizer Details
                  </h3>
                  <div className="bg-gray-50 dark:bg-white/[0.03] rounded-xl p-4 space-y-4">
                    <div className="flex items-center gap-3">
                      <User size={18} className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Name</p>
                        <p className="text-gray-800">
                          {displayEvent.organizer?.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail size={18} className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="text-gray-800">
                          {displayEvent.organizer?.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone size={18} className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="text-gray-800">
                          {displayEvent.organizer?.phone}
                        </p>
                      </div>
                    </div>
                  </div>

                  {displayEvent.website && (
                    <a
                      href={displayEvent.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[#191A23] hover:text-[#B9FF66]"
                    >
                      <ExternalLink size={16} />
                      Event Website
                    </a>
                  )}
                </div>
              </div>

              {/* Speaker Updates */}
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-white text-lg mb-4 flex items-center gap-2">
                  <MessageSquare size={18} className="text-gray-400" />
                  Speaker Updates
                </h3>

                {speakerUpdatesLoading ? (
                  <div className="bg-white dark:bg-white/[0.03] rounded-xl p-6 border border-gray-100 dark:border-white/5">
                    <p className="text-sm text-gray-500 dark:text-zinc-500">
                      Loading speaker updates...
                    </p>
                  </div>
                ) : speakerUpdates.length === 0 ? (
                  <div className="bg-white dark:bg-white/[0.03] rounded-xl p-6 border border-gray-100 dark:border-white/5">
                    <p className="text-sm text-gray-500 dark:text-zinc-500">
                      No speaker updates posted for this event yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {speakerUpdates.map((u) => (
                      <div
                        key={u._id || `${u._sessionId}-${u.createdAt}-${u.message}`}
                        className="bg-white dark:bg-white/[0.03] rounded-xl p-5 border border-gray-100 dark:border-white/5"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {u._speakerName || "Speaker"} • {u._sessionTitle || "Session"}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
                              {u.message}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-zinc-500 mt-2">
                              {(u.type || "general").toString()}
                              {u.createdAt
                                ? ` • ${new Date(u.createdAt).toLocaleString()}`
                                : ""}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs px-2.5 py-1 rounded-full font-semibold self-start ${
                                u.status === "approved"
                                  ? "bg-green-50 text-green-700 border border-green-200"
                                  : u.status === "rejected"
                                    ? "bg-red-50 text-red-700 border border-red-200"
                                    : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {u.status || "pending"}
                            </span>

                            {(u.status === "pending" || !u.status) && (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSpeakerUpdateDecision(
                                      u._sessionId,
                                      u._updateIndex,
                                      "approved",
                                    )
                                  }
                                  disabled={
                                    speakerUpdateActionKey ===
                                    `${u._sessionId}:${u._updateIndex}`
                                  }
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSpeakerUpdateDecision(
                                      u._sessionId,
                                      u._updateIndex,
                                      "rejected",
                                    )
                                  }
                                  disabled={
                                    speakerUpdateActionKey ===
                                    `${u._sessionId}:${u._updateIndex}`
                                  }
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "timeline" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800 dark:text-white text-lg">
                  Timeline Updates
                </h3>
                <button
                  onClick={() => setShowUpdateModal(true)}
                  className="px-4 py-2 bg-[#191A23] text-[#B9FF66] rounded-xl hover:bg-[#2A2B33] transition-colors text-sm font-medium"
                >
                  Add Update
                </button>
              </div>

              <div className="space-y-4">
                {displayUpdates.map((update) => (
                  <div
                    key={update._id}
                    className={`p-4 rounded-xl border ${update.isPinned ? "border-[#B9FF66] bg-[#B9FF66]/5" : "border-gray-100 dark:border-white/5 bg-white dark:bg-white/[0.03]"}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${updateTypeColors[update.type]}`}
                          >
                            {update.type}
                          </span>
                          {update.isPinned && (
                            <span className="flex items-center gap-1 text-xs text-[#191A23]">
                              <Pin size={12} /> Pinned
                            </span>
                          )}
                        </div>
                        <p className="text-gray-800 dark:text-zinc-300">
                          {update.message}
                        </p>
                        <p className="text-sm text-gray-400 mt-2">
                          {new Date(update.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            },
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTogglePin(update._id)}
                          className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 ${update.isPinned ? "text-[#191A23] dark:text-white" : "text-gray-400"}`}
                        >
                          <Pin size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteUpdate(update._id)}
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="text-center py-12">
              <Settings
                size={48}
                className="mx-auto text-gray-300 dark:text-zinc-600 mb-4"
              />
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                Event Settings
              </h3>
              <p className="text-gray-500 dark:text-zinc-400">
                Event settings and configuration options will be available here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Update Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#1a1a2a] rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Add Timeline Update
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  Type
                </label>
                <select
                  value={newUpdate.type}
                  onChange={(e) =>
                    setNewUpdate({ ...newUpdate, type: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#B9FF66]"
                >
                  <option value="INFO">Info</option>
                  <option value="WARNING">Warning</option>
                  <option value="URGENT">Urgent</option>
                  <option value="ANNOUNCEMENT">Announcement</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  Message
                </label>
                <textarea
                  value={newUpdate.message}
                  onChange={(e) =>
                    setNewUpdate({ ...newUpdate, message: e.target.value })
                  }
                  rows={4}
                  placeholder="Enter your update message..."
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#B9FF66]"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowUpdateModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-zinc-300 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUpdate}
                className="flex-1 px-4 py-2.5 bg-[#B9FF66] text-[#191A23] font-semibold rounded-xl hover:bg-[#A8EE55] transition-colors"
              >
                Add Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetails;
