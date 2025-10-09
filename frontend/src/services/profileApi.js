import { apiAuth } from './apiAuth';

export const profileApi = {
  getMe:   () => apiAuth.get('/me'),
  update:  (payload) => apiAuth.put('/me', payload),
  reqPwd:  () => apiAuth.post('/me/password/request'),
  confPwd: (payload) => apiAuth.post('/me/password/confirm', payload), // { code, newPassword }
};
