/**
 * AI Participation Intelligence - Prediction Engine
 * 
 * This module implements a weighted prediction model to calculate
 * the probability of a student not showing up (no-show rate) for an event.
 * 
 * Formula:
 * no_show_probability = 
 *   (1 - student_avg_attendance_rate) * 0.4 +
 *   (event_type_no_show_rate) * 0.3 +
 *   Math.min(days_before_event / 30, 1) * 0.2 +
 *   (student_recent_no_shows / 5) * 0.1
 * 
 * Weights explanation:
 * - 40% based on student's historical attendance
 * - 30% based on event type patterns
 * - 20% based on registration timing (early vs late)
 * - 10% based on recent behavior (last 5 events)
 */

import { eventTypeNoShowRates } from '../pages/ai-intelligence-test/dummyData';

/**
 * Calculate the no-show probability for a student and event combination
 * @param {Object} student - Student object with participation history
 * @param {string} eventType - Type of event (Workshop, Seminar, etc.)
 * @param {number} daysBeforeEvent - Number of days until the event
 * @returns {number} Probability of no-show (0 to 1)
 */
export const calculateNoShowProbability = (student, eventType, daysBeforeEvent) => {
  // Component 1: Student's historical attendance (40% weight)
  const studentAttendanceComponent = (1 - student.avgAttendanceRate) * 0.4;
  
  // Component 2: Event type no-show rate (30% weight)
  const eventTypeNoShowRate = eventTypeNoShowRates[eventType] || 0.2;
  const eventTypeComponent = eventTypeNoShowRate * 0.3;
  
  // Component 3: Registration timing (20% weight)
  // Normalized to max 1.0 (events > 30 days away are capped)
  const timingComponent = Math.min(daysBeforeEvent / 30, 1) * 0.2;
  
  // Component 4: Recent behavior pattern (10% weight)
  // Check last 5 events for no-show pattern
  const recentNoShows = calculateRecentNoShows(student);
  const recentBehaviorComponent = (recentNoShows / 5) * 0.1;
  
  // Calculate final probability
  const noShowProbability = studentAttendanceComponent + 
                            eventTypeComponent + 
                            timingComponent + 
                            recentBehaviorComponent;
  
  // Ensure result is between 0 and 1
  return Math.max(0, Math.min(1, noShowProbability));
};

/**
 * Calculate how many of the last 5 events the student missed
 * @param {Object} student Student object with participation history
 * @returns {number} Count of no-shows in last 5 events (0-5)
 */
const calculateRecentNoShows = (student) => {
  if (!student.participationHistory || student.participationHistory.length === 0) {
    return 0;
  }
  
  // Get last 5 events
  const recentEvents = student.participationHistory
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);
  
  // Count no-shows
  const noShows = recentEvents.filter(event => event.registered && !event.attended).length;
  
  return noShows;
};

/**
 * Predict no-show rate for an entire event
 * @param {Array} registeredStudents - Array of student objects registered for event
 * @param {string} eventType - Type of event
 * @param {number} daysBeforeEvent - Days until event
 * @returns {Object} Prediction results with statistics
 */
export const predictEventNoShowRate = (registeredStudents, eventType, daysBeforeEvent) => {
  if (!registeredStudents || registeredStudents.length === 0) {
    return {
      avgNoShowProbability: 0,
      totalRegistered: 0,
      predictedNoShows: 0,
      predictedAttendance: 0,
      riskLevel: 'LOW',
      studentPredictions: []
    };
  }
  
  // Calculate individual predictions
  const studentPredictions = registeredStudents.map(student => ({
    studentId: student.id,
    studentName: student.name,
    noShowProbability: calculateNoShowProbability(student, eventType, daysBeforeEvent),
    avgAttendanceRate: student.avgAttendanceRate
  }));
  
  // Calculate aggregate stats
  const totalRegistered = registeredStudents.length;
  const avgNoShowProbability = studentPredictions.reduce(
    (sum, pred) => sum + pred.noShowProbability, 0
  ) / totalRegistered;
  
  const predictedNoShows = Math.round(totalRegistered * avgNoShowProbability);
  const predictedAttendance = totalRegistered - predictedNoShows;
  
  // Determine risk level
  let riskLevel = 'LOW';
  if (avgNoShowProbability > 0.4) {
    riskLevel = 'HIGH';
  } else if (avgNoShowProbability > 0.25) {
    riskLevel = 'MEDIUM';
  }
  
  return {
    avgNoShowProbability,
    totalRegistered,
    predictedNoShows,
    predictedAttendance,
    riskLevel,
    studentPredictions: studentPredictions.sort((a, b) => b.noShowProbability - a.noShowProbability)
  };
};

/**
 * Get risk color class for Tailwind CSS
 * @param {string} riskLevel - Risk level (LOW, MEDIUM, HIGH)
 * @returns {Object} Tailwind classes for background and text
 */
export const getRiskColorClass = (riskLevel) => {
  const colors = {
    LOW: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-200',
      badge: 'bg-green-100 text-green-800'
    },
    MEDIUM: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-700',
      border: 'border-yellow-200',
      badge: 'bg-yellow-100 text-yellow-800'
    },
    HIGH: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      badge: 'bg-red-100 text-red-800'
    }
  };
  
  return colors[riskLevel] || colors.LOW;
};

/**
 * Get risk icon emoji
 * @param {string} riskLevel - Risk level
 * @returns {string} Emoji
 */
export const getRiskIcon = (riskLevel) => {
  const icons = {
    LOW: '✅',
    MEDIUM: '⚠️',
    HIGH: '🚨'
  };
  
  return icons[riskLevel] || '❓';
};

/**
 * Generate recommendations based on prediction
 * @param {Object} prediction - Prediction result object
 * @returns {Array} Array of recommendation strings
 */
export const generateRecommendations = (prediction) => {
  const recommendations = [];
  
  if (prediction.riskLevel === 'HIGH') {
    recommendations.push('Send reminder emails 24-48 hours before the event');
    recommendations.push('Consider offering incentives for attendance (certificates, prizes)');
    recommendations.push('Reach out personally to high-risk students');
    recommendations.push('Reduce registration limit to account for no-shows');
  } else if (prediction.riskLevel === 'MEDIUM') {
    recommendations.push('Send reminder emails 24 hours before the event');
    recommendations.push('Prepare for 10-15% no-shows in capacity planning');
    recommendations.push('Monitor registration patterns closely');
  } else {
    recommendations.push('Standard event preparation should be sufficient');
    recommendations.push('Expect good turnout based on registration patterns');
  }
  
  // Add specific recommendations based on predicted no-shows
  if (prediction.predictedNoShows > 10) {
    recommendations.push(`Prepare backup activities for ${prediction.predictedAttendance} attendees`);
  }
  
  return recommendations;
};

/**
 * Analyze student engagement level
 * @param {Object} student - Student object
 * @returns {Object} Engagement analysis
 */
export const analyzeStudentEngagement = (student) => {
  const rate = student.avgAttendanceRate;
  
  let level, description, color;
  
  if (rate >= 0.9) {
    level = 'HIGHLY ENGAGED';
    description = 'Consistently attends and completes events';
    color = 'green';
  } else if (rate >= 0.75) {
    level = 'ENGAGED';
    description = 'Good attendance record';
    color = 'blue';
  } else if (rate >= 0.6) {
    level = 'MODERATELY ENGAGED';
    description = 'Inconsistent attendance pattern';
    color = 'yellow';
  } else {
    level = 'AT RISK';
    description = 'Low attendance rate, needs intervention';
    color = 'red';
  }
  
  return { level, description, color, rate };
};

export default {
  calculateNoShowProbability,
  predictEventNoShowRate,
  getRiskColorClass,
  getRiskIcon,
  generateRecommendations,
  analyzeStudentEngagement
};
