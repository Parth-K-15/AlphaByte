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
      GENERATED: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
      SENT: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
      DOWNLOADED: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
      FAILED: 'bg-gradient-to-r from-red-500 to-pink-500 text-white',
    };
    return badges[status] || 'bg-gradient-to-r from-gray-400 to-gray-500 text-white';
  };

  // If no email, show email input
  if (!email) {
    return (
      <div className="max-w-md mx-auto mt-12 px-4">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-10 text-center border border-white/20">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <div className="text-5xl">🏆</div>
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-3">My Certificates</h2>
          <p className="text-gray-600 mb-8 text-lg">Enter your email to view your certificates</p>
          
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <input
              type="email"
              value={inputEmail}
              onChange={(e) => setInputEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all font-medium"
              required
            />
            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-bold hover:from-amber-700 hover:to-orange-700 transition-all duration-300 hover:scale-[1.02] shadow-lg"
            >
              View Certificates →
            </button>
          </form>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-amber-600 absolute top-0 left-0"></div>
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
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-600 rounded-2xl p-8 text-white shadow-xl">
        <h1 className="text-4xl font-black mb-3">My Certificates 🏆</h1>
        <p className="text-amber-50 text-lg">Download and share your achievement certificates</p>
        <div className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
          <span className="text-sm font-semibold">📧 {email}</span>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-5 rounded-xl font-semibold backdrop-blur-lg border-2 ${
          message.type === 'success' ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200' :
          message.type === 'info' ? 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border-blue-200' :
          'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Certificates Grid */}
      {certificates.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg p-12 text-center border border-white/20">
          <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <div className="text-5xl">📜</div>
          </div>
          <h3 className="text-2xl font-black text-gray-800 mb-3">No Certificates Yet</h3>
          <p className="text-gray-600 mb-4 text-lg">Certificates are issued after:</p>
          <ul className="text-gray-700 font-medium space-y-2">
            <li>✓ You attend an event</li>
            <li>✓ The event is completed</li>
            <li>✓ The organizer generates certificates</li>
          </ul>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {certificates.map((cert) => (
            <div
              key={cert._id}
              className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-white/20"
            >
              {/* Certificate Preview */}
              <div className="h-48 bg-gradient-to-br from-amber-400 via-orange-500 to-yellow-500 relative flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="text-6xl mb-3 animate-pulse">🏆</div>
                  <p className="font-black text-lg">Certificate of Participation</p>
                </div>
                <div className="absolute top-4 right-4">
                  <span className={`px-4 py-2 rounded-xl text-xs font-bold shadow-lg ${getStatusBadge(cert.status)}`}>
                    {cert.status}
                  </span>
                </div>
              </div>

              {/* Certificate Info */}
              <div className="p-6">
                <h3 className="font-black text-xl text-gray-900 mb-4">
                  {cert.event?.title || 'Event'}
                </h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                    <span className="text-gray-600 font-semibold">Certificate ID</span>
                    <span className="font-mono text-xs bg-amber-100 text-amber-800 px-3 py-1 rounded-lg font-bold">
                      {cert.certificateId}
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                    <span className="text-gray-600 font-semibold">Issued</span>
                    <span className="font-bold text-gray-800">{formatDate(cert.issuedAt)}</span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                    <span className="text-gray-600 font-semibold">Recipient</span>
                    <span className="font-bold text-gray-800">{cert.participant?.fullName}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setSelectedCertificate(cert)}
                    className="flex-1 py-3 bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-700 hover:from-cyan-100 hover:to-blue-100 rounded-xl font-bold transition-all duration-300 hover:scale-105 border border-cyan-200"
                  >
                    👁️ View
                  </button>
                  <button
                    onClick={() => handleDownload(cert)}
                    className="flex-1 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-bold hover:from-amber-700 hover:to-orange-700 transition-all duration-300 hover:scale-105 shadow-lg"
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

      {/* Change Email */}
      <div className="text-center mt-8">
        <button
          onClick={() => {
            localStorage.removeItem('participantEmail');
            setEmail('');
            setInputEmail('');
          }}
          className="text-sm font-semibold text-amber-600 hover:text-amber-800 hover:underline transition-all"
        >
          ← Use a different email
        </button>
      </div>

      {/* Certificate Detail Modal */}
      {selectedCertificate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
            {/* Certificate Display */}
            <div className="bg-gradient-to-br from-amber-100 via-orange-100 to-yellow-100 p-10 text-center border-b-8 border-amber-500">
              <div className="border-8 border-amber-600 p-12 bg-white/90 backdrop-blur-sm shadow-2xl rounded-2xl">
                <div className="text-7xl mb-6 animate-pulse">🏆</div>
                <h2 className="text-4xl font-serif font-black text-amber-800 mb-4">
                  Certificate of Participation
                </h2>
                <p className="text-gray-700 mb-6 text-lg font-semibold">This is to certify that</p>
                <h3 className="text-3xl font-black text-gray-900 mb-6">
                  {selectedCertificate.participant?.fullName}
                </h3>
                <p className="text-gray-700 mb-6 text-lg font-semibold">has successfully participated in</p>
                <h4 className="text-2xl font-black bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-6">
                  {selectedCertificate.event?.title}
                </h4>
                <p className="text-gray-600 font-medium">
                  Held on {formatDate(selectedCertificate.event?.startDate)}
                  {selectedCertificate.event?.location && ` at ${selectedCertificate.event.location}`}
                </p>
                <div className="mt-8 pt-6 border-t-4 border-amber-300">
                  <p className="text-xs text-gray-600 font-bold">
                    Certificate ID: {selectedCertificate.certificateId}
                  </p>
                  <p className="text-xs text-gray-600 font-bold mt-1">
                    Issued on: {formatDate(selectedCertificate.issuedAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 flex justify-between">
              <button
                onClick={() => setSelectedCertificate(null)}
                className="px-8 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-bold transition-all duration-300 hover:scale-105"
              >
                Close
              </button>
              <button
                onClick={() => handleDownload(selectedCertificate)}
                className="px-8 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl hover:from-amber-700 hover:to-orange-700 font-bold transition-all duration-300 hover:scale-105 shadow-lg"
              >
                ⬇️ Download Certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Certificates;
