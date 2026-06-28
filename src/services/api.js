import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8080',
});

// Automatically add JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const registerUser = (data) => API.post('/api/auth/register', data);
export const loginUser = (data) => API.post('/api/auth/login', data);

// Wallet APIs
export const getBalance = () => API.get('/api/wallet/balance');
export const addMoney = (amount) => API.post(`/api/wallet/add-money?amount=${amount}`);
export const transferMoney = (receiverEmail, amount, idempotencyKey) =>
  API.post(`/api/wallet/transfer?receiverEmail=${receiverEmail}&amount=${amount}&idempotencyKey=${idempotencyKey}`);
export const getTransactions = (page = 0) => API.get(`/api/wallet/transactions?page=${page}`);
export const getFraudAlerts = () => API.get('/api/wallet/fraud-alerts');