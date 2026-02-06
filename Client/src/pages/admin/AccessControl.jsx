import { useState, useEffect } from 'react';
import {
  Lock,
  Search,
  UserX,
  Ban,
  AlertTriangle,
  Clock,
  MoreVertical,
  Eye,
  Unlock,
  Trash2,
  Loader2,
  Shield,
  Edit,
  CheckCircle,
  XCircle,
  X,
  Calendar,
  Users,
  BarChart3,
  UserCheck,
} from 'lucide-react';
import { accessControlApi, teamsApi } from '../../services/api';

const AccessControl = () => {
  const [activeTab, setActiveTab] = useState('organizers');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRestrictModal, setShowRestrictModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [organizers, setOrganizers] = useState([]);
  const [restrictedUsers, setRestrictedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ userId: '', type: 'restrict', reason: '' });
  const [submitting, setSubmitting] = useState(false);

  // Permission states for editing
  const [editPermissions, setEditPermissions] = useState({
    canCreateEvents: false,
    canManageTeams: false,
    canViewReports: false,
    canManageParticipants: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'organizers') {
        // Fetch team leads and members (including inactive ones)
        const [leadsRes, membersRes] = await Promise.all([
          teamsApi.getTeamLeads(true),
          teamsApi.getMembers(true)
        ]);
        
        console.log('Leads response:', leadsRes);
        console.log('Members response:', membersRes);
        
        const teamLeads = (leadsRes.data || []).map(user => ({ ...user, type: 'Team Lead' }));
        const members = (membersRes.data || []).map(user => ({ ...user, type: 'Event Staff' }));
        
        console.log('Processed team leads:', teamLeads);
        console.log('Processed members:', members);
        
        setOrganizers([...teamLeads, ...members]);
      } else {
        // Fetch restricted and suspended users combined
        const [restrictedRes, suspendedRes] = await Promise.all([
          accessControlApi.getRestrictedUsers(),
          accessControlApi.getSuspendedUsers()
        ]);
        
        const restricted = (restrictedRes.data || []).map(user => ({ ...user, restrictionType: 'Restricted' }));
        const suspended = (suspendedRes.data || []).map(user => ({ ...user, restrictionType: 'Suspended' }));
        
        setRestrictedUsers([...restricted, ...suspended]);
      }
    } catch (error) {
      console.error('Error fetching access control data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleRestrictUser = async () => {
    if (!formData.userId || !formData.reason) {
      alert('User and reason are required');
      return;
    }
    setSubmitting(true);
    try {
      if (formData.type === 'suspend') {
        await accessControlApi.suspendUser(formData.userId, formData.reason);
      } else {
        await accessControlApi.restrictUser(formData.userId, formData.reason);
      }
      setShowRestrictModal(false);
      setFormData({ userId: '', type: 'restrict', reason: '' });
      setSelectedUser(null);
      fetchData();
    } catch (error) {
      console.error('Error restricting user:', error);
      alert(error.message || 'Failed to restrict user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePermissions = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      console.log('Updating permissions for user:', selectedUser._id);
      console.log('Permissions being sent:', editPermissions);
      
      await teamsApi.updateUser(selectedUser._id, {
        permissions: editPermissions
      });
      setShowPermissionsModal(false);
      setSelectedUser(null);
      fetchData();
      alert('Permissions updated successfully');
    } catch (error) {
      console.error('Error updating permissions:', error);
      alert('Failed to update permissions');
    } finally {
      setSubmitting(false);
    }
  };

  const openRestrictModal = (user) => {
    setSelectedUser(user);
    setFormData({ userId: user._id, type: 'restrict', reason: '' });
    setShowRestrictModal(true);
  };

  const openPermissionsModal = (user) => {
    setSelectedUser(user);
    setEditPermissions({
      canCreateEvents: user.permissions?.canCreateEvents || false,
      canManageTeams: user.permissions?.canManageTeams || false,
      canViewReports: user.permissions?.canViewReports || false,
      canManageParticipants: user.permissions?.canManageParticipants || false,
    });
    setShowPermissionsModal(true);
  };

  const handleUnrestrictUser = async (userId) => {
    if (!confirm('Are you sure you want to lift this restriction?')) return;
    try {
      await accessControlApi.unrestrictUser(userId);
      fetchData();
    } catch (error) {
      console.error('Error unrestricting user:', error);
      alert('Failed to unrestrict user');
    }
  };

  const handleUnsuspendUser = async (userId) => {
    if (!confirm('Are you sure you want to reactivate this account?')) return;
    try {
      await accessControlApi.unsuspendUser(userId);
      fetchData();
    } catch (error) {
      console.error('Error unsuspending user:', error);
      alert('Failed to unsuspend user');
    }
  };

  // Filter data based on active tab and search term
  const filteredData = () => {
    const data = activeTab === 'organizers' ? organizers : restrictedUsers;
    
    if (!searchTerm.trim()) return data;
    
    return data.filter((user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.type?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const displayData = filteredData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-primary-600" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Access Control</h1>
          <p className="text-gray-500 mt-1">Manage organizers access and restrictions</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="flex gap-4 border-b border-gray-200 pb-4 mb-4">
          <button
            onClick={() => setActiveTab('organizers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
              activeTab === 'organizers'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Shield size={18} />
            All Organizers
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
              {organizers.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('restricted')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
              activeTab === 'restricted'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Ban size={18} />
            Restricted Users
            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium">
              {restrictedUsers.length}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder={`Search ${activeTab === 'organizers' ? 'organizers' : 'restricted users'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">User</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Role</th>
                {activeTab === 'organizers' ? (
                  <>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Access Permissions</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                  </>
                ) : (
                  <>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Type</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Reason</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Date</th>
                  </>
                )}
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayData.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        user.isActive === false || user.isSuspended ? 'bg-red-100' : 
                        user.role === 'TEAM_LEAD' ? 'bg-blue-100' : 'bg-green-100'
                      }`}>
                        <Shield size={20} className={
                          user.isActive === false || user.isSuspended ? 'text-red-600' :
                          user.role === 'TEAM_LEAD' ? 'text-blue-600' : 'text-green-600'
                        } />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.role === 'TEAM_LEAD' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {user.type || user.role || 'N/A'}
                    </span>
                  </td>
                  
                  {activeTab === 'organizers' ? (
                    <>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {user.permissions?.canCreateEvents && (
                            <span className="px-2 py-1 bg-primary-50 text-primary-700 rounded-lg text-xs">
                              Create Events
                            </span>
                          )}
                          {user.permissions?.canManageTeams && (
                            <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs">
                              Manage Teams
                            </span>
                          )}
                          {user.permissions?.canViewReports && (
                            <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded-lg text-xs">
                              View Reports
                            </span>
                          )}
                          {user.permissions?.canManageParticipants && (
                            <span className="px-2 py-1 bg-green-50 text-green-700 rounded-lg text-xs">
                              Manage Participants
                            </span>
                          )}
                          {(!user.permissions || Object.values(user.permissions).every(v => !v)) && (
                            <span className="text-xs text-gray-400">No permissions set</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.isActive === false || user.isSuspended ? (
                          <span className="flex items-center gap-1 text-red-600 text-sm">
                            <XCircle size={16} />
                            Restricted
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-green-600 text-sm">
                            <CheckCircle size={16} />
                            Active
                          </span>
                        )}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.restrictionType === 'Suspended' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {user.restrictionType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={16} className="text-yellow-500" />
                          <span className="text-sm text-gray-600">{user.restrictionReason || user.suspensionReason || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock size={16} className="text-gray-400" />
                          {new Date(user.restrictedAt || user.suspendedAt || user.updatedAt).toLocaleDateString()}
                        </div>
                      </td>
                    </>
                  )}
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {activeTab === 'organizers' ? (
                        <>
                          <button 
                            onClick={() => openPermissionsModal(user)}
                            className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Permissions"
                          >
                            <Edit size={18} className="text-blue-600" />
                          </button>
                          <button 
                            onClick={() => openRestrictModal(user)}
                            className="p-2 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Restrict/Suspend User"
                          >
                            <UserX size={18} className="text-orange-600" />
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => user.restrictionType === 'Suspended' ? handleUnsuspendUser(user._id) : handleUnrestrictUser(user._id)}
                          className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                          title="Lift Restriction"
                        >
                          <Unlock size={18} className="text-green-600" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {displayData.length === 0 && (
          <div className="text-center py-12">
            <Lock size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              {searchTerm ? 'No results found' : `No ${activeTab === 'organizers' ? 'organizers' : 'restricted users'} found`}
            </h3>
            <p className="text-gray-500">
              {searchTerm ? 'Try adjusting your search terms' : `No ${activeTab === 'organizers' ? 'organizers' : 'restricted users'} to display`}
            </p>
          </div>
        )}
      </div>

      {/* Permissions Edit Modal */}
      {showPermissionsModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Edit Permissions</h2>
              <button 
                onClick={() => {
                  setShowPermissionsModal(false);
                  setSelectedUser(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-800">{selectedUser.name}</p>
              <p className="text-sm text-gray-500">{selectedUser.email}</p>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Calendar size={20} className="text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Create Events</p>
                    <p className="text-xs text-gray-500">Can create and manage events</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={editPermissions.canCreateEvents || false}
                  onChange={(e) => setEditPermissions({ ...editPermissions, canCreateEvents: e.target.checked })}
                  className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Manage Teams</p>
                    <p className="text-xs text-gray-500">Can manage team members</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={editPermissions.canManageTeams || false}
                  onChange={(e) => setEditPermissions({ ...editPermissions, canManageTeams: e.target.checked })}
                  className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <BarChart3 size={20} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">View Reports</p>
                    <p className="text-xs text-gray-500">Can access analytics and reports</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={editPermissions.canViewReports || false}
                  onChange={(e) => setEditPermissions({ ...editPermissions, canViewReports: e.target.checked })}
                  className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <UserCheck size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Manage Participants</p>
                    <p className="text-xs text-gray-500">Can manage participant data</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={editPermissions.canManageParticipants || false}
                  onChange={(e) => setEditPermissions({ ...editPermissions, canManageParticipants: e.target.checked })}
                  className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                />
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => {
                  setShowPermissionsModal(false);
                  setSelectedUser(null);
                }}
                className="btn-secondary flex-1" 
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePermissions}
                className="btn-primary flex-1"
                disabled={submitting}
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restrict Modal */}
      {showRestrictModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Restrict User Access</h2>
              <button 
                onClick={() => {
                  setShowRestrictModal(false);
                  setSelectedUser(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-800">{selectedUser.name}</p>
              <p className="text-sm text-gray-500">{selectedUser.email}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Restriction Type
                </label>
                <select 
                  className="input-field"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="restrict">Restrict (Limited Access)</option>
                  <option value="suspend">Suspend (Full Block)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason *</label>
                <textarea
                  placeholder="Enter reason for restriction"
                  rows={3}
                  className="input-field resize-none"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => {
                  setShowRestrictModal(false);
                  setSelectedUser(null);
                }}
                className="btn-secondary flex-1" 
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleRestrictUser}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-xl transition-colors flex-1"
                disabled={submitting}
              >
                {submitting ? 'Processing...' : 'Restrict User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessControl;
