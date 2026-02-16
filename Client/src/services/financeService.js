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

  updateExpenseStatus: (expenseId, data) =>
    fetchFinanceApi(`/finance/expense/${expenseId}/status`, {
      method: "PUT",
      body: data,
    }),
};

export default financeService;
