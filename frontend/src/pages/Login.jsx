import React, { useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate, Link } from "react-router-dom";
import ForgotPasswordModal from "../components/ForgotPasswordModal.jsx";
import { motion } from "framer-motion";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      const { data } = await api.post("/auth/login", { correo: email, password });
      login({ token: data.token, usuario: data.usuario, rol: data.rol });
      if (data.rol === 1) navigate("/admin/usuarios");
      else if (data.rol === 2) navigate("/optometrista/agenda");
      else navigate("/");
    } catch (e) {
      setMsg(e.response?.data?.error || "Error al iniciar sesión");
    }
  };

  return (
    <>
      {/* estilos locales de la pantalla (gradientes/animaciones) */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px) }
          50% { transform: translateY(-10px) }
          100% { transform: translateY(0px) }
        }
        .blurball {
          position:absolute; filter: blur(80px); opacity:.55; animation: float 8s ease-in-out infinite;
        }
        .blurball:nth-child(1){ width:380px; height:380px; background:#22d3ee; top:-60px; left:-60px; }
        .blurball:nth-child(2){ width:300px; height:300px; background:#f59e0b; bottom:-40px; right:10%; animation-delay:1s; }
        .blurball:nth-child(3){ width:240px; height:240px; background:#7c3aed; top:30%; right:-60px; animation-delay:.5s; }
        .glass {
          background: linear-gradient(180deg, rgba(255,255,255,.72), rgba(255,255,255,.58));
          backdrop-filter: blur(10px);
          box-shadow: 0 20px 60px rgba(0,0,0,.15);
          border: 1px solid rgba(255,255,255,.5);
        }
        .field {
          width:100%; padding:12px 14px; border-radius:10px; border:1px solid #e5e7eb;
          outline:none; transition: box-shadow .2s, border-color .2s; background:#fff;
        }
        .field:focus { border-color:#22d3ee; box-shadow: 0 0 0 4px rgba(34,211,238,.15); }
        .btn-primary {
          display:inline-flex; align-items:center; justify-content:center;
          padding:12px 14px; border-radius:12px; border:none; cursor:pointer;
          background: linear-gradient(90deg, #06b6d4, #22d3ee);
          color:#fff; font-weight:600; letter-spacing:.2px;
          box-shadow: 0 8px 22px rgba(6,182,212,.35);
          transition: transform .08s ease, box-shadow .2s ease;
        }
        .btn-primary:hover { box-shadow: 0 10px 26px rgba(6,182,212,.45); }
        .btn-primary:active { transform: translateY(1px); }
        .link {
          color:#0ea5e9; text-decoration:none;
        }
        .link:hover { text-decoration:underline; }
      `}</style>

      <div
        style={{
          minHeight: "calc(100vh - 120px)", // deja espacio si Navbar/Footer existen
          display: "grid",
          placeItems: "center",
          background:
            "radial-gradient(1200px 600px at 10% 10%, #ecfeff 0%, transparent 60%), radial-gradient(1200px 600px at 90% 90%, #fef9c3 0%, transparent 60%), linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
          position: "relative",
          overflow: "hidden",
          padding: "24px 16px",
        }}
      >
        <div className="blurball" />
        <div className="blurball" />
        <div className="blurball" />

        <motion.div
          className="glass"
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          style={{
            width: "100%",
            maxWidth: 980,
            borderRadius: 20,
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Grid principal: banner + formulario */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.1fr 1fr",
              gap: 0,
            }}
          >
            {/* LADO IZQUIERDO (branding) */}
            <div
              style={{
                padding: 28,
                background:
                  "radial-gradient(800px 400px at -10% -10%, rgba(34,211,238,.35) 0%, transparent 50%), linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
                borderRight: "1px solid rgba(0,0,0,.06)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: 420,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img
                  src="/images/logo-optica.png"
                  alt="Clínica El Áncora"
                  width="42"
                  height="42"
                  style={{ borderRadius: 10, objectFit: "cover" }}
                />
                <div>
                  <h2 style={{ margin: 0, fontFamily: "var(--font-heading)" }}>
                    Clínica El Áncora
                  </h2>
                  <small style={{ opacity: 0.7 }}>
                    Plataforma de Gestión Optométrica
                  </small>
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <h3 style={{ margin: "0 0 6px 0", fontFamily: "var(--font-heading)" }}>
                  Bienvenido de nuevo
                </h3>
                <p style={{ margin: 0, opacity: 0.8 }}>
                  Inicia sesión para gestionar citas, pacientes y fichas médicas
                  de forma ágil y segura.
                </p>
              </div>

              <div
                style={{
                  marginTop: 16,
                  display: "grid",
                  gridTemplateColumns: "repeat(3,1fr)",
                  gap: 10,
                }}
              >
                {[
                  "Citas inteligentes",
                  "Fichas digitales",
                  "Reportes básicos",
                ].map((tag) => (
                  <div
                    key={tag}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #eef2f5",
                      padding: "8px 10px",
                      borderRadius: 12,
                      textAlign: "center",
                      fontSize: 12,
                      boxShadow: "0 6px 18px rgba(0,0,0,.05)",
                    }}
                  >
                    {tag}
                  </div>
                ))}
              </div>

              <small style={{ opacity: 0.6 }}>
                ¿No tienes cuenta?{" "}
                <Link className="link" to="/registro">
                  Regístrate
                </Link>
              </small>
            </div>

            {/* LADO DERECHO (formulario) */}
            <div style={{ padding: 28 }}>
              <form
                onSubmit={onSubmit}
                style={{
                  display: "grid",
                  gap: 14,
                  alignContent: "center",
                  minHeight: 420,
                }}
              >
                <div>
                  <label className="subtitle">Correo electrónico</label>
                  <input
                    className="field"
                    type="email"
                    placeholder="tucorreo@dominio.com"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="subtitle">Contraseña</label>
                  <input
                    className="field"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <div style={{ marginTop: 6 }}>
                    <button
                      type="button"
                      onClick={() => setForgotOpen(true)}
                      style={{
                        background: "transparent",
                        border: "none",
                        padding: 0,
                        color: "#0284c7",
                        cursor: "pointer",
                        fontSize: 13,
                      }}
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                </div>

                <button className="btn-primary" type="submit">
                  Iniciar sesión
                </button>

                {msg && (
                  <small
                    style={{
                      display: "block",
                      marginTop: 6,
                      color: "#b91c1c",
                      background: "#fee2e2",
                      border: "1px solid #fecaca",
                      padding: "8px 10px",
                      borderRadius: 10,
                    }}
                  >
                    {msg}
                  </small>
                )}

                <div
                  style={{
                    marginTop: 6,
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    fontSize: 12,
                    color: "#64748b",
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      background: "#10b981",
                      borderRadius: "50%",
                      display: "inline-block",
                    }}
                    aria-hidden
                  />
                  Conexión segura y cifrada
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </div>

      <ForgotPasswordModal open={forgotOpen} onClose={() => setForgotOpen(false)} />
    </>
  );
}
