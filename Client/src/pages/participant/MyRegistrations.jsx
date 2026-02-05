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
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getAttendanceBadge = (status) => {
    const badges = {
      PENDING: 'bg-gray-100 text-gray-800',
      ATTENDED: 'bg-green-100 text-green-800',
      ABSENT: 'bg-red-100 text-red-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
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
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">My Registrations</h1>
        <p className="text-purple-100">Track your event registrations and attendance status</p>
        <p className="text-sm text-purple-200 mt-2">📧 {email}</p>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Registrations List */}
      {registrations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Registrations Yet</h3>
          <p className="text-gray-500 mb-6">You haven't registered for any events yet.</p>
          <Link
            to="/participant"
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
          >
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {registrations.map((reg) => (
            <div
              key={reg._id}
              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row">
                {/* Event Image */}
                <div className="w-full md:w-48 h-32 md:h-auto bg-gradient-to-br from-indigo-500 to-purple-600">
                  {reg.event?.bannerImage && (
                    <img
                      src={reg.event.bannerImage}
                      alt={reg.event?.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* Event Info */}
                <div className="flex-1 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-800">
                        {reg.event?.title || 'Event Deleted'}
                      </h3>
                      <p className="text-gray-500 text-sm">
                        📅 {formatDate(reg.event?.startDate)}
                        {reg.event?.venue && ` • 📍 ${reg.event.venue}`}
                      </p>
                    </div>
                    
                    {/* Event Status */}
                    {reg.event?.status && (
                      <span className={`self-start px-3 py-1 rounded-full text-xs font-medium capitalize ${
                        reg.event.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                        reg.event.status === 'ongoing' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {reg.event.status}
                      </span>
                    )}
                  </div>

                  {/* Status Badges */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(reg.registrationStatus)}`}>
                      Registration: {reg.registrationStatus}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getAttendanceBadge(reg.attendanceStatus)}`}>
                      Attendance: {reg.attendanceStatus}
                    </span>
                    {reg.certificate && (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        🏆 Certificate: {reg.certificate.status}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {reg.event && (
                      <Link
                        to={`/participant/event/${reg.event._id}`}
                        className="px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg"
                      >
                        View Event →
                      </Link>
                    )}
                    {reg.attendanceStatus !== 'ATTENDED' && reg.event && (
                      <button
                        onClick={() => handleOpenScanner(reg.event)}
                        className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1"
                      >
                        <Camera size={16} />
                        Scan QR Code
                      </button>
                    )}
                    {reg.attendanceStatus === 'ATTENDED' && (
                      <span className="px-4 py-2 text-sm bg-green-100 text-green-700 rounded-lg flex items-center gap-1">
                        <CheckCircle size={16} />
                        Attendance Marked
                      </span>
                    )}
                    {reg.certificate && reg.certificate.certificateUrl && (
                      <Link
                        to={`/participant/certificates`}
                        className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
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

      {/* QR Scanner Modal */}
      {showScanModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 relative">
            {/* Close Button */}
            <button
              onClick={handleCloseScanner}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg z-10"
            >
              <X size={20} className="text-gray-500" />
            </button>

            {/* Modal Content */}
            <div className="text-center">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-800">{selectedEvent.title}</h3>
                <p className="text-sm text-gray-500 mt-1">Scan the organizer's QR code</p>
              </div>

              {/* Result Display */}
              {scannedData && (
                <div className={`mb-4 p-4 rounded-lg ${
                  scannedData.success 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  <div className="text-3xl mb-2">{scannedData.success ? '✅' : '❌'}</div>
                  <p className="font-medium">{scannedData.message}</p>
                </div>
              )}

              {!scannedData && (
                <>
                  {/* Camera Scanner */}
                  <div className="relative aspect-square bg-gray-900 rounded-xl overflow-hidden mb-4">
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
                          <div className="w-64 h-64 border-2 border-white rounded-lg relative">
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500"></div>
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500"></div>
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500"></div>
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500"></div>
                          </div>
                        </div>
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center">
                          <p className="text-white text-sm mb-2 bg-black bg-opacity-50 px-4 py-2 rounded-lg">
                            Scanning for QR code...
                          </p>
                          <button
                            onClick={stopScanning}
                            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                          >
                            Stop Camera
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <button
                          onClick={startScanning}
                          className="px-8 py-4 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 flex items-center gap-2"
                        >
                          <Camera size={20} />
                          Start Camera
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Manual Entry Option */}
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-sm text-gray-600 mb-3">Or enter session ID manually:</p>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const sessionId = e.target.sessionId.value;
                      handleManualEntry(sessionId);
                    }} className="flex gap-2">
                      <input
                        type="text"
                        name="sessionId"
                        placeholder="Enter session ID"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        required
                      />
                      <button
                        type="submit"
                        disabled={markingAttendance}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400"
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
