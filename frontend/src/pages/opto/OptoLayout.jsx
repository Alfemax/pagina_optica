// frontend/src/pages/opto/OptoLayout.jsx
import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  CalendarDays, ClipboardList, BarChart3, Users2, Menu, X,
} from "lucide-react";

const navItems = [
  { to: "/optometrista/agenda", label: "Agenda", icon: <CalendarDays size={18} /> },
  { to: "/optometrista/fichas", label: "Fichas Médicas", icon: <ClipboardList size={18} /> },
  { to: "/optometrista/crm", label: "CRM Básico", icon: <BarChart3 size={18} /> },
  { to: "/optometrista/pacientes", label: "Pacientes", icon: <Users2 size={18} /> },
];

export default function OptoLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  // responsive
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 940);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // cerrar panel en navegación (mobile)
  useEffect(() => {
    if (isMobile) setCollapsed(true);
  }, [location.pathname, isMobile]);

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "24px 20px",
        display: "grid",
        gridTemplateColumns: isMobile || collapsed ? "1fr" : "240px 1fr",
        gap: 20,
      }}
    >
      {/* Toggle en mobile */}
      <div style={{ display: isMobile ? "flex" : "none", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontFamily: "var(--font-heading)" }}>Optometrista</h3>
        <button
          className="btn"
          onClick={() => setCollapsed(c => !c)}
          aria-label={collapsed ? "Abrir menú" : "Cerrar menú"}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 10px" }}
        >
          {collapsed ? <Menu size={18} /> : <X size={18} />}
          {collapsed ? "Menú" : "Cerrar"}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className="card"
        style={{
          position: isMobile ? "static" : "sticky",
          top: 16,
          height: isMobile ? "auto" : "calc(100vh - 32px)",
          borderRadius: 14,
          padding: 14,
          display: (isMobile && collapsed) ? "none" : "block",
          alignSelf: "start",
        }}
      >
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36, height: 36, borderRadius: 10, background: "#eef2ff",
                display: "grid", placeItems: "center", fontWeight: 800, color: "#3730a3",
              }}
              title="Área del Optometrista"
            >
              OP
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: 16, marginBottom: 2 }}>
                Optometrista
              </div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>

          <nav style={{ marginTop: 8 }}>
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} style={navLinkStyle}>
                {({ isActive }) => (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid var(--color-gris-claro)",
                      background: isActive ? "#f6f8ff" : "#fff",
                      color: "inherit",
                      textDecoration: "none",
                      fontFamily: "var(--font-subtitle)",
                      transition: "background .15s, border-color .15s",
                    }}
                  >
                    <div
                      style={{
                        width: 26, height: 26, borderRadius: 8,
                        display: "grid", placeItems: "center",
                        background: isActive ? "#eef2ff" : "#f7f7f7",
                      }}
                    >
                      {item.icon}
                    </div>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {/* Badge opcional: ejemplo de contador estático (puedes conectar KPIs si quieres) */}
                    {/* <small style={{ background:"#eef2ff", color:"#3730a3", padding:"2px 6px", borderRadius:8, fontWeight:700 }}>3</small> */}
                  </div>
                )}
              </NavLink>
            ))}
          </nav>

          <div style={{ marginTop: "auto", fontSize: 12, opacity: 0.6, textAlign: "center" }}>
            v1.0 • Área interna
          </div>
        </div>
      </aside>

      {/* Contenido */}
      <section>
        <Outlet />
      </section>
    </div>
  );
}

/* ===== helpers ===== */
function navLinkStyle() {
  return { textDecoration: "none" };
}
