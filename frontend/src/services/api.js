import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  registerDonor: (data) => api.post('/auth/register/donor', data),
  registerReceiver: (data) => api.post('/auth/register/receiver', data),
};

export default api;
