// frontend/src/services/optoApi.js
import { apiAuth } from './apiAuth';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const optoApi = {
  // ===== AGENDA =====
  agenda: (date) => apiAuth.get('/opto/agenda', { params: { date } }),

  // ===== CITAS =====
  createCita: (payload) => apiAuth.post('/opto/citas', payload),
  updateCita: (id, payload) => apiAuth.put(`/opto/citas/${id}`, payload),
  setEstado: (id, estado, motivo) =>
    apiAuth.patch(`/opto/citas/${id}/status`, { estado, motivo }),
  cancelCita: (id, motivo) =>
    apiAuth.delete(`/opto/citas/${id}`, { data: { motivo } }),

  // ===== PACIENTES =====
  pacientesList: (q) => apiAuth.get('/opto/pacientes', { params: { q } }),
  pacienteGet: (id) => apiAuth.get(`/opto/pacientes/${id}`),
  pacienteCreate: (payload) => apiAuth.post('/opto/pacientes', payload),
  pacienteUpdate: (id, payload) =>
    apiAuth.put(`/opto/pacientes/${id}`, payload),
  pacienteDelete: (id) => apiAuth.delete(`/opto/pacientes/${id}`),

  // ===== USUARIOS CANDIDATOS =====
  userCandidates: (q) =>
    apiAuth.get('/opto/users-candidates', { params: { q } }),

  // ===== FICHAS MÉDICAS =====
  fichasList:   (params)      => apiAuth.get('/opto/fichas', { params }),
  fichaGet:     (id)          => apiAuth.get(`/opto/fichas/${id}`),
  fichaCreate:  (payload)     => apiAuth.post('/opto/fichas', payload),
  fichaUpdate:  (id, payload) => apiAuth.put(`/opto/fichas/${id}`, payload),
  fichaToggle:  (id, activo)  => apiAuth.patch(`/opto/fichas/${id}/activo`, { activo }),
  fichaPdfBlob: (id)          => apiAuth.get(`/opto/fichas/${id}/pdf`, { responseType: 'blob' }),

  // ===== RECETAS =====
  crearReceta:   (payload) => apiAuth.post('/opto/recetas', payload),
  recetaPdfUrl: (id) => `${baseURL}/opto/recetas/${id}/pdf`,
  
  // ===== ANALYTICS / MINI CRM =====
analytics: (params) => apiAuth.get('/opto/analytics', { params }),

};
