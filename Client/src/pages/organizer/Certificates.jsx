import { useState, useEffect } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import {
  Award,
  Download,
  Send,
  Users,
  CheckCircle,
  Clock,
  FileText,
  RefreshCw,
  Search,
  Mail,
  Eye,
  Filter,
  AlertCircle,
  ShieldAlert,
  History,
  X,
} from "lucide-react";
import {
  generateCertificates,
  sendCertificates,
  getCertificateLogs,
  resendCertificate,
  getAssignedEvents,
  getCertificateStats,
  getAttendanceLogs,
} from "../../services/organizerApi";
import RevokeCertificateModal from "../../components/organizer/RevokeCertificateModal";
import AuditTrailViewer from "../../components/organizer/AuditTrailViewer";

// Helper to check if ID is a valid MongoDB ObjectId
const isValidObjectId = (id) => /^[a-fA-F0-9]{24}$/.test(id);

// Participant Selector Component
const ParticipantSelector = ({ eventId, selectedParticipants, onChange, certificateType }) => {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (eventId && isValidObjectId(eventId)) {
      fetchAttendedParticipants();
    }
  }, [eventId]);

  const fetchAttendedParticipants = async () => {
    setLoading(true);
    try {
      const response = await getAttendanceLogs(eventId);
      if (response.data.success) {
        // Backend returns: { success: true, data: { attendance: [...], stats: {...} } }
        const attendanceArray = response.data.data.attendance || [];
        const attendedList = attendanceArray.map(att => ({
          id: att.participant._id,
          name: att.participant.name,
          email: att.participant.email,
        }));
        setParticipants(attendedList);
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleParticipant = (participantId) => {
    // For winner certificates, only allow one selection; for others, allow multiple
    if (certificateType === 'winner') {
      onChange([participantId]);
    } else {
      if (selectedParticipants.includes(participantId)) {
        onChange(selectedParticipants.filter(id => id !== participantId));
      } else {
        onChange([...selectedParticipants, participantId]);
      }
    }
  };

  const filteredParticipants = participants.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="animate-spin text-[#B9FF66]" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search participants..."
          className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B9FF66] bg-white dark:bg-white/5 text-gray-900 dark:text-white text-sm"
        />
      </div>

      {/* Participant List */}
      <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-white/10 rounded-lg">
        {filteredParticipants.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-zinc-400">
            {participants.length === 0 ? 'No participants with attendance found' : 'No matching participants'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-white/10">
            {filteredParticipants.map((participant) => (
              <label
                key={participant.id}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
              >
                <input
                  type={certificateType === 'winner' ? 'radio' : 'checkbox'}
                  checked={selectedParticipants.includes(participant.id)}
                  onChange={() => toggleParticipant(participant.id)}
                  className="w-4 h-4 text-[#191A23] focus:ring-[#B9FF66] border-gray-300 rounded"
                />
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {participant.name}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-zinc-400">
                    {participant.email}
                  </p>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Selected count */}
      {selectedParticipants.length > 0 && (
        <div className="text-sm text-gray-600 dark:text-zinc-400 font-semibold">
          {selectedParticipants.length} participant{selectedParticipants.length !== 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  );
};

const Certificates = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(
    searchParams.get("event") || "",
  );
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [certStats, setCertStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [sendingCertId, setSendingCertId] = useState(null);
  const [selectedCertificates, setSelectedCertificates] = useState([]);

  // Determine initial tab from URL path
  const getInitialTab = () => {
    if (location.pathname.includes("/distribution")) return "distribution";
    return "generate";
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());

  // Update tab when URL changes
  useEffect(() => {
    const tab = location.pathname.includes("/distribution")
      ? "distribution"
      : "generate";
    setActiveTab(tab);
  }, [location.pathname]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");

  // Retroactive Change & Audit Trail states
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);

  // Template preview modal
  const [showPreview, setShowPreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  const [generateOptions, setGenerateOptions] = useState({
    template: "default",
    certificateType: "participation", // participation, winner, second, third
    includeAll: true,
    achievement: "Participation",
    selectedParticipants: [], // for individual certificate generation
  });

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedEvent && isValidObjectId(selectedEvent)) {
      fetchCertificates();
      fetchCertificateStats();
    } else {
      setLoading(false);
      setCertStats(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEvent]);

  const fetchEvents = async () => {
    try {
      // Get userId directly from localStorage (stored by AuthContext)
      const organizerId = localStorage.getItem("userId");

      console.log(
        "🔍 [Certificates] Organizer ID from localStorage:",
        organizerId,
      );

      if (!organizerId) {
        console.error("❌ [Certificates] No organizer ID found!");
        alert("User ID not found. Please log in again.");
        return;
      }

      const response = await getAssignedEvents(organizerId);
      console.log("🔍 [Certificates] API Response:", response.data);
      console.log(
        "🔍 [Certificates] Events received:",
        response.data.data?.length || 0,
      );

      if (response.data.success) {
        // Log each event's organizer ID to verify filtering
        response.data.data.forEach((event, index) => {
          console.log(
            `📋 [Certificates] Event ${index + 1}: ${event.title || event.name}, Team Lead: ${event.teamLead?._id || event.teamLead}`,
          );
        });

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

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const response = await getCertificateLogs(selectedEvent, {});
      if (response.data.success) {
        setCertificates(
          Array.isArray(response.data.data) ? response.data.data : [],
        );
      }
    } catch (error) {
      console.error("Error fetching certificates:", error);
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCertificateStats = async () => {
    setLoadingStats(true);
    try {
      const response = await getCertificateStats(selectedEvent);
      if (response.data.success) {
        console.log("📊 Certificate Stats:", response.data.data);
        setCertStats(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching certificate stats:", error);
      setCertStats(null);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleGenerateCertificates = async () => {
    if (!selectedEvent || !isValidObjectId(selectedEvent)) {
      alert("Please select an event first.");
      return;
    }

    // Validation for winner certificates and participation certificates when not generating for all
    if (generateOptions.certificateType !== 'participation' || !generateOptions.includeAll) {
      if (generateOptions.selectedParticipants.length === 0) {
        alert("Please select at least one participant for the certificate.");
        return;
      }
    }

    const organizerId = localStorage.getItem("userId");
    if (!organizerId) {
      alert("User ID not found. Please log in again.");
      return;
    }

    setGenerating(true);
    try {
      const requestData = {
        organizerId,
        template: generateOptions.template,
        achievement: generateOptions.achievement || "Participation",
      };

      // Add participantIds for individual certificate generation (winner certificates or selected participants)
      if ((generateOptions.certificateType !== 'participation' || !generateOptions.includeAll) && generateOptions.selectedParticipants.length > 0) {
        requestData.participantIds = generateOptions.selectedParticipants;
      }

      const response = await generateCertificates(selectedEvent, requestData);
      if (response.data.success) {
        const generated =
          response.data.data.generated || response.data.data.count || 0;
        const failed = response.data.data.failed || 0;

        if (failed > 0) {
          alert(
            `Generated ${generated} certificates successfully.\n${failed} failed to generate.`,
          );
        } else if (generated > 0) {
          const certType = generateOptions.certificateType === 'participation' ? 'participation' : generateOptions.achievement.toLowerCase();
          alert(
            `✅ Successfully generated ${generated} ${certType} certificate${generated === 1 ? "" : "s"}!\n\nCertificates have been uploaded to Cloudinary and are ready for distribution.`,
          );
        } else {
          alert(
            "ℹ️ No new certificates to generate.\n\nAll eligible participants already have certificates.",
          );
        }

        fetchCertificates();
        fetchCertificateStats();
        if (generated > 0) {
          setActiveTab("distribution");
          // Reset form for winner certificates or when not generating for all
          if (generateOptions.certificateType !== 'participation' || !generateOptions.includeAll) {
            setGenerateOptions({
              ...generateOptions,
              selectedParticipants: [],
            });
          }
        }
      } else if (response.data.message) {
        // Show backend error message
        alert(`⚠️ ${response.data.message}`);
      }
    } catch (error) {
      console.error("Error generating certificates:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to generate certificates";
      alert(
        `❌ Certificate Generation Error\n\n${errorMessage}\n\n💡 Tip: Make sure participants have marked their attendance using the Attendance QR page before generating certificates.`,
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleResendCertificate = async (
    certificateId,
    participantName,
    participantEmail,
  ) => {
    // Confirmation dialog
    const confirmed = window.confirm(
      `📧 Send Certificate via Email\n\n` +
      `Recipient: ${participantName}\n` +
      `Email: ${participantEmail}\n\n` +
      `The certificate will be sent to this participant's email address.\n\n` +
      `Do you want to continue?`,
    );

    if (!confirmed) return;

    setSendingCertId(certificateId);
    try {
      const organizerId = localStorage.getItem("userId");
      const response = await resendCertificate(certificateId, organizerId);

      if (response.data.success) {
        alert(
          `✅ Certificate Sent Successfully!\n\n` +
          `The certificate has been sent to ${participantName} at ${participantEmail}.\n\n` +
          `${response.data.emailDetails?.messageId ? `Message ID: ${response.data.emailDetails.messageId}\n` : ""}` +
          `They should receive it shortly.`,
        );
        fetchCertificates();
      }
    } catch (error) {
      console.error("Error sending certificate:", error);
      const errorMsg = error.message || "Failed to send certificate";
      const isEmailConfigError =
        errorMsg.includes("auth") ||
        errorMsg.includes("credentials") ||
        errorMsg.includes("not configured");

      alert(
        `❌ Failed to Send Certificate\n\n` +
        `Recipient: ${participantName} (${participantEmail})\n` +
        `Error: ${errorMsg}\n\n` +
        `${isEmailConfigError
          ? "🔧 Troubleshooting: Check your email configuration in the server .env file.\nRequired: EMAIL_USER and EMAIL_PASSWORD"
          : "Please try again or check the Email Logs for more details."
        }`,
      );
    } finally {
      setSendingCertId(null);
    }
  };

  const handleSendAllPending = async () => {
    if (!selectedEvent) {
      alert("Please select an event first.");
      return;
    }

    if (stats.pending === 0) {
      alert("No pending certificates to send.");
      return;
    }

    const confirmed = window.confirm(
      `📧 Send All Pending Certificates\n\n` +
      `You are about to send ${stats.pending} certificate${stats.pending === 1 ? "" : "s"} to participants.\n\n` +
      `Do you want to continue?`,
    );

    if (!confirmed) return;

    setSending(true);
    try {
      const response = await sendCertificates(selectedEvent, {});

      if (response.data.success) {
        const { sent, failed } = response.data.data;

        if (failed > 0) {
          alert(
            `📧 Bulk Sending Complete\n\n` +
            `✅ Successfully sent: ${sent}\n` +
            `❌ Failed: ${failed}\n\n` +
            `Please check the Email Logs or try resending failed ones individually.`,
          );
        } else {
          alert(
            `✅ All Certificates Sent!\n\n` +
            `Successfully sent ${sent} certificate${sent === 1 ? "" : "s"} to participants.`,
          );
        }

        fetchCertificates();
        fetchCertificateStats();
      }
    } catch (error) {
      console.error("Error sending certificates:", error);
      const errorMsg = error.message || "Failed to send certificates";
      alert(
        `❌ Failed to Send Certificates\n\n` +
        `Error: ${errorMsg}\n\n` +
        `Please try again or check your email configuration.`,
      );
    } finally {
      setSending(false);
    }
  };

  const handleSendSelectedCertificates = async () => {
    if (selectedCertificates.length === 0) {
      alert("Please select at least one certificate to send.");
      return;
    }

    const confirmed = window.confirm(
      `📧 Send Selected Certificates\n\n` +
      `You are about to send ${selectedCertificates.length} certificate${selectedCertificates.length === 1 ? "" : "s"}.\n\n` +
      `Do you want to continue?`,
    );

    if (!confirmed) return;

    setSending(true);
    let successCount = 0;
    let failCount = 0;

    const organizerId = localStorage.getItem("userId");

    for (const certId of selectedCertificates) {
      try {
        await resendCertificate(certId, organizerId);
        successCount++;
      } catch (error) {
        console.error(`Failed to send certificate ${certId}:`, error);
        failCount++;
      }
    }

    setSending(false);
    setSelectedCertificates([]);

    if (failCount > 0) {
      alert(
        `📧 Sending Complete\n\n` +
        `✅ Successfully sent: ${successCount}\n` +
        `❌ Failed: ${failCount}\n\n` +
        `Please try resending the failed ones individually.`,
      );
    } else {
      alert(
        `✅ All Certificates Sent!\n\n` +
        `Successfully sent ${successCount} certificate${successCount === 1 ? "" : "s"}.`,
      );
    }

    fetchCertificates();
  };

  const toggleCertificateSelection = (certId) => {
    setSelectedCertificates((prev) =>
      prev.includes(certId)
        ? prev.filter((id) => id !== certId)
        : [...prev, certId],
    );
  };

  const toggleSelectAll = () => {
    if (selectedCertificates.length === filteredCertificates.length) {
      setSelectedCertificates([]);
    } else {
      setSelectedCertificates(filteredCertificates.map((cert) => cert._id));
    }
  };

  const templates = [
    {
      id: "default",
      name: "Default Certificate",
      preview: "/templates/default.png",
    },
    {
      id: "professional",
      name: "Professional",
      preview: "/templates/professional.png",
    },
    { id: "modern", name: "Modern Design", preview: "/templates/modern.png" },
    { id: "minimal", name: "Minimal", preview: "/templates/minimal.png" },
  ];

  const displayEvents = events;
  const displayCertificates = Array.isArray(certificates) ? certificates : [];

  const filteredCertificates = displayCertificates.filter((cert) => {
    const matchesSearch =
      cert.participant?.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      cert.participant?.email
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      cert.certificateId?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === "all" || cert.status === filter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: displayCertificates.length,
    sent: displayCertificates.filter((c) => c.status === "SENT").length,
    pending: displayCertificates.filter((c) => c.status === "GENERATED").length,
    failed: displayCertificates.filter((c) => c.status === "FAILED").length,
  };

  const statusBadge = (status) => {
    const config = {
      SENT: {
        color:
          "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200",
        icon: CheckCircle,
      },
      GENERATED: {
        color:
          "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border-amber-200",
        icon: Clock,
      },
      FAILED: {
        color:
          "bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border-red-200",
        icon: AlertCircle,
      },
    };
    const { color, icon: Icon } = config[status] || config.GENERATED;
    return (
      <span
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black border ${color}`}
      >
        <Icon size={12} strokeWidth={2.5} />
        {status}
      </span>
    );
  };

  return (
    <div className="relative min-h-screen">
      {/* Subtle background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#B9FF66]/10 rounded-full opacity-40 animate-pulse"></div>
        <div className="absolute top-40 right-16 w-96 h-96 bg-[#191A23]/5 rounded-full opacity-30 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-[#B9FF66]/10 rounded-full opacity-30 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative z-10 p-6 space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#191A23] rounded-2xl flex items-center justify-center shadow-xl">
              <Award size={24} className="text-[#B9FF66]" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white">
                Certificate Management
              </h1>
              <div className="w-24 h-1 bg-[#B9FF66] rounded-full mt-1"></div>
              <p className="text-gray-600 dark:text-zinc-400 font-semibold mt-2">
                Generate and distribute certificates
              </p>
            </div>
          </div>
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="px-6 py-3 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B9FF66] focus:border-[#B9FF66] bg-white/80 dark:bg-white/5 backdrop-blur-sm font-bold text-gray-900 dark:text-white shadow-lg dark:shadow-none"
          >
            {displayEvents.length === 0 ? (
              <option value="">No events assigned</option>
            ) : (
              displayEvents.map((event) => (
                <option
                  key={event._id || event.id}
                  value={event._id || event.id}
                >
                  {event.title || event.name}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="group bg-white/80 dark:bg-white/[0.03] backdrop-blur-sm rounded-2xl p-6 shadow-lg dark:shadow-none border border-white/60 dark:border-white/5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-zinc-400 font-bold">
                  Total Generated
                </p>
                <p className="text-3xl font-black text-gray-900 dark:text-white mt-2">
                  {stats.total}
                </p>
              </div>
              <div className="p-4 bg-[#B9FF66]/20 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                <Award size={24} className="text-[#191A23]" strokeWidth={2.5} />
              </div>
            </div>
            <div className="absolute top-2 right-2 w-2 h-2 bg-[#B9FF66] rounded-full opacity-60"></div>
          </div>

          <div className="group bg-white/80 dark:bg-white/[0.03] backdrop-blur-sm rounded-2xl p-6 shadow-lg dark:shadow-none border border-white/60 dark:border-white/5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-zinc-400 font-bold">
                  Sent Successfully
                </p>
                <p className="text-3xl font-black text-[#191A23] dark:text-white mt-2">
                  {stats.sent}
                </p>
              </div>
              <div className="p-4 bg-[#B9FF66]/20 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                <CheckCircle
                  size={24}
                  className="text-[#191A23]"
                  strokeWidth={2.5}
                />
              </div>
            </div>
            <div className="absolute top-2 right-2 w-2 h-2 bg-[#B9FF66] rounded-full opacity-60"></div>
          </div>

          <div className="group bg-white/80 dark:bg-white/[0.03] backdrop-blur-sm rounded-2xl p-6 shadow-lg dark:shadow-none border border-white/60 dark:border-white/5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-zinc-400 font-bold">
                  Pending
                </p>
                <p className="text-3xl font-black text-[#191A23] dark:text-white mt-2">
                  {stats.pending}
                </p>
              </div>
              <div className="p-4 bg-[#191A23]/10 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                <Clock size={24} className="text-[#191A23]" strokeWidth={2.5} />
              </div>
            </div>
            <div className="absolute top-2 right-2 w-2 h-2 bg-[#191A23] rounded-full opacity-60"></div>
          </div>

          <div className="group bg-white/80 dark:bg-white/[0.03] backdrop-blur-sm rounded-2xl p-6 shadow-lg dark:shadow-none border border-white/60 dark:border-white/5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-zinc-400 font-bold">
                  Failed
                </p>
                <p className="text-3xl font-black text-red-600 mt-2">
                  {stats.failed}
                </p>
              </div>
              <div className="p-4 bg-red-100 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                <AlertCircle
                  size={24}
                  className="text-red-600"
                  strokeWidth={2.5}
                />
              </div>
            </div>
            <div className="absolute top-2 right-2 w-2 h-2 bg-red-400 rounded-full opacity-60"></div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white/80 dark:bg-white/[0.03] backdrop-blur-sm rounded-2xl shadow-lg dark:shadow-none border border-white/60 dark:border-white/5 overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-100 dark:border-white/5">
            <div className="flex">
              <button
                onClick={() => setActiveTab("generate")}
                className={`relative flex-1 py-4 text-center font-bold transition-all duration-300 ${activeTab === "generate"
                  ? "text-[#191A23] dark:text-white"
                  : "text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300"
                  }`}
              >
                <Award
                  size={18}
                  className="inline-block mr-2"
                  strokeWidth={2.5}
                />
                Generate Certificates
                {activeTab === "generate" && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#B9FF66] rounded-full"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab("distribution")}
                className={`relative flex-1 py-4 text-center font-bold transition-all duration-300 ${activeTab === "distribution"
                  ? "text-[#191A23] dark:text-white"
                  : "text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300"
                  }`}
              >
                <Send
                  size={18}
                  className="inline-block mr-2"
                  strokeWidth={2.5}
                />
                Distribution Log
                {activeTab === "distribution" && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#B9FF66] rounded-full"></div>
                )}
              </button>
            </div>
          </div>

          <div className="p-8">
            {activeTab === "generate" && (
              <div className="space-y-8">
                {/* Template Selection */}
                <div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-[#B9FF66] rounded-full"></span>
                    Select Template
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {templates.map((template) => (
                      <div key={template.id} className="relative">
                        <button
                          onClick={() =>
                            setGenerateOptions({
                              ...generateOptions,
                              template: template.id,
                            })
                          }
                          className={`w-full group relative p-5 rounded-2xl border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${generateOptions.template === template.id
                            ? "border-[#191A23] bg-[#B9FF66]/10 shadow-lg"
                            : "border-gray-200 dark:border-white/10 hover:border-[#B9FF66] bg-white dark:bg-white/[0.03]"
                            }`}
                        >
                        {/* Template Preview */}
                        <div className="h-32 rounded-xl mb-4 overflow-hidden group-hover:scale-105 transition-transform shadow-sm">
                          {template.id === "default" && (
                            <svg viewBox="0 0 200 140" className="w-full h-full">
                              {/* Beige gradient background */}
                              <defs>
                                <linearGradient id="defaultBg" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#faf8f5"/>
                                  <stop offset="100%" stopColor="#f5f0e8"/>
                                </linearGradient>
                              </defs>
                              <rect width="200" height="140" fill="url(#defaultBg)"/>
                              {/* Brown curved decorations */}
                              <circle cx="-10" cy="-10" r="40" fill="#8b6f47" opacity="0.15"/>
                              <circle cx="210" cy="150" r="40" fill="#a68a5f" opacity="0.15"/>
                              {/* Brown border frame */}
                              <rect x="8" y="8" width="184" height="124" fill="none" stroke="#8b6f47" strokeWidth="1.5"/>
                              {/* Title */}
                              <text x="100" y="32" textAnchor="middle" fontFamily="Arial" fontSize="15" fontWeight="bold" fill="#3e2723" letterSpacing="2">CERTIFICATE</text>
                              <text x="100" y="46" textAnchor="middle" fontFamily="Arial" fontSize="8" fontWeight="600" fill="#6d4c41" letterSpacing="1.5">OF ACHIEVEMENT</text>
                              {/* Divider line */}
                              <rect x="75" y="52" width="50" height="1.5" fill="#8b6f47"/>
                              {/* Name placeholder */}
                              <rect x="50" y="72" width="100" height="2" fill="#5d4037"/>
                              {/* Seal - Brown gradient */}
                              <circle cx="100" cy="92" r="10" fill="#8b6f47"/>
                              <circle cx="100" cy="92" r="8" fill="none" stroke="white" strokeWidth="1"/>
                              {/* Signature lines */}
                              <line x1="35" y1="118" x2="75" y2="118" stroke="#333" strokeWidth="1"/>
                              <line x1="125" y1="118" x2="165" y2="118" stroke="#333" strokeWidth="1"/>
                            </svg>
                          )}
                          {template.id === "professional" && (
                            <svg viewBox="0 0 200 140" className="w-full h-full">
                              {/* Light gray gradient background */}
                              <defs>
                                <linearGradient id="profBg" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#f8f9fa"/>
                                  <stop offset="100%" stopColor="white"/>
                                </linearGradient>
                              </defs>
                              <rect width="200" height="140" fill="url(#profBg)"/>
                              {/* Dark header bar */}
                              <rect x="10" y="10" width="180" height="20" fill="#2c3e50"/>
                              <rect x="10" y="30" width="180" height="2" fill="#3498db"/>
                              {/* Corner accents - Gray squares */}
                              <rect x="10" y="35" width="20" height="20" fill="none" stroke="#ecf0f1" strokeWidth="2"/>
                              <rect x="12" y="37" width="16" height="16" fill="#34495e" opacity="0.3"/>
                              <rect x="170" y="35" width="20" height="20" fill="none" stroke="#ecf0f1" strokeWidth="2"/>
                              <rect x="172" y="37" width="16" height="16" fill="#34495e" opacity="0.3"/>
                              {/* Organization name on header */}
                              <text x="100" y="23" textAnchor="middle" fontFamily="Arial" fontSize="8" fontWeight="bold" fill="white" letterSpacing="1">YOUR ORGANIZATION</text>
                              {/* Title */}
                              <text x="100" y="50" textAnchor="middle" fontFamily="Arial" fontSize="14" fontWeight="bold" fill="#2c3e50" letterSpacing="2">CERTIFICATE</text>
                              {/* Name underline */}
                              <rect x="50" y="75" width="100" height="2" fill="#2c3e50"/>
                              {/* Date badge */}
                              <rect x="145" y="100" width="30" height="12" fill="#ecf0f1" stroke="#34495e" strokeWidth="1"/>
                              {/* Signatures */}
                              <line x1="35" y1="118" x2="75" y2="118" stroke="#2c3e50" strokeWidth="1"/>
                              <line x1="125" y1="118" x2="165" y2="118" stroke="#2c3e50" strokeWidth="1"/>
                            </svg>
                          )}
                          {template.id === "modern" && (
                            <svg viewBox="0 0 200 140" className="w-full h-full">
                              {/* Vibrant gradient background */}
                              <defs>
                                <linearGradient id="modernBg" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#667eea"/>
                                  <stop offset="50%" stopColor="#764ba2"/>
                                  <stop offset="100%" stopColor="#f093fb"/>
                                </linearGradient>
                                <linearGradient id="modernAccent" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#4facfe"/>
                                  <stop offset="50%" stopColor="#fa709a"/>
                                  <stop offset="100%" stopColor="#fee140"/>
                                </linearGradient>
                              </defs>
                              <rect width="200" height="140" fill="url(#modernBg)"/>
                              {/* Floating colorful shapes */}
                              <circle cx="30" cy="40" r="18" fill="#4facfe" opacity="0.4"/>
                              <circle cx="170" cy="100" r="22" fill="#fa709a" opacity="0.35"/>
                              <ellipse cx="185" cy="25" rx="20" ry="15" fill="#fee140" opacity="0.3"/>
                              {/* White inner card */}
                              <rect x="30" y="20" width="140" height="100" fill="white" rx="8" opacity="0.95"/>
                              {/* Title */}
                              <text x="100" y="45" textAnchor="middle" fontFamily="Arial" fontSize="13" fontWeight="bold" fill="#667eea" letterSpacing="2.5">CERTIFICATE</text>
                              <text x="100" y="55" textAnchor="middle" fontFamily="Arial" fontSize="7" fontWeight="600" fill="#764ba2" letterSpacing="1.5">OF ACHIEVEMENT</text>
                              {/* Rainbow accent line */}
                              <rect x="70" y="60" width="60" height="1.5" fill="url(#modernAccent)"/>
                              {/* Name underline */}
                              <rect x="55" y="75" width="90" height="2" fill="#f093fb"/>
                              {/* Signatures */}
                              <line x1="50" y1="105" x2="80" y2="105" stroke="#764ba2" strokeWidth="1"/>
                              <line x1="120" y1="105" x2="150" y2="105" stroke="#764ba2" strokeWidth="1"/>
                            </svg>
                          )}
                          {template.id === "minimal" && (
                            <svg viewBox="0 0 200 140" className="w-full h-full">
                              {/* White background */}
                              <rect width="200" height="140" fill="white"/>
                              {/* Double black border */}
                              <rect x="10" y="10" width="180" height="120" fill="none" stroke="black" strokeWidth="2.5"/>
                              <rect x="14" y="14" width="172" height="112" fill="none" stroke="black" strokeWidth="1"/>
                              {/* Corner accents - Black */}
                              <path d="M10,10 L22,10 M10,10 L10,22" stroke="black" strokeWidth="2" fill="none"/>
                              <path d="M190,10 L178,10 M190,10 L190,22" stroke="black" strokeWidth="2" fill="none"/>
                              <path d="M10,130 L22,130 M10,130 L10,118" stroke="black" strokeWidth="2" fill="none"/>
                              <path d="M190,130 L178,130 M190,130 L190,118" stroke="black" strokeWidth="2" fill="none"/>
                              {/* Title */}
                              <text x="100" y="38" textAnchor="middle" fontFamily="Helvetica" fontSize="13" fontWeight="300" fill="black" letterSpacing="3">CERTIFICATE</text>
                              {/* Simple black badge */}
                              <rect x="70" y="45" width="60" height="11" fill="black"/>
                              {/* Name underline */}
                              <rect x="60" y="72" width="80" height="2" fill="black"/>
                              {/* Simple decorative line */}
                              <line x1="75" y1="82" x2="125" y2="82" stroke="black" strokeWidth="0.8"/>
                              {/* Event info boxes */}
                              <rect x="55" y="95" width="35" height="10" fill="none" stroke="#666" strokeWidth="0.5"/>
                              <rect x="110" y="95" width="35" height="10" fill="none" stroke="#666" strokeWidth="0.5"/>
                              {/* Signatures */}
                              <line x1="40" y1="120" x2="75" y2="120" stroke="black" strokeWidth="1"/>
                              <line x1="125" y1="120" x2="160" y2="120" stroke="black" strokeWidth="1"/>
                            </svg>
                          )}
                        </div>
                        <p className="text-sm font-black text-gray-900 dark:text-white">
                          {template.name}
                        </p>
                        {generateOptions.template === template.id && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-[#191A23] rounded-full flex items-center justify-center">
                            <CheckCircle
                              size={14}
                              className="text-[#B9FF66]"
                              strokeWidth={2.5}
                            />
                          </div>
                        )}
                      </button>
                      {/* Preview Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewTemplate(template.id);
                          setShowPreview(true);
                        }}
                        className="absolute bottom-3 right-3 p-2 bg-[#191A23] hover:bg-[#B9FF66] text-white hover:text-[#191A23] rounded-lg transition-all duration-200 shadow-lg z-10"
                        title="Preview Template"
                      >
                        <Eye size={16} strokeWidth={2.5} />
                      </button>
                    </div>
                    ))}
                  </div>
                </div>

                {/* Options */}
                <div className="bg-[#B9FF66]/10 rounded-2xl p-6 border border-[#B9FF66]/30 space-y-6">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-[#B9FF66] rounded-full"></span>
                    Generation Options
                  </h3>
                  
                  {/* Certificate Type Selection */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 dark:text-zinc-300 mb-3">
                      Certificate Type
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { value: 'participation', label: 'Participation', achievement: 'Participation', icon: '🎓' },
                        { value: 'winner', label: 'Winner / 1st Place', achievement: 'Winner', icon: '🥇' },
                        { value: 'second', label: '2nd Place', achievement: 'Second Place', icon: '🥈' },
                        { value: 'third', label: '3rd Place', achievement: 'Third Place', icon: '🥉' },
                      ].map((type) => (
                        <button
                          key={type.value}
                          onClick={() => {
                            setGenerateOptions({
                              ...generateOptions,
                              certificateType: type.value,
                              achievement: type.achievement,
                              includeAll: type.value === 'participation',
                              selectedParticipants: type.value === 'participation' ? [] : generateOptions.selectedParticipants,
                            });
                          }}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                            generateOptions.certificateType === type.value
                              ? 'border-[#191A23] bg-[#B9FF66]/20 shadow-lg'
                              : 'border-gray-200 dark:border-white/10 hover:border-[#B9FF66] bg-white dark:bg-white/[0.03]'
                          }`}
                        >
                          <div className="text-2xl mb-2">{type.icon}</div>
                          <div className="text-sm font-bold text-gray-900 dark:text-white">
                            {type.label}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bulk generation checkbox (only for participation) */}
                  {generateOptions.certificateType === 'participation' && (
                    <label className="flex items-center gap-4 cursor-pointer group">
                      <input
                        type="checkbox" 
                        checked={generateOptions.includeAll}
                        onChange={(e) =>
                          setGenerateOptions({
                            ...generateOptions,
                            includeAll: e.target.checked,
                            selectedParticipants: e.target.checked ? [] : generateOptions.selectedParticipants,
                          })
                        }
                        className="w-5 h-5 rounded border-gray-300 text-[#191A23] focus:ring-[#B9FF66] group-hover:scale-105 transition-transform"
                      />
                      <span className="text-gray-800 dark:text-zinc-300 font-bold group-hover:text-[#191A23] dark:group-hover:text-white transition-colors">
                        Generate for all participants who attended the event
                      </span>
                    </label>
                  )}

                  {/* Participant Selection (for winner certificates or when not generating for all) */}
                  {(generateOptions.certificateType !== 'participation' || !generateOptions.includeAll) && (
                    <div>
                      <label className="block text-sm font-bold text-gray-800 dark:text-zinc-300 mb-2">
                        Select Participant(s)
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <ParticipantSelector
                        eventId={selectedEvent}
                        selectedParticipants={generateOptions.selectedParticipants}
                        onChange={(selected) =>
                          setGenerateOptions({
                            ...generateOptions,
                            selectedParticipants: selected,
                          })
                        }
                        certificateType={generateOptions.certificateType}
                      />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="bg-[#191A23]/5 rounded-2xl p-6 flex items-start gap-4 border border-[#191A23]/10">
                  <div className="p-2 bg-[#B9FF66]/20 rounded-xl">
                    <AlertCircle
                      size={20}
                      className="text-[#191A23]"
                      strokeWidth={2.5}
                    />
                  </div>
                  <div>
                    <p className="text-[#191A23] dark:text-white font-black text-lg">
                      Certificate Generation
                    </p>
                    <p className="text-gray-700 dark:text-zinc-400 font-semibold mt-2">
                      {generateOptions.certificateType === 'participation' 
                        ? (generateOptions.includeAll 
                            ? 'Certificates will be generated for all participants who have marked attendance. You can send them individually or in bulk after generation.'
                            : 'Certificates will be generated for the selected participants. Make sure participants have marked attendance.')
                        : `Generate ${generateOptions.achievement} certificates for specific participants. The selected event name will be used on the certificate. Make sure participants have marked attendance.`
                      }
                    </p>
                  </div>
                </div>

                {/* Generate Button */}
                <div className="flex justify-center pt-4">
                  {/* Certificate Status Warning */}
                  {selectedEvent && events.find(e => e._id === selectedEvent)?.enableCertificates === false && (
                    <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
                      <AlertCircle size={20} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
                          Certificates Not Enabled
                        </h4>
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                          Certificate generation is disabled for this event. Please contact the admin to enable certificates in the event settings.
                        </p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleGenerateCertificates}
                    disabled={generating || (selectedEvent && events.find(e => e._id === selectedEvent)?.enableCertificates === false)}
                    className="group flex items-center gap-3 px-10 py-4 bg-[#191A23] text-[#B9FF66] rounded-2xl hover:shadow-2xl hover:scale-105 transition-all font-bold disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-lg disabled:cursor-not-allowed"
                    title={
                      selectedEvent && events.find(e => e._id === selectedEvent)?.enableCertificates === false
                        ? 'Certificates are not enabled for this event'
                        : generating
                          ? 'Generating certificates...'
                          : generateOptions.certificateType === 'participation'
                            ? (generateOptions.includeAll 
                                ? 'Generate certificates for all participants who attended'
                                : 'Generate certificates for selected participant(s)')
                            : `Generate ${generateOptions.achievement} certificate for selected participant(s)`
                    }
                  >
                    {generating ? (
                      <RefreshCw
                        size={20}
                        strokeWidth={2.5}
                        className="animate-spin"
                      />
                    ) : (
                      <Award
                        size={20}
                        strokeWidth={2.5}
                        className="group-hover:scale-110 transition-transform"
                      />
                    )}
                    {generating
                      ? "Generating Certificates..."
                      : generateOptions.certificateType === 'participation'
                        ? (generateOptions.includeAll ? "Generate Certificates" : "Generate Selected Certificates")
                        : `Generate ${generateOptions.achievement} Certificate`}
                  </button>
                </div>
              </div>
            )}

            {activeTab === "distribution" && (
              <div className="space-y-6">
                {/* Actions Bar */}
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="relative flex-1">
                    <Search
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                      strokeWidth={2}
                    />
                    <input
                      type="text"
                      placeholder="Search by name, email, or certificate ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B9FF66] focus:border-[#B9FF66] bg-white/80 dark:bg-white/5 backdrop-blur-sm font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500"
                    />
                  </div>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-6 py-3 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B9FF66] focus:border-[#B9FF66] bg-white/80 dark:bg-white/5 backdrop-blur-sm font-bold text-gray-700 dark:text-zinc-300"
                  >
                    <option value="all">All Status</option>
                    <option value="SENT">Sent</option>
                    <option value="GENERATED">Pending</option>
                    <option value="FAILED">Failed</option>
                  </select>

                  {selectedCertificates.length > 0 && (
                    <button
                      onClick={handleSendSelectedCertificates}
                      disabled={sending}
                      className="flex items-center gap-2 px-6 py-2.5 bg-[#191A23] text-[#B9FF66] rounded-xl hover:bg-[#2A2B33] transition-colors disabled:opacity-50"
                    >
                      {sending ? (
                        <RefreshCw size={18} className="animate-spin" />
                      ) : (
                        <Send size={18} />
                      )}
                      Send Selected ({selectedCertificates.length})
                    </button>
                  )}

                  <button
                    onClick={handleSendAllPending}
                    disabled={sending || stats.pending === 0}
                    className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:shadow-xl hover:scale-105 transition-all font-bold disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {sending ? (
                      <RefreshCw
                        size={18}
                        strokeWidth={2.5}
                        className="animate-spin"
                      />
                    ) : (
                      <Send
                        size={18}
                        strokeWidth={2.5}
                        className="group-hover:scale-110 transition-transform"
                      />
                    )}
                    Send All Pending
                  </button>
                </div>

                {/* Email Sending Info */}
                {(stats.pending > 0 || selectedCertificates.length > 0) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                    <Mail
                      size={20}
                      className="text-blue-600 mt-0.5 flex-shrink-0"
                    />
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-blue-800 mb-1">
                        Email Distribution Options
                      </h4>
                      <ul className="text-xs text-blue-700 space-y-1">
                        <li>
                          • <strong>Send All Pending:</strong> Sends
                          certificates to all participants with GENERATED status
                        </li>
                        <li>
                          • <strong>Send Selected:</strong> Select specific
                          certificates using checkboxes and send them in bulk
                        </li>
                        <li>
                          • <strong>Individual Send:</strong> Use the{" "}
                          <Mail size={12} className="inline" /> icon next to
                          each certificate to send individually
                        </li>
                        <li>
                          • Certificates are sent to participants' registered
                          email addresses
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Certificate List */}
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#191A23] mx-auto"></div>
                    <p className="text-gray-500 dark:text-zinc-400 mt-4">
                      Loading certificates...
                    </p>
                  </div>
                ) : filteredCertificates.length === 0 ? (
                  <div className="text-center py-12">
                    <Award
                      size={48}
                      className="mx-auto text-gray-300 dark:text-zinc-600 mb-4"
                    />
                    <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                      No certificates found
                    </h3>
                    <p className="text-gray-500 dark:text-zinc-400">
                      Generate certificates first to see them here.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-white/[0.03] border-b border-gray-100 dark:border-white/5">
                        <tr>
                          <th className="text-left px-4 py-3">
                            <input
                              type="checkbox"
                              checked={
                                selectedCertificates.length ===
                                filteredCertificates.length &&
                                filteredCertificates.length > 0
                              }
                              onChange={toggleSelectAll}
                              className="rounded border-gray-300 text-[#191A23] focus:ring-[#B9FF66]"
                            />
                          </th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-zinc-400">
                            Certificate ID
                          </th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-zinc-400">
                            Participant
                          </th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-zinc-400">
                            Email
                          </th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-zinc-400">
                            Status
                          </th>
                          <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-zinc-400">
                            Issued
                          </th>
                          <th className="text-right px-4 py-3 text-sm font-medium text-gray-500 dark:text-zinc-400">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                        {filteredCertificates.map((cert) => (
                          <tr
                            key={cert._id}
                            className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02]"
                          >
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selectedCertificates.includes(
                                  cert._id,
                                )}
                                onChange={() =>
                                  toggleCertificateSelection(cert._id)
                                }
                                className="rounded border-gray-300 text-[#191A23] focus:ring-[#B9FF66]"
                              />
                            </td>
                            <td className="px-4 py-3 font-mono text-sm text-gray-600 dark:text-zinc-400">
                              {cert.certificateId}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className={`font-medium ${cert.status === 'REVOKED' || !cert.isValid
                                  ? 'line-through text-red-500 dark:text-red-400'
                                  : 'text-gray-800 dark:text-white'
                                  }`}>
                                  {cert.participant?.name}
                                </span>
                                {(cert.status === 'REVOKED' || !cert.isValid) && (
                                  <span
                                    className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 text-xs rounded-full font-semibold border border-red-200 dark:border-red-800"
                                    title={cert.revocationReason || 'Certificate has been revoked'}
                                  >
                                    REVOKED
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-zinc-400">
                              {cert.participant?.email}
                            </td>
                            <td className="px-4 py-3">
                              {statusBadge(cert.status)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-zinc-500">
                              {new Date(cert.issuedAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    const url =
                                      cert.cloudinaryUrl ||
                                      (cert.certificateUrl
                                        ? `http://localhost:5000${cert.certificateUrl}`
                                        : null);
                                    if (url) window.open(url, "_blank");
                                  }}
                                  disabled={
                                    !cert.cloudinaryUrl && !cert.certificateUrl
                                  }
                                  className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Preview"
                                >
                                  <Eye size={16} />
                                </button>
                                <a
                                  href={
                                    cert.cloudinaryUrl ||
                                    (cert.certificateUrl
                                      ? `http://localhost:5000${cert.certificateUrl}`
                                      : "#")
                                  }
                                  download={
                                    cert.pdfFilename ||
                                    `Certificate_${cert.participant?.name}.jpg`
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-white ${!cert.cloudinaryUrl && !cert.certificateUrl ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
                                  title="Download"
                                  onClick={(e) => {
                                    if (
                                      !cert.cloudinaryUrl &&
                                      !cert.certificateUrl
                                    ) {
                                      e.preventDefault();
                                      alert("Certificate not available");
                                    }
                                  }}
                                >
                                  <Download size={16} />
                                </a>
                                {cert.status !== "SENT" && (
                                  <button
                                    onClick={() =>
                                      handleResendCertificate(
                                        cert._id,
                                        cert.participant?.name,
                                        cert.participant?.email,
                                      )
                                    }
                                    disabled={sendingCertId === cert._id}
                                    className="p-2 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg text-gray-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed relative"
                                    title="Send via Email"
                                  >
                                    {sendingCertId === cert._id ? (
                                      <RefreshCw
                                        size={16}
                                        className="animate-spin"
                                      />
                                    ) : (
                                      <Mail size={16} />
                                    )}
                                  </button>
                                )}
                                {cert.status === "SENT" && (
                                  <button
                                    onClick={() =>
                                      handleResendCertificate(
                                        cert._id,
                                        cert.participant?.name,
                                        cert.participant?.email,
                                      )
                                    }
                                    disabled={sendingCertId === cert._id}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Resend via Email"
                                  >
                                    {sendingCertId === cert._id ? (
                                      <RefreshCw
                                        size={16}
                                        className="animate-spin"
                                      />
                                    ) : (
                                      <RefreshCw size={16} />
                                    )}
                                  </button>
                                )}
                                {/* Revoke Certificate Button */}
                                <button
                                  onClick={() => {
                                    setSelectedCertificate(cert);
                                    setShowRevokeModal(true);
                                  }}
                                  disabled={cert.status === 'REVOKED' || !cert.isValid}
                                  className="p-2 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-gray-500 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={cert.status === 'REVOKED' ? 'Already Revoked' : 'Revoke Certificate'}
                                >
                                  <ShieldAlert size={16} />
                                </button>
                                {/* View Audit Trail Button */}
                                <button
                                  onClick={() => {
                                    setSelectedCertificate(cert);
                                    setShowAuditTrail(true);
                                  }}
                                  className="p-2 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg text-gray-500 hover:text-blue-600"
                                  title="View Audit Trail"
                                >
                                  <History size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Retroactive Change & Audit Trail Modals */}
      <RevokeCertificateModal
        isOpen={showRevokeModal}
        onClose={() => {
          setShowRevokeModal(false);
          setSelectedCertificate(null);
        }}
        certificate={selectedCertificate}
        onSuccess={() => {
          fetchCertificates();
          fetchCertificateStats();
        }}
      />

      <AuditTrailViewer
        isOpen={showAuditTrail}
        onClose={() => {
          setShowAuditTrail(false);
          setSelectedCertificate(null);
        }}
        entityType="certificate"
        entityId={selectedCertificate?._id}
        eventId={selectedEvent}
      />

      {/* Template Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10">
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                  Certificate Preview
                </h2>
                <p className="text-sm text-gray-600 dark:text-zinc-400 font-semibold mt-1">
                  {templates.find(t => t.id === previewTemplate)?.name}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowPreview(false);
                  setPreviewTemplate(null);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"
              >
                <X size={24} className="text-gray-600 dark:text-white" strokeWidth={2} />
              </button>
            </div>

            {/* Modal Body - Certificate Preview */}
            <div className="p-8 overflow-y-auto max-h-[calc(90vh-100px)]">
              <div className="bg-gray-100 dark:bg-black/20 p-4 rounded-xl">
                <div className="bg-white shadow-2xl mx-auto" style={{ aspectRatio: '297/210', maxWidth: '100%' }}>
                  {previewTemplate === 'default' && (
                    <div className="w-full h-full relative" style={{ background: 'linear-gradient(135deg, #faf8f5 0%, #f5f0e8 100%)' }}>
                      {/* Brown curved decorative elements */}
                      <div className="absolute top-0 left-0 w-48 h-48 rounded-full" style={{ background: 'radial-gradient(circle, #8b6f47 0%, #a68a5f 50%, transparent 70%)', opacity: 0.15, transform: 'translate(-40%, -40%)' }}></div>
                      <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full" style={{ background: 'radial-gradient(circle, #a68a5f 0%, #c4a876 50%, transparent 70%)', opacity: 0.15, transform: 'translate(40%, 40%)' }}></div>
                      
                      {/* Border frame */}
                      <div className="absolute inset-8 border-2 border-[#8b6f47]"></div>
                      
                      {/* Content */}
                      <div className="relative h-full flex flex-col items-center justify-center p-12 text-center">
                        <div className="space-y-1 mb-6">
                          <p className="text-lg font-bold text-[#3e2723]">Your Organization Name</p>
                          <p className="text-sm text-[#5d4037]">Department Name</p>
                        </div>
                        
                        <h1 className="text-4xl font-bold text-[#6d4c41] tracking-[6px] mb-2">
                          CERTIFICATE
                        </h1>
                        <p className="text-base text-[#8b6f47] tracking-[3px] mb-8 font-semibold">OF ACHIEVEMENT</p>
                        
                        <div className="w-32 h-[2px] bg-[#8b6f47] mx-auto mb-6"></div>
                        
                        <p className="text-sm text-[#5d4037] mb-4">This certificate is proudly presented to</p>
                        
                        <div className="my-6">
                          <p className="text-5xl font-bold text-[#3e2723] px-8" style={{ fontFamily: '"Brush Script MT", cursive' }}>
                            John Doe
                          </p>
                        </div>
                        
                        <p className="text-sm text-[#3e2723] max-w-xl leading-relaxed mb-8">
                          For outstanding performance in "Competition Name", held as part of Event Name 2026, organized on February 16, 2026.
                        </p>
                        
                        {/* Center seal */}
                        <div className="w-16 h-16 rounded-full border-4 border-[#8b6f47] flex items-center justify-center shadow-lg mb-8" style={{ background: 'linear-gradient(135deg, #8b6f47 0%, #a68a5f 100%)' }}>
                          <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center">
                            <span className="text-white text-[10px] font-bold">VERIFIED</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-around w-full max-w-2xl mt-8">
                          <div className="text-center">
                            <div className="border-t border-gray-800 pt-2 w-32">
                              <p className="text-xs font-bold text-[#3e2723]">Signature 1</p>
                              <p className="text-[10px] text-[#5d4037]">Title 1</p>
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="border-t border-gray-800 pt-2 w-32">
                              <p className="text-xs font-bold text-[#3e2723]">Signature 2</p>
                              <p className="text-[10px] text-[#5d4037]">Title 2</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {previewTemplate === 'professional' && (
                    <div className="w-full h-full relative" style={{ background: 'linear-gradient(to bottom, #f8f9fa 0%, #ffffff 100%)' }}>
                      {/* Border frame with shadow */}
                      <div className="absolute top-8 left-8 right-8 bottom-8 border-2 border-[#2c3e50] bg-white shadow-xl"></div>
                      
                      {/* Professional corner accents */}
                      <div className="absolute top-8 left-8 w-24 h-24 border-t-[6px] border-l-[6px] border-[#34495e]">
                        <div className="absolute top-0 left-0 w-12 h-12 bg-[#ecf0f1]" style={{ marginTop: '-6px', marginLeft: '-6px' }}></div>
                      </div>
                      <div className="absolute top-8 right-8 w-24 h-24 border-t-[6px] border-r-[6px] border-[#34495e]">
                        <div className="absolute top-0 right-0 w-12 h-12 bg-[#ecf0f1]" style={{ marginTop: '-6px', marginRight: '-6px' }}></div>
                      </div>
                      
                      {/* Top header bar */}
                      <div className="absolute top-8 left-8 right-8 h-20" style={{ background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)', borderBottom: '4px solid #3498db' }}>
                        <div className="h-full flex flex-col items-center justify-center">
                          <p className="text-white text-base font-bold tracking-[3px]">YOUR ORGANIZATION</p>
                          <p className="text-[#ecf0f1] text-xs mt-1">Department Name</p>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="relative h-full flex flex-col items-center justify-center p-16 text-center pt-28">
                        <h1 className="text-4xl font-bold text-[#2c3e50] tracking-[6px] mb-2">CERTIFICATE</h1>
                        <p className="text-base text-[#3498db] tracking-[3px] mb-10 font-semibold">OF ACHIEVEMENT</p>
                        
                        <p className="text-sm text-gray-600 italic mb-6">This is proudly presented to</p>
                        
                        <div className="mb-8">
                          <p className="text-5xl font-bold text-[#2c3e50] border-b-2 border-[#3498db] pb-3 px-8 inline-block">
                            John Doe
                          </p>
                        </div>
                        
                        <p className="text-sm text-[#2c3e50] max-w-xl leading-relaxed mb-6">
                          For exceptional performance in "Competition Name", held as part of Event Name, organized by Your Organization.
                        </p>
                        
                        {/* Date badge */}
                        <div className="absolute bottom-16 right-20 bg-[#ecf0f1] border-2 border-[#34495e] px-4 py-2 text-center shadow-md">
                          <p className="text-[10px] text-[#7f8c8d] uppercase tracking-wider">Date</p>
                          <p className="text-xs font-bold text-[#2c3e50]">Feb 16, 2026</p>
                        </div>
                        
                        <div className="flex justify-around w-full max-w-2xl mt-12">
                          <div className="text-center">
                            <div className="border-t border-gray-800 pt-2 w-32">
                              <p className="text-xs font-bold text-[#2c3e50]">Signature 1</p>
                              <p className="text-[10px] text-gray-600">Title 1</p>
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="border-t border-gray-800 pt-2 w-32">
                              <p className="text-xs font-bold text-[#2c3e50]">Signature 2</p>
                              <p className="text-[10px] text-gray-600">Title 2</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {previewTemplate === 'modern' && (
                    <div className="w-full h-full relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)' }}>
                      {/* Floating geometric shapes */}
                      <div className="absolute left-16 top-24 w-40 h-40 opacity-20" style={{ 
                        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                        borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
                        transform: 'rotate(-20deg)'
                      }}></div>
                      <div className="absolute right-16 bottom-24 w-48 h-48 opacity-20" style={{ 
                        background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                        borderRadius: '50% 50% 30% 70% / 60% 40% 60% 40%',
                        transform: 'rotate(15deg)'
                      }}></div>
                      
                      {/* Inner white card */}
                      <div className="absolute top-16 left-40 right-40 bottom-16 bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl">
                        {/* Colorful accent line */}
                        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-40 h-1 rounded-full" style={{ background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 25%, #f093fb 50%, #f5576c 75%, #fa709a 100%)' }}></div>
                        
                        {/* Content */}
                        <div className="h-full flex flex-col items-center justify-center p-16 text-center pt-20">
                          <div className="mb-6">
                            <p className="text-lg font-bold tracking-[3px]" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>YOUR ORGANIZATION</p>
                            <p className="text-sm text-[#666] mt-1">Department Name</p>
                          </div>
                          
                          <h1 className="text-5xl font-bold tracking-[8px] mb-2" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>CERTIFICATE</h1>
                          <p className="text-base tracking-[3px] mb-10 font-semibold" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>OF ACHIEVEMENT</p>
                          
                          <p className="text-sm text-gray-600 italic mb-6">This certificate is presented to</p>
                          
                          <div className="mb-8 relative">
                            <p className="text-5xl font-bold inline-block pb-3" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                              John Doe
                            </p>
                            <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)' }}></div>
                          </div>
                          
                          <p className="text-sm text-[#2c3e50] max-w-lg leading-relaxed mb-6">
                            For outstanding achievement in "Competition Name", held as part of Event Name, organized by Your Organization.
                          </p>
                          
                          <div className="flex justify-around w-full max-w-xl mt-8">
                            <div className="text-center">
                              <div className="border-t border-gray-800 pt-2 w-28">
                                <p className="text-xs font-bold text-[#2c3e50]">Signature 1</p>
                                <p className="text-[10px] text-gray-600">Title 1</p>
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="border-t border-gray-800 pt-2 w-28">
                                <p className="text-xs font-bold text-[#2c3e50]">Signature 2</p>
                                <p className="text-[10px] text-gray-600">Title 2</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {previewTemplate === 'minimal' && (
                    <div className="w-full h-full relative bg-white p-16">
                      {/* Double border frame - Black */}
                      <div className="absolute top-10 left-10 right-10 bottom-10 border-[3px] border-black"></div>
                      <div className="absolute inset-[52px] border border-black"></div>
                      
                      {/* Corner accents - Black */}
                      <div className="absolute top-12 left-12 w-8 h-8 border-t-2 border-l-2 border-black"></div>
                      <div className="absolute top-12 right-12 w-8 h-8 border-t-2 border-r-2 border-black"></div>
                      <div className="absolute bottom-12 left-12 w-8 h-8 border-b-2 border-l-2 border-black"></div>
                      <div className="absolute bottom-12 right-12 w-8 h-8 border-b-2 border-r-2 border-black"></div>
                      
                      {/* Content */}
                      <div className="relative h-full flex flex-col items-center justify-center text-center pt-8">
                        <div className="mb-8">
                          <p className="text-lg font-semibold text-black tracking-[3px]">YOUR ORGANIZATION</p>
                          <p className="text-sm text-[#666] mt-1">Department Name</p>
                        </div>
                        
                        <h1 className="text-5xl font-light text-black tracking-[10px] mb-6">CERTIFICATE</h1>
                        
                        {/* Title badge - Black rectangle */}
                        <div className="w-40 h-12 mb-8 flex items-center justify-center bg-black">
                          <span className="text-white text-xs font-bold tracking-[2px]">ACHIEVEMENT</span>
                        </div>
                        
                        <p className="text-sm text-[#666] tracking-[2px] mb-6">Proudly Presented To</p>
                        
                        <div className="mb-8">
                          <p className="text-4xl font-bold text-black border-b-2 border-black pb-2 px-8 inline-block">
                            John Doe
                          </p>
                        </div>
                        
                        <div className="w-48 h-[1px] bg-black mx-auto my-6"></div>
                        
                        <p className="text-sm text-[#333] max-w-xl leading-relaxed mb-6">
                          For remarkable performance in "Competition Name", held as part of Event Name, organized by Your Organization.
                        </p>
                        
                        {/* Event info */}
                        <div className="flex gap-12 mt-6 mb-10">
                          <div className="text-center">
                            <p className="text-[10px] text-[#666] tracking-wider">DATE</p>
                            <p className="text-sm font-semibold text-black">Feb 16, 2026</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-[#666] tracking-wider">EVENT</p>
                            <p className="text-sm font-semibold text-black">Event Name</p>
                          </div>
                        </div>
                        
                        <div className="flex justify-around w-full max-w-2xl mt-8">
                          <div className="text-center">
                            <div className="border-t border-black pt-2 w-32">
                              <p className="text-xs font-bold text-black">Signature 1</p>
                              <p className="text-[10px] text-[#666]">Title 1</p>
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="border-t border-black pt-2 w-32">
                              <p className="text-xs font-bold text-black">Signature 2</p>
                              <p className="text-[10px] text-[#666]">Title 2</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Certificates;
