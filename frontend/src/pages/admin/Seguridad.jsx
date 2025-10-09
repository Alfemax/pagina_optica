import React, { useEffect, useState } from 'react';
import { securityApi } from '../../services/adminApi';
import Modal from '../../components/Modal';

export default function Seguridad() {
  const [cfg, setCfg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [emailTest, setEmailTest] = useState('');
  const [audit, setAudit] = useState([]);
  const [openAudit, setOpenAudit] = useState(false);

  async function load() {
    const [{ data: config }, { data: logs }] = await Promise.all([
      securityApi.get(),
      securityApi.audit(50),
    ]);
    setCfg(config.data);
    setAudit(logs.data || []);
  }

  useEffect(() => { load(); }, []);

  if (!cfg) return <div>Cargando…</div>;

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg('');
    try {
      await securityApi.save(cfg);
      setMsg('Configuración guardada.');
    } catch (err) {
      setMsg(err.response?.data?.error || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const onTest = async () => {
    if (!emailTest) return setMsg('Ingresa un correo para la prueba SMTP.');
    setMsg('');
    try {
      await securityApi.testSmtp(emailTest);
      setMsg('Correo de prueba enviado.');
    } catch (err) {
      setMsg(err.response?.data?.error || 'No se pudo enviar el correo de prueba');
    }
  };

  return (
    <>
      <h2 style={{ fontFamily:'var(--font-heading)' }}>Seguridad</h2>
      <form onSubmit={onSave} style={{ display:'grid', gap:16, maxWidth:720 }}>
        <fieldset style={box}>
          <legend style={legend}>Política de contraseñas</legend>
          <div style={row}>
            <label style={label}>Longitud mínima</label>
            <input type="number" min={4} value={cfg.password_min}
              onChange={(e)=>setCfg(s=>({...s, password_min: parseInt(e.target.value,10)}))}
              style={input}
            />
          </div>
          <div style={row}>
            <label style={label}>Requiere número</label>
            <input type="checkbox" checked={!!cfg.password_require_number}
              onChange={(e)=>setCfg(s=>({...s, password_require_number: e.target.checked}))}
            />
          </div>
          <div style={row}>
            <label style={label}>Requiere caracter especial</label>
            <input type="checkbox" checked={!!cfg.password_require_special}
              onChange={(e)=>setCfg(s=>({...s, password_require_special: e.target.checked}))}
            />
          </div>
        </fieldset>

        <fieldset style={box}>
          <legend style={legend}>Sesiones y CORS</legend>
          <div style={row}>
            <label style={label}>Token TTL (horas)</label>
            <input type="number" min={1} value={cfg.token_ttl_hours}
              onChange={(e)=>setCfg(s=>({...s, token_ttl_hours: parseInt(e.target.value,10)}))}
              style={input}
            />
          </div>
          <div style={row}>
            <label style={label}>CORS (orígenes)</label>
            <input placeholder="Ej: http://localhost:5173,http://localhost:3000"
              value={cfg.cors_origins}
              onChange={(e)=>setCfg(s=>({...s, cors_origins: e.target.value}))}
              style={{ ...input, width:'100%' }}
            />
          </div>
          <div style={row}>
            <label style={label}>MFA (placeholder)</label>
            <input type="checkbox" checked={!!cfg.mfa_enabled}
              onChange={(e)=>setCfg(s=>({...s, mfa_enabled: e.target.checked}))}
            />
          </div>
        </fieldset>

        <fieldset style={box}>
          <legend style={legend}>SMTP</legend>
          <div style={{ display:'flex', gap:8 }}>
            <input type="email" placeholder="Correo para prueba"
              value={emailTest}
              onChange={(e)=>setEmailTest(e.target.value)}
              style={{ ...input, flex:1 }}
            />
            <button type="button" className="btn" onClick={onTest}>Enviar prueba</button>
          </div>
        </fieldset>

        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button className="btn" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
          {msg && <small>{msg}</small>}
          <div style={{ flex:1 }} />
          <button type="button" className="btn" onClick={()=>setOpenAudit(true)}>Ver bitácora</button>
        </div>
      </form>

      {/* Bitácora */}
      <Modal open={openAudit} onClose={()=>setOpenAudit(false)} title="Bitácora de autenticación">
        <div style={{ maxHeight: 380, overflow:'auto' }}>
          <div style={{ display:'grid', gridTemplateColumns:'160px 1fr 1fr 1fr', gap:8, fontWeight:700, marginBottom:8 }}>
            <div>Fecha</div><div>Correo</div><div>Acción</div><div>IP</div>
          </div>
          {audit.map(a => (
            <div key={a.id} style={{ display:'grid', gridTemplateColumns:'160px 1fr 1fr 1fr', gap:8, borderTop:'1px solid #eee', padding:'6px 0' }}>
              <div>{new Date(a.created_at).toLocaleString()}</div>
              <div>{a.correo}</div>
              <div>{a.action}</div>
              <div>{a.ip || '—'}</div>
            </div>
          ))}
          {audit.length === 0 && <div style={{ opacity:.7 }}>Sin eventos</div>}
        </div>
      </Modal>
    </>
  );
}

const box = { border:'1px solid var(--color-gris-claro)', borderRadius:12, padding:'12px 14px', background:'#fff' };
const legend = { padding:'0 6px', fontWeight:700 };
const row = { display:'flex', alignItems:'center', gap:10, margin:'6px 0' };
const label = { width:240, opacity:.85 };
const input = { border:'1px solid var(--color-gris-claro)', borderRadius:8, padding:'8px 10px' };
