import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  Users,
  QrCode,
  Mail,
  Award,
  Settings,
  ChevronDown,
  ChevronLeft,
  LogOut,
  UserCog,
} from "lucide-react";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState({ events: true });
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = (menu) => {
    setOpenMenus((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  const menuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      path: "/organizer",
    },
    {
      title: "My Events",
      icon: Calendar,
      submenu: [
        { title: "All Events", path: "/organizer/events" },
        { title: "Timeline Updates", path: "/organizer/events/updates" },
      ],
      key: "events",
    },
    {
      title: "Participants",
      icon: Users,
      path: "/organizer/participants",
    },
    {
      title: "Attendance",
      icon: QrCode,
      path: "/organizer/attendance/qr",
    },
    {
      title: "Communication",
      icon: Mail,
      submenu: [
        { title: "Send Emails", path: "/organizer/communication/email" },
        {
          title: "Announcements",
          path: "/organizer/communication/announcements",
        },
      ],
      key: "communication",
    },
    {
      title: "Certificates",
      icon: Award,
      submenu: [
        { title: "Generate", path: "/organizer/certificates/generate" },
        { title: "Distribution", path: "/organizer/certificates/distribution" },
      ],
      key: "certificates",
    },
    {
      title: "Team Access",
      icon: UserCog,
      path: "/organizer/team",
    },
  ];

  const isActive = (path) => location.pathname === path;
  const isParentActive = (submenu) =>
    submenu?.some((item) => location.pathname === item.path);

  return (
    <aside
      className={`bg-gray-800 text-white transition-all duration-300 flex flex-col shadow-2xl ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
        {!collapsed && (
          <span className="text-xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
            Organizer
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ChevronLeft
            className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
            size={20}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => (
            <li key={item.title}>
              {item.submenu ? (
                <>
                  <button
                    onClick={() => toggleMenu(item.key)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors ${
                      isParentActive(item.submenu)
                        ? "bg-primary-600 text-white shadow-lg"
                        : "text-gray-400 hover:bg-gray-800 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={20} />
                      {!collapsed && <span>{item.title}</span>}
                    </div>
                    {!collapsed && (
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${openMenus[item.key] ? "rotate-180" : ""}`}
                      />
                    )}
                  </button>
                  {!collapsed && openMenus[item.key] && (
                    <ul className="mt-1 ml-4 pl-4 border-l-2 border-gray-700 space-y-1">
                      {item.submenu.map((subItem) => (
                        <li key={subItem.path}>
                          <NavLink
                            to={subItem.path}
                            className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                              isActive(subItem.path)
                                ? "bg-gray-800 text-primary-400 font-medium"
                                : "text-gray-500 hover:text-white hover:bg-gray-800"
                            }`}
                          >
                            {subItem.title}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <NavLink
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                    isActive(item.path)
                      ? "bg-primary-600 text-white shadow-lg"
                      : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <item.icon size={20} />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:bg-red-600 hover:text-white transition-colors w-full ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
