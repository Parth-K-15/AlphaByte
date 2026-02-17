import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ScaleUp } from "../../components/participant/ScrollAnimations";
import { getEventImageUrl } from "../../utils/eventImageResolver";
import {
  Calendar,
  MapPin,
  Users,
  Tag,
  Clock,
  ArrowLeft,
  CheckCircle,
  X,
  ArrowUpRight,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const API_BASE = "http://localhost:5000/api";

const EventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    college: "",
    year: "",
    branch: "",
  });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [rulebookExpanded, setRulebookExpanded] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    fetchEventDetails();
    if (profile?.email) {
      checkRegistration();
    }
  }, [eventId, profile]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${API_BASE}/participant/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setProfile(data.data);
        setFormData({
          fullName: data.data.name || "",
          email: data.data.email || "",
          phone: data.data.phone || "",
          college: data.data.college || "",
          year: data.data.year || "",
          branch: data.data.branch || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/participant/events/${eventId}`);
      const data = await response.json();

      if (data.success) {
        setEvent(data.data);
      } else {
        setMessage({ type: "error", text: data.message || "Event not found" });
      }
    } catch (error) {
      console.error("Error fetching event:", error);
      setMessage({ type: "error", text: "Failed to load event details" });
    } finally {
      setLoading(false);
    }
  };

  const checkRegistration = async () => {
    if (!profile?.email) return;

    try {
      const response = await fetch(
        `${API_BASE}/participant/registration/${eventId}?email=${encodeURIComponent(profile.email)}`,
      );
      const data = await response.json();

      if (data.success && data.isRegistered) {
        setIsRegistered(true);
        setRegistration(data.data);
      }
    } catch (error) {
      console.error("Error checking registration:", error);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email) {
      setMessage({ type: "error", text: "Name and email are required" });
      return;
    }

    try {
      setRegistering(true);
      const response = await fetch(`${API_BASE}/participant/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          ...formData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsRegistered(true);
        setRegistration(data.data);
        setShowRegisterModal(false);
        setMessage({ type: "success", text: "Registration successful!" });
      } else {
        setMessage({ type: "error", text: data.message });
      }
    } catch (error) {
      console.error("Error registering:", error);
      setMessage({
        type: "error",
        text: "Registration failed. Please try again.",
      });
    } finally {
      setRegistering(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!confirm("Are you sure you want to cancel your registration?")) return;

    try {
      const response = await fetch(
        `${API_BASE}/participant/registration/${eventId}?email=${encodeURIComponent(profile?.email)}`,
        { method: "DELETE" },
      );

      const data = await response.json();

      if (data.success) {
        setIsRegistered(false);
        setRegistration(null);
        setMessage({ type: "success", text: "Registration cancelled" });
      } else {
        setMessage({ type: "error", text: data.message });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to cancel registration" });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "TBA";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getUpdateTypeBadge = (type) => {
    const badges = {
      INFO: "bg-lime/20 text-dark",
      WARNING: "bg-yellow-100 text-yellow-800",
      URGENT: "bg-red-100 text-red-800",
      ANNOUNCEMENT: "bg-dark text-white",
    };
    return badges[type] || badges.INFO;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-dark rounded-3xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">😕</span>
        </div>
        <h2 className="text-2xl font-bold text-dark dark:text-white mb-2">
          Event Not Found
        </h2>
        <button
          onClick={() => navigate("/participant")}
          className="text-dark dark:text-zinc-300 font-bold hover:text-dark/70 dark:hover:text-zinc-100 flex items-center gap-2 mx-auto"
        >
          <ArrowLeft size={16} /> Back to Events
        </button>
      </div>
    );
  }

  const statusColors = {
    upcoming: "bg-lime text-dark",
    ongoing: "bg-dark text-lime",
    completed: "bg-light-400 text-dark-300",
    draft: "bg-yellow-100 text-yellow-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
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

      {/* Back Button */}
      <button
        onClick={() => navigate("/participant")}
        className="flex items-center gap-2 text-dark-300 dark:text-zinc-400 hover:text-dark dark:hover:text-white font-bold text-sm transition-colors"
      >
        <ArrowLeft size={16} /> Back to Events
      </button>

      {/* Event Header */}
      <ScaleUp>
      <div className="bg-white dark:bg-white/[0.03] rounded-3xl shadow-card dark:shadow-none overflow-hidden border border-light-400/50 dark:border-white/5">
        {/* Banner */}
        <div className="h-48 md:h-64 bg-dark relative overflow-hidden">
          <img
            src={getEventImageUrl(event || {})}
            alt={event.title || "Event"}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/60 to-transparent"></div>

          {/* Decorative lime accent */}
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-lime/10 rounded-full blur-3xl"></div>

          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="flex items-center gap-3 mb-3">
              <span
                className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${statusColors[event.status]}`}
              >
                {event.status}
              </span>
              {event.type && (
                <span className="px-3 py-1.5 bg-white/10 rounded-full text-xs font-medium text-white backdrop-blur-sm">
                  {event.type}
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">{event.title}</h1>
          </div>
        </div>

        {/* Event Info */}
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column - Details */}
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-light-300 dark:bg-white/5">
                <div className="p-2 bg-dark rounded-xl text-lime">
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="font-bold text-dark dark:text-white text-sm">
                    Date
                  </p>
                  <p className="text-dark-300 dark:text-zinc-400 text-sm">
                    {formatDate(event.startDate)}
                  </p>
                  {event.endDate && event.endDate !== event.startDate && (
                    <p className="text-dark-200 dark:text-zinc-500 text-xs">
                      to {formatDate(event.endDate)}
                    </p>
                  )}
                  {event.time && (
                    <p className="text-dark-200 text-xs flex items-center gap-1 mt-1">
                      <Clock size={12} /> {event.time}
                    </p>
                  )}
                </div>
              </div>

              {(event.venue || event.location) && (
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-light-300 dark:bg-white/5">
                  <div className="p-2 bg-lime rounded-xl text-dark">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-dark dark:text-white text-sm">
                      Venue
                    </p>
                    <p className="text-dark-300 dark:text-zinc-400 text-sm">
                      {event.venue || event.location}
                    </p>
                    {event.address && (
                      <p className="text-dark-200 dark:text-zinc-500 text-xs">
                        {event.address}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {event.teamLead && (
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-light-300 dark:bg-white/5">
                  <div className="p-2 bg-dark rounded-xl text-lime">
                    <Users size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-dark dark:text-white text-sm">
                      Organizer
                    </p>
                    <p className="text-dark-300 dark:text-zinc-400 text-sm">
                      {event.teamLead.name}
                    </p>
                  </div>
                </div>
              )}

              {event.category && (
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-light-300 dark:bg-white/5">
                  <div className="p-2 bg-lime rounded-xl text-dark">
                    <Tag size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-dark dark:text-white text-sm">
                      Category
                    </p>
                    <p className="text-dark-300 dark:text-zinc-400 text-sm">
                      {event.category}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Registration */}
            <div className="bg-dark rounded-3xl p-6 text-white">
              <div className="text-center mb-5">
                <p className="text-3xl font-black text-lime">
                  {event.registrationFee > 0
                    ? `₹${event.registrationFee}`
                    : "FREE"}
                </p>
                <p className="text-dark-200 text-sm mt-1">Registration Fee</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-dark-200">Registered</span>
                  <span className="font-bold">
                    {event.participantCount || 0}
                  </span>
                </div>
                {event.maxParticipants && (
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-200">Max Capacity</span>
                    <span className="font-bold">{event.maxParticipants}</span>
                  </div>
                )}
                {event.spotsLeft !== null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-200">Spots Left</span>
                    <span
                      className={`font-bold ${event.spotsLeft <= 10 ? "text-red-400" : "text-lime"}`}
                    >
                      {event.spotsLeft}
                    </span>
                  </div>
                )}
                {event.registrationDeadline && (
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-200">Deadline</span>
                    <span className="font-bold text-xs">
                      {formatDate(event.registrationDeadline)}
                    </span>
                  </div>
                )}
              </div>

              {/* Registration Button */}
              {isRegistered ? (
                <div className="space-y-3">
                  <div className="bg-lime/15 text-lime p-4 rounded-2xl text-center font-bold">
                    <CheckCircle size={20} className="inline mr-2" />
                    You are registered
                    {registration?.registrationStatus === "PENDING" && (
                      <p className="text-xs mt-1 text-lime/70 font-medium">
                        Awaiting confirmation
                      </p>
                    )}
                    {registration?.registrationStatus === "CONFIRMED" && (
                      <p className="text-xs mt-1 text-lime/70 font-medium">
                        Confirmed
                      </p>
                    )}
                    {registration?.attendanceStatus === "ATTENDED" && (
                      <p className="text-xs mt-1 text-lime/70 font-medium">
                        ✓ Attendance marked
                      </p>
                    )}
                  </div>
                  {registration?.registrationStatus !== "CANCELLED" &&
                    registration?.attendanceStatus !== "ATTENDED" && (
                      <button
                        onClick={handleCancelRegistration}
                        className="w-full py-2 text-red-400 hover:text-red-300 text-sm font-bold transition-colors"
                      >
                        Cancel Registration
                      </button>
                    )}
                </div>
              ) : event.isRegistrationOpen && event.spotsLeft !== 0 ? (
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="w-full py-3.5 bg-lime text-dark rounded-2xl font-bold hover:shadow-lime transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Register Now
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-3.5 bg-dark-500 text-dark-200 rounded-2xl font-bold cursor-not-allowed"
                >
                  {event.spotsLeft === 0 ? "Event Full" : "Registration Closed"}
                </button>
              )}
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div className="mt-6 pt-6 border-t border-light-400 dark:border-white/5">
              <h3 className="font-bold text-lg text-dark dark:text-white mb-3">
                About This Event
              </h3>
              <p className="text-dark-300 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed">
                {event.description}
              </p>
            </div>
          )}

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {event.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 bg-lime/15 dark:bg-lime/10 text-dark dark:text-lime text-sm rounded-full font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      </ScaleUp>

      {/* Rulebook / Guidelines */}
      {event.rulebook && (
        <div className="bg-white dark:bg-white/[0.03] rounded-3xl shadow-card dark:shadow-none p-6 border border-light-400/50 dark:border-white/5">
          <button
            onClick={() => setRulebookExpanded(!rulebookExpanded)}
            className="w-full flex items-center justify-between group"
          >
            <h3 className="font-bold text-lg text-dark dark:text-white flex items-center gap-2">
              <div className="p-2 bg-dark rounded-xl text-lime">
                <BookOpen size={18} />
              </div>
              Event Rulebook & Guidelines
            </h3>
            <div className="p-2 rounded-xl bg-light-300 dark:bg-white/5 group-hover:bg-light-400 dark:group-hover:bg-white/10 transition-colors">
              {rulebookExpanded ? (
                <ChevronUp size={18} className="text-dark-300 dark:text-zinc-400" />
              ) : (
                <ChevronDown size={18} className="text-dark-300 dark:text-zinc-400" />
              )}
            </div>
          </button>

          {!rulebookExpanded && (
            <p className="text-dark-200 dark:text-zinc-500 text-sm mt-3">
              Click to view the complete rulebook, guidelines, scoring criteria, and timeline for this event.
            </p>
          )}

          {rulebookExpanded && (
            <div className="mt-4 pt-4 border-t border-light-400/50 dark:border-white/10">
              <pre className="text-dark-300 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed text-sm font-sans">
                {event.rulebook}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Event Timeline */}
      <div className="bg-white dark:bg-white/[0.03] rounded-3xl shadow-card dark:shadow-none p-6 border border-light-400/50 dark:border-white/5">
        <h3 className="font-bold text-lg text-dark dark:text-white mb-4">
          Event Timeline
        </h3>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-light-400 dark:bg-white/10"></div>
          <div className="space-y-4">
            {["draft", "upcoming", "ongoing", "completed"].map((stage, idx) => {
              const isActive = event.status === stage;
              const isPast =
                ["draft", "upcoming", "ongoing", "completed"].indexOf(
                  event.status,
                ) > idx;

              return (
                <div key={stage} className="relative flex items-center pl-10">
                  <div
                    className={`absolute left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isActive
                        ? "bg-lime border-lime"
                        : isPast
                          ? "bg-dark border-dark"
                          : "bg-white dark:bg-[#141420] border-light-400 dark:border-white/10"
                    }`}
                  >
                    {isPast && !isActive && (
                      <span className="text-white text-[10px]">✓</span>
                    )}
                  </div>
                  <span
                    className={`capitalize text-sm ${
                      isActive
                        ? "font-bold text-dark dark:text-white"
                        : isPast
                          ? "font-medium text-dark-300 dark:text-zinc-400"
                          : "text-dark-200 dark:text-zinc-600"
                    }`}
                  >
                    {stage}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Updates */}
      {event.updates && event.updates.length > 0 && (
        <div className="bg-white dark:bg-white/[0.03] rounded-3xl shadow-card dark:shadow-none p-6 border border-light-400/50 dark:border-white/5">
          <h3 className="font-bold text-lg text-dark dark:text-white mb-4">
            Updates & Announcements
          </h3>
          <div className="space-y-3">
            {event.updates.map((update) => (
              <div
                key={update._id}
                className={`p-4 rounded-2xl ${
                  update.isPinned
                    ? "bg-lime/10 dark:bg-lime/5 border border-lime/30 dark:border-lime/20"
                    : "bg-light-300 dark:bg-white/5"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${getUpdateTypeBadge(update.type)}`}
                  >
                    {update.type}
                  </span>
                  {update.isPinned && (
                    <span className="text-dark text-xs font-bold">
                      📌 Pinned
                    </span>
                  )}
                </div>
                <p className="text-dark-300 dark:text-zinc-400 text-sm">
                  {update.message}
                </p>
                <p className="text-dark-200 dark:text-zinc-500 text-xs mt-2">
                  {new Date(update.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-dark/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1a1a2a] rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-dark dark:text-white">
                  Register for Event
                </h3>
                <button
                  onClick={() => setShowRegisterModal(false)}
                  className="p-2 hover:bg-light-300 dark:hover:bg-white/5 rounded-xl transition-colors"
                >
                  <X size={18} className="text-dark-300 dark:text-zinc-400" />
                </button>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-dark dark:text-white mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-dark dark:text-white mb-1.5">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-dark dark:text-white mb-1.5">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-dark dark:text-white mb-1.5">
                    College/Organization
                  </label>
                  <input
                    type="text"
                    value={formData.college}
                    onChange={(e) =>
                      setFormData({ ...formData, college: e.target.value })
                    }
                    className="input-field"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-dark dark:text-white mb-1.5">
                      Year
                    </label>
                    <select
                      value={formData.year}
                      onChange={(e) =>
                        setFormData({ ...formData, year: e.target.value })
                      }
                      className="input-field"
                    >
                      <option value="">Select Year</option>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="Graduate">Graduate</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-dark dark:text-white mb-1.5">
                      Branch
                    </label>
                    <input
                      type="text"
                      value={formData.branch}
                      onChange={(e) =>
                        setFormData({ ...formData, branch: e.target.value })
                      }
                      placeholder="e.g., CSE"
                      className="input-field"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={registering}
                  className="w-full py-3.5 bg-lime text-dark rounded-2xl font-bold hover:shadow-lime transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                >
                  {registering ? "Registering..." : "Complete Registration"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetails;
