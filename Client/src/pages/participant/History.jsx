import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  ArrowUpRight,
} from "lucide-react";

const API_BASE = "http://localhost:5000/api";

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const email = localStorage.getItem("participantEmail") || "";

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE}/participant/history${email ? `?email=${encodeURIComponent(email)}` : ""}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );
      const data = await response.json();

      if (data.success) {
        setHistory(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const filteredHistory =
    filter === "all"
      ? history
      : history.filter((item) => item.attendanceStatus === filter);

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
      <div className="bg-dark rounded-3xl p-8 text-white">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Event History</h1>
        <p className="text-dark-200">Your past events and attendance records</p>
        <div className="mt-4 flex items-center gap-3">
          <div className="bg-lime/10 border border-lime/20 px-4 py-2 rounded-xl">
            <span className="text-lime font-bold text-sm">
              {history.length} Events
            </span>
          </div>
          <div className="bg-lime/10 border border-lime/20 px-4 py-2 rounded-xl">
            <span className="text-lime font-bold text-sm">
              {history.filter((h) => h.attendanceStatus === "ATTENDED").length}{" "}
              Attended
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { key: "all", label: "All" },
          { key: "ATTENDED", label: "Attended" },
          { key: "ABSENT", label: "Missed" },
          { key: "PENDING", label: "Pending" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              filter === f.key
                ? "bg-dark text-lime"
                : "bg-white text-dark-300 border border-light-400 hover:bg-light-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* History List */}
      {filteredHistory.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-card p-12 text-center border border-light-400/50">
          <div className="w-20 h-20 bg-dark rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Clock size={32} className="text-lime" />
          </div>
          <h3 className="text-xl font-bold text-dark mb-2">No History Found</h3>
          <p className="text-dark-300 mb-6 text-sm">
            You don't have any past events yet.
          </p>
          <Link
            to="/participant"
            className="inline-flex items-center gap-2 px-6 py-3 bg-lime text-dark rounded-2xl font-bold hover:shadow-lime transition-all"
          >
            Explore Events <ArrowUpRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((item, index) => {
            const variant =
              index % 3 === 0 ? "dark" : index % 3 === 1 ? "lime" : "white";

            return (
              <div
                key={item._id}
                className={`rounded-3xl p-5 transition-all hover:scale-[1.01] ${
                  variant === "dark"
                    ? "bg-dark text-white"
                    : variant === "lime"
                      ? "bg-lime text-dark"
                      : "bg-white text-dark shadow-card border border-light-400/50"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg">
                      {item.event?.title || "Event"}
                    </h3>
                    <div
                      className={`flex items-center gap-3 mt-1 text-sm ${
                        variant === "dark"
                          ? "text-dark-200"
                          : variant === "lime"
                            ? "text-dark/70"
                            : "text-dark-300"
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        <Clock size={14} /> {formatDate(item.event?.startDate)}
                      </span>
                      {(item.event?.venue || item.event?.location) && (
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />{" "}
                          {item.event?.venue || item.event?.location}
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 ${
                      item.attendanceStatus === "ATTENDED"
                        ? variant === "dark"
                          ? "bg-lime/15 text-lime"
                          : "bg-dark/10 text-dark"
                        : item.attendanceStatus === "ABSENT"
                          ? "bg-red-100 text-red-700"
                          : variant === "dark"
                            ? "bg-dark-400 text-dark-200"
                            : "bg-light-400 text-dark-300"
                    }`}
                  >
                    {item.attendanceStatus === "ATTENDED" ? (
                      <CheckCircle size={12} />
                    ) : (
                      <XCircle size={12} />
                    )}
                    {item.attendanceStatus}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  {item.event && (
                    <Link
                      to={`/participant/event/${item.event._id}`}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all hover:scale-105 ${
                        variant === "dark"
                          ? "bg-lime/10 text-lime border border-lime/20"
                          : variant === "lime"
                            ? "bg-dark text-lime"
                            : "bg-dark/5 text-dark border border-dark/10"
                      }`}
                    >
                      View Details <ArrowUpRight size={12} />
                    </Link>
                  )}
                  {item.certificate && (
                    <Link
                      to="/participant/certificates"
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 ${
                        variant === "dark"
                          ? "bg-lime text-dark"
                          : "bg-dark text-white"
                      }`}
                    >
                      🏆 Certificate
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default History;
