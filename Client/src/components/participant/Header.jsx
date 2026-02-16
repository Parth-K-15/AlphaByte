import { useState, useEffect } from "react";
import { Bell, ChevronDown, User, Menu } from "lucide-react";
import { authApi } from "../../services/api";

const Header = ({ mobileOpen, setMobileOpen }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "Participant",
    role: "Student",
    avatar: null,
  });

  const notifications = [
    {
      id: 1,
      message: "Event registration confirmed",
      time: "2 mins ago",
      unread: true,
    },
    {
      id: 2,
      message: "New event available",
      time: "1 hour ago",
      unread: false,
    },
  ];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await authApi.getMe();
      if (response.success && response.data) {
        setProfileData({
          name: response.data.name || "Participant",
          role: response.data.role || "Student",
          avatar: response.data.avatar || null,
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  return (
    <header className="h-14 sm:h-16 bg-white/90 dark:bg-[#141420]/90 backdrop-blur-2xl border-b border-white/60 dark:border-white/5 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-lg dark:shadow-black/20 relative z-[100] transition-colors duration-300">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden p-2 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 dark:hover:from-white/5 dark:hover:to-white/10 rounded-xl transition-all"
        aria-label="Open menu"
      >
        <Menu
          size={20}
          className="text-gray-600 dark:text-zinc-400"
          strokeWidth={2.5}
        />
      </button>

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* Right Section */}
      <div className="flex items-center gap-2 sm:gap-3 ml-3 sm:ml-4">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 sm:p-2.5 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 dark:hover:from-white/5 dark:hover:to-white/10 rounded-xl transition-all duration-300 hover:scale-110 group"
          >
            <Bell
              size={18}
              className="text-gray-600 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-lime transition-colors sm:w-5 sm:h-5"
              strokeWidth={2.5}
            />
            <span className="absolute top-1 sm:top-1.5 right-1 sm:right-1.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-gradient-to-br from-red-500 to-pink-500 rounded-full animate-pulse shadow-lg"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white/95 dark:bg-[#1a1a2a]/95 backdrop-blur-2xl border border-white/60 dark:border-white/10 rounded-2xl shadow-2xl dark:shadow-black/40 z-[9999] overflow-hidden">
              <div className="p-3 sm:p-4 border-b border-gray-100 dark:border-white/5 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-lime/5 dark:to-indigo-500/5">
                <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg">
                  Notifications
                </h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 sm:p-4 border-b border-gray-100 dark:border-white/5 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-white/5 dark:hover:to-white/[0.02] cursor-pointer transition-all group ${
                      notif.unread
                        ? "bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-lime/5 dark:to-transparent"
                        : ""
                    }`}
                  >
                    <p className="text-xs sm:text-sm text-gray-800 dark:text-zinc-200 font-bold group-hover:text-blue-700 dark:group-hover:text-lime transition-colors">
                      {notif.message}
                    </p>
                    <span className="text-xs text-gray-500 dark:text-zinc-500 mt-1 font-semibold">
                      {notif.time}
                    </span>
                  </div>
                ))}
              </div>
              <div className="p-2 sm:p-3 text-center border-t border-gray-100 dark:border-white/5 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-white/[0.02] dark:to-transparent">
                <button className="text-xs sm:text-sm text-blue-600 dark:text-lime hover:text-blue-700 dark:hover:text-lime-400 font-bold hover:underline transition-all">
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
            className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 
               hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 
               dark:hover:from-white/5 dark:hover:to-white/10
               rounded-xl transition-all duration-300 hover:scale-105 group"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 
                   bg-gradient-to-br from-blue-600 to-purple-600 
                   dark:from-lime dark:to-lime-400
                   rounded-xl flex items-center justify-center 
                   shadow-lg group-hover:shadow-xl 
                   transition-shadow overflow-hidden"
              >
                {profileData.avatar ? (
                  <img
                    src={profileData.avatar}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User
                    size={16}
                    className="text-white dark:text-dark sm:w-[18px] sm:h-[18px]"
                    strokeWidth={2.5}
                  />
                )}
              </div>

              <div className="hidden md:block text-left">
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {profileData.name}
                </p>
                <p className="text-xs text-gray-600 dark:text-zinc-400 font-semibold">
                  {profileData.role}
                </p>
              </div>
            </div>

            <ChevronDown
              size={14}
              className="text-gray-400 dark:text-zinc-500 group-hover:text-blue-600 dark:group-hover:text-lime
                 transition-colors hidden sm:block sm:w-4 sm:h-4"
              strokeWidth={2.5}
            />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 w-44 sm:w-48 bg-white/95 dark:bg-[#1a1a2a]/95 backdrop-blur-2xl border border-white/60 dark:border-white/10 rounded-2xl shadow-2xl dark:shadow-black/40 z-[9999] py-2 overflow-hidden">
              <a
                href="#"
                className="block px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-700 dark:text-zinc-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-white/5 dark:hover:to-white/[0.02] font-bold transition-all"
              >
                Profile Settings
              </a>
              <a
                href="#"
                className="block px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-700 dark:text-zinc-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-white/5 dark:hover:to-white/[0.02] font-bold transition-all"
              >
                Help & Support
              </a>
              <hr className="my-2 border-gray-100 dark:border-white/5" />
              <a
                href="#"
                className="block px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 font-black transition-all"
              >
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
