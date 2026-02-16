import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Shield,
  ShieldCheck,
  ShieldX,
  User,
  Calendar,
  MapPin,
  Award,
  Building2,
  Clock,
  ExternalLink,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://eventsync-blue.vercel.app/api';

const CertificateVerify = () => {
  const { verificationId } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVerification = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_BASE_URL}/verify/${verificationId}`);
        const json = await res.json();

        if (!res.ok || !json.success) {
          setError(json.message || 'Certificate not found');
          return;
        }

        setData(json.data);
      } catch (err) {
        console.error('Verification fetch error:', err);
        setError('Unable to verify certificate. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (verificationId) {
      fetchVerification();
    }
  }, [verificationId]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Verifying Certificate...</h2>
          <p className="text-gray-500 mt-2">Please wait while we verify the authenticity.</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldX className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 text-red-700 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>This QR code may be invalid or the certificate does not exist in our system.</span>
            </div>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  // Revoked certificate
  if (data && !data.verified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Certificate Revoked</h1>
          <p className="text-gray-600 mb-4">This certificate is no longer valid.</p>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4 text-left">
            <p className="text-sm text-orange-800">
              <strong>Certificate ID:</strong> {data.certificateId}
            </p>
            {data.revokedAt && (
              <p className="text-sm text-orange-800 mt-1">
                <strong>Revoked On:</strong> {formatDateTime(data.revokedAt)}
              </p>
            )}
            {data.revocationReason && (
              <p className="text-sm text-orange-800 mt-1">
                <strong>Reason:</strong> {data.revocationReason}
              </p>
            )}
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  // Verified certificate
  const cert = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Verification Badge */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-8 text-center text-white">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">Certificate Verified</h1>
            <p className="text-emerald-100 text-sm">This certificate is authentic and valid</p>
            <div className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>{cert.certificateId}</span>
            </div>
          </div>

          {/* Participant Info */}
          <div className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{cert.participant?.name}</h2>
                {cert.participant?.college && (
                  <p className="text-sm text-gray-500">
                    {cert.participant.college}
                    {cert.participant.branch ? ` • ${cert.participant.branch}` : ''}
                    {cert.participant.year ? ` • ${cert.participant.year}` : ''}
                  </p>
                )}
              </div>
            </div>

            {/* Achievement Badge */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-300 rounded-full px-5 py-2">
                <Award className="w-5 h-5 text-amber-600" />
                <span className="font-semibold text-amber-800">{cert.achievement}</span>
              </div>
              {cert.competitionName && cert.competitionName !== cert.event?.name && (
                <p className="text-sm text-gray-500 mt-2">
                  Competition: <span className="font-medium text-gray-700">{cert.competitionName}</span>
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 my-5"></div>

            {/* Event Details */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Event Details</h3>
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">{cert.event?.name}</p>
                    {cert.event?.category && (
                      <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 mt-1 inline-block">
                        {cert.event.category}
                      </span>
                    )}
                    {cert.event?.type && (
                      <span className="text-xs bg-purple-100 text-purple-700 rounded-full px-2 py-0.5 mt-1 ml-1 inline-block">
                        {cert.event.type}
                      </span>
                    )}
                  </div>
                </div>

                {cert.event?.description && (
                  <p className="text-sm text-gray-600 ml-8 line-clamp-3">{cert.event.description}</p>
                )}

                <div className="flex items-center gap-3 ml-8">
                  <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="text-sm text-gray-600">
                    <span>{formatDate(cert.event?.startDate)}</span>
                    {cert.event?.endDate && cert.event.startDate !== cert.event.endDate && (
                      <span> — {formatDate(cert.event.endDate)}</span>
                    )}
                    {cert.event?.time && <span> • {cert.event.time}</span>}
                  </div>
                </div>

                {(cert.event?.location || cert.event?.venue) && (
                  <div className="flex items-center gap-3 ml-8">
                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-600">
                      {cert.event.venue}{cert.event.venue && cert.event.location ? ', ' : ''}{cert.event.location}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 my-5"></div>

            {/* Organizer & Timestamp */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Issued By</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">{cert.organizer?.name}</p>
                    <p className="text-sm text-gray-500">{cert.organizer?.organization}</p>
                    {cert.organizer?.department && (
                      <p className="text-xs text-gray-400">{cert.organizer.department}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Issued:</span> {formatDateTime(cert.issuedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* View Certificate Image */}
            {cert.cloudinaryUrl && (
              <>
                <div className="border-t border-gray-100 my-5"></div>
                <a
                  href={cert.cloudinaryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-medium shadow-lg shadow-blue-200"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Certificate Image
                </a>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-400">
          <p>Verified by Planix Event Management Platform</p>
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-600 mt-2 font-medium"
          >
            <ArrowLeft className="w-3 h-3" />
            Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CertificateVerify;
