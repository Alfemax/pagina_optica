import React, { useEffect, useMemo, useState } from 'react';
import Modal from '../../components/Modal';
import { rolesApi } from '../../services/adminApi';
import { Key, Plus, Edit2, Trash2, Search, Shield } from 'lucide-react';

export default function Roles() {
  const [rows, setRows] = useState([]);
  const [perms, setPerms] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ id_rol:'', nombre:'', descripcion:'', activo:1, permisos:[] });
  const editing = useMemo(()=> !!form?.id_rol && rows.some(r=>r.id_rol===form.id_rol), [form, rows]);

  async function load() {
    setLoading(true);
    try {
      const [{ data: cat }, { data: list }] = await Promise.all([
        rolesApi.catalog(),
        rolesApi.list({ q }),
      ]);
      setPerms(cat.data || []);
      setRows(list.data || []);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm({ id_rol:'', nombre:'', descripcion:'', activo:1, permisos:[] });
    setMsg(''); setOpen(true);
  };
  const openEdit = (r) => {
    setForm({ id_rol:r.id_rol, nombre:r.nombre, descripcion:r.descripcion || '', activo:r.activo ? 1 : 0, permisos:[...(r.permisos||[])] });
    setMsg(''); setOpen(true);
  };

  const togglePerm = (p) => {
    setForm(f => {
      const has = f.permisos.includes(p);
      return { ...f, permisos: has ? f.permisos.filter(x=>x!==p) : [...f.permisos, p] };
    });
  };

  async function submit(e) {
    e.preventDefault();
    try {
      if (editing) {
        await rolesApi.update(form.id_rol, {
          nombre: form.nombre,
          descripcion: form.descripcion,
          activo: !!form.activo,
          permisos: form.permisos,
        });
      } else {
        if (!String(form.id_rol).trim()) return setMsg('El ID del rol es requerido (1..255).');
        await rolesApi.create({
          id_rol: parseInt(form.id_rol, 10),
          nombre: form.nombre,
          descripcion: form.descripcion,
          activo: !!form.activo,
          permisos: form.permisos,
        });
      }
      setOpen(false);
      await load();
    } catch (err) {
      setMsg(err.response?.data?.error || 'No se pudo guardar');
    }
  }

  async function remove(id) {
    if (!confirm('¿Eliminar este rol?')) return;
    try {
      await rolesApi.remove(id);
      await load();
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo eliminar');
    }
  }

  return (
    <div style={container}>
      <style>{`
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
          <Key size={24} />
        </div>
        <div>
          <h2 style={mainTitle}>Gestión de roles</h2>
          <p style={subtitle}>Administra roles y permisos del sistema</p>
        </div>
      </div>

      <div style={searchBar}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ 
            position: 'absolute', 
            left: 14, 
            top: '50%', 
            transform: 'translateY(-50%)',
            color: 'rgba(0, 0, 0, 0.4)',
          }} />
          <input 
            placeholder="Buscar por nombre o descripción" 
            value={q} 
            onChange={e=>setQ(e.target.value)}
            style={{
              ...inputStyle,
              paddingLeft: 44,
              width: '100%',
            }}
          />
        </div>
        
        <button 
          style={buttonStyle}
          onClick={load} 
          disabled={loading}
          onMouseEnter={e => !loading && (e.target.style.background = '#f8f9fa')}
          onMouseLeave={e => !loading && (e.target.style.background = '#ffffff')}
        >
          {loading ? 'Cargando…' : 'Buscar'}
        </button>

        <button 
          style={primaryButtonStyle}
          onClick={openCreate}
          onMouseEnter={e => e.target.style.transform = 'translateY(-1px)'}
          onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
        >
          <Plus size={18} />
          Nuevo rol
        </button>
      </div>

      <div style={tableContainer}>
        <div style={tableHeader}>
          <div>ID</div>
          <div>Nombre</div>
          <div>Descripción</div>
          <div>Estado</div>
          <div style={{textAlign:'right'}}>Acciones</div>
        </div>

        {rows.map(r => (
          <div 
            key={r.id_rol} 
            style={tableRow}
            onMouseEnter={e => e.currentTarget.style.background = '#f8f9fa'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={idCell}>#{r.id_rol}</div>
            <div style={nameCell}>{r.nombre}</div>
            <div style={descCell}>{r.descripcion || '—'}</div>
            <div>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.8rem',
              }}>
                <span style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: r.activo ? '#10b981' : '#ef4444',
                }} />
                {r.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <div style={actionsCell}>
              <button 
                style={actionButton}
                onClick={()=>openEdit(r)}
                onMouseEnter={e => e.target.style.background = '#f8f9fa'}
                onMouseLeave={e => e.target.style.background = '#ffffff'}
              >
                <Edit2 size={14} />
              </button>
              {r.id_rol !== 1 && (
                <button 
                  style={deleteButton}
                  onClick={()=>remove(r.id_rol)}
                  onMouseEnter={e => {
                    e.target.style.background = 'rgba(239, 68, 68, 0.15)';
                    e.target.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                  }}
                  onMouseLeave={e => {
                    e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                    e.target.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                  }}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}

        {rows.length === 0 && (
          <div style={emptyState}>Sin resultados</div>
        )}
      </div>

      <Modal 
        open={open} 
        onClose={()=>setOpen(false)} 
        title={editing ? `Editar rol #${form.id_rol}` : 'Nuevo rol'}
        footer={msg && <small style={{ color: '#ef4444', fontSize: '0.85rem' }}>{msg}</small>}
      >
        <form onSubmit={submit} style={{ display:'grid', gap:16 }}>
          {!editing && (
            <div>
              <label style={labelStyle}>ID del rol</label>
              <input 
                type="number" 
                min={1} 
                max={255} 
                placeholder="Ej: 4" 
                value={form.id_rol} 
                onChange={e=>setForm(f=>({...f, id_rol:e.target.value}))} 
                style={inputStyle}
                required 
              />
            </div>
          )}
          
          <div>
            <label style={labelStyle}>Nombre del rol</label>
            <input 
              placeholder="Ej: Editor" 
              value={form.nombre} 
              onChange={e=>setForm(f=>({...f, nombre:e.target.value}))} 
              style={inputStyle}
              required 
            />
          </div>

          <div>
            <label style={labelStyle}>Descripción</label>
            <input 
              placeholder="Descripción del rol" 
              value={form.descripcion} 
              onChange={e=>setForm(f=>({...f, descripcion:e.target.value}))} 
              style={inputStyle}
            />
          </div>

          <label style={checkboxLabel}>
            <input 
              type="checkbox" 
              checked={!!form.activo} 
              onChange={e=>setForm(f=>({...f, activo:e.target.checked}))} 
            />
            <span>Rol activo</span>
          </label>

          <div style={permissionsBox}>
            <div style={permissionsHeader}>
              <Shield size={18} style={{ color: '#0066cc' }} />
              <span style={permissionsTitle}>Permisos del rol</span>
            </div>
            <div style={permissionsGrid}>
              {perms.map(p => (
                <label key={p} style={permissionLabel}>
                  <input
                    type="checkbox"
                    checked={form.permisos.includes(p)}
                    onChange={()=>togglePerm(p)}
                  />
                  <span>{human(p)}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={modalActions}>
            <button 
              type="button" 
              style={buttonStyle}
              onClick={()=>setOpen(false)}
              onMouseEnter={e => e.target.style.background = '#f8f9fa'}
              onMouseLeave={e => e.target.style.background = '#ffffff'}
            >
              Cancelar
            </button>
            <button 
              style={primaryButtonStyle}
              type="submit"
              onMouseEnter={e => e.target.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
            >
              {editing ? 'Guardar cambios' : 'Crear rol'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function human(code='') {
  return code.split('.').map(s => s.charAt(0).toUpperCase()+s.slice(1)).join(' · ');
}

// Styles
const container = {
  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
  minHeight: '100vh',
  padding: '32px',
  color: '#1a1d29',
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

const searchBar = {
  display: 'flex',
  gap: 12,
  marginBottom: 24,
  alignItems: 'center',
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

const buttonStyle = {
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

const primaryButtonStyle = {
  ...buttonStyle,
  background: 'linear-gradient(135deg, #0066cc 0%, #0052a3 100%)',
  border: 'none',
  color: '#ffffff',
  boxShadow: '0 4px 12px rgba(0, 102, 204, 0.3)',
};

const tableContainer = {
  background: '#ffffff',
  border: '1px solid rgba(0, 0, 0, 0.08)',
  borderRadius: 2,
  overflow: 'hidden',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
};

const tableHeader = {
  display: 'grid',
  gridTemplateColumns: '80px 1.2fr 2fr 100px 220px',
  padding: '16px 20px',
  background: '#f8f9fa',
  fontSize: '0.8rem',
  fontWeight: 500,
  color: 'rgba(0, 0, 0, 0.6)',
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
  borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
};

const tableRow = {
  display: 'grid',
  gridTemplateColumns: '80px 1.2fr 2fr 100px 220px',
  padding: '16px 20px',
  borderTop: '1px solid rgba(0, 0, 0, 0.05)',
  transition: 'background 0.2s ease',
};

const idCell = {
  fontSize: '0.85rem',
  color: 'rgba(0, 0, 0, 0.5)',
};

const nameCell = {
  fontWeight: 500,
};

const descCell = {
  color: 'rgba(0, 0, 0, 0.7)',
};

const actionsCell = {
  textAlign: 'right',
  display: 'flex',
  gap: 8,
  justifyContent: 'flex-end',
};

const actionButton = {
  ...buttonStyle,
  padding: '8px 12px',
  fontSize: '0.8rem',
};

const deleteButton = {
  ...buttonStyle,
  padding: '8px 12px',
  fontSize: '0.8rem',
  background: 'rgba(239, 68, 68, 0.1)',
  borderColor: 'rgba(239, 68, 68, 0.3)',
  color: '#ef4444',
};

const emptyState = {
  padding: 48,
  textAlign: 'center',
  color: 'rgba(0, 0, 0, 0.4)',
  fontSize: '0.9rem',
};

const labelStyle = {
  display: 'block',
  marginBottom: 8,
  fontSize: '0.85rem',
  color: 'rgba(0, 0, 0, 0.7)',
  fontWeight: 500,
};

const checkboxLabel = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: 500,
};

const permissionsBox = {
  border: '1px solid rgba(0, 0, 0, 0.12)',
  borderRadius: 2,
  padding: 16,
  background: '#f8f9fa',
};

const permissionsHeader = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginBottom: 16,
  paddingBottom: 12,
  borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
};

const permissionsTitle = {
  fontWeight: 500,
  fontSize: '0.9rem',
  color: '#1a1d29',
};

const permissionsGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: 12,
};

const permissionLabel = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  fontSize: '0.85rem',
  cursor: 'pointer',
};

const modalActions = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 12,
  marginTop: 8,
};
