import { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api';

const Certificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState(localStorage.getItem('participantEmail') || '');
  const [inputEmail, setInputEmail] = useState('');
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (email) {
      fetchCertificates();
    } else {
      setLoading(false);
    }
  }, [email]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE}/participant/certificates?email=${encodeURIComponent(email)}`
      );
      const data = await response.json();
      
      if (data.success) {
        setCertificates(data.data);
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
      setMessage({ type: 'error', text: 'Failed to load certificates' });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (inputEmail) {
      localStorage.setItem('participantEmail', inputEmail);
      setEmail(inputEmail);
    }
  };

  const handleDownload = async (certificate) => {
    try {
      // Record download
      await fetch(
        `${API_BASE}/participant/certificates/${certificate.certificateId}/download`,
        { method: 'PUT' }
      );
      
      // If there's a certificate URL, open it
      if (certificate.certificateUrl) {
        window.open(certificate.certificateUrl, '_blank');
      } else {
        setMessage({ type: 'info', text: 'Certificate will be available for download soon.' });
      }
    } catch (error) {
      console.error('Error downloading certificate:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      GENERATED: 'bg-blue-100 text-blue-800',
      SENT: 'bg-green-100 text-green-800',
      DOWNLOADED: 'bg-purple-100 text-purple-800',
      FAILED: 'bg-red-100 text-red-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  // If no email, show email input
  if (!email) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">My Certificates</h2>
          <p className="text-gray-500 mb-6">Enter your email to view your certificates</p>
          
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <input
              type="email"
              value={inputEmail}
              onChange={(e) => setInputEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            />
            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
            >
              View Certificates
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">My Certificates 🏆</h1>
        <p className="text-yellow-100">Download and share your achievement certificates</p>
        <p className="text-sm text-yellow-200 mt-2">📧 {email}</p>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-800' :
          message.type === 'info' ? 'bg-blue-100 text-blue-800' :
          'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Certificates Grid */}
      {certificates.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-6xl mb-4">📜</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Certificates Yet</h3>
          <p className="text-gray-500 mb-2">Certificates are issued after:</p>
          <ul className="text-gray-500 text-sm space-y-1">
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
              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Certificate Preview */}
              <div className="h-40 bg-gradient-to-br from-amber-400 to-orange-500 relative flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="text-5xl mb-2">🏆</div>
                  <p className="font-semibold">Certificate of Participation</p>
                </div>
                <div className="absolute top-3 right-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(cert.status)}`}>
                    {cert.status}
                  </span>
                </div>
              </div>

              {/* Certificate Info */}
              <div className="p-4">
                <h3 className="font-semibold text-lg text-gray-800 mb-2">
                  {cert.event?.title || 'Event'}
                </h3>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>Certificate ID</span>
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                      {cert.certificateId}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Issued</span>
                    <span>{formatDate(cert.issuedAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Recipient</span>
                    <span>{cert.participant?.fullName}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setSelectedCertificate(cert)}
                    className="flex-1 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg text-sm font-medium"
                  >
                    👁️ View
                  </button>
                  <button
                    onClick={() => handleDownload(cert)}
                    className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                  >
                    ⬇️ Download
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Change Email */}
      <div className="text-center">
        <button
          onClick={() => {
            localStorage.removeItem('participantEmail');
            setEmail('');
            setInputEmail('');
          }}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Use a different email
        </button>
      </div>

      {/* Certificate Detail Modal */}
      {selectedCertificate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Certificate Display */}
            <div className="bg-gradient-to-br from-amber-100 to-orange-100 p-8 text-center border-b-4 border-amber-500">
              <div className="border-4 border-amber-600 p-8 bg-white/80">
                <div className="text-6xl mb-4">🏆</div>
                <h2 className="text-3xl font-serif font-bold text-amber-800 mb-2">
                  Certificate of Participation
                </h2>
                <p className="text-gray-600 mb-4">This is to certify that</p>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  {selectedCertificate.participant?.fullName}
                </h3>
                <p className="text-gray-600 mb-4">has successfully participated in</p>
                <h4 className="text-xl font-semibold text-indigo-700 mb-4">
                  {selectedCertificate.event?.title}
                </h4>
                <p className="text-gray-500 text-sm">
                  Held on {formatDate(selectedCertificate.event?.startDate)}
                  {selectedCertificate.event?.location && ` at ${selectedCertificate.event.location}`}
                </p>
                <div className="mt-6 pt-4 border-t border-amber-300">
                  <p className="text-xs text-gray-500">
                    Certificate ID: {selectedCertificate.certificateId}
                  </p>
                  <p className="text-xs text-gray-500">
                    Issued on: {formatDate(selectedCertificate.issuedAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 flex justify-between">
              <button
                onClick={() => setSelectedCertificate(null)}
                className="px-6 py-2 text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
              <button
                onClick={() => handleDownload(selectedCertificate)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
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
