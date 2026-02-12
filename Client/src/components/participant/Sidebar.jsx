import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Home,
  Calendar,
  Ticket,
  History,
  Award,
  User,
  LogOut,
  X,
} from "lucide-react";

const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const { logout } = useAuth();
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
    { title: "Profile", icon: User, path: "/participant/profile" },
  ];

  const SidebarContent = () => (
    <aside className="h-full bg-gray-50 flex flex-col">
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">P</span>
          </div>
        </div>
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
              <NavLink
                to={item.path}
                end={item.end}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? "bg-white text-gray-900 font-medium shadow-sm"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
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

      {/* Logout */}
      <div className="p-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all w-full"
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
        <SidebarContent />
      </div>

      {/* Sidebar - Desktop */}
      <div className="hidden lg:block w-64">
        <SidebarContent />
      </div>
    </>
  );
};

export default Sidebar;
