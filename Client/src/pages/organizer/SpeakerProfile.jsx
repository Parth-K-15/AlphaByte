import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import {
  ArrowLeft,
  Star,
  Mic,
  Calendar,
  Globe,
  Linkedin,
  Github,
  Twitter,
  Mail,
  Phone,
  Loader2,
  Send,
  Clock,
  MapPin,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const fetchApi = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

const SpeakerProfile = () => {
  const { id } = useParams();
  const { theme } = useTheme();
  const dark = theme === "dark";

  const [speaker, setSpeaker] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ rating: 5, review: "", sessionId: "" });
  const [submitting, setSubmitting] = useState(false);
  const [reviewMsg, setReviewMsg] = useState("");

  useEffect(() => {
    loadSpeaker();
  }, [id]);

  const loadSpeaker = async () => {
    try {
      setLoading(true);
      const data = await fetchApi(`/organizer/speakers/${id}`);
      if (data.success) {
        setSpeaker(data.data);
        setSessions(data.data.sessions || []);
        setReviews(data.data.reviews || []);
      }
    } catch (err) {
      console.error("Failed to load speaker:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewForm.sessionId) {
      setReviewMsg("Please select a session to review");
      return;
    }
    try {
      setSubmitting(true);
      const organizerId =
        localStorage.getItem("userId") || localStorage.getItem("organizerId");

      const selectedSession = sessions.find((s) => s._id === reviewForm.sessionId);

      const data = await fetchApi(`/organizer/speakers/${id}/review`, {
        method: "POST",
        body: JSON.stringify({
          ...reviewForm,
          organizerId,
          eventId: selectedSession?.event?._id,
        }),
      });
      if (data.success) {
        setReviewMsg("Review submitted!");
        setReviewForm({ rating: 5, review: "", sessionId: "" });
        loadSpeaker();
      }
    } catch (err) {
      setReviewMsg("Failed to submit review");
    } finally {
      setSubmitting(false);
      setTimeout(() => setReviewMsg(""), 3000);
    }
  };

  const cardClass = dark
    ? "bg-[#1a1a2e] border-zinc-800"
    : "bg-white border-gray-200";
  const textPrimary = dark ? "text-white" : "text-gray-900";
  const textSecondary = dark ? "text-zinc-400" : "text-gray-500";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className={`animate-spin ${textSecondary}`} size={32} />
      </div>
    );
  }

  if (!speaker) {
    return (
      <div className={`text-center py-20 ${textSecondary}`}>
        Speaker not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        to="/organizer/speakers"
        className={`inline-flex items-center gap-2 text-sm hover:underline ${textSecondary}`}
      >
        <ArrowLeft size={16} /> Back to Speakers
      </Link>

      {/* Profile Card */}
      <div className={`rounded-2xl border p-6 ${cardClass}`}>
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-3xl flex-shrink-0">
            {speaker.headshot ? (
              <img
                src={speaker.headshot}
                alt={speaker.name}
                className="w-full h-full rounded-2xl object-cover"
              />
            ) : (
              speaker.name?.charAt(0)?.toUpperCase() || "S"
            )}
          </div>

          <div className="flex-1">
            <h1 className={`text-2xl font-bold ${textPrimary}`}>
              {speaker.name}
            </h1>
            {speaker.bio && (
              <p className={`mt-2 ${textSecondary}`}>{speaker.bio}</p>
            )}

            {/* Contact */}
            <div className="flex flex-wrap gap-4 mt-4">
              <div className={`flex items-center gap-2 text-sm ${textSecondary}`}>
                <Mail size={14} /> {speaker.email}
              </div>
              {speaker.phone && (
                <div className={`flex items-center gap-2 text-sm ${textSecondary}`}>
                  <Phone size={14} /> {speaker.phone}
                </div>
              )}
            </div>

            {/* Social Links */}
            <div className="flex gap-3 mt-3">
              {speaker.socialLinks?.linkedin && (
                <a href={speaker.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600">
                  <Linkedin size={18} />
                </a>
              )}
              {speaker.socialLinks?.twitter && (
                <a href={speaker.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:text-sky-600">
                  <Twitter size={18} />
                </a>
              )}
              {speaker.socialLinks?.github && (
                <a href={speaker.socialLinks.github} target="_blank" rel="noopener noreferrer" className={dark ? "text-zinc-300" : "text-gray-700"}>
                  <Github size={18} />
                </a>
              )}
              {speaker.socialLinks?.website && (
                <a href={speaker.socialLinks.website} target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:text-emerald-600">
                  <Globe size={18} />
                </a>
              )}
            </div>

            {/* Specializations */}
            {speaker.specializations?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {speaker.specializations.map((s, i) => (
                  <span
                    key={i}
                    className={`text-xs px-3 py-1 rounded-full ${
                      dark
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sessions */}
        <div className={`rounded-2xl border p-6 ${cardClass}`}>
          <h2 className={`text-lg font-bold mb-4 ${textPrimary}`}>
            <Mic size={18} className="inline mr-2" />
            Sessions ({sessions.length})
          </h2>
          {sessions.length === 0 ? (
            <p className={`text-sm ${textSecondary}`}>No sessions assigned yet</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {sessions.map((session) => (
                <div
                  key={session._id}
                  className={`rounded-xl p-4 border ${
                    dark ? "border-zinc-700 bg-zinc-800/50" : "border-gray-100 bg-gray-50"
                  }`}
                >
                  <h4 className={`font-medium ${textPrimary}`}>
                    {session.title}
                  </h4>
                  <p className={`text-xs mt-1 ${textSecondary}`}>
                    {session.event?.title || "Unknown event"}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        session.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : session.status === "confirmed"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {session.status}
                    </span>
                    {session.time?.start && (
                      <span className={`text-xs flex items-center gap-1 ${textSecondary}`}>
                        <Clock size={10} />
                        {new Date(session.time.start).toLocaleDateString()}
                      </span>
                    )}
                    {session.room && (
                      <span className={`text-xs flex items-center gap-1 ${textSecondary}`}>
                        <MapPin size={10} />
                        {session.room}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past Speaking Records */}
        <div className={`rounded-2xl border p-6 ${cardClass}`}>
          <h2 className={`text-lg font-bold mb-4 ${textPrimary}`}>
            <Calendar size={18} className="inline mr-2" />
            Past Speaking Records
          </h2>
          {(!speaker.pastSpeakingRecords || speaker.pastSpeakingRecords.length === 0) ? (
            <p className={`text-sm ${textSecondary}`}>No past records available</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {speaker.pastSpeakingRecords.map((record, i) => (
                <div
                  key={i}
                  className={`rounded-xl p-4 border ${
                    dark ? "border-zinc-700 bg-zinc-800/50" : "border-gray-100 bg-gray-50"
                  }`}
                >
                  <h4 className={`font-medium ${textPrimary}`}>
                    {record.topic || record.eventName}
                  </h4>
                  <p className={`text-xs mt-1 ${textSecondary}`}>
                    {record.eventName} {record.organizer ? `— ${record.organizer}` : ""}
                  </p>
                  {record.date && (
                    <p className={`text-xs mt-1 ${textSecondary}`}>
                      {new Date(record.date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      <div className={`rounded-2xl border p-6 ${cardClass}`}>
        <h2 className={`text-lg font-bold mb-4 ${textPrimary}`}>
          <Star size={18} className="inline mr-2" />
          Reviews ({reviews.length})
        </h2>

        {/* Submit Review Form */}
        <form
          onSubmit={handleReviewSubmit}
          className={`rounded-xl border p-4 mb-6 ${
            dark ? "border-zinc-700 bg-zinc-800/50" : "border-gray-100 bg-gray-50"
          }`}
        >
          <h3 className={`text-sm font-semibold mb-3 ${textPrimary}`}>
            Add Your Review
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className={`text-xs block mb-1 ${textSecondary}`}>
                Session
              </label>
              <select
                value={reviewForm.sessionId}
                onChange={(e) =>
                  setReviewForm({ ...reviewForm, sessionId: e.target.value })
                }
                className={`w-full text-sm px-3 py-2 rounded-lg border ${
                  dark
                    ? "bg-[#1a1a2e] border-zinc-700 text-white"
                    : "bg-white border-gray-200 text-gray-900"
                }`}
              >
                <option value="">Select a session</option>
                {sessions.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={`text-xs block mb-1 ${textSecondary}`}>
                Rating
              </label>
              <div className="flex items-center gap-1 py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() =>
                      setReviewForm({ ...reviewForm, rating: star })
                    }
                  >
                    <Star
                      size={20}
                      className={
                        star <= reviewForm.rating
                          ? "text-yellow-400 fill-yellow-400"
                          : dark
                          ? "text-zinc-600"
                          : "text-gray-300"
                      }
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mb-3">
            <label className={`text-xs block mb-1 ${textSecondary}`}>
              Comments (optional)
            </label>
            <textarea
              value={reviewForm.review}
              onChange={(e) =>
                setReviewForm({ ...reviewForm, review: e.target.value })
              }
              rows={2}
              className={`w-full text-sm px-3 py-2 rounded-lg border resize-none ${
                dark
                  ? "bg-[#1a1a2e] border-zinc-700 text-white"
                  : "bg-white border-gray-200 text-gray-900"
              }`}
              placeholder="Share your feedback about this speaker..."
            />
          </div>
          {reviewMsg && (
            <p
              className={`text-xs mb-2 ${
                reviewMsg.includes("success") || reviewMsg.includes("submitted")
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              {reviewMsg}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 disabled:opacity-50 transition-colors"
          >
            {submitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
            Submit Review
          </button>
        </form>

        {/* Existing Reviews */}
        {reviews.length === 0 ? (
          <p className={`text-sm ${textSecondary}`}>No reviews yet</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div
                key={review._id}
                className={`rounded-xl p-4 border ${
                  dark ? "border-zinc-700 bg-zinc-800/50" : "border-gray-100 bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={
                          i < review.rating
                            ? "text-yellow-400 fill-yellow-400"
                            : dark
                            ? "text-zinc-600"
                            : "text-gray-300"
                        }
                      />
                    ))}
                  </div>
                  <span className={`text-xs ${textSecondary}`}>
                    {review.session?.title || "Session"}
                  </span>
                </div>
                {review.review && (
                  <p className={`text-sm ${dark ? "text-zinc-300" : "text-gray-700"}`}>
                    {review.review}
                  </p>
                )}
                <p className={`text-xs mt-2 ${textSecondary}`}>
                  by {review.organizer?.name || "Organizer"} •{" "}
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SpeakerProfile;
