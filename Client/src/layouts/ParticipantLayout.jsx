import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ParticipantLayout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/participant', label: 'Home', icon: '🏠', exact: true },
    { path: '/participant/calendar', label: 'Calendar', icon: '📅' },
    { path: '/participant/registrations', label: 'My Registrations', icon: '🎟️' },
    { path: '/participant/history', label: 'History', icon: '📜' },
    { path: '/participant/certificates', label: 'Certificates', icon: '🏆' },
    { path: '/participant/profile', label: 'Profile', icon: '👤' },
  ];

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
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        <Outlet />
      </main>

      {/* Bottom Navigation - Mobile First */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-white/60 shadow-2xl z-[100]">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex justify-around items-center px-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  `relative flex flex-col items-center py-2 sm:py-3 px-2 sm:px-3 text-[10px] sm:text-xs transition-all duration-300 min-w-0 ${
                    isActive
                      ? 'text-cyan-600 font-black'
                      : 'text-gray-500 hover:text-gray-700 font-semibold'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`text-lg sm:text-xl mb-0.5 sm:mb-1 transition-transform duration-300 ${
                      isActive ? 'scale-110' : ''
                    }`}>{item.icon}</span>
                    <span className="hidden sm:inline truncate max-w-[80px] text-center">{item.label}</span>
                    {isActive && (
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-full"></div>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default ParticipantLayout;
