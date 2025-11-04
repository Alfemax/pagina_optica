import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { User2, Mail, Lock, CheckCircle2, ShieldCheck, TimerReset, Loader2, Eye, EyeOff } from "lucide-react";

export default function Register() {
  const [step, setStep] = useState("form");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [countdown, setCountdown] = useState(5);
  const [code, setCode] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    <div style={{
      ...wrap,
      minHeight: isMobile ? "calc(100vh - 120px)" : "60vh",
      padding: isMobile ? "20px 12px" : "40px 20px",
    }}>
      <div style={gradientBlob} />
      <div style={gradientBlob2} />

      <motion.div
        style={{
          ...card,
          maxWidth: isMobile ? "100%" : 520,
          padding: isMobile ? 16 : 18,
        }}
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <div style={{
          ...brand,
          gap: isMobile ? 8 : 12,
        }}>
          <img
            src="/images/logo-optica.png"
            alt="Clínica El Áncora"
            style={{ 
              width: isMobile ? 36 : 40, 
              height: isMobile ? 36 : 40, 
              borderRadius: 10, 
              objectFit: "cover" 
            }}
          />
          <div>
            <h2 style={{ 
              margin: 0, 
              fontFamily: "var(--font-heading)",
              fontSize: isMobile ? "1.1rem" : "1.3rem",
            }}>
              Crear cuenta
            </h2>
            <small style={{ opacity: 0.8, fontSize: isMobile ? "0.75rem" : "0.85rem" }}>
              Bienvenido(a) a Clínica El Áncora
            </small>
          </div>
        </div>

        <div style={{ marginTop: isMobile ? 12 : 18 }}>
          <div style={{
            ...progressBar,
            gap: isMobile ? 6 : 10,
          }}>
            <div
              style={{
                ...progressDot,
                width: isMobile ? 10 : 12,
                height: isMobile ? 10 : 12,
                background: step !== "form" ? "var(--color-azul-turquesa)" : "#9ca3af",
              }}
              title="Registro"
            />
            <div
              style={{
                ...progressConnector,
                width: isMobile ? 24 : 40,
                background: step === "done" ? "var(--color-azul-turquesa)" : "#e5e7eb",
              }}
            />
            <div
              style={{
                ...progressDot,
                width: isMobile ? 10 : 12,
                height: isMobile ? 10 : 12,
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
              style={{
                ...formCol,
                gap: isMobile ? 10 : 12,
                marginTop: isMobile ? 12 : 16,
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <Field
                icon={<User2 size={isMobile ? 16 : 18} />}
                placeholder="Nombre completo"
                name="nombre"
                value={form.nombre}
                onChange={onChange}
                autoFocus
                isMobile={isMobile}
              />
              <Field
                icon={<Mail size={isMobile ? 16 : 18} />}
                placeholder="Correo electrónico"
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                isMobile={isMobile}
              />

              <PasswordField
                icon={<Lock size={isMobile ? 16 : 18} />}
                placeholder="Contraseña (min 6, 1 número y 1 especial)"
                name="password"
                value={form.password}
                onChange={onChange}
                isMobile={isMobile}
                showPassword={showPassword}
                onToggle={() => setShowPassword(!showPassword)}
              />
              
              <PasswordField
                icon={<Lock size={isMobile ? 16 : 18} />}
                placeholder="Confirmar contraseña"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={onChange}
                isMobile={isMobile}
                showPassword={showConfirmPassword}
                onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
              />

              <PasswordHints ok={isStrongPassword(form.password)} isMobile={isMobile} />

              <motion.button
                whileTap={{ scale: 0.98 }}
                className="btn"
                style={{ 
                  ...btnPrimary, 
                  display: "inline-flex", 
                  alignItems: "center", 
                  gap: 8,
                  padding: isMobile ? "10px 12px" : "12px 14px",
                  fontSize: isMobile ? "0.9rem" : "0.95rem",
                }}
                disabled={loading}
              >
                {loading && <Loader2 className="spin" size={isMobile ? 14 : 16} />}
                Crear cuenta
              </motion.button>
            </motion.form>
          )}

          {step === "code" && (
            <motion.form
              key="code"
              onSubmit={submitVerify}
              style={{
                ...formCol,
                gap: isMobile ? 10 : 12,
                marginTop: isMobile ? 12 : 16,
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <ShieldCheck size={isMobile ? 16 : 18} />
                <span style={{ 
                  fontFamily: "var(--font-subtitle)",
                  fontWeight: 600,
                  fontSize: isMobile ? "0.9rem" : "0.95rem",
                }}>
                  Verificación por correo
                </span>
              </div>
              <input
                placeholder="Código de verificación (6 dígitos)"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                style={{
                  ...inputBase,
                  padding: isMobile ? "10px 12px" : "12px 12px 12px 48px",
                  fontSize: isMobile ? "0.9rem" : "0.95rem",
                }}
              />
              <motion.button
                whileTap={{ scale: 0.98 }}
                className="btn"
                style={{ 
                  ...btnPrimary, 
                  display: "inline-flex", 
                  alignItems: "center", 
                  gap: 8,
                  padding: isMobile ? "10px 12px" : "12px 14px",
                  fontSize: isMobile ? "0.9rem" : "0.95rem",
                }}
                disabled={loading}
              >
                {loading && <Loader2 className="spin" size={isMobile ? 14 : 16} />}
                Verificar
              </motion.button>

              <small style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 6, 
                opacity: 0.8,
                fontSize: isMobile ? "0.75rem" : "0.85rem",
              }}>
                <TimerReset size={isMobile ? 12 : 14} /> El código expira en 15 minutos.
              </small>
            </motion.form>
          )}

          {step === "done" && (
            <motion.div
              key="done"
              style={{ 
                textAlign: "center", 
                paddingTop: isMobile ? 6 : 8, 
                paddingBottom: isMobile ? 4 : 6 
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <CheckCircle2 size={isMobile ? 36 : 42} color="var(--color-azul-turquesa)" />
              <h3 style={{ 
                marginBottom: isMobile ? 4 : 6,
                fontSize: isMobile ? "1.1rem" : "1.3rem",
              }}>
                ¡Cuenta verificada!
              </h3>
              <p style={{ 
                marginTop: 0,
                fontSize: isMobile ? "0.85rem" : "0.95rem",
              }}>
                {msg}
              </p>
              <small style={{ fontSize: isMobile ? "0.75rem" : "0.85rem" }}>
                Recargando en {countdown}…
              </small>
            </motion.div>
          )}
        </AnimatePresence>

        {msg && step !== "done" && (
          <div style={{ 
            marginTop: 12, 
            fontSize: isMobile ? "0.8rem" : "0.85rem", 
            opacity: 0.9 
          }}>
            {msg}
          </div>
        )}
      </motion.div>
    </div>
  );
}

/* ---------- UI bits ---------- */

function Field({ icon, isMobile, ...rest }) {
  return (
    <div style={fieldWrap}>
      <div style={{
        ...fieldIcon,
        width: isMobile ? 24 : 28,
        height: isMobile ? 24 : 28,
      }}>
        {icon}
      </div>
      <input {...rest} style={{
        ...inputBase,
        padding: isMobile ? "10px 12px 10px 40px" : "12px 12px 12px 48px",
        fontSize: isMobile ? "0.9rem" : "0.95rem",
      }} />
    </div>
  );
}

function PasswordField({ icon, isMobile, showPassword, onToggle, ...rest }) {
  return (
    <div style={fieldWrap}>
      <div style={{
        ...fieldIcon,
        width: isMobile ? 24 : 28,
        height: isMobile ? 24 : 28,
      }}>
        {icon}
      </div>
      <input 
        {...rest} 
        type={showPassword ? "text" : "password"}
        style={{
          ...inputBase,
          padding: isMobile ? "10px 40px 10px 40px" : "12px 48px 12px 48px",
          fontSize: isMobile ? "0.9rem" : "0.95rem",
        }} 
      />
      <button
        type="button"
        onClick={onToggle}
        style={passwordToggle}
        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
      >
        {showPassword ? <EyeOff size={isMobile ? 16 : 18} /> : <Eye size={isMobile ? 16 : 18} />}
      </button>
    </div>
  );
}

function PasswordHints({ ok, isMobile }) {
  return (
    <div style={{ 
      display: "flex", 
      alignItems: "center", 
      gap: 8, 
      fontSize: isMobile ? "0.75rem" : "0.85rem", 
      marginTop: isMobile ? -2 : -4 
    }}>
      <span style={{ opacity: 0.8 }}>Seguridad:</span>
      <span style={{ 
        padding: "2px 8px", 
        borderRadius: 999, 
        background: ok ? "#e8f7ee" : "#fbebeb", 
        color: ok ? "#18794E" : "#B61E1E",
        fontSize: isMobile ? "0.7rem" : "0.75rem",
      }}>
        {ok ? "Fuerte" : "Débil"}
      </span>
    </div>
  );
}

/* ---------- Styles ---------- */

const wrap = {
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
  background: "rgba(255,255,255,.7)",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(0,0,0,.06)",
  borderRadius: 16,
  boxShadow: "0 30px 80px rgba(0,0,0,.12)",
};

const brand = {
  display: "flex",
  alignItems: "center",
};

const progressBar = {
  display: "flex",
  alignItems: "center",
};

const progressDot = {
  borderRadius: 999,
  transition: "background .2s ease",
};

const progressConnector = {
  height: 2,
  borderRadius: 2,
  transition: "background .2s ease",
};

const formCol = {
  display: "flex",
  flexDirection: "column",
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
  borderRadius: 8,
  background: "linear-gradient(135deg, rgba(0,199,220,.18), rgba(255,199,0,.18))",
  border: "1px solid rgba(0,0,0,.06)",
};

const passwordToggle = {
  position: "absolute",
  right: 12,
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: 4,
  display: "flex",
  alignItems: "center",
  color: "#64748b",
  transition: "color 0.2s",
};

const inputBase = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  outline: "none",
  fontFamily: "var(--font-subtitle)",
  transition: "border-color .2s ease, box-shadow .2s ease",
};

const btnPrimary = {
  border: "none",
  borderRadius: 12,
  background: "linear-gradient(135deg, var(--color-azul-turquesa), #0ea5e9)",
  color: "#fff",
  cursor: "pointer",
  width: "100%",
};

const style = document.createElement("style");
style.innerHTML = `.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}} input:focus{box-shadow:0 0 0 4px rgba(14,165,233,.15);border-color:#93c5fd} button[type="button"]:hover{color:#0ea5e9}`;
document.head.appendChild(style);
