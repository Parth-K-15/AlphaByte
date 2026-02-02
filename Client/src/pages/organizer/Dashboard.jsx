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
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <h3 className="text-3xl font-bold text-gray-800 mt-2">{value}</h3>
          {trend && (
            <p className={`text-sm mt-2 flex items-center gap-1 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp size={14} className={trend === 'down' ? 'rotate-180' : ''} />
              {trendValue}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};

const EventCard = ({ event }) => {
  const statusColors = {
    upcoming: 'bg-blue-100 text-blue-700',
    ongoing: 'bg-green-100 text-green-700',
    completed: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold text-gray-800">{event.title || event.name}</h4>
          <p className="text-sm text-gray-500 mt-1">{event.date}</p>
        </div>
        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${statusColors[event.status]}`}>
          {event.status}
        </span>
      </div>
      <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
        <span className="flex items-center gap-1">
          <Users size={14} />
          {event.participants} participants
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle size={14} />
          {event.attendance}% attendance
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
    { title: 'Generate QR', icon: QrCode, path: '/organizer/attendance/qr', color: 'bg-blue-500' },
    { title: 'View Participants', icon: Users, path: '/organizer/participants', color: 'bg-green-500' },
    { title: 'Send Email', icon: AlertCircle, path: '/organizer/communication/email', color: 'bg-purple-500' },
    { title: 'Issue Certificates', icon: Award, path: '/organizer/certificates/generate', color: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={20} className="text-red-600" />
          <div>
            <p className="text-sm font-medium text-red-800">Error</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back! Here's your event overview.</p>
        </div>
        <Link
          to="/organizer/events"
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
        >
          View All Events
          <ArrowUpRight size={16} />
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.path}
              className="flex flex-col items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/50 transition-all"
            >
              <div className={`p-3 rounded-xl text-white ${action.color}`}>
                <action.icon size={20} />
              </div>
              <span className="text-sm font-medium text-gray-700">{action.title}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Events & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Events */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">My Events</h2>
            <Link to="/organizer/events" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {recentEvents.length > 0 ? recentEvents.map((event) => (
              <EventCard key={event.id || event._id} event={event} />
            )) : (
              <div className="text-center py-8 text-gray-500">
                <p>No events yet. Create your first event from the Admin panel.</p>
              </div>
            )}
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {[
              { icon: Users, text: '5 new participants registered', time: '10 min ago', color: 'text-green-600' },
              { icon: QrCode, text: 'QR code scanned - 12 check-ins', time: '1 hour ago', color: 'text-blue-600' },
              { icon: Award, text: '45 certificates generated', time: '2 hours ago', color: 'text-purple-600' },
              { icon: Clock, text: 'Event "Tech Conference" starts in 2 days', time: '3 hours ago', color: 'text-orange-600' },
            ].map((activity, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className={`p-2 rounded-lg bg-gray-50 ${activity.color}`}>
                  <activity.icon size={16} />
                </div>
                <div>
                  <p className="text-sm text-gray-700">{activity.text}</p>
                  <span className="text-xs text-gray-400">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Attendance Overview Chart Placeholder */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800">Attendance Overview</h2>
          <select className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 3 months</option>
          </select>
        </div>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl">
          <div className="text-center text-gray-500">
            <BarChart3 size={48} className="mx-auto mb-2 opacity-50" />
            <p>Attendance chart will be displayed here</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
