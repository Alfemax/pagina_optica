import React, { useEffect, useState } from 'react';
import { settingsApi } from '../../services/adminApi';

export default function Configuracion() {
  const [cfg, setCfg] = useState(null);
  const [msg, setMsg] = useState('');
  const [uploadMsg, setUploadMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [heroFile, setHeroFile] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await settingsApi.get();
      setCfg(data.data);
    })();
  }, []);

  if (!cfg) return <div>Cargando…</div>;

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg('');
    try {
      await settingsApi.save(cfg);
      setMsg('Configuración guardada.');
    } catch (err) {
      setMsg(err.response?.data?.error || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const onUpload = async (e) => {
    e.preventDefault();
    setUploadMsg('');
    const fd = new FormData();
    if (logoFile) fd.append('logo', logoFile);
    if (heroFile) fd.append('hero', heroFile);
    if (!logoFile && !heroFile) return setUploadMsg('Seleccione un archivo');
    try {
      const { data } = await settingsApi.upload(fd);
      setCfg(c => ({ ...c, ...data.data }));
      setUploadMsg('Imágenes actualizadas.');
      setLogoFile(null); setHeroFile(null);
    } catch (err) {
      setUploadMsg(err.response?.data?.error || 'No se pudo subir');
    }
  };

  const onBackup = async () => {
    setMsg('');
    try {
      await settingsApi.backup();
      setMsg('Backup encolado.');
    } catch (err) {
      setMsg(err.response?.data?.error || 'No se pudo encolar el backup');
    }
  };

  return (
    <div>
      <h2 style={{ fontFamily:'var(--font-heading)' }}>Configuración</h2>

      {/* General */}
      <form onSubmit={onSave} style={section}>
        <h3 className="subtitle">Datos de la clínica</h3>
        <div style={grid2}>
          <label>Nombre
            <input value={cfg.clinic_name||''} onChange={e=>setCfg(s=>({...s, clinic_name:e.target.value}))} />
          </label>
          <label>Correo emisor (FROM)
            <input type="email" value={cfg.email_from||''} onChange={e=>setCfg(s=>({...s, email_from:e.target.value}))} />
          </label>
          <label>Teléfono
            <input value={cfg.phone||''} onChange={e=>setCfg(s=>({...s, phone:e.target.value}))} />
          </label>
          <label>WhatsApp
            <input value={cfg.whatsapp||''} onChange={e=>setCfg(s=>({...s, whatsapp:e.target.value}))} />
          </label>
          <label style={{ gridColumn:'1 / -1' }}>Dirección
            <input value={cfg.address||''} onChange={e=>setCfg(s=>({...s, address:e.target.value}))} />
          </label>
        </div>

        {/* Horarios */}
        <h3 className="subtitle" style={{ marginTop:10 }}>Horarios</h3>
        <div style={grid3}>
          <label>Lun-Vie
            <input placeholder="08:00-17:00"
              value={cfg.business_hours?.lun_vie || ''}
              onChange={e=>setCfg(s=>({...s, business_hours:{...s.business_hours, lun_vie:e.target.value}}))}
            />
          </label>
          <label>Sábado
            <input placeholder="08:00-12:00"
              value={cfg.business_hours?.sab || ''}
              onChange={e=>setCfg(s=>({...s, business_hours:{...s.business_hours, sab:e.target.value}}))}
            />
          </label>
          <label>Domingo
            <input placeholder="cerrado"
              value={cfg.business_hours?.dom || ''}
              onChange={e=>setCfg(s=>({...s, business_hours:{...s.business_hours, dom:e.target.value}}))}
            />
          </label>
        </div>

        {/* CORS / Mantenimiento */}
        <h3 className="subtitle" style={{ marginTop:10 }}>CORS y mantenimiento</h3>
        <div style={grid2}>
          <label>Orígenes CORS (coma)
            <input placeholder="http://localhost:5173"
              value={cfg.cors_origins||''}
              onChange={e=>setCfg(s=>({...s, cors_origins:e.target.value}))}
            />
          </label>
          <label style={{ display:'flex', alignItems:'center', gap:8, marginTop:20 }}>
            <input type="checkbox"
              checked={String(cfg.maintenance)==='1'}
              onChange={e=>setCfg(s=>({...s, maintenance: e.target.checked ? 1 : 0}))}
            />
            Modo mantenimiento
          </label>
        </div>

        <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:12 }}>
          <button className="btn" disabled={saving}>{saving?'Guardando…':'Guardar'}</button>
          {msg && <small>{msg}</small>}
          <div style={{ flex:1 }} />
          <button type="button" className="btn" onClick={onBackup}>Generar backup</button>
        </div>
      </form>

      {/* Branding */}
      <form onSubmit={onUpload} style={section}>
        <h3 className="subtitle">Branding (imágenes)</h3>
        <div style={grid2}>
          <div>
            <label>Logo (mostrado en el header)</label>
            <div style={previewBox}>
              {cfg.logo_url ? <img src={cfg.logo_url} alt="logo" style={img} /> : <span>Sin logo</span>}
            </div>
            <input type="file" accept="image/*" onChange={e=>setLogoFile(e.target.files?.[0]||null)} />
          </div>
          <div>
            <label>Imagen Hero (portada Inicio)</label>
            <div style={previewBox}>
              {cfg.hero_url ? <img src={cfg.hero_url} alt="hero" style={img} /> : <span>Sin imagen</span>}
            </div>
            <input type="file" accept="image/*" onChange={e=>setHeroFile(e.target.files?.[0]||null)} />
          </div>
        </div>

        <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:12 }}>
          <button className="btn">Subir imágenes</button>
          {uploadMsg && <small>{uploadMsg}</small>}
        </div>
      </form>
    </div>
  );
}

const section = { border:'1px solid var(--color-gris-claro)', borderRadius:12, padding:14, background:'#fff', marginTop:16 };
const grid2 = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 };
const grid3 = { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 };
const previewBox = { border:'1px solid #eee', borderRadius:8, height:80, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', background:'#fafafa', margin:'8px 0' };
const img = { maxHeight:'100%', maxWidth:'100%' };
