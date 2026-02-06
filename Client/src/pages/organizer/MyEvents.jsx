import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
} from 'lucide-react';
import { getAssignedEvents, updateEventLifecycle } from '../../services/organizerApi';

const EventCard = ({ event }) => {
  const statusColors = {
    upcoming: 'bg-blue-100 text-blue-700 border-blue-200',
    ongoing: 'bg-green-100 text-green-700 border-green-200',
    completed: 'bg-gray-100 text-gray-700 border-gray-200',
    draft: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'TBA';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Event Banner */}
      <div className="h-32 bg-gradient-to-r from-primary-500 to-primary-700 relative">
        {event.bannerImage && (
          <img src={event.bannerImage} alt={event.title} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-medium border ${statusColors[event.status]}`}>
          {event.status?.charAt(0).toUpperCase() + event.status?.slice(1)}
        </span>
      </div>

      {/* Event Details */}
      <div className="p-5">
        <h3 className="font-semibold text-lg text-gray-800 mb-2 line-clamp-1">{event.title}</h3>
        
        <div className="space-y-2 text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-gray-400" />
            <span>{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-gray-400" />
            <span>{event.time || '10:00 AM - 5:00 PM'}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-gray-400" />
            <span className="line-clamp-1">{event.venue || 'Online'}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 py-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-sm">
            <Users size={14} className="text-primary-500" />
            <span className="text-gray-700">{event.participantCount || 0}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <QrCode size={14} className="text-green-500" />
            <span className="text-gray-700">{event.attendanceCount || 0}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <Award size={14} className="text-purple-500" />
            <span className="text-gray-700">{event.certificateCount || 0}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 mt-4">
          <div className="flex items-center gap-2">
            <Link
              to={`/organizer/events/${event._id || event.id}`}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-primary-600 text-primary-600 rounded-xl hover:bg-primary-50 transition-colors font-medium text-sm"
            >
              <Eye size={16} />
              View Details
            </Link>
            <Link
              to={`/organizer/attendance/qr?event=${event._id || event.id}`}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium text-sm"
            >
              <QrCode size={16} />
              Attendance
            </Link>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              event.onManageLifecycle?.(event);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm"
          >
            <Settings size={16} />
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
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showLifecycleModal, setShowLifecycleModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const organizerId = localStorage.getItem('userId');
      const response = await getAssignedEvents(organizerId);
      if (response.data.success) {
        setEvents(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
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
      `Are you sure you want to change the event status to "${newStatus}"? This will affect event visibility and registrations.`
    );

    if (!confirmChange) return;

    try {
      setUpdating(true);
      const response = await updateEventLifecycle(selectedEvent._id || selectedEvent.id, newStatus);
      if (response.data.success) {
        alert('Event status updated successfully!');
        setShowLifecycleModal(false);
        fetchEvents(); // Refresh events list
      }
    } catch (error) {
      alert(error.message || 'Failed to update event status');
    } finally {
      setUpdating(false);
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesFilter = filter === 'all' || event.status === filter;
    const matchesSearch = event.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          event.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filters = [
    { key: 'all', label: 'All Events' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'ongoing', label: 'Ongoing' },
    { key: 'completed', label: 'Completed' },
    { key: 'draft', label: 'Draft' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Events</h1>
          <p className="text-gray-500 mt-1">Manage your assigned events</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === f.key
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
            <div key={i} className="bg-white rounded-2xl border border-gray-100 animate-pulse">
              <div className="h-32 bg-gray-200" />
              <div className="p-5 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
                <div className="h-4 bg-gray-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No events found</h3>
          <p className="text-gray-500">
            {searchQuery
              ? 'Try adjusting your search query'
              : 'You don\'t have any events assigned yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard 
              key={event._id || event.id} 
              event={{
                ...event,
                onManageLifecycle: handleManageLifecycle
              }} 
            />
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-2xl p-6 text-white">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-primary-100 text-sm">Total Events</p>
            <p className="text-3xl font-bold mt-1">{filteredEvents.length}</p>
          </div>
          <div>
            <p className="text-primary-100 text-sm">Total Participants</p>
            <p className="text-3xl font-bold mt-1">
              {filteredEvents.reduce((sum, e) => sum + (e.participantCount || 0), 0)}
            </p>
          </div>
          <div>
            <p className="text-primary-100 text-sm">Total Attendance</p>
            <p className="text-3xl font-bold mt-1">
              {filteredEvents.reduce((sum, e) => sum + (e.attendanceCount || 0), 0)}
            </p>
          </div>
          <div>
            <p className="text-primary-100 text-sm">Certificates Issued</p>
            <p className="text-3xl font-bold mt-1">
              {filteredEvents.reduce((sum, e) => sum + (e.certificateCount || 0), 0)}
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
                <h2 className="text-2xl font-bold text-gray-900">Event Status Management</h2>
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
                      Current Status: {selectedEvent.status?.charAt(0).toUpperCase() + selectedEvent.status?.slice(1)}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">
                      Event is currently in {selectedEvent.status} status
                    </p>
                  </div>
                </div>
              </div>

              {/* Lifecycle Timeline */}
              <div className="relative py-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Lifecycle Stages</h3>
                
                {/* Progress Line */}
                <div className="absolute top-[calc(3rem+28px)] left-0 right-0 h-1 bg-gray-200 hidden md:block" 
                     style={{ marginLeft: '10%', marginRight: '10%' }}>
                  <div 
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{ 
                      width: `${(
                        ['draft', 'upcoming', 'ongoing', 'completed', 'cancelled'].indexOf(selectedEvent.status) / 4
                      ) * 100}%` 
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 relative z-10">
                  {[
                    { key: 'draft', label: 'Draft', icon: Circle, color: 'gray' },
                    { key: 'upcoming', label: 'Upcoming', icon: Clock, color: 'blue' },
                    { key: 'ongoing', label: 'Ongoing', icon: Play, color: 'green' },
                    { key: 'completed', label: 'Completed', icon: CheckCircle, color: 'purple' },
                    { key: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'red' },
                  ].map((stage) => {
                    const isCurrent = stage.key === selectedEvent.status;
                    const StageIcon = stage.icon;
                    return (
                      <div key={stage.key} className="flex flex-col items-center">
                        <div
                          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                            isCurrent
                              ? `bg-${stage.color}-600 text-white shadow-md`
                              : 'bg-gray-200 text-gray-400'
                          }`}
                        >
                          <StageIcon className="w-6 h-6" />
                        </div>
                        <span
                          className={`mt-3 text-sm font-medium text-center ${
                            isCurrent ? 'text-gray-900' : 'text-gray-400'
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Event Status</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { key: 'draft', label: 'Draft', icon: Circle, description: 'Not visible to participants' },
                    { key: 'upcoming', label: 'Upcoming', icon: Clock, description: 'Accepting registrations' },
                    { key: 'ongoing', label: 'Ongoing', icon: Play, description: 'Event is currently active' },
                    { key: 'completed', label: 'Completed', icon: CheckCircle, description: 'Event has ended' },
                    { key: 'cancelled', label: 'Cancelled', icon: XCircle, description: 'Event cancelled' },
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
                            ? 'border-primary-600 bg-primary-50 shadow-sm'
                            : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                        } ${
                          isCurrent || updating ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 mb-2">
                          <StageIcon
                            size={20}
                            className={isCurrent ? 'text-primary-600' : 'text-gray-500'}
                          />
                          <span
                            className={`font-medium ${
                              isCurrent ? 'text-primary-700' : 'text-gray-700'
                            }`}
                          >
                            {stage.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{stage.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Warning */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">Important Note</p>
                  <p className="text-sm text-amber-800 mt-1">
                    Changing the event status will affect visibility and participant registrations.
                    Cancelled events cannot be reverted.
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
