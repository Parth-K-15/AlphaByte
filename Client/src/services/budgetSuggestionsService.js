/**
 * AI Budget Suggestions Service
 * Analyzes historical data to provide smart budget recommendations
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Get AI-powered budget suggestions for an event
 * @param {string} eventId - Event ID
 * @param {string} eventCategory - Event category/type
 * @returns {Promise<Object>} - Budget suggestions
 */
export const getBudgetSuggestions = async (eventId, eventCategory = null) => {
  try {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    if (eventCategory) params.append('category', eventCategory);
    
    const response = await fetch(`${API_BASE}/finance/ai/budget-suggestions/${eventId}?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching budget suggestions:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Generate budget suggestions based on historical data (client-side fallback)
 * @param {Array} historicalEvents - Past events with budgets
 * @param {string} eventType - Type of current event
 * @param {number} expectedAttendees - Expected number of attendees
 * @returns {Object} - Suggested budget allocations
 */
export const generateLocalSuggestions = (historicalEvents = [], eventType = 'WORKSHOP', expectedAttendees = 50) => {
  // Default budget templates based on event types
  const budgetTemplates = {
    WORKSHOP: {
      Food: 0.40,
      Printing: 0.15,
      Travel: 0.10,
      Marketing: 0.10,
      Logistics: 0.10,
      Prizes: 0.05,
      Equipment: 0.10
    },
    HACKATHON: {
      Food: 0.35,
      Printing: 0.05,
      Travel: 0.05,
      Marketing: 0.15,
      Logistics: 0.10,
      Prizes: 0.25,
      Equipment: 0.05
    },
    SEMINAR: {
      Food: 0.30,
      Printing: 0.20,
      Travel: 0.15,
      Marketing: 0.15,
      Logistics: 0.10,
      Prizes: 0.05,
      Equipment: 0.05
    },
    CULTURAL: {
      Food: 0.25,
      Printing: 0.10,
      Travel: 0.05,
      Marketing: 0.20,
      Logistics: 0.15,
      Prizes: 0.15,
      Equipment: 0.10
    },
    COMPETITION: {
      Food: 0.25,
      Printing: 0.10,
      Travel: 0.10,
      Marketing: 0.15,
      Logistics: 0.10,
      Prizes: 0.25,
      Equipment: 0.05
    }
  };
  
  // Base cost per attendee (in INR)
  const costPerAttendee = {
    WORKSHOP: 200,
    HACKATHON: 400,
    SEMINAR: 150,
    CULTURAL: 250,
    COMPETITION: 300
  };
  
  // If we have historical data, use it to refine suggestions
  let template = budgetTemplates[eventType] || budgetTemplates.WORKSHOP;
  let baseCost = costPerAttendee[eventType] || 200;
  
  if (historicalEvents && historicalEvents.length > 0) {
    // Calculate average spending per category from historical data
    const avgSpending = calculateAverageSpending(historicalEvents);
    
    // Adjust template based on historical patterns
    if (Object.keys(avgSpending).length > 0) {
      const totalHistorical = Object.values(avgSpending).reduce((sum, val) => sum + val, 0);
      template = {};
      for (const [category, amount] of Object.entries(avgSpending)) {
        template[category] = amount / totalHistorical;
      }
      
      // Calculate average cost per attendee from historical data
      const avgAttendees = historicalEvents.reduce((sum, e) => sum + (e.attendees || 50), 0) / historicalEvents.length;
      baseCost = totalHistorical / avgAttendees;
    }
  }
  
  // Calculate suggested amounts
  const estimatedTotal = baseCost * expectedAttendees;
  const suggestions = {};
  
  for (const [category, percentage] of Object.entries(template)) {
    suggestions[category] = {
      suggested: Math.round(estimatedTotal * percentage),
      percentage: Math.round(percentage * 100),
      reasoning: getCategoryReasoning(category, eventType)
    };
  }
  
  return {
    estimatedTotal: Math.round(estimatedTotal),
    basedOn: historicalEvents.length > 0 ? 'HISTORICAL_DATA' : 'TEMPLATE',
    suggestions,
    confidence: historicalEvents.length > 0 ? Math.min(historicalEvents.length * 20, 90) : 60,
    insights: generateInsights(historicalEvents, eventType, expectedAttendees)
  };
};

/**
 * Calculate average spending per category from historical events
 */
const calculateAverageSpending = (events) => {
  const totals = {};
  const counts = {};
  
  events.forEach(event => {
    if (event.budget && event.budget.categories) {
      event.budget.categories.forEach(cat => {
        const category = cat.name;
        const spent = cat.actualSpent || 0;
        
        totals[category] = (totals[category] || 0) + spent;
        counts[category] = (counts[category] || 0) + 1;
      });
    }
  });
  
  const averages = {};
  for (const category in totals) {
    averages[category] = totals[category] / counts[category];
  }
  
  return averages;
};

/**
 * Get reasoning for category allocation
 */
const getCategoryReasoning = (category, eventType) => {
  const reasons = {
    Food: {
      WORKSHOP: 'Meals and refreshments for participants during sessions',
      HACKATHON: 'Extended event requires multiple meals and continuous refreshments',
      SEMINAR: 'Basic refreshments and lunch for attendees',
      CULTURAL: 'Snacks and refreshments for performers and audience',
      COMPETITION: 'Meals for participants during competition rounds'
    },
    Printing: {
      WORKSHOP: 'Course materials, certificates, and handouts',
      HACKATHON: 'Schedule posters and participant badges',
      SEMINAR: 'Conference materials and informational brochures',
      CULTURAL: 'Event posters, tickets, and promotional materials',
      COMPETITION: 'Question papers, answer sheets, and certificates'
    },
    Travel: {
      WORKSHOP: 'Guest speaker/trainer transportation',
      HACKATHON: 'Mentor and judge travel reimbursements',
      SEMINAR: 'Chief guest and speaker travel expenses',
      CULTURAL: 'Artist and performer transportation',
      COMPETITION: 'Judge and coordinator travel costs'
    },
    Marketing: {
      WORKSHOP: 'Social media promotion and registration campaigns',
      HACKATHON: 'Wide outreach campaigns across colleges',
      SEMINAR: 'Professional promotion and event publicity',
      CULTURAL: 'Extensive marketing for audience reach',
      COMPETITION: 'Inter-college promotional activities'
    },
    Logistics: {
      WORKSHOP: 'Venue setup, seating arrangements, signage',
      HACKATHON: 'Extended venue booking, Wi-Fi, power backup',
      SEMINAR: 'Stage setup, audio systems, seating',
      CULTURAL: 'Stage decoration, lighting, sound systems',
      COMPETITION: 'Venue arrangement, timekeeping equipment'
    },
    Prizes: {
      WORKSHOP: 'Participation certificates and small goodies',
      HACKATHON: 'Winner prizes, runner-up awards, special category prizes',
      SEMINAR: 'Token of appreciation for speakers',
      CULTURAL: 'Performance prizes and recognition awards',
      COMPETITION: 'Winner prizes, medals, and trophies'
    },
    Equipment: {
      WORKSHOP: 'Projector, laptops, microphones, whiteboards',
      HACKATHON: 'Additional power strips, network equipment',
      SEMINAR: 'AV equipment, presentation system',
      CULTURAL: 'Stage equipment, instruments, props',
      COMPETITION: 'Specialized equipment based on competition type'
    }
  };
  
  return reasons[category]?.[eventType] || `Standard allocation for ${category} expenses`;
};

/**
 * Generate insights based on data
 */
const generateInsights = (historicalEvents, eventType, expectedAttendees) => {
  const insights = [];
  
  if (historicalEvents.length === 0) {
    insights.push({
      type: 'INFO',
      message: 'No historical data available. Suggestions based on industry standards.',
      icon: '💡'
    });
  } else {
    insights.push({
      type: 'SUCCESS',
      message: `Suggestions based on ${historicalEvents.length} similar past event(s).`,
      icon: '📊'
    });
  }
  
  if (expectedAttendees > 100) {
    insights.push({
      type: 'WARNING',
      message: 'Large attendance expected. Consider bulk discounts for food and printing.',
      icon: '👥'
    });
  }
  
  if (eventType === 'HACKATHON') {
    insights.push({
      type: 'TIP',
      message: 'Hackathons typically require 24-hour food coverage. Budget accordingly.',
      icon: '🍕'
    });
  }
  
  if (historicalEvents.length > 0) {
    // Check for over-budget trends
    const overBudgetEvents = historicalEvents.filter(e => 
      e.budget && e.budget.categories.some(cat => cat.actualSpent > cat.allocatedAmount)
    );
    
    if (overBudgetEvents.length > historicalEvents.length * 0.5) {
      insights.push({
        type: 'WARNING',
        message: 'Past events often exceeded budget. Consider adding 10-15% buffer.',
        icon: '⚠️'
      });
    }
  }
  
  return insights;
};

/**
 * Smart expense prediction based on category and past spending
 * @param {string} category - Expense category
 * @param {Array} pastExpenses - Historical expenses in this category
 * @returns {Object} - Prediction with insights
 */
export const predictExpenseAmount = (category, pastExpenses = []) => {
  if (pastExpenses.length === 0) {
    return null;
  }
  
  const amounts = pastExpenses.map(e => e.amount).sort((a, b) => a - b);
  const average = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
  const median = amounts[Math.floor(amounts.length / 2)];
  const min = amounts[0];
  const max = amounts[amounts.length - 1];
  
  return {
    average: Math.round(average),
    median: Math.round(median),
    range: { min, max },
    suggestion: Math.round(median), // Use median as it's less affected by outliers
    insight: `Based on ${pastExpenses.length} past expenses, typical ${category} cost is around ₹${Math.round(median)}`
  };
};

export default {
  getBudgetSuggestions,
  generateLocalSuggestions,
  predictExpenseAmount
};
