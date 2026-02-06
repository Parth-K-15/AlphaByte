import { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
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
  getAssignedEvents,
  getCertificateStats,
  getCertificateRequests,
  approveCertificateRequest,
  rejectCertificateRequest
} from '../../services/organizerApi';

// Helper to check if ID is a valid MongoDB ObjectId
const isValidObjectId = (id) => /^[a-fA-F0-9]{24}$/.test(id);

const Certificates = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(searchParams.get('event') || '');
  const [certificates, setCertificates] = useState([]);
  const [certificateRequests, setCertificateRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [certStats, setCertStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [processingRequest, setProcessingRequest] = useState(null);
  
  // Determine initial tab from URL path
  const getInitialTab = () => {
    if (location.pathname.includes('/distribution')) return 'distribution';
    return 'generate';
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab());
  
  // Update tab when URL changes
  useEffect(() => {
    const tab = location.pathname.includes('/distribution') ? 'distribution' : 'generate';
    setActiveTab(tab);
  }, [location.pathname]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const [generateOptions, setGenerateOptions] = useState({
    template: 'default',
    includeAll: true,
    achievement: 'Participation',
    competitionName: '',
  });

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedEvent && isValidObjectId(selectedEvent)) {
      fetchCertificates();
      fetchCertificateStats();
    } else {
      setLoading(false);
      setCertStats(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEvent]);

  const fetchEvents = async () => {
    try {
      // Get userId directly from localStorage (stored by AuthContext)
      const organizerId = localStorage.getItem('userId');
      
      console.log('🔍 [Certificates] Organizer ID from localStorage:', organizerId);
      
      if (!organizerId) {
        console.error('❌ [Certificates] No organizer ID found!');
        alert('User ID not found. Please log in again.');
        return;
      }
      
      const response = await getAssignedEvents(organizerId);
      console.log('🔍 [Certificates] API Response:', response.data);
      console.log('🔍 [Certificates] Events received:', response.data.data?.length || 0);
      
      if (response.data.success) {
        // Log each event's organizer ID to verify filtering
        response.data.data.forEach((event, index) => {
          console.log(`📋 [Certificates] Event ${index + 1}: ${event.title || event.name}, Team Lead: ${event.teamLead?._id || event.teamLead}`);
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

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const response = await getCertificateLogs(selectedEvent, {});
      if (response.data.success) {
        setCertificates(Array.isArray(response.data.data) ? response.data.data : []);
        setCertificateRequests(Array.isArray(response.data.requests) ? response.data.requests : []);
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
      setCertificates([]);
      setCertificateRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCertificateStats = async () => {
    setLoadingStats(true);
    try {
      const response = await getCertificateStats(selectedEvent);
      if (response.data.success) {
        console.log('📊 Certificate Stats:', response.data.data);
        setCertStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching certificate stats:', error);
      setCertStats(null);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleGenerateCertificates = async () => {
    if (!selectedEvent || !isValidObjectId(selectedEvent)) {
      alert('Please select an event first.');
      return;
    }
    
    const organizerId = localStorage.getItem('userId');
    if (!organizerId) {
      alert('User ID not found. Please log in again.');
      return;
    }
    
    setGenerating(true);
    try {
      const requestData = {
        organizerId,
        template: generateOptions.template,
        achievement: generateOptions.achievement || 'Participation',
        competitionName: generateOptions.competitionName || undefined
      };
      
      const response = await generateCertificates(selectedEvent, requestData);
      if (response.data.success) {
        const generated = response.data.data.generated || response.data.data.count || 0;
        const failed = response.data.data.failed || 0;
        
        if (failed > 0) {
          alert(`Generated ${generated} certificates successfully.\n${failed} failed to generate.`);
        } else if (generated > 0) {
          alert(`✅ Successfully generated ${generated} certificate${generated === 1 ? '' : 's'}!\n\nCertificates have been uploaded to Cloudinary and are ready for distribution.`);
        } else {
          alert('ℹ️ No new certificates to generate.\n\nAll eligible participants already have certificates.');
        }
        
        fetchCertificates();
        fetchCertificateStats();
        if (generated > 0) {
          setActiveTab('distribution');
        }
      } else if (response.data.message) {
        // Show backend error message
        alert(`⚠️ ${response.data.message}`);
      }
    } catch (error) {
      console.error('Error generating certificates:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to generate certificates';
      alert(`❌ Certificate Generation Error\n\n${errorMessage}\n\n💡 Tip: Make sure participants have marked their attendance using the Attendance QR page before generating certificates.`);
    } finally {
      setGenerating(false);
    }
  };

  const handleSendCertificates = async () => {
    if (!selectedEvent || !isValidObjectId(selectedEvent)) {
      alert('Please select an event first.');
      return;
    }
    setSending(true);
    try {
      const response = await sendCertificates(selectedEvent, { sendAll: true });
      if (response.data.success) {
        const sent = response.data.data.sent || response.data.data.sentCount || 0;
        const failed = response.data.data.failed || 0;
        
        if (failed > 0) {
          alert(`Sent ${sent} certificate${sent === 1 ? '' : 's'} successfully via email.\n${failed} failed to send.`);
        } else if (sent > 0) {
          alert(`Successfully sent ${sent} certificate${sent === 1 ? '' : 's'} via email!`);
        } else {
          alert('No certificates to send. Please generate certificates first.');
        }
        
        fetchCertificates();
      }
    } catch (error) {
      console.error('Error sending certificates:', error);
      alert(error.response?.data?.message || 'Failed to send certificates');
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

  const handleApproveRequest = async (requestId) => {
    const organizerId = localStorage.getItem('userId');
    const achievement = prompt('Enter achievement type (e.g., Winner, Participant, Runner-up):', 'Participation');
    
    if (!achievement) return;
    
    const competitionName = prompt('Enter competition name (optional, press Enter to skip):');
    
    setProcessingRequest(requestId);
    try {
      const response = await approveCertificateRequest(requestId, {
        organizerId,
        achievement,
        competitionName: competitionName || undefined,
        template: 'default'
      });
      
      if (response.data.success) {
        alert('Certificate generated successfully!');
        fetchCertificates();
        fetchCertificateStats();
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert(error.message || 'Failed to approve certificate request');
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRejectRequest = async (requestId) => {
    const reason = prompt('Enter rejection reason:');
    
    if (!reason) return;
    
    const organizerId = localStorage.getItem('userId');
    
    setProcessingRequest(requestId);
    try {
      const response = await rejectCertificateRequest(requestId, {
        organizerId,
        reason
      });
      
      if (response.data.success) {
        alert('Certificate request rejected');
        fetchCertificates();
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert(error.message || 'Failed to reject certificate request');
    } finally {
      setProcessingRequest(null);
    }
  };

  const templates = [
    { id: 'default', name: 'Default Certificate', preview: '/templates/default.png' },
    { id: 'professional', name: 'Professional', preview: '/templates/professional.png' },
    { id: 'modern', name: 'Modern Design', preview: '/templates/modern.png' },
    { id: 'minimal', name: 'Minimal', preview: '/templates/minimal.png' },
  ];

  const displayEvents = events;
  const displayCertificates = Array.isArray(certificates) ? certificates : [];

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
    requests: certificateRequests.filter((r) => r.status === 'PENDING').length,
  };

  const statusBadge = (status) => {
    const config = {
      SENT: { color: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200', icon: CheckCircle },
      GENERATED: { color: 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border-amber-200', icon: Clock },
      FAILED: { color: 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border-red-200', icon: AlertCircle },
    };
    const { color, icon: Icon } = config[status] || config.GENERATED;
    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black border ${color}`}>
        <Icon size={12} strokeWidth={2.5} />
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

      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-xl">
            <Award size={24} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900">Certificate Management</h1>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full mt-1"></div>
            <p className="text-gray-600 font-semibold mt-2">Generate and distribute certificates</p>
          </div>
        </div>
        <select
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
          className="px-6 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm font-bold text-gray-900 shadow-lg"
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-bold">Total Generated</p>
              <p className="text-3xl font-black text-gray-900 mt-2">{stats.total}</p>
            </div>
            <div className="p-4 bg-gradient-to-r from-blue-100 to-blue-200 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
              <Award size={24} className="text-blue-600" strokeWidth={2.5} />
            </div>
          </div>
          <div className="absolute top-2 right-2 w-2 h-2 bg-blue-400 rounded-full opacity-60"></div>
        </div>
        
        <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-bold">Sent Successfully</p>
              <p className="text-3xl font-black text-green-600 mt-2">{stats.sent}</p>
            </div>
            <div className="p-4 bg-gradient-to-r from-green-100 to-emerald-200 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
              <CheckCircle size={24} className="text-green-600" strokeWidth={2.5} />
            </div>
          </div>
          <div className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full opacity-60"></div>
        </div>

        <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-bold">Pending</p>
              <p className="text-3xl font-black text-amber-600 mt-2">{stats.pending}</p>
            </div>
            <div className="p-4 bg-gradient-to-r from-amber-100 to-yellow-200 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
              <Clock size={24} className="text-amber-600" strokeWidth={2.5} />
            </div>
          </div>
          <div className="absolute top-2 right-2 w-2 h-2 bg-amber-400 rounded-full opacity-60"></div>
        </div>

        <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-bold">Failed</p>
              <p className="text-3xl font-black text-red-600 mt-2">{stats.failed}</p>
            </div>
            <div className="p-4 bg-gradient-to-r from-red-100 to-pink-200 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
              <AlertCircle size={24} className="text-red-600" strokeWidth={2.5} />
            </div>
          </div>
          <div className="absolute top-2 right-2 w-2 h-2 bg-red-400 rounded-full opacity-60"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/60 overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-100">
          <div className="flex">
            <button
              onClick={() => setActiveTab('generate')}
              className={`relative flex-1 py-4 text-center font-bold transition-all duration-300 ${
                activeTab === 'generate'
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Award size={18} className="inline-block mr-2" strokeWidth={2.5} />
              Generate Certificates
              {activeTab === 'generate' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('distribution')}
              className={`relative flex-1 py-4 text-center font-bold transition-all duration-300 ${
                activeTab === 'distribution'
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Send size={18} className="inline-block mr-2" strokeWidth={2.5} />
              Distribution Log
              {activeTab === 'distribution' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"></div>
              )}
            </button>
          </div>
        </div>

        <div className="p-8">
          {activeTab === 'generate' && (
            <div className="space-y-8">
              {/* Template Selection */}
              <div>
                <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></span>
                  Select Template
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setGenerateOptions({ ...generateOptions, template: template.id })}
                      className={`group relative p-5 rounded-2xl border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                        generateOptions.template === template.id
                          ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 shadow-lg'
                          : 'border-gray-200 hover:border-blue-300 bg-white'
                      }`}
                    >
                      <div className="h-28 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mb-4 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <FileText size={32} className="text-gray-500" strokeWidth={2} />
                      </div>
                      <p className="text-sm font-black text-gray-900">{template.name}</p>
                      {generateOptions.template === template.id && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <CheckCircle size={14} className="text-white" strokeWidth={2.5} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
                <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></span>
                  Generation Options
                </h3>
                <label className="flex items-center gap-4 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={generateOptions.includeAll}
                    onChange={(e) => setGenerateOptions({ ...generateOptions, includeAll: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 group-hover:scale-105 transition-transform"
                  />
                  <span className="text-gray-800 font-bold group-hover:text-blue-600 transition-colors">Generate for all participants who attended the event</span>
                </label>
              </div>

              {/* Info */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 flex items-start gap-4 border border-blue-200">
                <div className="p-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl">
                  <AlertCircle size={20} className="text-blue-600" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-blue-900 font-black text-lg">Certificate Generation</p>
                  <p className="text-blue-700 font-semibold mt-2">
                    Certificates will be generated for all participants who have marked attendance. 
                    You can send them individually or in bulk after generation.
                  </p>
                </div>
              </div>

              {/* Generate Button */}
              <div className="flex justify-center pt-4">
                <button
                  onClick={handleGenerateCertificates}
                  disabled={generating}
                  className="group flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:shadow-2xl hover:scale-105 transition-all font-bold disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-lg"
                >
                  {generating ? (
                    <RefreshCw size={20} strokeWidth={2.5} className="animate-spin" />
                  ) : (
                    <Award size={20} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
                  )}
                  {generating ? 'Generating Certificates...' : 'Generate Certificates'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'distribution' && (
            <div className="space-y-6">
              {/* Actions Bar */}
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} strokeWidth={2} />
                  <input
                    type="text"
                    placeholder="Search by name, email, or certificate ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm font-semibold"
                  />
                </div>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-6 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm font-bold text-gray-700"
                >
                  <option value="all">All Status</option>
                  <option value="SENT">Sent</option>
                  <option value="GENERATED">Pending</option>
                  <option value="FAILED">Failed</option>
                </select>
                <button
                  onClick={handleSendCertificates}
                  disabled={sending || stats.pending === 0}
                  className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:shadow-xl hover:scale-105 transition-all font-bold disabled:opacity-50 disabled:hover:scale-100"
                >
                  {sending ? (
                    <RefreshCw size={18} strokeWidth={2.5} className="animate-spin" />
                  ) : (
                    <Send size={18} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
                  )}
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
                                onClick={() => cert.certificateUrl && window.open(`http://localhost:5000${cert.certificateUrl}`, '_blank')}
                                disabled={!cert.certificateUrl}
                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Preview"
                              >
                                <Eye size={16} />
                              </button>
                              <a
                                href={cert.certificateUrl ? `http://localhost:5000${cert.certificateUrl}` : '#'}
                                download={cert.pdfFilename || `Certificate_${cert.participant?.name}.pdf`}
                                className={`p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 ${!cert.certificateUrl ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                                title="Download"
                                onClick={(e) => {
                                  if (!cert.certificateUrl) {
                                    e.preventDefault();
                                    alert('Certificate PDF not available');
                                  }
                                }}
                              >
                                <Download size={16} />
                              </a>
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
    </div>
  );
};

export default Certificates;
