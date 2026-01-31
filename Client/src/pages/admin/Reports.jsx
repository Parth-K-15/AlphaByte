import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { Calendar, Download, Filter, TrendingUp, Users, Award, CheckCircle } from 'lucide-react';

const Reports = () => {
  const [filterPeriod, setFilterPeriod] = useState('monthly');
  const [filterEvent, setFilterEvent] = useState('all');

  // Sample registration data
  const registrationData = [
    { name: 'Tech Summit', registrations: 245, attendance: 220 },
    { name: 'Hackathon', registrations: 380, attendance: 340 },
    { name: 'AI Workshop', registrations: 120, attendance: 108 },
    { name: 'Design Sprint', registrations: 190, attendance: 175 },
    { name: 'Cloud Conf', registrations: 280, attendance: 252 },
    { name: 'DevOps Day', registrations: 165, attendance: 150 },
  ];

  // Attendance completion data
  const attendanceData = [
    { name: 'Completed', value: 85 },
    { name: 'Partial', value: 10 },
    { name: 'No Show', value: 5 },
  ];

  const COLORS = ['#22c55e', '#f59e0b', '#ef4444'];

  // Certificate stats
  const certificateData = [
    { month: 'Aug', issued: 120 },
    { month: 'Sep', issued: 180 },
    { month: 'Oct', issued: 250 },
    { month: 'Nov', issued: 310 },
    { month: 'Dec', issued: 220 },
    { month: 'Jan', issued: 380 },
  ];

  // Weekly trend data
  const weeklyData = [
    { week: 'Week 1', registrations: 45 },
    { week: 'Week 2', registrations: 68 },
    { week: 'Week 3', registrations: 52 },
    { week: 'Week 4', registrations: 89 },
  ];

  const events = ['All Events', 'Tech Summit', 'Hackathon', 'AI Workshop', 'Design Sprint'];

  // Summary stats
  const stats = [
    {
      label: 'Total Registrations',
      value: '1,380',
      change: '+12%',
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      label: 'Avg Attendance Rate',
      value: '89.2%',
      change: '+5%',
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      label: 'Certificates Issued',
      value: '1,460',
      change: '+18%',
      icon: Award,
      color: 'bg-purple-500',
    },
    {
      label: 'Active Events',
      value: '8',
      change: '+2',
      icon: Calendar,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Analytics & Reports</h1>
          <p className="text-gray-500 mt-1">Monitor event performance and insights</p>
        </div>
        <button className="btn-primary flex items-center gap-2 w-fit">
          <Download size={20} />
          Export Report
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filter by:</span>
          </div>

          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="input-field max-w-[150px]"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
          </select>

          <select
            value={filterEvent}
            onChange={(e) => setFilterEvent(e.target.value)}
            className="input-field max-w-[200px]"
          >
            {events.map((event) => (
              <option key={event} value={event.toLowerCase().replace(' ', '-')}>
                {event}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp size={14} className="text-green-500" />
                  <span className="text-sm text-green-600 font-medium">{stat.change}</span>
                </div>
              </div>
              <div className={`${stat.color} p-3 rounded-xl`}>
                <stat.icon size={20} className="text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registration Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">
            Event-wise Registrations vs Attendance
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={registrationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                  }}
                />
                <Legend />
                <Bar dataKey="registrations" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Registrations" />
                <Bar dataKey="attendance" fill="#22c55e" radius={[4, 4, 0, 0]} name="Attendance" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attendance Pie Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Attendance Completion Ratio</h3>
          <div className="h-80 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {attendanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {attendanceData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index] }}
                />
                <span className="text-sm text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Certificate Stats */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Certificates Issued Over Time</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={certificateData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey="issued"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly Trend */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Weekly Registration Trend</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {weeklyData.map((week, index) => (
            <div key={week.week} className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500">{week.week}</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{week.registrations}</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(week.registrations / 100) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reports;
