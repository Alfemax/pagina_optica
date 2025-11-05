// frontend/src/pages/opto/AgendaDiaria.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { optoApi } from '../../services/optoApi';
import Modal from '../../components/Modal';
import { Calendar, Clock, User, FileText, CheckCircle2, AlertTriangle, RefreshCw, Edit2, Check, X, Download } from 'lucide-react';

/* =================== ESTADOS (chips) =================== */
const estados = {
  pendiente:   { bg: 'rgba(234, 179, 8, 0.1)', txt: '#ca8a04', label: 'Pendiente' },
  confirmada:  { bg: 'rgba(6, 182, 212, 0.1)', txt: '#0891b2', label: 'Confirmada' },
  completada:  { bg: 'rgba(16, 185, 129, 0.1)', txt: '#059669', label: 'Completada' },
  cancelada:   { bg: 'rgba(239, 68, 68, 0.1)', txt: '#dc2626', label: 'Cancelada' },
  no_asistio:  { bg: 'rgba(239, 68, 68, 0.1)', txt: '#dc2626', label: 'No asistió' },
  reprogramada:{ bg: 'rgba(0, 102, 204, 0.1)', txt: '#0066cc', label: 'Reprogramada' },
};

/* =================== UTIL =================== */
function fmtHour(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function diffMin(a, b) {
  if (!a || !b) return '—';
  const ms = new Date(b) - new Date(a);
  return Math.max(0, Math.round(ms / 60000));
}

/* =================== MODAL: CONFIRMAR COMPLETADA =================== */
function ConfirmCompleteModal({ open, onClose, onConfirm }) {
  const [checked, setChecked] = useState(false);

  useEffect(() => { if (!open) setChecked(false); }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Completar cita"
      footer={
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button style={secondaryButton} onClick={onClose}>Cancelar</button>
          <button style={primaryButton} disabled={!checked} onClick={() => onConfirm?.()}>
            Sí, ya completé la sesión
          </button>
        </div>
      }
    >
      <div style={{ display:'grid', gap:12 }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
          <CheckCircle2 size={22} color="#16a34a" />
          <div>
            <div style={{ fontWeight:600, marginBottom: 4 }}>¿Ya completó la sesión con el paciente?</div>
            <small style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
              Al confirmar, se marcará la cita como <b>completada</b> y podrás generar la receta.
            </small>
          </div>
        </div>
        <label style={{
          display:'flex', alignItems:'center', gap:10,
          padding:'12px 14px', border:'1px solid rgba(0, 0, 0, 0.12)', borderRadius:2, background:'#f8f9fa',
          cursor: 'pointer',
        }}>
          <input type="checkbox" checked={checked} onChange={e=>setChecked(e.target.checked)} />
          Confirmo que la atención fue realizada en su totalidad.
        </label>
      </div>
    </Modal>
  );
}

/* =================== MODAL: RECETA =================== */
function RecetaModal({ open, onClose, cita, onSaved }) {
  const [f, setF] = useState({
    fecha: (cita?.inicio || '').slice(0,10),
    paciente_nombre: cita?.paciente_nombre || `${cita?.nombres||''} ${cita?.apellidos||''}`.trim() || '',
    od_esf:'', od_cil:'', od_eje:'', od_dp:'', od_color:'', od_add:'',
    oi_esf:'', oi_cil:'', oi_eje:'', oi_dp:'', oi_color:'', oi_add:'',
    observaciones:''
  });
  
  useEffect(()=> {
    setF(s => ({
      ...s,
      fecha: (cita?.inicio || '').slice(0,10),
      paciente_nombre: cita?.paciente_nombre || `${cita?.nombres||''} ${cita?.apellidos||''}`.trim() || s.paciente_nombre
    }));
  }, [cita]);

  const set = (k,v)=>setF(s=>({...s,[k]:v}));

  const save = async ()=> {
    const payload = {
      id_cita: cita?.id_cita,
      id_paciente: cita?.id_paciente || null,
      paciente_nombre: f.paciente_nombre || null,
      fecha: f.fecha,
      od_esf:f.od_esf, od_cil:f.od_cil, od_eje:f.od_eje, od_dp:f.od_dp, od_color:f.od_color, od_add:f.od_add,
      oi_esf:f.oi_esf, oi_cil:f.oi_cil, oi_eje:f.oi_eje, oi_dp:f.oi_dp, oi_color:f.oi_color, oi_add:f.oi_add,
      observaciones: f.observaciones || null,
    };
    const { data } = await optoApi.crearReceta(payload);
    onSaved?.(data?.id_receta);
  };

  const fs   = { border:'1px solid rgba(0, 0, 0, 0.12)', borderRadius:2, padding:16, display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:12, background:'#fff' };
  const cell = { display:'grid', gap:4 };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Generar receta"
      footer={
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button style={secondaryButton} onClick={onClose}>Cerrar</button>
          <button style={primaryButton} onClick={save}>
            <Download size={16} />
            Guardar y descargar
          </button>
        </div>
      }
    >
      <div style={{ display:'grid', gap:16 }}>
        {/* Cabecera */}
        <div style={{
          display:'grid', gridTemplateColumns:'1fr 1fr', gap:12,
          background:'linear-gradient(135deg, rgba(0, 102, 204, 0.05), rgba(6, 182, 212, 0.05))', 
          border:'1px solid rgba(0, 102, 204, 0.2)',
          borderRadius:2, padding:16
        }}>
          <div>
            <label style={labelStyle}>Fecha</label>
            <input type="date" value={f.fecha} onChange={e=>set('fecha', e.target.value)} style={inputStyle}/>
          </div>
          <div>
            <label style={labelStyle}>Paciente</label>
            <input value={f.paciente_nombre} onChange={e=>set('paciente_nombre', e.target.value)} style={inputStyle}/>
          </div>
        </div>

        {/* OD */}
        <fieldset style={fs}>
          <legend style={{ fontWeight:600, fontSize: '0.9rem' }}>OD (Ojo Derecho)</legend>
          {['esf','cil','eje','dp','color','add'].map(k=>(
            <div key={k} style={cell}>
              <small style={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 500 }}>{k}</small>
              <input value={f['od_'+k]} onChange={e=>set('od_'+k,e.target.value)} style={inputStyle}/>
            </div>
          ))}
        </fieldset>

        {/* OI */}
        <fieldset style={fs}>
          <legend style={{ fontWeight:600, fontSize: '0.9rem' }}>OI (Ojo Izquierdo)</legend>
          {['esf','cil','eje','dp','color','add'].map(k=>(
            <div key={k} style={cell}>
              <small style={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 500 }}>{k}</small>
              <input value={f['oi_'+k]} onChange={e=>set('oi_'+k,e.target.value)} style={inputStyle}/>
            </div>
          ))}
        </fieldset>

        <div>
          <label style={labelStyle}>Observaciones</label>
          <textarea value={f.observaciones} onChange={e=>set('observaciones', e.target.value)} style={{ ...inputStyle, height: 90, resize: 'vertical' }} />
        </div>
      </div>
    </Modal>
  );
}

/* =================== PANTALLA PRINCIPAL =================== */
export default function AgendaDiaria() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ id_cita: null, id_paciente: '', inicio: '', fin: '', motivo: '', notas: '' });
  const [pacientes, setPacientes] = useState([]);
  const isEdit = useMemo(() => !!form.id_cita, [form.id_cita]);

  const [rxOpen, setRxOpen] = useState(false);
  const [citaRx, setCitaRx] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingCompleteId, setPendingCompleteId] = useState(null);

  const fetchAgenda = async () => {
    setLoading(true);
    try {
      const { data } = await optoApi.agenda(date);
      setRows(data.data || []);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => { fetchAgenda(); }, [date]);

  const openNew = async () => {
    setForm({ id_cita: null, id_paciente: '', inicio: `${date}T10:00`, fin: `${date}T12:00`, motivo: '', notas: '' });
    const { data } = await optoApi.pacientesList('');
    setPacientes(data.data || []);
    setOpen(true);
  };

  const openEdit = async (r) => {
    const { data } = await optoApi.pacientesList('');
    setPacientes(data.data || []);
    setForm({
      id_cita: r.id_cita,
      id_paciente: r.id_paciente || '',
      inicio: r.inicio?.slice(0,16)?.replace(' ','T'),
      fin: r.fin?.slice(0,16)?.replace(' ','T'),
      motivo: r.motivo || '',
      notas: r.notas || '',
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.inicio || !form.fin) return alert('Inicio y fin son obligatorios');
    if (isEdit) {
      await optoApi.updateCita(form.id_cita, {
        inicio: form.inicio, fin: form.fin, motivo: form.motivo, notas: form.notas
      });
    } else {
      await optoApi.createCita({
        id_paciente: form.id_paciente || null,
        inicio: form.inicio, fin: form.fin, motivo: form.motivo, notas: form.notas
      });
    }
    setOpen(false);
    fetchAgenda();
  };

  const changeStatus = async (id, estado) => {
    if (estado === 'confirmada') {
      const note = prompt('Mensaje opcional para el paciente (confirmación):') || undefined;
      await optoApi.setEstado(id, 'confirmada', note);
      await fetchAgenda();
      return;
    }

    if (estado === 'completada') {
      setPendingCompleteId(id);
      setConfirmOpen(true);
      return;
    }

    await optoApi.setEstado(id, estado);
    await fetchAgenda();
  };

  const confirmComplete = async () => {
    if (!pendingCompleteId) return;
    setConfirmOpen(false);
    const { data } = await optoApi.setEstado(pendingCompleteId, 'completada');
    await fetchAgenda();

    if (data?.nextAction === 'make_rx') {
      const cita = rows.find(r => r.id_cita === pendingCompleteId);
      setCitaRx(cita || null);
      setRxOpen(true);
    }
    setPendingCompleteId(null);
  };

  const cancel = async (id) => {
    const motivo = prompt('Motivo de cancelación (opcional):') || '';
    await optoApi.cancelCita(id, motivo);
    fetchAgenda();
  };

  // Función para descargar PDF
  const downloadPDF = async (id_receta) => {
    try {
      const url = optoApi.recetaPdfUrl(id_receta);
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `receta_${id_receta}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error al descargar PDF:', error);
      alert('Error al descargar el PDF');
    }
  };

  return (
    <div style={container}>
      <style>{`
        input:focus, select:focus, textarea:focus {
          border-color: rgba(0, 102, 204, 0.6) !important;
          box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1) !important;
        }
        input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: #0066cc;
        }
      `}</style>

      <div style={page}>
        {/* Sidebar */}
        <aside style={sidebar}>
          <div style={sidebarCard}>
            <div style={sidebarHeader}>
              <Calendar size={20} style={{ color: '#0066cc' }} />
              <h3 style={sidebarTitle}>Agenda Diaria</h3>
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={labelStyle}>Seleccionar fecha</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                style={inputStyle}
              />
            </div>
            <button onClick={openNew} style={primaryButton}>
              Nueva cita
            </button>
          </div>
        </aside>

        {/* Contenido */}
        <main style={mainContent}>
          <div style={mainHeader}>
            <div>
              <h2 style={mainTitle}>
                <Clock size={22} style={{ color: '#0066cc' }} />
                Citas del {new Date(date + 'T00:00').toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' })}
              </h2>
              <p style={mainSubtitle}>{rows.length} citas programadas</p>
            </div>
            <button style={secondaryButton} onClick={fetchAgenda} title="Actualizar">
              <RefreshCw size={16} />
              Actualizar
            </button>
          </div>

          {loading ? (
            <div style={loadingContainer}>
              <div style={spinner}></div>
              <p style={loadingText}>Cargando agenda...</p>
            </div>
          ) : rows.length === 0 ? (
            <div style={emptyBox}>
              <AlertTriangle size={20} style={{ color: 'rgba(0, 0, 0, 0.4)' }} />
              <span>No hay citas programadas para este día.</span>
            </div>
          ) : (
            <div style={tableContainer}>
              <table style={table}>
                <thead>
                  <tr style={tableHeaderRow}>
                    <th style={tableHeaderCell}>Hora</th>
                    <th style={tableHeaderCell}>Paciente</th>
                    <th style={tableHeaderCell}>Motivo</th>
                    <th style={tableHeaderCell}>Duración</th>
                    <th style={tableHeaderCell}>Estado</th>
                    <th style={{ ...tableHeaderCell, textAlign:'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => {
                    const est = estados[r.estado] || estados.pendiente;
                    return (
                      <tr key={r.id_cita} style={tableRow}>
                        <td style={tableCell}>
                          <div style={{ fontWeight: 500 }}>
                            {fmtHour(r.inicio)}–{fmtHour(r.fin)}
                          </div>
                        </td>
                        <td style={tableCell}>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <span style={avatarIcon}><User size={14} /></span>
                            <span style={{ fontWeight: 500 }}>
                              {r.paciente_nombre || `${r.nombres||''} ${r.apellidos||''}` || '— Sin asignar —'}
                            </span>
                          </div>
                        </td>
                        <td style={tableCell}>{r.motivo || '—'}</td>
                        <td style={tableCell}>{diffMin(r.inicio, r.fin)} min</td>
                        <td style={tableCell}>
                          <span style={{ 
                            background: est.bg, 
                            color: est.txt, 
                            padding:'4px 10px', 
                            borderRadius: 2, 
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            display: 'inline-block',
                          }}>
                            {est.label}
                          </span>
                        </td>
                        <td style={{ ...tableCell, textAlign:'right' }}>
                          <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                            <button style={actionButton} onClick={() => openEdit(r)} title="Editar">
                              <Edit2 size={14} />
                            </button>
                            {r.estado !== 'confirmada' && r.estado !== 'cancelada' && (
                              <button style={successButton} onClick={() => changeStatus(r.id_cita, 'confirmada')} title="Confirmar">
                                <Check size={14} />
                              </button>
                            )}
                            {r.estado !== 'completada' && r.estado !== 'cancelada' && (
                              <button style={completeButton} onClick={() => changeStatus(r.id_cita, 'completada')} title="Completar">
                                <CheckCircle2 size={14} />
                              </button>
                            )}
                            {r.estado !== 'cancelada' && (
                              <button style={dangerButton} onClick={() => cancel(r.id_cita)} title="Cancelar">
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={infoBox}>
                <FileText size={14} style={{ color: '#0066cc' }} />
                <small>Al completar, se abre el formulario para la receta y se descargará automáticamente en PDF.</small>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal crear/editar cita */}
      <Modal
        open={open}
        title={isEdit ? 'Editar cita' : 'Nueva cita'}
        onClose={() => setOpen(false)}
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button style={secondaryButton} onClick={() => setOpen(false)}>Cerrar</button>
            <button style={primaryButton} onClick={save}>{isEdit ? 'Guardar cambios' : 'Crear cita'}</button>
          </div>
        }
      >
        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <label style={labelStyle}>Paciente</label>
            <select
              value={form.id_paciente}
              onChange={e => setForm(f => ({ ...f, id_paciente: e.target.value }))}
              disabled={isEdit}
              style={inputStyle}
            >
              <option value="">— Sin asignar —</option>
              {pacientes.map(p => (
                <option key={p.id_paciente} value={p.id_paciente}>
                  {p.nombres} {p.apellidos} — {p.correo}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Inicio</label>
              <input type="datetime-local" value={form.inicio} onChange={e => setForm(f => ({ ...f, inicio: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Fin</label>
              <input type="datetime-local" value={form.fin} onChange={e => setForm(f => ({ ...f, fin: e.target.value }))} style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Motivo (opcional)</label>
            <input value={form.motivo} onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Notas (opcional)</label>
            <textarea value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} style={{ ...inputStyle, height: 80, resize: 'vertical' }} />
          </div>
        </div>
      </Modal>

      {/* Modal ¿ya completó la sesión? */}
      <ConfirmCompleteModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmComplete}
      />

      {/* Modal receta */}
      <RecetaModal
        open={rxOpen}
        cita={citaRx}
        onClose={()=>setRxOpen(false)}
        onSaved={(id_receta)=>{
          setRxOpen(false);
          downloadPDF(id_receta);
        }}
      />
    </div>
  );
}

/* =================== ESTILOS =================== */
const container = {
  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
  minHeight: '100vh',
};

const page = {
  maxWidth: 1400,
  margin: '0 auto',
  padding: '32px 20px',
  display: 'grid',
  gridTemplateColumns: '280px 1fr',
  gap: 24,
};

const sidebar = {
  position: 'sticky',
  top: 32,
  height: 'fit-content',
};

const sidebarCard = {
  background: '#ffffff',
  border: '1px solid rgba(0, 0, 0, 0.08)',
  borderRadius: 2,
  padding: 20,
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
};

const sidebarHeader = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  paddingBottom: 16,
  borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
};

const sidebarTitle = {
  margin: 0,
  fontSize: '1.1rem',
  fontWeight: 500,
  color: '#1a1d29',
};

const mainContent = {
  background: '#ffffff',
  border: '1px solid rgba(0, 0, 0, 0.08)',
  borderRadius: 2,
  padding: 24,
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
};

const mainHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 24,
  paddingBottom: 20,
  borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
};

const mainTitle = {
  margin: 0,
  fontSize: '1.5rem',
  fontWeight: 300,
  color: '#1a1d29',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  letterSpacing: '0.3px',
};

const mainSubtitle = {
  margin: '6px 0 0 0',
  fontSize: '0.85rem',
  color: 'rgba(0, 0, 0, 0.5)',
  fontWeight: 300,
};

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 2,
  border: '1px solid rgba(0, 0, 0, 0.12)',
  background: '#fff',
  color: '#1a1d29',
  fontSize: '0.9rem',
  outline: 'none',
  transition: 'all 0.2s ease',
  fontFamily: 'inherit',
};

const labelStyle = {
  display: 'block',
  marginBottom: 8,
  fontSize: '0.85rem',
  color: 'rgba(0, 0, 0, 0.7)',
  fontWeight: 500,
};

const primaryButton = {
  width: '100%',
  marginTop: 16,
  background: 'linear-gradient(135deg, #0066cc 0%, #0052a3 100%)',
  border: 'none',
  borderRadius: 2,
  padding: '10px 16px',
  color: '#ffffff',
  fontSize: '0.85rem',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  letterSpacing: '0.3px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  boxShadow: '0 4px 12px rgba(0, 102, 204, 0.3)',
};

const secondaryButton = {
  background: '#ffffff',
  border: '1px solid rgba(0, 0, 0, 0.12)',
  borderRadius: 2,
  padding: '10px 16px',
  color: '#1a1d29',
  fontSize: '0.85rem',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  letterSpacing: '0.3px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
};

const loadingContainer = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 48,
  gap: 16,
};

const spinner = {
  width: 40,
  height: 40,
  border: '3px solid rgba(0, 0, 0, 0.1)',
  borderTop: '3px solid #0066cc',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
};

const loadingText = {
  color: 'rgba(0, 0, 0, 0.6)',
  fontSize: '0.9rem',
  margin: 0,
};

const emptyBox = {
  padding: 32,
  borderRadius: 2,
  background: '#f8f9fa',
  border: '1px dashed rgba(0, 0, 0, 0.2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  color: 'rgba(0, 0, 0, 0.6)',
};

const tableContainer = {
  border: '1px solid rgba(0, 0, 0, 0.08)',
  borderRadius: 2,
  overflow: 'hidden',
};

const table = {
  width: '100%',
  borderCollapse: 'collapse',
};

const tableHeaderRow = {
  background: '#f8f9fa',
  borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
};

const tableHeaderCell = {
  padding: '14px 16px',
  fontSize: '0.8rem',
  fontWeight: 500,
  color: 'rgba(0, 0, 0, 0.6)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  textAlign: 'left',
};

const tableRow = {
  borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
  transition: 'background 0.2s ease',
};

const tableCell = {
  padding: '16px',
  fontSize: '0.9rem',
  color: '#1a1d29',
};

const avatarIcon = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  height: 28,
  borderRadius: '50%',
  background: 'rgba(0, 102, 204, 0.1)',
  color: '#0066cc',
  flexShrink: 0,
};

const actionButton = {
  background: '#ffffff',
  border: '1px solid rgba(0, 0, 0, 0.12)',
  borderRadius: 2,
  padding: '8px 10px',
  color: '#1a1d29',
  fontSize: '0.8rem',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const successButton = {
  ...actionButton,
  background: 'rgba(6, 182, 212, 0.1)',
  borderColor: 'rgba(6, 182, 212, 0.3)',
  color: '#0891b2',
};

const completeButton = {
  ...actionButton,
  background: 'rgba(16, 185, 129, 0.1)',
  borderColor: 'rgba(16, 185, 129, 0.3)',
  color: '#059669',
};

const dangerButton = {
  ...actionButton,
  background: 'rgba(239, 68, 68, 0.1)',
  borderColor: 'rgba(239, 68, 68, 0.3)',
  color: '#dc2626',
};

const infoBox = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '12px 16px',
  background: 'rgba(0, 102, 204, 0.05)',
  borderTop: '1px solid rgba(0, 102, 204, 0.1)',
  fontSize: '0.85rem',
  color: 'rgba(0, 0, 0, 0.7)',
};
