import { useState, useEffect, useRef } from "react";
import { Camera, X, QrCode } from "lucide-react";
import jsQR from "jsqr";

const API_BASE = "http://localhost:5000/api";

const QRScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const email = localStorage.getItem("participantEmail") || "";

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      setError("");
      setResult(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          startQRDetection();
        };
      }
      setScanning(true);
    } catch (err) {
      setError("Unable to access camera. Please allow camera permissions.");
    }
  };

  const startQRDetection = () => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    scanIntervalRef.current = setInterval(() => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        );
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          handleQRDetected(code.data);
          clearInterval(scanIntervalRef.current);
        }
      }
    }, 300);
  };

  const handleQRDetected = async (data) => {
    setProcessing(true);
    stopScanning();

    try {
      let parsedData;
      try {
        parsedData = JSON.parse(data);
      } catch {
        parsedData = { qrData: data };
      }

      const response = await fetch(`${API_BASE}/participant/attendance/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: parsedData.eventId,
          email: email,
          qrData: parsedData.qrData || data,
        }),
      });

      const responseData = await response.json();

      if (responseData.success) {
        setResult({
          success: true,
          message: responseData.message || "Attendance marked successfully!",
        });
      } else {
        setResult({
          success: false,
          message: responseData.message || "Failed to mark attendance",
        });
      }
    } catch (err) {
      setResult({ success: false, message: "Failed to process QR code" });
    } finally {
      setProcessing(false);
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setScanning(false);
  };

  const resetScanner = () => {
    setResult(null);
    setError("");
    setProcessing(false);
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="bg-dark rounded-3xl p-8 text-white text-center">
        <div className="w-14 h-14 bg-lime/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <QrCode size={28} className="text-lime" />
        </div>
        <h1 className="text-2xl font-bold mb-1">QR Scanner</h1>
        <p className="text-dark-200 text-sm">
          Scan the event QR code to mark your attendance
        </p>
      </div>

      {/* Scanner Area */}
      <div className="bg-white rounded-3xl shadow-card border border-light-400/50 overflow-hidden">
        {/* Result Display */}
        {result && (
          <div
            className={`p-6 text-center ${
              result.success ? "bg-lime/10" : "bg-red-50"
            }`}
          >
            <div className="text-5xl mb-3">{result.success ? "✅" : "❌"}</div>
            <h3
              className={`text-lg font-bold ${result.success ? "text-dark" : "text-red-800"}`}
            >
              {result.success ? "Success!" : "Failed"}
            </h3>
            <p
              className={`text-sm mt-1 ${result.success ? "text-dark-300" : "text-red-600"}`}
            >
              {result.message}
            </p>
            <button
              onClick={resetScanner}
              className="mt-4 px-6 py-2.5 bg-dark text-lime rounded-2xl font-bold text-sm hover:bg-dark-600 transition-all"
            >
              Scan Again
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-6 text-center bg-red-50">
            <p className="text-red-800 font-medium text-sm">{error}</p>
            <button
              onClick={() => setError("")}
              className="mt-3 px-6 py-2 bg-dark text-white rounded-2xl text-sm font-bold"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Camera View */}
        {!result && !error && (
          <div className="relative">
            <div className="aspect-square bg-dark relative overflow-hidden">
              {scanning ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} style={{ display: "none" }} />

                  {/* QR frame overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-56 h-56 relative">
                      <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-lime rounded-tl-xl"></div>
                      <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-lime rounded-tr-xl"></div>
                      <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-lime rounded-bl-xl"></div>
                      <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-lime rounded-br-xl"></div>

                      {/* Scanning line animation */}
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-lime animate-bounce"></div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                    <p className="text-white text-xs font-bold bg-dark/80 px-4 py-2 rounded-xl">
                      {processing ? "Processing..." : "Point at QR code..."}
                    </p>
                    <button
                      onClick={stopScanning}
                      className="px-5 py-2 bg-red-500 text-white rounded-xl text-xs font-bold"
                    >
                      Stop
                    </button>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-4 p-8">
                  <div className="w-20 h-20 bg-lime/15 rounded-3xl flex items-center justify-center">
                    <Camera size={36} className="text-lime" />
                  </div>
                  <button
                    onClick={startScanning}
                    className="px-8 py-3.5 bg-lime text-dark rounded-2xl font-bold hover:shadow-lime transition-all hover:scale-105"
                  >
                    Start Scanning
                  </button>
                  <p className="text-dark-200 text-xs text-center">
                    Allow camera access to scan QR codes
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-lime/10 rounded-3xl p-5 border border-lime/20">
        <h3 className="font-bold text-dark text-sm mb-3">How it works</h3>
        <div className="space-y-2">
          {[
            "Open the scanner and allow camera access",
            "Point your camera at the event QR code",
            "Your attendance will be marked automatically",
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-6 h-6 bg-dark rounded-lg flex items-center justify-center text-lime text-xs font-bold">
                {i + 1}
              </span>
              <span className="text-dark-300 text-sm">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
