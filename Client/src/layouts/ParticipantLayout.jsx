import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, CalendarDays, ScanLine, ClipboardList, User } from 'lucide-react';

const ParticipantLayout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const leftNav = [
    { path: '/participant', label: 'Home', icon: Home, exact: true },
    { path: '/participant/registrations', label: 'Events', icon: ClipboardList },
  ];

  const rightNav = [
    { path: '/participant/calendar', label: 'Calendar', icon: CalendarDays },
    { path: '/participant/profile', label: 'Profile', icon: User },
  ];

  const NavItem = ({ item }) => (
    <NavLink
      to={item.path}
      end={item.exact}
      className={({ isActive }) =>
        `relative flex flex-col items-center gap-0.5 py-2 px-3 transition-all duration-200 ${
          isActive
            ? 'text-cyan-600'
            : 'text-gray-400 hover:text-gray-600'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <item.icon
            size={22}
            strokeWidth={isActive ? 2.5 : 1.8}
            className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}
          />
          <span className={`text-[10px] sm:text-xs leading-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
            {item.label}
          </span>
          {isActive && (
            <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-5 h-[3px] bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-full" />
          )}
        </>
      )}
    </NavLink>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 relative overflow-x-hidden">
      {/* Animated background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-cyan-200 to-blue-200 rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full opacity-20 blur-3xl animate-pulse" style={{animationDelay: '1.5s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-gradient-to-br from-teal-200 to-cyan-200 rounded-full opacity-20 blur-3xl animate-pulse" style={{animationDelay: '3s'}}></div>
      </div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-white/60 sticky top-0 z-[100]">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-white font-black text-base sm:text-lg">P</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="text-lg sm:text-xl font-black bg-gradient-to-r from-cyan-600 to-indigo-600 bg-clip-text text-transparent truncate">PLANIX</span>
                  <span className="text-xs text-gray-500 font-semibold hidden xs:inline flex-shrink-0">Events</span>
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              {user ? (
                <>
                  <span className="text-xs sm:text-sm text-gray-700 font-semibold hidden md:inline truncate max-w-[150px] lg:max-w-none">{user.email}</span>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all hover:scale-105 whitespace-nowrap"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <NavLink
                  to="/login"
                  className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold bg-gradient-to-r from-cyan-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all hover:scale-105 whitespace-nowrap"
                >
                  Login
                </NavLink>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28">
        <Outlet />
      </main>

      {/* Bottom Navigation with Floating QR Button */}
      <nav className="fixed bottom-0 left-0 right-0 z-[100]">
        <div className="w-full max-w-7xl mx-auto relative">
          {/* Floating QR Scan Button */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-7 z-10">
            <NavLink
              to="/participant/scan"
              className={({ isActive }) =>
                `group relative flex items-center justify-center w-[62px] h-[62px] rounded-full shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl ${
                  isActive
                    ? 'bg-gradient-to-br from-cyan-500 to-indigo-600 shadow-cyan-500/40'
                    : 'bg-gradient-to-br from-cyan-500 to-indigo-600 shadow-indigo-500/30'
                }`
              }
            >
              <ScanLine size={28} strokeWidth={2.2} className="text-white" />
              {/* Pulse ring */}
              <span className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500 animate-ping opacity-20" />
            </NavLink>
            <span className="block text-center text-[10px] sm:text-xs font-bold text-gray-500 mt-1">Scan</span>
          </div>

          {/* Nav Bar */}
          <div className="bg-white/95 backdrop-blur-xl border-t border-gray-200/60 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
            <div className="flex items-end justify-around px-2 h-[64px]">
              {/* Left nav items */}
              {leftNav.map((item) => (
                <NavItem key={item.path} item={item} />
              ))}

              {/* Spacer for center button */}
              <div className="w-[76px] flex-shrink-0" />

              {/* Right nav items */}
              {rightNav.map((item) => (
                <NavItem key={item.path} item={item} />
              ))}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default ParticipantLayout;
