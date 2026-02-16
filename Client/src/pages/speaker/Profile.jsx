import { useState, useEffect } from "react";
import {
  User,
  Save,
  Plus,
  Trash2,
  Star,
  Linkedin,
  Globe,
  Github,
  Twitter,
  Briefcase,
  Edit3,
} from "lucide-react";
import * as speakerApi from "../../services/speakerApi";

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    bio: "",
    specializations: [],
    socialLinks: { linkedin: "", twitter: "", website: "", github: "" },
    headshot: "",
    pastSpeakingRecords: [],
  });
  const [newSpec, setNewSpec] = useState("");
  const [newRecord, setNewRecord] = useState({ eventName: "", topic: "", organizer: "", date: "" });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await speakerApi.getProfile();
      if (response.success) {
        setProfile(response.data);
        setFormData({
          name: response.data.name || "",
          phone: response.data.phone || "",
          bio: response.data.bio || "",
          specializations: response.data.specializations || [],
          socialLinks: response.data.socialLinks || { linkedin: "", twitter: "", website: "", github: "" },
          headshot: response.data.headshot || "",
          pastSpeakingRecords: response.data.pastSpeakingRecords || [],
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await speakerApi.updateProfile(formData);
      if (response.success) {
        setProfile({ ...profile, ...response.data });
        setEditing(false);
      }
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const addSpecialization = () => {
    if (newSpec.trim() && !formData.specializations.includes(newSpec.trim())) {
      setFormData({ ...formData, specializations: [...formData.specializations, newSpec.trim()] });
      setNewSpec("");
    }
  };

  const removeSpecialization = (index) => {
    setFormData({
      ...formData,
      specializations: formData.specializations.filter((_, i) => i !== index),
    });
  };

  const addPastRecord = () => {
    if (newRecord.eventName.trim()) {
      setFormData({
        ...formData,
        pastSpeakingRecords: [...formData.pastSpeakingRecords, { ...newRecord }],
      });
      setNewRecord({ eventName: "", topic: "", organizer: "", date: "" });
    }
  };

  const removePastRecord = (index) => {
    setFormData({
      ...formData,
      pastSpeakingRecords: formData.pastSpeakingRecords.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            My Profile
          </h1>
          <p className="text-gray-600 dark:text-zinc-400 mt-1">
            Manage your speaker profile and information
          </p>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-all"
          >
            <Edit3 size={16} /> Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-zinc-400 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-all"
            >
              <Save size={16} /> {saving ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white/80 dark:bg-[#1a1a2e]/80 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-white/5 p-6 text-center">
          <div className="w-24 h-24 mx-auto rounded-2xl overflow-hidden mb-4 bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            {profile?.headshot || profile?.avatar ? (
              <img
                src={profile.headshot || profile.avatar}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={40} className="text-white" />
            )}
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {profile?.name}
          </h2>
          <p className="text-sm text-gray-500 dark:text-zinc-500">{profile?.email}</p>

          {/* Rating */}
          <div className="flex items-center justify-center gap-1 mt-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={16}
                className={
                  star <= Math.round(profile?.avgRating || 0)
                    ? "text-amber-400 fill-amber-400"
                    : "text-gray-300 dark:text-zinc-700"
                }
              />
            ))}
            <span className="ml-1 text-sm text-gray-600 dark:text-zinc-400">
              ({profile?.avgRating || 0})
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">
            {profile?.totalReviews || 0} reviews
          </p>

          {/* Social Links */}
          {!editing && (
            <div className="flex justify-center gap-3 mt-4">
              {profile?.socialLinks?.linkedin && (
                <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg">
                  <Linkedin size={18} className="text-blue-600" />
                </a>
              )}
              {profile?.socialLinks?.twitter && (
                <a href={profile.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg">
                  <Twitter size={18} className="text-sky-500" />
                </a>
              )}
              {profile?.socialLinks?.github && (
                <a href={profile.socialLinks.github} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg">
                  <Github size={18} className="text-gray-800 dark:text-zinc-300" />
                </a>
              )}
              {profile?.socialLinks?.website && (
                <a href={profile.socialLinks.website} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg">
                  <Globe size={18} className="text-emerald-600" />
                </a>
              )}
            </div>
          )}

          {/* Specializations */}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {(editing ? formData.specializations : profile?.specializations || []).map((spec, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 flex items-center gap-1"
              >
                {spec}
                {editing && (
                  <button onClick={() => removeSpecialization(i)}>
                    <Trash2 size={10} />
                  </button>
                )}
              </span>
            ))}
          </div>
          {editing && (
            <div className="flex gap-2 mt-2 justify-center">
              <input
                type="text"
                placeholder="Add specialization"
                value={newSpec}
                onChange={(e) => setNewSpec(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f0f14] text-sm text-gray-900 dark:text-white w-40 focus:outline-none"
                onKeyDown={(e) => e.key === "Enter" && addSpecialization()}
              />
              <button onClick={addSpecialization} className="p-1.5 bg-emerald-600 text-white rounded-lg">
                <Plus size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bio & Contact */}
          <div className="bg-white/80 dark:bg-[#1a1a2e]/80 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-white/5 p-6 space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-white">About</h3>
            {editing ? (
              <>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Name</label>
                  <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f0f14] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Phone</label>
                  <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f0f14] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Bio</label>
                  <textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f0f14] text-gray-900 dark:text-white text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="Tell organizers about yourself..." />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">Headshot URL</label>
                  <input value={formData.headshot} onChange={(e) => setFormData({ ...formData, headshot: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f0f14] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="URL to your headshot image" />
                </div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm mt-4">Social Links</h4>
                {["linkedin", "twitter", "github", "website"].map((key) => (
                  <div key={key}>
                    <label className="text-xs text-gray-500 uppercase">{key}</label>
                    <input
                      value={formData.socialLinks[key] || ""}
                      onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, [key]: e.target.value } })}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f0f14] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      placeholder={`https://${key}.com/...`}
                    />
                  </div>
                ))}
              </>
            ) : (
              <p className="text-sm text-gray-700 dark:text-zinc-300">
                {profile?.bio || "No bio provided. Click Edit to add one."}
              </p>
            )}
          </div>

          {/* Past Speaking Records */}
          <div className="bg-white/80 dark:bg-[#1a1a2e]/80 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-white/5 p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Briefcase size={18} /> Past Speaking Records
            </h3>
            <div className="space-y-3">
              {(editing ? formData.pastSpeakingRecords : profile?.pastSpeakingRecords || []).map((record, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900 dark:text-white">{record.eventName}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-500">
                      {record.topic && `${record.topic} • `}
                      {record.organizer && `${record.organizer} • `}
                      {record.date && new Date(record.date).toLocaleDateString()}
                    </p>
                  </div>
                  {editing && (
                    <button onClick={() => removePastRecord(i)} className="p-1 hover:bg-red-50 rounded">
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  )}
                </div>
              ))}
              {(editing ? formData.pastSpeakingRecords : profile?.pastSpeakingRecords || []).length === 0 && (
                <p className="text-sm text-gray-500 dark:text-zinc-500 text-center py-4">
                  No past speaking records
                </p>
              )}
            </div>
            {editing && (
              <div className="mt-4 p-3 rounded-xl bg-gray-50 dark:bg-white/5 space-y-2">
                <p className="text-xs font-medium text-gray-600 dark:text-zinc-400">Add record</p>
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="Event name" value={newRecord.eventName} onChange={(e) => setNewRecord({ ...newRecord, eventName: e.target.value })} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f0f14] text-sm text-gray-900 dark:text-white focus:outline-none" />
                  <input placeholder="Topic" value={newRecord.topic} onChange={(e) => setNewRecord({ ...newRecord, topic: e.target.value })} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f0f14] text-sm text-gray-900 dark:text-white focus:outline-none" />
                  <input placeholder="Organizer" value={newRecord.organizer} onChange={(e) => setNewRecord({ ...newRecord, organizer: e.target.value })} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f0f14] text-sm text-gray-900 dark:text-white focus:outline-none" />
                  <input type="date" value={newRecord.date} onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f0f14] text-sm text-gray-900 dark:text-white focus:outline-none" />
                </div>
                <button
                  onClick={addPastRecord}
                  disabled={!newRecord.eventName.trim()}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs disabled:opacity-50"
                >
                  <Plus size={12} /> Add
                </button>
              </div>
            )}
          </div>

          {/* Reviews from organizers */}
          {profile?.reviews?.length > 0 && (
            <div className="bg-white/80 dark:bg-[#1a1a2e]/80 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-white/5 p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Star size={18} /> Reviews from Organizers
              </h3>
              <div className="space-y-3">
                {profile.reviews.map((review, i) => (
                  <div key={i} className="p-4 rounded-xl bg-gray-50 dark:bg-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={12}
                            className={star <= review.rating ? "text-amber-400 fill-amber-400" : "text-gray-300"}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-zinc-500">
                        by {review.organizer?.name || "Unknown"}
                      </span>
                    </div>
                    {review.review && (
                      <p className="text-sm text-gray-700 dark:text-zinc-300">{review.review}</p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-zinc-600 mt-2">
                      {review.event?.title && `${review.event.title} • `}
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
