import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { pacienteApi } from "../../services/pacienteApi";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Bell,
  User2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function PacienteDashboard() {
  const { usuario, email } = useAuth() || {};
  const [loading, setLoading] = useState(true);
  const [citas, setCitas] = useState([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data } = await pacienteApi.mine();
        setCitas(data?.data || []);
      } catch (e) {
        setMsg(e.response?.data?.error || "No se pudieron cargar tus citas");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const proxima = useMemo(() => (citas[0] ? citas[0] : null), [citas]);

  return (
    <div style={wrap}>
      {/* HERO */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={hero}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img
            src="/images/logo-optica.png"
            width="34"
            height="34"
            style={{ borderRadius: 8, objectFit: "cover" }}
          />
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800 }}>
              ¡Hola{usuario ? `, ${usuario}` : ""}!
            </div>
            <small style={{ opacity: 0.85 }}>
              Tu espacio personal de la Clínica El Áncora
            </small>
          </div>
        </div>

        {proxima ? (
          <div style={chipNext}>
            <Clock size={16} />
            Próxima cita:&nbsp;
            <b>
              {fmtFecha(proxima.inicio)}
            </b>
          </div>
        ) : (
          <div style={chipNextMuted}>
            <CalendarDays size={16} />
            No tienes citas próximas
          </div>
        )}
      </motion.div>

      {/* GRID DE TARJETAS */}
      <div style={grid}>
        {/* MIS CITAS */}
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} style={card}>
          <h3 style={h3}><CalendarDays size={18} /> Mis Citas</h3>

          {loading ? (
            <div style={softNote}><Loader2 className="spin" size={16}/> Cargando…</div>
          ) : (
            <>
              {!citas.length && (
                <div style={softNote}>
                  <AlertCircle size={16} /> No tienes citas futuras.
                </div>
              )}

              <div style={{ display: "grid", gap: 10 }}>
                {citas.map((c) => (
                  <CitaItem key={c.id_cita} cita={c} />
                ))}
              </div>

              <a href="/citas" style={primaryLink}>
                Agendar una nueva cita <ArrowRight size={16}/>
              </a>
            </>
          )}

          {msg && <div style={err}><AlertCircle size={16}/> <small>{msg}</small></div>}
        </motion.div>

        {/* MIS DATOS */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={card}>
          <h3 style={h3}><User2 size={18}/> Mis Datos</h3>
          <div style={{ display:"grid", gap:10 }}>
            <Row label="Nombre de usuario" value={usuario || "—"} />
            <Row label="Correo" value={email || "—"} />
            <Row label="Paciente vinculado" value="Lo asignará el optometrista en tu cita" />
          </div>

          <div style={{ height: 10 }} />
          <a href="/perfil" style={ghostLink}>Editar perfil</a>
        </motion.div>

        {/* NOTIFICACIONES */}
        <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} style={card}>
          <h3 style={h3}><Bell size={18}/> Notificaciones</h3>

          {proxima ? (
            <div style={notif}>
              <Clock size={16}/>
              <div>
                <div style={{ fontWeight: 700 }}>Recordatorio de cita</div>
                <small>Te esperamos el {fmtFecha(proxima.inicio)}.</small>
              </div>
            </div>
          ) : (
            <div style={softNote}>
              <Bell size={16}/> No hay notificaciones nuevas.
            </div>
          )}

          <div style={{ height: 8 }} />
          <small style={{ opacity:.7 }}>
            Recibirás aquí confirmaciones, recordatorios y mensajes de la clínica.
          </small>
        </motion.div>
      </div>
    </div>
  );
}

/* ------------ Componentes chicos ------------ */

function Row({ label, value }) {
  return (
    <div style={{
      display:"grid",
      gridTemplateColumns:"160px 1fr",
      gap:12,
      alignItems:"center",
      padding:"10px 12px",
      border:"1px solid rgba(0,0,0,0.06)",
      borderRadius:12,
      background:"linear-gradient(180deg,#fff,#fafafa)"
    }}>
      <div style={{ opacity:.7, fontSize:13 }}>{label}</div>
      <div style={{ fontWeight:600 }}>{value}</div>
    </div>
  );
}

function CitaItem({ cita }) {
  const inicio = fmtFecha(cita.inicio);
  const tramo = cita.tramo === "AM" ? "10–12" : "14–16";
  const statusColor = {
    pendiente: "#ca8a04",
    confirmada: "#15803d",
    cancelada: "#991b1b",
    atendida: "#1e293b",
  }[cita.estado] || "#334155";

  return (
    <div style={citaItem}>
      <div>
        <div style={{ fontWeight: 700 }}>{inicio}</div>
        <small style={{ opacity: 0.75 }}>Tramo: {tramo}</small>
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <span style={{
          padding:"4px 8px",
          borderRadius:999,
          background:"rgba(0,0,0,0.05)",
          color: statusColor,
          fontSize:12,
          fontWeight:700
        }}>
          {cita.estado}
        </span>
      </div>
    </div>
  );
}

/* ------------ helpers & estilos ------------ */

function fmtFecha(dt) {
  try {
    return format(new Date(dt), "EEEE dd 'de' MMMM, HH:mm", { locale: es });
  } catch { return dt; }
}

const wrap = { maxWidth: 1200, margin:"0 auto", padding:"24px 20px" };

const hero = {
  display:"flex",
  alignItems:"center",
  justifyContent:"space-between",
  gap:16,
  padding:"18px 20px",
  borderRadius:16,
  background:"linear-gradient(135deg, rgba(14,165,233,0.10) 0%, rgba(6,182,212,0.15) 100%)",
  border:"1px solid rgba(0,0,0,0.06)",
  boxShadow:"0 12px 28px rgba(0,0,0,0.08)",
  marginBottom:18
};

const chipNext = {
  display:"inline-flex",
  alignItems:"center",
  gap:8,
  padding:"8px 12px",
  borderRadius:999,
  background:"#ecfeff",
  border:"1px solid #bae6fd",
  fontWeight:700
};
const chipNextMuted = {
  ...chipNext,
  background:"#f1f5f9",
  border:"1px solid #e2e8f0",
  fontWeight:600
};

const grid = {
  display:"grid",
  gridTemplateColumns:"repeat(12,1fr)",
  gap:20
};

const card = {
  gridColumn:"span 4",
  background:"#fff",
  border:"1px solid rgba(0,0,0,0.06)",
  borderRadius:18,
  padding:18,
  boxShadow:"0 12px 28px rgba(0,0,0,0.06)",
  minHeight:260
};

const h3 = {
  margin:"0 0 10px 0",
  display:"flex",
  alignItems:"center",
  gap:8,
  fontFamily:"var(--font-heading)"
};

const softNote = {
  padding:"12px 14px",
  borderRadius:12,
  background:"#f8fafc",
  border:"1px solid #e2e8f0",
  display:"inline-flex",
  alignItems:"center",
  gap:8
};

const notif = {
  display:"grid",
  gridTemplateColumns:"22px 1fr",
  gap:10,
  padding:"12px 14px",
  border:"1px solid rgba(0,0,0,0.06)",
  borderRadius:12,
  background:"linear-gradient(180deg,#fff,#fafafa)",
  boxShadow:"0 6px 16px rgba(0,0,0,0.04)"
};

const citaItem = {
  display:"flex",
  alignItems:"center",
  justifyContent:"space-between",
  padding:"12px 14px",
  borderRadius:14,
  border:"1px solid rgba(0,0,0,0.06)",
  background:"linear-gradient(180deg,#fff,#fafafa)"
};

const primaryLink = {
  display:"inline-flex",
  alignItems:"center",
  gap:8,
  marginTop:12,
  textDecoration:"none",
  background:"var(--color-azul-turquesa)",
  color:"#fff",
  borderRadius:12,
  padding:"10px 12px",
  fontWeight:700
};
const ghostLink = {
  display:"inline-block",
  marginTop:12,
  textDecoration:"none",
  padding:"8px 10px",
  borderRadius:10,
  border:"1px solid #e2e8f0",
  background:"#fff",
  color:"inherit",
  fontWeight:700
};

const err = { marginTop:10, display:"flex", alignItems:"center", gap:8, color:"#b91c1c" };
