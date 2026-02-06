import { useState, useEffect } from "react";
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
  X,
} from "lucide-react";

const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  // Auto-open menus based on current path
  const getInitialOpenMenus = () => {
    const menus = {};
    if (location.pathname.includes('/events')) menus.events = true;
    if (location.pathname.includes('/communication')) menus.communication = true;
    if (location.pathname.includes('/certificates')) menus.certificates = true;
    return menus;
  };
  
  const [openMenus, setOpenMenus] = useState(getInitialOpenMenus());
  
  // Update open menus when location changes
  useEffect(() => {
    const newOpenMenus = getInitialOpenMenus();
    setOpenMenus(prev => ({ ...prev, ...newOpenMenus }));
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = (menu) => {
    setOpenMenus((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  const handleNavClick = () => {
    setMobileOpen(false);
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

  const SidebarContent = () => (
    <aside className="h-full bg-gradient-to-b from-white/90 via-white/85 to-white/90 backdrop-blur-2xl border-r border-white/60 shadow-xl flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-gray-200/40 bg-white/50">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-sm">P</span>
            </div>
            <span className="text-xl font-black bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
              PLANIX
            </span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg mx-auto">
            <span className="text-white font-black text-sm">P</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-gradient-to-br hover:from-gray-100 hover:to-gray-50 rounded-lg transition-all hidden lg:block"
        >
          <ChevronLeft
            className={`transition-transform duration-300 text-gray-600 ${collapsed ? "rotate-180" : ""}`}
            size={20}
            strokeWidth={2.5}
          />
        </button>
        <button
          onClick={() => setMobileOpen(false)}
          className="p-2 hover:bg-gradient-to-br hover:from-gray-100 hover:to-gray-50 rounded-lg transition-all lg:hidden"
        >
          <X size={20} className="text-gray-600" strokeWidth={2.5} />
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
                    className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all duration-300 ${
                      isParentActive(item.submenu)
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30 scale-105"
                        : "text-gray-700 hover:bg-gradient-to-br hover:from-gray-100 hover:to-gray-50 hover:text-gray-900 hover:scale-105"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={20} strokeWidth={2.5} />
                      {!collapsed && <span className="font-bold">{item.title}</span>}
                    </div>
                    {!collapsed && (
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${openMenus[item.key] ? "rotate-180" : ""}`}
                      />
                    )}
                  </button>
                  {!collapsed && openMenus[item.key] && (
                    <ul className="mt-1 ml-4 pl-4 border-l-2 border-gray-200 space-y-1">
                      {item.submenu.map((subItem) => (
                        <li key={subItem.path}>
                          <NavLink
                            to={subItem.path}
                            onClick={handleNavClick}
                            className={`block px-3 py-2.5 rounded-lg text-sm transition-all duration-300 font-semibold ${
                              isActive(subItem.path)
                                ? "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 scale-105"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100 hover:scale-105"
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
                  onClick={handleNavClick}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 ${
                    isActive(item.path)
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30 scale-105"
                      : "text-gray-700 hover:bg-gradient-to-br hover:from-gray-100 hover:to-gray-50 hover:text-gray-900 hover:scale-105"
                  }`}
                >
                  <item.icon size={20} strokeWidth={2.5} />
                  {!collapsed && <span className="font-bold">{item.title}</span>}
                </NavLink>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200/40 bg-white/50">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 px-3 py-3 rounded-xl text-red-600 hover:bg-gradient-to-br hover:from-red-50 hover:to-red-100 transition-all duration-300 w-full font-bold hover:scale-105 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut size={20} strokeWidth={2.5} />
          {!collapsed && <span>Logout</span>}
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
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </div>

      {/* Sidebar - Desktop */}
      <div
        className={`hidden lg:block transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <SidebarContent />
      </div>
    </>
  );
};

export default Sidebar;
