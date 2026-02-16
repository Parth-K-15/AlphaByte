import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * ParticipationChart Component
 * Displays month-wise participation statistics using a bar chart
 */
const ParticipationChart = ({ data }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        📊 Monthly Participation Trends
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Events, registrations, and attendance over the last 5 months
      </p>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: 12 }}
          />
          <YAxis />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <Bar 
            dataKey="totalRegistrations" 
            fill="#3b82f6" 
            name="Registrations"
            radius={[8, 8, 0, 0]}
          />
          <Bar 
            dataKey="totalAttendance" 
            fill="#10b981" 
            name="Attendance"
            radius={[8, 8, 0, 0]}
          />
          <Bar 
            dataKey="certified" 
            fill="#8b5cf6" 
            name="Certified"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
      
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {data.reduce((sum, month) => sum + month.totalRegistrations, 0)}
          </div>
          <div className="text-xs text-gray-500">Total Registrations</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {data.reduce((sum, month) => sum + month.totalAttendance, 0)}
          </div>
          <div className="text-xs text-gray-500">Total Attendance</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {data.reduce((sum, month) => sum + month.certified, 0)}
          </div>
          <div className="text-xs text-gray-500">Total Certified</div>
        </div>
      </div>
    </div>
  );
};

export default ParticipationChart;
