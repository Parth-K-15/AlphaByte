import { useState, useEffect } from "react";
import { Award, Download, ExternalLink, Calendar } from "lucide-react";

const API_BASE = "http://localhost:5000/api";

const Certificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const email = localStorage.getItem("participantEmail") || "";

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE}/participant/certificates${email ? `?email=${encodeURIComponent(email)}` : ""}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );
      const data = await response.json();

      if (data.success) {
        setCertificates(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching certificates:", error);
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
      <div className="bg-dark rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-lime/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Certificates</h1>
          <p className="text-dark-200">Your achievements and certifications</p>
          <div className="mt-4 inline-flex items-center gap-2 bg-lime/10 border border-lime/20 px-4 py-2 rounded-xl">
            <Award size={16} className="text-lime" />
            <span className="text-lime font-bold text-sm">
              {certificates.length} Certificates
            </span>
          </div>
        </div>
      </div>

      {/* Certificates Grid */}
      {certificates.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-card p-12 text-center border border-light-400/50">
          <div className="w-20 h-20 bg-lime rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Award size={32} className="text-dark" />
          </div>
          <h3 className="text-xl font-bold text-dark mb-2">
            No Certificates Yet
          </h3>
          <p className="text-dark-300 text-sm">
            Attend events to earn certificates!
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {certificates.map((cert, index) => {
            const variant =
              index % 3 === 0 ? "dark" : index % 3 === 1 ? "lime" : "white";

            return (
              <div
                key={cert._id}
                className={`rounded-3xl p-6 transition-all hover:scale-[1.02] ${
                  variant === "dark"
                    ? "bg-dark text-white"
                    : variant === "lime"
                      ? "bg-lime text-dark"
                      : "bg-white text-dark shadow-card border border-light-400/50"
                }`}
              >
                {/* Certificate Icon */}
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
                    variant === "dark"
                      ? "bg-lime/15"
                      : variant === "lime"
                        ? "bg-dark/10"
                        : "bg-lime/20"
                  }`}
                >
                  <Award
                    size={24}
                    className={
                      variant === "dark"
                        ? "text-lime"
                        : variant === "lime"
                          ? "text-dark"
                          : "text-dark"
                    }
                  />
                </div>

                <h3 className="font-bold text-lg mb-1">
                  {cert.event?.title || cert.eventName || "Certificate"}
                </h3>

                <div
                  className={`flex items-center gap-1 text-sm mb-4 ${
                    variant === "dark"
                      ? "text-dark-200"
                      : variant === "lime"
                        ? "text-dark/70"
                        : "text-dark-300"
                  }`}
                >
                  <Calendar size={14} />
                  {formatDate(cert.issuedDate || cert.createdAt)}
                </div>

                <div
                  className={`inline-flex px-3 py-1 rounded-full text-xs font-bold mb-4 ${
                    cert.status === "ISSUED" || cert.status === "ACTIVE"
                      ? variant === "dark"
                        ? "bg-lime/15 text-lime"
                        : "bg-dark/10 text-dark"
                      : variant === "dark"
                        ? "bg-dark-400 text-dark-200"
                        : "bg-light-400 text-dark-300"
                  }`}
                >
                  {cert.status || "ISSUED"}
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-2">
                  {cert.certificateUrl && (
                    <>
                      <a
                        href={cert.certificateUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-center flex items-center justify-center gap-1 transition-all hover:scale-105 ${
                          variant === "dark"
                            ? "bg-lime text-dark"
                            : variant === "lime"
                              ? "bg-dark text-lime"
                              : "bg-dark text-white"
                        }`}
                      >
                        <ExternalLink size={14} /> View
                      </a>
                      <a
                        href={cert.certificateUrl}
                        download
                        className={`py-2.5 px-4 rounded-xl text-sm font-bold flex items-center gap-1 transition-all hover:scale-105 ${
                          variant === "dark"
                            ? "bg-lime/10 text-lime border border-lime/20"
                            : variant === "lime"
                              ? "bg-dark/10 text-dark"
                              : "bg-lime/20 text-dark"
                        }`}
                      >
                        <Download size={14} />
                      </a>
                    </>
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

export default Certificates;
