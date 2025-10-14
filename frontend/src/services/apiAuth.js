import axios from 'axios';

// Quita barras al final para evitar // y agrega /api
const BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000').replace(/\/+$/, '');

export const apiAuth = axios.create({
  baseURL: `${BASE}/api`,
  headers: { 'Content-Type': 'application/json' },
  // opcional:
  // timeout: 15000,
});

// Adjunta el token si existe
apiAuth.interceptors.request.use((config) => {
  const tk = localStorage.getItem('token');
  if (tk) config.headers.Authorization = `Bearer ${tk}`;
  return config;
});

// Opcional: manejo centralizado de 401/403
apiAuth.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401 || err?.response?.status === 403) {
      // por ejemplo, limpiar token y redirigir a /login
      localStorage.removeItem('token');
      // window.location.href = '/login'; // si quieres
    }
    return Promise.reject(err);
  }
);
