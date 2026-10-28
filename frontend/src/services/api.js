import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Response interceptor for consistent error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'An unexpected error occurred. Please try again.';
    let errors = [];

    if (error.response) {
      if (error.response.data) {
        message = error.response.data.message || message;
        errors = error.response.data.errors || [];
      } else {
        message = `Server responded with status ${error.response.status}`;
      }
    } else if (error.request) {
      message = 'Cannot connect to backend server. Make sure the backend is running on port 5000.';
    } else {
      message = error.message;
    }

    const enhancedError = new Error(message);
    enhancedError.status = error.response ? error.response.status : 500;
    enhancedError.errors = errors;
    enhancedError.originalError = error;

    return Promise.reject(enhancedError);
  }
);

export const api = {
  // Accounts
  getAccounts: async () => {
    const res = await apiClient.get('/accounts');
    return res.data;
  },

  getAccountById: async (id) => {
    const res = await apiClient.get(`/accounts/${id}`);
    return res.data;
  },

  getAccountBalance: async (id) => {
    const res = await apiClient.get(`/accounts/${id}/balance`);
    return res.data;
  },

  createAccount: async (data) => {
    const res = await apiClient.post('/accounts', data);
    return res.data;
  },

  // Transactions
  getTransactions: async (accountId, params = {}) => {
    const res = await apiClient.get(`/accounts/${accountId}/transactions`, {
      params,
    });
    return res.data;
  },

  createTransaction: async (accountId, data) => {
    const res = await apiClient.post(`/accounts/${accountId}/transactions`, data);
    return res.data;
  },

  // Transfers
  transferFunds: async (data) => {
    const res = await apiClient.post('/transfers', data);
    return res.data;
  },
};

export default api;

