import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    // Return safe defaults instead of throwing during HMR/fast refresh
    return {
      user: null,
      token: null,
      loading: true,
      isAuthenticated: false,
      login: async () => ({ success: false, message: 'Auth not initialized' }),
      signup: async () => ({ success: false, message: 'Auth not initialized' }),
      logout: () => {},
      hasRole: () => false,
      getRedirectPath: () => '/login',
    };
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    const abortController = new AbortController();

    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const response = await authApi.getMe();

          // Guard: only act if the token hasn't changed while getMe() was in-flight
          // (e.g. user logged in fresh while the stale-token request was pending)
          const currentToken = localStorage.getItem('token');
          if (abortController.signal.aborted) return;

          if (currentToken === storedToken) {
            if (response.success) {
              setUser(response.data);
              setToken(storedToken);
            } else {
              logout();
            }
          }
          // If token changed, skip — the new login already set state
        } catch (error) {
          if (abortController.signal.aborted) return;
          console.error('Auth init error:', error);
          // Only logout if no fresh login has occurred in the meantime
          const currentToken = localStorage.getItem('token');
          if (currentToken === storedToken || !currentToken) {
            logout();
          }
        }
      }
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth:expired events dispatched by API services on 401
    const handleAuthExpired = () => {
      logout();
    };
    window.addEventListener('auth:expired', handleAuthExpired);

    return () => {
      abortController.abort();
      window.removeEventListener('auth:expired', handleAuthExpired);
    };
  }, []);

  const login = async (email, password) => {
    try {
      console.log('AuthContext - Login attempt:', { email, password: '***' });
      const response = await authApi.login({ email, password });
      console.log('AuthContext - Login response:', response);
      if (response.success) {
        const { token: newToken, user: userData, redirectPath } = response.data;
        localStorage.setItem('token', newToken);
        localStorage.setItem('role', userData.role);
        localStorage.setItem('userId', userData.id);
        localStorage.setItem('user', JSON.stringify(userData)); // Store complete user object
        setToken(newToken);
        setUser(userData);
        return { success: true, redirectPath };
      }
      return { success: false, message: response.message };
    } catch (error) {
      console.error('AuthContext - Login error:', error);
      return { success: false, message: error.message || 'Login failed' };
    }
  };

  const signup = async (userData) => {
    try {
      const response = await authApi.signup(userData);
      if (response.success) {
        const { token: newToken, user: newUser } = response.data;
        localStorage.setItem('token', newToken);
        localStorage.setItem('role', newUser.role);
        localStorage.setItem('userId', newUser.id);
        localStorage.setItem('user', JSON.stringify(newUser)); // Store complete user object
        setToken(newToken);
        setUser(newUser);
        return { success: true, redirectPath: '/participant' };
      }
      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: error.message || 'Signup failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('user'); // Remove user object
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token && !!user;

  const hasRole = (roles) => {
    if (!user) return false;
    if (typeof roles === 'string') return user.role === roles;
    return roles.includes(user.role);
  };

  const getRedirectPath = () => {
    if (!user) return '/login';
    switch (user.role) {
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

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    signup,
    logout,
    hasRole,
    getRedirectPath,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
