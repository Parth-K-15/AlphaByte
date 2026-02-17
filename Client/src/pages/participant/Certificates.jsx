import { useState, useEffect } from 'react';
import { Award, Download, CheckCircle, AlertCircle, Calendar, Clock } from 'lucide-react';
import { getMyCertificates } from '../../services/participantApi';
import { useAuth } from '../../context/AuthContext';

const Certificates = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [attendedEvents, setAttendedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, attended: 0, registered: 0 });
  const [email, setEmail] = useState('');
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);

  useEffect(() => {
    fetchCertificates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      // Use authenticated user's email first, fall back to manually entered email
      const participantEmail = user?.email || localStorage.getItem('participantEmail');
      
      console.log('🔍 Using email from:', user?.email ? 'authenticated user' : 'localStorage');
      console.log('📧 Email:', participantEmail);
      
      if (!participantEmail) {
        console.error('❌ No participant email found');
        setShowEmailPrompt(true);
        setLoading(false);
        return;
      }

      console.log('📡 Calling API with email:', participantEmail);
      const response = await getMyCertificates(participantEmail);
      
      console.log('📋 Full API Response:', JSON.stringify(response, null, 2));
      console.log('📋 Response.data:', response.data);
      
      if (response.data && response.data.success) {
        const responseData = response.data.data;
        console.log('✅ Success! Data received:', responseData);
        console.log('📊 Stats:', responseData.stats);
        console.log('🏆 Certificates count:', responseData.certificates?.length || 0);
        console.log('✅ Attended Events (no cert):', responseData.attendedEventsWithoutCertificate?.length || 0);
        console.log('📝 All Events count:', responseData.allEvents?.length || 0);
        
        setCertificates(responseData.certificates || []);
        setAttendedEvents(responseData.attendedEventsWithoutCertificate || []);
        setStats(responseData.stats || { total: 0, attended: 0, registered: 0 });
      } else {
        console.error('❌ API returned unsuccessful response:', response.data);
        alert('Failed to load certificates: Invalid response from server');
      }
    } catch (error) {
      console.error('❌ Error fetching certificates:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
      alert(`Failed to load certificates: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (email && email.trim()) {
      // Only store manually entered email if user is not authenticated
      if (!user?.email) {
        localStorage.setItem('participantEmail', email.trim());
      }
      setShowEmailPrompt(false);
      fetchCertificates();
    }
  };

  const handleDownload = (certificate) => {
    if (certificate.cloudinaryUrl) {
      // Open in new tab for viewing, right-click to download
      window.open(certificate.cloudinaryUrl, '_blank');
    } else if (certificate.certificateUrl) {
      window.open(`http://localhost:5000${certificate.certificateUrl}`, '_blank');
    } else {
      alert('Certificate not available');
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      GENERATED: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300',
      SENT: 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300',
      DOWNLOADED: 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300',
      FAILED: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300',
    };
    return badges[status] || 'bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-300';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f1015] flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 dark:border-blue-900"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 dark:border-blue-500 absolute top-0 left-0"></div>
          </div>
          <p className="mt-4 text-sm text-gray-600 dark:text-zinc-400 font-medium">Loading certificates...</p>
        </div>
      </div>
    );
  }

  if (showEmailPrompt) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f1015] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/5 rounded-2xl shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 shadow-lg inline-block mb-4">
              <Award className="w-12 h-12 text-white" strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Enter Your Email</h2>
            <p className="text-gray-600 dark:text-zinc-400">
              Please enter the email you used to register for events
            </p>
          </div>
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white py-3 rounded-lg transition-colors font-semibold shadow-sm"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1015] p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 md:p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 shadow-lg">
              <Award className="w-7 h-7 md:w-8 md:h-8 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
                My Certificates
              </h1>
              <p className="text-sm md:text-base text-gray-600 dark:text-zinc-400 mt-1">
                View and download your achievement certificates
              </p>
            </div>
          </div>
          
          {(user?.email || localStorage.getItem('participantEmail')) && (
            <div className="inline-flex items-center gap-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 px-4 py-2 rounded-xl">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                📧 {user?.email || localStorage.getItem('participantEmail')}
              </span>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-gray-200 dark:border-white/5 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">
                Total Certificates
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.total}
            </p>
          </div>

          <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-gray-200 dark:border-white/5 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-50 dark:bg-green-500/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">
                Events Attended
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.attended}
            </p>
          </div>

          <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-gray-200 dark:border-white/5 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-50 dark:bg-purple-500/10 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-sm font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">
                Registered Events
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.registered}
            </p>
          </div>
        </div>

        {/* Certificates Grid */}
        {certificates.length === 0 ? (
          <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-gray-200 dark:border-white/5 p-12 text-center shadow-sm">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Award className="w-10 h-10 md:w-12 md:h-12 text-gray-400 dark:text-gray-600" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3">
              No Certificates Yet
            </h3>
            <p className="text-gray-600 dark:text-zinc-400 mb-4 max-w-md mx-auto">
              Certificates are issued after event completion when generated by the organizer
            </p>
            <div className="inline-flex flex-col gap-2 text-sm text-gray-600 dark:text-zinc-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span>Attend an event</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span>Wait for event completion</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span>Organizer generates certificates</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {certificates.map((cert) => (
              <div
                key={cert._id}
                className="bg-white dark:bg-white/[0.03] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm hover:shadow-lg dark:hover:shadow-black/20 transition-all duration-300 overflow-hidden group"
              >
                {/* Certificate Preview */}
                <div className="relative h-40 md:h-48 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center p-6">
                  <div className="text-center text-white">
                    <Award className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-2 opacity-90" strokeWidth={1.5} />
                    <p className="font-bold text-sm md:text-base">Certificate of Participation</p>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg ${getStatusBadge(cert.status)}`}>
                      {cert.status}
                    </span>
                  </div>
                </div>

                {/* Certificate Info */}
                <div className="p-5">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4 line-clamp-2">
                    {cert.event?.title || 'Event'}
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                      <span className="text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase">
                        Certificate ID
                      </span>
                      <span className="font-mono text-xs bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-400 px-2 py-1 rounded-md font-bold">
                        {cert.certificateId}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span className="font-medium">Issued: {formatDate(cert.issuedAt)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      <span className="font-medium">{cert.participant?.fullName}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5">
                    <button
                      onClick={() => handleDownload(cert)}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                    >
                      <Download size={16} />
                      Download Certificate
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Attended Events Without Certificates */}
        {attendedEvents.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Attended Events (Pending Certificates)
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {attendedEvents.map((event) => (
                <div
                  key={event._id}
                  className="bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/5 p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-yellow-50 dark:bg-yellow-500/10 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-1 truncate">
                        {event.title}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-zinc-400">
                        Certificate pending generation
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Change Email */}
        {!user?.email && (
          <div className="text-center mt-8">
            <button
              onClick={() => {
                localStorage.removeItem('participantEmail');
                setEmail('');
                setShowEmailPrompt(true);
              }}
              className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-all"
            >
              ← Use a different email
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Certificates;