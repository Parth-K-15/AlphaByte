import React from 'react';

/**
 * TopContributors Component
 * Displays a leaderboard of top participating students
 */
const TopContributors = ({ contributors }) => {
  // Medal emojis for top 3
  const getMedalEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '🏅';
  };
  
  // Get engagement color
  const getEngagementColor = (rate) => {
    if (rate >= 0.9) return 'text-green-600 bg-green-50';
    if (rate >= 0.75) return 'text-blue-600 bg-blue-50';
    if (rate >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        🏆 Top Contributors
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Students with highest certification count
      </p>
      
      <div className="space-y-3">
        {contributors.map((student) => {
          // const engagement = analyzeStudentEngagement(student);
          
          return (
            <div 
              key={student.id}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              {/* Left side: Rank and details */}
              <div className="flex items-center gap-3 flex-1">
                <div className="text-2xl">
                  {getMedalEmoji(student.rank)}
                </div>
                
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">
                    {student.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {student.department} • Year {student.year}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {student.totalAttended}/{student.totalRegistrations} attended
                  </div>
                </div>
              </div>
              
              {/* Right side: Stats */}
              <div className="text-right space-y-1">
                <div className="text-2xl font-bold text-purple-600">
                  {student.totalCertified}
                </div>
                <div className="text-xs text-gray-500">
                  Certificates
                </div>
                <div className={`text-xs font-semibold px-2 py-1 rounded ${getEngagementColor(student.avgAttendanceRate)}`}>
                  {(student.avgAttendanceRate * 100).toFixed(0)}% rate
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Summary section */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-gray-800">
              {contributors.reduce((sum, s) => sum + s.totalCertified, 0)}
            </div>
            <div className="text-xs text-gray-500">Total Certificates</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-800">
              {contributors.reduce((sum, s) => sum + s.totalAttended, 0)}
            </div>
            <div className="text-xs text-gray-500">Total Attended</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-800">
              {(contributors.reduce((sum, s) => sum + s.avgAttendanceRate, 0) / contributors.length * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-gray-500">Avg Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopContributors;
