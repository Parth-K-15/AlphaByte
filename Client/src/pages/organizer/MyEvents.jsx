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
} from 'lucide-react';
import { getAssignedEvents } from '../../services/organizerApi';

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
        <div className="flex items-center gap-2 mt-4">
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
      </div>
    </div>
  );
};

const MyEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

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
            <EventCard key={event._id || event.id} event={event} />
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
    </div>
  );
};

export default MyEvents;
