import { useState, useEffect } from 'react';
import { Bell, ChevronDown, User } from 'lucide-react';
import { authApi } from '../../services/api';

const Header = () => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profileData, setProfileData] = useState({
    name: 'Organizer',
    role: 'Team Lead',
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
          name: response.data.name || 'Organizer',
          role: response.data.role || 'Team Lead',
          avatar: response.data.avatar || null,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Left Section - Title */}
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Organizer Dashboard</h1>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative group">
          <button className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors cursor-not-allowed opacity-60">
            <Bell size={22} className="text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
            Coming Soon
          </div>
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <div className="w-9 h-9 bg-primary-100 rounded-xl flex items-center justify-center overflow-hidden">
              {profileData.avatar ? (
                <img src={profileData.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={20} className="text-primary-600" />
              )}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-800">{profileData.name}</p>
              <p className="text-xs text-gray-500">{profileData.role}</p>
            </div>
            <ChevronDown size={16} className="text-gray-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-2xl shadow-lg z-50 py-2">
              <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Profile Settings
              </a>
              <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Help & Support
              </a>
              <hr className="my-2" />
              <a href="#" className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                Logout
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
