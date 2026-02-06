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
    <header className="h-16 bg-white/90 backdrop-blur-2xl border-b border-white/60 flex items-center justify-between px-8 shadow-lg relative z-[100]">
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors" size={18} strokeWidth={2.5} />
          <input
            type="text"
            placeholder="Search events, participants..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all hover:border-blue-300 shadow-sm focus:shadow-md font-medium"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 rounded-xl transition-all duration-300 hover:scale-110 group"
          >
            <Bell size={20} className="text-gray-600 group-hover:text-blue-600 transition-colors" strokeWidth={2.5} />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-gradient-to-br from-red-500 to-pink-500 rounded-full animate-pulse shadow-lg"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white/95 backdrop-blur-2xl border border-white/60 rounded-2xl shadow-2xl z-[9999] overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
                <h3 className="font-bold text-gray-900 text-lg">Notifications</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 cursor-pointer transition-all group ${
                      notif.unread ? 'bg-gradient-to-r from-blue-50/50 to-purple-50/50' : ''
                    }`}
                  >
                    <p className="text-sm text-gray-800 font-bold group-hover:text-blue-700 transition-colors">{notif.message}</p>
                    <span className="text-xs text-gray-500 mt-1 font-semibold">{notif.time}</span>
                  </div>
                ))}
              </div>
              <div className="p-3 text-center border-t border-gray-100 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
                <button className="text-sm text-blue-600 hover:text-blue-700 font-bold hover:underline transition-all">
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
            className="flex items-center gap-3 p-2 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 rounded-xl transition-all duration-300 hover:scale-105 group"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
              <User size={18} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-bold text-gray-900">Organizer</p>
              <p className="text-xs text-gray-600 font-semibold">Team Lead</p>
            </div>
            <ChevronDown size={16} className="text-gray-400 group-hover:text-blue-600 transition-colors" strokeWidth={2.5} />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white/95 backdrop-blur-2xl border border-white/60 rounded-2xl shadow-2xl z-[9999] py-2 overflow-hidden">
              <a href="#" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 font-bold transition-all">
                Profile Settings
              </a>
              <a href="#" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 font-bold transition-all">
                Help & Support
              </a>
              <hr className="my-2 border-gray-100" />
              <a href="#" className="block px-4 py-3 text-sm text-red-600 hover:bg-red-50 font-black transition-all">
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
