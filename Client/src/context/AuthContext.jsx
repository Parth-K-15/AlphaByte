import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const response = await authApi.getMe();
          if (response.success) {
            setUser(response.data);
            setToken(storedToken);
          } else {
            // Token invalid, clear storage
            logout();
          }
        } catch (error) {
          console.error('Auth init error:', error);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
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
