const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthHeader = () => {
  const rawToken = localStorage.getItem('token');
  if (!rawToken) return {};

  let token = rawToken.trim();
  if (token.startsWith('"') && token.endsWith('"')) {
    token = token.slice(1, -1);
  }
  if (token.toLowerCase().startsWith('bearer ')) {
    token = token.slice(7).trim();
  }

  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Generic fetch wrapper
const fetchApi = async (endpoint, options = {}) => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...options.headers,
    },
    ...options,
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return { data };
};

// Dashboard
export const getDashboardStats = () => {
  const organizerId = localStorage.getItem('userId') || localStorage.getItem('organizerId');
  const query = organizerId ? `?organizerId=${organizerId}` : '';
  return fetchApi(`/organizer/dashboard${query}`);
};

// Events
export const getAssignedEvents = (organizerId) => {
  const query = organizerId ? `?organizerId=${organizerId}` : '';
  return fetchApi(`/organizer/events${query}`);
};
export const getEventDetails = (eventId) => fetchApi(`/organizer/events/${eventId}`);
export const updateEventInfo = (eventId, data) => fetchApi(`/organizer/events/${eventId}`, { method: 'PUT', body: data });
export const updateEventLifecycle = (eventId, status) => fetchApi(`/organizer/events/${eventId}/lifecycle`, { method: 'PUT', body: { status } });

// Event Updates / Timeline
export const getEventUpdates = (eventId) => fetchApi(`/organizer/updates/${eventId}`);
export const createEventUpdate = (data) => fetchApi('/organizer/updates', { method: 'POST', body: data });
export const deleteEventUpdate = (updateId, organizerId) => fetchApi(`/organizer/updates/${updateId}`, { method: 'DELETE', body: { organizerId } });
export const togglePinUpdate = (updateId, organizerId) => fetchApi(`/organizer/updates/${updateId}/pin`, { method: 'PATCH', body: { organizerId } });

// Participants
export const getParticipants = (eventId, params = {}) => {
  const query = new URLSearchParams(params).toString();
  return fetchApi(`/organizer/participants/${eventId}${query ? `?${query}` : ''}`);
};
export const addParticipant = (eventId, data) => fetchApi(`/organizer/participants/${eventId}`, { method: 'POST', body: data });
export const updateParticipant = (eventId, participantId, data) => fetchApi(`/organizer/participants/${eventId}/${participantId}`, { method: 'PUT', body: data });
export const removeParticipant = (eventId, participantId, organizerId) => fetchApi(`/organizer/participants/${eventId}/${participantId}`, { method: 'DELETE', body: { organizerId } });

// Attendance
export const generateQRCode = (eventId, geoData = {}) => fetchApi(`/organizer/attendance/${eventId}/generate-qr`, { method: 'POST', body: geoData });
export const markAttendance = (data) => fetchApi('/organizer/attendance/mark', { method: 'POST', body: data });
export const getAttendanceLogs = (eventId, params = {}) => {
  const query = new URLSearchParams(params).toString();
  return fetchApi(`/organizer/attendance/${eventId}${query ? `?${query}` : ''}`);
};
export const getLiveAttendanceCount = (eventId) => fetchApi(`/organizer/attendance/${eventId}/live`);
export const markManualAttendance = (eventId, participantId) => {
  const organizerId = localStorage.getItem('userId');
  return fetchApi(`/organizer/attendance/${eventId}/manual/${participantId}`, { 
    method: 'POST', 
    body: { organizerId } 
  });
};
export const unmarkAttendance = (eventId, participantId) => {
  return fetchApi(`/organizer/attendance/${eventId}/unmark/${participantId}`, { 
    method: 'DELETE'
  });
};

// Certificates
export const getCertificateStats = (eventId) => fetchApi(`/organizer/certificates/${eventId}/stats`);
export const generateCertificates = (eventId, data) => fetchApi(`/organizer/certificates/${eventId}/generate`, { method: 'POST', body: data });
export const sendCertificates = (eventId, data) => fetchApi(`/organizer/certificates/${eventId}/send`, { method: 'POST', body: data });
export const getCertificateLogs = (eventId, params = {}) => {
  const query = new URLSearchParams(params).toString();
  return fetchApi(`/organizer/certificates/${eventId}${query ? `?${query}` : ''}`);
};
export const resendCertificate = (certificateId, organizerId) => fetchApi(`/organizer/certificates/${certificateId}/resend`, { method: 'POST', body: { organizerId } });
export const getCertificateRequests = (eventId, status) => {
  const query = status ? `?status=${status}` : '';
  return fetchApi(`/organizer/certificates/${eventId}/requests${query}`);
};
export const approveCertificateRequest = (requestId, data) => 
  fetchApi(`/organizer/certificates/request/${requestId}/approve`, { method: 'POST', body: data });
export const rejectCertificateRequest = (requestId, data) => 
  fetchApi(`/organizer/certificates/request/${requestId}/reject`, { method: 'POST', body: data });

// Email debugging endpoints
export const testEmailConfiguration = () => fetchApi('/organizer/email/test');
export const getEmailLogs = (eventId) => fetchApi(`/organizer/email/logs/${eventId}`);

// Communication
export const sendEmail = (data) => fetchApi('/organizer/communication/email', { method: 'POST', body: data });
export const getCommunicationHistory = (eventId, params = {}) => {
  const query = new URLSearchParams(params).toString();
  return fetchApi(`/organizer/communication/${eventId}${query ? `?${query}` : ''}`);
};
export const createAnnouncement = (data) => fetchApi('/organizer/communication/announcement', { method: 'POST', body: data });
export const getEmailTemplates = () => fetchApi('/organizer/communication/templates');
export const testEmailConfig = () => fetchApi('/organizer/communication/test');
export const debugParticipants = (eventId) => fetchApi(`/organizer/communication/debug-participants/${eventId}`);

// Team Access (Team Lead Only)
export const getTeamMembers = (eventId) => fetchApi(`/organizer/team/${eventId}`);
export const addTeamMember = (eventId, data) => fetchApi(`/organizer/team/${eventId}`, { method: 'POST', body: data });
export const removeTeamMember = (eventId, memberId, organizerId) => fetchApi(`/organizer/team/${eventId}/${memberId}`, { method: 'DELETE', body: { organizerId } });
export const updateTeamMemberPermissions = (eventId, memberId, permissions, organizerId) => 
  fetchApi(`/organizer/team/${eventId}/${memberId}/permissions`, { method: 'PUT', body: { permissions, organizerId } });

// Logs & Audit Trail
export const getLogs = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return fetchApi(`/organizer/logs${query ? `?${query}` : ''}`);
};

// Permissions
export const getMyPermissions = (eventId) => fetchApi(`/organizer/my-permissions/${eventId}`);
// Retroactive Change & Audit Trail
export const invalidateAttendance = (attendanceId, reason, organizerId) =>
  fetchApi(`/organizer/attendance/${attendanceId}/invalidate`, {
    method: 'POST',
    body: { reason, organizerId }
  });

export const revokeCertificate = (certificateId, reason, organizerId) =>
  fetchApi(`/organizer/certificates/${certificateId}/revoke`, {
    method: 'POST',
    body: { reason, organizerId }
  });

export const invalidateParticipant = (participantId, reason, organizerId) =>
  fetchApi(`/organizer/participants/${participantId}/invalidate`, {
    method: 'POST',
    body: { reason, organizerId }
  });

export const getAuditTrail = (entityType, entityId) =>
  fetchApi(`/organizer/audit-trail/${entityType}/${entityId}`);

export default {
  getDashboardStats,
  getAssignedEvents,
  getEventDetails,
  updateEventInfo,
  getEventUpdates,
  createEventUpdate,
  deleteEventUpdate,
  togglePinUpdate,
  getParticipants,
  addParticipant,
  updateParticipant,
  removeParticipant,
  generateQRCode,
  markAttendance,
  getAttendanceLogs,
  getLiveAttendanceCount,
  markManualAttendance,
  generateCertificates,
  sendCertificates,
  getCertificateLogs,
  resendCertificate,
  sendEmail,
  getCommunicationHistory,
  createAnnouncement,
  getEmailTemplates,
  getTeamMembers,
  addTeamMember,
  removeTeamMember,
  updateTeamMemberPermissions,
  getLogs,
  getMyPermissions,
  invalidateAttendance,
  revokeCertificate,
  invalidateParticipant,
  getAuditTrail,
};
