import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Lock,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X,
  CalendarPlus,
  ListTodo,
  Clock,
} from 'lucide-react';

const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({
    events: true,
  });
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = (menu) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  };

  const isActive = (path) => location.pathname === path;
  const isParentActive = (paths) => paths.some((path) => location.pathname.startsWith(path));

  const menuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: '/admin/dashboard',
    },
    {
      title: 'Events',
      icon: Calendar,
      key: 'events',
      children: [
        { title: 'All Events', path: '/admin/events', badge: null },
        { title: 'Create New', path: '/admin/events/create', badge: null },
        { title: 'Lifecycle', path: '/admin/events/lifecycle', badge: null },
      ],
    },
    {
      title: 'Team',
      icon: Users,
      path: '/admin/team',
    },
    {
      title: 'Access Control',
      icon: Lock,
      path: '/admin/access/restrict'
    },
    {
      title: 'Reports',
      icon: BarChart3,
      path: '/admin/reports',
    },
    {
      title: 'Settings',
      icon: Settings,
      path: '/admin/settings',
    },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-gray-50">
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
      <nav className="flex-1 overflow-y-auto px-4">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.title}>
              {item.children ? (
                <div>
                  <button
                    onClick={() => toggleMenu(item.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-gray-700 hover:text-gray-900 group ${
                      isParentActive(item.children.map((c) => c.path))
                        ? 'text-gray-900'
                        : ''
                    }`}
                  >
                    <item.icon size={20} strokeWidth={1.5} />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left text-sm font-medium">{item.title}</span>
                        <ChevronDown 
                          size={16} 
                          className={`transition-transform text-gray-400 ${
                            expandedMenus[item.key] ? 'rotate-180' : ''
                          }`}
                        />
                      </>
                    )}
                  </button>
                  {!collapsed && expandedMenus[item.key] && (
                    <ul className="mt-1 space-y-0.5 ml-3 pl-6 border-l border-gray-200">
                      {item.children.map((child) => (
                        <li key={child.path}>
                          <NavLink
                            to={child.path}
                            className={({ isActive }) =>
                              `flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                                isActive 
                                  ? 'bg-white text-gray-900 font-medium shadow-sm' 
                                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                              }`
                            }
                          >
                            <span>{child.title}</span>
                            {child.badge && (
                              <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                                child.badge.color === 'orange' 
                                  ? 'bg-orange-100 text-orange-600' 
                                  : 'bg-emerald-100 text-emerald-600'
                              }`}>
                                {child.badge.value}
                              </span>
                            )}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      isActive 
                        ? 'bg-white text-gray-900 font-medium shadow-sm' 
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                    }`
                  }
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
    </div>
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
        className={`lg:hidden fixed inset-y-0 left-0 z-[110] w-64 bg-sidebar transform transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </div>

      {/* Sidebar - Desktop */}
      <div
        className={`hidden lg:block bg-sidebar transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <SidebarContent />
      </div>
    </>
  );
};

export default Sidebar;
