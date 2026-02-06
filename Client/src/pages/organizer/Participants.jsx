import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Download,
  Upload,
  Mail,
  Trash2,
  Edit,
  MoreVertical,
  CheckCircle,
  XCircle,
  Phone,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { getParticipants, addParticipant, removeParticipant, updateParticipant, getAssignedEvents, markManualAttendance } from '../../services/organizerApi';

// Helper to check if ID is a valid MongoDB ObjectId
const isValidObjectId = (id) => /^[a-fA-F0-9]{24}$/.test(id);

const Participants = () => {
  const [searchParams] = useSearchParams();
  const [participants, setParticipants] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(searchParams.get('event') || '');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [newParticipant, setNewParticipant] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    isWalkIn: false,
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent && isValidObjectId(selectedEvent)) {
      fetchParticipants();
    } else {
      setLoading(false);
    }
  }, [selectedEvent, currentPage]);

  const fetchEvents = async () => {
    try {
      const organizerId = localStorage.getItem('userId');
      const response = await getAssignedEvents(organizerId);
      if (response.data.success) {
        setEvents(response.data.data);
        if (!selectedEvent && response.data.data.length > 0) {
          setSelectedEvent(response.data.data[0]._id || response.data.data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchParticipants = async () => {
    setLoading(true);
    try {
      const response = await getParticipants(selectedEvent, { 
        page: currentPage, 
        limit: 10,
        search: searchQuery,
        status: filter !== 'all' ? filter : undefined,
      });
      if (response.data.success) {
        setParticipants(response.data.data || []);
        setTotalPages(response.data.data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddParticipant = async () => {
    if (!selectedEvent || !isValidObjectId(selectedEvent)) {
      alert('Please select a real event first. Demo events cannot have participants added.');
      return;
    }
    try {
      const response = await addParticipant(selectedEvent, newParticipant);
      if (response.data.success) {
        setParticipants([response.data.data, ...participants]);
        setShowAddModal(false);
        setNewParticipant({ name: '', email: '', phone: '', organization: '', isWalkIn: false });
      }
    } catch (error) {
      console.error('Error adding participant:', error);
    }
  };

  const handleRemoveParticipant = async (participantId) => {
    if (!confirm('Are you sure you want to remove this participant?')) return;
    try {
      await removeParticipant(participantId);
      setParticipants(participants.filter((p) => p._id !== participantId));
    } catch (error) {
      console.error('Error removing participant:', error);
    }
  };

  const handleUpdateParticipant = async () => {
    try {
      const response = await updateParticipant(editingParticipant._id, editingParticipant);
      if (response.data.success) {
        setParticipants(participants.map((p) => 
          p._id === editingParticipant._id ? response.data.data : p
        ));
        setEditingParticipant(null);
      }
    } catch (error) {
      console.error('Error updating participant:', error);
    }
  };

  const handleMarkAttendance = async (participant) => {
    if (!selectedEvent || !isValidObjectId(selectedEvent)) {
      alert('Please select a valid event first');
      return;
    }

    if (participant.attendanceStatus === 'ATTENDED' || participant.hasAttended) {
      alert('Attendance already marked for this participant');
      return;
    }

    try {
      const response = await markManualAttendance(selectedEvent, participant._id);
      if (response.data.success) {
        // Update participant in the list
        setParticipants(participants.map((p) => 
          p._id === participant._id ? { ...p, attendanceStatus: 'ATTENDED', hasAttended: true } : p
        ));
        alert('Attendance marked successfully!');
        fetchParticipants(); // Refresh list
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert(error.response?.data?.message || 'Failed to mark attendance');
    }
  };

  const filteredParticipants = participants.filter((p) => {
    const matchesSearch = 
      p?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p?.organization?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || p.status === filter || 
      (filter === 'present' && (p.attendanceStatus === 'ATTENDED' || p.hasAttended)) ||
      (filter === 'absent' && p.attendanceStatus === 'ABSENT');
    return matchesSearch && matchesFilter;
  });

  const statusBadge = (status) => {
    const colors = {
      registered: 'bg-blue-100 text-blue-700',
      'walk-in': 'bg-purple-100 text-purple-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return <span className={`px-2 py-1 rounded-lg text-xs font-medium ${colors[status] || colors.registered}`}>{status}</span>;
  };

  const attendanceBadge = (status, hasAttended) => {
    if (status === 'ATTENDED' || hasAttended) {
      return (
        <span className="flex items-center gap-1 text-green-600 text-sm">
          <CheckCircle size={14} /> Present
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-gray-400 text-sm">
        <XCircle size={14} /> Absent
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Participants</h1>
          <p className="text-gray-500 mt-1">Manage event participants</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
        >
          <UserPlus size={18} />
          Add Participant
        </button>
      </div>

      {/* Event Selector & Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Event Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600">Event:</label>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {events && events.length > 0 ? events.map((event) => (
                <option key={event._id || event.id} value={event._id || event.id}>
                  {event.title || event.name}
                </option>
              )) : (
                <option value="">No events available</option>
              )}
            </select>
          </div>

          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, email, organization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="registered">Registered</option>
              <option value="walk-in">Walk-in</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50">
              <Download size={18} />
              Export
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50">
              <Upload size={18} />
              Import
            </button>
          </div>
        </div>
      </div>

      {/* Participants Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Info Banner */}
        {filteredParticipants.length > 0 && (
          <div className="bg-blue-50 border-b border-blue-100 px-6 py-3 flex items-center gap-2">
            <CheckCircle size={16} className="text-blue-600" />
            <p className="text-sm text-blue-700">
              <strong>Quick Tip:</strong> Use the checkboxes to manually mark attendance for participants.
            </p>
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading participants...</p>
          </div>
        ) : filteredParticipants.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">No participants found</h3>
            <p className="text-gray-500">Add participants or adjust your search filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-center px-4 py-4 text-sm font-medium text-gray-500 w-16">Mark</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Participant</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 hidden md:table-cell">Contact</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 hidden lg:table-cell">Organization</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 hidden lg:table-cell">Status</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 hidden lg:table-cell">Attendance</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 hidden lg:table-cell">Registered</th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredParticipants.map((participant) => (
                    <tr key={participant._id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={participant.attendanceStatus === 'ATTENDED' || participant.hasAttended}
                          onChange={() => handleMarkAttendance(participant)}
                          disabled={participant.attendanceStatus === 'ATTENDED' || participant.hasAttended}
                          className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-2 focus:ring-primary-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                          title={participant.hasAttended ? 'Already marked present' : 'Mark attendance'}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                            <span className="text-primary-600 font-medium">
                              {participant.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-gray-800">{participant.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Mail size={12} className="text-gray-400" />
                            {participant.email}
                          </p>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Phone size={12} className="text-gray-400" />
                            {participant.phone}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 hidden lg:table-cell">{participant.organization || '-'}</td>
                      <td className="px-6 py-4 hidden lg:table-cell">{statusBadge(participant.status || 'registered')}</td>
                      <td className="px-6 py-4 hidden lg:table-cell">{attendanceBadge(participant.attendanceStatus, participant.hasAttended)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 hidden lg:table-cell">
                        {new Date(participant.registeredAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingParticipant(participant)}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleRemoveParticipant(participant._id)}
                            className="p-2 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Showing {filteredParticipants.length} participants
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add Participant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Participant</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={newParticipant.name}
                  onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })}
                  placeholder="Enter full name"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={newParticipant.email}
                  onChange={(e) => setNewParticipant({ ...newParticipant, email: e.target.value })}
                  placeholder="Enter email address"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={newParticipant.phone}
                  onChange={(e) => setNewParticipant({ ...newParticipant, phone: e.target.value })}
                  placeholder="Enter phone number"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                <input
                  type="text"
                  value={newParticipant.organization}
                  onChange={(e) => setNewParticipant({ ...newParticipant, organization: e.target.value })}
                  placeholder="Enter organization name"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newParticipant.isWalkIn}
                  onChange={(e) => setNewParticipant({ ...newParticipant, isWalkIn: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-600">Walk-in Registration</span>
              </label>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddParticipant}
                className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
              >
                Add Participant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Participant Modal */}
      {editingParticipant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Edit Participant</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editingParticipant.name}
                  onChange={(e) => setEditingParticipant({ ...editingParticipant, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editingParticipant.email}
                  onChange={(e) => setEditingParticipant({ ...editingParticipant, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={editingParticipant.phone}
                  onChange={(e) => setEditingParticipant({ ...editingParticipant, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                <input
                  type="text"
                  value={editingParticipant.organization || ''}
                  onChange={(e) => setEditingParticipant({ ...editingParticipant, organization: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setEditingParticipant(null)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateParticipant}
                className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Participants;
