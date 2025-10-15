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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth < 940);
  const location = useLocation();

  // responsive
  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth < 940);
    };
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
        padding: isMobile ? "16px 12px" : "24px 20px",
        display: "grid",
        gridTemplateColumns: isTablet || collapsed ? "1fr" : "240px 1fr",
        gap: isMobile ? 12 : 20,
      }}
    >
      {/* Toggle en mobile/tablet */}
      <div style={{ 
        display: isTablet ? "flex" : "none", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: 8,
      }}>
        <h3 style={{ 
          margin: 0, 
          fontFamily: "var(--font-heading)",
          fontSize: isMobile ? "1.1rem" : "1.3rem",
        }}>
          Optometrista
        </h3>
        <button
          className="btn"
          onClick={() => setCollapsed(c => !c)}
          aria-label={collapsed ? "Abrir menú" : "Cerrar menú"}
          style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            gap: 6, 
            padding: isMobile ? "6px 10px" : "8px 12px",
            fontSize: isMobile ? "0.85rem" : "0.95rem",
          }}
        >
          {collapsed ? <Menu size={isMobile ? 16 : 18} /> : <X size={isMobile ? 16 : 18} />}
          {collapsed ? "Menú" : "Cerrar"}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className="card"
        style={{
          position: isTablet ? "static" : "sticky",
          top: 16,
          height: isTablet ? "auto" : "calc(100vh - 32px)",
          borderRadius: isMobile ? 12 : 14,
          padding: isMobile ? 12 : 14,
          display: (isTablet && collapsed) ? "none" : "block",
          alignSelf: "start",
        }}
      >
        <div style={{ display: "grid", gap: isMobile ? 8 : 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 10 }}>
            <div
              style={{
                width: isMobile ? 32 : 36, 
                height: isMobile ? 32 : 36, 
                borderRadius: 10, 
                background: "#eef2ff",
                display: "grid", 
                placeItems: "center", 
                fontWeight: 800, 
                color: "#3730a3",
                fontSize: isMobile ? "0.8rem" : "0.95rem",
              }}
              title="Área del Optometrista"
            >
              OP
            </div>
            <div>
              <div style={{ 
                fontFamily: "var(--font-heading)", 
                fontSize: isMobile ? 14 : 16, 
                marginBottom: 2 
              }}>
                Optometrista
              </div>
              <div style={{ fontSize: isMobile ? 10 : 12, opacity: 0.7 }}>
                {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>

          <nav style={{ marginTop: isMobile ? 6 : 8 }}>
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} style={navLinkStyle}>
                {({ isActive }) => (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: isMobile ? 8 : 10,
                      padding: isMobile ? "8px 10px" : "10px 12px",
                      borderRadius: 10,
                      border: "1px solid var(--color-gris-claro)",
                      background: isActive ? "#f6f8ff" : "#fff",
                      color: "inherit",
                      textDecoration: "none",
                      fontFamily: "var(--font-subtitle)",
                      transition: "background .15s, border-color .15s",
                      fontSize: isMobile ? "0.85rem" : "0.95rem",
                    }}
                  >
                    <div
                      style={{
                        width: isMobile ? 24 : 26, 
                        height: isMobile ? 24 : 26, 
                        borderRadius: 8,
                        display: "grid", 
                        placeItems: "center",
                        background: isActive ? "#eef2ff" : "#f7f7f7",
                      }}
                    >
                      {React.cloneElement(item.icon, { size: isMobile ? 16 : 18 })}
                    </div>
                    <span style={{ flex: 1 }}>{item.label}</span>
                  </div>
                )}
              </NavLink>
            ))}
          </nav>

          <div style={{ 
            marginTop: "auto", 
            fontSize: isMobile ? 10 : 12, 
            opacity: 0.6, 
            textAlign: "center",
            paddingTop: 8,
          }}>
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
