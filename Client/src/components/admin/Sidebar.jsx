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
  ChevronRight,
  Menu,
  X,
  CalendarPlus,
  ListTodo,
  Clock,
  UserCog,
  UsersRound,
  Shield,
  UserX,
  Ban,
} from 'lucide-react';

const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({
    events: false,
    team: false,
    access: false,
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
      title: 'Events Management',
      icon: Calendar,
      key: 'events',
      children: [
        { title: 'All Events', icon: ListTodo, path: '/admin/events' },
        { title: 'Create Event', icon: CalendarPlus, path: '/admin/events/create' },
        { title: 'Event Lifecycle', icon: Clock, path: '/admin/events/lifecycle' },
      ],
    },
    {
      title: 'Team Management',
      icon: Users,
      path: '/admin/team',
    },
    {
      title: 'Access Control',
      icon: Lock,
      key: 'access',
      children: [
        { title: 'Restrict User', icon: UserX, path: '/admin/access/restrict' },
        { title: 'Suspended Accounts', icon: Ban, path: '/admin/access/suspended' },
      ],
    },
    {
      title: 'Analytics & Reports',
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
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-light">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">P</span>
          </div>
          {!collapsed && (
            <span className="text-white font-semibold text-lg">PLANIX</span>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-400 hover:text-white hidden lg:block"
        >
          <Menu size={20} />
        </button>
        <button
          onClick={() => setMobileOpen(false)}
          className="text-gray-400 hover:text-white lg:hidden"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.title}>
              {item.children ? (
                <div>
                  <button
                    onClick={() => toggleMenu(item.key)}
                    className={`w-full sidebar-item ${
                      isParentActive(item.children.map((c) => c.path))
                        ? 'bg-sidebar-light text-white'
                        : ''
                    }`}
                  >
                    <item.icon size={20} />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.title}</span>
                        {expandedMenus[item.key] ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </>
                    )}
                  </button>
                  {!collapsed && expandedMenus[item.key] && (
                    <ul className="ml-4 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <li key={child.path}>
                          <NavLink
                            to={child.path}
                            className={({ isActive }) =>
                              `sidebar-item text-sm ${
                                isActive ? 'sidebar-item-active' : ''
                              }`
                            }
                          >
                            <child.icon size={18} />
                            <span>{child.title}</span>
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
                    `sidebar-item ${isActive ? 'sidebar-item-active' : ''}`
                  }
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
      <div className="p-3 border-t border-sidebar-light">
        <button 
          onClick={handleLogout}
          className="sidebar-item w-full text-red-400 hover:bg-red-500/20 hover:text-red-300"
        >
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
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
