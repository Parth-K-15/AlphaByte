import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  QrCode,
  Award,
  Mail,
  Edit,
  Settings,
  ChevronRight,
  Globe,
  DollarSign,
  Tag,
  User,
  Phone,
  ExternalLink,
  Pin,
  MessageSquare,
  Trash2,
} from 'lucide-react';
import { getEventDetails, getEventUpdates, createEventUpdate, deleteEventUpdate, togglePinUpdate } from '../../services/organizerApi';

const EventDetails = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [newUpdate, setNewUpdate] = useState({ message: '', type: 'INFO' });
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (eventId) {
      fetchEventData();
    } else {
      setLoading(false);
      setEvent(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const fetchEventData = async () => {
    if (!eventId) return;
    
    try {
      const [eventRes, updatesRes] = await Promise.all([
        getEventDetails(eventId),
        getEventUpdates(eventId),
      ]);
      if (eventRes.data.success) setEvent(eventRes.data.data);
      if (updatesRes.data.success) setUpdates(updatesRes.data.data);
    } catch (error) {
      console.error('Error fetching event data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUpdate = async () => {
    try {
      const response = await createEventUpdate({
        eventId,
        ...newUpdate,
      });
      if (response.data.success) {
        setUpdates([response.data.data, ...updates]);
        setShowUpdateModal(false);
        setNewUpdate({ message: '', type: 'INFO' });
      }
    } catch (error) {
      console.error('Error creating update:', error);
    }
  };

  const handleDeleteUpdate = async (updateId) => {
    try {
      await deleteEventUpdate(updateId);
      setUpdates(updates.filter((u) => u._id !== updateId));
    } catch (error) {
      console.error('Error deleting update:', error);
    }
  };

  const handleTogglePin = async (updateId) => {
    try {
      const response = await togglePinUpdate(updateId);
      if (response.data.success) {
        setUpdates(updates.map((u) => (u._id === updateId ? { ...u, isPinned: !u.isPinned } : u)));
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const getLifecycleStageIndex = (status) => {
    if (!status) return 0;
    const stages = ['draft', 'upcoming', 'ongoing', 'completed', 'cancelled'];
    const index = stages.indexOf(status.toLowerCase());
    return index === -1 ? 0 : index;
  };

  // Map real event data to display format
  const displayEvent = event ? {
    ...event,
    name: event.title || event.name,
    date: event.startDate,
    venue: event.venue || event.location,
    address: event.address || event.location,
    organizer: event.teamLead || event.organizer,
    participantCount: event.participantCount || 0,
    attendanceCount: event.attendanceCount || 0,
    certificateCount: event.certificateCount || 0,
  } : null;
  const displayUpdates = updates;

  const updateTypeColors = {
    INFO: 'bg-blue-50 text-blue-700 border border-blue-200',
    WARNING: 'bg-amber-50 text-amber-700 border border-amber-200',
    URGENT: 'bg-red-50 text-red-700 border border-red-200',
    ANNOUNCEMENT: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  };

  const statusColors = {
    upcoming: 'bg-blue-50 text-blue-700 border border-blue-200',
    ongoing: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    completed: 'bg-gray-50 text-gray-700 border border-gray-200',
    draft: 'bg-amber-50 text-amber-700 border border-amber-200',
  };

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'timeline', label: 'Timeline Updates' },
    { key: 'settings', label: 'Settings' },
  ];

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-48 bg-gray-200 rounded-2xl" />
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-100 rounded w-2/3" />
      </div>
    );
  }

  if (!event || !eventId) {
    return (
      <div className="space-y-6">
        <Link
          to="/organizer/events"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <div className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </div>
          <span className="font-medium">Back to Events</span>
        </Link>
        
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Calendar size={64} className="text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Event Selected</h2>
          <p className="text-gray-500 mb-6">Please select an event from your events list to view details and updates.</p>
          <Link
            to="/organizer/events"
            className="btn-primary"
          >
            Go to My Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        to="/organizer/events"
        className="group inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-all font-bold"
      >
        <div className="p-2.5 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 rounded-xl transition-all group-hover:scale-110">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </div>
        <span>Back to Events</span>
      </Link>

      {/* Event Header */}
      <div className="relative bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl p-8 border border-white/60 shadow-2xl overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <span className={`px-3 py-1.5 rounded-full text-sm font-black ${statusColors[displayEvent.status]} shadow-lg`}>
              {displayEvent.status?.charAt(0).toUpperCase() + displayEvent.status?.slice(1)}
            </span>
            <span className="px-3 py-1.5 bg-white/30 backdrop-blur-sm rounded-full text-sm font-bold text-white shadow-lg">{displayEvent.category}</span>
          </div>
          <h1 className="text-4xl font-black mb-3 text-white">{displayEvent.name}</h1>
          <p className="text-white/90 max-w-2xl font-semibold">{displayEvent.description}</p>
          
          <div className="flex flex-wrap items-center gap-6 mt-6 text-white">
            <div className="flex items-center gap-2 font-bold bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
              <Calendar size={18} strokeWidth={2.5} />
              <span>{new Date(displayEvent.date).toLocaleDateString('en-US', { 
                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
              })}</span>
            </div>
            <div className="flex items-center gap-2 font-bold bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
              <Clock size={18} strokeWidth={2.5} />
              <span>{displayEvent.time}</span>
            </div>
            <div className="flex items-center gap-2 font-bold bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
              <MapPin size={18} strokeWidth={2.5} />
              <span>{displayEvent.venue}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          to={`/organizer/participants?event=${eventId}`}
          className="group relative bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 rounded-2xl border border-white/60 shadow-md hover:shadow-2xl transition-all duration-300 flex items-center gap-4 overflow-hidden hover:-translate-y-1"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
          <div className="relative p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
            <Users size={24} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="relative">
            <p className="text-3xl font-black text-gray-900">{displayEvent.participantCount}</p>
            <p className="text-sm text-gray-700 font-bold">Participants</p>
          </div>
        </Link>
        <Link
          to={`/organizer/attendance/qr?event=${eventId}`}
          className="group relative bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-6 rounded-2xl border border-white/60 shadow-md hover:shadow-2xl transition-all duration-300 flex items-center gap-4 overflow-hidden hover:-translate-y-1"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
          <div className="relative p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
            <QrCode size={24} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="relative">
            <p className="text-3xl font-black text-gray-900">{displayEvent.attendanceCount}</p>
            <p className="text-sm text-gray-700 font-bold">Attendance</p>
          </div>
        </Link>
        <Link
          to={`/organizer/certificates/generate?event=${eventId}`}
          className="group relative bg-gradient-to-br from-purple-50 to-purple-100/50 p-6 rounded-2xl border border-white/60 shadow-md hover:shadow-2xl transition-all duration-300 flex items-center gap-4 overflow-hidden hover:-translate-y-1"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
          <div className="relative p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
            <Award size={24} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="relative">
            <p className="text-3xl font-black text-gray-900">{displayEvent.certificateCount}</p>
            <p className="text-sm text-gray-700 font-bold">Certificates</p>
          </div>
        </Link>
        <Link
          to={`/organizer/communication/email?event=${eventId}`}
          className="group relative bg-gradient-to-br from-amber-50 to-amber-100/50 p-6 rounded-2xl border border-white/60 shadow-md hover:shadow-2xl transition-all duration-300 flex items-center gap-4 overflow-hidden hover:-translate-y-1"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
          <div className="relative p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
            <Mail size={24} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="relative">
            <p className="text-3xl font-black text-gray-900">Send</p>
            <p className="text-sm text-gray-700 font-bold">Communication</p>
          </div>
        </Link>
      </div>

      {/* Tabs */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-lg">
        <div className="border-b border-gray-100">
          <div className="flex gap-6 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative py-4 font-black text-sm transition-all duration-300 ${
                  activeTab === tab.key
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Event Lifecycle Timeline */}
              <div>
                <h3 className="font-semibold text-gray-800 text-lg mb-4">Event Status</h3>
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100">
                  {/* Progress Line */}
                  <div className="relative mb-8">
                    <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 rounded-full" />
                    <div
                      className="absolute top-5 left-0 h-1 bg-primary-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${(getLifecycleStageIndex(displayEvent.status) / 4) * 100}%`,
                      }}
                    />
                    <div className="relative flex justify-between">
                      {[
                        { key: 'draft', label: 'Draft', icon: '📝', color: 'gray' },
                        { key: 'upcoming', label: 'Upcoming', icon: '⏰', color: 'blue' },
                        { key: 'ongoing', label: 'Ongoing', icon: '▶️', color: 'green' },
                        { key: 'completed', label: 'Completed', icon: '✅', color: 'purple' },
                        { key: 'cancelled', label: 'Cancelled', icon: '❌', color: 'red' },
                      ].map((stage, index) => {
                        const isCurrent = displayEvent.status === stage.key;
                        const currentIndex = getLifecycleStageIndex(displayEvent.status);
                        const isPast = index < currentIndex && displayEvent.status !== 'cancelled';
                        const isCancelled = displayEvent.status === 'cancelled' && stage.key === 'cancelled';
                        
                        return (
                          <div key={stage.key} className="flex flex-col items-center">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-300 ${
                                isCurrent || isCancelled
                                  ? stage.color === 'gray'
                                    ? 'bg-gray-900 text-white shadow-lg scale-110'
                                    : stage.color === 'blue'
                                    ? 'bg-blue-600 text-white shadow-lg scale-110'
                                    : stage.color === 'green'
                                    ? 'bg-green-600 text-white shadow-lg scale-110'
                                    : stage.color === 'purple'
                                    ? 'bg-purple-600 text-white shadow-lg scale-110'
                                    : 'bg-red-600 text-white shadow-lg scale-110'
                                  : isPast
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-200 text-gray-400'
                              }`}
                            >
                              {stage.icon}
                            </div>
                            <span
                              className={`mt-2 text-xs font-medium ${
                                isCurrent || isCancelled ? 'text-gray-900' : isPast ? 'text-green-600' : 'text-gray-400'
                              }`}
                            >
                              {stage.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Current Status Info */}
                  <div className="bg-white rounded-lg p-4 border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Current Status</p>
                    <p className="text-lg font-semibold text-gray-900 capitalize">{displayEvent.status}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Event Info */}
                <div className="space-y-6">
                <h3 className="font-semibold text-gray-800 text-lg">Event Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Globe size={18} className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Event Type</p>
                      <p className="text-gray-800">{displayEvent.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <DollarSign size={18} className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Registration Fee</p>
                      <p className="text-gray-800">${displayEvent.registrationFee || 'Free'}</p>
                    </div>
                  </div>
                  {displayEvent.maxParticipants && (
                    <div className="flex items-center gap-3">
                      <Users size={18} className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Max Participants</p>
                        <p className="text-gray-800">{displayEvent.maxParticipants}</p>
                      </div>
                    </div>
                  )}
                  {displayEvent.registrationDeadline && (
                    <div className="flex items-center gap-3">
                      <Calendar size={18} className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Registration Deadline</p>
                        <p className="text-gray-800">{new Date(displayEvent.registrationDeadline).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {displayEvent.tags && displayEvent.tags.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {displayEvent.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Organizer Info */}
              <div className="space-y-6">
                <h3 className="font-semibold text-gray-800 text-lg">Organizer Details</h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <User size={18} className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="text-gray-800">{displayEvent.organizer?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail size={18} className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-gray-800">{displayEvent.organizer?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone size={18} className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="text-gray-800">{displayEvent.organizer?.phone}</p>
                    </div>
                  </div>
                </div>

                {displayEvent.website && (
                  <a
                    href={displayEvent.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
                  >
                    <ExternalLink size={16} />
                    Event Website
                  </a>
                )}
              </div>
            </div>
          </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800 text-lg">Timeline Updates</h3>
                <button
                  onClick={() => setShowUpdateModal(true)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors text-sm font-medium"
                >
                  Add Update
                </button>
              </div>

              <div className="space-y-4">
                {displayUpdates.map((update) => (
                  <div
                    key={update._id}
                    className={`p-4 rounded-xl border ${update.isPinned ? 'border-primary-200 bg-primary-50/50' : 'border-gray-100 bg-white'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${updateTypeColors[update.type]}`}>
                            {update.type}
                          </span>
                          {update.isPinned && (
                            <span className="flex items-center gap-1 text-xs text-primary-600">
                              <Pin size={12} /> Pinned
                            </span>
                          )}
                        </div>
                        <p className="text-gray-800">{update.message}</p>
                        <p className="text-sm text-gray-400 mt-2">
                          {new Date(update.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTogglePin(update._id)}
                          className={`p-2 rounded-lg hover:bg-gray-100 ${update.isPinned ? 'text-primary-600' : 'text-gray-400'}`}
                        >
                          <Pin size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteUpdate(update._id)}
                          className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="text-center py-12">
              <Settings size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">Event Settings</h3>
              <p className="text-gray-500">Event settings and configuration options will be available here.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Update Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Timeline Update</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={newUpdate.type}
                  onChange={(e) => setNewUpdate({ ...newUpdate, type: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="INFO">Info</option>
                  <option value="WARNING">Warning</option>
                  <option value="URGENT">Urgent</option>
                  <option value="ANNOUNCEMENT">Announcement</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={newUpdate.message}
                  onChange={(e) => setNewUpdate({ ...newUpdate, message: e.target.value })}
                  rows={4}
                  placeholder="Enter your update message..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowUpdateModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUpdate}
                className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
              >
                Add Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetails;
