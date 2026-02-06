import { Link } from 'react-router-dom';
import { Users, Shield, Calendar, Zap, CheckCircle, BarChart3 } from 'lucide-react';
// import logo from '../../assets/EventSync logo.png';
const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img src='/EventSync logo (1).png' alt="EventSync" className="h-10 object-contain" />
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition">Features</a>
            <a href="#roles" className="text-gray-600 hover:text-gray-900 transition">Get Started</a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Event Management
            <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Simplified
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Manage events effortlessly with EventSync. From registration to certification, 
            handle everything in one powerful platform.
          </p>
          <div className="flex justify-center gap-4">
            <a href="#roles" className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-indigo-200 transition">
              Get Started
            </a>
            <button className="px-8 py-3 bg-white text-gray-900 rounded-lg font-semibold border border-gray-200 hover:border-gray-300 transition shadow-sm">
              Learn More
            </button>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-16">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Calendar, title: 'Event Management', desc: 'Create, schedule, and manage events effortlessly', color: 'indigo' },
              { icon: Users, title: 'User Management', desc: 'Handle participant registration and team assignments', color: 'purple' },
              { icon: BarChart3, title: 'Analytics', desc: 'Track attendance, engagement, and event performance', color: 'blue' },
              { icon: Zap, title: 'Real-time Updates', desc: 'Instant notifications and live event updates', color: 'indigo' },
              { icon: CheckCircle, title: 'Certificates', desc: 'Auto-generate and distribute certificates', color: 'purple' },
              { icon: Shield, title: 'Security', desc: 'Role-based access control and data protection', color: 'blue' }
            ].map((feature, i) => {
              const colorMap = {
                indigo: 'bg-indigo-50 text-indigo-600',
                purple: 'bg-purple-50 text-purple-600',
                blue: 'bg-blue-50 text-blue-600'
              };
              return (
                <div key={i} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md border border-gray-100 transition">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${colorMap[feature.color]}`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Role Selection Section */}
        <section id="roles" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-4">Choose Your Role</h2>
          <p className="text-gray-600 text-center mb-16 max-w-2xl mx-auto">
            Sign in or create an account based on your role. Admins manage events and teams, 
            while participants browse and register for events.
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Admin Card */}
            <Link to="/admin-auth" className="group">
              <div className="bg-white rounded-2xl p-8 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-indigo-500 h-full">
                <div className="flex justify-center mb-6">
                  <div className="p-6 bg-indigo-100 rounded-full group-hover:bg-indigo-500 transition-colors">
                    <Shield className="w-16 h-16 text-indigo-600 group-hover:text-white transition-colors" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 text-center mb-4">Admin Portal</h3>
                <p className="text-gray-600 text-center mb-2 font-medium">Event Organizer</p>
                <p className="text-gray-600 text-center mb-6">
                  Full control over event creation, team management, participant tracking, and analytics.
                </p>
                <ul className="space-y-2 mb-8 text-sm text-gray-600">
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-indigo-600" /> Create & manage events</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-indigo-600" /> Manage teams & staff</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-indigo-600" /> Track attendance</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-indigo-600" /> Generate reports</li>
                </ul>
                <div className="text-center">
                  <span className="inline-block px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold group-hover:bg-indigo-700 transition shadow-md">
                    Sign In as Admin
                  </span>
                </div>
              </div>
            </Link>

            {/* Participant Card */}
            <Link to="/login" className="group">
              <div className="bg-white rounded-2xl p-8 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-purple-500 h-full">
                <div className="flex justify-center mb-6">
                  <div className="p-6 bg-purple-100 rounded-full group-hover:bg-purple-500 transition-colors">
                    <Users className="w-16 h-16 text-purple-600 group-hover:text-white transition-colors" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 text-center mb-4">Participant</h3>
                <p className="text-gray-600 text-center mb-2 font-medium">Event Attendee</p>
                <p className="text-gray-600 text-center mb-6">
                  Browse events, register for programs, track attendance, and collect certificates.
                </p>
                <ul className="space-y-2 mb-8 text-sm text-gray-600">
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-purple-600" /> Browse events</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-purple-600" /> Register easily</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-purple-600" /> View certificates</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-purple-600" /> Track history</li>
                </ul>
                <div className="text-center">
                  <span className="inline-block px-8 py-3 bg-purple-600 text-white rounded-lg font-semibold group-hover:bg-purple-700 transition shadow-md">
                    Sign In as Participant
                  </span>
                </div>
              </div>
            </Link>
          </div>

          <div className="text-center text-gray-600">
            <p>New to EventSync? You'll create your account after selecting your role.</p>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img src="/EventSync logo (1).png" alt="EventSync" className="h-20 w-auto object-contain" />
              </div>
              <p className="text-gray-600 text-sm">Professional event management platform</p>
            </div>
            <div>
              <h4 className="text-gray-900 font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li><a href="#" className="hover:text-gray-900 transition">Features</a></li>
                <li><a href="#" className="hover:text-gray-900 transition">Pricing</a></li>
                <li><a href="#" className="hover:text-gray-900 transition">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-gray-900 font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li><a href="#" className="hover:text-gray-900 transition">About</a></li>
                <li><a href="#" className="hover:text-gray-900 transition">Blog</a></li>
                <li><a href="#" className="hover:text-gray-900 transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-gray-900 font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li><a href="#" className="hover:text-gray-900 transition">Privacy</a></li>
                <li><a href="#" className="hover:text-gray-900 transition">Terms</a></li>
                <li><a href="#" className="hover:text-gray-900 transition">Support</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8 flex justify-between items-center text-gray-600 text-sm">
            <p>&copy; 2026 EventSync. All rights reserved.</p>
            <div className="flex space-x-6">
              <a href="#" className="hover:text-gray-900 transition">Twitter</a>
              <a href="#" className="hover:text-gray-900 transition">LinkedIn</a>
              <a href="#" className="hover:text-gray-900 transition">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
