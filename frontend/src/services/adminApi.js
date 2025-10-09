import { apiAuth } from './apiAuth';

export const adminApi = {
  overview: () => apiAuth.get('/admin/overview'),

  usersList: (params) => apiAuth.get('/admin/users', { params }),
  userCreate: (payload) => apiAuth.post('/admin/users', payload),
  userUpdate: (id, payload) => apiAuth.put(`/admin/users/${id}`, payload),
  userDelete: (id) => apiAuth.delete(`/admin/users/${id}`),
  userChangePassword: (id, payload) =>
    apiAuth.patch(`/admin/users/${id}/password`, payload),
};

// 🔹 Nuevo bloque para Roles
export const rolesApi = {
  catalog: () => apiAuth.get('/roles/permisos'),
  list: (params) => apiAuth.get('/roles', { params }),
  create: (payload) => apiAuth.post('/roles', payload),
  update: (id, payload) => apiAuth.put(`/roles/${id}`, payload),
  remove: (id) => apiAuth.delete(`/roles/${id}`),
};

export const securityApi = {
  get: () => apiAuth.get('/admin/security'),
  save: (payload) => apiAuth.put('/admin/security', payload),
  testSmtp: (to) => apiAuth.post('/admin/security/test-smtp', { to }),
  forceReset: (userId) => apiAuth.post(`/admin/security/force-reset/${userId}`),
  audit: (limit=50) => apiAuth.get('/admin/security/audit', { params: { limit } }),
};

export const settingsApi = {
  get:   () => apiAuth.get('/admin/settings'),
  save:  (payload) => apiAuth.put('/admin/settings', payload),
  upload: (formData) =>
    apiAuth.post('/admin/settings/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  backup: () => apiAuth.post('/admin/settings/backup'),
};
