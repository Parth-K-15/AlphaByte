import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

/**
 * AttendanceRateChart Component
 * Displays attendance rate by event type
 */
const AttendanceRateChart = ({ data }) => {
  // Color palette for different event types
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  
  // Transform data for chart
  const chartData = Object.entries(data).map(([eventType, stats]) => ({
    eventType,
    attendanceRate: (stats.attendanceRate * 100).toFixed(1),
    noShowRate: (stats.noShowRate * 100).toFixed(1),
    eventCount: stats.eventCount,
    totalRegistered: stats.totalRegistered
  }));
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        📈 Event Type Performance
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Attendance rate comparison across different event types
      </p>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="eventType" 
            tick={{ fontSize: 11 }}
            angle={-15}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            label={{ value: 'Attendance Rate (%)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              borderRadius: '8px'
            }}
            formatter={(value, name) => {
              if (name === 'attendanceRate' || name === 'noShowRate') {
                return `${value}%`;
              }
              return value;
            }}
          />
          <Legend />
          <Bar 
            dataKey="attendanceRate" 
            name="Attendance Rate"
            radius={[8, 8, 0, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      {/* Event type summary cards */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
        {chartData.map((item, index) => (
          <div 
            key={item.eventType}
            className="border rounded-lg p-3"
            style={{ borderColor: COLORS[index % COLORS.length] }}
          >
            <div className="text-sm font-semibold text-gray-700">{item.eventType}</div>
            <div className="text-lg font-bold" style={{ color: COLORS[index % COLORS.length] }}>
              {item.attendanceRate}%
            </div>
            <div className="text-xs text-gray-500">
              {item.eventCount} events • {item.totalRegistered} registered
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttendanceRateChart;
