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

// Events
export const getAllEvents = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return fetchApi(`/participant/events${query ? `?${query}` : ''}`);
};

export const getEventDetails = (eventId) => fetchApi(`/participant/events/${eventId}`);

// Registrations
export const getMyRegistrations = (participantId) => fetchApi(`/participant/registrations/${participantId}`);
export const registerForEvent = (data) => fetchApi('/participant/register', { method: 'POST', body: data });
export const cancelRegistration = (registrationId) => fetchApi(`/participant/registrations/${registrationId}/cancel`, { method: 'DELETE' });

// Certificates
export const getMyCertificates = (email) => fetchApi(`/participant/certificates?email=${encodeURIComponent(email)}`);
export const requestCertificate = (data) => fetchApi('/participant/certificates/request', { method: 'POST', body: data });

// Profile
export const getProfile = (participantId) => fetchApi(`/participant/profile/${participantId}`);
export const updateProfile = (participantId, data) => fetchApi(`/participant/profile/${participantId}`, { method: 'PUT', body: data });

// Transcript
export const syncTranscript = () => fetchApi('/transcript/sync', { method: 'POST' });
export const getTranscript = () => fetchApi('/transcript');
export const addTranscriptRole = (data) => fetchApi('/transcript/role', { method: 'POST', body: data });
export const deleteTranscriptRole = (roleId) => fetchApi(`/transcript/role/${roleId}`, { method: 'DELETE' });

export default {
  getAllEvents,
  getEventDetails,
  getMyRegistrations,
  registerForEvent,
  cancelRegistration,
  getMyCertificates,
  requestCertificate,
  getProfile,
  updateProfile,
  syncTranscript,
  getTranscript,
  addTranscriptRole,
  deleteTranscriptRole
};
