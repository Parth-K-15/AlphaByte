import { useState, useEffect } from "react";
import { Bell, ChevronDown, User, Menu } from "lucide-react";
import { authApi } from "../../services/api";

const Header = ({ mobileOpen, setMobileOpen }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "Speaker",
    role: "Speaker",
    avatar: null,
  });

  const notifications = [
    {
      id: 1,
      message: "New session assigned to you",
      time: "2 mins ago",
      unread: true,
    },
    {
      id: 2,
      message: "Session update approved",
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
          name: response.data.name || "Speaker",
          role: "Speaker",
          avatar: response.data.avatar || response.data.headshot || null,
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
        className="lg:hidden p-2 hover:bg-gradient-to-br hover:from-emerald-50 hover:to-teal-50 dark:hover:from-white/5 dark:hover:to-white/10 rounded-xl transition-all"
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
            className="relative p-2 sm:p-2.5 hover:bg-gradient-to-br hover:from-emerald-50 hover:to-teal-50 dark:hover:from-white/5 dark:hover:to-white/10 rounded-xl transition-all duration-300 hover:scale-110 group"
          >
            <Bell
              size={18}
              className="text-gray-600 dark:text-zinc-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors sm:w-5 sm:h-5"
              strokeWidth={2.5}
            />
            <span className="absolute top-1 sm:top-1.5 right-1 sm:right-1.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-gradient-to-br from-red-500 to-pink-500 rounded-full animate-pulse shadow-lg"></span>
          </button>

          {/* Notifications dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-[#1a1a2e] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden z-50">
              <div className="p-3 sm:p-4 border-b border-gray-100 dark:border-white/10">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">
                  Notifications
                </h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-white/5 ${
                      notif.unread
                        ? "bg-emerald-50/50 dark:bg-emerald-500/5"
                        : ""
                    }`}
                  >
                    <p className="text-xs sm:text-sm text-gray-700 dark:text-zinc-300">
                      {notif.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">
                      {notif.time}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 hover:bg-gradient-to-br hover:from-emerald-50 hover:to-teal-50 dark:hover:from-white/5 dark:hover:to-white/10 rounded-xl transition-all duration-300"
          >
            {profileData.avatar ? (
              <img
                src={profileData.avatar}
                alt={profileData.name}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl object-cover ring-2 ring-emerald-100 dark:ring-emerald-500/20"
              />
            ) : (
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center ring-2 ring-emerald-100 dark:ring-emerald-500/20">
                <User size={14} className="text-white sm:w-4 sm:h-4" />
              </div>
            )}
            <div className="hidden sm:block text-left">
              <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white leading-tight">
                {profileData.name}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-zinc-500">
                {profileData.role}
              </p>
            </div>
            <ChevronDown
              size={14}
              className="text-gray-400 dark:text-zinc-600 hidden sm:block"
            />
          </button>

          {/* Profile dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1a1a2e] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden z-50">
              <a
                href="/speaker/profile"
                className="block px-4 py-3 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-white/5"
              >
                View Profile
              </a>
              <a
                href="/speaker/sessions"
                className="block px-4 py-3 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-white/5"
              >
                My Sessions
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
