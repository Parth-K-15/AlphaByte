import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, Upload, IndianRupee } from "lucide-react";
import { authApi } from "../../services/api";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const PayoutDetails = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    upiId: "",
    payoutQrUrl: "",
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const res = await authApi.getMe();
        const data = res?.data || {};
        setProfile({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          upiId: data.upiId || "",
          payoutQrUrl: data.payoutQrUrl || "",
        });
      } catch (err) {
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleUploadQr = async (file) => {
    if (!file) return;
    setError("");
    setSuccess("");

    try {
      setUploading(true);
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("receipt", file);

      const res = await fetch(`${API_BASE_URL}/finance/upload-receipt`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to upload QR");
      }

      setProfile((prev) => ({ ...prev, payoutQrUrl: data?.data?.url || "" }));
      setSuccess("QR uploaded. Click Save Details to confirm.");
    } catch (err) {
      setError(err.message || "Failed to upload QR");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!profile.upiId.trim()) {
      setError("UPI ID is required for reimbursement");
      return;
    }

    try {
      setSaving(true);
      await authApi.updateProfile({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        upiId: profile.upiId.trim(),
        payoutQrUrl: profile.payoutQrUrl,
      });
      setSuccess("Payout details saved successfully");
    } catch (err) {
      setError(err.message || "Failed to save payout details");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-10 h-10 border-4 border-lime border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Reimbursement Payout Details
        </h1>
        <p className="text-gray-600 dark:text-zinc-400 mt-2">
          Add your UPI ID and account QR so admin can reimburse you faster.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-700">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-lime-50 border border-lime-300 rounded-lg p-4 flex items-center gap-2 text-lime-800">
          <CheckCircle className="w-4 h-4" />
          {success}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/5 rounded-xl p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
              Name
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-black/20 text-gray-900 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-black/20 text-gray-900 dark:text-white"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
            UPI ID
          </label>
          <input
            type="text"
            placeholder="example@upi"
            value={profile.upiId}
            onChange={(e) => setProfile((prev) => ({ ...prev, upiId: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-black/20 text-gray-900 dark:text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
            Account QR Code
          </label>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-white/10 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5">
              <Upload className="w-4 h-4" />
              {uploading ? "Uploading..." : "Upload QR"}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleUploadQr(e.target.files?.[0])}
                className="hidden"
                disabled={uploading}
              />
            </label>

            {profile.payoutQrUrl && (
              <a
                href={profile.payoutQrUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline text-sm"
              >
                View uploaded QR
              </a>
            )}
          </div>

          {profile.payoutQrUrl && (
            <img
              src={profile.payoutQrUrl}
              alt="Payout QR"
              className="mt-3 w-40 h-40 object-cover rounded-lg border border-gray-200 dark:border-white/10"
            />
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-lime text-dark rounded-lg font-semibold disabled:opacity-50"
        >
          <IndianRupee className="w-4 h-4" />
          {saving ? "Saving..." : "Save Details"}
        </button>
      </form>
    </div>
  );
};

export default PayoutDetails;
