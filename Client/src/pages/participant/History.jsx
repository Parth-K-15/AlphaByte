import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const API_BASE = 'http://localhost:5000/api';

const History = () => {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [filter, setFilter] = useState('all'); // all, attended, certificates

  useEffect(() => {
    if (user?.email) {
      fetchHistory();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE}/participant/history?email=${encodeURIComponent(user.email)}`
      );
      const data = await response.json();
      
      if (data.success) {
        setHistory(data.data);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };



  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredHistory = history.filter(item => {
    if (filter === 'attended') return item.attendanceStatus === 'ATTENDED';
    if (filter === 'certificates') return item.certificate;
    return true;
  });

  // If no user, show message
  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="text-6xl mb-4">📜</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Participation History</h2>
          <p className="text-gray-500 mb-6">Enter your email to view your complete history</p>
          
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <input
              type="email"
              value={inputEmail}
              onChange={(e) => setInputEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            />
            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
            >
              View History
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Participation History</h1>
        <p className="text-indigo-100">Your complete event journey</p>
        <p className="text-sm text-indigo-200 mt-2">📧 {email}</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <div className="text-3xl font-bold text-indigo-600">{stats.totalRegistrations}</div>
            <div className="text-gray-500 text-sm">Total Events</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{stats.attended}</div>
            <div className="text-gray-500 text-sm">Attended</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <div className="text-3xl font-bold text-amber-600">{stats.certificatesEarned}</div>
            <div className="text-gray-500 text-sm">Certificates</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.upcomingEvents}</div>
            <div className="text-gray-500 text-sm">Upcoming</div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl shadow-sm p-2 flex gap-2">
        {[
          { value: 'all', label: 'All Events' },
          { value: 'attended', label: 'Attended' },
          { value: 'certificates', label: 'With Certificates' },
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              filter === tab.value
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* History Timeline */}
      {filteredHistory.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No History Found</h3>
          <p className="text-gray-500">
            {filter === 'all' 
              ? "You haven't registered for any events yet." 
              : `No events match the "${filter}" filter.`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
          {filteredHistory.map((record, index) => (
            <div key={record._id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start gap-4">
                {/* Timeline Indicator */}
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                    record.attendanceStatus === 'ATTENDED' ? 'bg-green-500' :
                    record.registrationStatus === 'CANCELLED' ? 'bg-red-500' :
                    'bg-blue-500'
                  }`}>
                    {record.attendanceStatus === 'ATTENDED' ? '✓' :
                     record.registrationStatus === 'CANCELLED' ? '✕' : '📅'}
                  </div>
                  {index < filteredHistory.length - 1 && (
                    <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                  )}
                </div>

                {/* Event Details */}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {record.event?.title || 'Event Deleted'}
                      </h3>
                      <p className="text-gray-500 text-sm">
                        {formatDate(record.event?.startDate)}
                        {record.event?.venue && ` • ${record.event.venue}`}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        record.registrationStatus === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                        record.registrationStatus === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {record.registrationStatus}
                      </span>
                    </div>
                  </div>

                  {/* Status Details */}
                  <div className="mt-2 flex flex-wrap gap-4 text-sm">
                    {record.attendance && (
                      <div className="flex items-center gap-1 text-green-600">
                        <span>✓</span>
                        <span>Attended {formatDate(record.attendance.scannedAt)}</span>
                      </div>
                    )}
                    {record.certificate && (
                      <div className="flex items-center gap-1 text-amber-600">
                        <span>🏆</span>
                        <span>Certificate: {record.certificate.status}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-2 flex gap-2">
                    {record.event && (
                      <Link
                        to={`/participant/event/${record.event._id}`}
                        className="text-sm text-indigo-600 hover:text-indigo-800"
                      >
                        View Event →
                      </Link>
                    )}
                    {record.certificate && record.certificate.certificateUrl && (
                      <Link
                        to="/participant/certificates"
                        className="text-sm text-amber-600 hover:text-amber-800"
                      >
                        View Certificate →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Change Email */}
      <div className="text-center">
        <button
          onClick={() => {
            localStorage.removeItem('participantEmail');
            setEmail('');
            setInputEmail('');
          }}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Use a different email
        </button>
      </div>
    </div>
  );
};

export default History;
