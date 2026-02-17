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
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
};

// Auth API
export const authApi = {
  signup: (data) => fetchApi('/auth/signup', { method: 'POST', body: data }),
  login: (data) => fetchApi('/auth/login', { method: 'POST', body: data }),
  logout: () => fetchApi('/auth/logout', { method: 'POST' }),
  getMe: () => fetchApi('/auth/me'),
  updateProfile: (data) => fetchApi('/auth/profile', { method: 'PUT', body: data }),
  changePassword: (data) => fetchApi('/auth/password', { method: 'PUT', body: data }),
};

// Dashboard API
export const dashboardApi = {
  getStats: () => fetchApi('/dashboard/stats'),
  getActivity: () => fetchApi('/dashboard/activity'),
};

// Reports API
export const reportsApi = {
  getAnalytics: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/reports/analytics${query ? `?${query}` : ''}`);
  },
  getEvents: () => fetchApi('/reports/events'),
};

// Events API
export const eventsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/events${query ? `?${query}` : ''}`);
  },
  getOne: (id) => fetchApi(`/events/${id}`),
  create: (data) => fetchApi('/events', { method: 'POST', body: data }),
  update: (id, data) => fetchApi(`/events/${id}`, { method: 'PUT', body: data }),
  delete: (id) => fetchApi(`/events/${id}`, { method: 'DELETE' }),
  assignTeamLead: (id, teamLeadId) =>
    fetchApi(`/events/${id}/assign-lead`, { method: 'PUT', body: { teamLeadId } }),
  addTeamLead: (id, data) =>
    fetchApi(`/events/${id}/team-leads`, { method: 'POST', body: data }),
  removeTeamLead: (id, userId) =>
    fetchApi(`/events/${id}/team-leads/${userId}`, { method: 'DELETE' }),
  updateLifecycle: (id, status) =>
    fetchApi(`/events/${id}/lifecycle`, { method: 'PUT', body: { status } }),
  addTeamMember: (id, data) =>
    fetchApi(`/events/${id}/team-members`, { method: 'POST', body: data }),
  removeTeamMember: (id, userId) =>
    fetchApi(`/events/${id}/team-members/${userId}`, { method: 'DELETE' }),
  updateEventPermissions: (id, permissions) =>
    fetchApi(`/events/${id}/permissions`, { method: 'PUT', body: permissions }),
  updateTeamMemberPermissions: (id, userId, permissions) =>
    fetchApi(`/events/${id}/team-members/${userId}/permissions`, { method: 'PUT', body: { permissions } }),
};

// Teams API
export const teamsApi = {
  // Team Leads
  getTeamLeads: (includeInactive = false) => fetchApi(`/teams/leads${includeInactive ? '?includeInactive=true' : ''}`),
  createTeamLead: (data) => fetchApi('/teams/leads', { method: 'POST', body: data }),
  deleteTeamLead: (id) => fetchApi(`/teams/users/${id}`, { method: 'DELETE' }),

  // Event Staff / Members
  getMembers: (includeInactive = false) => fetchApi(`/teams/members${includeInactive ? '?includeInactive=true' : ''}`),
  getEventStaff: (teamLeadId) =>
    fetchApi(`/teams/members${teamLeadId ? `?teamLeadId=${teamLeadId}` : ''}`),
  createMember: (data) => fetchApi('/teams/members', { method: 'POST', body: data }),
  createEventStaff: (data) => fetchApi('/teams/members', { method: 'POST', body: data }),

  // User operations
  updateUser: (id, data) => fetchApi(`/teams/${id}`, { method: 'PUT', body: data }),
  deleteUser: (id) => fetchApi(`/teams/users/${id}`, { method: 'DELETE' }),
  resetPassword: (id, newPassword) =>
    fetchApi(`/teams/users/${id}/reset-password`, { method: 'PUT', body: { newPassword } }),

  // Permissions
  getPermissions: () => fetchApi('/teams/permissions'),
  updatePermissions: (permissions) =>
    fetchApi('/teams/permissions', { method: 'PUT', body: { permissions } }),
};

// Users API
export const usersApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/users${query ? `?${query}` : ''}`);
  },
  getOne: (id) => fetchApi(`/users/${id}`),
  toggleStatus: (id) => fetchApi(`/users/${id}/toggle-status`, { method: 'PUT' }),
};

// Access Control API
export const accessControlApi = {
  getRestrictedUsers: () => fetchApi('/access-control/restricted'),
  restrictUser: (userId, reason) =>
    fetchApi('/access-control/restrict', { method: 'POST', body: { userId, reason } }),
  unrestrictUser: (id) => fetchApi(`/access-control/unrestrict/${id}`, { method: 'PUT' }),

  getSuspendedUsers: () => fetchApi('/access-control/suspended'),
  suspendUser: (userId, reason) =>
    fetchApi('/access-control/suspend', { method: 'POST', body: { userId, reason } }),
  unsuspendUser: (id) => fetchApi(`/access-control/unsuspend/${id}`, { method: 'PUT' }),

  deleteUser: (id) => fetchApi(`/access-control/users/${id}`, { method: 'DELETE' }),
};

// Logs API
export const logsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/logs${query ? `?${query}` : ''}`);
  },
  create: (data) => fetchApi('/logs', { method: 'POST', body: data }),
  clear: (olderThan) => fetchApi(`/logs/clear?olderThan=${olderThan}`, { method: 'DELETE' }),
};

export default {
  dashboard: dashboardApi,
  events: eventsApi,
  teams: teamsApi,
  users: usersApi,
  accessControl: accessControlApi,
  logs: logsApi,
};
