import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  ShieldCheck,
  Upload,
  X,
  AlertTriangle,
  QrCode,
} from 'lucide-react';
import jsQR from 'jsqr';

const QRScannerVerify = () => {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [manualId, setManualId] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const fileInputRef = useRef(null);

  // Keep navigate ref in sync
  const navigateRef = useRef(navigate);
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const processQRDataRef = useRef();
  useEffect(() => {
    processQRDataRef.current = (data) => {
      stopCamera();
      // Try to extract verificationId from a full URL
      try {
        const url = new URL(data);
        const parts = url.pathname.split('/verify/');
        if (parts.length > 1 && parts[1]) {
          navigateRef.current(`/verify/${parts[1]}`);
          return;
        }
      } catch {
        // Not a URL
      }
      // Check if raw hex verification id format
      if (/^[a-f0-9]+-[a-f0-9]+-[a-f0-9]+$/i.test(data.trim())) {
        navigateRef.current(`/verify/${data.trim()}`);
        return;
      }
      setError('Invalid QR code. This does not appear to be a Planix certificate QR.');
      setTimeout(() => setError(''), 3000);
    };
  });

  // Attach stream to video element once scanning is true and <video> is mounted
  useEffect(() => {
    if (scanning && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play();
        // Inline QR detection to avoid dependency issues
        if (!canvasRef.current || !videoRef.current) return;
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        scanIntervalRef.current = setInterval(() => {
          if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            if (code) {
              processQRDataRef.current(code.data);
            }
          }
        }, 250);
      };
    }
  }, [scanning]);

  const startScanning = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setScanning(true);
    } catch {
      setError('Unable to access camera. Please allow camera permissions.');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
          processQRDataRef.current(code.data);
        } else {
          setError('No QR code found in the uploaded image.');
          setTimeout(() => setError(''), 3000);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleManualVerify = () => {
    const id = manualId.trim();
    if (!id) return;
    navigate(`/verify/${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1015] p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 md:p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 shadow-lg">
              <ShieldCheck className="w-7 h-7 md:w-8 md:h-8 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
                Certificate Verification
              </h1>
              <p className="text-sm md:text-base text-gray-600 dark:text-zinc-400 mt-1">
                Scan or upload QR code to verify certificate authenticity
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scanner Card */}
          <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none overflow-hidden">
            <div className="p-5 border-b border-gray-200 dark:border-white/5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Camera Scanner
              </h2>
              <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
                Use your device camera to scan QR code
              </p>
            </div>
            
            <div className="p-5">
              {scanning ? (
                <div className="relative rounded-xl overflow-hidden bg-black">
                  <video
                    ref={videoRef}
                    className="w-full aspect-square object-cover"
                    autoPlay
                    playsInline
                    muted
                  />
                  {/* Scan overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 md:w-56 md:h-56 relative">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-xl" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-xl" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-xl" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-xl" />
                      <div className="absolute left-4 right-4 h-1 bg-blue-500/80 animate-pulse" style={{ top: '50%' }} />
                    </div>
                  </div>
                  {/* Stop button */}
                  <button
                    onClick={stopCamera}
                    className="absolute top-3 right-3 p-2.5 bg-red-600 hover:bg-red-700 rounded-full text-white transition-colors shadow-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-4 left-0 right-0 text-center">
                    <span className="inline-block bg-black/80 text-white text-xs font-medium px-4 py-2 rounded-full">
                      Position QR code in frame
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <QrCode className="w-10 h-10 md:w-12 md:h-12 text-blue-600 dark:text-blue-400" strokeWidth={2} />
                  </div>
                  <button
                    onClick={startScanning}
                    className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-600 dark:to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <Camera className="w-5 h-5" />
                    Start Camera Scan
                  </button>
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          </div>

          {/* Alternative Methods Card */}
          <div className="space-y-6">
            {/* Upload Image Card */}
            <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none">
              <div className="p-5 border-b border-gray-200 dark:border-white/5">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Upload QR Image
                </h2>
                <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
                  Select an image containing the QR code
                </p>
              </div>
              <div className="p-5">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3.5 bg-gray-100 dark:bg-white/5 border-2 border-dashed border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 hover:border-blue-500 dark:hover:border-blue-500 transition-all font-medium flex items-center justify-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  Choose Image File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <p className="text-xs text-gray-500 dark:text-zinc-500 text-center mt-3">
                  Supports JPG, PNG, WebP formats
                </p>
              </div>
            </div>

            {/* Manual Entry Card */}
            <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none">
              <div className="p-5 border-b border-gray-200 dark:border-white/5">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Manual Verification
                </h2>
                <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
                  Enter verification ID directly
                </p>
              </div>
              <div className="p-5">
                <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider mb-3">
                  Verification ID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualId}
                    onChange={(e) => setManualId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleManualVerify()}
                    placeholder="e.g. 19434a7e8-3f2a1b4c-9d8e7f6a"
                    className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={handleManualVerify}
                    disabled={!manualId.trim()}
                    className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold shadow-sm"
                  >
                    Verify
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                Verification Failed
              </p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-500/10 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-1">
                How to Verify a Certificate
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                  <span>Open your device camera and point it at the QR code on the certificate</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                  <span>Alternatively, upload a screenshot or photo of the QR code</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                  <span>You can also manually enter the verification ID found on the certificate</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScannerVerify;
