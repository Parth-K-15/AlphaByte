import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Mail,
  Send,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  MessageSquare,
  History,
  Filter,
  Search,
  ChevronDown,
  Settings,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { 
  sendEmail, 
  getCommunicationHistory, 
  createAnnouncement, 
  getEmailTemplates,
  getAssignedEvents,
  testEmailConfig,
  debugParticipants 
} from '../../services/organizerApi';

// Helper to check if ID is a valid MongoDB ObjectId
const isValidObjectId = (id) => /^[a-fA-F0-9]{24}$/.test(id);

const Communication = () => {
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(searchParams.get('event') || '');
  const [activeTab, setActiveTab] = useState('compose');
  const [history, setHistory] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [emailConfigStatus, setEmailConfigStatus] = useState(null);
  const [checkingConfig, setCheckingConfig] = useState(false);

  const [emailData, setEmailData] = useState({
    subject: '',
    message: '',
    recipientFilter: 'ALL',
    template: '',
  });

  const [announcementData, setAnnouncementData] = useState({
    message: '',
    type: 'INFO',
  });

  useEffect(() => {
    fetchEvents();
    fetchTemplates();
    checkEmailConfiguration();
  }, []);

  useEffect(() => {
    if (selectedEvent && isValidObjectId(selectedEvent)) {
      fetchHistory();
    } else {
      setLoading(false);
    }
  }, [selectedEvent]);

  const fetchEvents = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const organizerId = user._id || user.id;
      const response = await getAssignedEvents(organizerId);
      if (response.data.success) {
        setEvents(response.data.data);
        if (!selectedEvent && response.data.data.length > 0) {
          setSelectedEvent(response.data.data[0]._id || response.data.data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await getCommunicationHistory(selectedEvent, {});
      if (response.data.success) {
        setHistory(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await getEmailTemplates();
      if (response.data.success) {
        setTemplates(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const checkEmailConfiguration = async () => {
    setCheckingConfig(true);
    try {
      const response = await testEmailConfig();
      setEmailConfigStatus(response.data.success ? 'configured' : 'error');
    } catch (error) {
      console.error('Email config check failed:', error);
      setEmailConfigStatus('error');
    } finally {
      setCheckingConfig(false);
    }
  };

  const handleDebugParticipants = async () => {
    if (!selectedEvent || !isValidObjectId(selectedEvent)) {
      alert('Please select a valid event first');
      return;
    }
    try {
      const response = await debugParticipants(selectedEvent);
      console.log('🔍 DEBUG - Participants Info:', response.data);
      alert(`Debug Info (Check Console):\n\nEvent: ${response.data.data.eventTitle}\nTotal Participants: ${response.data.data.totalParticipants}\n\nSee browser console for full details.`);
    } catch (error) {
      console.error('Debug failed:', error);
      alert('Failed to fetch debug info');
    }
  };

  const handleSendEmail = async () => {
    if (!selectedEvent || !isValidObjectId(selectedEvent)) {
      alert('Please select a real event first. Demo events cannot send emails.');
      return;
    }
    if (!emailData.subject || !emailData.message) {
      alert('Please provide both subject and message.');
      return;
    }
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const organizerId = user._id || user.id;
    console.log('📝 User object:', user);
    console.log('📝 Organizer ID:', organizerId);
    
    if (!organizerId) {
      alert('User ID not found. Please log in again.');
      return;
    }
    
    setSending(true);
    try {
      const response = await sendEmail({
        eventId: selectedEvent,
        organizerId,
        ...emailData,
      });
      if (response.data.success) {
        alert(`Email sent successfully to ${response.data.data.recipientCount || 0} participants!`);
        setEmailData({ subject: '', message: '', recipientFilter: 'ALL', template: '' });
        fetchHistory();
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert(error.message || 'Failed to send email. Please check if there are participants matching your filter.');
    } finally {
      setSending(false);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!selectedEvent || !isValidObjectId(selectedEvent)) {
      alert('Please select a real event first. Demo events cannot create announcements.');
      return;
    }
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const organizerId = user._id || user.id;
    if (!organizerId) {
      alert('User ID not found. Please log in again.');
      return;
    }
    
    setSending(true);
    try {
      const response = await createAnnouncement({
        eventId: selectedEvent,
        organizerId,
        ...announcementData,
      });
      if (response.data.success) {
        alert('Announcement created!');
        setAnnouncementData({ message: '', type: 'INFO' });
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
      alert('Failed to create announcement');
    } finally {
      setSending(false);
    }
  };

  // Demo data
  const demoEvents = [
    { id: '1', name: 'Tech Conference 2025' },
    { id: '2', name: 'Web Development Workshop' },
  ];

  const demoHistory = [
    { _id: '1', subject: 'Event Reminder', type: 'EMAIL', recipientFilter: 'ALL', recipientCount: 150, status: 'SENT', sentAt: new Date().toISOString() },
    { _id: '2', subject: 'Schedule Update', type: 'EMAIL', recipientFilter: 'REGISTERED', recipientCount: 120, status: 'SENT', sentAt: new Date(Date.now() - 86400000).toISOString() },
    { _id: '3', subject: 'Certificate Available', type: 'EMAIL', recipientFilter: 'ATTENDED', recipientCount: 95, status: 'SENT', sentAt: new Date(Date.now() - 172800000).toISOString() },
  ];


  const displayEvents = events.length > 0 ? events : [];
  const displayHistory = history.length > 0 ? history : [];
  const displayTemplates = templates.length > 0 ? templates : [];
  const usingDemoData = events.length === 0;

  const recipientFilters = [
    { value: 'ALL', label: 'All Participants', icon: Users },
    { value: 'REGISTERED', label: 'Registered Only', icon: FileText },
    { value: 'ATTENDED', label: 'Attended Only', icon: CheckCircle },
    { value: 'NOT_ATTENDED', label: 'Not Attended', icon: AlertCircle },
    { value: 'CERTIFIED', label: 'Certified', icon: CheckCircle },
    { value: 'NOT_CERTIFIED', label: 'Not Certified', icon: AlertCircle },
  ];

  const statusBadge = (status) => {
    const colors = {
      SENT: 'bg-green-100 text-green-700',
      PENDING: 'bg-yellow-100 text-yellow-700',
      FAILED: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${colors[status] || colors.PENDING}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Animated floating orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-16 w-96 h-96 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-gradient-to-br from-pink-200 to-blue-200 rounded-full opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative z-10 p-6 space-y-8">
      {/* Email Configuration Status Banner */}
      {emailConfigStatus && (
        <div className={`rounded-2xl p-6 flex items-start gap-4 shadow-lg ${
          emailConfigStatus === 'configured' 
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200' 
            : 'bg-gradient-to-r from-red-50 to-pink-50 border border-red-200'
        }`}>
          <div className={`p-3 rounded-xl shadow-sm ${
            emailConfigStatus === 'configured' 
              ? 'bg-gradient-to-r from-green-100 to-emerald-100' 
              : 'bg-gradient-to-r from-red-100 to-pink-100'
          }`}>
            {emailConfigStatus === 'configured' ? (
              <CheckCircle2 size={24} className="text-green-600" strokeWidth={2.5} />
            ) : (
              <XCircle size={24} className="text-red-600" strokeWidth={2.5} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`font-black text-lg ${
              emailConfigStatus === 'configured' ? 'text-green-900' : 'text-red-900'
            }`}>
              {emailConfigStatus === 'configured' ? 'Email Service Configured' : 'Email Service Not Configured'}
            </h3>
            <p className={`font-semibold mt-2 ${
              emailConfigStatus === 'configured' ? 'text-green-700' : 'text-red-700'
            }`}>
              {emailConfigStatus === 'configured' 
                ? 'Your email service is ready to send messages to participants.' 
                : 'Please configure your email settings in the .env file. Check server console for instructions.'}
            </p>
          </div>
          <button
            onClick={checkEmailConfiguration}
            disabled={checkingConfig}
            className={`group p-3 rounded-xl transition-all hover:scale-105 ${
              emailConfigStatus === 'configured' 
                ? 'hover:bg-green-100 border border-green-300' 
                : 'hover:bg-red-100 border border-red-300'
            }`}
            title="Recheck configuration"
          >
            <Settings size={20} strokeWidth={2.5} className={`${checkingConfig ? 'animate-spin' : 'group-hover:rotate-90 transition-transform'}`} />
          </button>
        </div>
      )}

      {/* Demo Mode Banner */}
      {usingDemoData && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4 shadow-lg">
          <div className="p-3 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-xl shadow-sm">
            <Mail size={24} className="text-amber-600" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="font-black text-amber-900 text-lg">Demo Mode Active</h3>
            <p className="text-amber-700 font-semibold mt-2">
              Showing sample data. Create events from the Admin panel and get assigned to send real communications.
            </p>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-xl">
            <MessageSquare size={24} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900">Communication Center</h1>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full mt-1"></div>
            <p className="text-gray-600 font-semibold mt-2">Send emails and announcements to participants</p>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <button
            onClick={handleDebugParticipants}
            className="group px-4 py-2 border border-gray-300 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:border-blue-300 transition-all font-bold text-gray-700"
            title="Debug participants"
          >
            <span className="group-hover:scale-110 transition-transform inline-block">🔍</span> Debug
          </button>
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="px-6 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm font-bold text-gray-900 shadow-lg"
          >
            {displayEvents.map((event) => (
              <option key={event._id || event.id} value={event._id || event.id}>
                {event.title || event.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-bold">Emails Sent</p>
              <p className="text-3xl font-black text-gray-900 mt-2">{displayHistory.length}</p>
            </div>
            <div className="p-4 bg-gradient-to-r from-blue-100 to-blue-200 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
              <Mail size={24} className="text-blue-600" strokeWidth={2.5} />
            </div>
          </div>
          <div className="absolute top-2 right-2 w-2 h-2 bg-blue-400 rounded-full opacity-60"></div>
        </div>
        
        <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-bold">Recipients Reached</p>
              <p className="text-3xl font-black text-green-600 mt-2">
                {displayHistory.reduce((sum, h) => sum + (h.recipientCount || 0), 0)}
              </p>
            </div>
            <div className="p-4 bg-gradient-to-r from-green-100 to-emerald-200 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
              <Users size={24} className="text-green-600" strokeWidth={2.5} />
            </div>
          </div>
          <div className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full opacity-60"></div>
        </div>

        <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-bold">Templates Available</p>
              <p className="text-3xl font-black text-purple-600 mt-2">{displayTemplates.length}</p>
            </div>
            <div className="p-4 bg-gradient-to-r from-purple-100 to-pink-200 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
              <FileText size={24} className="text-purple-600" strokeWidth={2.5} />
            </div>
          </div>
          <div className="absolute top-2 right-2 w-2 h-2 bg-purple-400 rounded-full opacity-60"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Compose Section */}
        <div className="lg:col-span-2">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/60 overflow-hidden">
            {/* Tabs */}
            <div className="border-b border-gray-100">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('compose')}
                  className={`relative flex-1 py-4 text-center font-bold transition-all duration-300 ${
                    activeTab === 'compose'
                      ? 'text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Mail size={18} className="inline-block mr-2" strokeWidth={2.5} />
                  <span className="hidden sm:inline">Compose Email</span>
                  <span className="sm:hidden">Email</span>
                  {activeTab === 'compose' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('announcement')}
                  className={`relative flex-1 py-4 text-center font-bold transition-all duration-300 ${
                    activeTab === 'announcement'
                      ? 'text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <MessageSquare size={18} className="inline-block mr-2" strokeWidth={2.5} />
                  <span className="hidden sm:inline">Announcement</span>
                  <span className="sm:hidden">Announce</span>
                  {activeTab === 'announcement' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"></div>
                  )}
                </button>
              </div>
            </div>

            <div className="p-8">
              {activeTab === 'compose' && (
                <div className="space-y-6">
                  {/* Template Selector */}
                  <div>
                    <label className="block text-sm font-black text-gray-900 mb-3">Email Template</label>
                    <select
                      value={emailData.template}
                      onChange={(e) => {
                        const template = displayTemplates.find((t) => t.id === e.target.value);
                        setEmailData({
                          ...emailData,
                          template: e.target.value,
                          subject: template?.subject || emailData.subject,
                        });
                      }}
                      className="w-full px-6 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm font-bold text-gray-900"
                    >
                      <option value="">Select a template (optional)</option>
                      {displayTemplates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Recipient Filter */}
                  <div>
                    <label className="block text-sm font-black text-gray-900 mb-3">Recipients</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {recipientFilters.map((filter) => (
                        <button
                          key={filter.value}
                          onClick={() => setEmailData({ ...emailData, recipientFilter: filter.value })}
                          className={`group flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
                            emailData.recipientFilter === filter.value
                              ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 shadow-lg'
                              : 'border-gray-200 text-gray-600 hover:border-blue-300'
                          }`}
                        >
                          <filter.icon size={16} className="flex-shrink-0 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                          <span className="font-bold text-sm">{filter.label}</span>
                          {emailData.recipientFilter === filter.value && (
                            <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-black text-gray-900 mb-3">Subject</label>
                    <input
                      type="text"
                      value={emailData.subject}
                      onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                      placeholder="Enter email subject"
                      className="w-full px-6 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm font-semibold text-gray-900 placeholder-gray-500"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-black text-gray-900 mb-3">Message</label>
                    <textarea
                      value={emailData.message}
                      onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
                      rows={8}
                      placeholder="Write your email message here...

You can use placeholders like:
{{participantName}} - Participant's name
{{eventName}} - Event name
{{eventDate}} - Event date"
                      className="w-full px-6 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm font-mono text-sm resize-none"
                    />
                  </div>

                  {/* Send Button */}
                  <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                    <p className="text-sm text-gray-600 font-semibold">
                      This email will be sent to participants matching the selected filter.
                    </p>
                    <button
                      onClick={handleSendEmail}
                      disabled={sending || !emailData.subject || !emailData.message}
                      className="group flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:shadow-xl hover:scale-105 transition-all font-bold disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {sending ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send size={18} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
                      )}
                      Send Email
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'announcement' && (
                <div className="space-y-5">
                  {/* Announcement Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <div className="flex gap-3">
                      {['INFO', 'WARNING', 'URGENT', 'ANNOUNCEMENT'].map((type) => (
                        <button
                          key={type}
                          onClick={() => setAnnouncementData({ ...announcementData, type })}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                            announcementData.type === type
                              ? type === 'INFO' ? 'bg-blue-100 text-blue-700' :
                                type === 'WARNING' ? 'bg-yellow-100 text-yellow-700' :
                                type === 'URGENT' ? 'bg-red-100 text-red-700' :
                                'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Announcement Message</label>
                    <textarea
                      value={announcementData.message}
                      onChange={(e) => setAnnouncementData({ ...announcementData, message: e.target.value })}
                      rows={6}
                      placeholder="Write your announcement message here..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  {/* Post Button */}
                  <button
                    onClick={handleCreateAnnouncement}
                    disabled={sending || !announcementData.message}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {sending ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <MessageSquare size={18} />
                    )}
                    Post Announcement
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* History Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/60 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
              <History size={20} strokeWidth={2.5} />
              Communication History
            </h3>
          </div>
          <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
            {displayHistory.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Mail size={32} className="text-gray-500" strokeWidth={2} />
                </div>
                <p className="text-gray-600 font-bold">No communications sent yet</p>
              </div>
            ) : (
              displayHistory.map((item) => (
                <div key={item._id} className="p-5 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-black text-gray-900 text-base line-clamp-1">{item.subject}</h4>
                    {statusBadge(item.status)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 font-semibold">
                    <span className="flex items-center gap-2">
                      <Users size={14} strokeWidth={2.5} />
                      {item.recipientCount} recipients
                    </span>
                    <span className="flex items-center gap-2">
                      <Clock size={14} strokeWidth={2.5} />
                      {new Date(item.sentAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="inline-block mt-3 px-3 py-1.5 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-xl text-sm font-bold border border-blue-200">
                    {item.recipientFilter}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Communication;
