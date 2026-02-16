import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import {
  Search,
  Star,
  Mic,
  Calendar,
  ExternalLink,
  Loader2,
  Users,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const fetchApi = async (endpoint) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

const Speakers = () => {
  const { theme } = useTheme();
  const dark = theme === "dark";

  const [speakers, setSpeakers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadSpeakers();
  }, [search]);

  const loadSpeakers = async () => {
    try {
      setLoading(true);
      const query = search ? `?search=${encodeURIComponent(search)}` : "";
      const data = await fetchApi(`/organizer/speakers${query}`);
      if (data.success) setSpeakers(data.data);
    } catch (err) {
      console.error("Failed to load speakers:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={14}
        className={
          i < Math.round(rating)
            ? "text-yellow-400 fill-yellow-400"
            : dark
            ? "text-zinc-600"
            : "text-gray-300"
        }
      />
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1
            className={`text-2xl font-bold ${
              dark ? "text-white" : "text-gray-900"
            }`}
          >
            Speakers
          </h1>
          <p className={dark ? "text-zinc-400" : "text-gray-500"}>
            Browse and manage registered speakers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              size={16}
              className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                dark ? "text-zinc-500" : "text-gray-400"
              }`}
            />
            <input
              type="text"
              placeholder="Search speakers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`pl-9 pr-4 py-2.5 rounded-xl border text-sm w-64 ${
                dark
                  ? "bg-[#1a1a2e] border-zinc-700 text-white placeholder-zinc-500"
                  : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"
              } focus:outline-none focus:ring-2 focus:ring-blue-500/30`}
            />
          </div>
        </div>
      </div>

      {/* Speaker Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2
            className={`animate-spin ${dark ? "text-zinc-400" : "text-gray-400"}`}
            size={32}
          />
        </div>
      ) : speakers.length === 0 ? (
        <div
          className={`text-center py-20 rounded-2xl border ${
            dark
              ? "bg-[#1a1a2e] border-zinc-800 text-zinc-400"
              : "bg-white border-gray-200 text-gray-500"
          }`}
        >
          <Users size={48} className="mx-auto mb-4 opacity-40" />
          <p className="text-lg font-medium">No speakers found</p>
          <p className="text-sm mt-1">
            {search
              ? "Try a different search term"
              : "No speakers have registered yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {speakers.map((speaker) => (
            <Link
              key={speaker._id}
              to={`/organizer/speakers/${speaker._id}`}
              className={`group rounded-2xl border p-6 transition-all duration-300 hover:shadow-lg ${
                dark
                  ? "bg-[#1a1a2e] border-zinc-800 hover:border-zinc-600"
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}
            >
              {/* Avatar & Name */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                  {speaker.headshot ? (
                    <img
                      src={speaker.headshot}
                      alt={speaker.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    speaker.name?.charAt(0)?.toUpperCase() || "S"
                  )}
                </div>
                <div className="min-w-0">
                  <h3
                    className={`font-semibold truncate group-hover:text-emerald-500 transition-colors ${
                      dark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {speaker.name}
                  </h3>
                  <p
                    className={`text-sm truncate ${
                      dark ? "text-zinc-400" : "text-gray-500"
                    }`}
                  >
                    {speaker.email}
                  </p>
                </div>
              </div>

              {/* Bio */}
              {speaker.bio && (
                <p
                  className={`text-sm line-clamp-2 mb-4 ${
                    dark ? "text-zinc-400" : "text-gray-600"
                  }`}
                >
                  {speaker.bio}
                </p>
              )}

              {/* Specializations */}
              {speaker.specializations?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {speaker.specializations.slice(0, 3).map((spec, i) => (
                    <span
                      key={i}
                      className={`text-xs px-2.5 py-1 rounded-full ${
                        dark
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {spec}
                    </span>
                  ))}
                  {speaker.specializations.length > 3 && (
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full ${
                        dark
                          ? "bg-zinc-700 text-zinc-300"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      +{speaker.specializations.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Stats */}
              <div
                className={`flex items-center justify-between pt-4 border-t ${
                  dark ? "border-zinc-800" : "border-gray-100"
                }`}
              >
                <div className="flex items-center gap-1">
                  {renderStars(speaker.avgRating || 0)}
                  <span
                    className={`text-xs ml-1 ${
                      dark ? "text-zinc-500" : "text-gray-400"
                    }`}
                  >
                    ({speaker.totalReviews || 0})
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center gap-1 text-xs ${
                      dark ? "text-zinc-400" : "text-gray-500"
                    }`}
                  >
                    <Mic size={12} />
                    {speaker.totalSessions || 0}
                  </div>
                  <ExternalLink
                    size={14}
                    className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                      dark ? "text-zinc-400" : "text-gray-400"
                    }`}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Speakers;
