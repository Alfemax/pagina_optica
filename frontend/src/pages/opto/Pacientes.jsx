// frontend/src/pages/opto/Pacientes.jsx
import React, { useEffect, useMemo, useState } from "react";
import Modal from "../../components/Modal";
import { optoApi } from "../../services/optoApi";
import {
  Search, Plus, Pencil, Trash2, Phone, Mail, UserRound, Download,
} from "lucide-react";

/* ===== util ===== */
const debounce = (fn, ms = 400) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};
const toCSV = (rows) => {
  if (!rows?.length) return "";
  const header = ["ID","Usuario","Nombres","Apellidos","DPI","Nacimiento","Correo","Teléfono","Dirección"];
  const body = rows.map(r => [
    r.id_paciente, r.usuario_nombre, r.nombres, r.apellidos, r.dpi || "",
    r.fecha_nacimiento || "", r.correo || "", r.telefono || "", r.direccion || ""
  ].map(v => `"${String(v).replaceAll('"','""')}"`).join(","));
  return [header.join(","), ...body].join("\n");
};
const download = (filename, text) => {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
};

/* ===== componente ===== */
export default function Pacientes() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // paginación client-side
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, page]);

  // modal + modo (create/edit)
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create"); // "create" | "edit"

  // form
  const [form, setForm] = useState({
    id_paciente: null,
    id_usuario: "",
    dpi: "",
    nombres: "",
    apellidos: "",
    fecha_nacimiento: "",
    telefono: "",
    direccion: "",
  });

  // candidatos (usuarios rol=3 sin paciente)
  const [candidatos, setCandidatos] = useState([]);
  const [loadingCands, setLoadingCands] = useState(false);
  const [candQ, setCandQ] = useState("");

  // cargar lista
  const loadList = async (query = "") => {
    setLoading(true);
    try {
      const { data } = await optoApi.pacientesList(query);
      setRows(data?.data || []);
      setPage(1);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { loadList(""); }, []);

  // búsqueda con debounce
  const debouncedSearch = useMemo(() => debounce(loadList, 450), []);
  useEffect(() => { debouncedSearch(q.trim()); }, [q]);

  // abrir modal crear
  const openNew = async () => {
    setMode("create");
    setForm({
      id_paciente: null,
      id_usuario: "",
      dpi: "",
      nombres: "",
      apellidos: "",
      fecha_nacimiento: "",
      telefono: "",
      direccion: "",
    });
    setOpen(true);
    await loadCandidates("");
  };

  // abrir modal editar
  const openEdit = async (id_paciente) => {
    setMode("edit");
    setOpen(true);
    // podemos editar sin recargar candidatos (no se usa)
    const { data } = await optoApi.pacienteGet(id_paciente);
    const r = data?.data || {};
    setForm({
      id_paciente: r.id_paciente,
      id_usuario: r.id_usuario, // no editable en UI
      dpi: r.dpi || "",
      nombres: r.nombres || "",
      apellidos: r.apellidos || "",
      fecha_nacimiento: r.fecha_nacimiento || "",
      telefono: r.telefono || "",
      direccion: r.direccion || "",
    });
  };

  // candidatos async
  const loadCandidates = async (text) => {
    setLoadingCands(true);
    try {
      const { data } = await optoApi.userCandidates(text);
      setCandidatos(data?.data || []);
    } finally {
      setLoadingCands(false);
    }
  };
  useEffect(() => {
    if (!open || mode !== "create") return;
    const t = setTimeout(() => loadCandidates(candQ.trim()), 350);
    return () => clearTimeout(t);
  }, [candQ, open, mode]);

  // crear / editar
  const onSubmit = async (e) => {
    e.preventDefault();
    if (mode === "create") {
      if (!form.id_usuario || !form.nombres || !form.apellidos) {
        alert("Selecciona un usuario y completa nombres/apellidos.");
        return;
      }
      await optoApi.pacienteCreate({
        id_usuario: form.id_usuario,
        dpi: form.dpi || null,
        nombres: form.nombres,
        apellidos: form.apellidos,
        fecha_nacimiento: form.fecha_nacimiento || null,
        telefono: form.telefono || null,
        direccion: form.direccion || null,
      });
    } else {
      await optoApi.pacienteUpdate(form.id_paciente, {
        dpi: form.dpi || null,
        nombres: form.nombres,
        apellidos: form.apellidos,
        fecha_nacimiento: form.fecha_nacimiento || null,
        correo: undefined, // no editable aquí
        telefono: form.telefono || null,
        direccion: form.direccion || null,
      });
    }
    setOpen(false);
    await loadList(q.trim());
  };

  // borrar
  const onDelete = async (row) => {
    if (!window.confirm(`¿Eliminar al paciente "${row.nombres} ${row.apellidos}"?`)) return;
    try {
      await optoApi.pacienteDelete(row.id_paciente);
      await loadList(q.trim());
    } catch (e) {
      alert(e?.response?.data?.error || "No se pudo eliminar");
    }
  };

  // KPIs
  const kpis = useMemo(() => {
    const total = rows.length;
    const conTel = rows.filter(r => r.telefono).length;
    const conDpi = rows.filter(r => r.dpi).length;
    return { total, conTel, conDpi };
  }, [rows]);

  return (
    <div style={{ display:"grid", gap:14 }}>
      {/* Toolbar */}
      <div className="card" style={{ padding:14, borderRadius:14, display:"grid", gridTemplateColumns:"1fr auto auto", gap:12, alignItems:"center" }}>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <div style={{ position:"relative", flex:1 }}>
            <Search size={16} style={{ position:"absolute", left:10, top:10, opacity:.6 }} />
            <input
              className="input"
              style={{ paddingLeft:30, width:"100%" }}
              value={q}
              onChange={(e)=>setQ(e.target.value)}
              placeholder="Buscar por nombre, usuario, DPI, correo…"
            />
          </div>
          <button className="btn" onClick={()=>loadList(q.trim())}>Buscar</button>
          <button className="btn" onClick={openNew} style={{ display:"flex", gap:6, alignItems:"center" }}>
            <Plus size={16}/> Nuevo
          </button>
          <button className="btn" onClick={()=>download(`pacientes_${new Date().toISOString().slice(0,10)}.csv`, toCSV(rows))} title="Exportar CSV" style={{ display:"flex", gap:6, alignItems:"center" }}>
            <Download size={16}/> Exportar
          </button>
        </div>
        <div style={{ justifySelf:"end", fontSize:12, opacity:.7 }}>
          {loading ? "Cargando…" : `${rows.length} resultados`}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
        <KpiCard label="Pacientes" value={kpis.total} icon={<UserRound size={18}/>}/>
        <KpiCard label="Con teléfono" value={kpis.conTel} icon={<Phone size={18}/>}/>
        <KpiCard label="Con DPI" value={kpis.conDpi} icon={<Mail size={18}/>}/>
      </div>

      {/* Tabla */}
      <div className="card" style={{ borderRadius:14, padding:0, overflow:"hidden" }}>
        <div style={{ maxWidth:"100%", overflowX:"auto" }}>
          <table className="table" style={{ width:"100%", borderCollapse:"separate", borderSpacing:0 }}>
            <thead style={{ position:"sticky", top:0, background:"#fff", zIndex:1 }}>
              <tr>
                <Th>ID</Th>
                <Th>Usuario</Th>
                <Th>Nombre</Th>
                <Th>DPI</Th>
                <Th>Teléfono</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({length:5}).map((_,i)=>(
                <tr key={`sk${i}`}><Td colSpan={6}>
                  <div className="skeleton" style={{ height:14, width:"100%" }}/>
                </Td></tr>
              ))}
              {!loading && pageRows.map((r) => (
                <tr key={r.id_paciente} style={{ cursor:"pointer" }} onClick={() => openEdit(r.id_paciente)}>
                  <Td>{r.id_paciente}</Td>
                  <Td>{r.usuario_nombre}</Td>
                  <Td>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <Avatar name={`${r.nombres} ${r.apellidos}`} />
                      <div>
                        <div style={{ fontWeight:600 }}>{r.nombres} {r.apellidos}</div>
                        <div style={{ fontSize:12, opacity:.7 }}>{r.correo || "—"}</div>
                      </div>
                    </div>
                  </Td>
                  <Td>{r.dpi || "—"}</Td>
                  <Td>{r.telefono || "—"}</Td>
                  <Td onClick={(e)=>e.stopPropagation()} style={{ textAlign:"right" }}>
                    <button className="btn" style={{ padding:"6px 10px", marginRight:6 }} onClick={()=>openEdit(r.id_paciente)}>
                      <Pencil size={14}/> Editar
                    </button>
                    <button className="btn" style={{ padding:"6px 10px", background:"#fee2e2", color:"#b91c1c" }} onClick={()=>onDelete(r)}>
                      <Trash2 size={14}/> Eliminar
                    </button>
                  </Td>
                </tr>
              ))}
              {!loading && !rows.length && (
                <tr>
                  <Td colSpan={6}>
                    <div style={{ textAlign:"center", padding:20, opacity:.7 }}>
                      No hay pacientes que coincidan con la búsqueda.
                    </div>
                  </Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* paginación */}
        {!loading && rows.length > pageSize && (
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:12 }}>
            <div style={{ fontSize:12, opacity:.7 }}>
              Página {page} de {totalPages}
            </div>
            <div style={{ display:"flex", gap:6 }}>
              <button className="btn" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Anterior</button>
              <button className="btn" disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>Siguiente</button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL CREAR/EDITAR */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={mode === "create" ? "Nuevo Paciente" : "Editar Paciente"}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button className="btn" onClick={() => setOpen(false)} style={{ background: "#e7e7e7", color: "#333" }}>
              Cancelar
            </button>
            <button className="btn" onClick={onSubmit}>
              {mode === "create" ? "Guardar" : "Actualizar"}
            </button>
          </div>
        }
      >
        <form onSubmit={onSubmit} style={{ display:"grid", gap:12 }}>
          {mode === "create" ? (
            <>
              <label className="subtitle">Usuario (rol Paciente)</label>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 160px", gap:8 }}>
                <select
                  className="input"
                  value={form.id_usuario}
                  onChange={(e) => setForm({ ...form, id_usuario: Number(e.target.value) })}
                  required
                >
                  <option value="">— Seleccionar —</option>
                  {loadingCands ? (
                    <option>Cargando…</option>
                  ) : (
                    candidatos.map((u) => (
                      <option key={u.id_usuario} value={u.id_usuario}>
                        {u.usuario} — {u.correo}
                      </option>
                    ))
                  )}
                </select>
                <input
                  className="input"
                  placeholder="Filtrar usuarios…"
                  value={candQ}
                  onChange={(e)=>setCandQ(e.target.value)}
                />
              </div>
            </>
          ) : (
            <div className="hint" style={{ fontSize:12, opacity:.8 }}>
              Usuario asignado: <b>{form.id_usuario}</b> (no editable)
            </div>
          )}

          <Grid2>
            <Field label="Nombres" required>
              <input className="input" value={form.nombres}
                     onChange={(e)=>setForm({...form, nombres:e.target.value})} required />
            </Field>
            <Field label="Apellidos" required>
              <input className="input" value={form.apellidos}
                     onChange={(e)=>setForm({...form, apellidos:e.target.value})} required />
            </Field>
          </Grid2>

          <Field label="DPI">
            <input className="input" value={form.dpi}
                   onChange={(e)=>setForm({...form, dpi:e.target.value})} placeholder="Opcional" />
          </Field>

          <Grid2>
            <Field label="Fecha de nacimiento">
              <input type="date" className="input" value={form.fecha_nacimiento}
                     onChange={(e)=>setForm({...form, fecha_nacimiento:e.target.value})}/>
            </Field>
            <Field label="Teléfono">
              <input className="input" value={form.telefono}
                     onChange={(e)=>setForm({...form, telefono:e.target.value})} placeholder="Opcional" />
            </Field>
          </Grid2>

          <Field label="Dirección">
            <input className="input" value={form.direccion}
                   onChange={(e)=>setForm({...form, direccion:e.target.value})} placeholder="Opcional" />
          </Field>
        </form>
      </Modal>
    </div>
  );
}

/* ===== subcomponentes UI ===== */
function KpiCard({ label, value, icon }) {
  return (
    <div className="card" style={{ borderRadius:14, padding:14, display:"flex", gap:10, alignItems:"center" }}>
      <div style={{ width:34, height:34, borderRadius:10, display:"grid", placeItems:"center", background:"#f5f5f5" }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize:12, opacity:.7 }}>{label}</div>
        <div style={{ fontSize:22, fontWeight:700 }}>{value ?? "—"}</div>
      </div>
    </div>
  );
}
function Avatar({ name="" }) {
  const initials = name.split(" ").filter(Boolean).slice(0,2).map(s=>s[0]?.toUpperCase()).join("");
  return (
    <div style={{
      width:30, height:30, borderRadius:8, background:"#eef2ff",
      display:"grid", placeItems:"center", fontWeight:700, color:"#3730a3", fontSize:13
    }}>{initials || "?"}</div>
  );
}
function Th({ children }) {
  return <th style={{ padding:"12px 14px", borderBottom:"1px solid #eee", fontFamily:"var(--font-subtitle)" }}>{children}</th>;
}
function Td({ children, ...rest }) {
  return <td {...rest} style={{ padding:"10px 14px", borderBottom:"1px solid #f2f2f2" }}>{children}</td>;
}
function Grid2({ children }) {
  return <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>{children}</div>;
}
function Field({ label, required, children }) {
  return (
    <div>
      <label className="subtitle">{label}{required && " *"}</label>
      {children}
    </div>
  );
}
