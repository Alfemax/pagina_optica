import React, { useEffect, useMemo, useState } from 'react';
import Modal from '../../components/Modal';
import { rolesApi } from '../../services/adminApi';

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
    <>
      <h2 style={{ fontFamily:'var(--font-heading)' }}>Gestión de roles</h2>

      <div style={{ display:'flex', gap:8, margin:'12px 0' }}>
        <input placeholder="Buscar por nombre/descr." value={q} onChange={e=>setQ(e.target.value)} />
        <button className="btn" onClick={load} disabled={loading}>{loading?'Cargando…':'Buscar'}</button>
        <div style={{ flex:1 }} />
        <button className="btn" onClick={openCreate}>+ Nuevo rol</button>
      </div>

      {/* Lista */}
      <div style={{ border:'1px solid var(--color-gris-claro)', borderRadius:12, overflow:'hidden' }}>
        <div style={{ display:'grid', gridTemplateColumns:'80px 1.2fr 2fr 100px 220px', padding:'10px 12px', background:'#fafafa', fontWeight:700 }}>
          <div>ID</div><div>Nombre</div><div>Descripción</div><div>Activo</div><div style={{ textAlign:'right' }}>Acciones</div>
        </div>
        {rows.map(r => (
          <div key={r.id_rol} style={{ display:'grid', gridTemplateColumns:'80px 1.2fr 2fr 100px 220px', padding:'10px 12px', borderTop:'1px solid #eee' }}>
            <div>{r.id_rol}</div>
            <div>{r.nombre}</div>
            <div style={{ opacity:.85 }}>{r.descripcion || '—'}</div>
            <div>{r.activo ? 'Sí' : 'No'}</div>
            <div style={{ textAlign:'right', display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button className="btn" onClick={()=>openEdit(r)}>Editar</button>
              {r.id_rol !== 1 && (
                <button className="btn" style={{ background:'#e74c3c', color:'#fff' }} onClick={()=>remove(r.id_rol)}>Eliminar</button>
              )}
            </div>
          </div>
        ))}
        {rows.length === 0 && <div style={{ padding:14, opacity:.7 }}>Sin resultados</div>}
      </div>

      {/* Modal Crear/Editar */}
      <Modal open={open} onClose={()=>setOpen(false)} title={editing ? `Editar rol #${form.id_rol}` : 'Nuevo rol'}
        footer={msg && <small style={{ color:'#e74c3c' }}>{msg}</small>}
      >
        <form onSubmit={submit} style={{ display:'grid', gap:12 }}>
          {!editing && (
            <input type="number" min={1} max={255} placeholder="ID del rol (ej. 4)" value={form.id_rol} onChange={e=>setForm(f=>({...f, id_rol:e.target.value}))} required />
          )}
          <input placeholder="Nombre" value={form.nombre} onChange={e=>setForm(f=>({...f, nombre:e.target.value}))} required />
          <input placeholder="Descripción" value={form.descripcion} onChange={e=>setForm(f=>({...f, descripcion:e.target.value}))} />
          <label style={{ display:'flex', alignItems:'center', gap:8 }}>
            <input type="checkbox" checked={!!form.activo} onChange={e=>setForm(f=>({...f, activo:e.target.checked}))} /> Activo
          </label>

          {/* Matriz de permisos */}
          <div style={{ border:'1px solid var(--color-gris-claro)', borderRadius:12, padding:12 }}>
            <b style={{ display:'block', marginBottom:8 }}>Permisos</b>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:8 }}>
              {perms.map(p => (
                <label key={p} style={{ display:'flex', alignItems:'center', gap:8 }}>
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

          <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
            <button type="button" className="btn" onClick={()=>setOpen(false)}>Cancelar</button>
            <button className="btn" type="submit">{editing ? 'Guardar' : 'Crear'}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function human(code='') {
  // convierte "users.read" -> "Users · Read"
  return code.split('.').map(s => s.charAt(0).toUpperCase()+s.slice(1)).join(' · ');
}
