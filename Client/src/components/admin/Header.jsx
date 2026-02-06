import { useState, useEffect } from 'react';
import { Bell, User } from 'lucide-react';
import { authApi } from '../../services/api';

const Header = () => {
  const [profileData, setProfileData] = useState({
    name: 'Admin User',
    role: 'Super Admin',
    avatar: null,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await authApi.getMe();
      if (response.success && response.data) {
        setProfileData({
          name: response.data.name || 'Admin User',
          role: response.data.role || 'Super Admin',
          avatar: response.data.avatar || null,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left Section - Title */}
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Admin Dashboard</h1>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <div className="relative group">
            <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-not-allowed opacity-60">
              <Bell size={22} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              Coming Soon
            </div>
          </div>

          {/* Profile */}
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-800">{profileData.name}</p>
              <p className="text-xs text-gray-500">{profileData.role}</p>
            </div>
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center overflow-hidden">
              {profileData.avatar ? (
                <img src={profileData.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={20} className="text-white" />
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
