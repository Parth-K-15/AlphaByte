import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { FadeUp, StaggerContainer, StaggerItem, ScaleUp } from "../../components/participant/ScrollAnimations";
import {
  X,
  CheckCircle,
  Camera,
  Mail,
  ArrowUpRight,
  RefreshCw,
  Calendar,
  MapPin,
  Award,
} from "lucide-react";
import jsQR from "jsqr";
import { useAuth } from "../../context/AuthContext";
import { getEventImageUrl } from "../../utils/eventImageResolver";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://eventsync-blue.vercel.app/api";

const MyRegistrations = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [email, setEmail] = useState(
    user?.email || localStorage.getItem("participantEmail") || "",
  );
  const [inputEmail, setInputEmail] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
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
      
      // Auto-refresh when window gains focus
      const handleFocus = () => {
        fetchRegistrations(true);
      };
      
      window.addEventListener('focus', handleFocus);
      
      return () => {
        window.removeEventListener('focus', handleFocus);
      };
    } else {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

  const fetchRegistrations = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const response = await fetch(
        `${API_BASE}/participant/my-events?email=${encodeURIComponent(email)}`,
      );
      const data = await response.json();

      if (data.success) {
        setRegistrations(data.data);
        setLastUpdated(new Date());
      } else {
        setMessage({ type: "error", text: data.message });
      }
    } catch (error) {
      console.error("Error fetching registrations:", error);
      setMessage({ type: "error", text: "Failed to load registrations" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchRegistrations(true);
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (inputEmail) {
      localStorage.setItem("participantEmail", inputEmail);
      setEmail(inputEmail);
    }
  };



  const formatDate = (dateString) => {
    if (!dateString) return "TBA";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleOpenScanner = (event) => {
    setSelectedEvent(event);
    setShowScanModal(true);
    setScannedData(null);
  };

  const startScanning = async () => {
    try {
      // Set scanning=true FIRST so the <video> element renders in the DOM
      setScanning(true);

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
        });
      } catch (camError) {
        // If permission was denied entirely, don't bother with fallback
        if (camError.name === "NotAllowedError") throw camError;
        // Fallback: try without specific facing mode (front camera)
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      streamRef.current = stream;
      // After await, React has committed the render — videoRef should be set
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current?.play();
          } catch (e) {
            console.warn("Video play() failed:", e);
          }
          scanQRCode();
        };
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      let errorText = "Unable to access camera.";
      if (error.name === "NotAllowedError") {
        errorText = "Camera permission denied. Please allow camera access in your browser settings (click the lock/camera icon in the address bar), then try again.";
      } else if (error.name === "NotFoundError") {
        errorText = "No camera found on this device.";
      } else if (error.name === "NotReadableError") {
        errorText = "Camera is in use by another application. Please close it and try again.";
      } else if (error.name === "OverconstrainedError") {
        errorText = "Camera does not meet requirements. Please try a different device.";
      }
      setMessage({ type: "error", text: errorText });
      setScanning(false);
    }
  };

  const scanQRCode = () => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext("2d", { willReadFrequently: true });

    scanIntervalRef.current = setInterval(() => {
      // Check dimensions INSIDE the interval — they may be 0 initially on mobile
      if (
        video.readyState === video.HAVE_ENOUGH_DATA &&
        video.videoWidth > 0 &&
        video.videoHeight > 0
      ) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        );
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          handleQRCodeScanned(code.data);
          clearInterval(scanIntervalRef.current);
          stopScanning();
        }
      }
    }, 300);
  };

  const handleQRCodeScanned = async (qrData) => {
    console.log('[QR Scan] Raw QR data:', qrData);
    try {
      const parsedData = JSON.parse(qrData);
      console.log('[QR Scan] Parsed data:', parsedData);

      // Accept either static QR (eventId only) or dynamic QR (eventId + sessionId)
      if (parsedData.eventId) {
        console.log('[QR Scan] Valid QR detected, marking attendance...');
        await markAttendanceFromQR(parsedData);
      } else {
        console.error('[QR Scan] Invalid QR format - missing eventId:', parsedData);
        setScannedData({ success: false, message: "Invalid QR code format. Missing event information." });
      }
    } catch (error) {
      console.error('[QR Scan] JSON parse failed:', error);
      setScannedData({ success: false, message: "Invalid QR code format. Please scan a valid event QR code." });
    }
  };

  const markAttendanceFromQR = async (qrCodeData) => {
    setMarkingAttendance(true);
    console.log('[QR Scan] Sending attendance request:', {
      eventId: qrCodeData.eventId || selectedEvent._id,
      email: email,
      sessionId: qrCodeData.sessionId,
    });
    try {
      // Capture participant's GPS for geo-fenced attendance
      let participantLat = null;
      let participantLng = null;
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
            });
          });
          participantLat = position.coords.latitude;
          participantLng = position.coords.longitude;
        } catch (geoErr) {
          console.warn("Geolocation unavailable:", geoErr.message);
        }
      }

      const scanBody = {
        eventId: qrCodeData.eventId || selectedEvent._id,
        email: email,
        sessionId: qrCodeData.sessionId,
      };
      if (participantLat != null && participantLng != null) {
        scanBody.latitude = participantLat;
        scanBody.longitude = participantLng;
      }

      const response = await fetch(`${API_BASE}/participant/attendance/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scanBody),
      });

      const data = await response.json();

      if (data.success) {
        setScannedData({
          success: true,
          message: "Attendance marked successfully!",
        });
        setMessage({
          type: "success",
          text: "Attendance marked successfully!",
        });
        fetchRegistrations();
        setTimeout(() => handleCloseScanner(), 2000);
      } else {
        let errorMsg = data.message || "Failed to mark attendance";
        if (data.code === 'LOCATION_REQUIRED') {
          errorMsg = "Location access is required for this event. Please enable GPS/Location in your browser settings and try again.";
        } else if (data.code === 'OUT_OF_RANGE') {
          errorMsg = data.message || "You are too far from the event venue. Move closer and try again.";
        }
        setScannedData({
          success: false,
          message: errorMsg,
        });
      }
    } catch (error) {
      console.error("Error marking attendance:", error);
      setScannedData({ success: false, message: "Failed to mark attendance" });
    } finally {
      setMarkingAttendance(false);
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEvent._id,
          sessionId: sessionId,
          participantId: email,
          organizerId: "self",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: "Attendance marked successfully!",
        });
        setScannedData({ success: true, message: "Attendance marked!" });
        fetchRegistrations();
        setTimeout(() => handleCloseScanner(), 2000);
      } else {
        setScannedData({
          success: false,
          message: data.message || "Failed to mark attendance",
        });
      }
    } catch (error) {
      console.error("Error marking attendance:", error);
      setScannedData({ success: false, message: "Failed to mark attendance" });
    } finally {
      setMarkingAttendance(false);
    }
  };

  // If no email, show email input form
  if (!email) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <div className="bg-dark rounded-3xl p-8 text-center">
          <div className="w-16 h-16 bg-lime rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mail size={28} className="text-dark" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            My Registrations
          </h2>
          <p className="text-dark-200 mb-6">
            Enter your email to view your registered events
          </p>

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <input
              type="email"
              value={inputEmail}
              onChange={(e) => setInputEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-3.5 bg-dark-500 border border-dark-400 rounded-2xl text-white placeholder:text-dark-200 focus:ring-2 focus:ring-lime/50 focus:border-lime focus:outline-none"
              required
            />
            <button
              type="submit"
              className="w-full py-3.5 bg-lime text-dark rounded-2xl font-bold hover:shadow-lime transition-all hover:scale-[1.02] active:scale-[0.98]"
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <FadeUp>
      <div className="relative bg-gradient-to-br from-dark via-dark to-dark-500 rounded-3xl p-8 lg:p-10 text-white overflow-hidden shadow-2xl">
        {/* Animated Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-lime/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-lime/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl lg:text-5xl font-black mb-3 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              My Registrations
            </h1>
            <p className="text-dark-200 text-base lg:text-lg font-medium">
              Track your event registrations and attendance status
            </p>
            {lastUpdated && (
              <p className="text-dark-200/60 text-xs mt-2 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 bg-lime rounded-full animate-pulse"></span>
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="group flex items-center gap-2 px-5 py-3 bg-lime/10 border-2 border-lime/20 rounded-2xl text-lime hover:bg-lime/20 transition-all duration-300 disabled:opacity-50 hover:scale-105 hover:shadow-lg hover:shadow-lime/20"
          >
            <RefreshCw size={18} className={`${refreshing ? "animate-spin" : ""} group-hover:rotate-180 transition-transform duration-500`} />
            <span className="text-sm font-bold hidden sm:inline">
              {refreshing ? "Refreshing..." : "Refresh"}
            </span>
          </button>
        </div>
        <div className="relative z-10 inline-flex items-center gap-2.5 bg-gradient-to-r from-lime/15 to-lime/5 border-2 border-lime/30 px-5 py-3 rounded-2xl backdrop-blur-sm shadow-lg">
          <div className="p-1.5 bg-lime/20 rounded-lg">
            <Mail size={16} className="text-lime" />
          </div>
          <span className="font-bold text-lime text-sm">{email}</span>
        </div>
      </div>
      </FadeUp>

      {/* Message */}
      {message.text && (
        <div
          className={`p-4 rounded-2xl font-medium text-sm ${
            message.type === "success"
              ? "bg-lime/20 text-dark"
              : "bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Registrations List */}
      {registrations.length === 0 ? (
        <div className="relative bg-gradient-to-br from-white via-white to-light-100 dark:from-white/10 dark:via-white/5 dark:to-white/5 rounded-3xl shadow-2xl dark:shadow-white/5 p-12 lg:p-16 text-center border border-light-400/50 dark:border-white/10 overflow-hidden">
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-lime/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-dark/5 dark:bg-lime/5 rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            <div className="w-24 h-24 bg-gradient-to-br from-dark to-dark-400 dark:from-lime/20 dark:to-lime/10 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl animate-bounce">
              <span className="text-5xl">📭</span>
            </div>
            <h3 className="text-2xl lg:text-3xl font-black text-dark dark:text-white mb-3">
              No Registrations Yet
            </h3>
            <p className="text-dark-300 dark:text-zinc-400 mb-8 text-base lg:text-lg max-w-md mx-auto">
              You haven't registered for any events yet. Start exploring and join events to begin your journey!
            </p>
            <Link
              to="/participant"
              className="group inline-flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-lime to-lime/90 text-dark rounded-2xl font-bold hover:shadow-2xl hover:shadow-lime/50 transition-all hover:scale-105 text-base"
            >
              <span>Browse Events</span>
              <ArrowUpRight size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      ) : (
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {registrations.map((reg) => (
            <StaggerItem key={reg._id}>
            <div
              className="group bg-white dark:bg-dark rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl dark:shadow-white/5 dark:hover:shadow-lime/10 transition-all duration-500 hover:-translate-y-1 border border-light-400/40 dark:border-white/10 flex flex-col"
            >
              {/* Card Image */}
              <div className="relative h-48 overflow-hidden bg-gradient-to-br from-light-300 to-light-400 dark:from-dark-400 dark:to-dark-500">
                <img
                  src={getEventImageUrl(reg.event || {})}
                  alt={reg.event?.title || "Event"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                {/* Event Status Pill */}
                {reg.event?.status && (
                  <span
                    className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md flex items-center gap-1 ${
                      reg.event.status === "upcoming"
                        ? "bg-lime/90 text-dark"
                        : reg.event.status === "ongoing"
                          ? "bg-dark/70 text-lime border border-lime/40"
                          : "bg-dark/60 text-white/70 border border-white/20"
                    }`}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></div>
                    {reg.event.status}
                  </span>
                )}
                {/* Attendance Indicator */}
                {reg.attendanceStatus === "ATTENDED" && (
                  <div className="absolute top-3 right-3 w-8 h-8 bg-lime rounded-full flex items-center justify-center shadow-lg shadow-lime/30">
                    <CheckCircle size={16} className="text-dark" />
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="flex-1 p-5 flex flex-col">
                {/* Title */}
                <h3 className="font-bold text-lg text-dark dark:text-white leading-snug mb-1 line-clamp-2">
                  {reg.event?.title || "Event Deleted"}
                </h3>

                {/* Subtitle / Registration Status */}
                <p className="text-dark-300 dark:text-zinc-500 text-sm font-medium mb-4">
                  {reg.registrationStatus === "CONFIRMED" ? "Confirmed" : reg.registrationStatus === "PENDING" ? "Pending Confirmation" : reg.registrationStatus}
                </p>

                {/* Meta Row */}
                <div className="flex items-center justify-between text-xs text-dark-300 dark:text-zinc-400 mt-auto mb-4">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-dark-200 dark:text-zinc-500" />
                    <span className="font-semibold">{formatDate(reg.event?.startDate)}</span>
                  </div>
                  {reg.event?.venue && (
                    <div className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-dark-200 dark:text-zinc-500" />
                      <span className="font-semibold truncate max-w-[100px]">{reg.event.venue}</span>
                    </div>
                  )}
                </div>

                {/* Badges Row */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {reg.certificate && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-lime/15 text-dark dark:text-lime">
                      <Award size={10} />
                      Certificate
                    </span>
                  )}
                  {reg.attendanceStatus === "ATTENDED" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-lime/15 text-dark dark:text-lime">
                      <CheckCircle size={10} />
                      Attended
                    </span>
                  )}
                </div>

                {/* CTA Button */}
                {reg.event ? (
                  <Link
                    to={`/participant/event/${reg.event._id}`}
                    className="w-full py-3 bg-dark dark:bg-lime/10 dark:border dark:border-lime/30 text-white dark:text-lime rounded-2xl font-bold text-sm text-center hover:bg-dark-600 dark:hover:bg-lime/20 transition-all duration-300 active:scale-[0.97]"
                  >
                    View Details
                  </Link>
                ) : (
                  <div className="w-full py-3 bg-light-400 dark:bg-white/5 text-dark-300 dark:text-zinc-500 rounded-2xl font-bold text-sm text-center cursor-not-allowed">
                    Unavailable
                  </div>
                )}

                {/* Secondary Actions */}
                {reg.event && (
                  <div className="flex gap-2 mt-2">
                    {reg.attendanceStatus !== "ATTENDED" && (
                      <button
                        onClick={() => handleOpenScanner(reg.event)}
                        className="flex-1 py-2.5 bg-lime text-dark rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 hover:shadow-lg hover:shadow-lime/30 transition-all duration-300 active:scale-[0.97]"
                      >
                        <Camera size={14} />
                        Scan QR
                      </button>
                    )}
                    {reg.certificate && reg.certificate.certificateUrl && (
                      <Link
                        to="/participant/certificates"
                        className="flex-1 py-2.5 bg-dark/5 dark:bg-white/5 text-dark dark:text-white rounded-2xl font-bold text-xs text-center hover:bg-dark/10 dark:hover:bg-white/10 transition-all duration-300 active:scale-[0.97]"
                      >
                        Certificate
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}

      {/* Change Email */}
      <div className="text-center mt-6">
        <button
          onClick={() => {
            localStorage.removeItem("participantEmail");
            setEmail("");
            setInputEmail("");
          }}
          className="text-sm font-bold text-dark-300 dark:text-zinc-400 hover:text-dark dark:hover:text-white transition-colors"
        >
          ← Use a different email
        </button>
      </div>

      {/* QR Scanner Modal */}
      {showScanModal && selectedEvent && (
        <div className="fixed inset-0 bg-dark/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1a1a2a] rounded-3xl max-w-lg w-full p-8 relative shadow-2xl">
            {/* Close Button */}
            <button
              onClick={handleCloseScanner}
              className="absolute top-6 right-6 p-2 hover:bg-light-300 dark:hover:bg-white/5 rounded-xl z-10 transition-all"
            >
              <X size={20} className="text-dark-300 dark:text-zinc-400" />
            </button>

            {/* Modal Content */}
            <div className="text-center">
              <div className="mb-6">
                <div className="w-14 h-14 bg-dark rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Camera size={24} className="text-lime" />
                </div>
                <h3 className="text-xl font-bold text-dark dark:text-white mb-1">
                  {selectedEvent.title}
                </h3>
                <p className="text-dark-300 dark:text-zinc-400 text-sm">
                  Scan the organizer's QR code
                </p>
              </div>

              {/* Result Display */}
              {scannedData && (
                <div
                  className={`mb-6 p-5 rounded-2xl ${
                    scannedData.success
                      ? "bg-lime/15 text-dark border border-lime/30"
                      : "bg-red-50 text-red-800 border border-red-100"
                  }`}
                >
                  <div className="text-4xl mb-2">
                    {scannedData.success ? "✅" : "❌"}
                  </div>
                  <p className="font-bold">{scannedData.message}</p>
                </div>
              )}

              {!scannedData && (
                <>
                  {/* Camera Scanner */}
                  <div className="relative aspect-square bg-dark rounded-2xl overflow-hidden mb-6">
                    {scanning ? (
                      <>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                        <canvas ref={canvasRef} style={{ display: "none" }} />
                        {/* QR Frame Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-56 h-56 relative">
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-lime rounded-tl-xl"></div>
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-lime rounded-tr-xl"></div>
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-lime rounded-bl-xl"></div>
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-lime rounded-br-xl"></div>
                          </div>
                        </div>
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center">
                          <p className="text-white text-xs font-bold mb-2 bg-dark/80 px-4 py-2 rounded-xl">
                            Scanning for QR code...
                          </p>
                          <button
                            onClick={stopScanning}
                            className="px-6 py-2 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-all"
                          >
                            Stop Camera
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <button
                          onClick={startScanning}
                          className="px-8 py-4 bg-lime text-dark rounded-2xl font-bold flex items-center gap-2 hover:shadow-lime transition-all hover:scale-105"
                        >
                          <Camera size={20} />
                          Start Camera
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Manual Entry */}
                  <div className="border-t border-light-400 dark:border-white/5 pt-5">
                    <p className="text-sm text-dark-300 dark:text-zinc-400 font-medium mb-3">
                      Or enter session ID manually:
                    </p>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const sessionId = e.target.sessionId.value;
                        handleManualEntry(sessionId);
                      }}
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        name="sessionId"
                        placeholder="Enter session ID"
                        className="input-field flex-1"
                        required
                      />
                      <button
                        type="submit"
                        disabled={markingAttendance}
                        className="px-5 py-2.5 bg-dark text-lime rounded-xl font-bold hover:bg-dark-600 disabled:opacity-50 transition-all text-sm"
                      >
                        {markingAttendance ? "..." : "Submit"}
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
