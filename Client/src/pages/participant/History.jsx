import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = 'http://localhost:5000/api';

const History = () => {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState(localStorage.getItem('participantEmail') || '');
  const [inputEmail, setInputEmail] = useState('');
  const [filter, setFilter] = useState('all'); // all, attended, certificates

  useEffect(() => {
    if (email) {
      fetchHistory();
    } else {
      setLoading(false);
    }
  }, [email]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE}/participant/history?email=${encodeURIComponent(email)}`
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

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (inputEmail) {
      localStorage.setItem('participantEmail', inputEmail);
      setEmail(inputEmail);
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

  // If no email, show email input
  if (!email) {
    return (
      <div className="max-w-md mx-auto mt-12 px-4">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-10 text-center border border-white/20">
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <div className="text-5xl">📜</div>
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-3">Participation History</h2>
          <p className="text-gray-600 mb-8 text-lg">Enter your email to view your complete history</p>
          
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <input
              type="email"
              value={inputEmail}
              onChange={(e) => setInputEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all font-medium"
              required
            />
            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-bold hover:from-cyan-700 hover:to-blue-700 transition-all duration-300 hover:scale-[1.02] shadow-lg"
            >
              View History →
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-cyan-600 absolute top-0 left-0"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
        <h1 className="text-4xl font-black mb-3">Participation History</h1>
        <p className="text-cyan-50 text-lg">Your complete event journey</p>
        <div className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
          <span className="text-sm font-semibold">📧 {email}</span>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 text-center border border-white/20 hover:-translate-y-1 transition-all duration-300">
            <div className="text-4xl font-black bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">{stats.totalRegistrations}</div>
            <div className="text-gray-600 text-sm font-semibold mt-2">Total Events</div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 text-center border border-white/20 hover:-translate-y-1 transition-all duration-300">
            <div className="text-4xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{stats.attended}</div>
            <div className="text-gray-600 text-sm font-semibold mt-2">Attended</div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 text-center border border-white/20 hover:-translate-y-1 transition-all duration-300">
            <div className="text-4xl font-black bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">{stats.certificatesEarned}</div>
            <div className="text-gray-600 text-sm font-semibold mt-2">Certificates</div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 text-center border border-white/20 hover:-translate-y-1 transition-all duration-300">
            <div className="text-4xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{stats.upcomingEvents}</div>
            <div className="text-gray-600 text-sm font-semibold mt-2">Upcoming</div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-3 flex gap-3 border border-white/20">
        {[
          { value: 'all', label: 'All Events' },
          { value: 'attended', label: 'Attended' },
          { value: 'certificates', label: 'With Certificates' },
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300 ${
              filter === tab.value
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg scale-105'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* History Timeline */}
      {filteredHistory.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg p-12 text-center border border-white/20">
          <div className="w-24 h-24 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <div className="text-5xl">📭</div>
          </div>
          <h3 className="text-2xl font-black text-gray-800 mb-3">No History Found</h3>
          <p className="text-gray-600 text-lg">
            {filter === 'all' 
              ? "You haven't registered for any events yet." 
              : `No events match the "${filter}" filter.`}
          </p>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg divide-y divide-gray-200 border border-white/20">
          {filteredHistory.map((record, index) => (
            <div key={record._id} className="p-6 hover:bg-gray-50/50 transition-all duration-300">
              <div className="flex items-start gap-5">
                {/* Timeline Indicator */}
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-lg ${
                    record.attendanceStatus === 'ATTENDED' ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                    record.registrationStatus === 'CANCELLED' ? 'bg-gradient-to-br from-red-500 to-pink-600' :
                    'bg-gradient-to-br from-cyan-500 to-blue-600'
                  }`}>
                    {record.attendanceStatus === 'ATTENDED' ? '✓' :
                     record.registrationStatus === 'CANCELLED' ? '✕' : '📅'}
                  </div>
                  {index < filteredHistory.length - 1 && (
                    <div className="w-1 flex-1 bg-gradient-to-b from-gray-300 to-gray-100 mt-3 rounded-full min-h-[40px]"></div>
                  )}
                </div>

                {/* Event Details */}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      <h3 className="font-black text-lg text-gray-900">
                        {record.event?.title || 'Event Deleted'}
                      </h3>
                      <p className="text-gray-600 text-sm font-medium mt-1">
                        📅 {formatDate(record.event?.startDate)}
                        {record.event?.venue && ` • 📍 ${record.event.venue}`}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm ${
                        record.registrationStatus === 'CONFIRMED' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' :
                        record.registrationStatus === 'CANCELLED' ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white' :
                        'bg-gradient-to-r from-yellow-500 to-amber-500 text-white'
                      }`}>
                        {record.registrationStatus}
                      </span>
                    </div>
                  </div>

                  {/* Status Details */}
                  <div className="mt-4 flex flex-wrap gap-3 text-sm">
                    {record.attendance && (
                      <div className="flex items-center gap-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-4 py-2 rounded-xl font-bold border border-green-200">
                        <span>✓</span>
                        <span>Attended {formatDate(record.attendance.scannedAt)}</span>
                      </div>
                    )}
                    {record.certificate && (
                      <div className="flex items-center gap-2 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 px-4 py-2 rounded-xl font-bold border border-amber-200">
                        <span>🏆</span>
                        <span>Certificate: {record.certificate.status}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex gap-3">
                    {record.event && (
                      <Link
                        to={`/participant/event/${record.event._id}`}
                        className="text-sm font-bold bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-700 px-4 py-2 rounded-xl hover:from-cyan-100 hover:to-blue-100 transition-all duration-300 hover:scale-105 border border-cyan-200"
                      >
                        View Event →
                      </Link>
                    )}
                    {record.certificate && record.certificate.certificateUrl && (
                      <Link
                        to="/participant/certificates"
                        className="text-sm font-bold bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 px-4 py-2 rounded-xl hover:from-amber-100 hover:to-orange-100 transition-all duration-300 hover:scale-105 border border-amber-200"
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
      <div className="text-center mt-8">
        <button
          onClick={() => {
            localStorage.removeItem('participantEmail');
            setEmail('');
            setInputEmail('');
          }}
          className="text-sm font-semibold text-cyan-600 hover:text-cyan-800 hover:underline transition-all"
        >
          ← Use a different email
        </button>
      </div>
    </div>
  );
};

export default History;
