import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  Eye,
  Calendar,
  UserCog,
  UsersRound,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { eventsApi } from '../../services/api';

const TeamManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await eventsApi.getAll();
      if (response.success) {
        setEvents(response.data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      live: 'bg-green-100 text-green-700',
      upcoming: 'bg-blue-100 text-blue-700',
      completed: 'bg-gray-100 text-gray-700',
      draft: 'bg-yellow-100 text-yellow-700',
      archived: 'bg-purple-100 text-purple-700',
      ongoing: 'bg-emerald-100 text-emerald-700',
    };
    return styles[status?.toLowerCase()] || 'bg-gray-100 text-gray-700';
  };

  const filteredEvents = events.filter((event) => {
    const eventName = event.title || event.name || '';
    const matchesSearch = eventName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || (event.status || '').toLowerCase() === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleViewTeam = (eventId) => {
    navigate(`/admin/team/events/${eventId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={40} className="animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Team Management</h1>
          <p className="text-gray-500 mt-1">Manage teams, roles, and permissions for each event</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Users size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-800">Event-Specific Team Management</p>
          <p className="text-sm text-blue-700 mt-1">
            Select an event to manage its team lead, organizers, and configure role-specific permissions
            for that event only.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field pl-10 pr-10 appearance-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="live">Live</option>
              <option value="ongoing">Ongoing</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="card overflow-hidden p-0">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center">
            <Users size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No events found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                    Event Name
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Dates</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                    Team Lead
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                    Team Size
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEvents.map((event) => (
                  <tr key={event._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Calendar className="text-primary-600" size={20} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{event.title || event.name}</p>
                          <p className="text-sm text-gray-500">{event.category || 'General'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                          event.status
                        )}`}
                      >
                        {event.status || 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {event.startDate
                        ? new Date(event.startDate).toLocaleDateString()
                        : 'Not set'}
                    </td>
                    <td className="px-6 py-4">
                      {event.teamLead ? (
                        <div className="flex items-center gap-2">
                          <UserCog size={16} className="text-primary-600" />
                          <span className="text-sm text-gray-900">
                            {event.teamLead.name || 'Assigned'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Not assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <UsersRound size={16} className="text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {event.teamMembers?.length || 0} member{event.teamMembers?.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewTeam(event._id)}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <Eye size={16} />
                          Manage Team
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamManagement;
