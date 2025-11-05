import React, { useEffect, useState } from 'react';
import { securityApi } from '../../services/adminApi';
import Modal from '../../components/Modal';
import { Shield, Lock, Globe, Mail, Database, Eye } from 'lucide-react';

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
    <div style={container}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        input:focus {
          border-color: rgba(0, 102, 204, 0.6) !important;
          box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1) !important;
        }
        input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: #0066cc;
        }
      `}</style>

      <div style={header}>
        <div style={iconBox}>
          <Shield size={24} />
        </div>
        <div>
          <h2 style={mainTitle}>Seguridad</h2>
          <p style={subtitle}>Configura políticas y ajustes de seguridad</p>
        </div>
      </div>

      <form onSubmit={onSave}>
        {/* Política de contraseñas */}
        <div style={section}>
          <div style={sectionHeader}>
            <Lock size={20} style={{ color: '#0066cc' }} />
            <h3 style={sectionTitle}>Política de contraseñas</h3>
          </div>
          
          <div style={formGrid}>
            <div>
              <label style={labelStyle}>Longitud mínima</label>
              <input 
                type="number" 
                min={4} 
                value={cfg.password_min}
                onChange={(e)=>setCfg(s=>({...s, password_min: parseInt(e.target.value,10)}))}
                style={inputStyle}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}>
              <label style={checkboxLabel}>
                <input 
                  type="checkbox" 
                  checked={!!cfg.password_require_number}
                  onChange={(e)=>setCfg(s=>({...s, password_require_number: e.target.checked}))}
                />
                <span>Requiere número</span>
              </label>
              <label style={checkboxLabel}>
                <input 
                  type="checkbox" 
                  checked={!!cfg.password_require_special}
                  onChange={(e)=>setCfg(s=>({...s, password_require_special: e.target.checked}))}
                />
                <span>Requiere caracter especial</span>
              </label>
            </div>
          </div>
        </div>

        {/* Sesiones y CORS */}
        <div style={section}>
          <div style={sectionHeader}>
            <Globe size={20} style={{ color: '#0066cc' }} />
            <h3 style={sectionTitle}>Sesiones y CORS</h3>
          </div>
          
          <div style={formGrid}>
            <div>
              <label style={labelStyle}>Token TTL (horas)</label>
              <input 
                type="number" 
                min={1} 
                value={cfg.token_ttl_hours}
                onChange={(e)=>setCfg(s=>({...s, token_ttl_hours: parseInt(e.target.value,10)}))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Orígenes CORS (separados por coma)</label>
              <input 
                placeholder="http://localhost:5173,http://localhost:3000"
                value={cfg.cors_origins}
                onChange={(e)=>setCfg(s=>({...s, cors_origins: e.target.value}))}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={checkboxLabel}>
              <input 
                type="checkbox" 
                checked={!!cfg.mfa_enabled}
                onChange={(e)=>setCfg(s=>({...s, mfa_enabled: e.target.checked}))}
              />
              <span>Habilitar MFA (autenticación multifactor)</span>
            </label>
          </div>
        </div>

        {/* SMTP */}
        <div style={section}>
          <div style={sectionHeader}>
            <Mail size={20} style={{ color: '#0066cc' }} />
            <h3 style={sectionTitle}>Configuración SMTP</h3>
          </div>
          
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Correo para prueba</label>
              <input 
                type="email" 
                placeholder="correo@ejemplo.com"
                value={emailTest}
                onChange={(e)=>setEmailTest(e.target.value)}
                style={inputStyle}
              />
            </div>
            <button 
              type="button"
              style={secondaryButtonStyle}
              onClick={onTest}
              onMouseEnter={e => e.target.style.background = '#f8f9fa'}
              onMouseLeave={e => e.target.style.background = '#ffffff'}
            >
              Enviar prueba
            </button>
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
                color: msg.includes('guardada') || msg.includes('enviado') ? '#10b981' : '#ef4444',
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
            onClick={()=>setOpenAudit(true)}
            onMouseEnter={e => e.target.style.background = '#f8f9fa'}
            onMouseLeave={e => e.target.style.background = '#ffffff'}
          >
            <Eye size={16} />
            Ver bitácora
          </button>
        </div>
      </form>

      {/* Modal Bitácora */}
      <Modal 
        open={openAudit} 
        onClose={()=>setOpenAudit(false)} 
        title="Bitácora de autenticación"
      >
        <div style={{ maxHeight: 480, overflow: 'auto' }}>
          <div style={auditHeader}>
            <div>Fecha</div>
            <div>Correo</div>
            <div>Acción</div>
            <div>IP</div>
          </div>
          {audit.map(a => (
            <div key={a.id} style={auditRow}>
              <div style={auditDateCell}>
                {new Date(a.created_at).toLocaleString('es-GT', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              <div style={auditEmailCell}>{a.correo}</div>
              <div style={auditActionCell}>
                <span style={{
                  padding: '3px 8px',
                  borderRadius: 2,
                  fontSize: '0.75rem',
                  background: a.action.includes('login') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0, 102, 204, 0.1)',
                  color: a.action.includes('login') ? '#10b981' : '#0066cc',
                  fontWeight: 500,
                }}>
                  {a.action}
                </span>
              </div>
              <div style={auditIpCell}>{a.ip || '—'}</div>
            </div>
          ))}
          {audit.length === 0 && (
            <div style={emptyState}>Sin eventos registrados</div>
          )}
        </div>
      </Modal>
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

const formGrid = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 16,
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

const auditHeader = {
  display: 'grid',
  gridTemplateColumns: '140px 1fr 120px 120px',
  gap: 12,
  fontWeight: 500,
  fontSize: '0.8rem',
  color: 'rgba(0, 0, 0, 0.6)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  padding: '12px 0',
  borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
  marginBottom: 8,
};

const auditRow = {
  display: 'grid',
  gridTemplateColumns: '140px 1fr 120px 120px',
  gap: 12,
  borderTop: '1px solid rgba(0, 0, 0, 0.05)',
  padding: '12px 0',
  fontSize: '0.85rem',
};

const auditDateCell = {
  fontSize: '0.8rem',
  color: 'rgba(0, 0, 0, 0.6)',
};

const auditEmailCell = {
  fontWeight: 500,
};

const auditActionCell = {
  display: 'flex',
  alignItems: 'center',
};

const auditIpCell = {
  color: 'rgba(0, 0, 0, 0.6)',
  fontSize: '0.85rem',
};

const emptyState = {
  padding: 32,
  textAlign: 'center',
  color: 'rgba(0, 0, 0, 0.4)',
  fontSize: '0.9rem',
};
