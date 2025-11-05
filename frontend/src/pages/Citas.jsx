// frontend/src/pages/Citas.jsx
import React, { useEffect, useState } from "react";
import { DayPicker } from "react-day-picker";
import { es } from "date-fns/locale";
import { format, isBefore, isSunday, isAfter, addMonths } from "date-fns";
import { Link } from "react-router-dom";
import "react-day-picker/dist/style.css";
import { pacienteApi } from "../services/pacienteApi";
import { useAuth } from "../context/AuthContext.jsx";
import { Calendar, Clock, CheckCircle2, AlertCircle, Loader2, LogIn, UserPlus } from "lucide-react";
import { motion } from "framer-motion";

export default function Citas() {
  const { token } = useAuth();
  const [selected, setSelected] = useState(null);
  const [slots, setSlots] = useState([]);
  const [tramo, setTramo] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Reglas del calendario: no pasado, no domingos, solo 2 meses hacia delante
  const today = new Date();
  const disabled = (day) => {
    if (isBefore(day, new Date(today.getFullYear(), today.getMonth(), today.getDate()))) return true;
    if (isSunday(day)) return true;
    if (isAfter(day, addMonths(today, 2))) return true;
    return false;
  };

  // Cargar horarios al elegir día
  useEffect(() => {
    (async () => {
      setMsg("");
      setTramo("");
      setSlots([]);
      if (!selected) return;
      if (!token) return; // No cargar si no hay sesión
      try {
        setLoading(true);
        const date = format(selected, "yyyy-MM-dd");
        const { data } = await pacienteApi.slots(date);
        setSlots(data?.data || []);
        if (!data?.data?.length) setMsg("No hay horarios disponibles para este día.");
      } catch (e) {
        setMsg(e.response?.data?.error || "Error al consultar disponibilidad");
      } finally {
        setLoading(false);
      }
    })();
  }, [selected, token]);

  async function reservar() {
    setMsg("");
    if (!token) {
      setMsg("Debes iniciar sesión para reservar.");
      return;
    }
    if (!selected || !tramo) {
      setMsg("Selecciona un día y un horario.");
      return;
    }
    try {
      setLoading(true);
      const date = format(selected, "yyyy-MM-dd");
      await pacienteApi.book({ date, tramo });
      setMsg("✅ Cita reservada. Te contactaremos para confirmarla.");
      setSelected(null);
      setTramo("");
      setSlots([]);
    } catch (e) {
      setMsg(e.response?.data?.error || "No se pudo reservar");
    } finally {
      setLoading(false);
    }
  }

  // Guard: Si no hay sesión, mostrar mensaje de login
  if (!token) {
    return (
      <div style={{
        maxWidth: 600,
        margin: "0 auto",
        padding: isMobile ? "32px 16px" : "64px 20px",
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          style={{
            background: "linear-gradient(135deg, #0a0e1a 0%, #1a1d29 100%)",
            borderRadius: 2,
            padding: isMobile ? "32px 24px" : "48px 40px",
            textAlign: "center",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.3)",
            color: "#ffffff",
          }}
        >
          <div style={{
            width: 80,
            height: 80,
            margin: "0 auto 24px",
            background: "linear-gradient(135deg, #0066cc 0%, #0052a3 100%)",
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 10px 30px rgba(0, 102, 204, 0.4)",
          }}>
            <Calendar size={40} />
          </div>

          <h2 style={{
            margin: "0 0 12px 0",
            fontSize: isMobile ? "1.5rem" : "1.75rem",
            fontWeight: 300,
            letterSpacing: "0.5px",
          }}>
            Acceso Restringido
          </h2>

          <p style={{
            margin: "0 0 32px 0",
            fontSize: isMobile ? "0.9rem" : "1rem",
            color: "rgba(255, 255, 255, 0.7)",
            lineHeight: 1.6,
            fontWeight: 300,
          }}>
            Debes iniciar sesión para acceder al sistema de gestión de citas.
            <br />
            Si aún no tienes una cuenta, puedes registrarte de forma gratuita.
          </p>

          <div style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: 12,
            justifyContent: "center",
          }}>
            <Link
              to="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                padding: "14px 28px",
                background: "linear-gradient(135deg, #0066cc 0%, #0052a3 100%)",
                color: "#fff",
                textDecoration: "none",
                borderRadius: 2,
                fontWeight: 500,
                fontSize: isMobile ? "0.9rem" : "0.95rem",
                letterSpacing: "0.3px",
                boxShadow: "0 8px 20px rgba(0, 102, 204, 0.4)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={e => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 12px 28px rgba(0, 102, 204, 0.5)";
              }}
              onMouseLeave={e => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 8px 20px rgba(0, 102, 204, 0.4)";
              }}
            >
              <LogIn size={18} />
              Iniciar Sesión
            </Link>

            <Link
              to="/registro"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                padding: "14px 28px",
                background: "rgba(255, 255, 255, 0.05)",
                color: "#fff",
                textDecoration: "none",
                borderRadius: 2,
                fontWeight: 500,
                fontSize: isMobile ? "0.9rem" : "0.95rem",
                letterSpacing: "0.3px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={e => {
                e.target.style.background = "rgba(255, 255, 255, 0.08)";
                e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
              }}
              onMouseLeave={e => {
                e.target.style.background = "rgba(255, 255, 255, 0.05)";
                e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
              }}
            >
              <UserPlus size={18} />
              Registrarse
            </Link>
          </div>

          <div style={{
            marginTop: 32,
            paddingTop: 24,
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            fontSize: isMobile ? "0.8rem" : "0.85rem",
            color: "rgba(255, 255, 255, 0.5)",
            fontWeight: 300,
          }}>
            ¿Necesitas ayuda? Contáctanos en{" "}
            <a
              href="mailto:info@clinicaelancora.com"
              style={{
                color: "#0ea5e9",
                textDecoration: "none",
              }}
            >
              info@clinicaelancora.com
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  // Vista normal con sesión iniciada
  return (
    <div style={{
      maxWidth: 1200,
      margin: "0 auto",
      padding: isMobile ? "16px 12px" : "24px 20px",
    }}>
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{
          display: "grid",
          gap: isMobile ? 4 : 6,
          padding: isMobile ? "16px 18px" : "20px 22px",
          borderRadius: isMobile ? 14 : 16,
          background: "linear-gradient(135deg, rgba(14,165,233,0.1) 0%, rgba(6,182,212,0.15) 100%)",
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 12px 28px rgba(0,0,0,0.08)",
          marginBottom: isMobile ? 14 : 18,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 12 }}>
          <Calendar size={isMobile ? 22 : 26} color="#0ea5e9" />
          <h2 style={{ 
            margin: 0, 
            fontFamily: "var(--font-heading)",
            fontSize: isMobile ? "1.2rem" : "1.5rem",
          }}>
            Gestión de Citas
          </h2>
        </div>
        <p style={{ 
          margin: "6px 0 0", 
          opacity: 0.85,
          fontSize: isMobile ? "0.85rem" : "0.95rem",
          lineHeight: 1.5,
        }}>
          Elige tu día y horario. Domingos no disponibles. <br />
          <b>L–V:</b> 10–12 · 14–16 &nbsp; | &nbsp; <b>Sáb:</b> 10–12
        </p>
      </motion.div>

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", 
        gap: isMobile ? 16 : 24 
      }}>
        {/* Calendario */}
        <motion.div 
          initial={{ opacity: 0, x: -15 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.35 }} 
          style={{
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.06)",
            borderRadius: isMobile ? 14 : 18,
            padding: isMobile ? 16 : 20,
            boxShadow: "0 12px 28px rgba(0,0,0,0.06)",
            minHeight: isMobile ? "auto" : 360,
          }}
        >
          <DayPicker
            locale={es}
            mode="single"
            selected={selected}
            onSelect={setSelected}
            disabled={disabled}
            weekStartsOn={1}
            styles={{
              caption: { 
                color: "#0f172a", 
                fontWeight: 700,
                fontSize: isMobile ? "0.9rem" : "1rem",
              },
              day_selected: { background: "var(--color-azul-turquesa)", color: "#fff" },
              day_today: { border: "1px solid #0ea5e9" },
            }}
          />
        </motion.div>

        {/* Horarios */}
        <motion.div 
          initial={{ opacity: 0, x: 15 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.35 }} 
          style={{
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.06)",
            borderRadius: isMobile ? 14 : 18,
            padding: isMobile ? 16 : 20,
            boxShadow: "0 12px 28px rgba(0,0,0,0.06)",
            minHeight: isMobile ? "auto" : 360,
          }}
        >
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: isMobile ? 8 : 10, 
            marginBottom: 10 
          }}>
            <Clock size={isMobile ? 18 : 20} color="#0ea5e9" />
            <div style={{ 
              fontWeight: 700, 
              fontSize: isMobile ? 14 : 16 
            }}>
              Horario
            </div>
          </div>

          {!selected && (
            <div style={{
              padding: isMobile ? "10px 12px" : "12px 14px",
              borderRadius: 12,
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              fontSize: isMobile ? 13 : 14,
            }}>
              Selecciona primero un día en el calendario 📅
            </div>
          )}

          {selected && (
            <>
              {loading ? (
                <div style={{
                  padding: isMobile ? "10px 12px" : "12px 14px",
                  borderRadius: 12,
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  fontSize: isMobile ? 13 : 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}>
                  <Loader2 className="spin" size={16} /> Consultando disponibilidad…
                </div>
              ) : (
                <>
                  <div style={{ display: "grid", gap: isMobile ? 10 : 12 }}>
                    {slots.map((s) => (
                      <motion.label 
                        key={s.key} 
                        whileHover={{ scale: s.available ? 1.02 : 1 }} 
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 10,
                          padding: isMobile ? "12px 14px" : "14px 16px",
                          borderRadius: isMobile ? 12 : 14,
                          border: `1px solid ${tramo === s.key ? "#0ea5e9" : "rgba(0,0,0,0.06)"}`,
                          background: tramo === s.key ? "linear-gradient(180deg,#ecfeff,#e0f2fe)" : "linear-gradient(180deg,#fff,#fafafa)",
                          boxShadow: tramo === s.key ? "0 8px 20px rgba(14,165,233,0.15)" : "0 6px 16px rgba(0,0,0,0.04)",
                          fontSize: isMobile ? 13 : 14,
                          opacity: s.available ? 1 : 0.6,
                          cursor: s.available ? "pointer" : "not-allowed",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <input
                          type="radio"
                          name="slot"
                          value={s.key}
                          disabled={!s.available}
                          checked={tramo === s.key}
                          onChange={() => setTramo(s.key)}
                          style={{ display: "none" }}
                        />
                        <span style={{ fontWeight: 600 }}>{s.label}</span>
                        <small style={{ 
                          fontWeight: 500, 
                          color: s.available ? "#15803d" : "#b91c1c",
                          fontSize: isMobile ? 11 : 12,
                        }}>
                          {s.available ? "Disponible" : "Ocupado"}
                        </small>
                      </motion.label>
                    ))}
                    {!slots.length && (
                      <div style={{
                        padding: isMobile ? "10px 12px" : "12px 14px",
                        borderRadius: 12,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        background: "#fff7ed",
                        border: "1px solid #fed7aa",
                        fontSize: isMobile ? 13 : 14,
                      }}>
                        <AlertCircle size={16} /> No hay horarios para ese día.
                      </div>
                    )}
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    className="btn"
                    onClick={reservar}
                    disabled={!tramo || loading}
                    style={{ 
                      marginTop: isMobile ? 14 : 16, 
                      background: "var(--color-azul-turquesa)", 
                      color: "#fff", 
                      fontWeight: 700,
                      width: "100%",
                      padding: isMobile ? "10px 14px" : "12px 16px",
                      fontSize: isMobile ? "0.9rem" : "0.95rem",
                    }}
                  >
                    {loading ? "Reservando…" : "Reservar cita"}
                  </motion.button>
                </>
              )}
            </>
          )}

          {msg && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                marginTop: 12,
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: msg.startsWith("✅") ? "#15803d" : "#b91c1c",
                fontSize: isMobile ? "0.85rem" : "0.9rem",
              }}
            >
              {msg.startsWith("✅") ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <small>{msg}</small>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
