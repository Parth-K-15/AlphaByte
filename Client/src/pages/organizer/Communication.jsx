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
} from 'lucide-react';
import { 
  sendEmail, 
  getCommunicationHistory, 
  createAnnouncement, 
  getEmailTemplates,
  getAssignedEvents 
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
      const response = await getAssignedEvents();
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

  const handleSendEmail = async () => {
    if (!selectedEvent || !isValidObjectId(selectedEvent)) {
      alert('Please select a real event first. Demo events cannot send emails.');
      return;
    }
    setSending(true);
    try {
      const response = await sendEmail({
        eventId: selectedEvent,
        ...emailData,
      });
      if (response.data.success) {
        alert('Email sent successfully!');
        setEmailData({ subject: '', message: '', recipientFilter: 'ALL', template: '' });
        fetchHistory();
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!selectedEvent || !isValidObjectId(selectedEvent)) {
      alert('Please select a real event first. Demo events cannot create announcements.');
      return;
    }
    setSending(true);
    try {
      const response = await createAnnouncement({
        eventId: selectedEvent,
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

  const demoTemplates = [
    { id: '1', name: 'Event Reminder', subject: 'Reminder: {{eventName}} is coming up!' },
    { id: '2', name: 'Thank You', subject: 'Thank you for attending {{eventName}}' },
    { id: '3', name: 'Certificate Ready', subject: 'Your certificate for {{eventName}} is ready!' },
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
    <div className="space-y-6">
      {/* Demo Mode Banner */}
      {usingDemoData && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Mail size={20} className="text-yellow-600" />
          </div>
          <div>
            <h3 className="font-medium text-yellow-800">Demo Mode</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Showing sample data. Create events from the Admin panel and get assigned to send real communications.
            </p>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Communication</h1>
          <p className="text-gray-500 mt-1">Send emails and announcements to participants</p>
        </div>
        <select
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {displayEvents.map((event) => (
            <option key={event._id || event.id} value={event._id || event.id}>
              {event.name}
            </option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Emails Sent</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{displayHistory.length}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <Mail size={20} className="text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Recipients Reached</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {displayHistory.reduce((sum, h) => sum + (h.recipientCount || 0), 0)}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <Users size={20} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Templates Available</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{displayTemplates.length}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl">
              <FileText size={20} className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Tabs */}
            <div className="border-b border-gray-100">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('compose')}
                  className={`flex-1 py-4 text-center font-medium transition-colors ${
                    activeTab === 'compose'
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Mail size={18} className="inline-block mr-2" />
                  Compose Email
                </button>
                <button
                  onClick={() => setActiveTab('announcement')}
                  className={`flex-1 py-4 text-center font-medium transition-colors ${
                    activeTab === 'announcement'
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <MessageSquare size={18} className="inline-block mr-2" />
                  Announcement
                </button>
              </div>
            </div>

            <div className="p-6">
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
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {recipientFilters.map((filter) => (
                        <button
                          key={filter.value}
                          onClick={() => setEmailData({ ...emailData, recipientFilter: filter.value })}
                          className={`flex items-center gap-2 p-3 rounded-xl border text-sm transition-colors ${
                            emailData.recipientFilter === filter.value
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <filter.icon size={16} />
                          {filter.label}
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
                    <h4 className="font-medium text-gray-800 text-sm line-clamp-1">{item.subject}</h4>
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
