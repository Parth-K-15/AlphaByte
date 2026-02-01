import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

const API_BASE = 'http://localhost:5000/api';

const QRScanner = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(localStorage.getItem('participantEmail') || '');
  const [inputEmail, setInputEmail] = useState('');
  const [eventId, setEventId] = useState(searchParams.get('eventId') || '');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [manualEventId, setManualEventId] = useState('');
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup camera on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setScanning(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setResult({
        success: false,
        message: 'Unable to access camera. Please use manual entry.',
        code: 'CAMERA_ERROR'
      });
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setScanning(false);
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (inputEmail) {
      localStorage.setItem('participantEmail', inputEmail);
      setEmail(inputEmail);
    }
  };

  const markAttendance = async (eventIdToMark) => {
    if (!email) {
      setResult({
        success: false,
        message: 'Please enter your email first',
        code: 'NO_EMAIL'
      });
      return;
    }

    if (!eventIdToMark) {
      setResult({
        success: false,
        message: 'Please enter or scan event ID',
        code: 'NO_EVENT'
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/participant/attendance/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: eventIdToMark,
          email: email
        })
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        stopScanning();
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      setResult({
        success: false,
        message: 'Failed to mark attendance. Please try again.',
        code: 'ERROR'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    markAttendance(manualEventId || eventId);
  };

  // If no email, show email input
  if (!email) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="text-6xl mb-4">📷</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">QR Attendance</h2>
          <p className="text-gray-500 mb-6">Enter your email to mark your attendance</p>
          
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <input
              type="email"
              value={inputEmail}
              onChange={(e) => setInputEmail(e.target.value)}
              placeholder="Enter your registered email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            />
            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-8 text-white text-center">
        <div className="text-5xl mb-4">📷</div>
        <h1 className="text-3xl font-bold mb-2">Mark Attendance</h1>
        <p className="text-green-100">Scan the event QR code or enter event ID</p>
        <p className="text-sm text-green-200 mt-2">📧 {email}</p>
      </div>

      {/* Result Display */}
      {result && (
        <div className={`rounded-xl p-6 text-center ${
          result.success 
            ? 'bg-green-100 border-2 border-green-500' 
            : 'bg-red-100 border-2 border-red-500'
        }`}>
          <div className="text-5xl mb-4">
            {result.success ? '✅' : 
             result.code === 'ALREADY_MARKED' ? '⚠️' :
             result.code === 'NOT_REGISTERED' ? '❌' : '⚠️'}
          </div>
          <h3 className={`text-xl font-semibold ${
            result.success ? 'text-green-800' : 'text-red-800'
          }`}>
            {result.success ? 'Attendance Marked!' : 
             result.code === 'ALREADY_MARKED' ? 'Already Marked' :
             'Attendance Failed'}
          </h3>
          <p className={result.success ? 'text-green-600' : 'text-red-600'}>
            {result.message}
          </p>
          {result.success && result.data && (
            <p className="text-green-700 text-sm mt-2">
              {result.data.participantName} • {new Date(result.data.scannedAt).toLocaleTimeString()}
            </p>
          )}
          {result.scannedAt && (
            <p className="text-yellow-700 text-sm mt-2">
              Scanned at: {new Date(result.scannedAt).toLocaleString()}
            </p>
          )}
          
          <button
            onClick={() => setResult(null)}
            className="mt-4 px-6 py-2 bg-white rounded-lg text-gray-700 hover:bg-gray-100"
          >
            {result.success ? 'Done' : 'Try Again'}
          </button>
        </div>
      )}

      {/* Scanner Section */}
      {!result && (
        <>
          {/* Camera Scanner */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">📷 Scan QR Code</h3>
              <p className="text-sm text-gray-500">Point your camera at the event QR code</p>
            </div>
            
            <div className="relative aspect-square bg-gray-900">
              {scanning ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {/* QR Frame Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-64 h-64 border-2 border-white rounded-lg">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500"></div>
                    </div>
                  </div>
                  <button
                    onClick={stopScanning}
                    className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-2 bg-red-600 text-white rounded-lg"
                  >
                    Stop Scanning
                  </button>
                </>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <button
                    onClick={startScanning}
                    className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700"
                  >
                    📷 Start Camera
                  </button>
                </div>
              )}
            </div>
            
            <p className="p-4 text-center text-sm text-gray-500">
              Note: QR scanning uses camera. Make sure to allow camera access.
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="text-gray-500 text-sm">OR</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          {/* Manual Entry */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-4">✏️ Enter Event ID Manually</h3>
            
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <input
                type="text"
                value={manualEventId || eventId}
                onChange={(e) => setManualEventId(e.target.value)}
                placeholder="Enter Event ID"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-green-400"
              >
                {loading ? 'Marking Attendance...' : 'Mark Attendance'}
              </button>
            </form>
          </div>
        </>
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
    </div>
  );
};

export default QRScanner;
