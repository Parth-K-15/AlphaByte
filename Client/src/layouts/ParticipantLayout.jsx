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
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-cyan-200 to-blue-200 rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full opacity-20 blur-3xl animate-pulse" style={{animationDelay: '1.5s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-gradient-to-br from-teal-200 to-cyan-200 rounded-full opacity-20 blur-3xl animate-pulse" style={{animationDelay: '3s'}}></div>
      </div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-white/60 sticky top-0 z-[100]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-black text-lg">AB</span>
              </div>
              <div>
                <span className="text-xl font-black bg-gradient-to-r from-cyan-600 to-indigo-600 bg-clip-text text-transparent">AlphaByte</span>
                <span className="ml-2 text-xs text-gray-500 font-semibold">Events</span>
              </div>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <span className="text-sm text-gray-700 font-semibold hidden sm:inline">{user.email}</span>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all hover:scale-105"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <NavLink
                  to="/login"
                  className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-cyan-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all hover:scale-105"
                >
                  Login / Register
                </NavLink>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        <Outlet />
      </main>

      {/* Bottom Navigation - Mobile First */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-white/60 shadow-2xl z-[100]">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-around items-center">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  `relative flex flex-col items-center py-3 px-3 text-xs transition-all duration-300 ${
                    isActive
                      ? 'text-cyan-600 font-black'
                      : 'text-gray-500 hover:text-gray-700 font-semibold'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`text-xl mb-1 transition-transform duration-300 ${
                      isActive ? 'scale-110' : ''
                    }`}>{item.icon}</span>
                    <span className="hidden sm:inline">{item.label}</span>
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
