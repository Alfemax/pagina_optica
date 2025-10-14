import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function Home() {
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
    <main>
      {/* HERO */}
      <section
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: isMobile ? "20px 12px" : "40px 20px",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1.2fr",
          gap: isMobile ? 16 : 24,
          alignItems: "center",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: isMobile ? "1.3rem" : "2.2rem",
              margin: 0,
            }}
          >
            Bienvenido
          </h1>
          <p style={{ marginTop: 6 }}>A nuestra óptica</p>
          <div style={{ marginTop: 14 }}>
            <Link className="btn" to="/citas">
              Agendar Cita
            </Link>
          </div>
        </div>

        {/* Imagen del hero */}
        <img
          src="/images/hero-clinica.jpg"
          alt="Clínica El Áncora"
          style={{
            width: "100%",
            height: isMobile ? 180 : 280,
            objectFit: "cover",
            borderRadius: 12,
            border: "2px solid var(--color-gris-claro)",
          }}
        />
      </section>

      {/* ACCESOS RÁPIDOS */}
      <section
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: isMobile ? "10px 12px 25px" : "10px 20px 36px",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
          gap: isMobile ? 10 : isTablet ? 12 : 16,
        }}
      >
        {[
          { titulo: "Servicios", img: "/images/servicios.jpg", to: "/servicios" },
          { titulo: "Agendar Cita", img: "/images/agendar.jpg", to: "/citas" },
          {
            titulo: "¿Quiénes Somos?",
            img: "/images/quienes.jpg",
            to: "/quienes-somos",
          },
          { titulo: "Contáctanos", img: "/images/contacto.jpg", to: "/contacto" },
        ].map(({ titulo, img, to }) => (
          <Link
            key={titulo}
            to={to}
            className="card-zoom"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <img
              className="card-img"
              src={img}
              alt={titulo}
              style={{
                width: "100%",
                height: isMobile ? 120 : isTablet ? 120 : 140,
                objectFit: "cover",
                borderRadius: 12,
                transition: "transform 0.3s ease",
              }}
              onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
              onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
            />
            <div
              style={{
                marginTop: 8,
                padding: isMobile ? "6px 8px" : "8px 10px",
                background: "var(--color-blanco)",
                border: "1px solid var(--color-gris-claro)",
                borderRadius: 8,
                fontFamily: "var(--font-subtitle)",
                textAlign: "center",
                fontSize: isMobile ? "0.85rem" : "1rem",
              }}
            >
              {titulo}
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
