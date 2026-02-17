import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Eye,
  QrCode,
  Award,
  Search,
  Circle,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  X,
  Loader2,
  Banknote,
  ChevronRight,
} from "lucide-react";
import {
  getAssignedEvents,
  updateEventLifecycle,
} from "../../services/organizerApi";
import { getEventImageUrl } from "../../utils/eventImageResolver";

const EventCard = ({ event }) => {
  const statusColors = {
    upcoming: { bg: "bg-orange-500", text: "text-orange-500", dot: "bg-orange-500" },
    ongoing: { bg: "bg-green-500", text: "text-green-500", dot: "bg-green-500" },
    completed: { bg: "bg-blue-500", text: "text-blue-500", dot: "bg-blue-500" },
    draft: { bg: "bg-gray-400", text: "text-gray-400", dot: "bg-gray-400" },
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "TBA";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const statusColor = statusColors[event.status] || statusColors.draft;

  return (
    <div className="bg-white dark:bg-[#1a1a2a] rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
      {/* Large Visual Area - Hackathon Image Background */}
      <div className="relative h-56 overflow-hidden bg-gray-900">
        {/* Background Image */}
        <img
          src={getEventImageUrl(event)}
          alt={event.title}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
        
        {/* Gradient Overlay for better contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent"></div>
        
        {/* Event Icon - Centered */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
            <Calendar size={48} strokeWidth={1.5} className="text-white" />
          </div>
        </div>
        
        {/* Status Dot Indicator (top-right corner like bookmark) */}
        <div className="absolute top-4 right-4">
          <div className={`w-3 h-3 ${statusColor.dot} rounded-full shadow-lg ring-2 ring-white/30`}></div>
        </div>
      </div>

      {/* Clean White Content Section */}
      <div className="p-6">
        {/* Event Category/Type */}
        <div className="flex items-center gap-2 mb-3">
          <Users size={14} className="text-gray-400" />
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
            {event.status}
          </span>
        </div>

        {/* Event Title */}
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2">
          {event.title}
        </h3>

        {/* Simple Stats Row */}
        <div className="flex items-center gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Users size={16} />
            <span className="font-medium">{event.participantCount || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle size={16} />
            <span className="font-medium">{event.attendanceCount || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <Award size={16} />
            <span className="font-medium">{event.certificateCount || 0}</span>
          </div>
        </div>

        {/* Event Details */}
        <div className="space-y-2 mb-6 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <MapPin size={14} />
            <span>{event.venue || "Online Event"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={14} />
            <span>{formatDate(event.date)}</span>
          </div>
        </div>

        {/* Action Buttons Grid - 2x2 Layout */}
        <div className="grid grid-cols-2 gap-3">
          {/* View Details - Primary Button */}
          <Link
            to={`/organizer/events/${event._id}`}
            className="flex items-center justify-center gap-2 py-2.5 bg-[#B9FF66] hover:bg-[#A8EE55] text-[#191A23] rounded-xl font-semibold text-sm transition-colors duration-200"
          >
            <Eye size={16} />
            <span>Details</span>
          </Link>

          {/* Attendance QR */}
          <Link
            to={`/organizer/attendance/qr?event=${event._id || event.id}`}
            className="flex items-center justify-center gap-2 py-2.5 bg-gray-100 dark:bg-[#252535] hover:bg-gray-200 dark:hover:bg-[#2a2a3a] text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm transition-colors duration-200"
          >
            <QrCode size={16} />
            <span>Scan</span>
          </Link>

          {/* Finance */}
          <Link
            to={`/organizer/events/${event._id || event.id}/finance`}
            className="flex items-center justify-center gap-2 py-2.5 bg-gray-100 dark:bg-[#252535] hover:bg-gray-200 dark:hover:bg-[#2a2a3a] text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm transition-colors duration-200"
          >
            <Banknote size={16} />
            <span>Finance</span>
          </Link>

          {/* Manage Status */}
          <button
            onClick={(e) => {
              e.preventDefault();
              event.onManageLifecycle?.(event);
            }}
            className="flex items-center justify-center gap-2 py-2.5 bg-gray-100 dark:bg-[#252535] hover:bg-gray-200 dark:hover:bg-[#2a2a3a] text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm transition-colors duration-200"
          >
            <Settings size={16} />
            <span>Status</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const MyEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showLifecycleModal, setShowLifecycleModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const organizerId = localStorage.getItem("userId");
      const response = await getAssignedEvents(organizerId);
      if (response.data.success) {
        setEvents(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageLifecycle = (event) => {
    setSelectedEvent(event);
    setShowLifecycleModal(true);
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedEvent || newStatus === selectedEvent.status) return;

    const confirmChange = window.confirm(
      `Are you sure you want to change the event status to "${newStatus}"? This will affect event visibility and registrations.`,
    );

    if (!confirmChange) return;

    try {
      setUpdating(true);
      const response = await updateEventLifecycle(
        selectedEvent._id || selectedEvent.id,
        newStatus,
      );
      if (response.data.success) {
        alert("Event status updated successfully!");
        setShowLifecycleModal(false);
        fetchEvents(); // Refresh events list
      }
    } catch (error) {
      alert(error.message || "Failed to update event status");
    } finally {
      setUpdating(false);
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesFilter = filter === "all" || event.status === filter;
    const matchesSearch =
      event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filters = [
    { key: "all", label: "All Events" },
    { key: "upcoming", label: "Upcoming" },
    { key: "ongoing", label: "Ongoing" },
    { key: "completed", label: "Completed" },
    { key: "draft", label: "Draft" },
  ];

  return (
    <div className="space-y-6">
      {/* Simple Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          My Events
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage and monitor your assigned events
        </p>
      </div>

      {/* Simple Search and Filters */}
      <div className="bg-white dark:bg-[#1a1a2a] rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Simple Search */}
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#252535] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B9FF66] focus:border-transparent text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
            />
          </div>

          {/* Simple Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === f.key
                    ? "bg-[#B9FF66] text-[#191A23]"
                    : "bg-gray-100 dark:bg-[#252535] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2a2a3a]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#1a1a2a] rounded-2xl overflow-hidden shadow-lg animate-pulse"
            >
              <div className="h-56 bg-gray-300 dark:bg-gray-700"></div>
              <div className="p-6 space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded-xl mt-4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-white dark:bg-[#1a1a2a] rounded-2xl p-16 text-center border border-gray-200 dark:border-gray-700">
          <Calendar
            size={64}
            className="mx-auto text-gray-400 mb-4"
            strokeWidth={1.5}
          />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            No events found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery
              ? "Try adjusting your search query"
              : "You don't have any events assigned yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard
              key={event._id || event.id}
              event={{
                ...event,
                onManageLifecycle: handleManageLifecycle,
              }}
            />
          ))}
        </div>
      )}

      {/* Simple Summary Stats */}
      <div className="bg-white dark:bg-[#1a1a2a] rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Summary Statistics
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-[#252535] rounded-xl">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide">Events</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {filteredEvents.length}
            </p>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-[#252535] rounded-xl">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide">Participants</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {filteredEvents.reduce(
                (sum, e) => sum + (e.participantCount || 0),
                0,
              )}
            </p>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-[#252535] rounded-xl">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide">Attendance</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {filteredEvents.reduce(
                (sum, e) => sum + (e.attendanceCount || 0),
                0,
              )}
            </p>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-[#252535] rounded-xl">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide">Certificates</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {filteredEvents.reduce(
                (sum, e) => sum + (e.certificateCount || 0),
                0,
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Lifecycle Management Modal */}
      {showLifecycleModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1a1a2a] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-[#1a1a2a] border-b border-gray-200 dark:border-white/5 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Event Status Management
                </h2>
                <p className="text-gray-500 dark:text-zinc-400 mt-1">
                  {selectedEvent.title}
                </p>
              </div>
              <button
                onClick={() => setShowLifecycleModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Current Status */}
              <div className="bg-[#B9FF66]/10 border border-[#B9FF66]/30 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white rounded-lg shadow-sm">
                    <Circle size={20} className="text-[#191A23]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Current Status:{" "}
                      {selectedEvent.status?.charAt(0).toUpperCase() +
                        selectedEvent.status?.slice(1)}
                    </h3>
                    <p className="text-gray-600 dark:text-zinc-400 text-sm mt-1">
                      Event is currently in {selectedEvent.status} status
                    </p>
                  </div>
                </div>
              </div>

              {/* Lifecycle Timeline */}
              <div className="relative py-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Lifecycle Stages
                </h3>

                {/* Progress Line */}
                <div
                  className="absolute top-[calc(3rem+28px)] left-0 right-0 h-1 bg-gray-200 hidden md:block"
                  style={{ marginLeft: "10%", marginRight: "10%" }}
                >
                  <div
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{
                      width: `${
                        ([
                          "draft",
                          "upcoming",
                          "ongoing",
                          "completed",
                          "cancelled",
                        ].indexOf(selectedEvent.status) /
                          4) *
                        100
                      }%`,
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 relative z-10">
                  {[
                    {
                      key: "draft",
                      label: "Draft",
                      icon: Circle,
                      color: "gray",
                    },
                    {
                      key: "upcoming",
                      label: "Upcoming",
                      icon: Clock,
                      color: "blue",
                    },
                    {
                      key: "ongoing",
                      label: "Ongoing",
                      icon: Play,
                      color: "green",
                    },
                    {
                      key: "completed",
                      label: "Completed",
                      icon: CheckCircle,
                      color: "purple",
                    },
                    {
                      key: "cancelled",
                      label: "Cancelled",
                      icon: XCircle,
                      color: "red",
                    },
                  ].map((stage) => {
                    const isCurrent = stage.key === selectedEvent.status;
                    const StageIcon = stage.icon;
                    return (
                      <div
                        key={stage.key}
                        className="flex flex-col items-center"
                      >
                        <div
                          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                            isCurrent
                              ? `bg-${stage.color}-600 text-white shadow-md`
                              : "bg-gray-200 text-gray-400"
                          }`}
                        >
                          <StageIcon className="w-6 h-6" />
                        </div>
                        <span
                          className={`mt-3 text-sm font-medium text-center ${
                            isCurrent ? "text-gray-900" : "text-gray-400"
                          }`}
                        >
                          {stage.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Change Options */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Change Event Status
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    {
                      key: "draft",
                      label: "Draft",
                      icon: Circle,
                      description: "Not visible to participants",
                    },
                    {
                      key: "upcoming",
                      label: "Upcoming",
                      icon: Clock,
                      description: "Accepting registrations",
                    },
                    {
                      key: "ongoing",
                      label: "Ongoing",
                      icon: Play,
                      description: "Event is currently active",
                    },
                    {
                      key: "completed",
                      label: "Completed",
                      icon: CheckCircle,
                      description: "Event has ended",
                    },
                    {
                      key: "cancelled",
                      label: "Cancelled",
                      icon: XCircle,
                      description: "Event cancelled",
                    },
                  ].map((stage) => {
                    const isCurrent = stage.key === selectedEvent.status;
                    const StageIcon = stage.icon;
                    return (
                      <button
                        key={stage.key}
                        onClick={() => handleStatusChange(stage.key)}
                        disabled={isCurrent || updating}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          isCurrent
                            ? "border-[#191A23] dark:border-lime bg-[#B9FF66]/10 dark:bg-lime/10 shadow-sm"
                            : "border-gray-200 dark:border-white/10 hover:border-[#B9FF66] hover:bg-gray-50 dark:hover:bg-white/5"
                        } ${
                          isCurrent || updating
                            ? "cursor-not-allowed opacity-75"
                            : "cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 mb-2">
                          <StageIcon
                            size={20}
                            className={
                              isCurrent ? "text-[#191A23]" : "text-gray-500"
                            }
                          />
                          <span
                            className={`font-medium ${
                              isCurrent ? "text-[#191A23]" : "text-gray-700"
                            }`}
                          >
                            {stage.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {stage.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Warning */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                <AlertCircle
                  size={20}
                  className="text-amber-600 flex-shrink-0 mt-0.5"
                />
                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    Important Note
                  </p>
                  <p className="text-sm text-amber-800 mt-1">
                    Changing the event status will affect visibility and
                    participant registrations. Cancelled events cannot be
                    reverted.
                  </p>
                </div>
              </div>

              {updating && (
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Updating status...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyEvents;
