import React, { useState, useEffect } from "react";

export default function Footer() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth <= 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsTablet(window.innerWidth <= 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <footer style={{ marginTop: 56, position: "relative", overflow: "hidden" }}>
      {/* --- Wave divider (SVG) --- */}
      <div aria-hidden style={{ lineHeight: 0 }}>
        <svg viewBox="0 0 1440 140" style={{ display: "block" }}>
          <path
            fill="rgba(37,99,235,0.08)"
            d="M0,96L80,101.3C160,107,320,117,480,101.3C640,85,800,43,960,37.3C1120,32,1280,64,1360,80L1440,96L1440,0L1360,0C1280,0,1120,0,960,0C800,0,640,0,480,0C320,0,160,0,80,0L0,0Z"
          />
        </svg>
      </div>

      {/* --- CTA Superior --- */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: isMobile ? "0 12px" : "0 20px",
          marginTop: -28,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr auto",
            gap: isMobile ? 12 : 16,
            alignItems: "center",
            padding: isMobile ? "12px 14px" : "16px 18px",
            borderRadius: 14,
            background:
              "linear-gradient(135deg, rgba(37,99,235,0.10) 0%, rgba(16,185,129,0.10) 100%)",
            border: "1px solid rgba(0,0,0,0.06)",
            boxShadow: "0 12px 26px rgba(0,0,0,0.08)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 12 }}>
            <img
              src="/images/logo-optica.png"
              alt="Clínica El Áncora"
              width={isMobile ? 28 : 32}
              height={isMobile ? 28 : 32}
              style={{ borderRadius: 8, objectFit: "cover" }}
            />
            <div>
              <div
                style={{
                  fontWeight: 700,
                  letterSpacing: 0.2,
                  fontFamily: "var(--font-heading)",
                  fontSize: isMobile ? "0.9rem" : "1rem",
                }}
              >
                ¿Necesitas una cita rápida?
              </div>
              <small style={{ opacity: 0.8, fontSize: isMobile ? "0.75rem" : "0.875rem" }}>
                Agenda en segundos: te atenderemos con gusto.
              </small>
            </div>
          </div>
          <a
            href="https://wa.me/50241445224"
            target="_blank"
            rel="noreferrer"
            style={{
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: isMobile ? "8px 12px" : "10px 14px",
              borderRadius: 999,
              color: "#fff",
              background:
                "linear-gradient(135deg, #22c55e 0%, #16a34a 45%, #0ea5e9 100%)",
              boxShadow: "0 8px 18px rgba(34,197,94,0.35)",
              fontWeight: 700,
              fontSize: isMobile ? "0.85rem" : "0.95rem",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "translateY(-1px)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform = "translateY(0)")
            }
          >
            <img src="/icons/whatsapp.svg" width={isMobile ? 16 : 18} height={isMobile ? 16 : 18} alt="" />
            {!isMobile && "Agendar por WhatsApp"}
            {isMobile && "WhatsApp"}
          </a>
        </div>
      </div>

      {/* --- Grid Principal --- */}
      <div
        style={{
          maxWidth: 1200,
          margin: "22px auto 0",
          padding: isMobile ? "0 12px 22px" : "0 20px 22px",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2, 1fr)" : "repeat(12, 1fr)",
          gap: isMobile ? 12 : 20,
        }}
      >
        {/* Col 1: Marca & About */}
        <div
          style={{
            gridColumn: isMobile ? "span 1" : isTablet ? "span 1" : "span 4",
            minWidth: 280,
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.06)",
            borderRadius: 16,
            padding: isMobile ? 16 : 20,
            boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img
              src="/images/logo-optica.png"
              alt="Clínica El Áncora"
              width="40"
              height="40"
              style={{ borderRadius: 10, objectFit: "cover" }}
            />
            <div>
              <div
                style={{
                  fontFamily: "var(--font-heading)",
                  fontWeight: 800,
                  letterSpacing: 0.2,
                  fontSize: isMobile ? "0.95rem" : "1rem",
                }}
              >
                Clínica El Áncora
              </div>
              <small style={{ opacity: 0.75, fontSize: isMobile ? "0.75rem" : "0.85rem" }}>
                Tecnología & cuidado visual
              </small>
            </div>
          </div>
          <p style={{ marginTop: 12, opacity: 0.9, fontSize: isMobile ? "0.85rem" : "0.95rem" }}>
            Exámenes de la vista, tratamientos y lentes hechos a tu medida. Un
            servicio humano apoyado por herramientas digitales.
          </p>

          {/* Solo correo (sin Facebook/Instagram) */}
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <a
              href="mailto:clinicaelancora@gmail.com"
              style={iconBtn}
              aria-label="Email"
              title="Email"
            >
              <img src="/icons/mail.svg" width="16" height="16" alt="" />
            </a>
          </div>
        </div>

        {/* Col 2: Dirección */}
        <FooterCard 
          title="Dirección" 
          colSpan={isMobile ? 1 : isTablet ? 1 : 4}
          isMobile={isMobile}
        >
          <Row
            icon="/icons/map-pin.svg"
            label="11 Calle 5-75, Zona 1"
            sub="Ciudad de Guatemala"
            isMobile={isMobile}
          />
        </FooterCard>

        {/* Col 3: Contacto */}
        <FooterCard 
          title="Contacto" 
          colSpan={isMobile ? 1 : isTablet ? 1 : 4}
          isMobile={isMobile}
        >
          <Row
            icon="/icons/whatsapp.svg"
            label="+502 4144-5224"
            link="https://wa.me/50241445224"
            isMobile={isMobile}
          />
          <Row 
            icon="/icons/phone.svg" 
            label="+502 2232-2721" 
            link="tel:+50222322721"
            isMobile={isMobile}
          />
          <Row
            icon="/icons/mail.svg"
            label="clinicaelancora@gmail.com"
            link="mailto:clinicaelancora@gmail.com"
            isMobile={isMobile}
          />
        </FooterCard>
      </div>

      {/* Divider suave */}
      <div
        style={{
          height: 1,
          maxWidth: 1200,
          margin: "8px auto 0",
          background:
            "linear-gradient(90deg, transparent 0, rgba(0,0,0,0.08) 30%, rgba(0,0,0,0.08) 70%, transparent 100%)",
        }}
      />

      {/* Bottom bar */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: isMobile ? "12px 12px 16px" : "12px 20px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <img
          src="/images/logo-optica.png"
          alt="Clínica El Áncora"
          width="18"
          height="18"
          style={{ borderRadius: 4, objectFit: "cover", opacity: 0.9 }}
        />
        <small style={{ opacity: 0.75, fontSize: isMobile ? "0.75rem" : "0.85rem" }}>
          © {new Date().getFullYear()} Clínica El Áncora. Todos los derechos
          reservados.
        </small>
      </div>
    </footer>
  );
}

/* ---------- Helpers ---------- */

function FooterCard({ title, children, colSpan = 4, isMobile }) {
  return (
    <div
      style={{
        gridColumn: `span ${colSpan}`,
        minWidth: 280,
        background: "#fff",
        border: "1px solid rgba(0,0,0,0.06)",
        borderRadius: 16,
        padding: isMobile ? 16 : 20,
        boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
      }}
    >
      <div
        style={{
          fontWeight: 800,
          letterSpacing: 0.3,
          marginBottom: 10,
          fontFamily: "var(--font-heading)",
          fontSize: isMobile ? "0.95rem" : "1rem",
        }}
      >
        {title}
      </div>
      <div style={{ display: "grid", gap: 10 }}>{children}</div>
    </div>
  );
}

function Row({ icon, label, sub, link, isMobile }) {
  const content = (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "28px 1fr",
        alignItems: "center",
        gap: 10,
        padding: isMobile ? "8px 10px" : "10px 12px",
        borderRadius: 12,
        border: "1px solid rgba(0,0,0,0.06)",
        background: "linear-gradient(180deg,#fff,rgba(250,250,250,0.6))",
        boxShadow: "0 6px 16px rgba(0,0,0,0.04)",
        transition: "transform 160ms ease, box-shadow 160ms ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = "0 10px 24px rgba(0,0,0,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.04)";
      }}
    >
      <img src={icon} width="22" height="22" alt="" style={{ opacity: 0.9 }} />
      <div>
        <div style={{ fontWeight: 600, fontSize: isMobile ? "0.85rem" : "0.95rem" }}>
          {label}
        </div>
        {sub && <small style={{ opacity: 0.75, fontSize: isMobile ? "0.7rem" : "0.8rem" }}>{sub}</small>}
      </div>
    </div>
  );

  return link ? (
    <a
      href={link}
      target={link.startsWith("http") ? "_blank" : undefined}
      rel={link.startsWith("http") ? "noreferrer" : undefined}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      {content}
    </a>
  ) : (
    content
  );
}

const iconBtn = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 36,
  height: 36,
  borderRadius: 12,
  background: "#fff",
  border: "1px solid rgba(0,0,0,0.06)",
  boxShadow: "0 6px 16px rgba(0,0,0,0.06)",
};
