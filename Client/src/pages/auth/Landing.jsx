import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  Users, Shield, Calendar, Zap, CheckCircle, BarChart3, 
  Award, Clock, TrendingUp, Star, ArrowRight, Sparkles,
  Target, Globe, Lock, Smartphone, MapPin, Mic
} from 'lucide-react';

const Landing = () => {
  const [scrollY, setScrollY] = useState(0);
  const [email, setEmail] = useState('');
  const [currentFeature, setCurrentFeature] = useState(0);
  const [currentRole, setCurrentRole] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToFeature = (index) => {
    const container = document.getElementById('features-scroll');
    if (container) {
      const cardWidth = 320 + 24; // card width + gap
      container.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth'
      });
    }
  };

  const scrollToRole = (index) => {
    const container = document.getElementById('roles-scroll');
    if (container) {
      const cardWidth = window.innerWidth * 0.85 + 24; // 85vw + gap
      container.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth'
      });
    }
  };

  const handleFeatureScroll = (e) => {
    const container = e.target;
    const cardWidth = 320 + 24;
    const index = Math.round(container.scrollLeft / cardWidth);
    setCurrentFeature(index);
  };

  const handleRoleScroll = (e) => {
    const container = e.target;
    const cardWidth = window.innerWidth * 0.85 + 24;
    const index = Math.round(container.scrollLeft / cardWidth);
    setCurrentRole(index);
  };

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-gray-100 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200/50">
              <span className="text-white font-black text-xl">P</span>
            </div>
            <span className="text-2xl font-black text-gray-900">PLANIX</span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition font-medium">Features</a>
            <a href="#why" className="text-gray-600 hover:text-gray-900 transition font-medium">Why Us</a>
            <a href="#roles" className="text-gray-600 hover:text-gray-900 transition font-medium">Get Started</a>
            <a href="#roles" className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-indigo-300/50 transition-all duration-300 hover:scale-105">
              Sign In
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full border border-indigo-100">
                <Sparkles size={16} className="text-indigo-600" />
                <span className="text-sm font-bold text-indigo-600">Transform Your Event Management</span>
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-gray-900 leading-tight">
                Put <span className="relative inline-block">
                  events
                  <span className="absolute bottom-2 left-0 w-full h-4 bg-gradient-to-r from-indigo-400/30 to-purple-400/30 -z-10"></span>
                </span> first
              </h1>
              
              <p className="text-lg sm:text-xl text-gray-600 max-w-2xl leading-relaxed">
                Fast, user-friendly and engaging - turn event chaos into seamless experiences. 
                Streamline registrations, attendance, and certificates with your own branded platform.
              </p>

              {/* Email Signup */}
              {/* <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto lg:mx-0">
                <input
                  type="email"
                  placeholder="Enter work email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-5 py-4 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none text-gray-900 placeholder-gray-400 transition-all"
                />
                <button className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold hover:shadow-xl hover:shadow-emerald-300/50 transition-all duration-300 hover:scale-105 whitespace-nowrap">
                  Book a demo
                </button>
              </div> */}

              {/* Stats */}
              <div className="flex flex-wrap gap-8 justify-center lg:justify-start pt-4">
                <div>
                  <div className="text-4xl font-black text-gray-900 mb-1">75.2%</div>
                  <div className="text-sm text-gray-600 font-medium">Average daily activity</div>
                </div>
                <div>
                  <div className="text-4xl font-black text-gray-900 mb-1">~20k</div>
                  <div className="text-sm text-gray-600 font-medium">Average daily users</div>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-3 justify-center lg:justify-start">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={20} className={`${i < 4 ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-300 text-gray-300'}`} />
                  ))}
                </div>
                <span className="text-lg font-black text-gray-900">4.5</span>
                <span className="text-sm text-gray-500">Average user rating</span>
              </div>
            </div>

            {/* Right Side - Illustration/Cards */}
            <div className="relative hidden lg:block">
              <div className="relative" style={{ transform: `translateY(${scrollY * 0.1}px)` }}>
                {/* Floating Cards */}
                <div className="absolute top-0 right-20 w-64 bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 transform rotate-3 hover:rotate-0 transition-all duration-500">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <Calendar size={24} className="text-white" />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-gray-900">342</div>
                      <div className="text-xs text-gray-500">Active Events</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full w-3/4"></div>
                    <div className="h-2 bg-gray-100 rounded-full w-full"></div>
                    <div className="h-2 bg-gray-100 rounded-full w-5/6"></div>
                  </div>
                </div>

                <div className="absolute top-40 -left-10 w-72 bg-gradient-to-br from-emerald-400 via-cyan-500 to-blue-600 rounded-2xl shadow-2xl overflow-hidden transform -rotate-2 hover:rotate-0 transition-all duration-500" style={{ transform: `translateY(${scrollY * 0.05}px) rotate(-2deg)` }}>
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-4 left-4 w-16 h-16 bg-white/20 rounded-full blur-lg"></div>
                    <div className="absolute bottom-6 right-6 w-12 h-12 bg-white/15 rounded-full blur-md"></div>
                  </div>
                  
                  {/* Status Badge */}
                  <div className="absolute top-4 left-4 z-10">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-gray-800">
                      🔥 UPCOMING
                    </span>
                  </div>
                  
                  {/* Days Left */}
                  <div className="absolute top-4 right-4 z-10">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-black/20 text-white backdrop-blur-sm">
                      2 DAYS LEFT
                    </span>
                  </div>

                  {/* Content */}
                  <div className="relative p-6 pt-16 bg-gradient-to-t from-black/60 to-transparent h-full flex flex-col justify-end">
                    <h4 className="font-bold text-white text-lg mb-2">Tech Summit 2026</h4>
                    <div className="flex items-center text-white/90 text-sm mb-3">
                      <MapPin size={12} className="mr-1" />
                      <span>Toronto, Canada 🇨🇦</span>
                    </div>
                    <div className="flex items-center text-white/90 text-xs mb-3">
                      <span>Mumbai, India 🇮🇳 +2 more</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-white/80 text-xs">
                        <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-2">
                          <Users size={10} />
                        </div>
                        <span>Agent: Johannes Doelf</span>
                      </div>
                      <span className="text-white font-bold text-sm">1,234 registered</span>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-10 right-10 w-60 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-2xl p-6 text-white transform rotate-6 hover:rotate-0 transition-all duration-500">
                  <div className="flex items-center justify-between mb-3">
                    <Award size={32} strokeWidth={2.5} />
                    <TrendingUp size={24} />
                  </div>
                  <div className="text-3xl font-black mb-1">95%</div>
                  <div className="text-sm opacity-90">Completion Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full border border-indigo-100 mb-4">
              <Target size={16} className="text-indigo-600" />
              <span className="text-sm font-bold text-indigo-600">Powerful Features</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">Everything you need</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              All-in-one platform to manage events from start to finish
            </p>
          </div>

          {/* Desktop Grid */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { 
                icon: Calendar, 
                title: 'Smart Event Lifecycle', 
                desc: 'Create, schedule, and manage events with intelligent workflows and automation', 
                color: 'from-blue-500 to-indigo-600',
                bgColor: 'bg-blue-50'
              },
              { 
                icon: Users, 
                title: 'Team Collaboration', 
                desc: 'Assign roles, manage permissions, and coordinate with your team seamlessly', 
                color: 'from-purple-500 to-pink-600',
                bgColor: 'bg-purple-50'
              },
              { 
                icon: BarChart3, 
                title: 'Real-time Analytics', 
                desc: 'Track registrations, attendance, and engagement with live dashboards', 
                color: 'from-emerald-500 to-teal-600',
                bgColor: 'bg-emerald-50'
              },
              { 
                icon: Zap, 
                title: 'Instant Notifications', 
                desc: 'Keep everyone updated with automated emails and push notifications', 
                color: 'from-yellow-500 to-orange-600',
                bgColor: 'bg-yellow-50'
              },
              { 
                icon: Award, 
                title: 'Auto Certificates', 
                desc: 'Generate and distribute beautiful certificates automatically', 
                color: 'from-red-500 to-pink-600',
                bgColor: 'bg-red-50'
              },
              { 
                icon: Shield, 
                title: 'Enterprise Security', 
                desc: 'Bank-level encryption with role-based access control', 
                color: 'from-indigo-500 to-purple-600',
                bgColor: 'bg-indigo-50'
              }
            ].map((feature, i) => (
              <div 
                key={i} 
                className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-2xl border border-gray-100 transition-all duration-500 hover:-translate-y-2"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                  <feature.icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* Mobile Horizontal Scroll */}
          <div 
            id="features-scroll"
            className="md:hidden overflow-x-auto pb-8 -mx-4 px-4 snap-x"
            onScroll={handleFeatureScroll}
          >
            <div className="flex gap-6" style={{ width: 'max-content' }}>
              {[
                { 
                  icon: Calendar, 
                  title: 'Smart Event Lifecycle', 
                  desc: 'Create, schedule, and manage events with intelligent workflows and automation', 
                  color: 'from-blue-500 to-indigo-600',
                  bgColor: 'bg-blue-50'
                },
                { 
                  icon: Users, 
                  title: 'Team Collaboration', 
                  desc: 'Assign roles, manage permissions, and coordinate with your team seamlessly', 
                  color: 'from-purple-500 to-pink-600',
                  bgColor: 'bg-purple-50'
                },
                { 
                  icon: BarChart3, 
                  title: 'Real-time Analytics', 
                  desc: 'Track registrations, attendance, and engagement with live dashboards', 
                  color: 'from-emerald-500 to-teal-600',
                  bgColor: 'bg-emerald-50'
                },
                { 
                  icon: Zap, 
                  title: 'Instant Notifications', 
                  desc: 'Keep everyone updated with automated emails and push notifications', 
                  color: 'from-yellow-500 to-orange-600',
                  bgColor: 'bg-yellow-50'
                },
                { 
                  icon: Award, 
                  title: 'Auto Certificates', 
                  desc: 'Generate and distribute beautiful certificates automatically', 
                  color: 'from-red-500 to-pink-600',
                  bgColor: 'bg-red-50'
                },
                { 
                  icon: Shield, 
                  title: 'Enterprise Security', 
                  desc: 'Bank-level encryption with role-based access control', 
                  color: 'from-indigo-500 to-purple-600',
                  bgColor: 'bg-indigo-50'
                }
              ].map((feature, i) => (
                <div 
                  key={i} 
                  className="flex-shrink-0 w-80 bg-white rounded-2xl p-8 shadow-sm border border-gray-100 snap-center"
                >
                  <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>
                    <feature.icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Dots Indicator for Mobile */}
          <div className="md:hidden flex justify-center gap-2 -mt-4">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <button
                key={index}
                onClick={() => scrollToFeature(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  currentFeature === index 
                    ? 'bg-indigo-600 w-6' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to feature ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section id="why" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full border border-purple-100 mb-6">
                <Sparkles size={16} className="text-purple-600" />
                <span className="text-sm font-bold text-purple-600">Why PLANIX</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-6">
                Built for modern event teams
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                We understand the challenges of event management. That's why we've built a platform 
                that simplifies every step while giving you complete control.
              </p>

              <div className="space-y-6">
                {[
                  { icon: Clock, title: 'Save 10+ hours per event', desc: 'Automate repetitive tasks and focus on what matters' },
                  { icon: Globe, title: 'Scale effortlessly', desc: 'From 50 to 5000 participants, we grow with you' },
                  { icon: Lock, title: 'Bank-grade security', desc: 'Your data is encrypted and protected 24/7' },
                  { icon: Smartphone, title: 'Mobile-first design', desc: 'Manage events on the go with our responsive platform' }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 items-start group">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                      <item.icon size={20} className="text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900 text-lg mb-1">{item.title}</h4>
                      <p className="text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="relative bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-8 border border-indigo-100">
                <img 
                  src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80" 
                  alt="Event Management" 
                  className="rounded-2xl shadow-2xl w-full"
                />
                <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-2xl p-6 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center">
                      <CheckCircle size={32} className="text-white" strokeWidth={3} />
                    </div>
                    <div>
                      <div className="text-3xl font-black text-gray-900">98%</div>
                      <div className="text-sm text-gray-600">Satisfaction Rate</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role Selection Section */}
      <section id="roles" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-gray-600 mb-3 tracking-wide uppercase">Pro plus</p>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-4">
              SignUp<br />Options
            </h2>
          </div>

          {/* Desktop Grid */}
          <div className="hidden md:grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Admin Card */}
            <Link to="/admin-auth" className="group">
              <div className="relative bg-gradient-to-br from-indigo-50/80 to-purple-100/60 backdrop-blur-sm rounded-[2.5rem] p-10 hover:shadow-2xl transition-all duration-500 border border-white/60 h-full flex flex-col">
                <div className="flex-1">
                  {/* Icon */}
                  <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center">
                      <Shield className="w-8 h-8 text-white" strokeWidth={2} />
                    </div>
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-3xl font-light text-gray-900 text-center mb-3">
                    Admin Portal
                  </h3>
                  
                  {/* Subtitle */}
                  <p className="text-center text-gray-600 text-sm mb-6">
                    Event Organizer
                  </p>
                  
                  {/* Description */}
                  <p className="text-center text-gray-700 mb-8 leading-relaxed">
                    Full control over event creation, team management, participant tracking, and analytics.
                  </p>
                  
                  {/* Features */}
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        </div>
                        <span className="text-gray-700 font-medium">Create & manage events</span>
                      </div>
                      <CheckCircle className="w-5 h-5 text-indigo-600" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        </div>
                        <span className="text-gray-700 font-medium">Manage teams & staff</span>
                      </div>
                      <CheckCircle className="w-5 h-5 text-indigo-600" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        </div>
                        <span className="text-gray-700 font-medium">Track attendance</span>
                      </div>
                      <CheckCircle className="w-5 h-5 text-indigo-600" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        </div>
                        <span className="text-gray-700 font-medium">Generate reports</span>
                      </div>
                      <CheckCircle className="w-5 h-5 text-indigo-600" />
                    </div>
                  </div>
                </div>
                
                {/* CTA Button */}
                <div className="flex justify-center pt-6">
                  <div className="w-16 h-16 bg-gray-900 hover:bg-gray-800 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-xl">
                    <ArrowRight className="w-6 h-6 text-white transform group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
                  </div>
                </div>
              </div>
            </Link>

            {/* Participant Card */}
            <Link to="/login" className="group">
              <div className="relative bg-white backdrop-blur-sm rounded-[2.5rem] p-10 hover:shadow-2xl transition-all duration-500 border border-gray-200 h-full flex flex-col">
                <div className="flex-1">
                  {/* Badge */}
                  <div className="flex justify-center mb-6">
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full">
                      <Sparkles size={14} className="text-purple-600" />
                      <span className="text-sm font-bold text-purple-700">Pro Version</span>
                    </div>
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-3xl font-light text-gray-900 text-center mb-3">
                    Participant
                  </h3>
                  
                  {/* Subtitle */}
                  <p className="text-center text-gray-600 text-sm mb-6">
                    Event Attendee
                  </p>
                  
                  {/* Description */}
                  <p className="text-center text-gray-700 mb-8 leading-relaxed">
                    Browse events, register for programs, track attendance, and collect certificates.
                  </p>
                  
                  {/* Features */}
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        </div>
                        <span className="text-gray-700 font-medium">Browse events</span>
                      </div>
                      <CheckCircle className="w-5 h-5 text-purple-600" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        </div>
                        <span className="text-gray-700 font-medium">Register easily</span>
                      </div>
                      <CheckCircle className="w-5 h-5 text-purple-600" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        </div>
                        <span className="text-gray-700 font-medium">View certificates</span>
                      </div>
                      <CheckCircle className="w-5 h-5 text-purple-600" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        </div>
                        <span className="text-gray-700 font-medium">Track history</span>
                      </div>
                      <CheckCircle className="w-5 h-5 text-purple-600" />
                    </div>
                  </div>
                </div>
                
                {/* CTA Button */}
                <div className="flex justify-center pt-6">
                  <div className="w-16 h-16 bg-white border-2 border-gray-900 hover:bg-gray-900 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-xl group">
                    <ArrowRight className="w-6 h-6 text-gray-900 group-hover:text-white transform group-hover:translate-x-1 transition-all" strokeWidth={2.5} />
                  </div>
                </div>
              </div>
            </Link>

            {/* Speaker Card */}
            <Link to="/speaker-auth" className="group">
              <div className="relative bg-gradient-to-br from-emerald-50/80 to-teal-100/60 backdrop-blur-sm rounded-[2.5rem] p-10 hover:shadow-2xl transition-all duration-500 border border-emerald-200/60 h-full flex flex-col">
                <div className="flex-1">
                  {/* Icon */}
                  <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center">
                      <Mic className="w-8 h-8 text-white" strokeWidth={2} />
                    </div>
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-3xl font-light text-gray-900 text-center mb-3">
                    Speaker
                  </h3>
                  
                  {/* Subtitle */}
                  <p className="text-center text-gray-600 text-sm mb-6">
                    Session Presenter
                  </p>
                  
                  {/* Description */}
                  <p className="text-center text-gray-700 mb-8 leading-relaxed">
                    Manage sessions, upload materials, post updates, and track audience analytics.
                  </p>
                  
                  {/* Features */}
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        </div>
                        <span className="text-gray-700 font-medium">Manage sessions</span>
                      </div>
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        </div>
                        <span className="text-gray-700 font-medium">Upload materials</span>
                      </div>
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        </div>
                        <span className="text-gray-700 font-medium">Post updates</span>
                      </div>
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        </div>
                        <span className="text-gray-700 font-medium">Track analytics</span>
                      </div>
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                  </div>
                </div>
                
                {/* CTA Button */}
                <div className="flex justify-center pt-6">
                  <div className="w-16 h-16 bg-emerald-600 hover:bg-emerald-700 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-xl">
                    <ArrowRight className="w-6 h-6 text-white transform group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Mobile Carousel */}
          <div 
            id="roles-scroll"
            className="md:hidden overflow-x-auto pb-8 -mx-4 px-4 snap-x"
            onScroll={handleRoleScroll}
          >
            <div className="flex gap-6" style={{ width: 'max-content' }}>
              {/* Admin Card Mobile */}
              <Link to="/admin-auth" className="group flex-shrink-0 w-[85vw] max-w-sm snap-center">
                <div className="relative bg-gradient-to-br from-indigo-50/80 to-purple-100/60 backdrop-blur-sm rounded-[2.5rem] p-10 hover:shadow-2xl transition-all duration-500 border border-white/60 h-full flex flex-col">
                  <div className="flex-1">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                      <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center">
                        <Shield className="w-8 h-8 text-white" strokeWidth={2} />
                      </div>
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-3xl font-light text-gray-900 text-center mb-3">
                      Admin Portal
                    </h3>
                    
                    {/* Subtitle */}
                    <p className="text-center text-gray-600 text-sm mb-6">
                      Event Organizer
                    </p>
                    
                    {/* Description */}
                    <p className="text-center text-gray-700 mb-8 leading-relaxed">
                      Full control over event creation, team management, participant tracking, and analytics.
                    </p>
                    
                    {/* Features */}
                    <div className="space-y-4 mb-8">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                          </div>
                          <span className="text-gray-700 font-medium">Create & manage events</span>
                        </div>
                        <CheckCircle className="w-5 h-5 text-indigo-600" />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                          </div>
                          <span className="text-gray-700 font-medium">Manage teams & staff</span>
                        </div>
                        <CheckCircle className="w-5 h-5 text-indigo-600" />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                          </div>
                          <span className="text-gray-700 font-medium">Track attendance</span>
                        </div>
                        <CheckCircle className="w-5 h-5 text-indigo-600" />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                          </div>
                          <span className="text-gray-700 font-medium">Generate reports</span>
                        </div>
                        <CheckCircle className="w-5 h-5 text-indigo-600" />
                      </div>
                    </div>
                  </div>
                  
                  {/* CTA Button */}
                  <div className="flex justify-center pt-6">
                    <div className="w-16 h-16 bg-gray-900 hover:bg-gray-800 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-xl">
                      <ArrowRight className="w-6 h-6 text-white transform group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
                    </div>
                  </div>
                </div>
              </Link>

              {/* Participant Card Mobile */}
              <Link to="/login" className="group flex-shrink-0 w-[85vw] max-w-sm snap-center">
                <div className="relative bg-white backdrop-blur-sm rounded-[2.5rem] p-10 hover:shadow-2xl transition-all duration-500 border border-gray-200 h-full flex flex-col">
                  <div className="flex-1">
                    {/* Badge */}
                    <div className="flex justify-center mb-6">
                      <div className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full">
                        <Sparkles size={14} className="text-purple-600" />
                        <span className="text-sm font-bold text-purple-700">Pro Version</span>
                      </div>
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-3xl font-light text-gray-900 text-center mb-3">
                      Participant
                    </h3>
                    
                    {/* Subtitle */}
                    <p className="text-center text-gray-600 text-sm mb-6">
                      Event Attendee
                    </p>
                    
                    {/* Description */}
                    <p className="text-center text-gray-700 mb-8 leading-relaxed">
                      Browse events, register for programs, track attendance, and collect certificates.
                    </p>
                    
                    {/* Features */}
                    <div className="space-y-4 mb-8">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                          </div>
                          <span className="text-gray-700 font-medium">Browse events</span>
                        </div>
                        <CheckCircle className="w-5 h-5 text-purple-600" />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                          </div>
                          <span className="text-gray-700 font-medium">Register easily</span>
                        </div>
                        <CheckCircle className="w-5 h-5 text-purple-600" />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                          </div>
                          <span className="text-gray-700 font-medium">View certificates</span>
                        </div>
                        <CheckCircle className="w-5 h-5 text-purple-600" />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                          </div>
                          <span className="text-gray-700 font-medium">Track history</span>
                        </div>
                        <CheckCircle className="w-5 h-5 text-purple-600" />
                      </div>
                    </div>
                  </div>
                  
                  {/* CTA Button */}
                  <div className="flex justify-center pt-6">
                    <div className="w-16 h-16 bg-white border-2 border-gray-900 hover:bg-gray-900 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-xl group">
                      <ArrowRight className="w-6 h-6 text-gray-900 group-hover:text-white transform group-hover:translate-x-1 transition-all" strokeWidth={2.5} />
                    </div>
                  </div>
                </div>
              </Link>

              {/* Speaker Card Mobile */}
              <Link to="/speaker-auth" className="group flex-shrink-0 w-[85vw] max-w-sm snap-center">
                <div className="relative bg-gradient-to-br from-emerald-50/80 to-teal-100/60 backdrop-blur-sm rounded-[2.5rem] p-10 hover:shadow-2xl transition-all duration-500 border border-emerald-200/60 h-full flex flex-col">
                  <div className="flex-1">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                      <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center">
                        <Mic className="w-8 h-8 text-white" strokeWidth={2} />
                      </div>
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-3xl font-light text-gray-900 text-center mb-3">
                      Speaker
                    </h3>
                    
                    {/* Subtitle */}
                    <p className="text-center text-gray-600 text-sm mb-6">
                      Session Presenter
                    </p>
                    
                    {/* Description */}
                    <p className="text-center text-gray-700 mb-8 leading-relaxed">
                      Manage sessions, upload materials, post updates, and track audience analytics.
                    </p>
                    
                    {/* Features */}
                    <div className="space-y-4 mb-8">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                          </div>
                          <span className="text-gray-700 font-medium">Manage sessions</span>
                        </div>
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                          </div>
                          <span className="text-gray-700 font-medium">Upload materials</span>
                        </div>
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                          </div>
                          <span className="text-gray-700 font-medium">Post updates</span>
                        </div>
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                          </div>
                          <span className="text-gray-700 font-medium">Track analytics</span>
                        </div>
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      </div>
                    </div>
                  </div>
                  
                  {/* CTA Button */}
                  <div className="flex justify-center pt-6">
                    <div className="w-16 h-16 bg-emerald-600 hover:bg-emerald-700 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-xl">
                      <ArrowRight className="w-6 h-6 text-white transform group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Dots Indicator for Mobile */}
          <div className="md:hidden flex justify-center gap-2 -mt-4 mb-8">
            {[0, 1, 2].map((index) => (
              <button
                key={index}
                onClick={() => scrollToRole(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  currentRole === index 
                    ? 'bg-indigo-600 w-6' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to ${['Admin', 'Participant', 'Speaker'][index]} option`}
              />
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 text-sm">
              New to PLANIX? You'll create your account after selecting your role.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-orange-500 via-red-500 to-orange-600 relative overflow-hidden">
        {/* Wavy Pattern Background */}
        <div className="absolute inset-0">
          {/* Grid Lines */}
          <div className="absolute inset-0 opacity-20">
            {[...Array(8)].map((_, i) => (
              <div key={`v-${i}`} className="absolute h-full w-px bg-gray-900" style={{ left: `${(i + 1) * 12.5}%` }}></div>
            ))}
            {[...Array(4)].map((_, i) => (
              <div key={`h-${i}`} className="absolute w-full h-px bg-gray-900" style={{ top: `${(i + 1) * 25}%` }}></div>
            ))}
          </div>
          {/* Wavy Top */}
          <svg className="absolute top-0 left-0 w-full" viewBox="0 0 1200 100" preserveAspectRatio="none">
            <path d="M0,50 Q150,20 300,50 T600,50 T900,50 T1200,50 L1200,0 L0,0 Z" fill="#FEF3C7" />
          </svg>
          {/* Wavy Bottom */}
          <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1200 100" preserveAspectRatio="none">
            <path d="M0,50 Q150,80 300,50 T600,50 T900,50 T1200,50 L1200,100 L0,100 Z" fill="#FEF3C7" />
          </svg>
        </div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Badges */}
          <div className="flex justify-between items-center mb-8 max-w-4xl mx-auto">
            <div className="transform -rotate-12 bg-emerald-400 text-gray-900 px-5 py-2.5 rounded-lg border-4 border-gray-900 shadow-xl">
              <div className="text-xs font-bold uppercase">Limited Time</div>
              <div className="text-lg font-black italic">Free Forever</div>
            </div>
            <div className="transform rotate-12">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-600 rounded-full animate-ping opacity-75"></div>
                <div className="relative bg-blue-600 text-white px-6 py-6 rounded-full border-4 border-white shadow-2xl">
                  <div className="text-2xl font-black italic transform -rotate-12">Join Now!</div>
                </div>
              </div>
            </div>
          </div>

          {/* Main CTA Button */}
          <a href="#roles" className="inline-block mb-8 group">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 px-16 py-6 rounded-full border-4 border-gray-900 shadow-2xl hover:scale-105 transition-all duration-300">
              <span className="text-3xl sm:text-4xl font-black italic">Get Started</span>
            </div>
          </a>
          
          <p className="text-xl sm:text-2xl text-gray-900 font-bold max-w-3xl mx-auto leading-relaxed">
            From small meetups to grand conferences, PLANIX has everything you need to organize spectacular events.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Top Section with Links */}
          <div className="flex flex-col md:flex-row justify-between gap-12 mb-20">
            {/* Logo */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                <span className="text-gray-900 font-black text-2xl">P</span>
              </div>
            </div>

            {/* Links Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 flex-1 max-w-3xl">
              {/* The Good */}
              <div>
                <h4 className="text-gray-500 font-medium mb-6 text-sm">The Good</h4>
                <ul className="space-y-3">
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Home</a></li>
                  <li><a href="#features" className="text-gray-400 hover:text-white transition-colors text-sm">Features</a></li>
                  <li><a href="#why" className="text-gray-400 hover:text-white transition-colors text-sm">Why Us</a></li>
                  <li><a href="#roles" className="text-gray-400 hover:text-white transition-colors text-sm">Get Started</a></li>
                </ul>
              </div>

              {/* The Boring */}
              <div>
                <h4 className="text-gray-500 font-medium mb-6 text-sm">The Boring</h4>
                <ul className="space-y-3">
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Terms of Use</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Privacy Policy</a></li>
                </ul>
              </div>

              {/* The Cool */}
              <div>
                <h4 className="text-gray-500 font-medium mb-6 text-sm">The Cool</h4>
                <ul className="space-y-3">
                  <li><a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors text-sm">X</a></li>
                  <li><a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors text-sm">Instagram</a></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Giant Brand Name */}
          <div className="overflow-hidden">
            <h2 className="text-[120px] sm:text-[180px] md:text-[240px] lg:text-[280px] font-black leading-none tracking-tight">
              PLANIX
            </h2>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
