import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  Clock,
  MapPin,
  Star,
  Search,
  Plus,
  Target,
  Award,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Filter,
  BookOpen,
  Zap,
  CheckCircle,
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const EventsHome = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [userStats, setUserStats] = useState({
    eventsAttended: 24,
    certificatesEarned: 18,
    learningGoal: 30,
    attendanceScore: 92,
  });

  useEffect(() => {
    fetchEvents();
  }, [search, statusFilter, typeFilter]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('type', typeFilter);

      const response = await fetch(`${API_BASE}/participant/events?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setEvents(data.data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      // Set mock data for demonstration
      setEvents([
        {
          _id: '1',
          title: 'Tech Conference 2024',
          status: 'upcoming',
          type: 'Online',
          startDate: '2024-03-15',
          registrationFee: 0,
          spotsLeft: 50,
        },
        {
          _id: '2',
          title: 'Professional Development Workshop',
          status: 'ongoing',
          type: 'Offline',
          startDate: '2024-03-10',
          registrationFee: 500,
          spotsLeft: 15,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const dayNames = ["M", "T", "W", "T", "F", "S", "S"];
  
  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };
  
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBA';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      upcoming: 'bg-blue-100 text-blue-800',
      ongoing: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/20 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">Hi, Amanda!</h1>
          <p className="text-gray-600 text-sm md:text-base">Let's take a look at your learning journey today</p>
        </div>
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search for events"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full md:w-64"
            />
          </div>
          <button className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg transition-all duration-300 flex items-center gap-2">
            <Plus size={16} />
            Join Event
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Main Learning Progress Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-purple-100 via-blue-50 to-purple-200 rounded-3xl p-6 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-gray-700 text-sm font-medium mb-1">Your Learning Progress for Today</h3>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                  <span className="text-xs text-gray-600 font-medium">Current attendance</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-800">{userStats.eventsAttended}</div>
                <div className="text-xs text-gray-600">Events</div>
              </div>
            </div>
            
            {/* Circular Progress */}
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="#8b5cf6"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${(userStats.attendanceScore) * 2.83} 283`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-2xl font-bold text-gray-800">{userStats.attendanceScore}%</div>
                  <div className="text-xs text-gray-600">Score</div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-1 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full"></div>
                  <span className="text-xs text-gray-600">Events joined</span>
                </div>
                <div className="text-lg font-bold text-gray-800">{userStats.eventsAttended}</div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"></div>
                  <span className="text-xs text-gray-600">Certificates</span>
                </div>
                <div className="text-lg font-bold text-gray-800">{userStats.certificatesEarned}</div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-1 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"></div>
                  <span className="text-xs text-gray-600">This month</span>
                </div>
                <div className="text-lg font-bold text-gray-800">8</div>
              </div>
            </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute -right-20 -top-20 w-40 h-40 bg-gradient-to-br from-purple-300 to-blue-300 rounded-full opacity-30 blur-3xl"></div>
          <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-gradient-to-tr from-blue-200 to-purple-200 rounded-full opacity-40 blur-2xl"></div>
        </div>

        {/* Calendar Widget */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-6 text-white">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-medium">Your Event Days</h3>
            <div className="text-xs text-gray-300">June ⌄</div>
          </div>
          
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <button onClick={previousMonth} className="p-1 hover:bg-gray-700 rounded-lg transition-colors">
                <ChevronLeft size={16} />
              </button>
              <h4 className="font-medium">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h4>
              <button onClick={nextMonth} className="p-1 hover:bg-gray-700 rounded-lg transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(day => (
                <div key={day} className="text-center text-xs text-gray-400 p-2">{day}</div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDayOfMonth }, (_, i) => (
                <div key={`empty-${i}`} className="p-2"></div>
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const isToday = today.getDate() === day && 
                               today.getMonth() === currentMonth.getMonth() && 
                               today.getFullYear() === currentMonth.getFullYear();
                const hasEvent = [8, 15, 22, 28].includes(day);
                
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))}
                    className={`p-2 text-sm rounded-lg transition-all ${
                      isToday 
                        ? 'bg-purple-400 text-white font-bold' 
                        : hasEvent 
                        ? 'bg-gray-600 text-white' 
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">Current day</span>
              <span className="text-purple-400">●</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">Event days</span>
              <span className="text-gray-300">●</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Learning Goal */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-800">Learning Goal</h3>
            <div className="text-xs text-gray-500">Goal: {userStats.learningGoal}</div>
          </div>
          <div className="text-center py-4">
            <div className="relative w-24 h-24 mx-auto mb-4">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="#f3f4f6"
                  strokeWidth="6"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="#10b981"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={`${(userStats.eventsAttended / userStats.learningGoal) * 283} 283`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-xl font-bold text-gray-800">{userStats.eventsAttended}</div>
                <div className="text-xs text-gray-500">of {userStats.learningGoal}</div>
              </div>
            </div>
            <button className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors">
              Change Goal <Target size={14} />
            </button>
          </div>
        </div>

        {/* Recent Learning */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-medium text-gray-800">My Learning Activity</h3>
            <button className="text-sm font-medium text-gray-600 hover:text-gray-800 flex items-center gap-1">
              View All <Plus size={14} />
            </button>
          </div>
          
          <div className="space-y-4">
            {[
              {
                name: 'Web Development Bootcamp',
                instructor: 'Sarah Wilson',
                progress: '8/10',
                completion: 80,
                avatar: '💻',
                color: 'from-blue-500 to-cyan-500'
              },
              {
                name: 'Data Science Workshop',
                instructor: 'Michael Chen',
                progress: '6/8',
                completion: 75,
                avatar: '📊',
                color: 'from-green-500 to-emerald-500'
              },
              {
                name: 'UI/UX Design Masterclass',
                instructor: 'Lisa Anderson',
                progress: '4/6',
                completion: 67,
                avatar: '🎨',
                color: 'from-purple-500 to-pink-500'
              },
              {
                name: 'Machine Learning Basics',
                instructor: 'David Kumar',
                progress: '3/5',
                completion: 60,
                avatar: '🤖',
                color: 'from-orange-500 to-red-500'
              },
            ].map((course, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="text-xl">{course.avatar}</div>
                  <div>
                    <div className="font-medium text-gray-800 text-sm">{course.name}</div>
                    <div className="text-xs text-gray-500">Instructor: {course.instructor}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 mb-1">Completed: {course.progress}</div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${course.color} rounded-full`}
                        style={{ width: `${course.completion}%` }}
                      />
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <Star size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-medium text-gray-800">Upcoming Events</h3>
            <Link to="/participant/calendar" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              View All
            </Link>
          </div>
          
          <div className="space-y-6">
            {events.slice(0, 3).map((event, index) => {
              // Different gradient backgrounds for variety
              const gradients = [
                'from-cyan-400 via-blue-500 to-purple-600',
                'from-pink-400 via-purple-500 to-indigo-600', 
                'from-orange-400 via-red-500 to-pink-600'
              ];
              
              const eventDate = event.startDate ? new Date(event.startDate) : null;
              const daysLeft = eventDate ? Math.ceil((eventDate - new Date()) / (1000 * 60 * 60 * 24)) : null;
              
              return (
                <Link
                  key={event._id}
                  to={`/participant/event/${event._id}`}
                  className="block group"
                >
                  <div className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                    {/* Background Image/Gradient */}
                    <div className={`h-48 bg-gradient-to-br ${gradients[index % 3]} relative`}>
                      {/* Overlay pattern for texture */}
                      <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-6 left-6 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
                        <div className="absolute bottom-8 right-8 w-16 h-16 bg-white/10 rounded-full blur-lg"></div>
                        <div className="absolute top-1/2 right-1/4 w-12 h-12 bg-white/5 rounded-full blur-md"></div>
                      </div>
                      
                      {/* Status Badge */}
                      <div className="absolute top-4 left-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-gray-800 backdrop-blur-sm">
                          {event.status === 'upcoming' && '🔥 UPCOMING'}
                          {event.status === 'ongoing' && '🏃 ONGOING'}
                          {event.status === 'completed' && '✅ COMPLETED'}
                        </span>
                      </div>
                      
                      {/* Days Left */}
                      {daysLeft && daysLeft > 0 && (
                        <div className="absolute top-4 right-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-black/20 text-white backdrop-blur-sm">
                            {daysLeft} DAYS LEFT
                          </span>
                        </div>
                      )}
                      
                      {/* Content */}
                      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
                        <h3 className="text-white font-bold text-lg mb-2 leading-tight">
                          {event.title}
                        </h3>
                        
                        {/* Location */}
                        <div className="flex items-center text-white/90 text-sm mb-3">
                          <MapPin size={14} className="mr-1.5" />
                          <span>Online Event 🌐</span>
                          {event.type && (
                            <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-md text-xs font-medium">
                              {event.type}
                            </span>
                          )}
                        </div>
                        
                        {/* Event Details Row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-white/80 text-xs">
                            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-2">
                              <Users size={12} />
                            </div>
                            <span className="font-medium">Organizer: Event Team</span>
                          </div>
                          
                          <div className="text-right">
                            {event.registrationFee > 0 ? (
                              <div className="text-white font-bold text-sm">₹{event.registrationFee}</div>
                            ) : (
                              <div className="text-green-300 font-bold text-sm">FREE</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-medium text-gray-800 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { name: 'Scan QR', icon: CheckCircle, color: 'from-blue-500 to-cyan-500', path: '/participant/qr-scanner' },
              { name: 'My Events', icon: Calendar, color: 'from-purple-500 to-pink-500', path: '/participant/registrations' },
              { name: 'Certificates', icon: Award, color: 'from-green-500 to-emerald-500', path: '/participant/certificates' },
              { name: 'Profile', icon: Users, color: 'from-orange-500 to-red-500', path: '/participant/profile' },
            ].map((action, index) => (
              <Link
                key={index}
                to={action.path}
                className="flex flex-col items-center gap-3 p-4 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-all duration-300 hover:scale-105 group"
              >
                <div className={`p-3 rounded-xl bg-gradient-to-br ${action.color} text-white group-hover:shadow-lg transition-all`}>
                  <action.icon size={20} />
                </div>
                <span className="text-xs font-medium text-gray-700">{action.name}</span>
              </Link>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-800">Learning Streak</h4>
                <p className="text-xs text-gray-600 mt-1">Keep up the great work!</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-blue-600">12</div>
                <div className="text-xs text-gray-500">days</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventsHome;
