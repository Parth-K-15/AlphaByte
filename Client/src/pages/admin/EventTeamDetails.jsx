import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  UserCog,
  UsersRound,
  Shield,
  Plus,
  Trash2,
  Save,
  Calendar,
  MapPin,
  Check,
  X,
  Loader2,
  Edit,
} from 'lucide-react';
import { eventsApi, teamsApi } from '../../services/api';

const EventTeamDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [event, setEvent] = useState(null);
  const [allTeamLeads, setAllTeamLeads] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAddTeamLeadModal, setShowAddTeamLeadModal] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedTeamLeadId, setSelectedTeamLeadId] = useState('');
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editingPermissions, setEditingPermissions] = useState({});

  // Team Lead Permissions (default)
  const [teamLeadPermissions, setTeamLeadPermissions] = useState({
    canEditEvent: true,
    canManageAttendance: true,
    canSendEmails: true,
    canGenerateCertificates: true,
    canViewParticipants: true,
  });

  // Team Member Permissions (default)
  const [teamMemberPermissions, setTeamMemberPermissions] = useState({
    canEditEvent: false,
    canManageAttendance: true,
    canSendEmails: false,
    canGenerateCertificates: false,
    canViewParticipants: true,
  });

  useEffect(() => {
    fetchEventDetails();
    fetchTeamData();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const response = await eventsApi.getOne(eventId);
      if (response.success) {
        const eventData = response.data;
        
        // Ensure team lead is in teamMembers array if it exists but not there
        if (eventData.teamLead && eventData.teamMembers) {
          const leadInTeam = eventData.teamMembers.find(
            (m) => m.user?._id === eventData.teamLead._id || m.user?._id === eventData.teamLead
          );
          
          // If team lead is set but not in teamMembers, add them to display
          if (!leadInTeam) {
            eventData.teamMembers = eventData.teamMembers || [];
            eventData.teamMembers.unshift({
              user: eventData.teamLead,
              role: 'TEAM_LEAD',
              permissions: teamLeadPermissions,
              addedAt: eventData.createdAt || new Date()
            });
          }
        }
        
        setEvent(eventData);
        
        // Load existing permissions if available
        if (eventData.teamMembers) {
          const leadMember = eventData.teamMembers.find(
            (m) => m.role === 'TEAM_LEAD'
          );
          if (leadMember?.permissions) {
            setTeamLeadPermissions(leadMember.permissions);
          }

          // Get common permissions for team members (excluding team lead)
          const members = eventData.teamMembers.filter(
            (m) => m.role === 'TEAM_MEMBER'
          );
          if (members.length > 0 && members[0].permissions) {
            setTeamMemberPermissions(members[0].permissions);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching event:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamData = async () => {
    try {
      const [leadsRes, membersRes] = await Promise.all([
        teamsApi.getTeamLeads(),
        teamsApi.getMembers(),
      ]);
      setAllTeamLeads(leadsRes.data || []);
      setAllMembers(membersRes.data || []);
    } catch (error) {
      console.error('Error fetching team data:', error);
    }
  };

  const handleAddTeamLead = async () => {
    if (!selectedTeamLeadId) {
      alert('Please select a team lead');
      return;
    }

    try {
      await eventsApi.addTeamLead(eventId, {
        userId: selectedTeamLeadId,
        permissions: teamLeadPermissions,
      });
      setShowAddTeamLeadModal(false);
      setSelectedTeamLeadId('');
      fetchEventDetails();
    } catch (error) {
      console.error('Error adding team lead:', error);
      alert(error.message || 'Failed to add team lead');
    }
  };

  const handleRemoveTeamLead = async (userId) => {
    if (!confirm('Are you sure you want to remove this team lead?')) return;

    try {
      await eventsApi.removeTeamLead(eventId, userId);
      fetchEventDetails();
    } catch (error) {
      console.error('Error removing team lead:', error);
      alert('Failed to remove team lead');
    }
  };

  const handleAddTeamMember = async () => {
    if (!selectedMemberId) {
      alert('Please select a member');
      return;
    }

    try {
      // Add member with default permissions
      await eventsApi.addTeamMember(eventId, {
        userId: selectedMemberId,
        permissions: teamMemberPermissions,
      });
      setShowAddMemberModal(false);
      setSelectedMemberId('');
      fetchEventDetails();
    } catch (error) {
      console.error('Error adding team member:', error);
      alert('Failed to add team member');
    }
  };

  const handleRemoveTeamMember = async (userId) => {
    if (!confirm('Are you sure you want to remove this member from the event?')) return;

    try {
      await eventsApi.removeTeamMember(eventId, userId);
      fetchEventDetails();
    } catch (error) {
      console.error('Error removing team member:', error);
      alert('Failed to remove team member');
    }
  };

  const handleEditMemberPermissions = (member) => {
    setEditingMemberId(member.user?._id);
    setEditingPermissions(member.permissions || teamMemberPermissions);
  };

  const handleSaveMemberPermissions = async () => {
    if (!editingMemberId) return;
    
    setSaving(true);
    try {
      await eventsApi.updateTeamMemberPermissions(eventId, editingMemberId, editingPermissions);
      setEditingMemberId(null);
      setEditingPermissions({});
      alert('Permissions updated successfully!');
      fetchEventDetails();
    } catch (error) {
      console.error('Error updating member permissions:', error);
      alert('Failed to update permissions');
    } finally {
      setSaving(false);
    }
  };

  const toggleEditingPermission = (key) => {
    setEditingPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSavePermissions = async () => {
    setSaving(true);
    try {
      await eventsApi.updateEventPermissions(eventId, {
        teamLeadPermissions,
        teamMemberPermissions,
      });
      alert('Permissions updated successfully!');
      fetchEventDetails();
    } catch (error) {
      console.error('Error updating permissions:', error);
      alert('Failed to update permissions');
    } finally {
      setSaving(false);
    }
  };

  const toggleTeamLeadPermission = (key) => {
    setTeamLeadPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleTeamMemberPermission = (key) => {
    setTeamMemberPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const permissionsList = [
    {
      key: 'canEditEvent',
      label: 'Edit Event',
      description: 'Can modify event details and settings',
    },
    {
      key: 'canManageAttendance',
      label: 'Manage Attendance',
      description: 'Can mark and track participant attendance',
    },
    {
      key: 'canSendEmails',
      label: 'Send Emails',
      description: 'Can send communications to participants',
    },
    {
      key: 'canGenerateCertificates',
      label: 'Generate Certificates',
      description: 'Can create and distribute certificates',
    },
    {
      key: 'canViewParticipants',
      label: 'View Participants',
      description: 'Can access participant lists and information',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={40} className="animate-spin text-primary-600" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Event not found</p>
      </div>
    );
  }

  const currentTeamLeads = event.teamMembers?.filter((m) => m.role === 'TEAM_LEAD') || [];
  const currentTeamMembers = event.teamMembers?.filter((m) => m.role === 'TEAM_MEMBER') || [];
  const assignedUserIds = event.teamMembers?.map((m) => m.user?._id) || [];
  
  const availableTeamLeads = allTeamLeads.filter(
    (lead) => !assignedUserIds.includes(lead._id)
  );
  
  const availableMembers = allMembers.filter(
    (member) => !assignedUserIds.includes(member._id)
  );

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/admin/team')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft size={20} />
        Back to Team Management
      </button>

      {/* Event Header */}
      <div className="card">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Calendar className="text-primary-600" size={32} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800">{event.title || event.name}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
              {event.startDate && (
                <div className="flex items-center gap-1">
                  <Calendar size={16} />
                  {new Date(event.startDate).toLocaleDateString()}
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-1">
                  <MapPin size={16} />
                  {event.location}
                </div>
              )}
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  event.status === 'live'
                    ? 'bg-green-100 text-green-700'
                    : event.status === 'upcoming'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {event.status || 'Draft'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Team Lead Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <UserCog className="text-primary-600" size={24} />
            <h2 className="text-xl font-bold text-gray-800">Team Leads</h2>
            <span className="text-sm text-gray-500">({currentTeamLeads.length})</span>
          </div>
          <button
            onClick={() => setShowAddTeamLeadModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Add Team Lead
          </button>
        </div>

        {currentTeamLeads.length > 0 ? (
          <div className="space-y-3">
            {currentTeamLeads.map((leadMember) => (
              <div key={leadMember.user?._id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {leadMember.user?.name
                          ?.split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .substring(0, 2) || '??'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{leadMember.user?.name}</p>
                      <p className="text-sm text-gray-600">{leadMember.user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingMemberId(leadMember.user?._id);
                        setEditingPermissions(leadMember.permissions || teamLeadPermissions);
                      }}
                      className="text-primary-600 hover:bg-primary-50 p-2 rounded-lg transition-colors"
                      title="Edit permissions"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleRemoveTeamLead(leadMember.user?._id)}
                      className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      title="Remove team lead"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                {/* Show team lead's current permissions */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 pt-3 border-t border-gray-200">
                  {permissionsList.map((perm) => {
                    const hasPermission = leadMember.permissions?.[perm.key];
                    return (
                      <div
                        key={perm.key}
                        className={`text-xs px-2 py-1 rounded ${
                          hasPermission
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                        title={perm.description}
                      >
                        {hasPermission ? <Check size={12} className="inline mr-1" /> : <X size={12} className="inline mr-1" />}
                        {perm.label}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <UserCog size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 mb-2">No team leads assigned to this event yet</p>
            <p className="text-sm text-gray-400">Click "Add Team Lead" above to assign team leads</p>
          </div>
        )}
      </div>

      {/* Team Members Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <UsersRound className="text-primary-600" size={24} />
            <h2 className="text-xl font-bold text-gray-800">Team Members / Organizers</h2>
          </div>
          <button
            onClick={() => setShowAddMemberModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Add Member
          </button>
        </div>

        {currentTeamMembers.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <UsersRound size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No team members assigned yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentTeamMembers.map((member) => (
              <div
                key={member.user?._id}
                className="bg-gray-50 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-gray-700 font-medium">
                        {member.user?.name
                          ?.split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .substring(0, 2) || '??'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{member.user?.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-600">{member.user?.email || ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditMemberPermissions(member)}
                      className="text-primary-600 hover:bg-primary-50 p-2 rounded-lg transition-colors"
                      title="Edit permissions"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleRemoveTeamMember(member.user?._id)}
                      className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      title="Remove member"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                {/* Show member's current permissions */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 pt-3 border-t border-gray-200">
                  {permissionsList.map((perm) => {
                    const hasPermission = member.permissions?.[perm.key];
                    return (
                      <div
                        key={perm.key}
                        className={`text-xs px-2 py-1 rounded ${
                          hasPermission
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                        title={perm.description}
                      >
                        {hasPermission ? <Check size={12} className="inline mr-1" /> : <X size={12} className="inline mr-1" />}
                        {perm.label}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Permissions Section */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="text-primary-600" size={24} />
          <h2 className="text-xl font-bold text-gray-800">Role Permissions</h2>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> These permissions apply only to this specific event. Changes here won't
            affect other events.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 min-w-[250px]">
                  Permission
                </th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">
                  Team Lead
                </th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">
                  Team Members
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {permissionsList.map((permission) => (
                <tr key={permission.key} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{permission.label}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{permission.description}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => toggleTeamLeadPermission(permission.key)}
                      className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                        teamLeadPermissions[permission.key]
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      {teamLeadPermissions[permission.key] ? <Check size={20} /> : <X size={20} />}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => toggleTeamMemberPermission(permission.key)}
                      className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                        teamMemberPermissions[permission.key]
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      {teamMemberPermissions[permission.key] ? <Check size={20} /> : <X size={20} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={handleSavePermissions}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={20} />
                Save Permissions
              </>
            )}
          </button>
        </div>
      </div>

      {/* Add Team Lead Modal */}
      {showAddTeamLeadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Add Team Lead</h3>
            
            {availableTeamLeads.length === 0 ? (
              <p className="text-gray-500 mb-4">No available team leads to add</p>
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Team Lead
                </label>
                <select
                  value={selectedTeamLeadId}
                  onChange={(e) => setSelectedTeamLeadId(e.target.value)}
                  className="input-field"
                >
                  <option value="">Choose a team lead...</option>
                  {availableTeamLeads.map((lead) => (
                    <option key={lead._id} value={lead._id}>
                      {lead.name} - {lead.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowAddTeamLeadModal(false);
                  setSelectedTeamLeadId('');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTeamLead}
                disabled={!selectedTeamLeadId}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Team Lead
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Add Team Member</h3>
            
            {availableMembers.length === 0 ? (
              <p className="text-gray-500 mb-4">No available members to add</p>
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Member
                </label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="input-field"
                >
                  <option value="">Choose a member...</option>
                  {availableMembers.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name} - {member.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowAddMemberModal(false);
                  setSelectedMemberId('');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTeamMember}
                disabled={!selectedMemberId}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Permissions Modal */}
      {editingMemberId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Edit Member Permissions</h3>
              <button
                onClick={() => {
                  setEditingMemberId(null);
                  setEditingPermissions({});
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Custom Permissions:</strong> These permissions are specific to this member for this event.
              </p>
            </div>

            <div className="space-y-4">
              {permissionsList.map((permission) => (
                <div
                  key={permission.key}
                  className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{permission.label}</p>
                    <p className="text-sm text-gray-600 mt-1">{permission.description}</p>
                  </div>
                  <button
                    onClick={() => toggleEditingPermission(permission.key)}
                    className={`ml-4 w-14 h-14 rounded-lg flex items-center justify-center transition-colors ${
                      editingPermissions[permission.key]
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
                    }`}
                  >
                    {editingPermissions[permission.key] ? <Check size={24} /> : <X size={24} />}
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-3 justify-end mt-6 pt-6 border-t">
              <button
                onClick={() => {
                  setEditingMemberId(null);
                  setEditingPermissions({});
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMemberPermissions}
                disabled={saving}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Save Permissions
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventTeamDetails;
