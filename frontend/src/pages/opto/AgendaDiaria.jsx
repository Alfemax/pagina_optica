// frontend/src/pages/opto/AgendaDiaria.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { optoApi } from '../../services/optoApi';
import Modal from '../../components/Modal';
import { Calendar, Clock, User, FileText, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

/* =================== ESTADOS (chips) =================== */
const estados = {
  pendiente:   { bg: '#fff7e6', txt: '#8a6100',  label: 'Pendiente' },
  confirmada:  { bg: '#e6fffb', txt: '#006d75',  label: 'Confirmada' },
  completada:  { bg: '#f6ffed', txt: '#237804',  label: 'Completada' },
  cancelada:   { bg: '#fff1f0', txt: '#a8071a',  label: 'Cancelada' },
  no_asistio:  { bg: '#fff1f0', txt: '#a8071a',  label: 'No asistió' },
  reprogramada:{ bg: '#e6f7ff', txt: '#0050b3',  label: 'Reprogramada' },
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
          <button className="btn" onClick={onClose} style={{ background:'#9ca3af' }}>Cancelar</button>
          <button className="btn" disabled={!checked} onClick={() => onConfirm?.()}>
            Sí, ya completé la sesión
          </button>
        </div>
      }
    >
      <div style={{ display:'grid', gap:12 }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
          <CheckCircle2 size={22} color="#16a34a" />
          <div>
            <div style={{ fontWeight:700 }}>¿Ya completó la sesión con el paciente?</div>
            <small style={{ opacity:.85 }}>
              Al confirmar, se marcará la cita como <b>completada</b> y podrás generar la receta.
            </small>
          </div>
        </div>
        <label style={{
          display:'flex', alignItems:'center', gap:10,
          padding:'10px 12px', border:'1px solid #e5e7eb', borderRadius:10, background:'#f8fafc'
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
      id_paciente: cita?.id_paciente || null,          // puede venir null
      paciente_nombre: f.paciente_nombre || null,       // nombre libre si no hay paciente vinculado
      fecha: f.fecha,
      od_esf:f.od_esf, od_cil:f.od_cil, od_eje:f.od_eje, od_dp:f.od_dp, od_color:f.od_color, od_add:f.od_add,
      oi_esf:f.oi_esf, oi_cil:f.oi_cil, oi_eje:f.oi_eje, oi_dp:f.oi_dp, oi_color:f.oi_color, oi_add:f.oi_add,
      observaciones: f.observaciones || null,
    };
    const { data } = await optoApi.crearReceta(payload);
    onSaved?.(data?.id_receta);
  };

  const fs   = { border:'1px solid #e5e7eb', borderRadius:14, padding:12, display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10, background:'#fff' };
  const cell = { display:'grid', gap:4 };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Generar receta"
      footer={
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button className="btn" onClick={onClose} style={{ background:'#9ca3af' }}>Cerrar</button>
          <button className="btn" onClick={save}>Guardar y enviar</button>
        </div>
      }
    >
      <div style={{ display:'grid', gap:12 }}>
        {/* Cabecera rosada (área a llenar) */}
        <div style={{
          display:'grid', gridTemplateColumns:'1fr 1fr', gap:12,
          background:'linear-gradient(135deg,#ffe4e6,#fecdd3)', border:'1px solid #fda4af',
          borderRadius:14, padding:12
        }}>
          <div>
            <label className="subtitle">Fecha</label>
            <input type="date" value={f.fecha} onChange={e=>set('fecha', e.target.value)} style={input}/>
          </div>
          <div>
            <label className="subtitle">Paciente</label>
            <input value={f.paciente_nombre} onChange={e=>set('paciente_nombre', e.target.value)} style={input}/>
          </div>
        </div>

        {/* OD */}
        <fieldset style={fs}>
          <legend style={{ fontWeight:700 }}>OD</legend>
          {['esf','cil','eje','dp','color','add'].map(k=>(
            <div key={k} style={cell}>
              <small style={{ opacity:.7 }}>{k.toUpperCase()}</small>
              <input value={f['od_'+k]} onChange={e=>set('od_'+k,e.target.value)} style={input}/>
            </div>
          ))}
        </fieldset>

        {/* OI */}
        <fieldset style={fs}>
          <legend style={{ fontWeight:700 }}>OI</legend>
          {['esf','cil','eje','dp','color','add'].map(k=>(
            <div key={k} style={cell}>
              <small style={{ opacity:.7 }}>{k.toUpperCase()}</small>
              <input value={f['oi_'+k]} onChange={e=>set('oi_'+k,e.target.value)} style={input}/>
            </div>
          ))}
        </fieldset>

        <div>
          <label className="subtitle">Observaciones</label>
          <textarea value={f.observaciones} onChange={e=>set('observaciones', e.target.value)} style={{ ...input, height: 90 }} />
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

  // modal de nueva/edición
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ id_cita: null, id_paciente: '', inicio: '', fin: '', motivo: '', notas: '' });
  const [pacientes, setPacientes] = useState([]);
  const isEdit = useMemo(() => !!form.id_cita, [form.id_cita]);

  // modales de flujo
  const [rxOpen, setRxOpen] = useState(false);
  const [citaRx, setCitaRx]   = useState(null);
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

  // Confirmar / Cancelar / Completar con UX mejorado
  const changeStatus = async (id, estado) => {
    if (estado === 'confirmada') {
      const note = prompt('Mensaje opcional para el paciente (confirmación):') || undefined;
      await optoApi.setEstado(id, 'confirmada', note);
      await fetchAgenda();
      return;
    }

    if (estado === 'completada') {
      // Abrir modal "¿ya completó la sesión?"
      setPendingCompleteId(id);
      setConfirmOpen(true);
      return;
    }

    // fallback genérico
    await optoApi.setEstado(id, estado);
    await fetchAgenda();
  };

  const confirmComplete = async () => {
    if (!pendingCompleteId) return;
    setConfirmOpen(false);
    // marcar completada
    const { data } = await optoApi.setEstado(pendingCompleteId, 'completada');
    await fetchAgenda();

    // si backend indica crear receta, abrir modal con la cita
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

  return (
    <div style={page}>
      {/* Sidebar */}
      <aside>
        <div className="card" style={{ padding: 14, borderRadius: 14 }}>
          <h3 style={{ marginTop: 0, display:'flex', alignItems:'center', gap:8 }}>
            <Calendar size={18} /> Agenda Diaria
          </h3>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={input}
          />
          <button onClick={openNew} className="btn" style={{ width: '100%', marginTop: 12 }}>
            Nueva cita
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <main className="card" style={{ padding: 16, borderRadius: 14 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h2 style={{ margin: 0, display:'flex', alignItems:'center', gap:8 }}>
            <Clock size={20} /> Citas del {date}
          </h2>
          <button className="btn" onClick={fetchAgenda} title="Actualizar">
            <RefreshCw size={16} style={{ marginRight:6 }} /> Actualizar
          </button>
        </div>

        {loading ? (
          <p style={{ opacity: 0.7, marginTop: 16 }}>Cargando…</p>
        ) : rows.length === 0 ? (
          <div style={emptyBox}>
            <AlertTriangle size={18} /> No hay citas para este día.
          </div>
        ) : (
          <div style={{ marginTop: 16 }}>
            <table style={table}>
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Paciente</th>
                  <th>Motivo</th>
                  <th>Duración</th>
                  <th>Estado</th>
                  <th style={{ textAlign:'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => {
                  const est = estados[r.estado] || estados.pendiente;
                  return (
                    <tr key={r.id_cita}>
                      <td>{fmtHour(r.inicio)}–{fmtHour(r.fin)}</td>
                      <td style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={avatarIcon}><User size={14} /></span>
                        {r.paciente_nombre || `${r.nombres||''} ${r.apellidos||''}` || '— Sin asignar —'}
                      </td>
                      <td>{r.motivo || '—'}</td>
                      <td>{diffMin(r.inicio, r.fin)} min</td>
                      <td>
                        <span style={{ background: est.bg, color: est.txt, padding:'2px 8px', borderRadius: 999, fontSize: 12 }}>
                          {est.label}
                        </span>
                      </td>
                      <td style={{ textAlign:'right', whiteSpace:'nowrap' }}>
                        <button className="btn" onClick={() => openEdit(r)} style={{ marginRight: 6 }}>Editar</button>
                        {r.estado !== 'confirmada' && r.estado !== 'cancelada' && (
                          <button className="btn" onClick={() => changeStatus(r.id_cita, 'confirmada')} style={{ marginRight: 6 }}>
                            Confirmar
                          </button>
                        )}
                        {r.estado !== 'completada' && r.estado !== 'cancelada' && (
                          <button className="btn" onClick={() => changeStatus(r.id_cita, 'completada')} style={{ marginRight: 6 }}>
                            Completar
                          </button>
                        )}
                        {r.estado !== 'cancelada' && (
                          <button className="btn" onClick={() => cancel(r.id_cita)} style={{ background: '#f5222d' }}>
                            Cancelar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <small style={{ display:'inline-flex', alignItems:'center', gap:6, opacity:.7, marginTop:8 }}>
              <FileText size={14}/> Al completar, se abre el formulario para la receta y se enviará por correo al paciente.
            </small>
          </div>
        )}
      </main>

      {/* Modal crear/editar cita */}
      <Modal
        open={open}
        title={isEdit ? 'Editar cita' : 'Nueva cita'}
        onClose={() => setOpen(false)}
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn" onClick={() => setOpen(false)} style={{ background: '#999' }}>Cerrar</button>
            <button className="btn" onClick={save}>{isEdit ? 'Guardar cambios' : 'Crear cita'}</button>
          </div>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="subtitle">Paciente</label>
            <select
              value={form.id_paciente}
              onChange={e => setForm(f => ({ ...f, id_paciente: e.target.value }))}
              disabled={isEdit}
              style={input}
            >
              <option value="">— Sin asignar —</option>
              {pacientes.map(p => (
                <option key={p.id_paciente} value={p.id_paciente}>
                  {p.nombres} {p.apellidos} — {p.correo}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="subtitle">Inicio</label>
            <input type="datetime-local" value={form.inicio} onChange={e => setForm(f => ({ ...f, inicio: e.target.value }))} style={input} />
          </div>
          <div>
            <label className="subtitle">Fin</label>
            <input type="datetime-local" value={form.fin} onChange={e => setForm(f => ({ ...f, fin: e.target.value }))} style={input} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="subtitle">Motivo (opcional)</label>
            <input value={form.motivo} onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))} style={input} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="subtitle">Notas (opcional)</label>
            <textarea value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} style={{ ...input, height: 80 }} />
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
          window.open(optoApi.recetaPdfUrl(id_receta), '_blank');
        }}
      />
    </div>
  );
}

/* =================== ESTILOS INLINE =================== */
const page = {
  maxWidth: 1200, margin: '0 auto', padding: '24px 20px',
  display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24
};
const input = {
  width:'100%', padding: 10, borderRadius: 10,
  border: '1px solid var(--color-gris-claro)', background:'#fff'
};
const emptyBox = {
  marginTop: 16, padding: 16, borderRadius: 12,
  background: '#f8fafc', border: '1px dashed #d1d5db',
  display:'inline-flex', alignItems:'center', gap:10
};
const table = {
  width:'100%', borderCollapse:'separate', borderSpacing: 0,
};
const avatarIcon = {
  display:'inline-grid', placeItems:'center',
  width:24, height:24, borderRadius:999, background:'#e0f2fe', color:'#0369a1'
};
