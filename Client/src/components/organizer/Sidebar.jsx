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
      title: "Events",
      icon: Calendar,
      key: "events",
      submenu: [
        { title: "My Events", path: "/organizer/events" },
        { title: "Attendance", path: "/organizer/attendance/qr" },
      ],
    },
    {
      title: "Participants",
      icon: Users,
      path: "/organizer/participants",
    },
    {
      title: "Communication",
      icon: Mail,
      submenu: [
        { title: "Send Emails", path: "/organizer/communication/email" },
        { title: "Announcements", path: "/organizer/communication/announcements" },
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
    <aside className="h-full bg-gray-50 flex flex-col">
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-6">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-lg">P</span>
          </div>
        )}
        <button
          onClick={() => setMobileOpen(false)}
          className="text-gray-400 hover:text-gray-600 lg:hidden"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto px-4">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.title}>
              {item.submenu ? (
                <>
                  <button
                    onClick={() => toggleMenu(item.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-gray-700 hover:text-gray-900 group ${
                      isParentActive(item.submenu) ? 'text-gray-900' : ''
                    }`}
                  >
                    <item.icon size={20} strokeWidth={1.5} />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left text-sm font-medium">{item.title}</span>
                        <ChevronDown
                          size={16}
                          className={`transition-transform text-gray-400 ${
                            openMenus[item.key] ? "rotate-180" : ""
                          }`}
                        />
                      </>
                    )}
                  </button>
                  {!collapsed && openMenus[item.key] && (
                    <ul className="mt-1 space-y-0.5 ml-3 pl-6 border-l border-gray-200">
                      {item.submenu.map((subItem) => (
                        <li key={subItem.path}>
                          <NavLink
                            to={subItem.path}
                            onClick={handleNavClick}
                            className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                              isActive(subItem.path)
                                ? "bg-white text-gray-900 font-medium shadow-sm"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            }`}
                          >
                            <span>{subItem.title}</span>
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
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    isActive(item.path)
                      ? "bg-white text-gray-900 font-medium shadow-sm"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <item.icon size={20} strokeWidth={1.5} />
                  {!collapsed && <span className="text-sm font-medium">{item.title}</span>}
                </NavLink>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all w-full"
        >
          <LogOut size={20} strokeWidth={1.5} />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
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
