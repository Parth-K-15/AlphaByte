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

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Requests</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{stats.requests}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl">
              <Users size={20} className="text-purple-600" />
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
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 py-4 text-center font-medium transition-colors relative ${
                activeTab === 'requests'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users size={18} className="inline-block mr-2" />
              Certificate Requests
              {stats.requests > 0 && (
                <span className="absolute top-3 right-1/4 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {stats.requests}
                </span>
              )}
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
              <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                <h3 className="font-semibold text-gray-800 mb-3">Certificate Details</h3>
                
                {/* Achievement Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Achievement Type</label>
                  <input
                    type="text"
                    value={generateOptions.achievement}
                    onChange={(e) => setGenerateOptions({ ...generateOptions, achievement: e.target.value })}
                    placeholder="e.g., Participation, Winner, Runner-up, etc."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">This will appear on the certificate</p>
                </div>
                
                {/* Competition Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Competition/Activity Name</label>
                  <input
                    type="text"
                    value={generateOptions.competitionName}
                    onChange={(e) => setGenerateOptions({ ...generateOptions, competitionName: e.target.value })}
                    placeholder="e.g., Hackathon, Workshop, Seminar (leave empty to use event name)"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Optional: Specify if different from event name</p>
                </div>
                
                {/* Include All Option */}
                <label className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    checked={generateOptions.includeAll}
                    onChange={(e) => setGenerateOptions({ ...generateOptions, includeAll: e.target.checked })}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-gray-700">Generate for all participants who attended the event</span>
                </label>
              </div>

              {/* Eligibility Status */}
              {loadingStats ? (
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading participant data...</p>
                </div>
              ) : certStats ? (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Users size={18} className="text-blue-600" />
                        Certificate Eligibility Status
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">Participant overview for this event</p>
                    </div>
                    <button
                      onClick={fetchCertificateStats}
                      className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                      title="Refresh"
                    >
                      <RefreshCw size={16} className="text-gray-600" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-white rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-gray-800">{certStats.totalRegistered}</p>
                      <p className="text-xs text-gray-500 mt-1">Registered</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-green-600">{certStats.totalAttended}</p>
                      <p className="text-xs text-gray-500 mt-1">Attended</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-blue-600">{certStats.eligibleForCertificates}</p>
                      <p className="text-xs text-gray-500 mt-1">Eligible Now</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-purple-600">{certStats.totalCertificatesIssued}</p>
                      <p className="text-xs text-gray-500 mt-1">Already Issued</p>
                    </div>
                  </div>

                  {certStats.eligibleForCertificates === 0 && certStats.totalAttended === 0 ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                      <AlertCircle size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">No Attendance Marked</p>
                        <p className="text-xs text-yellow-600 mt-1">
                          Please mark attendance for participants using the <strong>Attendance QR</strong> page before generating certificates.
                        </p>
                      </div>
                    </div>
                  ) : certStats.eligibleForCertificates === 0 && certStats.totalAttended > 0 ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
                      <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-green-800">All Certificates Generated</p>
                        <p className="text-xs text-green-600 mt-1">
                          All {certStats.totalAttended} participants who attended already have certificates.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                      <Award size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">Ready to Generate</p>
                        <p className="text-xs text-blue-600 mt-1">
                          {certStats.eligibleForCertificates} participant{certStats.eligibleForCertificates === 1 ? '' : 's'} will receive certificates when you click generate.
                        </p>
                      </div>
                    </div>
                  )}

                  {certStats.participants && certStats.participants.length > 0 && (
                    <details className="mt-3">
                      <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900">
                        View Participant Details ({certStats.participants.length})
                      </summary>
                      <div className="mt-3 bg-white rounded-lg p-3 max-h-48 overflow-y-auto">
                        {certStats.participants.map((p) => (
                          <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800">{p.name}</p>
                              <p className="text-xs text-gray-500">{p.email}</p>
                            </div>
                            {p.hasCertificate ? (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                ✓ Certificate Issued
                              </span>
                            ) : (
                              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                                Pending
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              ) : (
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
              )}

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

          {activeTab === 'requests' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">Certificate Requests</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Participants who attended and requested certificates
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{certificateRequests.length} requests</span>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="text-gray-500 mt-4">Loading requests...</p>
                </div>
              ) : certificateRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Users size={48} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No certificate requests</h3>
                  <p className="text-gray-500">Requests from participants will appear here</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Participant</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Email</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Requested</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Status</th>
                        <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {certificateRequests.map((request) => (
                        <tr key={request._id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3">
                            <span className="font-medium text-gray-800">
                              {request.participant?.name || request.participant?.fullName}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {request.participant?.email}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {new Date(request.requestedAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">{statusBadge(request.status)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              {request.status === 'PENDING' && (
                                <>
                                  <button
                                    onClick={() => handleApproveRequest(request._id)}
                                    disabled={processingRequest === request._id}
                                    className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                                  >
                                    {processingRequest === request._id ? 'Processing...' : 'Approve'}
                                  </button>
                                  <button
                                    onClick={() => handleRejectRequest(request._id)}
                                    disabled={processingRequest === request._id}
                                    className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {request.status === 'GENERATED' && request.certificate && (
                                <button
                                  onClick={() => window.open(request.certificate.cloudinaryUrl || `http://localhost:5000${request.certificate.certificateUrl}`, '_blank')}
                                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700"
                                  title="View Certificate"
                                >
                                  <Eye size={16} />
                                </button>
                              )}
                              {request.status === 'REJECTED' && (
                                <span className="text-xs text-red-600">
                                  {request.rejectionReason || 'Rejected'}
                                </span>
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
