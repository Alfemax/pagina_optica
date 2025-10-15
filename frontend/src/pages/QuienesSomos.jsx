import React, { useState, useEffect } from "react";
import { Eye, HeartPulse, Sparkles } from "lucide-react";

export default function QuienesSomos() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <main style={{ fontFamily: "var(--font-body)", color: "#1f2937" }}>
      {/* === Hero Section === */}
      <section
        style={{
          background:
            "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 40%, #3b82f6 100%)",
          color: "white",
          padding: isMobile ? "40px 16px" : "60px 20px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: isMobile ? "1.8rem" : "2.5rem",
            marginBottom: 10,
          }}
        >
          Clínica El Áncora
        </h1>
        <p style={{ 
          maxWidth: 700, 
          margin: "0 auto", 
          fontSize: isMobile ? 15 : 18, 
          opacity: 0.9,
          lineHeight: 1.6,
        }}>
          Cuidamos tu visión con tecnología, experiencia y atención humana.
        </p>
      </section>

      {/* === Contenido Principal === */}
      <section
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          padding: isMobile ? "40px 16px" : "60px 20px",
          display: "grid",
          gap: isMobile ? 30 : 40,
        }}
      >
        {/* Introducción */}
        <div>
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: isMobile ? "1.4rem" : "1.8rem",
              marginBottom: isMobile ? 12 : 16,
              color: "#1e40af",
            }}
          >
            ¿Quiénes somos?
          </h2>
          <p style={{ fontSize: isMobile ? 14 : 16, lineHeight: 1.7 }}>
            En <b>Clínica El Áncora</b> somos un equipo comprometido con la
            <b> salud visual</b> y el bienestar integral de nuestros pacientes.
            Ofrecemos exámenes de la vista, tratamientos oculares y adaptación de
            lentes personalizados, integrando la tecnología óptica más avanzada
            con un servicio humano, cercano y profesional.
          </p>
          <p style={{ 
            fontSize: isMobile ? 14 : 16, 
            lineHeight: 1.7, 
            marginTop: isMobile ? 12 : 14 
          }}>
            Nuestra misión es cuidar tu visión y mejorar tu calidad de vida a través
            de diagnósticos precisos, productos de alta calidad y una experiencia
            médica confiable. Cada paciente es único, y nuestra atención también.
          </p>
        </div>

        {/* Misión, Visión, Valores */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(260px, 1fr))",
            gap: isMobile ? 16 : 20,
          }}
        >
          <Card
            icon={<Eye size={isMobile ? 24 : 28} color="#2563eb" />}
            title="Misión"
            text="Proporcionar soluciones visuales precisas y personalizadas,
                  garantizando la satisfacción y confianza de cada paciente."
            isMobile={isMobile}
          />
          <Card
            icon={<HeartPulse size={isMobile ? 24 : 28} color="#2563eb" />}
            title="Visión"
            text="Ser reconocidos como el centro óptico líder en innovación, 
                  calidad humana y excelencia en el cuidado visual en Guatemala."
            isMobile={isMobile}
          />
          <Card
            icon={<Sparkles size={isMobile ? 24 : 28} color="#2563eb" />}
            title="Valores"
            text="Compromiso, ética, innovación, respeto y calidez humana
                  son los pilares que guían cada atención y diagnóstico."
            isMobile={isMobile}
          />
        </div>

        {/* Tienda y Productos */}
        <div
          style={{
            background: "#f9fafb",
            padding: isMobile ? 20 : 30,
            borderRadius: isMobile ? 12 : 14,
            border: "1px solid #e5e7eb",
          }}
        >
          <h3
            style={{
              fontFamily: "var(--font-heading)",
              color: "#1e40af",
              marginBottom: 10,
              fontSize: isMobile ? "1.1rem" : "1.3rem",
            }}
          >
            Más que una clínica, un espacio para verte mejor
          </h3>
          <p style={{ fontSize: isMobile ? 14 : 16, lineHeight: 1.7 }}>
            También contamos con una selección exclusiva de{" "}
            <b>aros, lentes y relojes de calidad</b>, pensados para complementar
            tu estilo y necesidades. En cada detalle, buscamos que encuentres
            confianza, precisión y elegancia.
          </p>
        </div>
      </section>

      {/* === Cierre === */}
      <section
        style={{
          textAlign: "center",
          background: "#f3f4f6",
          padding: isMobile ? "35px 16px" : "50px 20px",
          borderTop: "1px solid #e5e7eb",
        }}
      >
        <p style={{ 
          maxWidth: 700, 
          margin: "0 auto", 
          fontSize: isMobile ? 14 : 16, 
          lineHeight: 1.6 
        }}>
          En <b>Clínica El Áncora</b> creemos que una buena visión transforma
          la manera en que ves el mundo.  
          <br />
          <span style={{ color: "#1e40af", fontWeight: 600 }}>
            Ven y experimenta la diferencia de ver con claridad y confianza.
          </span>
        </p>
      </section>
    </main>
  );
}

/* ====== Subcomponente Card ====== */
function Card({ icon, title, text, isMobile }) {
  return (
    <div
      className="card"
      style={{
        background: "white",
        borderRadius: isMobile ? 12 : 14,
        padding: isMobile ? 16 : 20,
        border: "1px solid #e5e7eb",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? 8 : 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {icon}
        <h4 style={{ 
          margin: 0, 
          fontSize: isMobile ? "1rem" : "1.1rem", 
          color: "#1e40af" 
        }}>
          {title}
        </h4>
      </div>
      <p style={{ 
        margin: 0, 
        fontSize: isMobile ? 13 : 15, 
        lineHeight: 1.6 
      }}>
        {text}
      </p>
    </div>
  );
}
