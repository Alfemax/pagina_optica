import React, { useEffect, useMemo, useState } from 'react';
import Modal from '../../components/Modal';
import { adminApi } from '../../services/adminApi';

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

  // modales
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
  useEffect(() => { load(1); /* al entrar */ }, []);
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

  return (
    <>
      <h2 style={{ fontFamily:'var(--font-heading)' }}>Gestión de usuarios</h2>

      {/* Filtros */}
      <div style={{ display:'flex', gap:8, margin:'12px 0' }}>
        <input placeholder="Buscar por nombre o correo" value={q} onChange={e=>setQ(e.target.value)} />
        <select value={rol} onChange={e=>setRol(e.target.value)}>
          <option value="">Todos los roles</option>
          {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
        <button className="btn" onClick={onSearch} disabled={loading}>{loading?'Cargando…':'Buscar'}</button>
        <div style={{ flex:1 }} />
        <button className="btn" onClick={openCreate}>+ Nuevo usuario</button>
      </div>

      {/* Tabla simple */}
      <div style={{ border:'1px solid var(--color-gris-claro)', borderRadius:12, overflow:'hidden' }}>
        <div style={{ display:'grid', gridTemplateColumns:'60px 1.2fr 1.4fr 120px 120px 200px', padding:'10px 12px', background:'#fafafa', fontWeight:700 }}>
          <div>ID</div><div>Nombre</div><div>Correo</div><div>Rol</div><div>Estado</div><div style={{textAlign:'right'}}>Acciones</div>
        </div>
        {rows.map(u => (
          <div key={u.id_usuario} style={{ display:'grid', gridTemplateColumns:'60px 1.2fr 1.4fr 120px 120px 200px', padding:'10px 12px', borderTop:'1px solid #eee' }}>
            <div>{u.id_usuario}</div>
            <div>{u.usuario}</div>
            <div>{u.correo}</div>
            <div>{roles.find(r=>r.id===u.id_rol)?.label || u.id_rol}</div>
            <div>{u.activo ? 'Activo' : 'Inactivo'}</div>
            <div style={{ textAlign:'right', display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button className="btn" onClick={()=>openEdit(u)}>Editar</button>
              <button className="btn" onClick={()=>openChangePass(u)}>Contraseña</button>
              <button className="btn" onClick={()=>removeUser(u.id_usuario)} style={{ background:'#e74c3c', color:'#fff' }}>Eliminar</button>
            </div>
          </div>
        ))}
        {rows.length === 0 && <div style={{ padding:14, opacity:.7 }}>Sin resultados</div>}
      </div>

      {/* Paginación */}
      <div style={{ display:'flex', gap:8, alignItems:'center', justifyContent:'flex-end', marginTop:10 }}>
        <small style={{ opacity:.7 }}>Página {page} de {pages}</small>
        <button className="btn" disabled={page<=1} onClick={()=>{ setPage(p=>p-1); load(page-1); }}>Anterior</button>
        <button className="btn" disabled={page>=pages} onClick={()=>{ setPage(p=>p+1); load(page+1); }}>Siguiente</button>
      </div>

      {/* Modal Crear/Editar */}
      <Modal open={openForm} onClose={()=>setOpenForm(false)} title={editing ? 'Editar usuario' : 'Nuevo usuario'}
        footer={msg && <small style={{ color:'#e74c3c' }}>{msg}</small>}
      >
        <form onSubmit={submitForm} style={{ display:'grid', gap:10 }}>
          <input placeholder="Nombre" value={form.usuario} onChange={e=>setForm(f=>({...f, usuario:e.target.value}))} required />
          <input type="email" placeholder="Correo" value={form.correo} onChange={e=>setForm(f=>({...f, correo:e.target.value}))} required />
          {!editing && (
            <input type="password" placeholder="Contraseña (min 6, número y especial)" value={form.password} onChange={e=>setForm(f=>({...f, password:e.target.value}))} required />
          )}
          <select value={form.id_rol} onChange={e=>setForm(f=>({...f, id_rol:parseInt(e.target.value,10)}))}>
            {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
          {editing && (
            <label style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input type="checkbox" checked={!!form.activo} onChange={e=>setForm(f=>({...f, activo:e.target.checked}))} />
              Activo
            </label>
          )}
          <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
            <button type="button" className="btn" onClick={()=>setOpenForm(false)}>Cancelar</button>
            <button className="btn" type="submit">{editing ? 'Guardar' : 'Crear'}</button>
          </div>
        </form>
      </Modal>

      {/* Modal cambio de contraseña */}
      <Modal open={openPass} onClose={()=>setOpenPass(false)} title="Cambiar contraseña"
        footer={msg && <small style={{ color:'#e74c3c' }}>{msg}</small>}
      >
        <form onSubmit={submitPass} style={{ display:'grid', gap:10 }}>
          <input type="password" placeholder="Nueva contraseña (min 6, número y especial)" value={pass.password} onChange={e=>setPass(p=>({...p, password:e.target.value}))} required />
          <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
            <button type="button" className="btn" onClick={()=>setOpenPass(false)}>Cancelar</button>
            <button className="btn" type="submit">Actualizar</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
