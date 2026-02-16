import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  LayoutDashboard,
  Presentation,
  User,
  FileText,
  BarChart3,
  ChevronDown,
  LogOut,
  X,
  Sun,
  Moon,
} from "lucide-react";

const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [openMenus, setOpenMenus] = useState({});

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleNavClick = () => {
    setMobileOpen(false);
  };

  const menuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      path: "/speaker",
    },
    {
      title: "My Sessions",
      icon: Presentation,
      path: "/speaker/sessions",
    },
    {
      title: "My Profile",
      icon: User,
      path: "/speaker/profile",
    },
    {
      title: "Materials",
      icon: FileText,
      path: "/speaker/materials",
    },
    {
      title: "Analytics",
      icon: BarChart3,
      path: "/speaker/analytics",
    },
  ];

  const isActive = (path) => location.pathname === path;

  const sidebarContent = (
    <aside className="h-full bg-gray-50 dark:bg-[#141420] flex flex-col transition-colors duration-300">
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-6">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 dark:bg-emerald-500 rounded-xl flex items-center justify-center">
              <span className="text-white dark:text-dark font-bold text-lg">
                S
              </span>
            </div>
            <div>
              <p className="text-gray-900 dark:text-white font-bold text-base">
                Speaker
              </p>
              <p className="text-xs text-gray-500 dark:text-zinc-500">
                Dashboard
              </p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-10 h-10 bg-emerald-600 dark:bg-emerald-500 rounded-xl flex items-center justify-center mx-auto">
            <span className="text-white dark:text-dark font-bold text-lg">
              S
            </span>
          </div>
        )}
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
                end={item.path === "/speaker"}
                onClick={handleNavClick}
                className={({ isActive: active }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    active || isActive(item.path)
                      ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shadow-sm"
                      : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                  }`
                }
              >
                <item.icon
                  size={18}
                  strokeWidth={2}
                  className={
                    isActive(item.path)
                      ? "text-emerald-600 dark:text-emerald-400"
                      : ""
                  }
                />
                {!collapsed && <span>{item.title}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-gray-200 dark:border-white/5">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all duration-200 mb-1"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          {!collapsed && (
            <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 z-50">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div
        className={`hidden lg:block ${
          collapsed ? "w-20" : "w-64"
        } flex-shrink-0 transition-all duration-300`}
      >
        {sidebarContent}
      </div>
    </>
  );
};

export default Sidebar;
