import axios from 'axios';
import { useAuthStore } from './auth';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      try {
        const { data } = await api.post('/api/v1/auth/refresh');
        useAuthStore.getState().setAccessToken(data.accessToken);
        error.config.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(error.config);
      } catch {
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined') window.location.href = '/login/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
