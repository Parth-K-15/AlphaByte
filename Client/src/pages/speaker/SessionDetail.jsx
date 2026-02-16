import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  MapPin,
  Presentation,
  FileText,
  Upload,
  Send,
  Trash2,
  Edit3,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Users,
} from "lucide-react";
import * as speakerApi from "../../services/speakerApi";

const SessionDetail = () => {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [updateMessage, setUpdateMessage] = useState("");
  const [updateType, setUpdateType] = useState("general");
  const [materialName, setMaterialName] = useState("");
  const [materialUrl, setMaterialUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetchSession();
  }, [id]);

  const fetchSession = async () => {
    try {
      const response = await speakerApi.getSession(id);
      if (response.success) {
        setSession(response.data);
        setEditData({
          abstract: response.data.abstract || "",
          description: response.data.description || "",
          learningOutcomes: response.data.learningOutcomes || [],
          avNeeds: response.data.avNeeds || "",
        });
      }
    } catch (error) {
      console.error("Error fetching session:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDetails = async () => {
    setSaving(true);
    try {
      const response = await speakerApi.updateSession(id, editData);
      if (response.success) {
        setSession(response.data);
        setEditing(false);
      }
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setSaving(false);
    }
  };

  const handlePostUpdate = async () => {
    if (!updateMessage.trim()) return;
    try {
      const response = await speakerApi.postSessionUpdate(id, {
        message: updateMessage,
        type: updateType,
      });
      if (response.success) {
        setSession(response.data);
        setUpdateMessage("");
        setUpdateType("general");
      }
    } catch (error) {
      console.error("Error posting update:", error);
    }
  };

  const handleUploadMaterial = async () => {
    if (!materialName.trim() || !materialUrl.trim()) return;
    try {
      const response = await speakerApi.uploadMaterial(id, {
        name: materialName,
        url: materialUrl,
      });
      if (response.success) {
        setSession(response.data);
        setMaterialName("");
        setMaterialUrl("");
      }
    } catch (error) {
      console.error("Error uploading:", error);
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    try {
      const response = await speakerApi.deleteMaterial(id, materialId);
      if (response.success) {
        setSession(response.data);
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

  if (!session) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-zinc-500">Session not found</p>
        <Link
          to="/speaker/sessions"
          className="text-emerald-600 hover:underline mt-2 inline-block"
        >
          Back to sessions
        </Link>
      </div>
    );
  }

  const statusColors = {
    draft: "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-zinc-400",
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400",
    confirmed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    rejected: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
    ongoing: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
    completed: "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  };

  const handleAssignmentDecision = async (decision) => {
    try {
      setDecisionLoading(true);
      if (decision === 'reject') {
        const reason = rejectionReason.trim();
        if (!reason) return;
        const response = await speakerApi.respondToAssignment(id, 'reject', reason);
        if (response.success) setSession(response.data);
      } else {
        const response = await speakerApi.respondToAssignment(id, 'confirm');
        if (response.success) setSession(response.data);
      }
    } catch (error) {
      console.error('Error updating assignment decision:', error);
    } finally {
      setDecisionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/speaker/sessions"
          className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all"
        >
          <ArrowLeft size={20} className="text-gray-600 dark:text-zinc-400" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {session.title}
          </h1>
          <p className="text-gray-500 dark:text-zinc-500 text-sm mt-0.5">
            {session.event?.title}
          </p>
        </div>
        <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${statusColors[session.status]}`}>
          {session.status}
        </span>
      </div>

      {session.status === 'pending' && (
        <div className="bg-white/80 dark:bg-[#1a1a2e]/80 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-white/5 p-5">
          <h2 className="font-bold text-gray-900 dark:text-white">Session Assignment Request</h2>
          <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
            An organizer assigned you to this session. Please confirm or reject.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <button
              onClick={() => handleAssignmentDecision('confirm')}
              disabled={decisionLoading}
              className="px-4 py-2.5 rounded-xl text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
            >
              Confirm
            </button>
            <div className="flex-1 flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Reason for rejection (required)"
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f0f14] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30"
              />
              <button
                onClick={() => handleAssignmentDecision('reject')}
                disabled={decisionLoading || !rejectionReason.trim()}
                className="px-4 py-2.5 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {session.status === 'rejected' && session.assignment?.rejectionReason && (
        <div className="bg-white/80 dark:bg-[#1a1a2e]/80 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-white/5 p-5">
          <h2 className="font-bold text-gray-900 dark:text-white">Rejection Reason</h2>
          <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
            {session.assignment.rejectionReason}
          </p>
        </div>
      )}

      {/* Info Bar */}
      <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-zinc-400">
        {session.time?.start && (
          <span className="flex items-center gap-1.5 bg-white/80 dark:bg-[#1a1a2e]/80 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-white/5">
            <Clock size={14} />
            {new Date(session.time.start).toLocaleString()}
            {session.time.end && ` - ${new Date(session.time.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
          </span>
        )}
        {session.room && (
          <span className="flex items-center gap-1.5 bg-white/80 dark:bg-[#1a1a2e]/80 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-white/5">
            <MapPin size={14} />
            {session.room}
          </span>
        )}
        <span className="flex items-center gap-1.5 bg-white/80 dark:bg-[#1a1a2e]/80 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-white/5">
          <Users size={14} />
          {session.registeredCount || 0} registered • {session.checkedInCount || 0} checked in
        </span>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Session Details (editable) */}
        <div className="bg-white/80 dark:bg-[#1a1a2e]/80 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 dark:text-white">Session Details</h2>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-all"
              >
                <Edit3 size={16} className="text-gray-500" />
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg"
                >
                  <X size={16} className="text-gray-500" />
                </button>
                <button
                  onClick={handleSaveDetails}
                  disabled={saving}
                  className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50"
                >
                  <Save size={16} />
                </button>
              </div>
            )}
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-zinc-500 uppercase tracking-wide">
                Abstract
              </label>
              {editing ? (
                <textarea
                  value={editData.abstract}
                  onChange={(e) => setEditData({ ...editData, abstract: e.target.value })}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f0f14] text-gray-900 dark:text-white text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="Enter talk abstract..."
                />
              ) : (
                <p className="mt-1 text-sm text-gray-700 dark:text-zinc-300">
                  {session.abstract || "No abstract provided"}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-zinc-500 uppercase tracking-wide">
                Description
              </label>
              {editing ? (
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f0f14] text-gray-900 dark:text-white text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="Session description..."
                />
              ) : (
                <p className="mt-1 text-sm text-gray-700 dark:text-zinc-300">
                  {session.description || "No description"}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-zinc-500 uppercase tracking-wide">
                Learning Outcomes
              </label>
              {editing ? (
                <textarea
                  value={editData.learningOutcomes.join("\n")}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      learningOutcomes: e.target.value.split("\n").filter((l) => l.trim()),
                    })
                  }
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f0f14] text-gray-900 dark:text-white text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="One outcome per line..."
                />
              ) : (
                <ul className="mt-1 space-y-1">
                  {session.learningOutcomes?.length > 0 ? (
                    session.learningOutcomes.map((outcome, i) => (
                      <li key={i} className="text-sm text-gray-700 dark:text-zinc-300 flex items-start gap-2">
                        <CheckCircle size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                        {outcome}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-gray-500">No outcomes listed</li>
                  )}
                </ul>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-zinc-500 uppercase tracking-wide">
                AV Needs
              </label>
              {editing ? (
                <input
                  value={editData.avNeeds}
                  onChange={(e) => setEditData({ ...editData, avNeeds: e.target.value })}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f0f14] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="Projector, mic, whiteboard..."
                />
              ) : (
                <p className="mt-1 text-sm text-gray-700 dark:text-zinc-300">
                  {session.avNeeds || "None specified"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Materials */}
        <div className="bg-white/80 dark:bg-[#1a1a2e]/80 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-white/5">
            <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText size={18} /> Materials & Slides
            </h2>
          </div>
          <div className="p-5 space-y-4">
            {/* Upload form */}
            <div className="flex flex-col gap-2">
              <input
                type="text"
                placeholder="Material name"
                value={materialName}
                onChange={(e) => setMaterialName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f0f14] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              <input
                type="text"
                placeholder="URL (Google Drive, Dropbox, etc.)"
                value={materialUrl}
                onChange={(e) => setMaterialUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f0f14] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              <button
                onClick={handleUploadMaterial}
                disabled={!materialName.trim() || !materialUrl.trim()}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-all"
              >
                <Upload size={14} /> Add Material
              </button>
            </div>

            {/* Materials list */}
            {session.slides?.length > 0 ? (
              <div className="space-y-2">
                {session.slides.map((slide) => (
                  <div
                    key={slide._id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5"
                  >
                    <FileText size={16} className="text-emerald-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <a
                        href={slide.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-gray-900 dark:text-white hover:text-emerald-600 truncate block"
                      >
                        {slide.name}
                      </a>
                      <p className="text-xs text-gray-500 dark:text-zinc-500">
                        {new Date(slide.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteMaterial(slide._id)}
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-gray-500 dark:text-zinc-500 py-4">
                No materials uploaded yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Session Updates */}
      <div className="bg-white/80 dark:bg-[#1a1a2e]/80 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-white/5">
          <h2 className="font-bold text-gray-900 dark:text-white">Post Update</h2>
          <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">
            Updates go to organizers for approval
          </p>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={updateType}
              onChange={(e) => setUpdateType(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f0f14] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="general">General</option>
              <option value="slides">Slides Uploaded</option>
              <option value="room_change">Room Change</option>
              <option value="time_change">Time Change</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                placeholder="Update message..."
                value={updateMessage}
                onChange={(e) => setUpdateMessage(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f0f14] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                onKeyDown={(e) => e.key === "Enter" && handlePostUpdate()}
              />
              <button
                onClick={handlePostUpdate}
                disabled={!updateMessage.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-all flex items-center gap-1.5"
              >
                <Send size={14} /> Post
              </button>
            </div>
          </div>

          {/* Updates history */}
          {session.updates?.length > 0 && (
            <div className="space-y-2 mt-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-zinc-300">Update History</h3>
              {session.updates.slice().reverse().map((update, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5">
                  {update.status === "approved" ? (
                    <CheckCircle size={16} className="text-emerald-500 mt-0.5" />
                  ) : update.status === "rejected" ? (
                    <X size={16} className="text-red-500 mt-0.5" />
                  ) : (
                    <AlertCircle size={16} className="text-amber-500 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 dark:text-zinc-300">{update.message}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-zinc-500">
                      <span className="capitalize">{update.type}</span>
                      <span className={`px-2 py-0.5 rounded-full ${
                        update.status === "approved"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                          : update.status === "rejected"
                          ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                      }`}>
                        {update.status}
                      </span>
                      <span>{new Date(update.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionDetail;
