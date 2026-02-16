import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Users,
  User,
  Mail,
  Phone,
  Edit,
  Trash2,
  Globe,
  Tag,
  DollarSign,
  UserCheck,
  Award,
  Loader2,
  Shield,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { eventsApi } from '../../services/api';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await eventsApi.getOne(id);
      if (response.success) {
        setEvent(response.data);
      }
    } catch (err) {
      console.error('Error fetching event details:', err);
      setError(err.message || 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      try {
        await eventsApi.delete(id);
        navigate('/admin/events');
      } catch (err) {
        console.error('Error deleting event:', err);
        alert('Failed to delete event');
      }
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      live: 'bg-green-100 text-green-700 border-green-200',
      ongoing: 'bg-green-100 text-green-700 border-green-200',
      upcoming: 'bg-blue-100 text-blue-700 border-blue-200',
      completed: 'bg-gray-100 text-gray-700 border-gray-200',
      draft: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      cancelled: 'bg-red-100 text-red-700 border-red-200',
    };
    return styles[status?.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const formatDate = (date) => {
    if (!date) return 'TBD';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={40} className="animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">{error}</div>
        <Link to="/admin/events" className="text-primary-600 hover:underline">
          ← Back to Events
        </Link>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">Event not found</div>
        <Link to="/admin/events" className="text-primary-600 hover:underline">
          ← Back to Events
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/events"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{event.title}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(
                  event.status
                )}`}
              >
                {event.status || 'Draft'}
              </span>
              {event.type && (
                <span className="text-sm text-gray-500">{event.type}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/admin/events/${id}/edit`}
            className="btn-secondary flex items-center gap-2"
          >
            <Edit size={18} />
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="btn-secondary text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-2"
          >
            <Trash2 size={18} />
            Delete
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Details - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Event Details</h2>
            
            {event.description && (
              <div className="mb-6">
                <p className="text-gray-600 leading-relaxed">{event.description}</p>
              </div>
            )}

            {event.rulebook && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h3 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
                  📋 Event Rulebook
                </h3>
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{event.rulebook}</pre>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date & Time */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary-50 rounded-lg">
                  <Calendar size={20} className="text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium text-gray-800">
                    {formatDate(event.startDate)}
                  </p>
                  {event.endDate && event.endDate !== event.startDate && (
                    <p className="text-sm text-gray-600">
                      to {formatDate(event.endDate)}
                    </p>
                  )}
                </div>
              </div>

              {event.time && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary-50 rounded-lg">
                    <Clock size={20} className="text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <p className="font-medium text-gray-800">{event.time}</p>
                  </div>
                </div>
              )}

              {/* Location */}
              {(event.location || event.venue || event.address) && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary-50 rounded-lg">
                    <MapPin size={20} className="text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium text-gray-800">
                      {event.venue || event.location}
                    </p>
                    {event.address && (
                      <p className="text-sm text-gray-600">{event.address}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Category */}
              {event.category && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary-50 rounded-lg">
                    <Tag size={20} className="text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Category</p>
                    <p className="font-medium text-gray-800">{event.category}</p>
                  </div>
                </div>
              )}

              {/* Registration Fee */}
              {event.registrationFee !== undefined && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary-50 rounded-lg">
                    <DollarSign size={20} className="text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Registration Fee</p>
                    <p className="font-medium text-gray-800">
                      {event.registrationFee === 0
                        ? 'Free'
                        : `₹${event.registrationFee}`}
                    </p>
                  </div>
                </div>
              )}

              {/* Website */}
              {event.website && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary-50 rounded-lg">
                    <Globe size={20} className="text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Website</p>
                    <a
                      href={event.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary-600 hover:underline"
                    >
                      {event.website}
                    </a>
                  </div>
                </div>
              )}

              {/* Max Participants */}
              {event.maxParticipants && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary-50 rounded-lg">
                    <Users size={20} className="text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Max Participants</p>
                    <p className="font-medium text-gray-800">
                      {event.maxParticipants}
                    </p>
                  </div>
                </div>
              )}

              {/* Registration Deadline */}
              {event.registrationDeadline && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary-50 rounded-lg">
                    <Calendar size={20} className="text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Registration Deadline</p>
                    <p className="font-medium text-gray-800">
                      {formatDate(event.registrationDeadline)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Statistics Card */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Statistics</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <Users size={24} className="mx-auto text-blue-600 mb-2" />
                <p className="text-2xl font-bold text-gray-800">
                  {event.participantCount || 0}
                </p>
                <p className="text-sm text-gray-500">Participants</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <UserCheck size={24} className="mx-auto text-green-600 mb-2" />
                <p className="text-2xl font-bold text-gray-800">
                  {event.attendanceCount || 0}
                </p>
                <p className="text-sm text-gray-500">Attendance</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <Award size={24} className="mx-auto text-purple-600 mb-2" />
                <p className="text-2xl font-bold text-gray-800">
                  {event.certificateCount || 0}
                </p>
                <p className="text-sm text-gray-500">Certificates</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Team Info */}
        <div className="space-y-6">
          {/* Team Lead Card */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Team Lead</h2>
            {event.teamLead ? (
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <User size={24} className="text-primary-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{event.teamLead.name}</p>
                  {event.teamLead.email && (
                    <div className="flex items-center gap-2 mt-1">
                      <Mail size={14} className="text-gray-400" />
                      <a
                        href={`mailto:${event.teamLead.email}`}
                        className="text-sm text-gray-600 hover:text-primary-600"
                      >
                        {event.teamLead.email}
                      </a>
                    </div>
                  )}
                  {event.teamLead.phone && (
                    <div className="flex items-center gap-2 mt-1">
                      <Phone size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {event.teamLead.phone}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <User size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">No team lead assigned</p>
                <Link
                  to={`/admin/events/${id}/edit`}
                  className="text-primary-600 text-sm hover:underline mt-2 inline-block"
                >
                  Assign a team lead
                </Link>
              </div>
            )}
          </div>

          {/* Team Members Card */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Team Members
              {event.teamMembers && event.teamMembers.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({event.teamMembers.length})
                </span>
              )}
            </h2>
            {event.teamMembers && event.teamMembers.length > 0 ? (
              <div className="space-y-4">
                {event.teamMembers.map((member, index) => (
                  <div
                    key={member.user?._id || index}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl"
                  >
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <User size={18} className="text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-800">
                          {member.user?.name || 'Unknown Member'}
                        </p>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            member.role === 'TEAM_LEAD'
                              ? 'bg-primary-100 text-primary-700'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {member.role === 'TEAM_LEAD' ? 'Lead' : 'Member'}
                        </span>
                      </div>
                      {member.user?.email && (
                        <p className="text-sm text-gray-500">{member.user.email}</p>
                      )}
                      
                      {/* Permissions */}
                      {member.permissions && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {member.permissions.canViewParticipants && (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600">
                              <CheckCircle size={12} /> View
                            </span>
                          )}
                          {member.permissions.canManageAttendance && (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600">
                              <CheckCircle size={12} /> Attendance
                            </span>
                          )}
                          {member.permissions.canSendEmails && (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600">
                              <CheckCircle size={12} /> Email
                            </span>
                          )}
                          {member.permissions.canGenerateCertificates && (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600">
                              <CheckCircle size={12} /> Certs
                            </span>
                          )}
                          {member.permissions.canEditEvent && (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600">
                              <CheckCircle size={12} /> Edit
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Users size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">No team members assigned</p>
              </div>
            )}
          </div>

          {/* Created By */}
          {event.createdBy && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Created By</h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <Shield size={18} className="text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">{event.createdBy.name}</p>
                  <p className="text-sm text-gray-500">{event.createdBy.email}</p>
                </div>
              </div>
              {event.createdAt && (
                <p className="text-xs text-gray-400 mt-3">
                  Created on {formatDate(event.createdAt)}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
