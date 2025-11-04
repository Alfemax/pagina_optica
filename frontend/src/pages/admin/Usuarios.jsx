import React, { useEffect, useMemo, useState } from 'react';
import Modal from '../../components/Modal';
import { adminApi } from '../../services/adminApi';
import { Search, Plus, Edit2, Key, Trash2, ChevronLeft, ChevronRight, Users } from 'lucide-react';

const roles = [
  { id:1, label:'Administrador' },
  { id:2, label:'Optometrista' },
  { id:3, label:'Paciente' },
];

const strong = (pw='') => /^(?=.*\d)(?=.*[!@#$%^&*()_\-+=[\]{};:'"\\|,.<>/?`~]).{6,}$/.test(pw);

export default function Usuarios() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [rol, setRol] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [openForm, setOpenForm] = useState(false);
  const [openPass, setOpenPass] = useState(false);
  const [form, setForm] = useState({ id:null, usuario:'', correo:'', id_rol:3, activo:1, password:'' });
  const [pass, setPass] = useState({ id:null, password:'' });
  const [msg, setMsg] = useState('');

  const pages = Math.max(1, Math.ceil(total / pageSize));

  async function load(p = page) {
    setLoading(true);
    try {
      const { data } = await adminApi.usersList({ q, rol, page:p, pageSize });
      setRows(data.data || []);
      setTotal(data.total || 0);
      setPage(data.page || 1);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(1); }, []);
  const onSearch = () => load(1);

  const editing = useMemo(() => !!form.id, [form.id]);

  const openCreate = () => { setForm({ id:null, usuario:'', correo:'', id_rol:3, activo:1, password:'' }); setOpenForm(true); setMsg(''); };
  const openEdit = (u) => { setForm({ id:u.id_usuario, usuario:u.usuario, correo:u.correo, id_rol:u.id_rol, activo:u.activo, password:'' }); setOpenForm(true); setMsg(''); };
  const openChangePass = (u) => { setPass({ id:u.id_usuario, password:'' }); setOpenPass(true); setMsg(''); };

  async function submitForm(e) {
    e.preventDefault();
    try {
      if (editing) {
        const payload = { usuario:form.usuario, correo:form.correo, id_rol:form.id_rol, activo:!!form.activo };
        await adminApi.userUpdate(form.id, payload);
      } else {
        if (!strong(form.password)) return setMsg('La contraseña debe tener mínimo 6 caracteres, un número y un caracter especial.');
        await adminApi.userCreate({ usuario:form.usuario, correo:form.correo, password:form.password, id_rol:form.id_rol });
      }
      setOpenForm(false);
      await load();
    } catch (err) {
      setMsg(err.response?.data?.error || 'No se pudo guardar');
    }
  }

  async function submitPass(e) {
    e.preventDefault();
    try {
      if (!strong(pass.password)) return setMsg('Contraseña débil (min 6, un número y un caracter especial)');
      await adminApi.userChangePassword(pass.id, { password: pass.password });
      setOpenPass(false);
    } catch (err) {
      setMsg(err.response?.data?.error || 'No se pudo actualizar la contraseña');
    }
  }

  async function removeUser(id) {
    if (!confirm('¿Eliminar este usuario?')) return;
    try {
      await adminApi.userDelete(id);
      await load();
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo eliminar');
    }
  }

  const inputStyle = {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    padding: '10px 14px',
    color: '#ffffff',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  };

  const buttonStyle = {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    padding: '10px 18px',
    color: '#ffffff',
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
    boxShadow: '0 4px 12px rgba(0, 102, 204, 0.3)',
  };

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #0a0e1a 0%, #1a1d29 100%)',
      minHeight: '100vh',
      padding: '32px',
      color: '#ffffff',
    }}>
      <style>{`
        input:focus, select:focus {
          border-color: rgba(0, 102, 204, 0.6) !important;
          box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1) !important;
        }
        select {
          background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23ffffff' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 36px;
          appearance: none;
        }
        button:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: #0066cc;
        }
      `}</style>

      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 16, 
        marginBottom: 32,
        paddingBottom: 24,
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      }}>
        <div style={{
          width: 48,
          height: 48,
          background: 'linear-gradient(135deg, #0066cc 0%, #0052a3 100%)',
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Users size={24} />
        </div>
        <div>
          <h2 style={{ 
            margin: 0,
            fontSize: '1.75rem',
            fontWeight: 300,
            letterSpacing: '0.5px',
          }}>Gestión de usuarios</h2>
          <p style={{ 
            margin: '4px 0 0 0',
            fontSize: '0.85rem',
            color: 'rgba(255, 255, 255, 0.5)',
            fontWeight: 300,
          }}>
            {total} usuarios registrados
          </p>
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        gap: 12, 
        marginBottom: 24,
        flexWrap: 'wrap',
      }}>
        <div style={{ position: 'relative', flex: '1 1 300px' }}>
          <Search size={18} style={{ 
            position: 'absolute', 
            left: 14, 
            top: '50%', 
            transform: 'translateY(-50%)',
            color: 'rgba(255, 255, 255, 0.4)',
          }} />
          <input 
            placeholder="Buscar por nombre o correo" 
            value={q} 
            onChange={e=>setQ(e.target.value)}
            style={{
              ...inputStyle,
              paddingLeft: 44,
              width: '100%',
            }}
          />
        </div>
        
        <select 
          value={rol} 
          onChange={e=>setRol(e.target.value)}
          style={{
            ...inputStyle,
            minWidth: 180,
          }}
        >
          <option value="">Todos los roles</option>
          {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>

        <button 
          style={buttonStyle}
          onClick={onSearch} 
          disabled={loading}
          onMouseEnter={e => !loading && (e.target.style.background = 'rgba(255, 255, 255, 0.08)')}
          onMouseLeave={e => !loading && (e.target.style.background = 'rgba(255, 255, 255, 0.05)')}
        >
          {loading ? 'Cargando…' : 'Buscar'}
        </button>

        <div style={{ flex: 1 }} />

        <button 
          style={primaryButtonStyle}
          onClick={openCreate}
          onMouseEnter={e => e.target.style.transform = 'translateY(-1px)'}
          onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
        >
          <Plus size={18} />
          Nuevo usuario
        </button>
      </div>

      <div style={{ 
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 2,
        overflow: 'hidden',
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '80px 1.2fr 1.4fr 140px 100px 240px', 
          padding: '16px 20px',
          background: 'rgba(255, 255, 255, 0.03)',
          fontSize: '0.8rem',
          fontWeight: 500,
          color: 'rgba(255, 255, 255, 0.6)',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
        }}>
          <div>ID</div>
          <div>Nombre</div>
          <div>Correo</div>
          <div>Rol</div>
          <div>Estado</div>
          <div style={{textAlign:'right'}}>Acciones</div>
        </div>

        {rows.map(u => (
          <div 
            key={u.id_usuario} 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: '80px 1.2fr 1.4fr 140px 100px 240px', 
              padding: '16px 20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ 
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.5)',
            }}>#{u.id_usuario}</div>
            <div style={{ fontWeight: 500 }}>{u.usuario}</div>
            <div style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{u.correo}</div>
            <div>
              <span style={{
                padding: '4px 10px',
                borderRadius: 2,
                fontSize: '0.75rem',
                background: 'rgba(0, 102, 204, 0.15)',
                color: '#6ba3ff',
                fontWeight: 500,
              }}>
                {roles.find(r=>r.id===u.id_rol)?.label || u.id_rol}
              </span>
            </div>
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
                  background: u.activo ? '#10b981' : '#ef4444',
                }} />
                {u.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <div style={{ 
              textAlign: 'right', 
              display: 'flex', 
              gap: 8, 
              justifyContent: 'flex-end',
            }}>
              <button 
                style={{
                  ...buttonStyle,
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                }}
                onClick={()=>openEdit(u)}
                onMouseEnter={e => e.target.style.background = 'rgba(255, 255, 255, 0.08)'}
                onMouseLeave={e => e.target.style.background = 'rgba(255, 255, 255, 0.05)'}
              >
                <Edit2 size={14} />
              </button>
              <button 
                style={{
                  ...buttonStyle,
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                }}
                onClick={()=>openChangePass(u)}
                onMouseEnter={e => e.target.style.background = 'rgba(255, 255, 255, 0.08)'}
                onMouseLeave={e => e.target.style.background = 'rgba(255, 255, 255, 0.05)'}
              >
                <Key size={14} />
              </button>
              <button 
                style={{
                  ...buttonStyle,
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  background: 'rgba(239, 68, 68, 0.15)',
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                }}
                onClick={()=>removeUser(u.id_usuario)}
                onMouseEnter={e => {
                  e.target.style.background = 'rgba(239, 68, 68, 0.25)';
                  e.target.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                }}
                onMouseLeave={e => {
                  e.target.style.background = 'rgba(239, 68, 68, 0.15)';
                  e.target.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}

        {rows.length === 0 && (
          <div style={{ 
            padding: 48,
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.4)',
            fontSize: '0.9rem',
          }}>
            Sin resultados
          </div>
        )}
      </div>

      <div style={{ 
        display: 'flex', 
        gap: 12, 
        alignItems: 'center', 
        justifyContent: 'flex-end', 
        marginTop: 20,
      }}>
        <small style={{ 
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: '0.85rem',
          fontWeight: 300,
        }}>
          Página {page} de {pages}
        </small>
        <button 
          style={buttonStyle}
          disabled={page<=1} 
          onClick={()=>{ setPage(p=>p-1); load(page-1); }}
          onMouseEnter={e => page > 1 && (e.target.style.background = 'rgba(255, 255, 255, 0.08)')}
          onMouseLeave={e => page > 1 && (e.target.style.background = 'rgba(255, 255, 255, 0.05)')}
        >
          <ChevronLeft size={16} />
          Anterior
        </button>
        <button 
          style={buttonStyle}
          disabled={page>=pages} 
          onClick={()=>{ setPage(p=>p+1); load(page+1); }}
          onMouseEnter={e => page < pages && (e.target.style.background = 'rgba(255, 255, 255, 0.08)')}
          onMouseLeave={e => page < pages && (e.target.style.background = 'rgba(255, 255, 255, 0.05)')}
        >
          Siguiente
          <ChevronRight size={16} />
        </button>
      </div>

      <Modal 
        open={openForm} 
        onClose={()=>setOpenForm(false)} 
        title={editing ? 'Editar usuario' : 'Nuevo usuario'}
        footer={msg && <small style={{ color: '#ef4444', fontSize: '0.85rem' }}>{msg}</small>}
      >
        <form onSubmit={submitForm} style={{ display: 'grid', gap: 16 }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: 8,
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: 500,
            }}>
              Nombre
            </label>
            <input 
              placeholder="Nombre completo" 
              value={form.usuario} 
              onChange={e=>setForm(f=>({...f, usuario:e.target.value}))} 
              style={inputStyle}
              required 
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: 8,
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: 500,
            }}>
              Correo electrónico
            </label>
            <input 
              type="email" 
              placeholder="correo@ejemplo.com" 
              value={form.correo} 
              onChange={e=>setForm(f=>({...f, correo:e.target.value}))} 
              style={inputStyle}
              required 
            />
          </div>

          {!editing && (
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: 8,
                fontSize: '0.85rem',
                color: 'rgba(255, 255, 255, 0.7)',
                fontWeight: 500,
              }}>
                Contraseña
              </label>
              <input 
                type="password" 
                placeholder="Mínimo 6 caracteres, número y especial" 
                value={form.password} 
                onChange={e=>setForm(f=>({...f, password:e.target.value}))} 
                style={inputStyle}
                required 
              />
            </div>
          )}

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: 8,
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: 500,
            }}>
              Rol
            </label>
            <select 
              value={form.id_rol} 
              onChange={e=>setForm(f=>({...f, id_rol:parseInt(e.target.value,10)}))}
              style={inputStyle}
            >
              {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>

          {editing && (
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 10,
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}>
              <input 
                type="checkbox" 
                checked={!!form.activo} 
                onChange={e=>setForm(f=>({...f, activo:e.target.checked}))} 
              />
              Usuario activo
            </label>
          )}

          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: 12,
            marginTop: 8,
          }}>
            <button 
              type="button" 
              style={buttonStyle}
              onClick={()=>setOpenForm(false)}
              onMouseEnter={e => e.target.style.background = 'rgba(255, 255, 255, 0.08)'}
              onMouseLeave={e => e.target.style.background = 'rgba(255, 255, 255, 0.05)'}
            >
              Cancelar
            </button>
            <button 
              style={primaryButtonStyle}
              type="submit"
              onMouseEnter={e => e.target.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
            >
              {editing ? 'Guardar cambios' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal 
        open={openPass} 
        onClose={()=>setOpenPass(false)} 
        title="Cambiar contraseña"
        footer={msg && <small style={{ color: '#ef4444', fontSize: '0.85rem' }}>{msg}</small>}
      >
        <form onSubmit={submitPass} style={{ display: 'grid', gap: 16 }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: 8,
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: 500,
            }}>
              Nueva contraseña
            </label>
            <input 
              type="password" 
              placeholder="Mínimo 6 caracteres, número y especial" 
              value={pass.password} 
              onChange={e=>setPass(p=>({...p, password:e.target.value}))} 
              style={inputStyle}
              required 
            />
          </div>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: 12,
            marginTop: 8,
          }}>
            <button 
              type="button" 
              style={buttonStyle}
              onClick={()=>setOpenPass(false)}
              onMouseEnter={e => e.target.style.background = 'rgba(255, 255, 255, 0.08)'}
              onMouseLeave={e => e.target.style.background = 'rgba(255, 255, 255, 0.05)'}
            >
              Cancelar
            </button>
            <button 
              style={primaryButtonStyle}
              type="submit"
              onMouseEnter={e => e.target.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
            >
              Actualizar contraseña
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
