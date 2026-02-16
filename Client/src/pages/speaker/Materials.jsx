import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Upload,
  Trash2,
  Presentation,
  ExternalLink,
  Calendar,
} from "lucide-react";
import * as speakerApi from "../../services/speakerApi";

const Materials = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadData, setUploadData] = useState({
    sessionId: "",
    name: "",
    url: "",
  });

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

  const handleUpload = async () => {
    if (!uploadData.sessionId || !uploadData.name.trim() || !uploadData.url.trim()) return;
    try {
      const response = await speakerApi.uploadMaterial(uploadData.sessionId, {
        name: uploadData.name,
        url: uploadData.url,
      });
      if (response.success) {
        fetchSessions();
        setUploadData({ sessionId: "", name: "", url: "" });
      }
    } catch (error) {
      console.error("Error uploading material:", error);
    }
  };

  const handleDelete = async (sessionId, materialId) => {
    try {
      const response = await speakerApi.deleteMaterial(sessionId, materialId);
      if (response.success) {
        fetchSessions();
      }
    } catch (error) {
      console.error("Error deleting material:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const allMaterials = sessions.flatMap((session) =>
    (session.slides || []).map((slide) => ({
      ...slide,
      sessionId: session._id,
      sessionTitle: session.title,
      eventTitle: session.event?.title,
    }))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Materials
        </h1>
        <p className="text-gray-600 dark:text-zinc-400 mt-1">
          Upload and manage slides and resources for your sessions
        </p>
      </div>

      {/* Upload Form */}
      <div className="bg-white/80 dark:bg-[#1a1a2e]/80 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-white/5 p-5 sm:p-6">
        <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Upload size={18} /> Upload Material
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <select
            value={uploadData.sessionId}
            onChange={(e) => setUploadData({ ...uploadData, sessionId: e.target.value })}
            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f0f14] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            <option value="">Select session...</option>
            {sessions.map((s) => (
              <option key={s._id} value={s._id}>
                {s.title}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Material name"
            value={uploadData.name}
            onChange={(e) => setUploadData({ ...uploadData, name: e.target.value })}
            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f0f14] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
          <input
            type="text"
            placeholder="URL (Google Drive, Dropbox...)"
            value={uploadData.url}
            onChange={(e) => setUploadData({ ...uploadData, url: e.target.value })}
            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f0f14] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
          <button
            onClick={handleUpload}
            disabled={!uploadData.sessionId || !uploadData.name.trim() || !uploadData.url.trim()}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-all"
          >
            <Upload size={16} /> Upload
          </button>
        </div>
      </div>

      {/* Materials List */}
      {allMaterials.length > 0 ? (
        <div className="bg-white/80 dark:bg-[#1a1a2e]/80 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-white/5">
            <h2 className="font-bold text-gray-900 dark:text-white">
              All Materials ({allMaterials.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {allMaterials.map((material) => (
              <div
                key={material._id}
                className="flex items-center gap-4 p-4 sm:p-5 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
              >
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                    {material.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">
                    {material.sessionTitle} • {material.eventTitle} •{" "}
                    {new Date(material.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
                <a
                  href={material.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-all"
                >
                  <ExternalLink size={16} className="text-gray-500" />
                </a>
                <button
                  onClick={() => handleDelete(material.sessionId, material._id)}
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <Trash2 size={16} className="text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white/80 dark:bg-[#1a1a2e]/80 rounded-2xl border border-gray-100 dark:border-white/5 p-12 text-center">
          <FileText size={48} className="mx-auto text-gray-300 dark:text-zinc-700 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Materials Yet
          </h3>
          <p className="text-gray-500 dark:text-zinc-500 text-sm">
            Upload slides and resources for your sessions above.
          </p>
        </div>
      )}
    </div>
  );
};

export default Materials;
