import { useState, useEffect } from 'react';
import {
  Calendar,
  Users,
  UserCheck,
  Eye,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { dashboardApi } from '../../services/api';

// Enhanced StatCard Component
const StatCard = ({ title, value, icon: Icon, trend, change, color }) => {
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
      
      <div className="relative z-10">
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
            <span>{change}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalParticipants: 0,
    totalOrganizers: 0,
    totalSiteViews: 0,
    activeEvents: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [registrationTrends, setRegistrationTrends] = useState([]);
  const [registrationsByStatus, setRegistrationsByStatus] = useState([]);
  const [topEvents, setTopEvents] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [recentRegistrations, setRecentRegistrations] = useState([]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, activityResponse] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getActivity(),
      ]);

      if (statsResponse.success) {
        const data = statsResponse.data;
        setStats(data.stats || {});
        setChartData(data.eventRegistrations || []);
        setRegistrationTrends(data.registrationTrends || []);
        setRegistrationsByStatus(data.registrationsByStatus || []);
        setTopEvents(data.topEvents || []);
        setRecentRegistrations(data.recentRegistrations || []);
      }

      if (activityResponse.success) {
        setRecentActivity(activityResponse.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // KPI cards config
  const kpiData = [
    {
      title: 'Total Events',
      value: stats.totalEvents,
      change: '+12%',
      trend: 'up',
      icon: Calendar,
      color: 'blue',
    },
    {
      title: 'Total Participants',
      value: stats.totalParticipants?.toLocaleString() || '0',
      change: '+8%',
      trend: 'up',
      icon: Users,
      color: 'green',
    },
    {
      title: 'Total Organizers',
      value: stats.totalOrganizers,
      change: '+4%',
      trend: 'up',
      icon: UserCheck,
      color: 'purple',
    },
    {
      title: 'Total Site Views',
      value: stats.totalSiteViews?.toLocaleString() || '0',
      change: '-2%',
      trend: 'down',
      icon: Eye,
      color: 'orange',
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'text-green-500 bg-green-50';
      case 'warning':
        return 'text-orange-500 bg-orange-50';
      case 'info':
        return 'text-blue-500 bg-blue-50';
      default:
        return 'text-gray-500 bg-gray-50';
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'event':
        return Calendar;
      case 'assignment':
        return UserCheck;
      case 'user':
        return Users;
      default:
        return CheckCircle;
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={40} className="animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="px-2 sm:px-0">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-500 mt-1">Welcome back! Here's what's happening.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {kpiData.map((item, index) => (
          <StatCard 
            key={index}
            title={item.title}
            value={item.value}
            icon={item.icon}
            trend={item.trend}
            change={item.change}
            color={item.color}
          />
        ))}
      </div>

      {/* Charts and Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Registration Trends Chart */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/60 shadow-md hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-800">Registration Trends</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Daily registrations over the last 7 days</p>
            </div>
          </div>
          <div className="h-80">
            {registrationTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={registrationTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="registrations"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>No registration trends available yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Registration Status Breakdown */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/60 shadow-md hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-800">Registration Status</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Breakdown by status</p>
            </div>
          </div>
          <div className="h-80">
            {registrationsByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={registrationsByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, count }) => `${status}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {registrationsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>No status data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Events and Recent Registrations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Top Events by Registration */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/60 shadow-md hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-800">Top Events</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Events with most registrations</p>
            </div>
          </div>
          <div className="h-80">
            {topEvents.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topEvents} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Bar dataKey="registrations" fill="#10b981" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>No event data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Registrations */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/60 shadow-md hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base sm:text-lg font-bold text-gray-800">Recent Registrations</h2>
            <button className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-semibold hover:underline">
              View All
            </button>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {recentRegistrations.length > 0 ? (
              recentRegistrations.map((registration, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl border border-gray-100 hover:shadow-md transition-all duration-200">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-sm">
                    <Users size={16} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{registration.name}</p>
                    <p className="text-sm text-gray-500 truncate">{registration.event?.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          registration.registrationStatus === 'CONFIRMED'
                            ? 'bg-green-100 text-green-700'
                            : registration.registrationStatus === 'PENDING'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {registration.registrationStatus}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatTime(registration.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-4">No recent registrations</p>
            )}
          </div>
        </div>
      </div>

      {/* Charts and Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Event Registrations Chart */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/60 shadow-md hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-800">Event Registrations</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Registration count by event</p>
            </div>
            <button className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
              View All <ArrowUpRight size={14} strokeWidth={2.5} />
            </button>
          </div>
          <div className="h-80">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Bar dataKey="registrations" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>No event data available yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/60 shadow-md hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base sm:text-lg font-bold text-gray-800">Recent Activity</h2>
            <button className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-semibold hover:underline">
              View All
            </button>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => {
                const ActivityIcon = getActivityIcon(activity.type);
                return (
                  <div key={index} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50/50 transition-colors duration-200">
                    <div className={`p-2 rounded-xl shadow-sm ${getStatusColor(activity.status)}`}>
                      <ActivityIcon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{activity.action}</p>
                      <p className="text-sm text-gray-500 truncate">{activity.detail}</p>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400">
                      <Clock size={14} />
                      <span className="text-xs whitespace-nowrap">{formatTime(activity.time)}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-400 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
