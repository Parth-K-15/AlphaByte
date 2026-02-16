import SpeakerAuth from '../models/SpeakerAuth.js';
import SpeakerReview from '../models/SpeakerReview.js';
import Session from '../models/Session.js';
import Event from '../models/Event.js';

/**
 * Speaker Recommendation Engine
 * 
 * Hybrid approach: Content-Based + Rule-Based scoring
 * Uses existing models: SpeakerAuth, SpeakerReview, Session, Event
 * 
 * Scoring Breakdown (100 points max):
 *  - Specialization match to event category/tags:  30 pts
 *  - Past speaking record relevance:               15 pts
 *  - Average rating from reviews:                  20 pts
 *  - Session experience (total completed):         10 pts
 *  - Reliability (completion rate):                10 pts
 *  - Recency (recent activity bonus):              10 pts
 *  - Bio keyword match:                             5 pts
 */

// ===== SCORING WEIGHTS =====
const WEIGHTS = {
  specializationMatch: 30,
  pastRecordRelevance: 15,
  rating: 20,
  sessionExperience: 10,
  reliability: 10,
  recency: 10,
  bioKeywordMatch: 5,
};

// ===== STOP WORDS =====
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'can', 'shall', 'and', 'or', 'but', 'if',
  'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between',
  'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from',
  'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'this', 'that',
  'these', 'those', 'it', 'its', 'event', 'join', 'us', 'all', 'each',
  'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
  'not', 'only', 'same', 'so', 'than', 'too', 'very', 'just', 'because',
  'as', 'until', 'into', 'also', 'how', 'where', 'when', 'who', 'which',
  'what', 'there', 'their', 'here', 'our', 'your', 'we', 'you', 'they',
  'will', 'students', 'participants', 'come', 'get', 'learn', 'day',
]);

/**
 * Extract meaningful keywords from text
 */
function extractKeywords(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s\-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

/**
 * Compute keyword frequency map
 */
function keywordFrequency(words) {
  const freq = {};
  words.forEach((w) => { freq[w] = (freq[w] || 0) + 1; });
  return freq;
}

/**
 * Get top N keywords by frequency
 */
function topKeywords(text, n = 25) {
  const freq = keywordFrequency(extractKeywords(text));
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([word]) => word);
}

/**
 * Count overlapping terms between two arrays (case-insensitive, partial match)
 */
function countOverlap(arr1, arr2) {
  const set1 = arr1.map((s) => s.toLowerCase().trim());
  const set2 = arr2.map((s) => s.toLowerCase().trim());
  let count = 0;
  for (const a of set1) {
    for (const b of set2) {
      if (a === b || a.includes(b) || b.includes(a)) {
        count++;
        break; // count each arr1 term at most once
      }
    }
  }
  return count;
}

/**
 * Main recommendation function
 * @param {string} eventId - The event to find speakers for
 * @param {Object} options - Filters
 * @returns {Array} Ranked speakers with scores
 */
export async function getRecommendedSpeakers(eventId, options = {}) {
  const { limit = 20, minRating = 0, excludeSpeakerIds = [] } = options;

  // 1. Fetch the event
  const event = await Event.findById(eventId);
  if (!event) throw new Error('Event not found');

  // 2. Extract event features
  const eventCategory = (event.category || '').toLowerCase();
  const eventTags = (event.tags || []).map((t) => t.toLowerCase());
  const eventTitle = (event.title || '').toLowerCase();
  const eventDescription = (event.description || '').toLowerCase();
  const eventKeywords = topKeywords(`${event.title} ${event.description}`, 30);

  // All event terms for matching
  const eventTerms = [...new Set([
    eventCategory,
    ...eventTags,
    ...eventKeywords,
  ])].filter(Boolean);

  // 3. Fetch all active speakers
  const speakerFilter = {
    isActive: true,
    isSuspended: { $ne: true },
    _id: { $nin: excludeSpeakerIds },
  };
  const candidates = await SpeakerAuth.find(speakerFilter).select('-password');

  // 4. Pre-fetch all reviews and sessions for efficiency
  const speakerIds = candidates.map((s) => s._id);

  const [allReviews, allSessions] = await Promise.all([
    SpeakerReview.find({ speaker: { $in: speakerIds } }),
    Session.find({ speaker: { $in: speakerIds } }),
  ]);

  // Group by speaker
  const reviewMap = {};
  allReviews.forEach((r) => {
    const sid = r.speaker.toString();
    if (!reviewMap[sid]) reviewMap[sid] = [];
    reviewMap[sid].push(r);
  });

  const sessionMap = {};
  allSessions.forEach((s) => {
    const sid = s.speaker.toString();
    if (!sessionMap[sid]) sessionMap[sid] = [];
    sessionMap[sid].push(s);
  });

  // 5. Score each speaker
  const scored = candidates.map((speaker) => {
    const sid = speaker._id.toString();
    const reviews = reviewMap[sid] || [];
    const sessions = sessionMap[sid] || [];
    const breakdown = {};
    let total = 0;

    // ----- (A) SPECIALIZATION MATCH (30 pts) -----
    const specs = (speaker.specializations || []);
    const overlap = countOverlap(specs, eventTerms);
    const maxPossible = Math.max(specs.length, 1);
    const specScore = Math.min((overlap / maxPossible) * WEIGHTS.specializationMatch, WEIGHTS.specializationMatch);

    // Bonus: direct category match
    const directCategoryMatch = specs.some(
      (s) => s.toLowerCase() === eventCategory ||
             eventCategory.includes(s.toLowerCase()) ||
             s.toLowerCase().includes(eventCategory)
    );
    const specFinal = directCategoryMatch
      ? Math.min(specScore + 5, WEIGHTS.specializationMatch)
      : specScore;

    breakdown.specializationMatch = {
      score: round(specFinal),
      max: WEIGHTS.specializationMatch,
      matchedCount: overlap,
      totalSpecializations: specs.length,
      directCategoryMatch,
    };
    total += specFinal;

    // ----- (B) PAST SPEAKING RECORD RELEVANCE (15 pts) -----
    const pastRecords = speaker.pastSpeakingRecords || [];
    let pastRelevance = 0;
    if (pastRecords.length > 0) {
      const pastTopics = pastRecords.map((r) => (r.topic || '').toLowerCase());
      const pastEventNames = pastRecords.map((r) => (r.eventName || '').toLowerCase());
      const allPastText = [...pastTopics, ...pastEventNames];

      // Check how many past topics relate to this event
      let relevantCount = 0;
      for (const pt of allPastText) {
        const ptKeywords = extractKeywords(pt);
        if (ptKeywords.some((k) => eventTerms.some((et) => et.includes(k) || k.includes(et)))) {
          relevantCount++;
        }
      }
      pastRelevance = Math.min(
        (relevantCount / allPastText.length) * WEIGHTS.pastRecordRelevance,
        WEIGHTS.pastRecordRelevance
      );
    }
    breakdown.pastRecordRelevance = {
      score: round(pastRelevance),
      max: WEIGHTS.pastRecordRelevance,
      totalRecords: pastRecords.length,
    };
    total += pastRelevance;

    // ----- (C) AVERAGE RATING (20 pts) -----
    let avgRating = 0;
    if (reviews.length > 0) {
      avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    }
    const ratingScore = reviews.length > 0
      ? (avgRating / 5) * WEIGHTS.rating
      : WEIGHTS.rating * 0.25; // small base for unrated speakers
    breakdown.rating = {
      score: round(ratingScore),
      max: WEIGHTS.rating,
      avgRating: round(avgRating),
      totalReviews: reviews.length,
    };
    total += ratingScore;

    // ----- (D) SESSION EXPERIENCE (10 pts) -----
    const completedSessions = sessions.filter((s) => s.status === 'completed').length;
    const totalSessionCount = sessions.length;
    // Logarithmic scale: 1 session = 3pts, 3 sessions = 6pts, 5+ sessions = 10pts
    const expScore = Math.min(
      Math.log2(completedSessions + 1) * 3,
      WEIGHTS.sessionExperience
    );
    // Also consider pastSpeakingRecords count
    const pastBonus = Math.min(pastRecords.length * 0.5, 3);
    const experienceFinal = Math.min(expScore + pastBonus, WEIGHTS.sessionExperience);

    breakdown.sessionExperience = {
      score: round(experienceFinal),
      max: WEIGHTS.sessionExperience,
      completedSessions,
      totalSessions: totalSessionCount,
      pastRecordCount: pastRecords.length,
    };
    total += experienceFinal;

    // ----- (E) RELIABILITY (10 pts) -----
    let reliabilityScore = WEIGHTS.reliability * 0.5; // default for new speakers
    if (totalSessionCount > 0) {
      const completionRate = completedSessions / totalSessionCount;
      const cancelledOrRejected = sessions.filter(
        (s) => s.status === 'cancelled' || s.status === 'rejected'
      ).length;
      const penaltyRate = cancelledOrRejected / totalSessionCount;
      reliabilityScore = Math.max(0, (completionRate - penaltyRate * 0.5) * WEIGHTS.reliability);
    }
    breakdown.reliability = {
      score: round(reliabilityScore),
      max: WEIGHTS.reliability,
      completionRate: totalSessionCount > 0 ? round(completedSessions / totalSessionCount) : null,
    };
    total += reliabilityScore;

    // ----- (F) RECENCY (10 pts) -----
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Recent sessions
    const recentSessions = sessions.filter((s) => new Date(s.createdAt) > sixMonthsAgo).length;
    // Recent past records
    const recentPastRecords = pastRecords.filter(
      (r) => r.date && new Date(r.date) > sixMonthsAgo
    ).length;
    const recentActivity = recentSessions + recentPastRecords;
    const recencyScore = Math.min(recentActivity * 2.5, WEIGHTS.recency);

    breakdown.recency = {
      score: round(recencyScore),
      max: WEIGHTS.recency,
      recentActivity,
    };
    total += recencyScore;

    // ----- (G) BIO KEYWORD MATCH (5 pts) -----
    let bioScore = 0;
    if (speaker.bio) {
      const bioKeywords = extractKeywords(speaker.bio);
      const bioOverlap = bioKeywords.filter((bk) =>
        eventTerms.some((et) => et.includes(bk) || bk.includes(et))
      ).length;
      bioScore = Math.min((bioOverlap / Math.max(bioKeywords.length, 1)) * WEIGHTS.bioKeywordMatch * 3, WEIGHTS.bioKeywordMatch);
    }
    breakdown.bioKeywordMatch = {
      score: round(bioScore),
      max: WEIGHTS.bioKeywordMatch,
    };
    total += bioScore;

    // Clamp to 100
    total = Math.min(total, 100);

    return {
      speaker,
      totalScore: round(total),
      breakdown,
      avgRating: round(avgRating),
      totalReviews: reviews.length,
      totalSessions: totalSessionCount,
      completedSessions,
    };
  });

  // 6. Filter by minRating
  const filtered = minRating > 0
    ? scored.filter((s) => s.avgRating >= minRating)
    : scored;

  // 7. Sort by score descending
  filtered.sort((a, b) => b.totalScore - a.totalScore);

  // 8. Return top N
  return filtered.slice(0, limit).map((item, idx) => ({
    rank: idx + 1,
    speaker: {
      _id: item.speaker._id,
      name: item.speaker.name,
      email: item.speaker.email,
      phone: item.speaker.phone,
      bio: item.speaker.bio,
      specializations: item.speaker.specializations,
      socialLinks: item.speaker.socialLinks,
      headshot: item.speaker.headshot,
      avatar: item.speaker.avatar,
      pastSpeakingRecords: item.speaker.pastSpeakingRecords,
    },
    matchScore: item.totalScore,
    matchPercentage: item.totalScore,
    avgRating: item.avgRating,
    totalReviews: item.totalReviews,
    totalSessions: item.totalSessions,
    completedSessions: item.completedSessions,
    breakdown: item.breakdown,
  }));
}

function round(n) {
  return Math.round(n * 10) / 10;
}
