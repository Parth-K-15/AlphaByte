import { useState, useEffect } from "react";
import { Bell, ChevronDown, User, Menu } from "lucide-react";
import { authApi } from "../../services/api";

const Header = ({ mobileOpen, setMobileOpen }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "Organizer",
    role: "Team Lead",
    avatar: null,
  });

  const notifications = [
    { id: 1, message: "New participant registered", time: "2 mins ago", unread: true },
    { id: 2, message: "Event update published", time: "1 hour ago", unread: false },
  ];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await authApi.getMe();
      if (response.success && response.data) {
        setProfileData({
          name: response.data.name || "Organizer",
          role: response.data.role || "Team Lead",
          avatar: response.data.avatar || null,
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  return (
    <header className="h-14 sm:h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-sm relative z-[100]">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-all"
        aria-label="Open menu"
      >
        <Menu size={20} className="text-[#191A23]" strokeWidth={2} />
      </button>

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* Right Section */}
      <div className="flex items-center gap-2 sm:gap-3 ml-3 sm:ml-4">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 sm:p-2.5 hover:bg-[#B9FF66]/10 rounded-lg transition-all duration-300 hover:scale-105 group"
          >
            <Bell
              size={18}
              className="text-[#191A23] group-hover:text-[#191A23] transition-colors sm:w-5 sm:h-5"
              strokeWidth={2}
            />
            <span className="absolute top-1 sm:top-1.5 right-1 sm:right-1.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[#B9FF66] rounded-full animate-pulse shadow-lg"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-[9999] overflow-hidden">
              <div className="p-3 sm:p-4 border-b border-gray-200 bg-[#191A23]">
                <h3 className="font-bold text-white text-base sm:text-lg">
                  Notifications
                </h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 sm:p-4 border-b border-gray-100 hover:bg-[#B9FF66]/10 cursor-pointer transition-all group ${
                      notif.unread
                        ? "bg-[#B9FF66]/5"
                        : ""
                    }`}
                  >
                    <p className="text-xs sm:text-sm text-[#191A23] font-semibold group-hover:text-[#191A23] transition-colors">
                      {notif.message}
                    </p>
                    <span className="text-xs text-gray-500 mt-1">
                      {notif.time}
                    </span>
                  </div>
                ))}
              </div>
              <div className="p-2 sm:p-3 text-center border-t border-gray-100 bg-gray-50">
                <button className="text-xs sm:text-sm text-[#191A23] hover:text-[#191A23] font-semibold hover:underline transition-all">
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
               hover:bg-[#B9FF66]/10 
               rounded-lg transition-all duration-300 hover:scale-105 group"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 
                   bg-[#191A23]
                   rounded-lg flex items-center justify-center 
                   shadow-md group-hover:shadow-lg 
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
                    className="text-[#B9FF66] sm:w-[18px] sm:h-[18px]"
                    strokeWidth={2}
                  />
                )}
              </div>

              <div className="hidden md:block text-left">
                <p className="text-sm font-bold text-[#191A23]">
                  {profileData.name}
                </p>
                <p className="text-xs text-gray-600 font-medium">
                  {profileData.role}
                </p>
              </div>
            </div>

            <ChevronDown
              size={14}
              className="text-gray-400 group-hover:text-[#191A23] 
                 transition-colors hidden sm:block sm:w-4 sm:h-4"
              strokeWidth={2}
            />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 w-44 sm:w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-[9999] py-2 overflow-hidden">
              <a
                href="#"
                className="block px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-[#191A23] hover:bg-[#B9FF66]/10 font-medium transition-all"
              >
                Profile Settings
              </a>
              <a
                href="#"
                className="block px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-[#191A23] hover:bg-[#B9FF66]/10 font-medium transition-all"
              >
                Help & Support
              </a>
              <hr className="my-2 border-gray-100" />
              <a
                href="#"
                className="block px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-red-600 hover:bg-red-50 font-semibold transition-all"
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
