import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  UserCog,
  Users,
  Plus,
  Trash2,
  Shield,
  Mail,
  Search,
  CheckCircle,
  XCircle,
  Edit,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { getTeamMembers, addTeamMember, removeTeamMember, updateTeamMemberPermissions, getAssignedEvents } from '../../services/organizerApi';

// Helper to check if ID is a valid MongoDB ObjectId
const isValidObjectId = (id) => /^[a-fA-F0-9]{24}$/.test(id);

const TeamAccess = () => {
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(searchParams.get('event') || '');
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [newMember, setNewMember] = useState({
    email: '',
    name: '',
    password: '12345678',
    permissions: {
      canViewParticipants: true,
      canManageAttendance: true,
      canSendEmails: false,
      canGenerateCertificates: false,
      canEditEvent: false,
    },
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent && isValidObjectId(selectedEvent)) {
      fetchTeamMembers();
    } else {
      setLoading(false);
    }
  }, [selectedEvent]);

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

  const fetchTeamMembers = async () => {
    setLoading(true);
    try {
      const response = await getTeamMembers(selectedEvent);
      if (response.data.success) {
        setTeamMembers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedEvent || !isValidObjectId(selectedEvent)) {
      alert('Please select an event first.');
      return;
    }
    try {
      const response = await addTeamMember(selectedEvent, newMember);
      if (response.data.success) {
        setTeamMembers([...teamMembers, response.data.data]);
        setShowAddModal(false);
        setNewMember({
          email: '',
          name: '',
          password: '12345678',
          permissions: {
            canViewParticipants: true,
            canManageAttendance: true,
            canSendEmails: false,
            canGenerateCertificates: false,
            canEditEvent: false,
          },
        });
        alert(response.data.message || 'Team member added successfully!');
      }
    } catch (error) {
      console.error('Error adding team member:', error);
      alert(error.response?.data?.message || 'Failed to add team member.');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;
    try {
      await removeTeamMember(selectedEvent, memberId);
      setTeamMembers(teamMembers.filter((m) => m._id !== memberId));
    } catch (error) {
      console.error('Error removing team member:', error);
    }
  };

  const handleUpdatePermissions = async () => {
    try {
      await updateTeamMemberPermissions(selectedEvent, editingMember._id, editingMember.permissions);
      setTeamMembers(teamMembers.map((m) => 
        m._id === editingMember._id ? { ...m, permissions: editingMember.permissions } : m
      ));
      setEditingMember(null);
    } catch (error) {
      console.error('Error updating permissions:', error);
    }
  };

  const displayEvents = events;
  const displayTeamMembers = teamMembers;

  const filteredMembers = displayTeamMembers.filter((member) =>
    member.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const permissionLabels = {
    canViewParticipants: { label: 'View Participants', icon: Users },
    canManageAttendance: { label: 'Manage Attendance', icon: CheckCircle },
    canSendEmails: { label: 'Send Emails', icon: Mail },
    canGenerateCertificates: { label: 'Generate Certificates', icon: Shield },
    canEditEvent: { label: 'Edit Event', icon: Edit },
  };

  const PermissionToggle = ({ permission, value, onChange, disabled = false }) => {
    const { label, icon: Icon } = permissionLabels[permission];
    return (
      <label className={`flex items-center justify-between p-3 rounded-xl border ${
        disabled ? 'bg-gray-50 border-gray-100' : 'border-gray-200 hover:border-gray-300'
      }`}>
        <div className="flex items-center gap-3">
          <Icon size={18} className="text-gray-400" />
          <span className="text-sm text-gray-700">{label}</span>
        </div>
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
        />
      </label>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Team Access</h1>
          <p className="text-gray-500 mt-1">Manage team members and their permissions</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 rounded-2xl p-4 flex items-start gap-3">
        <Shield size={20} className="text-blue-600 mt-0.5" />
        <div>
          <p className="text-sm text-blue-800 font-medium">Team Lead Access Only</p>
          <p className="text-sm text-blue-600 mt-1">
            Select an event below to view and manage team members assigned to it.
          </p>
        </div>
      </div>

      {/* Events List */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Events</h2>
        {displayEvents.length === 0 ? (
          <div className="text-center py-8">
            <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No events assigned yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayEvents.map((event) => (
              <button
                key={event._id || event.id}
                onClick={() => setSelectedEvent(event._id || event.id)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  selectedEvent === (event._id || event.id)
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-800 line-clamp-1">
                    {event.title || event.name}
                  </h3>
                  {selectedEvent === (event._id || event.id) && (
                    <CheckCircle size={20} className="text-primary-600 flex-shrink-0" />
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {event.date ? new Date(event.startDate || event.date).toLocaleDateString() : 'Date TBA'}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Team Members Section - Only show when event is selected */}
      {selectedEvent && isValidObjectId(selectedEvent) && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Team Members</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
            >
              <Plus size={18} />
              Add Member
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Team Members</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{displayTeamMembers.length}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl">
                  <Users size={20} className="text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">With Full Access</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {displayTeamMembers.filter((m) => 
                      Object.values(m.permissions || {}).every((v) => v === true)
                    ).length}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-xl">
                  <Shield size={20} className="text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Limited Access</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">
                    {displayTeamMembers.filter((m) => 
                      Object.values(m.permissions || {}).some((v) => v === false)
                    ).length}
                  </p>
                </div>
                <div className="p-3 bg-orange-50 rounded-xl">
                  <AlertTriangle size={20} className="text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search team members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Team Members Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                      <div className="h-3 bg-gray-100 rounded w-32" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-full" />
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
              <UserCog size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No team members found</h3>
              <p className="text-gray-500 mb-4">Add team members to help manage this event.</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700"
              >
                Add First Member
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMembers.map((member) => (
                <div key={member._id} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                        <span className="text-primary-600 font-bold text-lg">
                          {member.user?.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{member.user?.name}</h3>
                        <p className="text-sm text-gray-500">{member.user?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingMember(member)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleRemoveMember(member._id)}
                        className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Permissions */}
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 font-medium uppercase">Permissions</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(member.permissions || {}).map(([key, value]) => (
                        <span
                          key={key}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${
                            value
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {value ? <CheckCircle size={10} /> : <XCircle size={10} />}
                          {permissionLabels[key]?.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 mt-4">
                    Added {new Date(member.addedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Team Member</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  placeholder="Enter member name"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">Optional - will use email if not provided</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  placeholder="member@example.com"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="text"
                  value={newMember.password}
                  onChange={(e) => setNewMember({ ...newMember, password: e.target.value })}
                  placeholder="Enter password"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Default: 12345678 - Member will use this password to login
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                <div className="space-y-2">
                  {Object.keys(newMember.permissions).map((key) => (
                    <PermissionToggle
                      key={key}
                      permission={key}
                      value={newMember.permissions[key]}
                      onChange={(value) => setNewMember({
                        ...newMember,
                        permissions: { ...newMember.permissions, [key]: value }
                      })}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMember}
                className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
              >
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Permissions Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Edit Permissions</h3>
            
            <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <span className="text-primary-600 font-medium">
                  {editingMember.user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-800">{editingMember.user?.name}</p>
                <p className="text-sm text-gray-500">{editingMember.user?.email}</p>
              </div>
            </div>

            <div className="space-y-2">
              {Object.keys(editingMember.permissions || {}).map((key) => (
                <PermissionToggle
                  key={key}
                  permission={key}
                  value={editingMember.permissions[key]}
                  onChange={(value) => setEditingMember({
                    ...editingMember,
                    permissions: { ...editingMember.permissions, [key]: value }
                  })}
                />
              ))}
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setEditingMember(null)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePermissions}
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

export default TeamAccess;
