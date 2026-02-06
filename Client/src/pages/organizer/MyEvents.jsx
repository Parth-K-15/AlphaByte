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
  Filter,
  Search,
  ChevronRight,
  Circle,
  Play,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  X,
  Loader2,
} from "lucide-react";
import {
  getAssignedEvents,
  updateEventLifecycle,
} from "../../services/organizerApi";

const EventCard = ({ event }) => {
  const statusColors = {
    upcoming:
      "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30",
    ongoing:
      "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30",
    completed:
      "bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg shadow-gray-500/30",
    draft:
      "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30",
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

  return (
    <div className="group bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
      {/* Event Banner */}
      <div className="h-32 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 relative overflow-hidden">
        {event.bannerImage && (
          <img
            src={event.bannerImage}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <span
          className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-black ${statusColors[event.status]}`}
        >
          {event.status?.charAt(0).toUpperCase() + event.status?.slice(1)}
        </span>
      </div>

      {/* Event Details */}
      <div className="p-6">
        <h3 className="font-black text-lg text-gray-900 mb-3 line-clamp-1 group-hover:text-blue-600 transition-colors">
          {event.title}
        </h3>

        <div className="space-y-2.5 text-sm text-gray-700 mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-blue-500" strokeWidth={2.5} />
            <span className="font-bold">{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-purple-500" strokeWidth={2.5} />
            <span className="font-semibold">
              {event.time || "10:00 AM - 5:00 PM"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-pink-500" strokeWidth={2.5} />
            <span className="line-clamp-1 font-semibold">
              {event.venue || "Online"}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-5 py-3 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm">
            <Users size={16} className="text-blue-600" strokeWidth={2.5} />
            <span className="text-gray-900 font-black">
              {event.participantCount || 0}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <QrCode size={16} className="text-emerald-600" strokeWidth={2.5} />
            <span className="text-gray-900 font-black">
              {event.attendanceCount || 0}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Award size={16} className="text-purple-600" strokeWidth={2.5} />
            <span className="text-gray-900 font-black">
              {event.certificateCount || 0}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 mt-4">
          {/* Top Row: View + Attendance */}
          <div className="flex items-center gap-2">
            <Link
              to={`/organizer/events/${event._id || event.id}`}
              className="flex-1 flex items-center justify-center gap-2 
                 px-4 py-3 border-2 border-gray-300 text-gray-700 
                 rounded-xl font-bold text-sm 
                 hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100 
                 hover:scale-105 hover:border-gray-400 
                 transition-all"
            >
              <Eye size={16} strokeWidth={2.5} />
              View Details
            </Link>

            <Link
              to={`/organizer/attendance/qr?event=${event._id || event.id}`}
              className="flex-1 flex items-center justify-center gap-2 
                 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 
                 text-white rounded-xl font-bold text-sm 
                 hover:scale-105 hover:shadow-xl 
                 transition-all shadow-lg shadow-blue-500/30"
            >
              <QrCode size={16} strokeWidth={2.5} />
              Attendance
            </Link>
          </div>

          {/* Bottom Row: Manage Status */}
          <button
            onClick={(e) => {
              e.preventDefault();
              event.onManageLifecycle?.(event);
            }}
            className="w-full flex items-center justify-center gap-2 
               px-4 py-3 border-2 border-gray-300 text-gray-700 
               rounded-xl font-bold text-sm 
               hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100 
               hover:scale-105 hover:border-gray-400 
               transition-all"
          >
            <Settings size={16} strokeWidth={2.5} />
            Manage Status
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
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-block">
            <h1 className="text-4xl font-black text-gray-900 mb-2 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text">
              My Events
            </h1>
            <div className="h-1 w-20 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"></div>
          </div>
          <p className="text-gray-600 mt-3 text-lg font-semibold">
            Manage your assigned events
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/60 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 group">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors"
              size={18}
              strokeWidth={2.5}
            />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-semibold hover:border-blue-300 transition-all shadow-sm"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                  filter === f.key
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30 scale-105"
                    : "bg-gray-100 text-gray-700 hover:bg-gradient-to-br hover:from-gray-200 hover:to-gray-100 hover:scale-105"
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
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 animate-pulse"
            >
              <div className="h-32 bg-gradient-to-br from-gray-200 to-gray-300" />
              <div className="p-6 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
                <div className="h-4 bg-gray-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-16 text-center border border-white/60 shadow-lg">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-md inline-block mb-4">
            <Calendar
              size={56}
              className="text-blue-500 opacity-50"
              strokeWidth={2}
            />
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-2">
            No events found
          </h3>
          <p className="text-gray-600 font-semibold">
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

      {/* Summary Stats */}
      <div className="relative bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl p-8 border border-white/60 shadow-2xl overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>

        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-white/80 text-sm font-bold mb-1">Total Events</p>
            <p className="text-4xl font-black text-white">
              {filteredEvents.length}
            </p>
          </div>
          <div>
            <p className="text-white/80 text-sm font-bold mb-1">
              Total Participants
            </p>
            <p className="text-4xl font-black text-white">
              {filteredEvents.reduce(
                (sum, e) => sum + (e.participantCount || 0),
                0,
              )}
            </p>
          </div>
          <div>
            <p className="text-white/80 text-sm font-bold mb-1">
              Total Attendance
            </p>
            <p className="text-4xl font-black text-white">
              {filteredEvents.reduce(
                (sum, e) => sum + (e.attendanceCount || 0),
                0,
              )}
            </p>
          </div>
          <div>
            <p className="text-white/80 text-sm font-bold mb-1">
              Certificates Issued
            </p>
            <p className="text-4xl font-black text-white">
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
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Event Status Management
                </h2>
                <p className="text-gray-500 mt-1">{selectedEvent.title}</p>
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
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white rounded-lg shadow-sm">
                    <Circle size={20} className="text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Current Status:{" "}
                      {selectedEvent.status?.charAt(0).toUpperCase() +
                        selectedEvent.status?.slice(1)}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">
                      Event is currently in {selectedEvent.status} status
                    </p>
                  </div>
                </div>
              </div>

              {/* Lifecycle Timeline */}
              <div className="relative py-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
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
                            ? "border-primary-600 bg-primary-50 shadow-sm"
                            : "border-gray-200 hover:border-primary-300 hover:bg-gray-50"
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
                              isCurrent ? "text-primary-600" : "text-gray-500"
                            }
                          />
                          <span
                            className={`font-medium ${
                              isCurrent ? "text-primary-700" : "text-gray-700"
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
