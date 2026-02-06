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
    upcoming: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30',
    ongoing: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30',
    completed: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg shadow-gray-500/30',
    draft: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30',
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
    <div className="group bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
      {/* Event Banner */}
      <div className="h-32 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 relative overflow-hidden">
        {event.bannerImage && (
          <img src={event.bannerImage} alt={event.title} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <span className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-black ${statusColors[event.status]}`}>
          {event.status?.charAt(0).toUpperCase() + event.status?.slice(1)}
        </span>
      </div>

      {/* Event Details */}
      <div className="p-6">
        <h3 className="font-black text-lg text-gray-900 mb-3 line-clamp-1 group-hover:text-blue-600 transition-colors">{event.title}</h3>
        
        <div className="space-y-2.5 text-sm text-gray-700 mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-blue-500" strokeWidth={2.5} />
            <span className="font-bold">{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-purple-500" strokeWidth={2.5} />
            <span className="font-semibold">{event.time || '10:00 AM - 5:00 PM'}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-pink-500" strokeWidth={2.5} />
            <span className="line-clamp-1 font-semibold">{event.venue || 'Online'}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-5 py-3 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm">
            <Users size={16} className="text-blue-600" strokeWidth={2.5} />
            <span className="text-gray-900 font-black">{event.participantCount || 0}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <QrCode size={16} className="text-emerald-600" strokeWidth={2.5} />
            <span className="text-gray-900 font-black">{event.attendanceCount || 0}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Award size={16} className="text-purple-600" strokeWidth={2.5} />
            <span className="text-gray-900 font-black">{event.certificateCount || 0}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4">
          <Link
            to={`/organizer/events/${event._id || event.id}`}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100 transition-all font-bold text-sm hover:scale-105 hover:border-gray-400"
          >
            <Eye size={16} strokeWidth={2.5} />
            View Details
          </Link>
          <Link
            to={`/organizer/attendance/qr?event=${event._id || event.id}`}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-xl transition-all font-bold text-sm hover:scale-105 shadow-lg shadow-blue-500/30"
          >
            <QrCode size={16} strokeWidth={2.5} />
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
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-block">
            <h1 className="text-4xl font-black text-gray-900 mb-2 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text">My Events</h1>
            <div className="h-1 w-20 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"></div>
          </div>
          <p className="text-gray-600 mt-3 text-lg font-semibold">Manage your assigned events</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/60 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors" size={18} strokeWidth={2.5} />
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
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gradient-to-br hover:from-gray-200 hover:to-gray-100 hover:scale-105'
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
            <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 animate-pulse">
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
            <Calendar size={56} className="text-blue-500 opacity-50" strokeWidth={2} />
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-600 font-semibold">
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
      <div className="relative bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl p-8 border border-white/60 shadow-2xl overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-white/80 text-sm font-bold mb-1">Total Events</p>
            <p className="text-4xl font-black text-white">{filteredEvents.length}</p>
          </div>
          <div>
            <p className="text-white/80 text-sm font-bold mb-1">Total Participants</p>
            <p className="text-4xl font-black text-white">
              {filteredEvents.reduce((sum, e) => sum + (e.participantCount || 0), 0)}
            </p>
          </div>
          <div>
            <p className="text-white/80 text-sm font-bold mb-1">Total Attendance</p>
            <p className="text-4xl font-black text-white">
              {filteredEvents.reduce((sum, e) => sum + (e.attendanceCount || 0), 0)}
            </p>
          </div>
          <div>
            <p className="text-white/80 text-sm font-bold mb-1">Certificates Issued</p>
            <p className="text-4xl font-black text-white">
              {filteredEvents.reduce((sum, e) => sum + (e.certificateCount || 0), 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyEvents;
