import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  QrCode,
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  Search,
  Bell,
  ChevronLeft,
  ChevronRight,
  Target,
  Zap,
  Plus,
  Star,
} from 'lucide-react';
import { getDashboardStats } from '../../services/organizerApi';

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-emerald-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
  };

  const bgColorClasses = {
    blue: 'bg-gradient-to-br from-blue-50 to-blue-100/50',
    green: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50',
    purple: 'bg-gradient-to-br from-purple-50 to-purple-100/50',
    orange: 'bg-gradient-to-br from-orange-50 to-orange-100/50',
  };

  return (
    <div className={`relative ${bgColorClasses[color]} rounded-2xl p-4 md:p-6 border border-white/60 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group overflow-hidden`}>
      {/* Decorative gradient orb */}
      <div className={`absolute -right-8 -top-8 w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br ${colorClasses[color]} rounded-full opacity-10 group-hover:opacity-20 transition-opacity blur-2xl`}></div>
      
      <div className="relative z-0">
        <div className="flex items-start justify-between mb-2 md:mb-4">
          <div className={`p-2 md:p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} shadow-lg`}>
            <Icon size={20} strokeWidth={2.5} className="text-white md:w-6 md:h-6" />
          </div>
        </div>
        <p className="text-gray-600 text-[10px] md:text-xs font-semibold uppercase tracking-wider mb-1 md:mb-2">{title}</p>
        <h3 className="text-2xl md:text-4xl font-black text-gray-900 mb-1 md:mb-2">{value}</h3>
        {trend && (
          <div className={`inline-flex items-center gap-1.5 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-bold ${trend === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
            <TrendingUp size={12} className={trend === 'down' ? 'rotate-180' : ''} strokeWidth={3} />
            <span className="hidden md:inline">{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const EventCard = ({ event }) => {
  const statusColors = {
    upcoming: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
    ongoing: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white',
    completed: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white',
  };

  return (
    <div className="group bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-white/60 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="font-bold text-gray-900 text-base group-hover:text-blue-600 transition-colors">{event.title || event.name}</h4>
          <p className="text-sm text-gray-600 mt-1 font-semibold">{event.date}</p>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-xs font-black shadow-lg ${statusColors[event.status]}`}>
          {event.status}
        </span>
      </div>
      <div className="mt-4 hidden md:flex items-center gap-6 text-sm text-gray-700">
        <span className="flex items-center gap-1.5">
          <Users size={16} strokeWidth={2.5} className="text-blue-500" />
          <span className="font-black text-gray-900">{event.participants}</span>
          <span className="font-semibold">participants</span>
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle size={16} strokeWidth={2.5} className="text-emerald-500" />
          <span className="font-black text-gray-900">{event.attendance}%</span>
          <span className="font-semibold">attendance</span>
        </span>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalParticipants: 0,
    totalAttendance: 0,
    certificatesIssued: 0,
    activeEvents: 0,
    completedEvents: 0,
    upcomingEvents: 0,
  });
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await getDashboardStats();
      if (response.data.success) {
        const apiStats = response.data.data.stats;
        const apiEvents = response.data.data.recentEvents || [];
        
        // Calculate attendance percentage from raw numbers
        const attendancePercentage = apiStats.totalParticipants > 0 
          ? Math.round((apiStats.totalAttendance / apiStats.totalParticipants) * 100)
          : 0;
        
        setStats({
          totalEvents: apiStats.totalEvents || 0,
          totalParticipants: apiStats.totalParticipants || 0,
          totalAttendance: attendancePercentage,
          certificatesIssued: apiStats.totalCertificates || 0,
          activeEvents: apiStats.activeEvents || 0,
          completedEvents: apiStats.completedEvents || 0,
          upcomingEvents: apiStats.upcomingEvents || 0,
        });
        
        // Format recent events data
        const formattedEvents = apiEvents.map(event => ({
          id: event._id,
          title: event.title || event.name,
          date: event.startDate ? new Date(event.startDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }) : 'TBA',
          status: event.status?.toLowerCase() || 'draft',
          participants: event.participantCount || 0,
          attendance: event.attendancePercentage || 0,
          venue: event.venue || 'Online'
        }));
        
        setRecentEvents(formattedEvents);
      } else {
        setError(response.data.message || 'Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to connect to server. Please check your connection and try again.');
      // Don't set fallback dummy data - keep everything at 0
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/20 p-4 md:p-6">
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 font-medium">Loading dashboard data...</p>
          </div>
        </div>
      )}

      {/* Content - Only show when not loading */}
      {!loading && (
        <>
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">Hi, Organizer!</h1>
              <p className="text-gray-600 text-sm md:text-base">Let's take a look at your activity today</p>
            </div>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search for event data"
                  className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full md:w-64"
                />
              </div>
              <Link
                to="/organizer/events/create"
                className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg transition-all duration-300 flex items-center gap-2"
              >
                <Plus size={16} />
                Create Event
              </Link>
            </div>
          </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Main Event Stats Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-orange-100 via-yellow-50 to-orange-200 rounded-3xl p-6 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-gray-700 text-sm font-medium mb-1">Your Event Results for Today</h3>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <span className="text-xs text-gray-600 font-medium">Current event</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-800">{stats.totalEvents}</div>
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
                    stroke="#f59e0b"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${stats.totalAttendance * 2.83} 283`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-2xl font-bold text-gray-800">{stats.totalAttendance}%</div>
                  <div className="text-xs text-gray-600">Attendance</div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-1 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full"></div>
                  <span className="text-xs text-gray-600">Participants</span>
                </div>
                <div className="text-lg font-bold text-gray-800">{stats.totalParticipants}</div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-1 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full"></div>
                  <span className="text-xs text-gray-600">Certificates</span>
                </div>
                <div className="text-lg font-bold text-gray-800">{stats.certificatesIssued}</div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"></div>
                  <span className="text-xs text-gray-600">Active Events</span>
                </div>
                <div className="text-lg font-bold text-gray-800">{stats.activeEvents}</div>
              </div>
            </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute -right-20 -top-20 w-40 h-40 bg-gradient-to-br from-yellow-200 to-orange-300 rounded-full opacity-30 blur-3xl"></div>
          <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-gradient-to-tr from-orange-200 to-yellow-200 rounded-full opacity-40 blur-2xl"></div>
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
                
                // Check if any events fall on this day
                const hasEvent = recentEvents.some(event => {
                  if (!event.date) return false;
                  const eventDate = new Date(event.date);
                  return eventDate.getDate() === day &&
                         eventDate.getMonth() === currentMonth.getMonth() &&
                         eventDate.getFullYear() === currentMonth.getFullYear();
                });
                
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))}
                    className={`p-2 text-sm rounded-lg transition-all ${
                      isToday 
                        ? 'bg-yellow-400 text-gray-900 font-bold' 
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
              <span className="text-yellow-400">●</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">Event days</span>
              <span className="text-gray-300">●</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Event Goals */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-800">Events for Today</h3>
            <div className="text-xs text-gray-500">Goal: {Math.max(stats.totalEvents, 5)}</div>
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
                  stroke="#ef4444"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={`${Math.min((stats.totalEvents / Math.max(stats.totalEvents, 5)) * 283, 283)} 283`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-xl font-bold text-gray-800">{stats.totalEvents}</div>
              <div className="text-xs text-gray-500">of {Math.max(stats.totalEvents, 5)}</div>
              </div>
            </div>
            <button className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors">
              Change Goal <Target size={14} />
            </button>
          </div>
        </div>

        {/* Recent Events Activity */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-medium text-gray-800">Recent Events Activity</h3>
            <Link 
              to="/organizer/events" 
              className="text-sm font-medium text-gray-600 hover:text-gray-800 flex items-center gap-1"
            >
              View All <ArrowUpRight size={14} />
            </Link>
          </div>
          
          <div className="space-y-4">
            {recentEvents.length > 0 ? (
              recentEvents.slice(0, 4).map((event, index) => (
                <div key={event.id || index} className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="text-xl">
                      {event.status === 'upcoming' && '🗓️'}
                      {event.status === 'ongoing' && '🚀'}
                      {event.status === 'completed' && '✅'}
                      {event.status === 'draft' && '📝'}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800 text-sm">{event.title}</div>
                      <div className="text-xs text-gray-500">Date: {event.date} | Venue: {event.venue}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 mb-1">Participants: {event.participants}</div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                          style={{ width: `${event.attendance}%` }}
                        />
                      </div>
                      <Link to={`/organizer/events/${event.id}`} className="text-gray-400 hover:text-gray-600">
                        <ArrowUpRight size={16} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">📅</div>
                <p className="text-gray-600 font-medium">No recent events</p>
                <p className="text-gray-500 text-sm">Create your first event to get started!</p>
                <Link 
                  to="/organizer/events/create"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <Plus size={16} />
                  Create Event
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-medium text-gray-800 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { name: 'Generate QR', icon: QrCode, color: 'from-blue-500 to-cyan-500', path: '/organizer/attendance/qr' },
              { name: 'Send Email', icon: Bell, color: 'from-purple-500 to-pink-500', path: '/organizer/communication' },
              { name: 'View Analytics', icon: BarChart3, color: 'from-green-500 to-emerald-500', path: '/organizer/reports' },
              { name: 'Issue Certificates', icon: Award, color: 'from-orange-500 to-red-500', path: '/organizer/certificates' },
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
        </div>

        {/* Progress Overview */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-medium text-gray-800">Event Progress</h3>
            <span className="text-xs text-gray-500">{stats.totalEvents > 0 ? Math.round((stats.completedEvents / stats.totalEvents) * 100) : 0}% Completed</span>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Total Events</span>
                <span className="font-medium">{stats.totalEvents}/5</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" style={{ width: `${stats.totalEvents > 0 ? Math.min((stats.totalEvents / 5) * 100, 100) : 0}%` }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Attendance Rate</span>
                <span className="font-medium">{stats.totalAttendance}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" style={{ width: `${stats.totalAttendance}%` }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Certificates Issued</span>
                <span className="font-medium">{stats.certificatesIssued}/{Math.max(stats.totalParticipants, 300)}</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: `${stats.totalParticipants > 0 ? (stats.certificatesIssued / stats.totalParticipants) * 100 : 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 shadow-lg max-w-md">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertCircle size={20} className="text-red-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-red-800">Error</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
