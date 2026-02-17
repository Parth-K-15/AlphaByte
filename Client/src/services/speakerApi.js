const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
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
    // On 401, clear stale token and notify AuthContext
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('userId');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth:expired'));
    }
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
};

// Dashboard
export const getDashboardStats = () => fetchApi('/speaker/dashboard');

// Sessions
export const getSessions = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return fetchApi(`/speaker/sessions${query ? `?${query}` : ''}`);
};

export const getSession = (id) => fetchApi(`/speaker/sessions/${id}`);

export const updateSession = (id, data) =>
  fetchApi(`/speaker/sessions/${id}`, { method: 'PUT', body: data });

export const respondToAssignment = (sessionId, decision, reason) =>
  fetchApi(`/speaker/sessions/${sessionId}/assignment`, {
    method: 'PUT',
    body: { decision, reason },
  });

// Materials
export const uploadMaterial = (sessionId, data) =>
  fetchApi(`/speaker/sessions/${sessionId}/materials`, { method: 'POST', body: data });

export const deleteMaterial = (sessionId, materialId) =>
  fetchApi(`/speaker/sessions/${sessionId}/materials/${materialId}`, { method: 'DELETE' });

// Session Updates
export const postSessionUpdate = (sessionId, data) =>
  fetchApi(`/speaker/sessions/${sessionId}/updates`, { method: 'POST', body: data });

// Analytics
export const getSessionAnalytics = (sessionId) =>
  fetchApi(`/speaker/sessions/${sessionId}/analytics`);

// Profile
export const getProfile = () => fetchApi('/speaker/profile');

export const updateProfile = (data) =>
  fetchApi('/speaker/profile', { method: 'PUT', body: data });

// Auth (speaker-specific)
export const speakerSignup = (data) =>
  fetchApi('/auth/speaker/signup', { method: 'POST', body: data });

// Speaker Requests / Invitations
export const getRequests = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return fetchApi(`/speaker/requests${query ? `?${query}` : ''}`);
};

export const respondToRequest = (requestId, decision, reason) =>
  fetchApi(`/speaker/requests/${requestId}`, {
    method: 'PUT',
    body: { decision, reason },
  });
