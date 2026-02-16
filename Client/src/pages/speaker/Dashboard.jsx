import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Presentation,
  Calendar,
  Users,
  Star,
  TrendingUp,
  Clock,
  MapPin,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import * as speakerApi from "../../services/speakerApi";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await speakerApi.getDashboardStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Sessions",
      value: stats?.totalSessions || 0,
      icon: Presentation,
      color: "emerald",
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      label: "Today's Sessions",
      value: stats?.todaySessions || 0,
      icon: Calendar,
      color: "blue",
      gradient: "from-blue-500 to-indigo-600",
    },
    {
      label: "Upcoming",
      value: stats?.upcomingSessions || 0,
      icon: Clock,
      color: "purple",
      gradient: "from-purple-500 to-pink-600",
    },
    {
      label: "Completed",
      value: stats?.completedSessions || 0,
      icon: CheckCircle,
      color: "amber",
      gradient: "from-amber-500 to-orange-600",
    },
    {
      label: "Total Registered",
      value: stats?.totalRegistered || 0,
      icon: Users,
      color: "cyan",
      gradient: "from-cyan-500 to-blue-600",
    },
    {
      label: "Avg Rating",
      value: stats?.avgRating || "N/A",
      icon: Star,
      color: "yellow",
      gradient: "from-yellow-500 to-amber-600",
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Speaker Dashboard
        </h1>
        <p className="text-gray-600 dark:text-zinc-400 mt-1">
          Overview of your sessions and performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-white/80 dark:bg-[#1a1a2e]/80 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-white/5 hover:shadow-lg transition-all duration-300"
          >
            <div
              className={`w-10 h-10 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center mb-3`}
            >
              <card.icon size={20} className="text-white" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {card.value}
            </p>
            <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">
              {card.label}
            </p>
          </div>
        ))}
      </div>

      {/* Today's Sessions */}
      <div className="bg-white/80 dark:bg-[#1a1a2e]/80 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Today's Sessions
          </h2>
          <Link
            to="/speaker/sessions"
            className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            View All <ArrowRight size={14} />
          </Link>
        </div>
        <div className="p-5 sm:p-6">
          {stats?.todaySessionsList?.length > 0 ? (
            <div className="space-y-4">
              {stats.todaySessionsList.map((session) => (
                <Link
                  key={session._id}
                  to={`/speaker/sessions/${session._id}`}
                  className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-500/5 transition-all duration-200"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Presentation size={20} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {session.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-zinc-500">
                      {session.time?.start && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(session.time.start).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                      {session.room && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} />
                          {session.room}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      session.status === "confirmed"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : session.status === "ongoing"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                        : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-zinc-400"
                    }`}
                  >
                    {session.status}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar
                size={40}
                className="mx-auto text-gray-300 dark:text-zinc-700 mb-3"
              />
              <p className="text-gray-500 dark:text-zinc-500">
                No sessions scheduled for today
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Sessions */}
      <div className="bg-white/80 dark:bg-[#1a1a2e]/80 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-white/5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Upcoming Sessions
          </h2>
        </div>
        <div className="p-5 sm:p-6">
          {stats?.upcomingSessionsList?.length > 0 ? (
            <div className="space-y-3">
              {stats.upcomingSessionsList.map((session) => (
                <Link
                  key={session._id}
                  to={`/speaker/sessions/${session._id}`}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all duration-200"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Presentation size={16} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                      {session.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">
                      {session.event?.title} •{" "}
                      {session.time?.start &&
                        new Date(session.time.start).toLocaleDateString()}
                    </p>
                  </div>
                  <ArrowRight
                    size={16}
                    className="text-gray-400 dark:text-zinc-600"
                  />
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-zinc-500 py-4">
              No upcoming sessions
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
