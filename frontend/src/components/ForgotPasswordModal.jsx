// src/components/ForgotPasswordModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

export default function ForgotPasswordModal({ open, onClose }) {
  const [step, setStep] = useState("email"); // email | code | done
  const [correo, setCorreo] = useState("");
  const [code, setCode] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [deadline, setDeadline] = useState(null); // Date.now() + 5min
  const [reloadCountdown, setReloadCountdown] = useState(5);
  const [sending, setSending] = useState(false);
  const [changing, setChanging] = useState(false);

  // re-render por segundo para el contador
  const [, force] = useState(0);
  useEffect(() => {
    if (!open) return;
    const t = setInterval(() => force((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [open]);

  // tiempo restante (segundos)
  const remaining = useMemo(() => {
    if (!deadline) return 0;
    return Math.max(0, Math.floor((deadline - Date.now()) / 1000));
  }, [deadline, force]);

  const remainingPct = useMemo(() => {
    if (!deadline) return 0;
    const total = 5 * 60;
    return Math.max(0, Math.min(100, (remaining / total) * 100));
  }, [remaining]);

  // resetear al cerrar
  useEffect(() => {
    if (!open) {
      setStep("email");
      setCorreo(""); setCode(""); setNewPass(""); setConfirm("");
      setMsg(""); setDeadline(null);
      setReloadCountdown(5);
      setSending(false); setChanging(false);
    }
  }, [open]);

  // autorecarga a los 5s al finalizar
  useEffect(() => {
    if (step !== "done") return;
    const t = setInterval(() => setReloadCountdown((c) => c - 1), 1000);
    const to = setTimeout(() => window.location.reload(), 5000);
    return () => { clearInterval(t); clearTimeout(to); };
  }, [step]);

  const strongPw = (pw) =>
    /^(?=.*\d)(?=.*[!@#$%^&*()_\-+=[\]{};:'"\\|,.<>/?`~]).{6,}$/.test(pw || "");

  const onSend = async (e) => {
    e.preventDefault();
    setMsg("");
    if (sending) return;
    try {
      setSending(true);
      await api.post("/auth/forgot", { correo });
      setStep("code");
      setDeadline(Date.now() + 5 * 60 * 1000);
      setMsg("Te enviamos un código. Tienes 5 minutos para usarlo.");
    } catch (err) {
      setMsg(err.response?.data?.error || "No se pudo enviar el código");
    } finally {
      setSending(false);
    }
  };

  const onReset = async (e) => {
    e.preventDefault();
    setMsg("");
    if (remaining <= 0) return setMsg("El código expiró. Solicita uno nuevo.");
    if (newPass !== confirm) return setMsg("Las contraseñas no coinciden.");
    if (!strongPw(newPass)) {
      return setMsg("La contraseña debe tener mínimo 6 caracteres, incluir al menos 1 número y 1 carácter especial.");
    }
    if (changing) return;
    try {
      setChanging(true);
      await api.post("/auth/reset", { correo, code, newPassword: newPass });
      setStep("done");
      setMsg("✅ Contraseña actualizada. Ya puedes iniciar sesión. Esta ventana se recargará en 5 segundos…");
    } catch (err) {
      setMsg(err.response?.data?.error || "No se pudo restablecer la contraseña");
    } finally {
      setChanging(false);
    }
  };

  if (!open) return null;

  return (
    <div style={backdrop} onMouseDown={onClose}>
      {/* Frame con borde degradado */}
      <div style={frame} onMouseDown={(e)=>e.stopPropagation()}>
        <div style={glass}>
          {/* Header */}
          <div style={header}>
            <div style={{display:'flex', alignItems:'center', gap:10}}>
              <div style={logoChip}>
                {/* candado svg */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M7 10V8a5 5 0 0 1 10 0v2" stroke="currentColor" strokeWidth="1.8" />
                  <rect x="5" y="10" width="14" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.8"/>
                  <circle cx="12" cy="15" r="1.6" fill="currentColor"/>
                </svg>
              </div>
              <h3 style={{ margin:0, fontFamily: 'var(--font-heading)'}}>Restablecer contraseña</h3>
            </div>
            <button onClick={onClose} style={closeBtn} aria-label="Cerrar">✕</button>
          </div>

          {/* Stepper */}
          <div style={stepper}>
            <StepDot active={step==='email'} label="Correo" />
            <div style={stepLine}/>
            <StepDot active={step==='code'} label="Código" />
            <div style={stepLine}/>
            <StepDot active={step==='done'} label="Listo" />
          </div>

          {/* Contenido */}
          <div style={{marginTop:14}}>
            {step === "email" && (
              <form onSubmit={onSend} style={formCol}>
                <label className="subtitle">Correo electrónico</label>
                <div style={inputWrap}>
                  <InlineIconMail/>
                  <input
                    type="email"
                    placeholder="tu@correo.com"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    required
                    style={input}
                  />
                </div>
                <button className="btn" disabled={sending} style={cta}>
                  {sending ? "Enviando…" : "Enviar código"}
                </button>
              </form>
            )}

            {step === "code" && (
              <>
                {/* Barra de tiempo visual */}
                <div style={{...timerWrap}}>
                  <div style={{...timerBar, width: `${remainingPct}%`}}/>
                </div>
                <div style={{ fontSize: 13, opacity: 0.8, marginTop: 6 }}>
                  Tiempo restante: <b>{fmt(remaining)}</b>
                </div>

                <form onSubmit={onReset} style={{...formCol, marginTop: 10}}>
                  <label className="subtitle">Código de verificación</label>
                  <div style={inputWrap}>
                    <InlineIconKey/>
                    <input
                      placeholder="6 dígitos"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g,''))}
                      maxLength={6}
                      required
                      style={input}
                    />
                  </div>

                  <label className="subtitle">Nueva contraseña</label>
                  <div style={inputWrap}>
                    <InlineIconLock/>
                    <input
                      type="password"
                      placeholder="Min 6, 1 número y 1 especial"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      required
                      style={input}
                    />
                  </div>

                  <label className="subtitle">Confirmar contraseña</label>
                  <div style={inputWrap}>
                    <InlineIconCheck/>
                    <input
                      type="password"
                      placeholder="Repite la contraseña"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      style={input}
                    />
                  </div>

                  <button className="btn" disabled={remaining <= 0 || changing} style={cta}>
                    {changing ? "Guardando…" : "Cambiar contraseña"}
                  </button>
                </form>
              </>
            )}

            {step === "done" && (
              <div style={{ marginTop: 12, textAlign:'center' }}>
                <div style={{fontSize:40, lineHeight:1}}>✅</div>
                <p style={{margin:'8px 0 4px'}}>{msg}</p>
                <small>Recargando en {reloadCountdown}…</small>
              </div>
            )}

            {msg && step !== "done" && (
              <small style={{ display: "block", marginTop: 12, color:'#0f172a' }}>{msg}</small>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Helpers UI ---------- */
function StepDot({ active, label }) {
  return (
    <div style={{display:'flex', alignItems:'center', gap:8}}>
      <div style={{
        width: 12, height: 12, borderRadius: 999,
        background: active ? 'linear-gradient(90deg,#22d3ee,#3b82f6)' : '#e5e7eb',
        boxShadow: active ? '0 0 0 6px rgba(59,130,246,0.14)' : 'none',
        transition: 'all .2s ease'
      }}/>
      <span style={{fontSize:12, opacity: active ? 1 : .6}}>{label}</span>
    </div>
  );
}

function InlineIconMail(){
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{opacity:.7}}>
      <path d="M4 6h16v12H4z" stroke="currentColor" strokeWidth="1.6" />
      <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.6" fill="none"/>
    </svg>
  );
}
function InlineIconKey(){
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{opacity:.7}}>
      <circle cx="7" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M10 12h10l-2 2 2 2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function InlineIconLock(){
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{opacity:.7}}>
      <path d="M7 10V8a5 5 0 0 1 10 0v2" stroke="currentColor" strokeWidth="1.6" />
      <rect x="5" y="10" width="14" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.6"/>
    </svg>
  );
}
function InlineIconCheck(){
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{opacity:.7}}>
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="1.8" fill="none"/>
    </svg>
  );
}

/* ---------- Utils ---------- */
function fmt(totalSec) {
  const m = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const s = String(totalSec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

/* ---------- Styles ---------- */
const backdrop = {
  position: "fixed",
  inset: 0,
  background: "linear-gradient(120deg, rgba(15,23,42,.84), rgba(2,6,23,.84))",
  backdropFilter: "blur(6px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  padding: 16
};

// Borde degradado
const frame = {
  width: "100%",
  maxWidth: 500,
  borderRadius: 16,
  padding: 1,
  background: "linear-gradient(120deg, #22d3ee, #3b82f6, #a78bfa)",
  boxShadow: "0 20px 60px rgba(0,0,0,.35)"
};

const glass = {
  background: "rgba(255,255,255,.08)",
  borderRadius: 15,
  padding: 18,
  backdropFilter: "blur(14px)",
  border: "1px solid rgba(255,255,255,.12)",
  color: "#0f172a"
};

const header = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between"
};

const logoChip = {
  width: 34, height: 34, borderRadius: 10,
  display:'grid', placeItems:'center',
  color:'#0ea5e9',
  background: "linear-gradient(180deg, rgba(255,255,255,.8), rgba(255,255,255,.55))",
  boxShadow: "inset 0 0 0 1px rgba(2,132,199,.25)"
};

const closeBtn = {
  border: "none",
  background: "transparent",
  fontSize: 18,
  cursor: "pointer",
  lineHeight: 1,
  color: "#0f172a",
  padding: 6,
  borderRadius: 8
};

const stepper = {
  display:'grid',
  gridTemplateColumns:'1fr auto 1fr auto 1fr',
  alignItems:'center',
  gap: 10,
  marginTop: 14
};
const stepLine = {
  height: 2,
  background: "linear-gradient(90deg,#22d3ee,#3b82f6)",
  opacity: .35
};

const formCol = { display: "flex", flexDirection: "column", gap: 12, marginTop: 14 };

const inputWrap = {
  display:'flex',
  alignItems:'center',
  gap:8,
  padding: '10px 12px',
  borderRadius: 12,
  background: 'rgba(255,255,255,.72)',
  boxShadow: 'inset 0 0 0 1px rgba(15,23,42,.08)'
};

const input = {
  border:'none',
  outline:'none',
  background:'transparent',
  width:'100%'
};

const cta = {
  background: "linear-gradient(90deg,#22d3ee,#3b82f6)",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  padding: "10px 12px",
  cursor: "pointer",
  boxShadow: "0 8px 24px rgba(59,130,246,.35)"
};

const timerWrap = {
  position:'relative',
  height: 8,
  borderRadius: 8,
  background: 'rgba(2,6,23,.15)',
  overflow:'hidden',
  marginTop: 6
};
const timerBar = {
  position:'absolute',
  left:0, top:0, bottom:0,
  background: 'linear-gradient(90deg,#22d3ee,#3b82f6)',
  transition: 'width .6s ease'
};
