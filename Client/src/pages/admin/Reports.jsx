import { useState, useEffect } from 'react';
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
import { Calendar, Download, Filter, TrendingUp, Users, Award, CheckCircle, Loader2 } from 'lucide-react';
import { reportsApi } from '../../services/api';

const Reports = () => {
  const [filterPeriod, setFilterPeriod] = useState('monthly');
  const [filterEvent, setFilterEvent] = useState('all');
  const [certificateView, setCertificateView] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [certificateLoading, setCertificateLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [certificateData, setCertificateData] = useState([]);
  const [events, setEvents] = useState([]);

  // Fetch events for filter dropdown
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await reportsApi.getEvents();
        if (response.success) {
          setEvents(response.data);
        }
      } catch (err) {
        console.error('Error fetching events:', err);
      }
    };
    fetchEvents();
  }, []);

  // Fetch main analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await reportsApi.getAnalytics({
          period: certificateView,
          eventId: filterEvent,
        });
        if (response.success) {
          setAnalyticsData(response.data);
          setCertificateData(response.data.certificateTimeData || []);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch analytics data');
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [filterEvent]); // Only refetch when event filter changes

  // Fetch certificate data separately when view changes
  useEffect(() => {
    if (!analyticsData) return; // Don't fetch until initial load is complete
    
    const fetchCertificateData = async () => {
      setCertificateLoading(true);
      try {
        const response = await reportsApi.getAnalytics({
          period: certificateView,
          eventId: filterEvent,
        });
        if (response.success) {
          setCertificateData(response.data.certificateTimeData || []);
        }
      } catch (err) {
        console.error('Error fetching certificate data:', err);
      } finally {
        setCertificateLoading(false);
      }
    };
    fetchCertificateData();
  }, [certificateView]); // Only refetch certificates when view changes

  const COLORS = ['#3b82f6', '#22c55e', '#8b5cf6', '#ef4444'];
  const ATTENDANCE_COLORS = ['#3b82f6', '#22c55e', '#8b5cf6', '#f59e0b', '#ef4444'];

  // Prepare data from API response
  const eventLifecycle = analyticsData?.eventLifecycle || [];
  const topEventsByAttendance = analyticsData?.topEventsByAttendance || [];
  const eventRegistrations = analyticsData?.eventRegistrations || [];
  const weeklyData = analyticsData?.weeklyRegistrations || [];

  // Export report function
  const handleExportReport = () => {
    if (!analyticsData) return;

    // Create HTML content for Word document
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #1f2937; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; }
          h2 { color: #374151; margin-top: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 12px; text-align: left; border: 1px solid #e5e7eb; }
          th { background-color: #f3f4f6; font-weight: 600; color: #374151; }
          tr:nth-child(even) { background-color: #f9fafb; }
          .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
          .stat-card { padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; }
          .stat-label { color: #6b7280; font-size: 14px; }
          .stat-value { font-size: 28px; font-weight: bold; color: #1f2937; margin: 8px 0; }
          .stat-change { color: #10b981; font-size: 14px; font-weight: 500; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>Analytics & Reports</h1>
        <p style="color: #6b7280; margin-bottom: 30px;">Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        
        <h2>Summary Statistics</h2>
        <div class="summary-grid">
    `;
    
    stats.forEach(stat => {
      htmlContent += `
          <div class="stat-card">
            <div class="stat-label">${stat.label}</div>
            <div class="stat-value">${stat.value}</div>
            <div class="stat-change">${stat.change} vs last period</div>
          </div>
      `;
    });
    
    htmlContent += `
        </div>
        
        <h2>Event Lifecycle Distribution</h2>
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    eventLifecycle.forEach(item => {
      htmlContent += `
            <tr>
              <td>${item.name}</td>
              <td>${item.value}</td>
            </tr>
      `;
    });
    
    htmlContent += `
          </tbody>
        </table>
        
        <h2>Top Events by Attendance Rate</h2>
        <table>
          <thead>
            <tr>
              <th>Event Name</th>
              <th>Attendance Rate (%)</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    topEventsByAttendance.forEach(event => {
      htmlContent += `
            <tr>
              <td>${event.name}</td>
              <td>${event.attendanceRate.toFixed(1)}%</td>
            </tr>
      `;
    });
    
    htmlContent += `
          </tbody>
        </table>
        
        <h2>Event Registrations</h2>
        <table>
          <thead>
            <tr>
              <th>Event Name</th>
              <th>Total Registrations</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    eventRegistrations.forEach(event => {
      htmlContent += `
            <tr>
              <td>${event.name}</td>
              <td>${event.registrations}</td>
            </tr>
      `;
    });
    
    htmlContent += `
          </tbody>
        </table>
        
        <h2>Certificates Issued Over Time</h2>
        <table>
          <thead>
            <tr>
              <th>Period</th>
              <th>Certificates Issued</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    certificateData.forEach(item => {
      htmlContent += `
            <tr>
              <td>${item.month}</td>
              <td>${item.issued}</td>
            </tr>
      `;
    });
    
    htmlContent += `
          </tbody>
        </table>
        
        <h2>Weekly Registration Trend</h2>
        <table>
          <thead>
            <tr>
              <th>Week</th>
              <th>Registrations</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    weeklyData.forEach(item => {
      htmlContent += `
            <tr>
              <td>${item.week}</td>
              <td>${item.registrations}</td>
            </tr>
      `;
    });
    
    htmlContent += `
          </tbody>
        </table>
        
        <div class="footer">
          <p>This report was automatically generated by EventSync Analytics System.</p>
        </div>
      </body>
      </html>
    `;
    
    // Create download link for Word document
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().split('T')[0];
    
    link.setAttribute('href', url);
    link.setAttribute('download', `analytics_report_${timestamp}.doc`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Summary stats
  const stats = analyticsData ? [
    {
      label: 'Total Registrations',
      value: analyticsData.stats.totalRegistrations.toLocaleString(),
      change: `${analyticsData.stats.trends.registrations >= 0 ? '+' : ''}${analyticsData.stats.trends.registrations}%`,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      label: 'Avg Attendance Rate',
      value: `${analyticsData.stats.attendanceRate}%`,
      change: `${analyticsData.stats.trends.attendance >= 0 ? '+' : ''}${analyticsData.stats.trends.attendance}%`,
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      label: 'Certificates Issued',
      value: analyticsData.stats.totalCertificates.toLocaleString(),
      change: `${analyticsData.stats.trends.certificates >= 0 ? '+' : ''}${analyticsData.stats.trends.certificates}%`,
      icon: Award,
      color: 'bg-purple-500',
    },
    {
      label: 'Active Events',
      value: analyticsData.stats.activeEvents.toString(),
      change: `+${analyticsData.stats.trends.events}`,
      icon: Calendar,
      color: 'bg-orange-500',
    },
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error loading analytics</p>
          <p className="text-gray-500 text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Analytics & Reports</h1>
          <p className="text-gray-500 mt-1">Monitor event performance and insights</p>
        </div>
        <button 
          onClick={handleExportReport}
          disabled={!analyticsData}
          className="btn-primary flex items-center gap-2 w-fit disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={20} />
          Export Report
        </button>
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
                  <TrendingUp size={14} className={stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'} />
                  <span className={`text-sm font-medium ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change}
                  </span>
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
        {/* Event Lifecycle Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">
            Event Lifecycle Distribution
          </h3>
          {eventLifecycle.length > 0 && eventLifecycle.some(d => d.value > 0) ? (
            <>
              <div className="h-80 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={eventLifecycle}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {eventLifecycle.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {eventLifecycle.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color || COLORS[index] }}
                    />
                    <span className="text-sm text-gray-600">{item.name}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-400">
              No event lifecycle data available
            </div>
          )}
        </div>

        {/* Top 5 Events by Attendance Rate */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Top 5 Events by Attendance Rate</h3>
          {topEventsByAttendance.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topEventsByAttendance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                    }}
                    formatter={(value) => `${Number(value).toFixed(1)}%`}
                  />
                  <Bar dataKey="attendanceRate" fill="#22c55e" radius={[0, 4, 4, 0]} name="Attendance Rate" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-400">
              No attendance data available
            </div>
          )}
        </div>
      </div>

      {/* Certificate Stats */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <h3 className="text-lg font-semibold text-gray-800">Certificates Issued Over Time</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setCertificateView('daily')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                certificateView === 'daily'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Days
            </button>
            <button
              onClick={() => setCertificateView('monthly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                certificateView === 'monthly'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Months
            </button>
          </div>
        </div>
        {certificateLoading ? (
          <div className="h-72 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : certificateData.length > 0 ? (
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
        ) : (
          <div className="h-72 flex items-center justify-center text-gray-400">
            No certificate data available
          </div>
        )}
      </div>

      {/* Event Registrations */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Event Registrations</h3>
        {eventRegistrations.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eventRegistrations}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} angle={-45} textAnchor="end" height={100} />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                  }}
                />
                <Bar dataKey="registrations" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Registrations" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center text-gray-400">
            No event registration data available
          </div>
        )}
      </div>

      {/* Weekly Trend */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Weekly Registration Trend</h3>
        {weeklyData.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {weeklyData.map((week, index) => (
              <div key={week.week || index} className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500">{week.week}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{week.registrations}</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((week.registrations / 100) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 flex items-center justify-center text-gray-400">
            No weekly data available
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
