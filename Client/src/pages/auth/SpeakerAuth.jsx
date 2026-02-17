import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Presentation, Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react";

const SpeakerAuth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    bio: "",
  });

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        // Use the shared login — server will detect speaker
        const result = await login(formData.email, formData.password);
        if (result.success) {
          navigate(result.redirectPath || "/speaker");
        } else {
          setError(result.message || "Login failed");
        }
      } else {
        // Speaker signup
        const API_BASE_URL =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
        const response = await fetch(`${API_BASE_URL}/auth/speaker/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await response.json();

        if (data.success) {
          // Auto-login after signup
          localStorage.setItem("token", data.data.token);
          localStorage.setItem("role", data.data.user.role);
          localStorage.setItem("userId", data.data.user.id);
          localStorage.setItem("user", JSON.stringify(data.data.user));
          navigate(data.data.redirectPath || "/speaker");
          window.location.reload();
        } else {
          setError(data.message || "Signup failed");
        }
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex">
      {/* Left - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md">
          {/* Back */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-8 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>

          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center">
              <Presentation size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">PLANIX</h1>
              <p className="text-sm text-gray-500">Speaker Portal</p>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {isLogin ? "Welcome back, Speaker" : "Register as Speaker"}
          </h2>
          <p className="text-gray-600 mb-8">
            {isLogin
              ? "Sign in to manage your sessions and materials"
              : "Create your speaker account to get started"}
          </p>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {isLogin && (
            <div className="mb-4 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <h3 className="text-sm font-bold text-gray-900">Test Credentials (For Testing)</h3>
              </div>
              <div className="text-xs bg-white/70 rounded-lg p-2">
                <span className="font-semibold text-gray-700">Speaker:</span>
                <div className="text-gray-600 mt-1">parthkathane152005@gmail.com / 12345678</div>
              </div>
            </div>
          )}

          {/* Link to Participant Login */}
          <div className="mb-4 text-center p-3 rounded-xl bg-purple-50 border border-purple-200">
            <p className="text-sm text-gray-700">
              Are you a participant?{' '}
              <Link to="/login" className="text-purple-600 hover:text-purple-700 font-semibold underline">
                Sign in as Participant
              </Link>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required={!isLogin}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                  placeholder="Your full name"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                placeholder="speaker@example.com"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all pr-12"
                  placeholder="Min 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Phone (optional)
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                    placeholder="Your phone number"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Short Bio (optional)
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all resize-none"
                    placeholder="Tell organizers about yourself..."
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>

          {/* Toggle */}
          <p className="text-center text-sm text-gray-600 mt-6">
            {isLogin ? "Don't have a speaker account?" : "Already have an account?"}{" "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              className="text-emerald-600 font-semibold hover:underline"
            >
              {isLogin ? "Register" : "Sign In"}
            </button>
          </p>
        </div>
      </div>

      {/* Right - Visual Panel */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-10 right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-emerald-400/20 rounded-full blur-3xl"></div>

        <div className="relative z-10 text-white max-w-md">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8">
            <Presentation size={40} className="text-white" />
          </div>
          <h2 className="text-4xl font-bold mb-4">Speaker Portal</h2>
          <p className="text-lg text-emerald-100 mb-8 leading-relaxed">
            Manage your sessions, upload materials, track audience analytics, and
            connect with organizers — all in one place.
          </p>
          <div className="space-y-3">
            {[
              "View & manage assigned sessions",
              "Upload slides & resources",
              "Post session updates",
              "Track audience analytics",
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                </div>
                <span className="text-emerald-100">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeakerAuth;
