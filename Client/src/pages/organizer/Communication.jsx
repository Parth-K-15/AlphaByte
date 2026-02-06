import { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(searchParams.get('event') || '');
  
  // Determine initial tab from URL path
  const getInitialTab = () => {
    if (location.pathname.includes('/announcements')) return 'announcement';
    return 'compose';
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab());
  
  // Update tab when URL changes
  useEffect(() => {
    const tab = location.pathname.includes('/announcements') ? 'announcement' : 'compose';
    setActiveTab(tab);
  }, [location.pathname]);
  const [history, setHistory] = useState([]);
  const [templates, setTemplates] = useState([]);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedEvent && isValidObjectId(selectedEvent)) {
      fetchHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEvent]);

  const fetchEvents = async () => {
    try {
      // Get userId directly from localStorage (stored by AuthContext)
      const organizerId = localStorage.getItem('userId');
      
      console.log('🔍 [Communication] Organizer ID from localStorage:', organizerId);
      
      if (!organizerId) {
        console.error('❌ [Communication] No organizer ID found in localStorage!');
        alert('User ID not found. Please log in again.');
        return;
      }
      
      const response = await getAssignedEvents(organizerId);
      console.log('🔍 [Communication] API Response:', response.data);
      console.log('🔍 [Communication] Events received:', response.data.data?.length || 0);
      
      if (response.data.success) {
        // Log each event's organizer ID to verify filtering
        response.data.data.forEach((event, index) => {
          console.log(`📋 [Communication] Event ${index + 1}: ${event.title || event.name}, Organizer: ${event.organizer}`);
        });
        
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
    try {
      const response = await getCommunicationHistory(selectedEvent);
      if (response.data.success) {
        setHistory(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching communication history:', error);
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
      alert('Please select an event first.');
      return;
    }
    if (!emailData.subject || !emailData.message) {
      alert('Please provide both subject and message.');
      return;
    }
    
    const organizerId = localStorage.getItem('userId');
    console.log('📝 Organizer ID for email:', organizerId);
    
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
      alert('Please select an event first.');
      return;
    }
    
    const organizerId = localStorage.getItem('userId');
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

  const displayEvents = events;
  const displayHistory = history;
  const displayTemplates = templates;

  // Helper function to replace placeholders in message/subject
  const replacePlaceholders = (text, eventData) => {
    if (!text || !eventData) return text;
    
    return text
      .replace(/\{\{eventName\}\}/g, eventData.title || eventData.name || 'Event')
      .replace(/\{\{eventDate\}\}/g, eventData.startDate ? new Date(eventData.startDate).toLocaleDateString() : 'TBA')
      .replace(/\{\{eventVenue\}\}/g, eventData.venue || eventData.location || 'TBA')
      .replace(/\{\{organizerName\}\}/g, eventData.organizer?.name || 'Organizer');
  };

  // Get the current selected event data for placeholder replacement
  const currentEvent = displayEvents.find(e => (e._id || e.id) === selectedEvent);

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
    <div className="space-y-4 md:space-y-6 px-4 sm:px-0">
      {/* Email Configuration Status Banner */}
      {emailConfigStatus && (
        <div className={`rounded-xl p-4 flex items-start gap-3 ${
          emailConfigStatus === 'configured' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className={`p-2 rounded-lg ${
            emailConfigStatus === 'configured' ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {emailConfigStatus === 'configured' ? (
              <CheckCircle2 size={20} className="text-green-600" />
            ) : (
              <XCircle size={20} className="text-red-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`font-medium text-sm md:text-base ${
              emailConfigStatus === 'configured' ? 'text-green-800' : 'text-red-800'
            }`}>
              {emailConfigStatus === 'configured' ? 'Email Service Configured' : 'Email Service Not Configured'}
            </h3>
            <p className={`text-xs md:text-sm mt-1 ${
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
            className={`p-2 rounded-lg transition-colors ${
              emailConfigStatus === 'configured' 
                ? 'hover:bg-green-100' 
                : 'hover:bg-red-100'
            }`}
            title="Recheck configuration"
          >
            <Settings size={18} className={checkingConfig ? 'animate-spin' : ''} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">Communication</h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">Send emails and announcements to participants</p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={handleDebugParticipants}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="Debug participants"
          >
            🔍 Debug
          </button>
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="px-3 md:px-4 py-2 text-sm md:text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={displayEvents.length === 0}
          >
            {displayEvents.length === 0 ? (
              <option value="">No events assigned</option>
            ) : (
              displayEvents.map((event) => (
                <option key={event._id || event.id} value={event._id || event.id}>
                  {event.title || event.name}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-500">Emails Sent</p>
              <p className="text-xl md:text-2xl font-bold text-gray-800 mt-1">{displayHistory.length}</p>
            </div>
            <div className="p-2 md:p-3 bg-blue-50 rounded-lg md:rounded-xl">
              <Mail size={18} className="text-blue-600 md:w-5 md:h-5" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-500">Recipients Reached</p>
              <p className="text-xl md:text-2xl font-bold text-green-600 mt-1">
                {displayHistory.reduce((sum, h) => sum + (h.recipientCount || 0), 0)}
              </p>
            </div>
            <div className="p-2 md:p-3 bg-green-50 rounded-lg md:rounded-xl">
              <Users size={18} className="text-green-600 md:w-5 md:h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-500">Templates Available</p>
              <p className="text-xl md:text-2xl font-bold text-purple-600 mt-1">{displayTemplates.length}</p>
            </div>
            <div className="p-2 md:p-3 bg-purple-50 rounded-lg md:rounded-xl">
              <FileText size={18} className="text-purple-600 md:w-5 md:h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Compose Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Tabs */}
            <div className="border-b border-gray-100">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('compose')}
                  className={`flex-1 py-3 md:py-4 text-center text-sm md:text-base font-medium transition-colors ${
                    activeTab === 'compose'
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Mail size={16} className="inline-block mr-2 md:w-[18px] md:h-[18px]" />
                  <span className="hidden sm:inline">Compose Email</span>
                  <span className="sm:hidden">Email</span>
                </button>
                <button
                  onClick={() => setActiveTab('announcement')}
                  className={`flex-1 py-3 md:py-4 text-center text-sm md:text-base font-medium transition-colors ${
                    activeTab === 'announcement'
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <MessageSquare size={16} className="inline-block mr-2 md:w-[18px] md:h-[18px]" />
                  <span className="hidden sm:inline">Announcement</span>
                  <span className="sm:hidden">Announce</span>
                </button>
              </div>
            </div>

            <div className="p-4 md:p-6">
              {activeTab === 'compose' && (
                <div className="space-y-5">
                  {/* Template Selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Template</label>
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
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                      {recipientFilters.map((filter) => (
                        <button
                          key={filter.value}
                          onClick={() => setEmailData({ ...emailData, recipientFilter: filter.value })}
                          className={`flex items-center gap-1.5 md:gap-2 p-2 md:p-3 rounded-lg md:rounded-xl border text-xs md:text-sm transition-colors ${
                            emailData.recipientFilter === filter.value
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <filter.icon size={14} className="flex-shrink-0 md:w-4 md:h-4" />
                          <span className="truncate">{filter.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                    <input
                      type="text"
                      value={emailData.subject}
                      onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                      placeholder="Enter email subject"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <textarea
                      value={emailData.message}
                      onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
                      rows={8}
                      placeholder="Write your email message here...

You can use placeholders like:
{{participantName}} - Participant's name
{{eventName}} - Event name
{{eventDate}} - Event date"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                    />
                  </div>

                  {/* Send Button */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500">
                      This email will be sent to participants matching the selected filter.
                    </p>
                    <button
                      onClick={handleSendEmail}
                      disabled={sending || !emailData.subject || !emailData.message}
                      className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
                    >
                      {sending ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send size={18} />
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <History size={18} />
              Communication History
            </h3>
          </div>
          <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
            {displayHistory.length === 0 ? (
              <div className="p-6 text-center">
                <Mail size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No communications sent yet</p>
              </div>
            ) : (
              displayHistory.map((item) => (
                <div key={item._id} className="p-4 hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-800 text-sm line-clamp-1">
                      {replacePlaceholders(item.subject, currentEvent)}
                    </h4>
                    {statusBadge(item.status)}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {item.recipientCount} recipients
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(item.sentAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="inline-block mt-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                    {item.recipientFilter}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Communication;
