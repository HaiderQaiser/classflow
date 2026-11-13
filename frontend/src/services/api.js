import axios from 'axios';

// FastAPI Backend URL Configuration
const API = axios.create({
  baseURL: 'http://10.242.249.99:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Automatic JWT Token Injection
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default API;