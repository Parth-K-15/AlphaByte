import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const API_BASE = 'http://localhost:5000/api';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    college: '',
    year: '',
    branch: ''
  });

  useEffect(() => {
    if (user?.email) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE}/participant/profile?email=${encodeURIComponent(user.email)}`
      );
      const data = await response.json();
      
      if (data.success) {
        setProfile(data.data);
        setFormData({
          fullName: data.data.fullName || '',
          phone: data.data.phone || '',
          college: data.data.college || '',
          year: data.data.year || '',
          branch: data.data.branch || ''
        });
      } else {
        setMessage({ type: 'info', text: data.message });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };



  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const response = await fetch(`${API_BASE}/participant/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          ...formData
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setIsEditing(false);
        fetchProfile();
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // If no user, show message
  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="text-6xl mb-4">👤</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">My Profile</h2>
          <p className="text-gray-500 mb-6">Please sign in to view your profile</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl p-8 text-white text-center">
        <div className="w-24 h-24 mx-auto bg-white/20 rounded-full flex items-center justify-center text-4xl mb-4">
          {profile?.fullName?.[0]?.toUpperCase() || '👤'}
        </div>
        <h1 className="text-2xl font-bold">{profile?.fullName || 'New Participant'}</h1>
        <p className="text-pink-100">{user.email}</p>
        {profile?.memberSince && (
          <p className="text-sm text-pink-200 mt-2">Member since {formatDate(profile.memberSince)}</p>
        )}
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-800' :
          message.type === 'info' ? 'bg-blue-100 text-blue-800' :
          'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Stats */}
      {profile?.stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">{profile.stats.totalRegistrations}</div>
            <div className="text-gray-500 text-sm">Registrations</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{profile.stats.attendedCount}</div>
            <div className="text-gray-500 text-sm">Attended</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{profile.stats.certificatesCount}</div>
            <div className="text-gray-500 text-sm">Certificates</div>
          </div>
        </div>
      )}

      {/* Profile Form */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-semibold text-gray-800">Profile Information</h3>
          {!isEditing && profile && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              ✏️ Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            ) : (
              <p className="text-gray-800">{profile?.fullName || '-'}</p>
            )}
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <p className="text-gray-800">{email}</p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            ) : (
              <p className="text-gray-800">{profile?.phone || '-'}</p>
            )}
          </div>

          {/* College */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              College / Organization
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.college}
                onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            ) : (
              <p className="text-gray-800">{profile?.college || '-'}</p>
            )}
          </div>

          {/* Year & Branch */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              {isEditing ? (
                <select
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Graduate">Graduate</option>
                </select>
              ) : (
                <p className="text-gray-800">{profile?.year || '-'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Branch
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  placeholder="e.g., CSE, ECE"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <p className="text-gray-800">{profile?.branch || '-'}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          {isEditing && (
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  if (profile) {
                    setFormData({
                      fullName: profile.fullName || '',
                      phone: profile.phone || '',
                      college: profile.college || '',
                      year: profile.year || '',
                      branch: profile.branch || ''
                    });
                  }
                }}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Logout / Change Email */}
      <div className="text-center space-y-2">
        <button
          onClick={() => {
            localStorage.removeItem('participantEmail');
            setEmail('');
            setInputEmail('');
            setProfile(null);
          }}
          className="text-red-600 hover:text-red-800 font-medium"
        >
          Logout
        </button>
        <p className="text-gray-400 text-sm">This will clear your saved email from this device</p>
      </div>
    </div>
  );
};

export default Profile;
