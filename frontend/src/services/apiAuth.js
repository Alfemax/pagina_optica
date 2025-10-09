import axios from 'axios';

export const apiAuth = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
});

apiAuth.interceptors.request.use((config) => {
  const tk = localStorage.getItem('token');
  if (tk) config.headers.Authorization = `Bearer ${tk}`;
  return config;
});
