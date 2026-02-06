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
    const config = {
      GENERATED: { color: 'bg-green-100 text-green-700', icon: CheckCircle, text: 'Available' },
      SENT: { color: 'bg-blue-100 text-blue-700', icon: CheckCircle, text: 'Available' }
    };
    const { color, icon: Icon, text } = config[status] || { color: 'bg-green-100 text-green-700', icon: CheckCircle, text: 'Available' };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${color}`}>
        <Icon size={12} />
        {text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading certificates...</p>
        </div>
      </div>
    );
  }

  if (showEmailPrompt) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-6">
            <Award size={48} className="mx-auto text-indigo-600 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800">Enter Your Email</h2>
            <p className="text-gray-500 mt-2">
              Please enter the email you used to register for events
            </p>
          </div>
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">My Certificates</h1>
        <p className="text-gray-500 mt-1">View and download your event certificates</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Certificates</p>
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
              <p className="text-sm text-gray-500">Attended Events</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.attended}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <CheckCircle size={20} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Registered Events</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.registered}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <Calendar size={20} className="text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Attended Events - Awaiting Certificate Generation */}
      {attendedEvents.length > 0 ? (
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl shadow-md border-2 border-yellow-300 p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-3 bg-yellow-500 rounded-xl">
              <AlertCircle size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-1">
                ⏳ Certificates Being Processed
              </h2>
              <p className="text-sm text-gray-600">
                You attended these completed events. Certificates will appear below once the organizer generates them.
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            {attendedEvents.map((event) => (
              <div key={event._id} className="bg-white rounded-xl p-4 border-2 border-yellow-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle size={18} className="text-green-600" />
                      <p className="font-semibold text-gray-800">{event.title || event.name}</p>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        Attended ({event.attendanceType})
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        Event Completed
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 ml-6">
                      Event Date: {formatDate(event.startDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-yellow-600">
                    <Clock size={18} />
                    <span className="text-sm font-medium">Pending Generation</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 rounded-2xl shadow-sm border border-blue-200 p-6">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <AlertCircle size={24} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                No Completed Events Awaiting Certificates
              </h3>
              <p className="text-sm text-gray-600">
                Certificates will appear here after you attend an event, the event is marked as "completed", and the organizer generates certificates.
              </p>
              <div className="mt-3 text-xs text-gray-500 space-y-1">
                <p>✓ You are currently registered for <strong>{stats.registered}</strong> event{stats.registered !== 1 ? 's' : ''}</p>
                <p>• Attend events and have your attendance marked (QR scan or manual)</p>
                <p>• Wait for the event to be marked as "completed" by organizers</p>
                <p>• Organizer will generate and distribute certificates</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* My Certificates */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          My Certificates
        </h2>
        
        {certificates.length === 0 ? (
          <div className="text-center py-12">
            <Award size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">No Certificates Yet</h3>
            <p className="text-gray-500">
              Certificates will appear here once the organizer processes your request
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {certificates.map((cert) => (
              <div
                key={cert._id}
                className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Certificate Header */}
                <div className="h-32 bg-gradient-to-br from-blue-500 to-purple-600 relative flex items-center justify-center">
                  <div className="text-center text-white">
                    <Award size={40} className="mx-auto mb-2" />
                    <p className="font-semibold text-sm">{cert.achievement || 'Participation'}</p>
                  </div>
                  <div className="absolute top-2 right-2">
                    {getStatusBadge(cert.status)}
                  </div>
                </div>

                {/* Certificate Details */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    {cert.event?.title || cert.event?.name}
                  </h3>
                  
                  <div className="space-y-1 text-xs text-gray-600 mb-4">
                    <div className="flex justify-between">
                      <span>Certificate ID:</span>
                      <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                        {cert.certificateId}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Issued:</span>
                      <span>{formatDate(cert.issuedAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => handleDownload(cert)}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Download size={16} />
                    Download Certificate
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Certificates;
