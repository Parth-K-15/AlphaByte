import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { QrCode, X, CheckCircle, Camera } from 'lucide-react';
import jsQR from 'jsqr';

const API_BASE = 'http://localhost:5000/api';

const MyRegistrations = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState(localStorage.getItem('participantEmail') || '');
  const [inputEmail, setInputEmail] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showScanModal, setShowScanModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [markingAttendance, setMarkingAttendance] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const scanIntervalRef = useRef(null);

  useEffect(() => {
    if (email) {
      fetchRegistrations();
    } else {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    return () => {
      // Cleanup camera on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE}/participant/my-events?email=${encodeURIComponent(email)}`
      );
      const data = await response.json();
      
      if (data.success) {
        setRegistrations(data.data);
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
      setMessage({ type: 'error', text: 'Failed to load registrations' });
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

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white',
      CONFIRMED: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
      CANCELLED: 'bg-gradient-to-r from-red-500 to-pink-500 text-white',
    };
    return badges[status] || 'bg-gradient-to-r from-gray-400 to-gray-500 text-white';
  };

  const getAttendanceBadge = (status) => {
    const badges = {
      PENDING: 'bg-gradient-to-r from-gray-400 to-gray-500 text-white',
      ATTENDED: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
      ABSENT: 'bg-gradient-to-r from-red-500 to-pink-500 text-white',
    };
    return badges[status] || 'bg-gradient-to-r from-gray-400 to-gray-500 text-white';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBA';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleOpenScanner = (event) => {
    setSelectedEvent(event);
    setShowScanModal(true);
    setScannedData(null);
  };

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          scanQRCode();
        };
      }
      setScanning(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setMessage({ type: 'error', text: 'Unable to access camera. Please allow camera permissions.' });
    }
  };

  const scanQRCode = () => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    scanIntervalRef.current = setInterval(() => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          handleQRCodeScanned(code.data);
          clearInterval(scanIntervalRef.current);
          stopScanning();
        }
      }
    }, 300); // Scan every 300ms
  };

  const handleQRCodeScanned = async (qrData) => {
    try {
      const parsedData = JSON.parse(qrData);
      
      // Check if it's a valid attendance QR code
      if (parsedData.eventId || parsedData.qrData) {
        await markAttendanceFromQR(parsedData);
      } else {
        setScannedData({ success: false, message: 'Invalid QR code format' });
      }
    } catch (error) {
      // If not JSON, try using as session ID directly
      await markAttendanceFromQR({ sessionId: qrData, eventId: selectedEvent._id });
    }
  };

  const markAttendanceFromQR = async (qrCodeData) => {
    setMarkingAttendance(true);
    try {
      const response = await fetch(`${API_BASE}/participant/attendance/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: qrCodeData.eventId || selectedEvent._id,
          email: email,
          qrData: qrCodeData.qrData || qrCodeData.sessionId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setScannedData({ success: true, message: 'Attendance marked successfully!' });
        setMessage({ type: 'success', text: 'Attendance marked successfully!' });
        fetchRegistrations();
        setTimeout(() => handleCloseScanner(), 2000);
      } else {
        setScannedData({ success: false, message: data.message || 'Failed to mark attendance' });
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      setScannedData({ success: false, message: 'Failed to mark attendance' });
    } finally {
      setMarkingAttendance(false);
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    setScanning(false);
  };

  const handleCloseScanner = () => {
    stopScanning();
    setShowScanModal(false);
    setSelectedEvent(null);
    setScannedData(null);
  };

  const handleManualEntry = async (sessionId) => {
    if (!sessionId || !selectedEvent) return;
    
    setMarkingAttendance(true);
    try {
      const response = await fetch(`${API_BASE}/organizer/attendance/mark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedEvent._id,
          sessionId: sessionId,
          participantId: email, // Using email as identifier
          organizerId: 'self'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: 'Attendance marked successfully!' });
        setScannedData({ success: true, message: 'Attendance marked!' });
        fetchRegistrations();
        setTimeout(() => handleCloseScanner(), 2000);
      } else {
        setScannedData({ success: false, message: data.message || 'Failed to mark attendance' });
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      setScannedData({ success: false, message: 'Failed to mark attendance' });
    } finally {
      setMarkingAttendance(false);
    }
  };

  // If no email, show email input form
  if (!email) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="text-6xl mb-4">🎟️</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">My Registrations</h2>
          <p className="text-gray-500 mb-6">Enter your email to view your registered events</p>
          
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <input
              type="email"
              value={inputEmail}
              onChange={(e) => setInputEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              View Registrations
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
      <div className="bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
        <h1 className="text-4xl font-black mb-3">My Registrations</h1>
        <p className="text-cyan-50 text-lg">Track your event registrations and attendance status</p>
        <div className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
          <Mail size={18} />
          <span className="font-semibold">{email}</span>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-5 rounded-xl font-semibold backdrop-blur-lg border-2 ${
          message.type === 'success' 
            ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200' 
            : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Registrations List */}
      {registrations.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-12 text-center border border-white/20">
          <div className="w-24 h-24 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <div className="text-5xl">📭</div>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">No Registrations Yet</h3>
          <p className="text-gray-600 mb-8 text-lg">You haven't registered for any events yet.</p>
          <Link
            to="/participant"
            className="inline-block px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-bold hover:from-cyan-700 hover:to-blue-700 transition-all duration-300 hover:scale-105"
          >
            Browse Events →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {registrations.map((reg) => (
            <div
              key={reg._id}
              className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-white/20"
            >
              <div className="flex flex-col md:flex-row">
                {/* Event Image */}
                <div className="w-full md:w-56 h-40 md:h-auto bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 relative overflow-hidden">
                  {reg.event?.bannerImage && (
                    <img
                      src={reg.event.bannerImage}
                      alt={reg.event?.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>

                {/* Event Info */}
                <div className="flex-1 p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-xl text-gray-900 mb-2">
                        {reg.event?.title || 'Event Deleted'}
                      </h3>
                      <p className="text-gray-600 text-sm flex items-center gap-2">
                        <span>📅 {formatDate(reg.event?.startDate)}</span>
                        {reg.event?.venue && <span>• 📍 {reg.event.venue}</span>}
                      </p>
                    </div>
                    
                    {/* Event Status */}
                    {reg.event?.status && (
                      <span className={`self-start px-4 py-2 rounded-xl text-xs font-bold capitalize shadow-sm ${
                        reg.event.status === 'upcoming' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' :
                        reg.event.status === 'ongoing' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' :
                        'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                      }`}>
                        {reg.event.status}
                      </span>
                    )}
                  </div>

                  {/* Status Badges */}
                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm ${getStatusBadge(reg.registrationStatus)}`}>
                      Registration: {reg.registrationStatus}
                    </span>
                    <span className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm ${getAttendanceBadge(reg.attendanceStatus)}`}>
                      Attendance: {reg.attendanceStatus}
                    </span>
                    {reg.certificate && (
                      <span className="px-4 py-2 rounded-xl text-xs font-bold shadow-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                        🏆 Certificate: {reg.certificate.status}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-5 flex flex-wrap gap-3">
                    {reg.event && (
                      <Link
                        to={`/participant/event/${reg.event._id}`}
                        className="px-5 py-3 text-sm font-bold bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-700 hover:from-cyan-100 hover:to-blue-100 rounded-xl transition-all duration-300 hover:scale-105 border border-cyan-200"
                      >
                        View Event →
                      </Link>
                    )}
                    {reg.attendanceStatus !== 'ATTENDED' && reg.event && (
                      <button
                        onClick={() => handleOpenScanner(reg.event)}
                        className="px-5 py-3 text-sm bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 flex items-center gap-2 font-bold transition-all duration-300 hover:scale-105 shadow-md"
                      >
                        <Camera size={18} />
                        Scan QR Code
                      </button>
                    )}
                    {reg.attendanceStatus === 'ATTENDED' && (
                      <span className="px-5 py-3 text-sm bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-xl flex items-center gap-2 font-bold border-2 border-green-200">
                        <CheckCircle size={18} />
                        Attendance Marked
                      </span>
                    )}
                    {reg.certificate && reg.certificate.certificateUrl && (
                      <Link
                        to={`/participant/certificates`}
                        className="px-5 py-3 text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 font-bold transition-all duration-300 hover:scale-105 shadow-md"
                      >
                        📜 View Certificate
                      </Link>
                    )}
                  </div>
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
          className="text-sm font-semibold text-cyan-600 hover:text-cyan-800 hover:underline transition-all"
        >
          ← Use a different email
        </button>
      </div>

      {/* QR Scanner Modal */}
      {showScanModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl max-w-lg w-full p-8 relative shadow-2xl border border-white/20">
            {/* Close Button */}
            <button
              onClick={handleCloseScanner}
              className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-xl z-10 transition-all duration-300 hover:scale-110"
            >
              <X size={22} className="text-gray-600" />
            </button>

            {/* Modal Content */}
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Camera size={32} className="text-white" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">{selectedEvent.title}</h3>
                <p className="text-gray-600 font-medium">Scan the organizer's QR code</p>
              </div>

              {/* Result Display */}
              {scannedData && (
                <div className={`mb-6 p-6 rounded-2xl shadow-lg ${
                  scannedData.success 
                    ? 'bg-gradient-to-br from-green-100 to-emerald-100 text-green-800 border-2 border-green-200' 
                    : 'bg-gradient-to-br from-red-100 to-pink-100 text-red-800 border-2 border-red-200'
                }`}>
                  <div className="text-5xl mb-3">{scannedData.success ? '✅' : '❌'}</div>
                  <p className="font-bold text-lg">{scannedData.message}</p>
                </div>
              )}

              {!scannedData && (
                <>
                  {/* Camera Scanner */}
                  <div className="relative aspect-square bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden mb-6 shadow-2xl">
                    {scanning ? (
                      <>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover"
                        />
                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                        {/* QR Frame Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-64 h-64 border-2 border-white/80 rounded-2xl relative animate-pulse">
                            <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-cyan-400 rounded-tl-xl"></div>
                            <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-cyan-400 rounded-tr-xl"></div>
                            <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-cyan-400 rounded-bl-xl"></div>
                            <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-cyan-400 rounded-br-xl"></div>
                          </div>
                        </div>
                        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-center">
                          <p className="text-white text-sm font-bold mb-3 bg-black/60 backdrop-blur-sm px-6 py-3 rounded-xl">
                            🔍 Scanning for QR code...
                          </p>
                          <button
                            onClick={stopScanning}
                            className="px-8 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl font-bold hover:from-red-700 hover:to-pink-700 transition-all duration-300 hover:scale-105 shadow-lg"
                          >
                            Stop Camera
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <button
                          onClick={startScanning}
                          className="px-10 py-5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-2xl font-bold hover:from-cyan-700 hover:to-blue-700 flex items-center gap-3 transition-all duration-300 hover:scale-105 shadow-xl"
                        >
                          <Camera size={24} />
                          Start Camera
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Manual Entry Option */}
                  <div className="border-t-2 border-gray-200 pt-6">
                    <p className="text-sm text-gray-700 font-semibold mb-4">🔢 Or enter session ID manually:</p>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const sessionId = e.target.sessionId.value;
                      handleManualEntry(sessionId);
                    }} className="flex gap-3">
                      <input
                        type="text"
                        name="sessionId"
                        placeholder="Enter session ID"
                        className="flex-1 px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-medium transition-all"
                        required
                      />
                      <button
                        type="submit"
                        disabled={markingAttendance}
                        className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-bold hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50 transition-all duration-300 hover:scale-105 shadow-lg"
                      >
                        {markingAttendance ? 'Marking...' : 'Submit'}
                      </button>
                    </form>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRegistrations;
