import axios from 'axios';

// Priority 1: Value from Vercel / Render environment variables or .env file
// Priority 2: In production if not provided, fallback to relative '/api'
// Priority 3: Local development fallback 'http://localhost:5000/api'
const getBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL;
  if (url) {
    url = url.trim().replace(/\/+$/, '');
    if (!url.endsWith('/api')) {
      url = `${url}/api`;
    }
    return url;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://jb-tracker-backend.onrender.com/api';
  }
  return 'http://localhost:5000/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jb_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiration or unauthorized errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('jb_token');
      localStorage.removeItem('jb_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    // Enrich rejected error with status and cold-start detection info
    const enrichedError = error.response?.data || { message: error.message };
    enrichedError.status = error.response?.status;
    enrichedError.code = error.code;
    enrichedError.isNetworkError = !error.response;
    return Promise.reject(enrichedError);
  }
);

export default api;
