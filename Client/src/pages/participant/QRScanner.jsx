import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import jsQR from 'jsqr';
import {
  Camera,
  CameraOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Scan,
  Zap,
  ArrowLeft,
  Clock,
  Loader2,
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const QRScanner = () => {
  const navigate = useNavigate();

  // State
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [lastScannedData, setLastScannedData] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [scanCount, setScanCount] = useState(0);

  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  const processingRef = useRef(false);

  // Fetch participant profile to get email
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setProfileLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE}/participant/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();

        if (data.success && data.data?.email) {
          setUserEmail(data.data.email);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();

    return () => {
      stopCamera();
    };
  }, []);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  }, []);

  // Start camera and begin scanning
  const startScanning = async () => {
    try {
      setCameraError(null);
      setResult(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        }
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', true);
        await videoRef.current.play();
        setScanning(true);
        scanFrame();
      }
    } catch (error) {
      console.error('Camera error:', error);
      if (error.name === 'NotAllowedError') {
        setCameraError('Camera access denied. Please allow camera access in your browser settings.');
      } else if (error.name === 'NotFoundError') {
        setCameraError('No camera found on this device.');
      } else {
        setCameraError('Unable to access camera. Please try again.');
      }
    }
  };

  // Scan each video frame for QR codes
  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current || !streamRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data && !processingRef.current) {
        // QR code detected
        processingRef.current = true;
        handleQRDetected(code.data);
        return;
      }
    }

    animationRef.current = requestAnimationFrame(scanFrame);
  };

  // Handle detected QR code
  const handleQRDetected = async (rawData) => {
    // Prevent duplicate scans of same data
    if (rawData === lastScannedData && result?.success) {
      processingRef.current = false;
      animationRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    setLastScannedData(rawData);
    setScanCount(prev => prev + 1);

    // Parse QR data
    let qrPayload;
    try {
      qrPayload = JSON.parse(rawData);
    } catch {
      // Not valid JSON - treat as plain eventId
      qrPayload = { eventId: rawData };
    }

    const eventId = qrPayload.eventId;
    const sessionId = qrPayload.sessionId || null;

    if (!eventId) {
      setResult({
        success: false,
        message: 'Invalid QR code. Please scan the QR code displayed by the event organizer.',
        code: 'INVALID_QR'
      });
      processingRef.current = false;
      stopCamera();
      return;
    }

    // Check if session has expired on client side
    if (qrPayload.expiresAt && Date.now() > qrPayload.expiresAt) {
      setResult({
        success: false,
        message: 'This QR code has expired. Please ask the organizer to generate a new one.',
        code: 'EXPIRED_QR'
      });
      processingRef.current = false;
      stopCamera();
      return;
    }

    // Mark attendance via API
    await markAttendance(eventId, sessionId);
  };

  // Call backend to mark attendance
  const markAttendance = async (eventId, sessionId) => {
    if (!userEmail) {
      setResult({
        success: false,
        message: 'Unable to identify your account. Please log in again.',
        code: 'NO_EMAIL'
      });
      processingRef.current = false;
      stopCamera();
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE}/participant/attendance/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          eventId,
          email: userEmail,
          sessionId,
        })
      });

      const data = await response.json();
      setResult(data);
      stopCamera();
    } catch (error) {
      console.error('Error marking attendance:', error);
      setResult({
        success: false,
        message: 'Network error. Please check your internet connection and try again.',
        code: 'NETWORK_ERROR'
      });
      stopCamera();
    } finally {
      setLoading(false);
      processingRef.current = false;
    }
  };

  // Reset scanner
  const resetScanner = () => {
    setResult(null);
    setLastScannedData(null);
    setCameraError(null);
    processingRef.current = false;
  };

  // Get icon/color config for result display
  const getResultConfig = () => {
    if (!result) return null;

    if (result.success) {
      return {
        icon: CheckCircle,
        bgColor: 'from-emerald-500 to-green-600',
        borderColor: 'border-emerald-200',
        bgLight: 'from-emerald-50 to-green-50',
        textColor: 'text-emerald-800',
        subColor: 'text-emerald-600',
        title: 'Attendance Marked!',
      };
    }

    switch (result.code) {
      case 'ALREADY_MARKED':
        return {
          icon: AlertTriangle,
          bgColor: 'from-amber-500 to-yellow-600',
          borderColor: 'border-amber-200',
          bgLight: 'from-amber-50 to-yellow-50',
          textColor: 'text-amber-800',
          subColor: 'text-amber-600',
          title: 'Already Marked',
        };
      default:
        return {
          icon: XCircle,
          bgColor: 'from-red-500 to-rose-600',
          borderColor: 'border-red-200',
          bgLight: 'from-red-50 to-rose-50',
          textColor: 'text-red-800',
          subColor: 'text-red-600',
          title: 'Scan Failed',
        };
    }
  };

  // Loading state while fetching profile
  if (profileLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Loading scanner...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/20 p-4 md:p-6">
      <div className="max-w-lg mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Scan QR Code</h1>
            <p className="text-sm text-gray-500">Scan the QR code shown by the event organizer</p>
          </div>
        </div>

        {/* User Info Card */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Scan size={24} />
            </div>
            <div>
              <p className="font-semibold">QR Attendance Scanner</p>
              <p className="text-blue-100 text-sm">{userEmail || 'Not logged in'}</p>
            </div>
          </div>
          {scanCount > 0 && (
            <div className="mt-3 flex items-center gap-2 text-blue-100 text-xs">
              <Zap size={14} />
              <span>{scanCount} scan{scanCount !== 1 ? 's' : ''} this session</span>
            </div>
          )}
        </div>

        {/* Result Display */}
        {result && (() => {
          const config = getResultConfig();
          const ResultIcon = config.icon;

          return (
            <div className={`bg-gradient-to-br ${config.bgLight} rounded-2xl border ${config.borderColor} overflow-hidden shadow-sm`}>
              {/* Result Header */}
              <div className={`bg-gradient-to-r ${config.bgColor} p-6 text-center text-white`}>
                <ResultIcon size={48} className="mx-auto mb-3" strokeWidth={2} />
                <h3 className="text-xl font-bold">{config.title}</h3>
              </div>

              {/* Result Body */}
              <div className="p-6 text-center">
                <p className={`${config.subColor} font-medium mb-4`}>
                  {result.message}
                </p>

                {result.success && result.data && (
                  <div className="bg-white rounded-xl p-4 mb-4 space-y-2 text-sm shadow-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Name</span>
                      <span className="font-semibold text-gray-800">{result.data.participantName}</span>
                    </div>
                    {result.data.eventTitle && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Event</span>
                        <span className="font-semibold text-gray-800">{result.data.eventTitle}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Time</span>
                      <span className="font-semibold text-gray-800">
                        {new Date(result.data.scannedAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                )}

                {result.code === 'ALREADY_MARKED' && result.scannedAt && (
                  <div className="bg-white rounded-xl p-4 mb-4 text-sm shadow-sm">
                    <div className="flex items-center justify-center gap-2 text-amber-600">
                      <Clock size={16} />
                      <span>Previously scanned at {new Date(result.scannedAt).toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => {
                      resetScanner();
                      startScanning();
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-[1.02]"
                  >
                    <RotateCcw size={18} />
                    Scan Again
                  </button>
                  <button
                    onClick={() => navigate('/participant')}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                  >
                    Go Home
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Camera Error */}
        {cameraError && !result && (
          <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-2xl p-6 text-center">
            <CameraOff size={48} className="mx-auto mb-3 text-red-400" />
            <h3 className="text-lg font-bold text-red-800 mb-2">Camera Error</h3>
            <p className="text-red-600 text-sm mb-4">{cameraError}</p>
            <button
              onClick={() => {
                setCameraError(null);
                startScanning();
              }}
              className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Scanner Section */}
        {!result && !cameraError && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Camera View — video always in DOM so ref is available */}
            <div className="relative aspect-square bg-gray-900">
              {/* Video element — always mounted, hidden when not scanning */}
              <video
                ref={videoRef}
                className={`w-full h-full object-cover ${scanning ? 'block' : 'hidden'}`}
                playsInline
                muted
              />

              {/* Scan overlay — only when camera is active */}
              {scanning && (
                <>
                  <div className="absolute inset-0 flex items-center justify-center">
                    {/* Dark overlay with transparent center */}
                    <div className="absolute inset-0 bg-black/40" style={{
                      maskImage: 'radial-gradient(ellipse 55% 55% at center, transparent 0%, black 100%)',
                      WebkitMaskImage: 'radial-gradient(ellipse 55% 55% at center, transparent 0%, black 100%)',
                    }} />

                    {/* Scan frame */}
                    <div className="w-64 h-64 relative">
                      {/* Corner brackets */}
                      <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-blue-400 rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-blue-400 rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-blue-400 rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-blue-400 rounded-br-lg" />

                      {/* Scanning line animation */}
                      <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-scanline" />
                    </div>
                  </div>

                  {/* Loading indicator during API call */}
                  {loading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                      <div className="bg-white rounded-2xl p-6 text-center shadow-xl">
                        <Loader2 size={36} className="animate-spin text-blue-600 mx-auto mb-3" />
                        <p className="text-gray-800 font-semibold">Marking attendance...</p>
                      </div>
                    </div>
                  )}

                  {/* Status bar */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-white text-sm">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span>Scanning for QR code...</span>
                      </div>
                      <button
                        onClick={stopCamera}
                        className="px-4 py-1.5 bg-white/20 backdrop-blur-sm text-white rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
                      >
                        Stop
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Placeholder — shown when camera is not active */}
              {!scanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl">
                    <Camera size={40} className="text-white" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">Ready to Scan</h3>
                  <p className="text-gray-400 text-sm mb-6 max-w-xs">
                    Point your camera at the QR code displayed by the event organizer to mark your attendance
                  </p>
                  <button
                    onClick={startScanning}
                    className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all hover:scale-105"
                  >
                    <Camera size={20} />
                    Open Camera
                  </button>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="p-5">
              <h4 className="font-semibold text-gray-800 mb-3">How it works</h4>
              <div className="space-y-3">
                {[
                  { step: '1', text: 'The event organizer will display a QR code on screen' },
                  { step: '2', text: 'Tap "Open Camera" and point your phone at the QR code' },
                  { step: '3', text: 'Your attendance is marked automatically after scanning' },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {item.step}
                    </div>
                    <p className="text-gray-600 text-sm">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Hidden canvas for QR processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* CSS for scan line animation */}
      <style>{`
        @keyframes scanlineMove {
          0%, 100% { top: 0; }
          50% { top: calc(100% - 2px); }
        }
        .animate-scanline {
          animation: scanlineMove 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default QRScanner;
