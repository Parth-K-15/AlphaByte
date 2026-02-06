const API_BASE_URL = 'http://localhost:5000/api';

// Generic fetch wrapper
const fetchApi = async (endpoint, options = {}) => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
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
export const getDashboardStats = () => fetchApi('/organizer/dashboard');

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
export const deleteEventUpdate = (updateId) => fetchApi(`/organizer/updates/${updateId}`, { method: 'DELETE' });
export const togglePinUpdate = (updateId) => fetchApi(`/organizer/updates/${updateId}/pin`, { method: 'PATCH' });

// Participants
export const getParticipants = (eventId, params = {}) => {
  const query = new URLSearchParams(params).toString();
  return fetchApi(`/organizer/participants/${eventId}${query ? `?${query}` : ''}`);
};
export const addParticipant = (eventId, data) => fetchApi(`/organizer/participants/${eventId}`, { method: 'POST', body: data });
export const updateParticipant = (participantId, data) => fetchApi(`/organizer/participants/${participantId}`, { method: 'PUT', body: data });
export const removeParticipant = (participantId) => fetchApi(`/organizer/participants/${participantId}`, { method: 'DELETE' });

// Attendance
export const generateQRCode = (eventId) => fetchApi(`/organizer/attendance/${eventId}/generate-qr`, { method: 'POST' });
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
export const resendCertificate = (certificateId) => fetchApi(`/organizer/certificates/${certificateId}/resend`, { method: 'POST' });
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
export const removeTeamMember = (eventId, memberId) => fetchApi(`/organizer/team/${eventId}/${memberId}`, { method: 'DELETE' });
export const updateTeamMemberPermissions = (eventId, memberId, permissions) => 
  fetchApi(`/organizer/team/${eventId}/${memberId}/permissions`, { method: 'PUT', body: { permissions } });

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
};
