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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <span className="text-2xl font-bold text-indigo-600">AlphaByte</span>
              <span className="ml-2 text-sm text-gray-500">Events</span>
            </div>

            {/* User Info */}
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="text-sm text-gray-600">{user.email}</span>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <NavLink
                  to="/login"
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Login / Register
                </NavLink>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        <Outlet />
      </main>

      {/* Bottom Navigation - Mobile First */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-around items-center">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  `flex flex-col items-center py-3 px-2 text-xs transition-colors ${
                    isActive
                      ? 'text-indigo-600 font-medium'
                      : 'text-gray-500 hover:text-gray-700'
                  }`
                }
              >
                <span className="text-xl mb-1">{item.icon}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default ParticipantLayout;
