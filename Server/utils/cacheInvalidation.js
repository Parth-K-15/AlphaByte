import { deleteCachePattern } from "../middleware/cache.js";
import { CachePatterns } from "./cacheKeys.js";

/**
 * Cache invalidation helpers for different data mutations
 */

export const invalidateEventCache = async (eventId) => {
  await deleteCachePattern(CachePatterns.eventAll(eventId));
  await deleteCachePattern(CachePatterns.allEventLists);
  console.log(`✅ Invalidated cache for event: ${eventId}`);
};

export const invalidateUserCache = async (userId) => {
  await deleteCachePattern(CachePatterns.userAll(userId));
  console.log(`✅ Invalidated cache for user: ${userId}`);
};

export const invalidateParticipantCache = async (email) => {
  await deleteCachePattern(CachePatterns.participantAll(email));
  console.log(`✅ Invalidated cache for participant: ${email}`);
};

export const invalidateFinanceCache = async (eventId) => {
  await deleteCachePattern(CachePatterns.financeAll(eventId));
  await deleteCachePattern(CachePatterns.allBudgets);
  await deleteCachePattern(CachePatterns.allExpenses);
  console.log(`✅ Invalidated finance cache for event: ${eventId}`);
};

export const invalidateDashboardCache = async () => {
  await deleteCachePattern(CachePatterns.allDashboards);
  await deleteCachePattern(CachePatterns.allAnalytics);
  console.log(`✅ Invalidated dashboard and analytics cache`);
};

/**
 * Invalidate multiple cache patterns at once
 */
export const invalidateMultiple = async (...patterns) => {
  await Promise.all(patterns.map((pattern) => deleteCachePattern(pattern)));
};

export default {
  invalidateEventCache,
  invalidateUserCache,
  invalidateParticipantCache,
  invalidateFinanceCache,
  invalidateDashboardCache,
  invalidateMultiple,
};
