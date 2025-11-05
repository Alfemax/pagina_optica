import React, { useEffect, useState } from 'react';
import { settingsApi } from '../../services/adminApi';
import { Settings, Building2, Clock, Globe, Image, Database } from 'lucide-react';

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

  if (!cfg) return (
    <div style={loadingContainer}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={spinner}></div>
      <p style={loadingText}>Cargando configuración...</p>
    </div>
  );

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
    <div style={container}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        input:focus, select:focus {
          border-color: rgba(0, 102, 204, 0.6) !important;
          box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1) !important;
        }
        input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: #0066cc;
        }
        input[type="file"] {
          margin-top: 8px;
        }
      `}</style>

      <div style={header}>
        <div style={iconBox}>
          <Settings size={24} />
        </div>
        <div>
          <h2 style={mainTitle}>Configuración del Sistema</h2>
          <p style={subtitle}>Gestiona los ajustes generales de la clínica</p>
        </div>
      </div>

      {/* Datos de la clínica */}
      <form onSubmit={onSave}>
        <div style={section}>
          <div style={sectionHeader}>
            <Building2 size={20} style={{ color: '#0066cc' }} />
            <h3 style={sectionTitle}>Datos de la clínica</h3>
          </div>
          
          <div style={grid2}>
            <div>
              <label style={labelStyle}>Nombre de la clínica</label>
              <input 
                style={inputStyle}
                placeholder="Clínica El Áncora"
                value={cfg.clinic_name||''} 
                onChange={e=>setCfg(s=>({...s, clinic_name:e.target.value}))} 
              />
            </div>
            <div>
              <label style={labelStyle}>Correo emisor (FROM)</label>
              <input 
                type="email"
                style={inputStyle}
                placeholder="info@clinica.com"
                value={cfg.email_from||''} 
                onChange={e=>setCfg(s=>({...s, email_from:e.target.value}))} 
              />
            </div>
            <div>
              <label style={labelStyle}>Teléfono</label>
              <input 
                style={inputStyle}
                placeholder="+502 1234-5678"
                value={cfg.phone||''} 
                onChange={e=>setCfg(s=>({...s, phone:e.target.value}))} 
              />
            </div>
            <div>
              <label style={labelStyle}>WhatsApp</label>
              <input 
                style={inputStyle}
                placeholder="+502 1234-5678"
                value={cfg.whatsapp||''} 
                onChange={e=>setCfg(s=>({...s, whatsapp:e.target.value}))} 
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Dirección</label>
              <input 
                style={inputStyle}
                placeholder="Ciudad de Guatemala, Guatemala"
                value={cfg.address||''} 
                onChange={e=>setCfg(s=>({...s, address:e.target.value}))} 
              />
            </div>
          </div>
        </div>

        {/* Horarios */}
        <div style={section}>
          <div style={sectionHeader}>
            <Clock size={20} style={{ color: '#0066cc' }} />
            <h3 style={sectionTitle}>Horarios de atención</h3>
          </div>
          
          <div style={grid3}>
            <div>
              <label style={labelStyle}>Lunes - Viernes</label>
              <input 
                style={inputStyle}
                placeholder="08:00-17:00"
                value={cfg.business_hours?.lun_vie || ''}
                onChange={e=>setCfg(s=>({...s, business_hours:{...s.business_hours, lun_vie:e.target.value}}))}
              />
            </div>
            <div>
              <label style={labelStyle}>Sábado</label>
              <input 
                style={inputStyle}
                placeholder="08:00-12:00"
                value={cfg.business_hours?.sab || ''}
                onChange={e=>setCfg(s=>({...s, business_hours:{...s.business_hours, sab:e.target.value}}))}
              />
            </div>
            <div>
              <label style={labelStyle}>Domingo</label>
              <input 
                style={inputStyle}
                placeholder="Cerrado"
                value={cfg.business_hours?.dom || ''}
                onChange={e=>setCfg(s=>({...s, business_hours:{...s.business_hours, dom:e.target.value}}))}
              />
            </div>
          </div>
        </div>

        {/* CORS y mantenimiento */}
        <div style={section}>
          <div style={sectionHeader}>
            <Globe size={20} style={{ color: '#0066cc' }} />
            <h3 style={sectionTitle}>CORS y mantenimiento</h3>
          </div>
          
          <div style={grid2}>
            <div>
              <label style={labelStyle}>Orígenes CORS (separados por coma)</label>
              <input 
                style={inputStyle}
                placeholder="http://localhost:5173"
                value={cfg.cors_origins||''}
                onChange={e=>setCfg(s=>({...s, cors_origins:e.target.value}))}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 10 }}>
              <label style={checkboxLabel}>
                <input 
                  type="checkbox"
                  checked={String(cfg.maintenance)==='1'}
                  onChange={e=>setCfg(s=>({...s, maintenance: e.target.checked ? 1 : 0}))}
                />
                <span>Modo mantenimiento</span>
              </label>
            </div>
          </div>
        </div>

        <div style={actionBar}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button 
              style={primaryButtonStyle}
              disabled={saving}
              type="submit"
              onMouseEnter={e => !saving && (e.target.style.transform = 'translateY(-1px)')}
              onMouseLeave={e => !saving && (e.target.style.transform = 'translateY(0)')}
            >
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
            {msg && (
              <small style={{ 
                color: msg.includes('guardada') ? '#10b981' : '#ef4444',
                fontSize: '0.85rem',
                fontWeight: 500,
              }}>
                {msg}
              </small>
            )}
          </div>
          <button 
            type="button"
            style={secondaryButtonStyle}
            onClick={onBackup}
            onMouseEnter={e => e.target.style.background = '#f8f9fa'}
            onMouseLeave={e => e.target.style.background = '#ffffff'}
          >
            <Database size={16} />
            Generar backup
          </button>
        </div>
      </form>

      {/* Branding */}
      <form onSubmit={onUpload}>
        <div style={section}>
          <div style={sectionHeader}>
            <Image size={20} style={{ color: '#0066cc' }} />
            <h3 style={sectionTitle}>Branding e imágenes</h3>
          </div>
          
          <div style={grid2}>
            <div>
              <label style={labelStyle}>Logo (header del sitio)</label>
              <div style={previewBox}>
                {cfg.logo_url ? (
                  <img src={cfg.logo_url} alt="logo" style={imgStyle} />
                ) : (
                  <span style={emptyState}>Sin logo</span>
                )}
              </div>
              <input 
                type="file" 
                accept="image/*" 
                onChange={e=>setLogoFile(e.target.files?.[0]||null)}
                style={fileInputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Imagen Hero (portada de inicio)</label>
              <div style={previewBox}>
                {cfg.hero_url ? (
                  <img src={cfg.hero_url} alt="hero" style={imgStyle} />
                ) : (
                  <span style={emptyState}>Sin imagen</span>
                )}
              </div>
              <input 
                type="file" 
                accept="image/*" 
                onChange={e=>setHeroFile(e.target.files?.[0]||null)}
                style={fileInputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 16 }}>
            <button 
              style={primaryButtonStyle}
              type="submit"
              onMouseEnter={e => e.target.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
            >
              Subir imágenes
            </button>
            {uploadMsg && (
              <small style={{ 
                color: uploadMsg.includes('actualizadas') ? '#10b981' : '#ef4444',
                fontSize: '0.85rem',
                fontWeight: 500,
              }}>
                {uploadMsg}
              </small>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

// Styles
const container = {
  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
  minHeight: '100vh',
  padding: '32px',
  color: '#1a1d29',
};

const loadingContainer = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 400,
  gap: 16,
};

const spinner = {
  width: 48,
  height: 48,
  border: '4px solid rgba(0, 0, 0, 0.1)',
  borderTop: '4px solid #0066cc',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
};

const loadingText = {
  color: 'rgba(0, 0, 0, 0.6)',
  fontSize: '0.9rem',
  margin: 0,
  fontWeight: 300,
  letterSpacing: '0.3px',
};

const header = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  marginBottom: 32,
  paddingBottom: 24,
  borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
};

const iconBox = {
  width: 48,
  height: 48,
  background: 'linear-gradient(135deg, #0066cc 0%, #0052a3 100%)',
  borderRadius: 2,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#ffffff',
  boxShadow: '0 8px 20px rgba(0, 102, 204, 0.3)',
};

const mainTitle = {
  margin: 0,
  fontSize: '1.75rem',
  fontWeight: 300,
  letterSpacing: '0.5px',
};

const subtitle = {
  margin: '4px 0 0 0',
  fontSize: '0.85rem',
  color: 'rgba(0, 0, 0, 0.5)',
  fontWeight: 300,
};

const section = {
  background: '#ffffff',
  border: '1px solid rgba(0, 0, 0, 0.08)',
  borderRadius: 2,
  padding: 24,
  marginBottom: 20,
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
};

const sectionHeader = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginBottom: 20,
  paddingBottom: 16,
  borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
};

const sectionTitle = {
  margin: 0,
  fontSize: '1.1rem',
  fontWeight: 500,
  color: '#1a1d29',
  letterSpacing: '0.3px',
};

const labelStyle = {
  display: 'block',
  marginBottom: 8,
  fontSize: '0.85rem',
  color: 'rgba(0, 0, 0, 0.7)',
  fontWeight: 500,
};

const inputStyle = {
  width: '100%',
  background: '#ffffff',
  border: '1px solid rgba(0, 0, 0, 0.12)',
  borderRadius: 2,
  padding: '10px 14px',
  color: '#1a1d29',
  fontSize: '0.9rem',
  outline: 'none',
  transition: 'all 0.2s ease',
  fontFamily: 'inherit',
};

const checkboxLabel = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: 500,
};

const grid2 = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 16,
};

const grid3 = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: 16,
};

const previewBox = {
  border: '1px solid rgba(0, 0, 0, 0.12)',
  borderRadius: 2,
  height: 120,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  background: '#f8f9fa',
  marginTop: 8,
};

const imgStyle = {
  maxHeight: '100%',
  maxWidth: '100%',
  objectFit: 'contain',
};

const emptyState = {
  fontSize: '0.85rem',
  color: 'rgba(0, 0, 0, 0.4)',
  fontWeight: 300,
};

const fileInputStyle = {
  fontSize: '0.85rem',
  color: 'rgba(0, 0, 0, 0.7)',
};

const actionBar = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
  marginBottom: 20,
  flexWrap: 'wrap',
};

const primaryButtonStyle = {
  background: 'linear-gradient(135deg, #0066cc 0%, #0052a3 100%)',
  border: 'none',
  borderRadius: 2,
  padding: '10px 20px',
  color: '#ffffff',
  fontSize: '0.85rem',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  letterSpacing: '0.3px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  boxShadow: '0 4px 12px rgba(0, 102, 204, 0.3)',
};

const secondaryButtonStyle = {
  background: '#ffffff',
  border: '1px solid rgba(0, 0, 0, 0.12)',
  borderRadius: 2,
  padding: '10px 18px',
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
