import { useState, useEffect } from 'react';
import {
  UserCog,
  Plus,
  Search,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  Key,
  Trash2,
  Edit,
  Shield,
  Loader2,
} from 'lucide-react';
import { teamsApi } from '../../services/api';

const TeamLeads = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showActions, setShowActions] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [teamLeads, setTeamLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);

  // Fetch team leads on mount
  useEffect(() => {
    fetchTeamLeads();
  }, []);

  const fetchTeamLeads = async () => {
    try {
      const response = await teamsApi.getTeamLeads();
      setTeamLeads(response.data || []);
    } catch (error) {
      console.error('Error fetching team leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeamLead = async () => {
    if (!formData.name || !formData.email) {
      alert('Name and email are required');
      return;
    }
    setSubmitting(true);
    try {
      await teamsApi.createTeamLead(formData);
      setShowAddModal(false);
      setFormData({ name: '', email: '', phone: '' });
      fetchTeamLeads();
      alert(
        `✅ Team Lead Created Successfully!\n\n` +
        `Name: ${formData.name}\n` +
        `Email: ${formData.email}\n` +
        `Default Password: 12345678\n\n` +
        `Please share these credentials with the team lead.`
      );
    } catch (error) {
      console.error('Error adding team lead:', error);
      alert('Failed to add team lead');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTeamLead = async (id) => {
    if (!confirm('Are you sure you want to remove this team lead?')) return;
    try {
      await teamsApi.deleteTeamLead(id);
      fetchTeamLeads();
    } catch (error) {
      console.error('Error removing team lead:', error);
      alert('Failed to remove team lead');
    }
  };

  const filteredLeads = teamLeads.filter(
    (lead) =>
      lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Generate avatar initials
  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

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
          <h1 className="text-2xl font-bold text-gray-800">Team Leads</h1>
          <p className="text-gray-500 mt-1">Manage team leads and their access</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2 w-fit"
        >
          <Plus size={20} />
          Add Team Lead
        </button>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search team leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Team Leads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLeads.map((lead) => (
          <div key={lead._id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                  <span className="text-primary-600 font-semibold">{getInitials(lead.name)}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{lead.name}</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      lead.isActive && !lead.isSuspended
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {lead.isActive && !lead.isSuspended ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowActions(showActions === lead._id ? null : lead._id)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <MoreVertical size={18} className="text-gray-500" />
                </button>

                {showActions === lead._id && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-2 min-w-[160px]">
                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                      <Edit size={16} />
                      Edit Details
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                      <Key size={16} />
                      Reset Password
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                      <Shield size={16} />
                      Permissions
                    </button>
                    <hr className="my-2" />
                    <button 
                      onClick={() => handleDeleteTeamLead(lead._id)}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 size={16} />
                      Remove Access
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail size={16} className="text-gray-400" />
                <span>{lead.email}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Phone size={16} className="text-gray-400" />
                <span>{lead.phone || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar size={16} className="text-gray-400" />
                <span>Joined {new Date(lead.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Events Managed</span>
                <span className="text-lg font-semibold text-primary-600">{lead.eventsManaged || 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredLeads.length === 0 && (
        <div className="card text-center py-12">
          <UserCog size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No team leads found</h3>
          <p className="text-gray-500">Try adjusting your search criteria</p>
        </div>
      )}

      {/* Add Modal (Simple) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Add New Team Lead</h2>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> The team lead will be created with default password: <code className="bg-blue-100 px-2 py-0.5 rounded font-mono">12345678</code>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input 
                  type="text" 
                  placeholder="Enter name" 
                  className="input-field"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input 
                  type="email" 
                  placeholder="Enter email" 
                  className="input-field"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input 
                  type="tel" 
                  placeholder="Enter phone" 
                  className="input-field"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="btn-secondary flex-1" disabled={submitting}>
                Cancel
              </button>
              <button onClick={handleAddTeamLead} className="btn-primary flex-1" disabled={submitting}>
                {submitting ? 'Adding...' : 'Add Lead'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamLeads;
