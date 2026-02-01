import { useState } from 'react';
import { Bell, Search, ChevronDown, User } from 'lucide-react';

const Header = () => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, message: 'New participant registered', time: '5 min ago', unread: true },
    { id: 2, message: 'Event starts in 1 hour', time: '1 hour ago', unread: true },
    { id: 3, message: 'Certificate generation completed', time: '2 hours ago', unread: false },
  ];

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search events, participants..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <Bell size={22} className="text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-lg z-50">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">Notifications</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${
                      notif.unread ? 'bg-primary-50/50' : ''
                    }`}
                  >
                    <p className="text-sm text-gray-800">{notif.message}</p>
                    <span className="text-xs text-gray-500">{notif.time}</span>
                  </div>
                ))}
              </div>
              <div className="p-3 text-center">
                <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <div className="w-9 h-9 bg-primary-100 rounded-xl flex items-center justify-center">
              <User size={20} className="text-primary-600" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-800">Organizer</p>
              <p className="text-xs text-gray-500">Team Lead</p>
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
