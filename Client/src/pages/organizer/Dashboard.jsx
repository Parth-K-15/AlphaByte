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
    <div className={`relative ${bgColorClasses[color]} rounded-2xl p-6 border border-white/60 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group overflow-hidden`}>
      {/* Decorative gradient orb */}
      <div className={`absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br ${colorClasses[color]} rounded-full opacity-10 group-hover:opacity-20 transition-opacity blur-2xl`}></div>
      
      <div className="relative z-0">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} shadow-lg`}>
            <Icon size={24} strokeWidth={2.5} className="text-white" />
          </div>
        </div>
        <p className="text-gray-600 text-xs font-semibold uppercase tracking-wider mb-2">{title}</p>
        <h3 className="text-4xl font-black text-gray-900 mb-2">{value}</h3>
        {trend && (
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${trend === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
            <TrendingUp size={14} className={trend === 'down' ? 'rotate-180' : ''} strokeWidth={3} />
            {trendValue}
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
      <div className="mt-4 flex items-center gap-6 text-sm text-gray-700">
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
  });
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await getDashboardStats();
      if (response.data.success) {
        const apiStats = response.data.data.stats;
        const apiEvents = response.data.data.recentEvents || [];
        
        setStats({
          totalEvents: apiStats.totalEvents,
          totalParticipants: apiStats.totalParticipants,
          totalAttendance: apiStats.totalAttendance,
          certificatesIssued: apiStats.totalCertificates,
        });
        setRecentEvents(apiEvents);
      } else {
        setError(response.data.message || 'Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to connect to server. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { title: 'Generate QR', icon: QrCode, path: '/organizer/attendance/qr', bgColor: 'bg-blue-50', textColor: 'text-blue-600', borderColor: 'border-blue-200' },
    { title: 'View Participants', icon: Users, path: '/organizer/participants', bgColor: 'bg-emerald-50', textColor: 'text-emerald-600', borderColor: 'border-emerald-200' },
    { title: 'Send Email', icon: AlertCircle, path: '/organizer/communication/email', bgColor: 'bg-purple-50', textColor: 'text-purple-600', borderColor: 'border-purple-200' },
    { title: 'Issue Certificates', icon: Award, path: '/organizer/certificates/generate', bgColor: 'bg-amber-50', textColor: 'text-amber-600', borderColor: 'border-amber-200' },
  ];

  return (
    <div className="space-y-8">
      {/* Error Message */}
      {error && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 shadow-lg">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertCircle size={20} className="text-red-600" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-sm font-bold text-red-800">Error</p>
            <p className="text-sm text-red-600 font-semibold">{error}</p>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-block">
            <h1 className="text-4xl font-black text-gray-900 mb-2 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text">Dashboard Overview</h1>
            <div className="h-1 w-24 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"></div>
          </div>
          <p className="text-gray-600 mt-3 text-lg">Track your events and manage participants efficiently</p>
        </div>
        <Link
          to="/organizer/events"
          className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl hover:shadow-xl transition-all duration-300 font-semibold hover:scale-105"
        >
          View All Events
          <ArrowUpRight size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Assigned Events"
          value={stats.totalEvents || 3}
          icon={Calendar}
          trend="up"
          trendValue="+2 this month"
          color="blue"
        />
        <StatCard
          title="Total Participants"
          value={stats.totalParticipants || 315}
          icon={Users}
          trend="up"
          trendValue="+45 this week"
          color="green"
        />
        <StatCard
          title="Avg. Attendance"
          value={`${stats.totalAttendance || 88}%`}
          icon={QrCode}
          color="purple"
        />
        <StatCard
          title="Certificates Issued"
          value={stats.certificatesIssued || 240}
          icon={Award}
          trend="up"
          trendValue="+120 this month"
          color="orange"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/60 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></span>
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.path}
              className={`group relative flex flex-col items-center gap-3 p-6 rounded-xl border ${action.borderColor} ${action.bgColor} hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className={`relative z-10 ${action.textColor} group-hover:scale-110 transition-transform duration-300`}>
                <action.icon size={28} strokeWidth={2.5} />
              </div>
              <span className="relative z-10 text-sm font-bold text-gray-800 text-center">{action.title}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Events & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Events */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/60 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-gradient-to-b from-emerald-500 to-blue-500 rounded-full"></span>
              My Events
            </h2>
            <Link to="/organizer/events" className="group text-sm text-gray-900 hover:text-blue-600 font-bold flex items-center gap-1 transition-colors">
              View All 
              <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentEvents.length > 0 ? recentEvents.map((event) => (
              <EventCard key={event.id || event._id} event={event} />
            )) : (
              <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl border border-dashed border-gray-300">
                <div className="p-4 bg-white/80 rounded-2xl shadow-md inline-block mb-4">
                  <Calendar size={48} className="text-blue-500 opacity-50" strokeWidth={2} />
                </div>
                <p className="text-gray-600 font-semibold">No events yet. Create your first event from the Admin panel.</p>
              </div>
            )}
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/60 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></span>
            Recent Activity
          </h2>
          <div className="space-y-4">
            {[
              { icon: Users, text: '5 new participants registered', time: '10 min ago', bgColor: 'bg-emerald-50', iconColor: 'text-emerald-600' },
              { icon: QrCode, text: 'QR code scanned - 12 check-ins', time: '1 hour ago', bgColor: 'bg-blue-50', iconColor: 'text-blue-600' },
              { icon: Award, text: '45 certificates generated', time: '2 hours ago', bgColor: 'bg-purple-50', iconColor: 'text-purple-600' },
              { icon: Clock, text: 'Event "Tech Conference" starts in 2 days', time: '3 hours ago', bgColor: 'bg-amber-50', iconColor: 'text-amber-600' },
            ].map((activity, index) => (
              <div key={index} className="group flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50/50 transition-all cursor-pointer">
                <div className={`p-2.5 rounded-xl ${activity.bgColor} ${activity.iconColor} shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all`}>
                  <activity.icon size={18} strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-800 font-semibold">{activity.text}</p>
                  <span className="text-xs text-gray-500 mt-1 block">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Attendance Overview Chart Placeholder */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/60 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-gradient-to-b from-orange-500 to-red-500 rounded-full"></span>
            Attendance Overview
          </h2>
          <select className="text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white font-semibold text-gray-700 shadow-sm hover:shadow transition-all">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 3 months</option>
          </select>
        </div>
        <div className="h-64 flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl border border-gray-200/50">
          <div className="text-center text-gray-500">
            <div className="p-4 bg-white/80 rounded-2xl shadow-sm inline-block mb-3">
              <BarChart3 size={48} className="text-blue-500 opacity-50" strokeWidth={2} />
            </div>
            <p className="text-sm font-medium">Attendance chart will be displayed here</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
