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
    upcoming: "UPCOMING",
    ongoing: "ONGOING", 
    completed: "COMPLETED",
    draft: "DRAFT",
  };

  const statusEmojis = {
    upcoming: "🔥",
    ongoing: "🚀",
    completed: "✅", 
    draft: "📝",
  };

  // Modern clean backgrounds for cards
  const gradients = [
    'from-[#B9FF66] via-[#A8EE55] to-[#B9FF66]',
    'from-[#191A23] via-[#2A2B33] to-[#191A23]',
    'from-gray-300 via-gray-400 to-gray-300',
    'from-[#B9FF66]/80 via-[#A8EE55]/80 to-[#B9FF66]/80',
    'from-[#191A23]/90 via-[#2A2B33]/90 to-[#191A23]/90'
  ];

  const formatDate = (dateStr) => {
    if (!dateStr) return "TBA";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric", 
      year: "numeric",
    });
  };

  const calculateDaysLeft = () => {
    if (!event.date) return null;
    const eventDate = new Date(event.date);
    const today = new Date();
    const diffTime = eventDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : null;
  };

  const daysLeft = calculateDaysLeft();
  const gradientIndex = Math.abs((event.title || '').length) % gradients.length;

  return (
    <div className="group relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
      {/* Background with Gradient */}
      <div className={`h-64 bg-gradient-to-br ${gradients[gradientIndex]} relative`}>
        {/* Overlay pattern for visual interest */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-8 left-8 w-24 h-24 bg-white/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-12 right-12 w-20 h-20 bg-white/15 rounded-full blur-xl"></div>
          <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-white/10 rounded-full blur-lg"></div>
        </div>

        {/* Status Badge */}
        <div className="absolute top-4 left-4">
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-white text-[#191A23] shadow-md">
            <span className="mr-1">{statusEmojis[event.status]}</span>
            {statusColors[event.status]}
          </span>
        </div>

        {/* Days Left Badge */}
        {daysLeft && daysLeft > 0 && (
          <div className="absolute top-4 right-4">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-[#191A23] text-[#B9FF66] shadow-md">
              {daysLeft} DAYS LEFT
            </span>
          </div>
        )}

        {/* Event Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
          <h3 className="text-white font-bold text-xl mb-3 leading-tight">
            {event.title}
          </h3>

          {/* Location & Date */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-white/90 text-sm">
              <MapPin size={14} className="mr-2" />
              <span>{event.venue || "Online Event"} 🌐</span>
              {event.venue && event.venue !== "Online" && (
                <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-md text-xs font-medium">
                  {event.venue.includes('India') ? '🇮🇳' : '🌍'} +2 more
                </span>
              )}
            </div>
            
            <div className="flex items-center text-white/90 text-sm">
              <Calendar size={14} className="mr-2" />
              <span className="font-medium">{formatDate(event.date)}</span>
            </div>
          </div>

          {/* Bottom Row: Organizer & Stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center text-white/80 text-xs">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-2">
                <Users size={14} />
              </div>
              <div>
                <div className="font-medium">Lead Organizer</div>
                <div className="text-white/70">{event.teamLead?.name || 'Event Team'}</div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-4 text-white text-xs">
              <div className="text-center">
                <div className="font-bold text-sm">{event.participantCount || 0}</div>
                <div className="text-white/70">Registered</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-sm">{event.attendanceCount || 0}</div>
                <div className="text-white/70">Attended</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white p-4">
        <div className="flex items-center gap-3">
          <Link
            to={`/organizer/events/${event._id || event.id}`}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 
               border-2 border-gray-300 text-[#191A23] rounded-xl font-semibold text-sm
               hover:bg-gray-50 hover:border-[#191A23] transition-all"
          >
            <Eye size={16} />
            View Details
          </Link>

          <Link
            to={`/organizer/attendance/qr?event=${event._id || event.id}`}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5
               bg-[#B9FF66] text-[#191A23] 
               rounded-xl font-semibold text-sm hover:bg-[#A8EE55] 
               transition-all shadow-md hover:shadow-lg"
          >
            <QrCode size={16} />
            Attendance
          </Link>
        </div>

        {/* Lifecycle Management */}
        <button
          onClick={(e) => {
            e.preventDefault();
            event.onManageLifecycle?.(event);
          }}
          className="w-full flex items-center justify-center gap-2 mt-3
             px-4 py-2.5 border-2 border-gray-300 text-[#191A23] 
             rounded-xl font-semibold text-sm 
             hover:bg-gray-50 hover:border-[#191A23] transition-all"
        >
          <Settings size={16} />
          Manage Status
        </button>
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
            <div className="h-1 w-20 bg-[#B9FF66] rounded-full"></div>
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
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B9FF66] focus:border-transparent text-sm font-semibold hover:border-[#B9FF66] transition-all shadow-sm"
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
                    ? "bg-[#191A23] text-[#B9FF66] shadow-lg shadow-[#191A23]/30 scale-105"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105"
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
          <div className="p-4 bg-[#B9FF66]/10 rounded-2xl shadow-md inline-block mb-4">
            <Calendar
              size={56}
              className="text-[#191A23] opacity-50"
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
      <div className="relative bg-[#191A23] rounded-2xl p-8 border border-[#191A23]/10 shadow-2xl overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>

        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-gray-400 text-sm font-bold mb-1">Total Events</p>
            <p className="text-4xl font-black text-[#B9FF66]">
              {filteredEvents.length}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm font-bold mb-1">
              Total Participants
            </p>
            <p className="text-4xl font-black text-[#B9FF66]">
              {filteredEvents.reduce(
                (sum, e) => sum + (e.participantCount || 0),
                0,
              )}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm font-bold mb-1">
              Total Attendance
            </p>
            <p className="text-4xl font-black text-[#B9FF66]">
              {filteredEvents.reduce(
                (sum, e) => sum + (e.attendanceCount || 0),
                0,
              )}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm font-bold mb-1">
              Certificates Issued
            </p>
            <p className="text-4xl font-black text-[#B9FF66]">
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
              <div className="bg-[#B9FF66]/10 border border-[#B9FF66]/30 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white rounded-lg shadow-sm">
                    <Circle size={20} className="text-[#191A23]" />
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
                            ? "border-[#191A23] bg-[#B9FF66]/10 shadow-sm"
                            : "border-gray-200 hover:border-[#B9FF66] hover:bg-gray-50"
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
