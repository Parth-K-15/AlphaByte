const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://eventsync-blue.vercel.app/api";

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const fetchFinanceApi = async (endpoint, options = {}) => {
  const config = {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
      ...options.headers,
    },
    ...options,
  };

  if (options.body && typeof options.body === "object") {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
};

const financeService = {
  // Budget
  requestBudget: (data) =>
    fetchFinanceApi("/finance/budget/request", { method: "POST", body: data }),

  getBudget: (eventId) => fetchFinanceApi(`/finance/budget/${eventId}`),

  getAllPendingBudgets: () => fetchFinanceApi("/finance/budgets/pending"),

  getAllBudgets: () => fetchFinanceApi("/finance/budgets/all"),

  approveBudget: (eventId, data) =>
    fetchFinanceApi(`/finance/budget/${eventId}/approval`, {
      method: "PUT",
      body: data,
    }),

  // Expenses
  logExpense: (data) =>
    fetchFinanceApi("/finance/expense", { method: "POST", body: data }),

  getExpenses: (eventId) => fetchFinanceApi(`/finance/expenses/${eventId}`),

  getAllPendingExpenses: () => fetchFinanceApi("/finance/expenses/pending/all"),

  getExpenseDetail: (expenseId) => fetchFinanceApi(`/finance/expense/${expenseId}`),

  updateExpenseStatus: (expenseId, data) =>
    fetchFinanceApi(`/finance/expense/${expenseId}/status`, {
      method: "PUT",
      body: data,
    }),

  bulkUpdateExpenses: (data) =>
    fetchFinanceApi("/finance/expenses/bulk-update", {
      method: "PUT",
      body: data,
    }),

  // Budget Amendments
  requestAmendment: (eventId, data) =>
    fetchFinanceApi(`/finance/budget/${eventId}/amendment`, {
      method: "POST",
      body: data,
    }),

  reviewAmendment: (eventId, amendmentId, data) =>
    fetchFinanceApi(`/finance/budget/${eventId}/amendment/${amendmentId}`, {
      method: "PUT",
      body: data,
    }),

  getPendingAmendments: () => fetchFinanceApi("/finance/amendments/pending"),

  // Financial Reports
  getEventWiseReport: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    if (filters.status) params.append("status", filters.status);
    const query = params.toString();
    return fetchFinanceApi(`/finance/reports/event-wise${query ? `?${query}` : ""}`);
  },

  getCategoryWiseReport: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.eventId) params.append("eventId", filters.eventId);
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    const query = params.toString();
    return fetchFinanceApi(`/finance/reports/category-wise${query ? `?${query}` : ""}`);
  },

  getOverBudgetAlerts: () => fetchFinanceApi("/finance/reports/over-budget"),

  exportToCSV: async (type, filters = {}) => {
    const params = new URLSearchParams();
    params.append("type", type);
    if (filters.eventId) params.append("eventId", filters.eventId);
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    
    const response = await fetch(
      `${API_BASE_URL}/finance/reports/export?${params.toString()}`,
      {
        headers: getAuthHeader(),
      }
    );
    
    if (!response.ok) {
      throw new Error("Export failed");
    }
    
    return await response.blob();
  },
};

export { financeService };
export default financeService;
