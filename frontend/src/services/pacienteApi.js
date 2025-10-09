// frontend/src/services/pacienteApi.js
import { apiAuth } from './apiAuth';

export const pacienteApi = {
  slots:   (date)    => apiAuth.get('/paciente/citas/slots', { params: { date } }),
  book:    (payload) => apiAuth.post('/paciente/citas', payload),
  mine:    ()        => apiAuth.get('/paciente/citas'),

  // opcionales (si luego creas estos endpoints en el backend, ya quedan cableados)
  confirm: (id)      => apiAuth.patch(`/paciente/citas/${id}/confirm`),
  cancel:  (id, why) => apiAuth.patch(`/paciente/citas/${id}/cancel`, { motivo: why }),
};
