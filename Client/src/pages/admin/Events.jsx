import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Archive,
  UserPlus,
  Eye,
  Calendar,
  Loader2,
} from 'lucide-react';
import { eventsApi } from '../../services/api';

const Events = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showActions, setShowActions] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await eventsApi.delete(id);
        setEvents(events.filter((event) => event._id !== id));
        setShowActions(null);
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      Live: 'bg-green-100 text-green-700',
      Upcoming: 'bg-blue-100 text-blue-700',
      Completed: 'bg-gray-100 text-gray-700',
      Draft: 'bg-yellow-100 text-yellow-700',
      Archived: 'bg-purple-100 text-purple-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  const filteredEvents = events.filter((event) => {
    const eventName = event.title || event.name || '';
    const matchesSearch = eventName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || (event.status || '').toLowerCase() === filterStatus;
    return matchesSearch && matchesFilter;
  });

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
          <h1 className="text-2xl font-bold text-gray-800">All Events</h1>
          <p className="text-gray-500 mt-1">Manage and monitor all your events</p>
        </div>
        <Link to="/admin/events/create" className="btn-primary flex items-center gap-2 w-fit">
          <Plus size={20} />
          Create Event
        </Link>
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
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                  Event Name
                </th>
                <th className="hidden md:table-cell text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="hidden md:table-cell text-left px-6 py-4 text-sm font-semibold text-gray-600">Dates</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                  Team Lead
                </th>
                <th className="hidden lg:table-cell text-left px-6 py-4 text-sm font-semibold text-gray-600">
                  Participants
                </th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEvents.map((event) => (
                <tr key={event._id || event.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                        <Calendar size={20} className="text-primary-600" />
                      </div>
                      <span className="font-medium text-gray-800">{event.title || event.name}</span>
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                        event.status
                      )}`}
                    >
                      {event.status || 'Draft'}
                    </span>
                  </td>
                  <td className="hidden md:table-cell px-6 py-4 text-sm text-gray-600">
                    {event.startDate ? new Date(event.startDate).toLocaleDateString() : 'TBD'} -{' '}
                    {event.endDate ? new Date(event.endDate).toLocaleDateString() : 'TBD'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {event.teamLead?.name || 'Unassigned'}
                  </td>
                  <td className="hidden lg:table-cell px-6 py-4 text-sm text-gray-600">
                    {event.participantCount || event.participants?.length || 0}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2 relative">
                      <button
                        onClick={() => setShowActions(showActions === (event._id || event.id) ? null : (event._id || event.id))}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <MoreVertical size={18} className="text-gray-500" />
                      </button>

                      {showActions === (event._id || event.id) && (
                        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-2 min-w-[160px]">
                          <Link
                            to={`/admin/events/${event._id || event.id}`}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Eye size={16} />
                            View Details
                          </Link>
                          <Link
                            to={`/admin/events/${event._id || event.id}/edit`}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Edit size={16} />
                            Edit Event
                          </Link>
                          <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                            <UserPlus size={16} />
                            Assign Lead
                          </button>
                          <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                            <Archive size={16} />
                            Archive
                          </button>
                          <hr className="my-2" />
                          <button
                            onClick={() => handleDelete(event._id || event.id)}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredEvents.length === 0 && !loading && (
          <div className="text-center py-12">
            <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">No events found</h3>
            <p className="text-gray-500">
              {events.length === 0
                ? 'Create your first event to get started'
                : 'Try adjusting your search or filter criteria'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
