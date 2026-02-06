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

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalParticipants: 0,
    totalOrganizers: 0,
    totalSiteViews: 0,
    activeEvents: 0,
  });
  const [registrationTrends, setRegistrationTrends] = useState([]);
  const [registrationsByStatus, setRegistrationsByStatus] = useState([]);
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
        setRegistrationTrends(data.registrationTrends || []);
        setRegistrationsByStatus(data.registrationsByStatus || []);
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
      color: 'bg-blue-500',
    },
    {
      title: 'Total Participants',
      value: stats.totalParticipants?.toLocaleString() || '0',
      change: '+8%',
      trend: 'up',
      icon: Users,
      color: 'bg-green-500',
    },
    {
      title: 'Total Organizers',
      value: stats.totalOrganizers,
      change: '+4%',
      trend: 'up',
      icon: UserCheck,
      color: 'bg-purple-500',
    },
    {
      title: 'Total Site Views',
      value: stats.totalSiteViews?.toLocaleString() || '0',
      change: '-2%',
      trend: 'down',
      icon: Eye,
      color: 'bg-orange-500',
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
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back! Here's what's happening.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((item, index) => (
          <div key={index} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{item.title}</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{item.value}</p>
                <div className="flex items-center gap-1 mt-2">
                  {item.trend === 'up' ? (
                    <TrendingUp size={16} className="text-green-500" />
                  ) : (
                    <TrendingDown size={16} className="text-red-500" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      item.trend === 'up' ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {item.change}
                  </span>
                  <span className="text-sm text-gray-400">vs last month</span>
                </div>
              </div>
              <div className={`${item.color} p-3 rounded-xl`}>
                <item.icon size={24} className="text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts and Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registration Trends Chart */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Registration Trends</h2>
              <p className="text-sm text-gray-500">Daily registrations over the last 7 days</p>
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
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Registration Status</h2>
              <p className="text-sm text-gray-500">Breakdown by status</p>
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

      {/* Recent Registrations & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registrations */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Recent Registrations</h2>
            <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {recentRegistrations.length > 0 ? (
              recentRegistrations.map((registration, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="p-2 rounded-lg bg-primary-100">
                    <Users size={16} className="text-primary-600" />
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

        {/* Recent Activity */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
            <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => {
                const ActivityIcon = getActivityIcon(activity.type);
                return (
                  <div key={index} className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getStatusColor(activity.status)}`}>
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
