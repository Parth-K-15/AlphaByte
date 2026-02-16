import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Calendar,
  User,
  AlertCircle,
  Info,
  AlertTriangle,
  Download,
  RefreshCw,
  X,
  Clock,
  Activity,
} from "lucide-react";
import organizerApi from "../../services/organizerApi";

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedLog, setExpandedLog] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });

  // Filter states
  const [filters, setFilters] = useState({
    eventId: "",
    participantName: "",
    actionType: "",
    entityType: "",
    actorType: "",
    severity: "",
    startDate: "",
    endDate: "",
  });

  const [filterOptions, setFilterOptions] = useState({
    events: [],
    actionTypes: [],
    entityTypes: [],
    actorTypes: [],
    severities: [],
  });

  const [showFilters, setShowFilters] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const organizerId = localStorage.getItem('userId') || localStorage.getItem('organizerId');

      const queryParams = {
        organizerId,
        page: pagination.page,
        limit: pagination.limit,
        sortBy: "createdAt",
        sortOrder: "desc",
        ...Object.fromEntries(
          Object.entries(filters).filter(([, value]) => value !== "")
        ),
      };

      const { data } = await organizerApi.getLogs(queryParams);

      if (data.success) {
        setLogs(data.logs);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination.total,
          pages: data.pagination.pages,
        }));
        if (data.filterOptions) {
          setFilterOptions(data.filterOptions);
        }
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchLogs();
  };

  const clearFilters = () => {
    setFilters({
      eventId: "",
      participantName: "",
      actionType: "",
      entityType: "",
      actorType: "",
      severity: "",
      startDate: "",
      endDate: "",
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchLogs();
  };

  const toggleLogExpand = (logId) => {
    setExpandedLog(expandedLog === logId ? null : logId);
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case "CRITICAL":
        return <AlertCircle className="text-red-600 dark:text-red-400" size={20} />;
      case "WARNING":
        return <AlertTriangle className="text-yellow-600 dark:text-yellow-400" size={20} />;
      case "INFO":
      default:
        return <Info className="text-blue-600 dark:text-blue-400" size={20} />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30";
      case "WARNING":
        return "bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-500/30";
      case "INFO":
      default:
        return "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30";
    }
  };

  const getActionTypeLabel = (actionType) => {
    return actionType
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  const getEntityBadgeColor = (entityType) => {
    switch (entityType) {
      case "EVENT":
        return "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30";
      case "PARTICIPATION":
        return "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30";
      case "ATTENDANCE":
        return "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300 border-green-200 dark:border-green-500/30";
      case "CERTIFICATE":
        return "bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-500/30";
      case "COMMUNICATION":
        return "bg-pink-50 dark:bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-500/30";
      case "TEAM":
        return "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30";
      default:
        return "bg-gray-50 dark:bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-500/30";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const exportLogs = () => {
    // Create CSV content
    const headers = [
      "Timestamp",
      "Event",
      "Action",
      "Entity",
      "Actor",
      "Participant",
      "Severity",
      "Details",
    ];
    const csvContent =
      "data:text/csv;charset=utf-8," +
      headers.join(",") +
      "\n" +
      logs
        .map((log) =>
          [
            formatDate(log.createdAt),
            log.eventName || "",
            getActionTypeLabel(log.actionType),
            log.entityType,
            log.actorType,
            log.participantName || "",
            log.severity,
            log.details || "",
          ]
            .map((field) => `"${field}"`)
            .join(",")
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#191A23] dark:text-white mb-1">
            Event Logs & Audit Trail
          </h1>
          <p className="text-gray-600 dark:text-zinc-400 text-sm md:text-base">
            Complete history of all activities in your events
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchLogs()}
            className="px-4 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/10 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-zinc-300"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={exportLogs}
            disabled={logs.length === 0}
            className="px-4 py-2 bg-[#191A23] text-[#B9FF66] rounded-xl hover:bg-[#2A2B33] transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-white/[0.03] rounded-xl p-4 border border-gray-200 dark:border-white/5 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
              <Activity className="text-blue-600 dark:text-blue-400" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-zinc-400">Total Logs</p>
              <p className="text-2xl font-bold text-[#191A23] dark:text-white">
                {pagination.total}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-white/[0.03] rounded-xl p-4 border border-gray-200 dark:border-white/5 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#B9FF66]/20 dark:bg-[#B9FF66]/10 rounded-lg">
              <FileText className="text-[#191A23] dark:text-[#B9FF66]" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-zinc-400">Current Page</p>
              <p className="text-2xl font-bold text-[#191A23] dark:text-white">
                {pagination.page} / {pagination.pages || 1}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-white/[0.03] rounded-xl p-4 border border-gray-200 dark:border-white/5 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 dark:bg-green-500/10 rounded-lg">
              <Info className="text-green-600 dark:text-green-400" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-zinc-400">Info Logs</p>
              <p className="text-2xl font-bold text-[#191A23] dark:text-white">
                {logs.filter((l) => l.severity === "INFO").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-white/[0.03] rounded-xl p-4 border border-gray-200 dark:border-white/5 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 dark:bg-red-500/10 rounded-lg">
              <AlertCircle className="text-red-600 dark:text-red-400" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-zinc-400">Critical</p>
              <p className="text-2xl font-bold text-[#191A23] dark:text-white">
                {logs.filter((l) => l.severity === "CRITICAL").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/5 shadow-sm">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-[#191A23] dark:text-white" />
            <span className="font-semibold text-[#191A23] dark:text-white">
              Filters & Search
            </span>
            {Object.values(filters).some((v) => v !== "") && (
              <span className="px-2 py-1 bg-[#B9FF66]/20 text-[#191A23] dark:text-[#B9FF66] text-xs font-bold rounded-full">
                Active
              </span>
            )}
          </div>
          {showFilters ? <ChevronUp size={20} className="text-gray-600 dark:text-zinc-400" /> : <ChevronDown size={20} className="text-gray-600 dark:text-zinc-400" />}
        </button>

        {showFilters && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-white/5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Event Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                  Event
                </label>
                <select
                  value={filters.eventId}
                  onChange={(e) =>
                    handleFilterChange("eventId", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#B9FF66]/20 focus:border-[#B9FF66] [&>option]:bg-white [&>option]:dark:bg-zinc-800 [&>option]:text-gray-900 [&>option]:dark:text-white"
                >
                  <option value="">All Events</option>
                  {filterOptions.events.map((event) => (
                    <option key={event._id} value={event._id}>
                      {event.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Participant Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                  Participant Name/Email
                </label>
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    value={filters.participantName}
                    onChange={(e) =>
                      handleFilterChange("participantName", e.target.value)
                    }
                    placeholder="Search participants..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#B9FF66]/20 focus:border-[#B9FF66]"
                  />
                </div>
              </div>

              {/* Action Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                  Action Type
                </label>
                <select
                  value={filters.actionType}
                  onChange={(e) =>
                    handleFilterChange("actionType", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#B9FF66]/20 focus:border-[#B9FF66] [&>option]:bg-white [&>option]:dark:bg-zinc-800 [&>option]:text-gray-900 [&>option]:dark:text-white"
                >
                  <option value="">All Actions</option>
                  {filterOptions.actionTypes.map((type) => (
                    <option key={type} value={type}>
                      {getActionTypeLabel(type)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Entity Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                  Entity Type
                </label>
                <select
                  value={filters.entityType}
                  onChange={(e) =>
                    handleFilterChange("entityType", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#B9FF66]/20 focus:border-[#B9FF66] [&>option]:bg-white [&>option]:dark:bg-zinc-800 [&>option]:text-gray-900 [&>option]:dark:text-white"
                >
                  <option value="">All Entities</option>
                  {filterOptions.entityTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Actor Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                  Actor Type
                </label>
                <select
                  value={filters.actorType}
                  onChange={(e) =>
                    handleFilterChange("actorType", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#B9FF66]/20 focus:border-[#B9FF66] [&>option]:bg-white [&>option]:dark:bg-zinc-800 [&>option]:text-gray-900 [&>option]:dark:text-white"
                >
                  <option value="">All Actors</option>
                  {filterOptions.actorTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Severity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                  Severity
                </label>
                <select
                  value={filters.severity}
                  onChange={(e) =>
                    handleFilterChange("severity", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#B9FF66]/20 focus:border-[#B9FF66] [&>option]:bg-white [&>option]:dark:bg-zinc-800 [&>option]:text-gray-900 [&>option]:dark:text-white"
                >
                  <option value="">All Severities</option>
                  {filterOptions.severities.map((sev) => (
                    <option key={sev} value={sev}>
                      {sev}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    handleFilterChange("startDate", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#B9FF66]/20 focus:border-[#B9FF66]"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    handleFilterChange("endDate", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#B9FF66]/20 focus:border-[#B9FF66]"
                />
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-[#191A23] text-[#B9FF66] rounded-lg hover:bg-[#2A2B33] transition-colors font-medium"
              >
                Apply Filters
              </button>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/10 transition-colors font-medium text-gray-700 dark:text-zinc-300 flex items-center gap-2"
              >
                <X size={16} />
                Clear All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B9FF66]"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FileText className="text-gray-300 dark:text-zinc-600" size={64} />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mt-4">
              No Logs Found
            </h3>
            <p className="text-gray-500 dark:text-zinc-400 mt-2">
              Try adjusting your filters or date range
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">
                    Participant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">
                    Actor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {logs.map((log) => (
                  <>
                    <tr
                      key={log._id}
                      className="hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
                      onClick={() => toggleLogExpand(log._id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-zinc-300">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-gray-400 dark:text-zinc-500" />
                          {formatDate(log.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium text-[#191A23] dark:text-white">
                          {log.eventName || "N/A"}
                        </div>
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getEntityBadgeColor(log.entityType)}`}>
                            {log.entityType}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium text-gray-800 dark:text-zinc-200">
                          {getActionTypeLabel(log.actionType)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {log.participantName ? (
                          <div>
                            <div className="font-medium text-gray-800 dark:text-zinc-200">
                              {log.participantName}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-zinc-400">
                              {log.participantEmail}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-zinc-500">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-zinc-300 rounded-full text-xs font-medium">
                          {log.actorType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(
                            log.severity
                          )}`}
                        >
                          {getSeverityIcon(log.severity)}
                          {log.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-zinc-400 truncate max-w-xs">
                            {log.details || log.action}
                          </span>
                          {expandedLog === log._id ? (
                            <ChevronUp
                              size={16}
                              className="text-gray-400 dark:text-zinc-500 flex-shrink-0"
                            />
                          ) : (
                            <ChevronDown
                              size={16}
                              className="text-gray-400 dark:text-zinc-500 flex-shrink-0"
                            />
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Details */}
                    {expandedLog === log._id && (
                      <tr className="bg-gray-50 dark:bg-white/[0.02]">
                        <td colSpan="7" className="px-6 py-4">
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase">
                                  Action
                                </p>
                                <p className="text-sm text-gray-800 dark:text-zinc-200 mt-1">
                                  {log.action}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase">
                                  Actor Details
                                </p>
                                <p className="text-sm text-gray-800 dark:text-zinc-200 mt-1">
                                  {log.actorName || "System"} (
                                  {log.actorEmail || "N/A"})
                                </p>
                              </div>
                            </div>

                            {log.details && (
                              <div>
                                <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase">
                                  Details
                                </p>
                                <p className="text-sm text-gray-800 dark:text-zinc-200 mt-1">
                                  {log.details}
                                </p>
                              </div>
                            )}

                            {log.reason && (
                              <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-lg p-3">
                                <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-300 uppercase">
                                  Reason
                                </p>
                                <p className="text-sm text-yellow-900 dark:text-yellow-200 mt-1">
                                  {log.reason}
                                </p>
                              </div>
                            )}

                            {log.oldState && (
                              <div>
                                <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase">
                                  Old State
                                </p>
                                <pre className="text-xs text-gray-800 dark:text-zinc-200 mt-1 bg-white dark:bg-white/5 p-2 rounded border border-gray-200 dark:border-white/10 overflow-x-auto">
                                  {JSON.stringify(log.oldState, null, 2)}
                                </pre>
                              </div>
                            )}

                            {log.newState && (
                              <div>
                                <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase">
                                  New State
                                </p>
                                <pre className="text-xs text-gray-800 dark:text-zinc-200 mt-1 bg-white dark:bg-white/5 p-2 rounded border border-gray-200 dark:border-white/10 overflow-x-auto">
                                  {JSON.stringify(log.newState, null, 2)}
                                </pre>
                              </div>
                            )}

                            {log.metadata && (
                              <div>
                                <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase">
                                  Additional Metadata
                                </p>
                                <pre className="text-xs text-gray-800 dark:text-zinc-200 mt-1 bg-white dark:bg-white/5 p-2 rounded border border-gray-200 dark:border-white/10 overflow-x-auto">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )
        }

        {/* Pagination */}
        {!loading && logs.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-white/5 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-zinc-400">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(
                pagination.page * pagination.limit,
                pagination.total
              )}{" "}
              of {pagination.total} logs
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: prev.page - 1,
                  }))
                }
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-zinc-300"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-gray-600 dark:text-zinc-400">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: prev.page + 1,
                  }))
                }
                disabled={pagination.page >= pagination.pages}
                className="px-3 py-1 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-zinc-300"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Logs;
