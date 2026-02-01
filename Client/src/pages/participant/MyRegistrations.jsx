import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const API_BASE = 'http://localhost:5000/api';

const MyRegistrations = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user?.email) {
      fetchRegistrations();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE}/participant/my-events?email=${encodeURIComponent(user.email)}`
      );
      const data = await response.json();
      
      if (data.success) {
        setRegistrations(data.data);
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
      setMessage({ type: 'error', text: 'Failed to load registrations' });
    } finally {
      setLoading(false);
    }
  };



  const getStatusBadge = (status) => {
    const badges = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getAttendanceBadge = (status) => {
    const badges = {
      PENDING: 'bg-gray-100 text-gray-800',
      ATTENDED: 'bg-green-100 text-green-800',
      ABSENT: 'bg-red-100 text-red-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBA';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // If no user, show message
  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="text-6xl mb-4">🎟️</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">My Registrations</h2>
          <p className="text-gray-500 mb-6">Please sign in to view your registrations</p>
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
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">My Registrations</h1>
        <p className="text-purple-100">Track your event registrations and attendance status</p>
        <p className="text-sm text-purple-200 mt-2">📧 {email}</p>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Registrations List */}
      {registrations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Registrations Yet</h3>
          <p className="text-gray-500 mb-6">You haven't registered for any events yet.</p>
          <Link
            to="/participant"
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
          >
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {registrations.map((reg) => (
            <div
              key={reg._id}
              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row">
                {/* Event Image */}
                <div className="w-full md:w-48 h-32 md:h-auto bg-gradient-to-br from-indigo-500 to-purple-600">
                  {reg.event?.bannerImage && (
                    <img
                      src={reg.event.bannerImage}
                      alt={reg.event?.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* Event Info */}
                <div className="flex-1 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-800">
                        {reg.event?.title || 'Event Deleted'}
                      </h3>
                      <p className="text-gray-500 text-sm">
                        📅 {formatDate(reg.event?.startDate)}
                        {reg.event?.venue && ` • 📍 ${reg.event.venue}`}
                      </p>
                    </div>
                    
                    {/* Event Status */}
                    {reg.event?.status && (
                      <span className={`self-start px-3 py-1 rounded-full text-xs font-medium capitalize ${
                        reg.event.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                        reg.event.status === 'ongoing' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {reg.event.status}
                      </span>
                    )}
                  </div>

                  {/* Status Badges */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(reg.registrationStatus)}`}>
                      Registration: {reg.registrationStatus}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getAttendanceBadge(reg.attendanceStatus)}`}>
                      Attendance: {reg.attendanceStatus}
                    </span>
                    {reg.certificate && (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        🏆 Certificate: {reg.certificate.status}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {reg.event && (
                      <Link
                        to={`/participant/event/${reg.event._id}`}
                        className="px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg"
                      >
                        View Event →
                      </Link>
                    )}
                    {reg.attendanceStatus === 'PENDING' && reg.event?.status === 'ongoing' && (
                      <Link
                        to={`/participant/scan?eventId=${reg.event._id}`}
                        className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        📷 Scan QR
                      </Link>
                    )}
                    {reg.certificate && reg.certificate.certificateUrl && (
                      <Link
                        to={`/participant/certificates`}
                        className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        📜 View Certificate
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

export default MyRegistrations;
