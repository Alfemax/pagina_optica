import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { User2, Mail, Lock, CheckCircle2, ShieldCheck, TimerReset, Loader2 } from "lucide-react";

export default function Register() {
  const [step, setStep] = useState("form"); // form | code | done
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [countdown, setCountdown] = useState(5);
  const [code, setCode] = useState("");

  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const isStrongPassword = (pw) =>
    /^(?=.*\d)(?=.*[!@#$%^&*()_\-+=[\]{};:'"\\|,.<>/?`~]).{6,}$/.test(pw || "");

  useEffect(() => {
    if (step !== "done") return;
    const tick = setInterval(() => setCountdown((c) => c - 1), 1000);
    const to = setTimeout(() => window.location.reload(), 5000);
    return () => { clearInterval(tick); clearTimeout(to); };
  }, [step]);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submitRegister = async (e) => {
    e.preventDefault();
    setMsg("");
    if (!isStrongPassword(form.password)) {
      return setMsg("La contraseña debe tener mínimo 6 caracteres, incluir al menos 1 número y 1 carácter especial.");
    }
    if (form.password !== form.confirmPassword) {
      return setMsg("Las contraseñas no coinciden.");
    }
    try {
      setLoading(true);
      await api.post("/auth/register", {
        usuario: form.nombre,
        correo: form.email,
        password: form.password,
      });
      setStep("code");
      setMsg("Te enviamos un código a tu correo. Tienes 15 minutos para usarlo.");
    } catch (err) {
      setMsg(err.response?.data?.error || "No se pudo registrar.");
    } finally {
      setLoading(false);
    }
  };

  const submitVerify = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      setLoading(true);
      await api.post("/auth/verify", { correo: form.email, code });
      setStep("done");
      setMsg("✅ Verificación correcta. Ya puedes iniciar sesión. Esta página se recargará en 5 segundos…");
    } catch (err) {
      setMsg(err.response?.data?.error || "No se pudo verificar el código.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={wrap}>
      {/* Glow background */}
      <div style={gradientBlob} />
      <div style={gradientBlob2} />

      <motion.div
        style={card}
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <div style={brand}>
          <img
            src="/images/logo-optica.png"
            alt="Clínica El Áncora"
            style={{ width: 40, height: 40, borderRadius: 10, objectFit: "cover" }}
          />
          <div>
            <h2 style={{ margin: 0, fontFamily: "var(--font-heading)" }}>Crear cuenta</h2>
            <small style={{ opacity: 0.8 }}>Bienvenido(a) a Clínica El Áncora</small>
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <div style={progressBar}>
            <div
              style={{
                ...progressDot,
                background: step !== "form" ? "var(--color-azul-turquesa)" : "#9ca3af",
              }}
              title="Registro"
            />
            <div
              style={{
                ...progressConnector,
                background: step === "done" ? "var(--color-azul-turquesa)" : "#e5e7eb",
              }}
            />
            <div
              style={{
                ...progressDot,
                background: step === "code" || step === "done" ? "var(--color-azul-turquesa)" : "#9ca3af",
              }}
              title="Verificación"
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === "form" && (
            <motion.form
              key="form"
              onSubmit={submitRegister}
              style={formCol}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <Field
                icon={<User2 size={18} />}
                placeholder="Nombre completo"
                name="nombre"
                value={form.nombre}
                onChange={onChange}
                autoFocus
              />
              <Field
                icon={<Mail size={18} />}
                placeholder="Correo electrónico"
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
              />

              <Field
                icon={<Lock size={18} />}
                placeholder="Contraseña (min 6, 1 número y 1 especial)"
                name="password"
                type="password"
                value={form.password}
                onChange={onChange}
              />
              <Field
                icon={<Lock size={18} />}
                placeholder="Confirmar contraseña"
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={onChange}
              />

              <PasswordHints ok={isStrongPassword(form.password)} />

              <motion.button
                whileTap={{ scale: 0.98 }}
                className="btn"
                style={{ ...btnPrimary, display: "inline-flex", alignItems: "center", gap: 8 }}
                disabled={loading}
              >
                {loading && <Loader2 className="spin" size={16} />}
                Crear cuenta
              </motion.button>
            </motion.form>
          )}

          {step === "code" && (
            <motion.form
              key="code"
              onSubmit={submitVerify}
              style={formCol}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <ShieldCheck size={18} />
                <span className="subtitle">Verificación por correo</span>
              </div>
              <input
                placeholder="Código de verificación (6 dígitos)"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                style={inputBase}
              />
              <motion.button
                whileTap={{ scale: 0.98 }}
                className="btn"
                style={{ ...btnPrimary, display: "inline-flex", alignItems: "center", gap: 8 }}
                disabled={loading}
              >
                {loading && <Loader2 className="spin" size={16} />}
                Verificar
              </motion.button>

              <small style={{ display: "flex", alignItems: "center", gap: 6, opacity: 0.8 }}>
                <TimerReset size={14} /> El código expira en 15 minutos.
              </small>
            </motion.form>
          )}

          {step === "done" && (
            <motion.div
              key="done"
              style={{ textAlign: "center", paddingTop: 8, paddingBottom: 6 }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <CheckCircle2 size={42} color="var(--color-azul-turquesa)" />
              <h3 style={{ marginBottom: 6 }}>¡Cuenta verificada!</h3>
              <p style={{ marginTop: 0 }}>{msg}</p>
              <small>Recargando en {countdown}…</small>
            </motion.div>
          )}
        </AnimatePresence>

        {msg && step !== "done" && (
          <div style={{ marginTop: 12, fontSize: 13, opacity: 0.9 }}>{msg}</div>
        )}
      </motion.div>
    </div>
  );
}

/* ---------- UI bits ---------- */

function Field({ icon, ...rest }) {
  return (
    <div style={fieldWrap}>
      <div style={fieldIcon}>{icon}</div>
      <input {...rest} style={inputBase} />
    </div>
  );
}

function PasswordHints({ ok }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, marginTop: -4 }}>
      <span style={{ opacity: 0.8 }}>Seguridad:</span>
      <span style={{ padding: "2px 8px", borderRadius: 999, background: ok ? "#e8f7ee" : "#fbebeb", color: ok ? "#18794E" : "#B61E1E" }}>
        {ok ? "Fuerte" : "Débil"}
      </span>
    </div>
  );
}

/* ---------- Styles ---------- */

const wrap = {
  minHeight: "60vh",
  padding: "40px 20px",
  display: "grid",
  placeItems: "center",
  position: "relative",
  overflow: "hidden",
};

const gradientBlob = {
  position: "absolute",
  width: 600,
  height: 600,
  borderRadius: "50%",
  filter: "blur(60px)",
  background: "radial-gradient(closest-side, rgba(0,199,220,.35), transparent)",
  top: -120,
  right: -120,
  pointerEvents: "none",
};

const gradientBlob2 = {
  position: "absolute",
  width: 520,
  height: 520,
  borderRadius: "50%",
  filter: "blur(60px)",
  background: "radial-gradient(closest-side, rgba(255,199,0,.28), transparent)",
  bottom: -140,
  left: -140,
  pointerEvents: "none",
};

const card = {
  width: "100%",
  maxWidth: 520,
  background: "rgba(255,255,255,.7)",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(0,0,0,.06)",
  borderRadius: 16,
  padding: 18,
  boxShadow: "0 30px 80px rgba(0,0,0,.12)",
};

const brand = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const progressBar = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const progressDot = {
  width: 12,
  height: 12,
  borderRadius: 999,
  transition: "background .2s ease",
};

const progressConnector = {
  height: 2,
  width: 40,
  borderRadius: 2,
  background: "#e5e7eb",
};

const formCol = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  marginTop: 16,
};

const fieldWrap = {
  position: "relative",
  display: "flex",
  alignItems: "center",
};

const fieldIcon = {
  position: "absolute",
  left: 10,
  display: "grid",
  placeItems: "center",
  width: 28,
  height: 28,
  borderRadius: 8,
  background: "linear-gradient(135deg, rgba(0,199,220,.18), rgba(255,199,0,.18))",
  border: "1px solid rgba(0,0,0,.06)",
};

const inputBase = {
  width: "100%",
  padding: "12px 12px 12px 48px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  outline: "none",
  fontFamily: "var(--font-subtitle)",
  transition: "border-color .2s ease, box-shadow .2s ease",
};

const btnPrimary = {
  border: "none",
  borderRadius: 12,
  padding: "12px 14px",
  background: "linear-gradient(135deg, var(--color-azul-turquesa), #0ea5e9)",
  color: "#fff",
  cursor: "pointer",
};

/* pequeñito spinner (usa className="spin") */
const style = document.createElement("style");
style.innerHTML = `.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}} input:focus{box-shadow:0 0 0 4px rgba(14,165,233,.15);border-color:#93c5fd}`;
document.head.appendChild(style);
