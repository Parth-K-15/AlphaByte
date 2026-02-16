import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

// Protected Route wrapper - redirects to login if not authenticated
export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={40} className="animate-spin text-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login, save the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access if allowedRoles specified
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Redirect to appropriate dashboard based on user role
    const redirectPath = getRedirectByRole(user?.role);
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

// Public Route wrapper - redirects to dashboard if already authenticated
export const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={40} className="animate-spin text-primary-600" />
      </div>
    );
  }

  if (isAuthenticated) {
    // Redirect to appropriate dashboard
    const redirectPath = getRedirectByRole(user?.role);
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

// Helper to get redirect path by role
const getRedirectByRole = (role) => {
  switch (role) {
    case 'ADMIN':
      return '/admin/dashboard';
    case 'TEAM_LEAD':
    case 'EVENT_STAFF':
      return '/organizer';
    case 'SPEAKER':
      return '/speaker';
    case 'PARTICIPANT':
      return '/participant';
    default:
      return '/login';
  }
};

export default ProtectedRoute;
