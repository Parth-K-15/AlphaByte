import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Award,
  Download,
  Send,
  Users,
  CheckCircle,
  Clock,
  FileText,
  RefreshCw,
  Search,
  Mail,
  Eye,
  Filter,
  AlertCircle,
} from 'lucide-react';
import { 
  generateCertificates, 
  sendCertificates, 
  getCertificateLogs, 
  resendCertificate,
  getAssignedEvents 
} from '../../services/organizerApi';

// Helper to check if ID is a valid MongoDB ObjectId
const isValidObjectId = (id) => /^[a-fA-F0-9]{24}$/.test(id);

const Certificates = () => {
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(searchParams.get('event') || '');
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState('generate');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const [generateOptions, setGenerateOptions] = useState({
    template: 'default',
    includeAll: true,
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent && isValidObjectId(selectedEvent)) {
      fetchCertificates();
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

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const response = await getCertificateLogs(selectedEvent, {});
      if (response.data.success) {
        setCertificates(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCertificates = async () => {
    if (!selectedEvent || !isValidObjectId(selectedEvent)) {
      alert('Please select a real event first. Demo events cannot generate certificates.');
      return;
    }
    setGenerating(true);
    try {
      const response = await generateCertificates(selectedEvent, generateOptions);
      if (response.data.success) {
        alert(`Successfully generated ${response.data.data.count} certificates!`);
        fetchCertificates();
        setActiveTab('distribution');
      }
    } catch (error) {
      console.error('Error generating certificates:', error);
      alert('Failed to generate certificates');
    } finally {
      setGenerating(false);
    }
  };

  const handleSendCertificates = async () => {
    if (!selectedEvent || !isValidObjectId(selectedEvent)) {
      alert('Please select a real event first. Demo events cannot send certificates.');
      return;
    }
    setSending(true);
    try {
      const response = await sendCertificates(selectedEvent, { sendAll: true });
      if (response.data.success) {
        alert(`Successfully sent ${response.data.data.sentCount} certificates!`);
        fetchCertificates();
      }
    } catch (error) {
      console.error('Error sending certificates:', error);
      alert('Failed to send certificates');
    } finally {
      setSending(false);
    }
  };

  const handleResendCertificate = async (certificateId) => {
    try {
      await resendCertificate(certificateId);
      alert('Certificate resent successfully!');
      fetchCertificates();
    } catch (error) {
      console.error('Error resending certificate:', error);
      alert('Failed to resend certificate');
    }
  };

  // Demo data
  const demoEvents = [
    { id: '1', name: 'Tech Conference 2025' },
    { id: '2', name: 'Web Development Workshop' },
  ];

  const demoCertificates = [
    { _id: '1', certificateId: 'CERT-2025-001', participant: { name: 'John Doe', email: 'john@example.com' }, status: 'SENT', issuedAt: new Date().toISOString(), sentAt: new Date().toISOString() },
    { _id: '2', certificateId: 'CERT-2025-002', participant: { name: 'Jane Smith', email: 'jane@example.com' }, status: 'SENT', issuedAt: new Date().toISOString(), sentAt: new Date().toISOString() },
    { _id: '3', certificateId: 'CERT-2025-003', participant: { name: 'Mike Johnson', email: 'mike@example.com' }, status: 'GENERATED', issuedAt: new Date().toISOString(), sentAt: null },
    { _id: '4', certificateId: 'CERT-2025-004', participant: { name: 'Sarah Williams', email: 'sarah@example.com' }, status: 'GENERATED', issuedAt: new Date().toISOString(), sentAt: null },
    { _id: '5', certificateId: 'CERT-2025-005', participant: { name: 'Chris Brown', email: 'chris@example.com' }, status: 'FAILED', issuedAt: new Date().toISOString(), sentAt: null },
  ];

  const templates = [
    { id: 'default', name: 'Default Certificate', preview: '/templates/default.png' },
    { id: 'professional', name: 'Professional', preview: '/templates/professional.png' },
    { id: 'modern', name: 'Modern Design', preview: '/templates/modern.png' },
    { id: 'minimal', name: 'Minimal', preview: '/templates/minimal.png' },
  ];

  const displayEvents = events.length > 0 ? events : [];
  const displayCertificates = certificates.length > 0 ? certificates : [];
  const usingDemoData = events.length === 0;

  const filteredCertificates = displayCertificates.filter((cert) => {
    const matchesSearch = 
      cert.participant?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.participant?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.certificateId?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || cert.status === filter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: displayCertificates.length,
    sent: displayCertificates.filter((c) => c.status === 'SENT').length,
    pending: displayCertificates.filter((c) => c.status === 'GENERATED').length,
    failed: displayCertificates.filter((c) => c.status === 'FAILED').length,
  };

  const statusBadge = (status) => {
    const config = {
      SENT: { color: 'bg-green-100 text-green-700', icon: CheckCircle },
      GENERATED: { color: 'bg-yellow-100 text-yellow-700', icon: Clock },
      FAILED: { color: 'bg-red-100 text-red-700', icon: AlertCircle },
    };
    const { color, icon: Icon } = config[status] || config.GENERATED;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${color}`}>
        <Icon size={12} />
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
            <Award size={20} className="text-yellow-600" />
          </div>
          <div>
            <h3 className="font-medium text-yellow-800">Demo Mode</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Showing sample certificates. Create events from the Admin panel and get assigned to generate real certificates.
            </p>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Certificates</h1>
          <p className="text-gray-500 mt-1">Generate and distribute certificates</p>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Generated</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <Award size={20} className="text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Sent</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.sent}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <CheckCircle size={20} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-xl">
              <Clock size={20} className="text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Failed</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.failed}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-xl">
              <AlertCircle size={20} className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-100">
          <div className="flex">
            <button
              onClick={() => setActiveTab('generate')}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeTab === 'generate'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Award size={18} className="inline-block mr-2" />
              Generate Certificates
            </button>
            <button
              onClick={() => setActiveTab('distribution')}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeTab === 'distribution'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Send size={18} className="inline-block mr-2" />
              Distribution Log
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'generate' && (
            <div className="space-y-6">
              {/* Template Selection */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-4">Select Template</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setGenerateOptions({ ...generateOptions, template: template.id })}
                      className={`relative p-4 rounded-xl border-2 transition-all ${
                        generateOptions.template === template.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="h-24 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                        <FileText size={32} className="text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-800">{template.name}</p>
                      {generateOptions.template === template.id && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                          <CheckCircle size={12} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Generation Options</h3>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={generateOptions.includeAll}
                    onChange={(e) => setGenerateOptions({ ...generateOptions, includeAll: e.target.checked })}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-gray-700">Generate for all participants who attended the event</span>
                </label>
              </div>

              {/* Info */}
              <div className="bg-blue-50 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle size={20} className="text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">Certificate Generation</p>
                  <p className="text-sm text-blue-600 mt-1">
                    Certificates will be generated for all participants who have marked attendance. 
                    You can send them individually or in bulk after generation.
                  </p>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerateCertificates}
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {generating ? (
                  <RefreshCw size={20} className="animate-spin" />
                ) : (
                  <Award size={20} />
                )}
                {generating ? 'Generating Certificates...' : 'Generate Certificates'}
              </button>
            </div>
          )}

          {activeTab === 'distribution' && (
            <div className="space-y-4">
              {/* Actions Bar */}
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search by name, email, or certificate ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Status</option>
                  <option value="SENT">Sent</option>
                  <option value="GENERATED">Pending</option>
                  <option value="FAILED">Failed</option>
                </select>
                <button
                  onClick={handleSendCertificates}
                  disabled={sending || stats.pending === 0}
                  className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {sending ? (
                    <RefreshCw size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                  Send All Pending
                </button>
              </div>

              {/* Certificate List */}
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="text-gray-500 mt-4">Loading certificates...</p>
                </div>
              ) : filteredCertificates.length === 0 ? (
                <div className="text-center py-12">
                  <Award size={48} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No certificates found</h3>
                  <p className="text-gray-500">Generate certificates first to see them here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Certificate ID</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Participant</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Email</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Status</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Issued</th>
                        <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredCertificates.map((cert) => (
                        <tr key={cert._id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-mono text-sm text-gray-600">{cert.certificateId}</td>
                          <td className="px-4 py-3">
                            <span className="font-medium text-gray-800">{cert.participant?.name}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{cert.participant?.email}</td>
                          <td className="px-4 py-3">{statusBadge(cert.status)}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {new Date(cert.issuedAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700"
                                title="Preview"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700"
                                title="Download"
                              >
                                <Download size={16} />
                              </button>
                              {cert.status !== 'SENT' && (
                                <button
                                  onClick={() => handleResendCertificate(cert._id)}
                                  className="p-2 hover:bg-blue-50 rounded-lg text-gray-500 hover:text-blue-600"
                                  title="Send"
                                >
                                  <Mail size={16} />
                                </button>
                              )}
                              {cert.status === 'SENT' && (
                                <button
                                  onClick={() => handleResendCertificate(cert._id)}
                                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700"
                                  title="Resend"
                                >
                                  <RefreshCw size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Certificates;
