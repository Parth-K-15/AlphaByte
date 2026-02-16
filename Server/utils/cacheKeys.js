/**
 * Generate standardized cache keys for different data types
 */

export const CacheKeys = {
  // Event keys
  event: (eventId) => `event:${eventId}`,
  eventList: (filters = {}) => {
    const filterStr = Object.entries(filters)
      .sort()
      .map(([k, v]) => `${k}:${v}`)
      .join("|");
    return `events:list${filterStr ? `:${filterStr}` : ""}`;
  },
  organizerEvents: (userId) => `user:${userId}:events`,

  // User keys
  user: (userId) => `user:${userId}`,
  userProfile: (userId) => `user:${userId}:profile`,

  // Participant keys
  participantEvents: (email) => `participant:${email}:events`,
  participantProfile: (email) => `participant:${email}:profile`,
  eventParticipants: (eventId) => `event:${eventId}:participants`,

  // Finance keys
  budget: (eventId) => `finance:${eventId}:budget`,
  budgetsPending: () => `finance:budgets:pending`,
  allBudgets: () => `finance:budgets:all`,
  expenses: (eventId) => `finance:${eventId}:expenses`,
  expensesPending: () => `finance:expenses:pending`,

  // Dashboard keys
  dashboardStats: () => `dashboard:stats`,
  organizerDashboard: (userId) => `user:${userId}:dashboard`,
  analytics: (filters = {}) => {
    const filterStr = Object.entries(filters)
      .sort()
      .map(([k, v]) => `${k}:${v}`)
      .join("|");
    return `analytics${filterStr ? `:${filterStr}` : ""}`;
  },

  // Certificate keys
  certificate: (certId) => `certificate:${certId}`,
  eventCertificates: (eventId) => `event:${eventId}:certificates`,

  // Attendance keys
  attendance: (eventId) => `event:${eventId}:attendance`,
  attendanceLive: (eventId) => `event:${eventId}:attendance:live`,
};

/**
 * Cache key patterns for bulk invalidation
 */
export const CachePatterns = {
  allEvents: "event:*",
  allEventLists: "events:list*",
  userAll: (userId) => `user:${userId}:*`,
  eventAll: (eventId) => `event:${eventId}:*`,
  financeAll: (eventId) => `finance:${eventId}:*`,
  allBudgets: "finance:budgets:*",
  allExpenses: "finance:expenses:*",
  participantAll: (email) => `participant:${email}:*`,
  allDashboards: "dashboard:*",
  allAnalytics: "analytics*",
};

/**
 * Default TTL values (in seconds)
 */
export const CacheTTL = {
  SHORT: 120, // 2 minutes - frequently changing data
  MEDIUM: 300, // 5 minutes - moderately stable data
  LONG: 600, // 10 minutes - stable data
  VERY_LONG: 900, // 15 minutes - rarely changing data
  HOUR: 3600, // 1 hour - very stable data
};

export default {
  CacheKeys,
  CachePatterns,
  CacheTTL,
};
