import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  Home,
  Calendar,
  Ticket,
  History,
  Award,
  User,
  LogOut,
  X,
  Sun,
  Moon,
  FileText,
} from "lucide-react";

const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleNavClick = () => {
    setMobileOpen(false);
  };

  const menuItems = [
    { title: "Home", icon: Home, path: "/participant", end: true },
    { title: "Calendar", icon: Calendar, path: "/participant/calendar" },
    { title: "My Events", icon: Ticket, path: "/participant/registrations" },
    { title: "History", icon: History, path: "/participant/history" },
    { title: "Certificates", icon: Award, path: "/participant/certificates" },
    { title: "Transcript", icon: FileText, path: "/participant/transcript" },
    { title: "Profile", icon: User, path: "/participant/profile" },
  ];

  const sidebarContent = (
    <aside className="h-full bg-gray-50 dark:bg-[#141420] flex flex-col transition-colors duration-300">
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-900 dark:bg-lime rounded-full flex items-center justify-center">
            <span className="text-white dark:text-dark font-bold text-lg">
              P
            </span>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300 lg:hidden"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto px-4">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.title}>
              <NavLink
                to={item.path}
                end={item.end}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? "bg-white dark:bg-lime/10 text-gray-900 dark:text-lime font-medium shadow-sm dark:shadow-none"
                      : "text-gray-700 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-white/5"
                  }`
                }
              >
                <item.icon size={20} strokeWidth={1.5} />
                <span className="text-sm font-medium">{item.title}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Theme Toggle */}
      <div className="px-4 pb-2">
        <div className="flex items-center justify-between px-3 py-2.5">
          <span className="text-sm font-medium text-gray-700 dark:text-zinc-400">
            Theme
          </span>
          <button
            onClick={toggleTheme}
            className={`theme-toggle ${theme === "dark" ? "theme-toggle-dark" : "theme-toggle-light"}`}
            aria-label="Toggle theme"
          >
            <div
              className={`theme-toggle-knob ${theme === "dark" ? "theme-toggle-knob-dark" : "theme-toggle-knob-light"}`}
            >
              {theme === "dark" ? (
                <Moon size={12} className="text-white" />
              ) : (
                <Sun size={12} className="text-white" />
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Logout */}
      <div className="p-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all w-full"
        >
          <LogOut size={20} strokeWidth={1.5} />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[105]"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - Mobile */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-[110] w-72 transform transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </div>

      {/* Sidebar - Desktop */}
      <div className="hidden lg:block w-64">{sidebarContent}</div>
    </>
  );
};

export default Sidebar;
