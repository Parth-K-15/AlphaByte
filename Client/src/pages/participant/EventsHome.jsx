import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = 'http://localhost:5000/api';

const EventsHome = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    fetchEvents();
  }, [search, statusFilter, typeFilter]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('type', typeFilter);

      const response = await fetch(`${API_BASE}/participant/events?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setEvents(data.data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      upcoming: 'bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-800 border border-cyan-200',
      ongoing: 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200',
      completed: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-200',
    };
    return badges[status] || 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-200';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBA';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 rounded-3xl p-10 text-white shadow-2xl overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-black mb-3">Discover Events</h1>
          <p className="text-cyan-100 text-lg font-semibold">Find and register for amazing events happening around you</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/60">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </div>
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white/70 backdrop-blur-sm font-semibold transition-all"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 font-semibold bg-white/70 backdrop-blur-sm transition-all"
          >
            <option value="">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 font-semibold bg-white/70 backdrop-blur-sm transition-all"
          >
            <option value="">All Types</option>
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-500 border-t-transparent"></div>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-16 text-center border border-white/60">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-5xl">📭</span>
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-2">No Events Found</h3>
          <p className="text-gray-600 font-semibold">Check back later for upcoming events!</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Link
              key={event._id}
              to={`/participant/event/${event._id}`}
              className="group bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-white/60"
            >
              {/* Event Banner */}
              <div className="relative h-48 bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 overflow-hidden">
                {event.bannerImage && (
                  <img
                    src={event.bannerImage}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                )}
                <div className="absolute top-3 right-3">
                  <span className={`px-3 py-1.5 rounded-xl text-xs font-black capitalize shadow-lg ${getStatusBadge(event.status)}`}>
                    {event.status}
                  </span>
                </div>
                {event.type && (
                  <div className="absolute bottom-3 left-3">
                    <span className="px-3 py-1.5 bg-black/60 backdrop-blur-sm text-white text-xs rounded-xl font-bold shadow-lg">
                      {event.type}
                    </span>
                  </div>
                )}
              </div>

              {/* Event Info */}
              <div className="p-5">
                <h3 className="font-black text-lg text-gray-900 mb-3 line-clamp-1 group-hover:text-cyan-600 transition-colors">
                  {event.title}
                </h3>
                
                <div className="space-y-2.5 text-sm text-gray-700 font-semibold">
                  <div className="flex items-center gap-2">
                    <span>📅</span>
                    <span>{formatDate(event.startDate)}</span>
                  </div>
                  
                  {(event.location || event.venue) && (
                    <div className="flex items-center gap-2">
                      <span>📍</span>
                      <span className="line-clamp-1">{event.venue || event.location}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className={`font-black ${event.registrationFee > 0 ? 'text-emerald-600' : 'text-gray-600'}`}>
                      {event.registrationFee > 0 ? `₹${event.registrationFee}` : 'Free'}
                    </span>
                    
                    {event.spotsLeft !== null && (
                      <span className={`text-xs font-bold ${event.spotsLeft <= 10 ? 'text-red-600' : 'text-gray-600'}`}>
                        {event.spotsLeft > 0 ? `${event.spotsLeft} spots left` : 'Full'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Tags */}
                {event.tags && event.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {event.tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="px-3 py-1 bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-700 text-xs rounded-xl font-bold border border-cyan-100">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventsHome;
