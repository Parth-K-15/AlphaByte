import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
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
} from 'lucide-react';
import QRCode from 'qrcode';
import { 
  generateQRCode, 
  getAttendanceLogs, 
  getLiveAttendanceCount, 
  markManualAttendance,
  unmarkAttendance,
  getAssignedEvents,
  getParticipants
} from '../../services/organizerApi';

// Custom QR Code Component using qrcode library
const QRCodeCanvas = ({ value, size = 240 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }, (error) => {
        if (error) console.error('QR Code generation error:', error);
      });
    }
  }, [value, size]);

  return <canvas ref={canvasRef} />;
};

// Helper to check if ID is a valid MongoDB ObjectId
const isValidObjectId = (id) => /^[a-fA-F0-9]{24}$/.test(id);

const AttendanceQR = () => {
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(searchParams.get('event') || '');
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [liveCount, setLiveCount] = useState({ present: 0, total: 0 });
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [activeTab, setActiveTab] = useState('qr');
  const [searchQuery, setSearchQuery] = useState('');
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const intervalRef = useRef(null);

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
      const organizerId = localStorage.getItem('userId');
      const response = await getAssignedEvents(organizerId);
      if (response.data.success) {
        setEvents(response.data.data);
        if (!selectedEvent && response.data.data.length > 0) {
          setSelectedEvent(response.data.data[0]._id || response.data.data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchAttendanceLogs = async () => {
    try {
      const response = await getAttendanceLogs(selectedEvent, { limit: 50 });
      if (response.data.success) {
        setAttendanceLogs(Array.isArray(response.data.data) ? response.data.data : []);
      }
    } catch (error) {
      console.error('Error fetching attendance logs:', error);
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
      console.error('Error fetching live count:', error);
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
      console.error('Error fetching participants:', error);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleGenerateQR = async () => {
    if (!selectedEvent || !isValidObjectId(selectedEvent)) {
      alert('Please select an event first.');
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
      console.error('Error generating QR:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleManualAttendance = async (participantId) => {
    if (!selectedEvent || !isValidObjectId(selectedEvent)) {
      alert('Please select a real event first.');
      return;
    }
    try {
      const response = await markManualAttendance(selectedEvent, participantId);
      if (response.data.success) {
        alert('Attendance marked successfully!');
        fetchParticipants();
        fetchAttendanceLogs();
        fetchLiveCount();
      }
    } catch (error) {
      console.error('Error marking manual attendance:', error);
      alert(error.message || 'Failed to mark attendance');
    }
  };

  const handleUnmarkAttendance = async (participantId) => {
    if (!selectedEvent || !isValidObjectId(selectedEvent)) {
      alert('Please select a real event first.');
      return;
    }
    if (!confirm('Are you sure you want to unmark this attendance?')) return;
    try {
      const response = await unmarkAttendance(selectedEvent, participantId);
      if (response.data.success) {
        alert('Attendance unmarked successfully!');
        fetchParticipants();
        fetchAttendanceLogs();
        fetchLiveCount();
      }
    } catch (error) {
      console.error('Error unmarking attendance:', error);
      alert(error.message || 'Failed to unmark attendance');
    }
  };

  const filteredLogs = Array.isArray(attendanceLogs) ? attendanceLogs.filter((log) =>
    log.participant?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.participant?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Attendance</h1>
          <p className="text-gray-500 mt-1">QR-based attendance tracking</p>
        </div>
        {events.length > 0 ? (
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {events.map((event) => (
              <option key={event._id} value={event._id}>
                {event.title}
              </option>
            ))}
          </select>
        ) : (
          <div className="text-gray-500 text-sm">No events assigned</div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Registered</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{liveCount.total || 0}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <Users size={20} className="text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Present</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{liveCount.present || 0}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <CheckCircle size={20} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Absent</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{(liveCount.total || 0) - (liveCount.present || 0)}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-xl">
              <XCircle size={20} className="text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Attendance Rate</p>
              <p className="text-2xl font-bold text-primary-600 mt-1">
                {liveCount.total > 0 ? Math.round((liveCount.present / liveCount.total) * 100) : 0}%
              </p>
            </div>
            <div className="p-3 bg-primary-50 rounded-xl">
              <Activity size={20} className="text-primary-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100">
          <div className="flex">
            <button
              onClick={() => setActiveTab('qr')}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeTab === 'qr'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <QrCode size={18} className="inline-block mr-2" />
              QR Code Display
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeTab === 'logs'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <UserPlus size={18} className="inline-block mr-2" />
              Manual Attendance
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'qr' && (
            <div className="flex flex-col items-center">
              {qrData ? (
                <div className="text-center">
                  {/* QR Code Display */}
                  <div className="relative inline-block">
                    <div className="w-72 h-72 bg-white rounded-2xl shadow-lg p-6 flex items-center justify-center border-4 border-primary-100">
                      <QRCodeCanvas 
                        value={qrData.qrData} 
                        size={240}
                      />
                    </div>
                    
                    {/* Timer Badge */}
                    <div className="absolute -top-3 -right-3 bg-primary-600 text-white px-3 py-1.5 rounded-xl shadow-lg">
                      <span className="font-mono font-bold">{formatTime(timeRemaining)}</span>
                    </div>
                  </div>

                  <p className="text-gray-600 mt-6 mb-2">Session ID: {qrData.sessionId}</p>
                  <p className="text-sm text-gray-400">QR code will expire in {formatTime(timeRemaining)}</p>

                  <div className="flex items-center justify-center gap-4 mt-6">
                    <button
                      onClick={handleGenerateQR}
                      className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                    >
                      <RefreshCw size={18} />
                      Refresh QR
                    </button>
                  </div>
                </div>
              ) : selectedEvent && events.length > 0 ? (
                <div className="text-center">
                  {/* Static QR Code for Selected Event */}
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Event QR Code</h3>
                    <div className="inline-block bg-white rounded-2xl shadow-lg p-6 border-4 border-gray-100">
                      <QRCodeCanvas 
                        value={JSON.stringify({ 
                          eventId: selectedEvent, 
                          type: 'event_static',
                          eventName: events.find(e => e._id === selectedEvent)?.title || 'Event'
                        })} 
                        size={240}
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-4">
                      Static QR code for {events.find(e => e._id === selectedEvent)?.title}
                    </p>
                  </div>

                  {/* Generate Dynamic QR Section */}
                  <div className="border-t border-gray-200 pt-8">
                    <div className="w-32 h-32 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <QrCode size={64} className="text-gray-300" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Generate Dynamic QR Code</h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      Click the button below to generate a time-limited QR code for attendance. 
                      Participants can scan this code to mark their attendance.
                    </p>
                    <button
                      onClick={handleGenerateQR}
                      disabled={loading}
                      className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors mx-auto disabled:opacity-50"
                    >
                      {loading ? (
                        <RefreshCw size={18} className="animate-spin" />
                      ) : (
                        <QrCode size={18} />
                      )}
                      Generate Dynamic QR Code
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-32 h-32 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <QrCode size={64} className="text-gray-300" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">No Events Available</h3>
                  <p className="text-gray-500 mb-6 max-w-md">
                    You don't have any events assigned yet. Please contact an admin to get assigned to events.
                  </p>
                </div>
              )}

              {/* Live Feed */}
              {qrData && (
                <div className="w-full max-w-2xl mt-8 border-t border-gray-100 pt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      Live Check-ins
                    </h3>
                  </div>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {filteredLogs.slice(0, 5).map((log) => (
                      <div key={log._id} className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                            <CheckCircle size={20} className="text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{log.participant?.name}</p>
                            <p className="text-sm text-gray-500">{log.participant?.email}</p>
                          </div>
                        </div>
                        <span className="text-sm text-gray-400">
                          {new Date(log.scannedAt).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'logs' && (
            <div>
              {/* Search & Filter */}
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50">
                  <Download size={18} />
                  Export Data
                </button>
              </div>

              {/* Manual Attendance Table */}
              {loadingParticipants ? (
                <div className="text-center py-12">
                  <RefreshCw className="animate-spin mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-500">Loading participants...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">#</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Name</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Email</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">College</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Branch</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Date/Time</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Status</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {participants
                        .filter((p) =>
                          p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.college?.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((participant, index) => {
                          const hasAttended = participant.hasAttended || participant.attendanceStatus === 'ATTENDED';
                          const isAbsent = !hasAttended && (participant.attendanceStatus === 'ABSENT' || !participant.attendanceStatus);
                          const attendedAt = participant.attendedAt;
                          
                          return (
                            <tr key={participant._id} className="hover:bg-gray-50/50">
                              <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                                    <span className="text-primary-600 font-medium text-sm">
                                      {participant.name?.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <span className="font-medium text-gray-800">{participant.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">{participant.email}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{participant.college || '-'}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{participant.branch || '-'}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {attendedAt ? new Date(attendedAt).toLocaleString() : '-'}
                              </td>
                              <td className="px-4 py-3">
                                {hasAttended ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">
                                    <CheckCircle size={12} />
                                    Present
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                                    <XCircle size={12} />
                                    Absent
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {hasAttended ? (
                                  <button
                                    onClick={() => handleUnmarkAttendance(participant._id)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs font-medium"
                                  >
                                    <XCircle size={14} />
                                    Unmark
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleManualAttendance(participant._id)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-xs font-medium"
                                  >
                                    <CheckCircle size={14} />
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
                <div className="text-center py-12">
                  <Users size={48} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No participants found</h3>
                  <p className="text-gray-500">Participants will appear here once they register for this event.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceQR;
