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
} from 'lucide-react';
import { accessControlApi } from '../../services/api';

const AccessControl = () => {
  const [activeTab, setActiveTab] = useState('restrict');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRestrictModal, setShowRestrictModal] = useState(false);
  const [restrictedUsers, setRestrictedUsers] = useState([]);
  const [suspendedAccounts, setSuspendedAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ email: '', type: 'restrict', reason: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [restrictedRes, suspendedRes] = await Promise.all([
        accessControlApi.getRestrictedUsers(),
        accessControlApi.getSuspendedUsers()
      ]);
      setRestrictedUsers(restrictedRes.data || []);
      setSuspendedAccounts(suspendedRes.data || []);
    } catch (error) {
      console.error('Error fetching access control data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestrictUser = async () => {
    if (!formData.email || !formData.reason) {
      alert('Email and reason are required');
      return;
    }
    setSubmitting(true);
    try {
      if (formData.type === 'suspend') {
        await accessControlApi.suspendUser({ email: formData.email, reason: formData.reason });
      } else {
        await accessControlApi.restrictUser({ email: formData.email, reason: formData.reason });
      }
      setShowRestrictModal(false);
      setFormData({ email: '', type: 'restrict', reason: '' });
      fetchData();
    } catch (error) {
      console.error('Error restricting user:', error);
      alert(error.response?.data?.message || 'Failed to restrict user');
    } finally {
      setSubmitting(false);
    }
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

  const currentData = activeTab === 'restrict' ? restrictedUsers : suspendedAccounts;
  const filteredData = currentData.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <p className="text-gray-500 mt-1">Manage user restrictions and suspended accounts</p>
        </div>
        <button
          onClick={() => setShowRestrictModal(true)}
          className="btn-primary flex items-center gap-2 w-fit"
        >
          <UserX size={20} />
          Restrict User
        </button>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="flex gap-4 border-b border-gray-200 pb-4 mb-4">
          <button
            onClick={() => setActiveTab('restrict')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
              activeTab === 'restrict'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <UserX size={18} />
            Restricted Users
            <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-medium">
              {restrictedUsers.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('suspended')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
              activeTab === 'suspended'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Ban size={18} />
            Suspended Accounts
            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium">
              {suspendedAccounts.length}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search users..."
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
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Reason</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                  {activeTab === 'restrict' ? 'Restricted Date' : 'Suspended Date'}
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">By</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          activeTab === 'restrict' ? 'bg-orange-100' : 'bg-red-100'
                        }`}
                      >
                        {activeTab === 'restrict' ? (
                          <UserX size={20} className="text-orange-600" />
                        ) : (
                          <Ban size={20} className="text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={16} className="text-yellow-500" />
                      <span className="text-sm text-gray-600">{user.restrictionReason || user.reason || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock size={16} className="text-gray-400" />
                      {new Date(
                        user.restrictedAt || user.suspendedAt || user.updatedAt
                      ).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    Admin
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Eye size={18} className="text-gray-500" />
                      </button>
                      <button 
                        onClick={() => activeTab === 'restrict' ? handleUnrestrictUser(user._id) : handleUnsuspendUser(user._id)}
                        className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <Unlock size={18} className="text-green-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-12">
            <Lock size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">No users found</h3>
            <p className="text-gray-500">No users match your search criteria</p>
          </div>
        )}
      </div>

      {/* Restrict Modal */}
      {showRestrictModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Restrict User Access</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User Email *
                </label>
                <input 
                  type="email" 
                  placeholder="Enter user email" 
                  className="input-field"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
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
              <button onClick={() => setShowRestrictModal(false)} className="btn-secondary flex-1" disabled={submitting}>
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
