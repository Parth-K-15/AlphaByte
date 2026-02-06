import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, User, Mail, Phone, Building, BookOpen, GraduationCap, Lock, Save, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = 'http://localhost:5000/api';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [passwordMode, setPasswordMode] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    college: '',
    branch: '',
    year: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchProfile();
  }, [navigate]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/participant/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.status === 401) {
        setError('Session expired. Please login again.');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        setProfile(data.data);
        setFormData({
          name: data.data.name || '',
          phone: data.data.phone || '',
          college: data.data.college || '',
          branch: data.data.branch || '',
          year: data.data.year || '',
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/participant/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      
      if (response.status === 401) {
        setError('Session expired. Please login again.');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        setProfile(data.data);
        setSuccess('Profile updated successfully!');
        setEditMode(false);
      } else {
        setError(data.message || 'Failed to update profile');
      }
    } catch (err) {
      setError('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/participant/profile/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      
      if (response.status === 401) {
        setError('Session expired. Please login again.');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Password changed successfully!');
        setPasswordMode(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setError(data.message || 'Failed to change password');
      }
    } catch (err) {
      setError('Error changing password');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setUploadingAvatar(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/participant/profile/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (response.status === 401) {
        setError('Session expired. Please login again.');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        setProfile({ ...profile, avatar: data.data.avatar });
        setSuccess('Avatar updated successfully!');
      } else {
        setError(data.message || 'Failed to upload avatar');
      }
    } catch (err) {
      setError('Error uploading avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!confirm('Are you sure you want to delete your avatar?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/participant/profile/avatar`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.status === 401) {
        setError('Session expired. Please login again.');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        setProfile({ ...profile, avatar: null });
        setSuccess('Avatar deleted successfully!');
      } else {
        setError(data.message || 'Failed to delete avatar');
      }
    } catch (err) {
      setError('Error deleting avatar');
    }
  };

  if (!profile) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-cyan-200"></div>
          <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-cyan-600 absolute top-0 left-0"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full md:max-w-5xl mx-auto p-4 sm:p-6 pb-24 overflow-x-hidden">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
          My Profile
        </h1>
        <p className="text-gray-600 text-base sm:text-lg">Manage your personal information and settings</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 p-5 bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-200 rounded-2xl text-green-800 font-semibold shadow-lg">
          ✅ {success}
        </div>
      )}
      {error && (
        <div className="mb-6 p-5 bg-gradient-to-r from-red-100 to-pink-100 border-2 border-red-200 rounded-2xl text-red-800 font-semibold shadow-lg">
          ❌ {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Avatar Section */}
        <div className="md:col-span-1">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 sm:p-8 border border-white/20">
            <div className="flex flex-col items-center">
              <div className="relative group">
                <div className="w-36 h-36 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center text-white text-5xl font-black overflow-hidden shadow-2xl ring-4 ring-white/50">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    profile.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <label className="absolute bottom-1 right-1 bg-gradient-to-r from-cyan-600 to-blue-600 text-white p-3 rounded-full cursor-pointer hover:from-cyan-700 hover:to-blue-700 transition-all duration-300 hover:scale-110 shadow-lg">
                  <Camera className="w-5 h-5" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploadingAvatar}
                  />
                </label>
              </div>
              
              {uploadingAvatar && (
                <p className="mt-4 text-sm font-semibold text-cyan-600 animate-pulse">Uploading...</p>
              )}
              
              <h3 className="mt-6 text-xl sm:text-2xl font-black text-gray-900 break-words">{profile.name}</h3>
              <p className="text-gray-600 text-sm sm:text-base font-medium flex items-center gap-2 mt-2 break-all">
                <Mail size={16} className="text-cyan-600" />
                {profile.email}
              </p>
              
              {profile.avatar && (
                <button
                  onClick={handleDeleteAvatar}
                  className="mt-4 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-all hover:scale-105"
                >
                  Remove Avatar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="md:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 sm:p-8 border border-white/20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-6">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900">Personal Information</h2>
              {!editMode && !passwordMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-700 hover:from-cyan-100 hover:to-blue-100 rounded-xl font-bold transition-all duration-300 hover:scale-105 border border-cyan-200"
                >
                  Edit Profile
                </button>
              )}
            </div>

            {editMode ? (
              <form onSubmit={handleUpdateProfile} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <User className="inline w-5 h-5 mr-2 text-cyan-600" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <Phone className="inline w-5 h-5 mr-2 text-cyan-600" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <Building className="inline w-5 h-5 mr-2 text-cyan-600" />
                    College
                  </label>
                  <input
                    type="text"
                    name="college"
                    value={formData.college}
                    onChange={handleChange}
                    className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      <BookOpen className="inline w-5 h-5 mr-2 text-cyan-600" />
                      Branch
                    </label>
                    <input
                      type="text"
                      name="branch"
                      value={formData.branch}
                      onChange={handleChange}
                      className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      <GraduationCap className="inline w-5 h-5 mr-2 text-cyan-600" />
                      Year
                    </label>
                    <select
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all font-medium"
                    >
                      <option value="">Select year</option>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="5th Year">5th Year</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50 font-bold transition-all duration-300 hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditMode(false);
                      setFormData({
                        name: profile.name || '',
                        phone: profile.phone || '',
                        college: profile.college || '',
                        branch: profile.branch || '',
                        year: profile.year || '',
                      });
                    }}
                    className="px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-bold transition-all duration-300 hover:scale-105"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start sm:items-center text-gray-800 py-3 px-4 bg-gray-50 rounded-xl break-words">
                  <User className="w-6 h-6 mr-4 text-cyan-600 flex-shrink-0" />
                  <span className="font-bold mr-3 text-gray-600 flex-shrink-0">Name:</span>
                  <span className="font-medium break-words">{profile.name}</span>
                </div>
                <div className="flex items-start sm:items-center text-gray-800 py-3 px-4 bg-gray-50 rounded-xl break-all">
                  <Mail className="w-6 h-6 mr-4 text-cyan-600 flex-shrink-0" />
                  <span className="font-bold mr-3 text-gray-600 flex-shrink-0">Email:</span>
                  <span className="font-medium break-all">{profile.email}</span>
                </div>
                <div className="flex items-start sm:items-center text-gray-800 py-3 px-4 bg-gray-50 rounded-xl break-words">
                  <Phone className="w-6 h-6 mr-4 text-cyan-600 flex-shrink-0" />
                  <span className="font-bold mr-3 text-gray-600 flex-shrink-0">Phone:</span>
                  <span className="font-medium break-words">{profile.phone || 'Not provided'}</span>
                </div>
                <div className="flex items-start sm:items-center text-gray-800 py-3 px-4 bg-gray-50 rounded-xl break-words">
                  <Building className="w-6 h-6 mr-4 text-cyan-600 flex-shrink-0" />
                  <span className="font-bold mr-3 text-gray-600 flex-shrink-0">College:</span>
                  <span className="font-medium break-words">{profile.college || 'Not provided'}</span>
                </div>
                <div className="flex items-start sm:items-center text-gray-800 py-3 px-4 bg-gray-50 rounded-xl break-words">
                  <BookOpen className="w-6 h-6 mr-4 text-cyan-600 flex-shrink-0" />
                  <span className="font-bold mr-3 text-gray-600 flex-shrink-0">Branch:</span>
                  <span className="font-medium break-words">{profile.branch || 'Not provided'}</span>
                </div>
                <div className="flex items-start sm:items-center text-gray-800 py-3 px-4 bg-gray-50 rounded-xl break-words">
                  <GraduationCap className="w-6 h-6 mr-4 text-cyan-600 flex-shrink-0" />
                  <span className="font-bold mr-3 text-gray-600 flex-shrink-0">Year:</span>
                  <span className="font-medium break-words">{profile.year || 'Not provided'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Password Change Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 sm:p-8 border border-white/20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-6">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900">Security</h2>
              {!editMode && !passwordMode && (
                <button
                  onClick={() => setPasswordMode(true)}
                  className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 hover:from-indigo-100 hover:to-purple-100 rounded-xl font-bold transition-all duration-300 hover:scale-105 border border-indigo-200"
                >
                  Change Password
                </button>
              )}
            </div>

            {passwordMode ? (
              <form onSubmit={handleChangePassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <Lock className="inline w-5 h-5 mr-2 text-indigo-600" />
                    Current Password
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <Lock className="inline w-5 h-5 mr-2 text-indigo-600" />
                    New Password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength={8}
                    className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium"
                  />
                  <p className="mt-2 text-xs text-gray-600 font-medium">🛡️ Minimum 8 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <Lock className="inline w-5 h-5 mr-2 text-indigo-600" />
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 font-bold transition-all duration-300 hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                  >
                    <Lock className="w-5 h-5" />
                    {loading ? 'Changing...' : 'Change Password'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPasswordMode(false);
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    }}
                    className="px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-bold transition-all duration-300 hover:scale-105"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center text-gray-800 py-3 px-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                <Lock className="w-6 h-6 mr-4 text-green-600" />
                <span className="font-bold text-green-800">🔒 Password is secure</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
