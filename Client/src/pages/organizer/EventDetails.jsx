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
    }
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

  // Demo event data
  const demoEvent = {
    id: 1,
    name: 'Tech Conference 2025',
    description: 'Annual technology conference featuring the latest innovations in AI, Cloud Computing, and Web Development. Join industry experts for insightful talks and networking opportunities.',
    date: '2025-01-15',
    time: '10:00 AM - 6:00 PM',
    venue: 'Convention Center, Hall A',
    address: '123 Tech Street, Silicon Valley, CA 94000',
    status: 'upcoming',
    category: 'Conference',
    type: 'Hybrid',
    registrationFee: 50,
    maxParticipants: 500,
    participantCount: 150,
    attendanceCount: 0,
    certificateCount: 0,
    registrationDeadline: '2025-01-14',
    organizer: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1 234 567 8900',
    },
    website: 'https://techconf2025.com',
    tags: ['AI', 'Cloud', 'Web Development', 'Networking'],
  };

  const demoUpdates = [
    {
      _id: '1',
      message: 'Venue has been confirmed! See you at Convention Center, Hall A.',
      type: 'ANNOUNCEMENT',
      isPinned: true,
      createdAt: new Date().toISOString(),
    },
    {
      _id: '2',
      message: 'Early bird registration ends on January 10th.',
      type: 'INFO',
      isPinned: false,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      _id: '3',
      message: 'Parking will be limited. We recommend using public transport.',
      type: 'WARNING',
      isPinned: false,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
  ];

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
  } : demoEvent;
  const displayUpdates = updates.length > 0 ? updates : demoUpdates;

  const updateTypeColors = {
    INFO: 'bg-blue-100 text-blue-700 border-blue-200',
    WARNING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    URGENT: 'bg-red-100 text-red-700 border-red-200',
    ANNOUNCEMENT: 'bg-green-100 text-green-700 border-green-200',
  };

  const statusColors = {
    upcoming: 'bg-blue-100 text-blue-700',
    ongoing: 'bg-green-100 text-green-700',
    completed: 'bg-gray-100 text-gray-700',
    draft: 'bg-yellow-100 text-yellow-700',
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

  return (
    <div className="space-y-6">
      {/* Event Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <span className={`px-3 py-1 rounded-lg text-sm font-medium ${statusColors[displayEvent.status]} bg-opacity-90`}>
              {displayEvent.status?.charAt(0).toUpperCase() + displayEvent.status?.slice(1)}
            </span>
            <span className="px-3 py-1 bg-white/20 rounded-lg text-sm">{displayEvent.category}</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{displayEvent.name}</h1>
          <p className="text-primary-100 max-w-2xl">{displayEvent.description}</p>
          
          <div className="flex flex-wrap items-center gap-6 mt-6">
            <div className="flex items-center gap-2">
              <Calendar size={18} />
              <span>{new Date(displayEvent.date).toLocaleDateString('en-US', { 
                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
              })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={18} />
              <span>{displayEvent.time}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={18} />
              <span>{displayEvent.venue}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          to={`/organizer/participants?event=${eventId}`}
          className="bg-white p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow flex items-center gap-3"
        >
          <div className="p-3 bg-blue-50 rounded-xl">
            <Users size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{displayEvent.participantCount}</p>
            <p className="text-sm text-gray-500">Participants</p>
          </div>
        </Link>
        <Link
          to={`/organizer/attendance/qr?event=${eventId}`}
          className="bg-white p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow flex items-center gap-3"
        >
          <div className="p-3 bg-green-50 rounded-xl">
            <QrCode size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{displayEvent.attendanceCount}</p>
            <p className="text-sm text-gray-500">Attendance</p>
          </div>
        </Link>
        <Link
          to={`/organizer/certificates/generate?event=${eventId}`}
          className="bg-white p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow flex items-center gap-3"
        >
          <div className="p-3 bg-purple-50 rounded-xl">
            <Award size={20} className="text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{displayEvent.certificateCount}</p>
            <p className="text-sm text-gray-500">Certificates</p>
          </div>
        </Link>
        <Link
          to={`/organizer/communication/email?event=${eventId}`}
          className="bg-white p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow flex items-center gap-3"
        >
          <div className="p-3 bg-orange-50 rounded-xl">
            <Mail size={20} className="text-orange-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">Send</p>
            <p className="text-sm text-gray-500">Communication</p>
          </div>
        </Link>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="border-b border-gray-100">
          <div className="flex gap-6 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
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
