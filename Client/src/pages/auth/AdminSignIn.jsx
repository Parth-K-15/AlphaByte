import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Shield, Lock, BarChart3, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AdminSignIn = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        navigate(result.redirectPath);
      } else {
        setError(result.message || 'Failed to sign in. Please check your credentials.');
      }
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-amber-50/30 flex items-center justify-center p-4 lg:p-8">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="grid lg:grid-cols-2">
          {/* Left Side - Form */}
          <div className="p-8 lg:p-12 relative">
            {/* Back to Home Button */}
            <Link to="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition mb-6 font-medium">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to home</span>
            </Link>

            {/* Logo */}
            <div className="mb-8">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-black text-sm">P</span>
                </div>
                <span className="text-xl font-bold text-gray-900">PLANIX</span>
              </div>
            </div>

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                Admin Portal
              </h1>
              <p className="text-gray-600">
                Sign in to access admin dashboard
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Test Credentials */}
            <div className="mb-6 p-4 bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <h3 className="text-sm font-bold text-gray-900">Test Credentials (For Testing)</h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="bg-white/70 rounded-lg p-2">
                  <span className="font-semibold text-gray-700">Admin:</span>
                  <div className="text-gray-600 mt-1">admin@alphabyte.com / admin123</div>
                </div>
                <div className="bg-white/70 rounded-lg p-2">
                  <span className="font-semibold text-gray-700">Team Lead:</span>
                  <div className="text-gray-600 mt-1">lead@alphabyte.com / lead123</div>
                </div>
                <div className="bg-white/70 rounded-lg p-2">
                  <span className="font-semibold text-gray-700">Event Staff:</span>
                  <div className="text-gray-600 mt-1">staff@alphabyte.com / staff123</div>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  placeholder="admin@planix.com"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-bold rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-yellow-200"
              >
                {loading ? 'Signing in...' : 'Submit'}
              </button>
            </form>

            {/* OAuth Buttons */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl transition-colors font-medium"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  Apple
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-gray-50 border-2 border-gray-200 rounded-xl transition-colors font-medium"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </button>
              </div>
            </div>

            {/* Info Note */}
            <div className="mt-8 p-4 bg-indigo-50 rounded-xl">
              <p className="text-xs text-indigo-700 text-center">
                <Shield className="w-4 h-4 inline mr-1" />
                Admin accounts are created by system administrators only
              </p>
            </div>

            {/* Footer Links */}
            <div className="mt-6 flex items-center justify-center text-sm">
              <Link to="#" className="text-gray-500 hover:text-gray-700 transition">
                Terms & Conditions
              </Link>
            </div>
          </div>

          {/* Right Side - Image */}
          <div className="hidden lg:block relative bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-50 p-12">
            <div className="h-full flex items-center justify-center relative">
              {/* Decorative Cards */}
              <div className="absolute top-12 right-8 bg-white rounded-2xl shadow-xl p-4 max-w-xs">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-400 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Analytics</div>
                    <div className="text-sm font-bold text-gray-900">System Overview</div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-12 left-12 bg-white rounded-2xl shadow-xl p-4">
                <div className="text-sm font-bold text-gray-900 mb-2">Total Events</div>
                <div className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  247+
                </div>
              </div>

              <div className="absolute top-1/3 left-8 bg-white rounded-2xl shadow-xl p-4">
                <div className="text-sm font-bold text-gray-900 mb-2">Active Users</div>
                <div className="text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  12.5K
                </div>
              </div>

              {/* Main Image Placeholder */}
              <div className="text-center">
                <div className="w-64 h-64 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
                  <Shield className="w-32 h-32 text-white/90" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Admin Control Center</h3>
                <p className="text-gray-600">Manage your entire platform</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSignIn;
