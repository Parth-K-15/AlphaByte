import { useState, useEffect } from "react";
import {
  BarChart3,
  Users,
  CheckCircle,
  Presentation,
  TrendingUp,
  FileText,
} from "lucide-react";
import * as speakerApi from "../../services/speakerApi";

const Analytics = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await speakerApi.getSessions();
      if (response.success) {
        setSessions(response.data);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
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

  const totalRegistered = sessions.reduce((sum, s) => sum + (s.registeredCount || 0), 0);
  const totalCheckedIn = sessions.reduce((sum, s) => sum + (s.checkedInCount || 0), 0);
  const totalMaterials = sessions.reduce((sum, s) => sum + (s.slides?.length || 0), 0);
  const avgAttendance = totalRegistered > 0 ? ((totalCheckedIn / totalRegistered) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Session Analytics
        </h1>
        <p className="text-gray-600 dark:text-zinc-400 mt-1">
          Registration and attendance counts for your sessions
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white/80 dark:bg-[#1a1a2e]/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-100 dark:border-white/5">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mb-3">
            <Presentation size={20} className="text-white" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{sessions.length}</p>
          <p className="text-xs text-gray-500 dark:text-zinc-500">Total Sessions</p>
        </div>
        <div className="bg-white/80 dark:bg-[#1a1a2e]/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-100 dark:border-white/5">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-3">
            <Users size={20} className="text-white" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalRegistered}</p>
          <p className="text-xs text-gray-500 dark:text-zinc-500">Total Registered</p>
        </div>
        <div className="bg-white/80 dark:bg-[#1a1a2e]/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-100 dark:border-white/5">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-3">
            <CheckCircle size={20} className="text-white" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCheckedIn}</p>
          <p className="text-xs text-gray-500 dark:text-zinc-500">Total Checked In</p>
        </div>
        <div className="bg-white/80 dark:bg-[#1a1a2e]/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-100 dark:border-white/5">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center mb-3">
            <TrendingUp size={20} className="text-white" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgAttendance}%</p>
          <p className="text-xs text-gray-500 dark:text-zinc-500">Avg Attendance Rate</p>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-white/80 dark:bg-[#1a1a2e]/80 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-white/5">
          <h2 className="font-bold text-gray-900 dark:text-white">Per-Session Breakdown</h2>
        </div>
        {sessions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-white/5">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-zinc-500 uppercase">
                    Session
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-zinc-500 uppercase">
                    Event
                  </th>
                  <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 dark:text-zinc-500 uppercase">
                    Status
                  </th>
                  <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 dark:text-zinc-500 uppercase">
                    Registered
                  </th>
                  <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 dark:text-zinc-500 uppercase">
                    Checked In
                  </th>
                  <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 dark:text-zinc-500 uppercase">
                    Rate
                  </th>
                  <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 dark:text-zinc-500 uppercase">
                    Materials
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {sessions.map((session) => {
                  const rate =
                    session.registeredCount > 0
                      ? ((session.checkedInCount / session.registeredCount) * 100).toFixed(0)
                      : 0;
                  return (
                    <tr key={session._id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02]">
                      <td className="px-5 py-4">
                        <p className="font-medium text-sm text-gray-900 dark:text-white">
                          {session.title}
                        </p>
                        {session.time?.start && (
                          <p className="text-xs text-gray-500 dark:text-zinc-500">
                            {new Date(session.time.start).toLocaleDateString()}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-zinc-400">
                        {session.event?.title || "-"}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            session.status === "confirmed"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                              : session.status === "completed"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400"
                              : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-zinc-400"
                          }`}
                        >
                          {session.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center text-sm font-semibold text-gray-900 dark:text-white">
                        {session.registeredCount || 0}
                      </td>
                      <td className="px-5 py-4 text-center text-sm font-semibold text-gray-900 dark:text-white">
                        {session.checkedInCount || 0}
                      </td>
                      <td className="px-5 py-4 text-center text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        {rate}%
                      </td>
                      <td className="px-5 py-4 text-center text-sm text-gray-600 dark:text-zinc-400">
                        {session.slides?.length || 0}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <BarChart3 size={48} className="mx-auto text-gray-300 dark:text-zinc-700 mb-4" />
            <p className="text-gray-500 dark:text-zinc-500">
              No sessions to show analytics for yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
