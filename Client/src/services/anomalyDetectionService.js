/**
 * AI Anomaly Detection Service
 * Detects unusual spending patterns and provides alerts
 */

/**
 * Detect anomalies in expenses
 * @param {Array} expenses - List of all expenses
 * @param {Object} budget - Budget object with category allocations
 * @returns {Object} - Anomalies found with alerts
 */
export const detectAnomalies = (expenses = [], budget = null) => {
  const anomalies = {
    highValueExpenses: [],
    categoryOverspending: [],
    unusualPatterns: [],
    duplicateSuspects: [],
    alerts: []
  };

  if (!expenses || expenses.length === 0) {
    return anomalies;
  }

  // Calculate statistics per category
  const categoryStats = {};
  expenses.forEach(expense => {
    const cat = expense.category || 'Other';
    if (!categoryStats[cat]) {
      categoryStats[cat] = {
        total: 0,
        count: 0,
        amounts: [],
        maxAmount: 0
      };
    }
    categoryStats[cat].total += expense.amount;
    categoryStats[cat].count += 1;
    categoryStats[cat].amounts.push(expense.amount);
    categoryStats[cat].maxAmount = Math.max(categoryStats[cat].maxAmount, expense.amount);
  });

  // Calculate average and standard deviation for each category
  Object.keys(categoryStats).forEach(cat => {
    const stats = categoryStats[cat];
    stats.average = stats.total / stats.count;
    
    // Standard deviation
    const variance = stats.amounts.reduce((sum, amt) => {
      return sum + Math.pow(amt - stats.average, 2);
    }, 0) / stats.count;
    stats.stdDev = Math.sqrt(variance);
  });

  // 1. Detect unusually high expenses (2.5 standard deviations above mean)
  expenses.forEach(expense => {
    const cat = expense.category || 'Other';
    const stats = categoryStats[cat];
    
    if (stats && stats.count > 2) { // Need at least 3 expenses to detect anomalies
      const threshold = stats.average + (2.5 * stats.stdDev);
      
      if (expense.amount > threshold && expense.amount > 1000) {
        anomalies.highValueExpenses.push({
          ...expense,
          deviation: ((expense.amount - stats.average) / stats.average * 100).toFixed(1),
          categoryAverage: stats.average,
          severity: expense.amount > threshold * 1.5 ? 'HIGH' : 'MEDIUM'
        });
        
        anomalies.alerts.push({
          type: 'HIGH_VALUE',
          severity: 'WARNING',
          message: `Unusually high ${cat} expense: ₹${expense.amount.toLocaleString()} (${((expense.amount - stats.average) / stats.average * 100).toFixed(0)}% above average)`,
          expenseId: expense._id,
          timestamp: expense.createdAt
        });
      }
    }
  });

  // 2. Detect category overspending vs budget
  if (budget && budget.categoryAllocations) {
    Object.keys(categoryStats).forEach(cat => {
      const allocation = budget.categoryAllocations.find(a => a.category === cat);
      if (allocation) {
        const spent = categoryStats[cat].total;
        const allocated = allocation.amount;
        const percentUsed = (spent / allocated) * 100;
        
        if (percentUsed > 100) {
          anomalies.categoryOverspending.push({
            category: cat,
            allocated,
            spent,
            overspending: spent - allocated,
            percentOver: percentUsed - 100,
            severity: percentUsed > 150 ? 'CRITICAL' : percentUsed > 120 ? 'HIGH' : 'MEDIUM'
          });
          
          anomalies.alerts.push({
            type: 'CATEGORY_OVERSPEND',
            severity: percentUsed > 150 ? 'CRITICAL' : 'WARNING',
            message: `${cat} category is ${(percentUsed - 100).toFixed(0)}% over budget (₹${(spent - allocated).toLocaleString()} excess)`,
            category: cat,
            timestamp: new Date()
          });
        } else if (percentUsed > 85) {
          anomalies.alerts.push({
            type: 'CATEGORY_WARNING',
            severity: 'INFO',
            message: `${cat} category is at ${percentUsed.toFixed(0)}% of budget`,
            category: cat,
            timestamp: new Date()
          });
        }
      }
    });
  }

  // 3. Detect potential duplicate expenses (same category, similar amount, close dates)
  for (let i = 0; i < expenses.length; i++) {
    for (let j = i + 1; j < expenses.length; j++) {
      const exp1 = expenses[i];
      const exp2 = expenses[j];
      
      // Check if same category and similar amount (within 5%)
      if (exp1.category === exp2.category) {
        const amountDiff = Math.abs(exp1.amount - exp2.amount);
        const amountDiffPercent = (amountDiff / exp1.amount) * 100;
        
        // Check date proximity (within 7 days)
        const date1 = new Date(exp1.createdAt);
        const date2 = new Date(exp2.createdAt);
        const daysDiff = Math.abs((date2 - date1) / (1000 * 60 * 60 * 24));
        
        if (amountDiffPercent < 5 && daysDiff < 7 && exp1.amount > 500) {
          anomalies.duplicateSuspects.push({
            expense1: exp1,
            expense2: exp2,
            similarity: (100 - amountDiffPercent).toFixed(1),
            daysBetween: daysDiff.toFixed(1)
          });
          
          anomalies.alerts.push({
            type: 'DUPLICATE_SUSPECT',
            severity: 'INFO',
            message: `Possible duplicate: Two ${exp1.category} expenses of ~₹${exp1.amount.toLocaleString()} within ${Math.round(daysDiff)} days`,
            expenseId: exp1._id,
            timestamp: new Date()
          });
        }
      }
    }
  }

  // 4. Detect rapid spending (too many expenses in short time)
  const recentExpenses = expenses.filter(e => {
    const daysAgo = (new Date() - new Date(e.createdAt)) / (1000 * 60 * 60 * 24);
    return daysAgo <= 7;
  });
  
  if (recentExpenses.length > 10) {
    const totalRecent = recentExpenses.reduce((sum, e) => sum + e.amount, 0);
    anomalies.unusualPatterns.push({
      type: 'RAPID_SPENDING',
      count: recentExpenses.length,
      totalAmount: totalRecent,
      period: '7 days'
    });
    
    anomalies.alerts.push({
      type: 'RAPID_SPENDING',
      severity: 'INFO',
      message: `High activity: ${recentExpenses.length} expenses (₹${totalRecent.toLocaleString()}) in the last 7 days`,
      timestamp: new Date()
    });
  }

  // Sort alerts by severity
  const severityOrder = { CRITICAL: 0, WARNING: 1, INFO: 2 };
  anomalies.alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return anomalies;
};

/**
 * Get burn rate (average spending per day)
 * @param {Array} expenses - List of expenses
 * @param {Object} budget - Budget object
 * @returns {Object} - Burn rate analysis
 */
export const calculateBurnRate = (expenses = [], budget = null) => {
  if (!expenses || expenses.length === 0) {
    return {
      dailyBurnRate: 0,
      estimatedDaysRemaining: Infinity,
      projectedOverspend: 0
    };
  }

  // Get date range
  const dates = expenses.map(e => new Date(e.createdAt));
  const oldestDate = new Date(Math.min(...dates));
  const newestDate = new Date(Math.max(...dates));
  const daysDiff = Math.max(1, (newestDate - oldestDate) / (1000 * 60 * 60 * 24));
  
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const dailyBurnRate = totalSpent / daysDiff;
  
  let estimatedDaysRemaining = Infinity;
  let projectedOverspend = 0;
  
  if (budget && budget.totalAllocatedAmount) {
    const remaining = budget.totalAllocatedAmount - totalSpent;
    estimatedDaysRemaining = remaining > 0 ? remaining / dailyBurnRate : 0;
    
    // Project to event end date if available
    if (budget.event && budget.event.endDate) {
      const eventEndDate = new Date(budget.event.endDate);
      const daysUntilEnd = (eventEndDate - new Date()) / (1000 * 60 * 60 * 24);
      
      if (daysUntilEnd > 0) {
        const projectedTotal = totalSpent + (dailyBurnRate * daysUntilEnd);
        projectedOverspend = Math.max(0, projectedTotal - budget.totalAllocatedAmount);
      }
    }
  }
  
  return {
    dailyBurnRate,
    totalSpent,
    daysCounted: daysDiff,
    estimatedDaysRemaining: Math.max(0, estimatedDaysRemaining),
    projectedOverspend,
    status: estimatedDaysRemaining < 7 ? 'CRITICAL' : estimatedDaysRemaining < 14 ? 'WARNING' : 'GOOD'
  };
};

/**
 * Check if an individual expense is anomalous
 * @param {Object} expense - Single expense
 * @param {Array} allExpenses - All expenses for comparison
 * @returns {Object} - Anomaly check result
 */
export const checkExpenseAnomaly = (expense, allExpenses = []) => {
  const categoryExpenses = allExpenses.filter(e => 
    e.category === expense.category && e._id !== expense._id
  );
  
  if (categoryExpenses.length < 2) {
    return { isAnomaly: false };
  }
  
  const amounts = categoryExpenses.map(e => e.amount);
  const avg = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
  const variance = amounts.reduce((sum, amt) => sum + Math.pow(amt - avg, 2), 0) / amounts.length;
  const stdDev = Math.sqrt(variance);
  
  const threshold = avg + (2 * stdDev);
  const isAnomaly = expense.amount > threshold && expense.amount > 1000;
  
  return {
    isAnomaly,
    deviation: isAnomaly ? ((expense.amount - avg) / avg * 100).toFixed(1) : 0,
    categoryAverage: avg,
    message: isAnomaly ? `This expense is ${((expense.amount - avg) / avg * 100).toFixed(0)}% above the category average` : null
  };
};

export default {
  detectAnomalies,
  calculateBurnRate,
  checkExpenseAnomaly
};
