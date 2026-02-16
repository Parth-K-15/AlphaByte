import { useState, useEffect } from "react";
import {
  FileText,
  Search,
  Download,
  RefreshCw,
  Calendar,
  AlertCircle,
  Info,
  AlertTriangle,
  Activity,
  Filter,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import api from "../../services/api";

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const logsPerPage = 20;
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    searchTerm: "",
    type: "",
    severity: "",
    eventId: "",
    actionType: "",
    entityType: "",
    actorType: "",
    startDate: "",
    endDate: "",
  });

  // Applied filters that trigger the fetch
  const [appliedFilters, setAppliedFilters] = useState({
    searchTerm: "",
    type: "",
    severity: "",
    eventId: "",
    actionType: "",
    entityType: "",
    actorType: "",
    startDate: "",
    endDate: "",
  });

  const [filterOptions, setFilterOptions] = useState({
    events: [],
    actionTypes: [],
    entityTypes: [],
    actorTypes: [],
    severities: ["INFO", "WARNING", "CRITICAL"],
    types: ["AUTH", "EVENT", "USER", "SYSTEM", "ACCESS", "ERROR", "MEMBER"],
  });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      console.log("Fetching logs with appliedFilters:", appliedFilters);

      const queryParams = {
        page: currentPage,
        limit: logsPerPage,
        sortBy: "createdAt",
        sortOrder: "desc",
        ...Object.fromEntries(
          Object.entries(appliedFilters).filter(([, value]) => value !== "")
        ),
      };

      console.log("Query params being sent:", queryParams);

      const response = await api.logs.getAll(queryParams);
      console.log("Logs response:", response);

      if (response && response.success) {
        setLogs(response.logs || []);
        setTotalLogs(response.pagination?.total || 0);
        setTotalPages(response.pagination?.pages || 0);
        if (response.filterOptions) {
          setFilterOptions((prev) => ({ ...prev, ...response.filterOptions }));
        }
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage, appliedFilters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setAppliedFilters({ ...filters });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    const emptyFilters = {
      searchTerm: "",
      type: "",
      severity: "",
      eventId: "",
      actionType: "",
      entityType: "",
      actorType: "",
      startDate: "",
      endDate: "",
    };
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setCurrentPage(1);
  };

  const getSeverityIcon = (severity) => {
    const sev = (severity || "").toUpperCase();
    switch (sev) {
      case "CRITICAL":
      case "ERROR":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case "WARNING":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case "INFO":
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getSeverityColor = (severity) => {
    const sev = (severity || "").toUpperCase();
    switch (sev) {
      case "CRITICAL":
      case "ERROR":
        return "bg-red-100 text-red-800 border-red-200";
      case "WARNING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "INFO":
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  const exportLogs = () => {
    const headers = ["Timestamp", "Event", "Action", "User", "Severity", "Details"];
    const csvContent =
      "data:text/csv;charset=utf-8," +
      headers.join(",") +
      "\n" +
      logs
        .map((log) =>
          [
            new Date(log.createdAt).toLocaleString(),
            log.eventName || "N/A",
            log.action || log.actionType || "N/A",
            log.user || log.actorName || log.participantName || "N/A",
            log.severity || log.level || "N/A",
            log.details || "N/A",
          ]
            .map((field) => `"${String(field).replace(/"/g, '""')}"`)
            .join(",")
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `admin_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeFilterCount = Object.values(filters).filter((v) => v !== "").length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Logs</h1>
          <p className="text-gray-600 mt-1">Monitor all system activities</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchLogs}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={exportLogs}
            disabled={logs.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Logs</p>
              <p className="text-2xl font-bold text-gray-900">{totalLogs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Info className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Info</p>
              <p className="text-2xl font-bold text-gray-900">
                {logs.filter((l) => (l.severity || l.level || "").toUpperCase() === "INFO").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Warning</p>
              <p className="text-2xl font-bold text-gray-900">
                {logs.filter((l) => (l.severity || l.level || "").toUpperCase() === "WARNING").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Critical</p>
              <p className="text-2xl font-bold text-gray-900">
                {logs.filter((l) => ["CRITICAL", "ERROR"].includes((l.severity || l.level || "").toUpperCase())).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-600" />
            <span className="font-medium text-gray-900">Advanced Filters</span>
            {activeFilterCount > 0 && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                {activeFilterCount} active
              </span>
            )}
          </div>
          {showFilters ? (
            <ChevronUp size={20} className="text-gray-400" />
          ) : (
            <ChevronDown size={20} className="text-gray-400" />
          )}
        </button>

        {showFilters && (
          <div className="px-6 pb-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={filters.searchTerm}
                    onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange("type", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Types</option>
                  {filterOptions.types.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Severity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                <select
                  value={filters.severity}
                  onChange={(e) => handleFilterChange("severity", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Severities</option>
                  {filterOptions.severities.map((sev) => (
                    <option key={sev} value={sev}>
                      {sev}
                    </option>
                  ))}
                </select>
              </div>

              {/* Event */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event</label>
                <select
                  value={filters.eventId}
                  onChange={(e) => handleFilterChange("eventId", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Events</option>
                  {filterOptions.events.map((event) => (
                    <option key={event._id} value={event._id}>
                      {event.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action Type</label>
                <select
                  value={filters.actionType}
                  onChange={(e) => handleFilterChange("actionType", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Actions</option>
                  {filterOptions.actionTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.split("_").map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(" ")}
                    </option>
                  ))}
                </select>
              </div>

              {/* Entity Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
                <select
                  value={filters.entityType}
                  onChange={(e) => handleFilterChange("entityType", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Actor Type</label>
                <select
                  value={filters.actorType}
                  onChange={(e) => handleFilterChange("actorType", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Actors</option>
                  {filterOptions.actorTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange("startDate", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange("endDate", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex gap-2 pt-4">
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Apply Filters
              </button>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700 flex items-center gap-2"
              >
                <X size={16} />
                Clear All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Loading logs...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FileText className="w-16 h-16 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mt-4">No Logs Found</h3>
            <p className="text-gray-500 mt-2">Try adjusting your filters or search criteria</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Severity
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log, index) => (
                    <tr key={log._id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(log.createdAt).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {log.eventName || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium text-gray-900">{log.action || log.actionType || "N/A"}</div>
                        {log.details && (
                          <div className="text-xs text-gray-500 mt-1 line-clamp-1">{log.details}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {log.user || log.actorName || log.participantName || "System"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          {log.type || log.entityType || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(
                            log.severity || log.level
                          )}`}
                        >
                          {getSeverityIcon(log.severity || log.level)}
                          {log.severity || log.level || "INFO"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {(currentPage - 1) * logsPerPage + 1} to{" "}
                  {Math.min(currentPage * logsPerPage, totalLogs)} of {totalLogs} logs
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                  </div>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Logs;
