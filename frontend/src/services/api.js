import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use((response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('jwtToken');
      sessionStorage.removeItem('jwtToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (data) => {
    const response = await api.post('/auth/login', data);
    if (response.data.token) {
      localStorage.setItem('jwtToken', response.data.token);
    }
    return response;
  },
  registerDonor: (data) => api.post('/auth/register/donor', data),
  registerReceiver: (data) => api.post('/auth/register/receiver', data),
  logout: () => {
    localStorage.removeItem('jwtToken');
    return api.post('/auth/logout');
  },
};

export const surplusAPI = {
  create: (data) => api.post('/api/surplus', data),
  list: () => api.get('/api/surplus'),
  myPosts: () => api.get('/api/surplus/my-posts'),
  claim: (postId) => api.post('/api/claims', { surplusPostId: postId }),
};

export default api;
