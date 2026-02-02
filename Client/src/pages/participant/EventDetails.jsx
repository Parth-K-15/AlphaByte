import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const API_BASE = 'http://localhost:5000/api';

const EventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    college: '',
    year: '',
    branch: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch user profile when component mounts
  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    fetchEventDetails();
    if (profile?.email) {
      checkRegistration();
    }
  }, [eventId, profile]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_BASE}/participant/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setProfile(data.data);
        // Pre-fill form with user's profile data
        setFormData({
          fullName: data.data.name || '',
          email: data.data.email || '',
          phone: data.data.phone || '',
          college: data.data.college || '',
          year: data.data.year || '',
          branch: data.data.branch || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/participant/events/${eventId}`);
      const data = await response.json();
      
      if (data.success) {
        setEvent(data.data);
      } else {
        setMessage({ type: 'error', text: data.message || 'Event not found' });
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      setMessage({ type: 'error', text: 'Failed to load event details' });
    } finally {
      setLoading(false);
    }
  };

  const checkRegistration = async () => {
    if (!profile?.email) return;
    
    try {
      const response = await fetch(
        `${API_BASE}/participant/registration/${eventId}?email=${encodeURIComponent(profile.email)}`
      );
      const data = await response.json();
      
      if (data.success && data.isRegistered) {
        setIsRegistered(true);
        setRegistration(data.data);
      }
    } catch (error) {
      console.error('Error checking registration:', error);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.email) {
      setMessage({ type: 'error', text: 'Name and email are required' });
      return;
    }

    try {
      setRegistering(true);
      const response = await fetch(`${API_BASE}/participant/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          ...formData
        })
      });

      const data = await response.json();

      if (data.success) {
        setIsRegistered(true);
        setRegistration(data.data);
        setShowRegisterModal(false);
        setMessage({ type: 'success', text: 'Registration successful!' });
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      console.error('Error registering:', error);
      setMessage({ type: 'error', text: 'Registration failed. Please try again.' });
    } finally {
      setRegistering(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!confirm('Are you sure you want to cancel your registration?')) return;

    try {
      const response = await fetch(
        `${API_BASE}/participant/registration/${eventId}?email=${encodeURIComponent(userEmail)}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (data.success) {
        setIsRegistered(false);
        setRegistration(null);
        setMessage({ type: 'success', text: 'Registration cancelled' });
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to cancel registration' });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBA';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getUpdateTypeBadge = (type) => {
    const badges = {
      INFO: 'bg-blue-100 text-blue-800',
      WARNING: 'bg-yellow-100 text-yellow-800',
      URGENT: 'bg-red-100 text-red-800',
      ANNOUNCEMENT: 'bg-purple-100 text-purple-800'
    };
    return badges[type] || badges.INFO;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Event Not Found</h2>
        <button
          onClick={() => navigate('/participant')}
          className="text-indigo-600 hover:text-indigo-800"
        >
          ← Back to Events
        </button>
      </div>
    );
  }

  const statusColors = {
    upcoming: 'bg-blue-500',
    ongoing: 'bg-green-500',
    completed: 'bg-gray-500',
    draft: 'bg-yellow-500',
    cancelled: 'bg-red-500'
  };

  return (
    <div className="space-y-6">
      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Back Button */}
      <button
        onClick={() => navigate('/participant')}
        className="flex items-center text-gray-600 hover:text-gray-800"
      >
        <span className="mr-2">←</span> Back to Events
      </button>

      {/* Event Header */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="h-48 md:h-64 bg-gradient-to-br from-indigo-500 to-purple-600 relative">
          {event.bannerImage && (
            <img
              src={event.bannerImage}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-black/30"></div>
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize text-white ${statusColors[event.status]}`}>
                {event.status}
              </span>
              {event.type && (
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs">
                  {event.type}
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">{event.title}</h1>
          </div>
        </div>

        {/* Event Info */}
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column - Details */}
            <div className="space-y-4">
              <div className="flex items-start">
                <span className="text-2xl mr-3">📅</span>
                <div>
                  <p className="font-medium text-gray-800">Date</p>
                  <p className="text-gray-600">{formatDate(event.startDate)}</p>
                  {event.endDate && event.endDate !== event.startDate && (
                    <p className="text-gray-500 text-sm">to {formatDate(event.endDate)}</p>
                  )}
                  {event.time && (
                    <p className="text-gray-500 text-sm">⏰ {event.time}</p>
                  )}
                </div>
              </div>

              {(event.venue || event.location) && (
                <div className="flex items-start">
                  <span className="text-2xl mr-3">📍</span>
                  <div>
                    <p className="font-medium text-gray-800">Venue</p>
                    <p className="text-gray-600">{event.venue || event.location}</p>
                    {event.address && (
                      <p className="text-gray-500 text-sm">{event.address}</p>
                    )}
                  </div>
                </div>
              )}

              {event.teamLead && (
                <div className="flex items-start">
                  <span className="text-2xl mr-3">👤</span>
                  <div>
                    <p className="font-medium text-gray-800">Organizer</p>
                    <p className="text-gray-600">{event.teamLead.name}</p>
                  </div>
                </div>
              )}

              {event.category && (
                <div className="flex items-start">
                  <span className="text-2xl mr-3">🏷️</span>
                  <div>
                    <p className="font-medium text-gray-800">Category</p>
                    <p className="text-gray-600">{event.category}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Registration */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-indigo-600">
                  {event.registrationFee > 0 ? `₹${event.registrationFee}` : 'FREE'}
                </p>
                <p className="text-gray-500 text-sm">Registration Fee</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Registered</span>
                  <span className="font-medium">{event.participantCount || 0}</span>
                </div>
                {event.maxParticipants && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Max Capacity</span>
                    <span className="font-medium">{event.maxParticipants}</span>
                  </div>
                )}
                {event.spotsLeft !== null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Spots Left</span>
                    <span className={`font-medium ${event.spotsLeft <= 10 ? 'text-red-600' : 'text-green-600'}`}>
                      {event.spotsLeft}
                    </span>
                  </div>
                )}
                {event.registrationDeadline && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Deadline</span>
                    <span className="font-medium">{formatDate(event.registrationDeadline)}</span>
                  </div>
                )}
              </div>

              {/* Registration Button */}
              {isRegistered ? (
                <div className="space-y-3">
                  <div className="bg-green-100 text-green-800 p-3 rounded-lg text-center">
                    ✓ You are registered
                    <p className="text-xs mt-1">Status: {registration?.registrationStatus}</p>
                  </div>
                  {registration?.registrationStatus !== 'CANCELLED' && registration?.attendanceStatus !== 'ATTENDED' && (
                    <button
                      onClick={handleCancelRegistration}
                      className="w-full py-2 text-red-600 hover:text-red-800 text-sm"
                    >
                      Cancel Registration
                    </button>
                  )}
                </div>
              ) : event.isRegistrationOpen && event.spotsLeft !== 0 ? (
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  Register Now
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-3 bg-gray-300 text-gray-500 rounded-lg font-medium cursor-not-allowed"
                >
                  {event.spotsLeft === 0 ? 'Event Full' : 'Registration Closed'}
                </button>
              )}
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-lg text-gray-800 mb-3">About This Event</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
            </div>
          )}

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {event.tags.map((tag, idx) => (
                <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Event Timeline */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-lg text-gray-800 mb-4">Event Timeline</h3>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          <div className="space-y-4">
            {['draft', 'upcoming', 'ongoing', 'completed'].map((stage, idx) => {
              const isActive = event.status === stage;
              const isPast = ['draft', 'upcoming', 'ongoing', 'completed'].indexOf(event.status) > idx;
              
              return (
                <div key={stage} className="relative flex items-center pl-10">
                  <div className={`absolute left-2 w-5 h-5 rounded-full border-2 ${
                    isActive ? 'bg-indigo-600 border-indigo-600' :
                    isPast ? 'bg-green-500 border-green-500' :
                    'bg-white border-gray-300'
                  }`}>
                    {isPast && !isActive && (
                      <span className="text-white text-xs flex items-center justify-center h-full">✓</span>
                    )}
                  </div>
                  <span className={`capitalize ${isActive ? 'font-medium text-indigo-600' : 'text-gray-500'}`}>
                    {stage}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Updates */}
      {event.updates && event.updates.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-lg text-gray-800 mb-4">📢 Updates & Announcements</h3>
          <div className="space-y-4">
            {event.updates.map((update) => (
              <div
                key={update._id}
                className={`p-4 rounded-lg border-l-4 ${
                  update.isPinned ? 'bg-yellow-50 border-yellow-400' : 'bg-gray-50 border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getUpdateTypeBadge(update.type)}`}>
                    {update.type}
                  </span>
                  {update.isPinned && <span className="text-yellow-600 text-sm">📌 Pinned</span>}
                </div>
                <p className="text-gray-700">{update.message}</p>
                <p className="text-gray-400 text-xs mt-2">
                  {new Date(update.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Register for Event</h3>
                <button
                  onClick={() => setShowRegisterModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    College/Organization
                  </label>
                  <input
                    type="text"
                    value={formData.college}
                    onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Year
                    </label>
                    <select
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select Year</option>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="Graduate">Graduate</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Branch
                    </label>
                    <input
                      type="text"
                      value={formData.branch}
                      onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                      placeholder="e.g., CSE"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={registering}
                  className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors"
                >
                  {registering ? 'Registering...' : 'Complete Registration'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetails;
