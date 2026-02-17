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
      name: "Golden Border Classic",
      preview: `/previews/default_preview.jpg`,
      description: "Triple golden border with elegant formal design"
    },
    {
      id: "professional",
      name: "Professional Blue",
      preview: `/previews/professional_preview.jpg`,
      description: "Corporate blue theme with geometric accents"
    },
    { 
      id: "modern", 
      name: "Modern Gradient", 
      preview: `/previews/modern_preview.jpg`,
      description: "Stylish purple gradient with contemporary design"
    },
    { 
      id: "minimal", 
      name: "Minimal Black & White", 
      preview: `/previews/minimal_preview.jpg`,
      description: "Clean minimalist design with double border"
    },
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
                      <div
                        key={template.id}
                        onClick={() =>
                          setGenerateOptions({
                            ...generateOptions,
                            template: template.id,
                          })
                        }
                        role="button"
                        tabIndex={0}
                        className={`relative p-6 rounded-2xl border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer ${generateOptions.template === template.id
                          ? "border-[#191A23] bg-[#B9FF66]/10 shadow-lg"
                          : "border-gray-200 dark:border-white/10 hover:border-[#B9FF66] bg-white dark:bg-white/[0.03]"
                          }`}
                      >
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <p className="text-base font-black text-gray-900 dark:text-white">
                              {template.name}
                            </p>
                            {template.description && (
                              <p className="text-xs text-gray-600 dark:text-zinc-400 line-clamp-2">
                                {template.description}
                              </p>
                            )}
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewTemplate(template.id);
                              setShowPreview(true);
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/5 hover:bg-[#191A23] hover:text-[#B9FF66] rounded-lg transition-all duration-200 text-sm font-semibold"
                          >
                            <Eye size={16} strokeWidth={2.5} />
                            Preview
                          </button>
                        </div>
                        
                        {generateOptions.template === template.id && (
                          <div className="absolute top-3 right-3 w-6 h-6 bg-[#191A23] rounded-full flex items-center justify-center">
                            <CheckCircle
                              size={14}
                              className="text-[#B9FF66]"
                              strokeWidth={2.5}
                            />
                          </div>
                        )}
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
              <div className="bg-gray-100 dark:bg-black/20 p-8 rounded-xl flex items-center justify-center">
                <img 
                  src={templates.find(t => t.id === previewTemplate)?.preview}
                  alt={templates.find(t => t.id === previewTemplate)?.name}
                  className="max-w-full h-auto shadow-2xl rounded-lg"
                  style={{ maxHeight: 'calc(90vh - 300px)' }}
                />
              </div>
              <div className="mt-6 text-center">
                <p className="text-gray-600 dark:text-zinc-400 text-sm">
                  {templates.find(t => t.id === previewTemplate)?.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Certificates;
