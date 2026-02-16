import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { usePermissions } from "../../context/PermissionContext";
import {
  QrCode,
  RefreshCw,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  Search,
  Filter,
  UserPlus,
  Activity,
  ShieldAlert,
  History,
} from "lucide-react";
import QRCode from "qrcode";
import {
  generateQRCode,
  getAttendanceLogs,
  getLiveAttendanceCount,
  markManualAttendance,
  unmarkAttendance,
  getAssignedEvents,
  getParticipants,
} from "../../services/organizerApi";
import InvalidateAttendanceModal from "../../components/organizer/InvalidateAttendanceModal";
import AuditTrailViewer from "../../components/organizer/AuditTrailViewer";

// Custom QR Code Component using qrcode library
const QRCodeCanvas = ({ value, size = 240 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(
        canvasRef.current,
        value,
        {
          width: size,
          margin: 2,
          errorCorrectionLevel: "H",
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        },
        (error) => {
          if (error) console.error("QR Code generation error:", error);
        },
      );
    }
  }, [value, size]);

  return <canvas ref={canvasRef} />;
};

// Helper to check if ID is a valid MongoDB ObjectId
const isValidObjectId = (id) => /^[a-fA-F0-9]{24}$/.test(id);

const AttendanceQR = () => {
  const [searchParams] = useSearchParams();
  const { setSelectedEventId } = usePermissions();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(
    searchParams.get("event") || "",
  );
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [liveCount, setLiveCount] = useState({ present: 0, total: 0 });
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [activeTab, setActiveTab] = useState("qr");
  const [searchQuery, setSearchQuery] = useState("");
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const intervalRef = useRef(null);

  // Retroactive Change & Audit Trail states
  const [showInvalidateModal, setShowInvalidateModal] = useState(false);
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);

  useEffect(() => {
    fetchEvents();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (selectedEvent && isValidObjectId(selectedEvent)) {
      fetchAttendanceLogs();
      fetchLiveCount();
      fetchParticipants();
      setSelectedEventId(selectedEvent);
    }
  }, [selectedEvent]);

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setQrData(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [qrData]);

  const fetchEvents = async () => {
    try {
      const organizerId = localStorage.getItem("userId");
      const response = await getAssignedEvents(organizerId);
      if (response.data.success) {
        setEvents(response.data.data);
        if (!selectedEvent && response.data.data.length > 0) {
          setSelectedEvent(
            response.data.data[0]._id || response.data.data[0].id,
          );
        }
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const fetchAttendanceLogs = async () => {
    try {
      const response = await getAttendanceLogs(selectedEvent, { limit: 50 });
      if (response.data.success) {
        setAttendanceLogs(
          Array.isArray(response.data.data) ? response.data.data : [],
        );
      }
    } catch (error) {
      console.error("Error fetching attendance logs:", error);
      setAttendanceLogs([]);
    }
  };

  const fetchLiveCount = async () => {
    try {
      const response = await getLiveAttendanceCount(selectedEvent);
      if (response.data.success) {
        setLiveCount(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching live count:", error);
    }
  };

  const fetchParticipants = async () => {
    if (!selectedEvent || !isValidObjectId(selectedEvent)) return;
    setLoadingParticipants(true);
    try {
      const response = await getParticipants(selectedEvent);
      if (response.data.success) {
        setParticipants(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching participants:", error);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleGenerateQR = async () => {
    if (!selectedEvent || !isValidObjectId(selectedEvent)) {
      alert("Please select an event first.");
      return;
    }
    setLoading(true);
    try {
      const response = await generateQRCode(selectedEvent);
      if (response.data.success) {
        setQrData(response.data.data);
        setTimeRemaining(300); // 5 minutes

        // Start polling for live count
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
          fetchLiveCount();
          fetchAttendanceLogs();
        }, 5000);
      }
    } catch (error) {
      console.error("Error generating QR:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleManualAttendance = async (participantId) => {
    if (!selectedEvent || !isValidObjectId(selectedEvent)) {
      alert("Please select a real event first.");
      return;
    }
    try {
      const response = await markManualAttendance(selectedEvent, participantId);
      if (response.data.success) {
        alert("Attendance marked successfully!");
        fetchParticipants();
        fetchAttendanceLogs();
        fetchLiveCount();
      }
    } catch (error) {
      console.error("Error marking manual attendance:", error);
      alert(error.message || "Failed to mark attendance");
    }
  };

  const handleUnmarkAttendance = async (participantId) => {
    if (!selectedEvent || !isValidObjectId(selectedEvent)) {
      alert("Please select a real event first.");
      return;
    }
    if (!confirm("Are you sure you want to unmark this attendance?")) return;
    try {
      const response = await unmarkAttendance(selectedEvent, participantId);
      if (response.data.success) {
        alert("Attendance unmarked successfully!");
        fetchParticipants();
        fetchAttendanceLogs();
        fetchLiveCount();
      }
    } catch (error) {
      console.error("Error unmarking attendance:", error);
      alert(error.message || "Failed to unmark attendance");
    }
  };

  const filteredLogs = Array.isArray(attendanceLogs)
    ? attendanceLogs.filter(
        (log) =>
          log.participant?.name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          log.participant?.email
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()),
      )
    : [];

  return (
    <div className="space-y-8 max-w-full overflow-x-hidden">
      {/* Page Header */}
      <div>
        <div>
          <div className="inline-block">
            <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text">
              Attendance Tracking
            </h1>
            <div className="h-1 w-28 bg-[#B9FF66] rounded-full"></div>
          </div>
          <p className="text-gray-600 dark:text-zinc-400 mt-3 text-lg font-semibold">
            QR-based attendance tracking
          </p>
        </div>
        {events.length > 0 ? (
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="mt-4 px-4 py-2 text-sm border-2 border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B9FF66] shadow-sm hover:border-[#B9FF66] transition-all font-bold text-gray-900 dark:text-white bg-white dark:bg-white/5 w-full md:w-auto"
          >
            {events.map((event) => (
              <option key={event._id} value={event._id}>
                {event.title}
              </option>
            ))}
          </select>
        ) : (
          <div className="mt-4 text-gray-500 dark:text-zinc-400 text-sm font-semibold">
            No events assigned
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="group relative bg-white dark:bg-white/[0.03] rounded-2xl p-4 md:p-6 border border-gray-100 dark:border-white/5 shadow-md dark:shadow-none hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
          <div className="absolute -right-4 -top-4 w-20 h-20 md:w-24 md:h-24 bg-[#B9FF66]/10 rounded-full blur-2xl group-hover:bg-[#B9FF66]/20 transition-all"></div>
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between">
            <div className="mb-3 md:mb-0">
              <p className="text-[10px] md:text-sm text-gray-700 dark:text-zinc-400 font-bold">
                Total Registered
              </p>
              <p className="text-2xl md:text-4xl font-black text-gray-900 dark:text-white mt-1 md:mt-2">
                {liveCount.total || 0}
              </p>
            </div>
            <div className="p-2 md:p-3 bg-[#191A23] rounded-xl shadow-lg">
              <Users
                size={18}
                className="text-[#B9FF66] md:w-6 md:h-6"
                strokeWidth={2.5}
              />
            </div>
          </div>
        </div>

        <div className="group relative bg-white dark:bg-white/[0.03] rounded-2xl p-4 md:p-6 border border-gray-100 dark:border-white/5 shadow-md dark:shadow-none hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
          <div className="absolute -right-4 -top-4 w-20 h-20 md:w-24 md:h-24 bg-[#B9FF66]/10 rounded-full blur-2xl group-hover:bg-[#B9FF66]/20 transition-all"></div>
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between">
            <div className="mb-3 md:mb-0">
              <p className="text-[10px] md:text-sm text-gray-700 dark:text-zinc-400 font-bold">
                Present
              </p>
              <p className="text-2xl md:text-4xl font-black text-[#191A23] dark:text-white mt-1 md:mt-2">
                {liveCount.present || 0}
              </p>
            </div>
            <div className="p-2 md:p-3 bg-[#B9FF66] rounded-xl shadow-lg">
              <CheckCircle
                size={18}
                className="text-[#191A23] md:w-6 md:h-6"
                strokeWidth={2.5}
              />
            </div>
          </div>
        </div>

        <div className="group relative bg-white dark:bg-white/[0.03] rounded-2xl p-4 md:p-6 border border-gray-100 dark:border-white/5 shadow-md dark:shadow-none hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
          <div className="absolute -right-4 -top-4 w-20 h-20 md:w-24 md:h-24 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all"></div>
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between">
            <div className="mb-3 md:mb-0">
              <p className="text-[10px] md:text-sm text-gray-700 dark:text-zinc-400 font-bold">
                Absent
              </p>
              <p className="text-2xl md:text-4xl font-black text-red-600 mt-1 md:mt-2">
                {(liveCount.total || 0) - (liveCount.present || 0)}
              </p>
            </div>
            <div className="p-2 md:p-3 bg-red-500 rounded-xl shadow-lg">
              <XCircle
                size={18}
                className="text-white md:w-6 md:h-6"
                strokeWidth={2.5}
              />
            </div>
          </div>
        </div>

        <div className="group relative bg-white dark:bg-white/[0.03] rounded-2xl p-4 md:p-6 border border-gray-100 dark:border-white/5 shadow-md dark:shadow-none hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
          <div className="absolute -right-4 -top-4 w-20 h-20 md:w-24 md:h-24 bg-[#191A23]/5 rounded-full blur-2xl group-hover:bg-[#191A23]/10 transition-all"></div>
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between">
            <div className="mb-3 md:mb-0">
              <p className="text-[10px] md:text-sm text-gray-700 dark:text-zinc-400 font-bold">
                Attendance Rate
              </p>
              <p className="text-2xl md:text-4xl font-black text-[#191A23] dark:text-white mt-1 md:mt-2">
                {liveCount.total > 0
                  ? Math.round((liveCount.present / liveCount.total) * 100)
                  : 0}
                %
              </p>
            </div>
            <div className="p-2 md:p-3 bg-[#191A23] rounded-xl shadow-lg">
              <Activity
                size={18}
                className="text-[#B9FF66] md:w-6 md:h-6"
                strokeWidth={2.5}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/80 dark:bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-white/60 dark:border-white/5 shadow-lg dark:shadow-none overflow-hidden">
        <div className="border-b border-gray-100 dark:border-white/5">
          <div className="flex">
            <button
              onClick={() => setActiveTab("qr")}
              className={`relative flex-1 py-4 text-center font-bold transition-all duration-300 ${
                activeTab === "qr"
                  ? "text-[#191A23] dark:text-white"
                  : "text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300"
              }`}
            >
              <QrCode
                size={18}
                className="inline-block mr-2"
                strokeWidth={2.5}
              />
              QR Code Display
              {activeTab === "qr" && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#B9FF66] rounded-full"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              className={`relative flex-1 py-4 text-center font-bold transition-all duration-300 ${
                activeTab === "logs"
                  ? "text-[#191A23] dark:text-white"
                  : "text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300"
              }`}
            >
              <UserPlus
                size={18}
                className="inline-block mr-2"
                strokeWidth={2.5}
              />
              Manual Attendance
              {activeTab === "logs" && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#B9FF66] rounded-full"></div>
              )}
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === "qr" && (
            <div className="flex flex-col items-center">
              {qrData ? (
                <div className="text-center">
                  {/* QR Code Display */}
                  <div className="relative inline-block">
                    <div className="w-80 h-80 bg-white rounded-3xl shadow-2xl p-8 flex items-center justify-center border-4 border-[#B9FF66]/30">
                      <QRCodeCanvas value={qrData.qrData} size={240} />
                    </div>

                    {/* Timer Badge */}
                    <div className="absolute -top-4 -right-4 bg-[#191A23] text-[#B9FF66] px-4 py-2 rounded-2xl shadow-xl animate-pulse">
                      <span className="font-mono font-black text-lg">
                        {formatTime(timeRemaining)}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-700 dark:text-zinc-300 font-bold mt-6 mb-2">
                    Session ID:{" "}
                    <span className="font-black text-[#191A23] dark:text-white">
                      {qrData.sessionId}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-zinc-400 font-semibold">
                    QR code will expire in {formatTime(timeRemaining)}
                  </p>

                  <div className="flex items-center justify-center gap-4 mt-6">
                    <button
                      onClick={handleGenerateQR}
                      className="group flex items-center gap-2 px-8 py-3 bg-[#191A23] text-[#B9FF66] rounded-xl hover:shadow-xl transition-all font-bold hover:scale-105"
                    >
                      <RefreshCw
                        size={18}
                        strokeWidth={2.5}
                        className="group-hover:rotate-180 transition-transform duration-300"
                      />
                      Refresh QR
                    </button>
                  </div>
                </div>
              ) : selectedEvent && events.length > 0 ? (
                <div className="text-center">
                  {/* Generate Dynamic QR Section */}
                  <div>
                    <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <QrCode
                        size={64}
                        className="text-gray-500"
                        strokeWidth={2}
                      />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                      Generate Attendance QR Code
                    </h3>
                    <p className="text-gray-600 dark:text-zinc-400 font-semibold mb-6 max-w-md mx-auto">
                      Generate a secure, time-limited QR code (expires in 5 minutes).
                      Participants must scan this code in real-time to mark their attendance.
                    </p>
                    <button
                      onClick={handleGenerateQR}
                      disabled={loading}
                      className="group flex items-center gap-2 px-8 py-3 bg-[#191A23] text-[#B9FF66] rounded-xl hover:shadow-xl hover:scale-105 transition-all font-bold mx-auto disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-lg"
                    >
                      {loading ? (
                        <RefreshCw
                          size={18}
                          strokeWidth={2.5}
                          className="animate-spin"
                        />
                      ) : (
                        <QrCode
                          size={18}
                          strokeWidth={2.5}
                          className="group-hover:scale-110 transition-transform"
                        />
                      )}
                      Generate QR Code
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-white/5 dark:to-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg dark:shadow-none">
                    <QrCode
                      size={64}
                      className="text-gray-500 dark:text-zinc-400"
                      strokeWidth={2}
                    />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                    No Events Available
                  </h3>
                  <p className="text-gray-600 dark:text-zinc-400 font-semibold mb-6 max-w-md mx-auto">
                    You don't have any events assigned yet. Please contact an
                    admin to get assigned to events.
                  </p>
                </div>
              )}

              {/* Live Feed */}
              {qrData && (
                <div className="w-full max-w-2xl mt-8 border-t border-gray-200 pt-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      Live Check-ins
                    </h3>
                  </div>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {filteredLogs.slice(0, 5).map((log) => (
                      <div
                        key={log._id}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-100 hover:shadow-lg transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                            <CheckCircle
                              size={20}
                              className="text-green-600"
                              strokeWidth={2.5}
                            />
                          </div>
                          <div>
                            <p className="font-black text-gray-900 dark:text-white">
                              {log.participant?.name}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-zinc-400 font-semibold">
                              {log.participant?.email}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500 font-bold">
                          {new Date(log.scannedAt).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "logs" && (
            <div>
              {/* Search & Filter */}
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
                <div className="relative flex-1">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                    strokeWidth={2}
                  />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B9FF66] focus:border-[#B9FF66] bg-white/80 dark:bg-white/5 backdrop-blur-sm font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500"
                  />
                </div>
                <button className="group flex items-center gap-2 px-6 py-3 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-[#B9FF66]/10 hover:border-[#B9FF66] transition-all font-bold text-gray-700 dark:text-zinc-300">
                  <Download
                    size={18}
                    strokeWidth={2.5}
                    className="group-hover:scale-110 transition-transform"
                  />
                  Export Data
                </button>
              </div>

              {/* Manual Attendance Table */}
              {loadingParticipants ? (
                <div className="text-center py-16">
                  <RefreshCw
                    className="animate-spin mx-auto text-gray-400 mb-4"
                    size={48}
                    strokeWidth={2}
                  />
                  <p className="text-gray-600 dark:text-zinc-400 font-bold text-lg">
                    Loading participants...
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto bg-white/80 dark:bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-white/60 dark:border-white/5 shadow-lg dark:shadow-none">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-white/[0.03] dark:to-white/[0.05] border-b border-gray-200 dark:border-white/5">
                      <tr>
                        <th className="text-left px-6 py-4 text-sm font-black text-gray-700 dark:text-zinc-400 hidden md:table-cell">
                          #
                        </th>
                        <th className="text-left px-6 py-4 text-sm font-black text-gray-700 dark:text-zinc-400">
                          Name
                        </th>
                        <th className="text-left px-6 py-4 text-sm font-black text-gray-700 dark:text-zinc-400 hidden md:table-cell">
                          Email
                        </th>
                        <th className="text-left px-6 py-4 text-sm font-black text-gray-700 dark:text-zinc-400 hidden lg:table-cell">
                          College
                        </th>
                        <th className="text-left px-6 py-4 text-sm font-black text-gray-700 dark:text-zinc-400 hidden lg:table-cell">
                          Branch
                        </th>
                        <th className="text-left px-6 py-4 text-sm font-black text-gray-700 dark:text-zinc-400 hidden lg:table-cell">
                          Date/Time
                        </th>
                        <th className="text-left px-6 py-4 text-sm font-black text-gray-700 dark:text-zinc-400">
                          Status
                        </th>
                        <th className="text-left px-6 py-4 text-sm font-black text-gray-700 dark:text-zinc-400">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                      {participants
                        .filter(
                          (p) =>
                            p.name
                              ?.toLowerCase()
                              .includes(searchQuery.toLowerCase()) ||
                            p.email
                              ?.toLowerCase()
                              .includes(searchQuery.toLowerCase()) ||
                            p.college
                              ?.toLowerCase()
                              .includes(searchQuery.toLowerCase()),
                        )
                        .map((participant, index) => {
                          const hasAttended =
                            participant.hasAttended ||
                            participant.attendanceStatus === "ATTENDED";
                          const isAbsent =
                            !hasAttended &&
                            (participant.attendanceStatus === "ABSENT" ||
                              !participant.attendanceStatus);
                          const attendedAt = participant.attendedAt;

                          return (
                            <tr
                              key={participant._id}
                              className="hover:bg-[#B9FF66]/5 dark:hover:bg-white/[0.02] transition-all"
                            >
                              <td className="px-6 py-4 text-sm text-gray-600 dark:text-zinc-400 font-bold hidden md:table-cell">
                                {index + 1}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-[#B9FF66]/20 rounded-xl flex items-center justify-center shadow-sm">
                                    <span className="text-[#191A23] font-black text-sm">
                                      {participant.name
                                        ?.charAt(0)
                                        .toUpperCase()}
                                    </span>
                                  </div>
                                  <span className="font-bold text-gray-900 dark:text-white">
                                    {participant.name}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700 dark:text-zinc-400 font-semibold hidden md:table-cell">
                                {participant.email}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700 dark:text-zinc-400 font-semibold hidden lg:table-cell">
                                {participant.college || "-"}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700 dark:text-zinc-400 font-semibold hidden lg:table-cell">
                                {participant.branch || "-"}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700 dark:text-zinc-400 font-semibold hidden lg:table-cell">
                                {attendedAt
                                  ? new Date(attendedAt).toLocaleString()
                                  : "-"}
                              </td>
                              <td className="px-6 py-4">
                                {hasAttended ? (
                                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-xl text-xs font-black border border-green-200">
                                    <CheckCircle size={12} strokeWidth={2.5} />
                                    Present
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl text-xs font-black border border-gray-200">
                                    <XCircle size={12} strokeWidth={2.5} />
                                    Absent
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                {hasAttended ? (
                                  <button
                                    onClick={() =>
                                      handleUnmarkAttendance(participant._id)
                                    }
                                    className="group flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all text-xs font-bold"
                                  >
                                    <XCircle
                                      size={14}
                                      strokeWidth={2.5}
                                      className="group-hover:rotate-90 transition-transform"
                                    />
                                    Unmark
                                  </button>
                                ) : (
                                  <button
                                    onClick={() =>
                                      handleManualAttendance(participant._id)
                                    }
                                    className="group flex items-center gap-2 px-4 py-2 bg-[#191A23] text-[#B9FF66] rounded-xl hover:shadow-lg hover:scale-105 transition-all text-xs font-bold"
                                  >
                                    <CheckCircle
                                      size={14}
                                      strokeWidth={2.5}
                                      className="group-hover:scale-110 transition-transform"
                                    />
                                    Mark
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}

              {!loadingParticipants && participants.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-white/5 dark:to-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg dark:shadow-none">
                    <Users
                      size={48}
                      className="text-gray-500 dark:text-zinc-400"
                      strokeWidth={2}
                    />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                    No participants found
                  </h3>
                  <p className="text-gray-600 dark:text-zinc-400 font-semibold">
                    Participants will appear here once they register for this
                    event.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Retroactive Change & Audit Trail Modals */}
      <InvalidateAttendanceModal
        isOpen={showInvalidateModal}
        onClose={() => {
          setShowInvalidateModal(false);
          setSelectedAttendance(null);
        }}
        attendance={selectedAttendance}
        onSuccess={() => {
          fetchAttendanceLogs();
          fetchLiveCount();
          fetchParticipants();
        }}
      />

      <AuditTrailViewer
        isOpen={showAuditTrail}
        onClose={() => {
          setShowAuditTrail(false);
          setSelectedAttendance(null);
        }}
        entityType="attendance"
        entityId={selectedAttendance?._id}
        eventId={selectedEvent}
      />
    </div>
  );
};

export default AttendanceQR;
