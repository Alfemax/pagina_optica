import React, { useState, useEffect } from "react";
import { Eye, Glasses, Wrench, Ruler, Watch, ShieldCheck, Sparkles, Headphones, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Servicios() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const servicios = [
    {
      titulo: "Exámenes de la vista",
      desc: "Evaluación completa (agudeza, refracción, salud ocular) con informe claro y recomendaciones.",
      icon: <Eye size={isMobile ? 22 : 26} color="#1e40af" />,
      tag: "Clínico",
      color: "#dbeafe",
    },
    {
      titulo: "Tratamiento de los ojos",
      desc: "Atención para afecciones frecuentes y seguimiento personalizado.",
      icon: <Wrench size={isMobile ? 22 : 26} color="#1e40af" />,
      tag: "Clínico",
      color: "#dbeafe",
    },
    {
      titulo: "Venta de aros",
      desc: "Colección moderna y clásica con asesoría de estilo y ajuste.",
      icon: <Glasses size={isMobile ? 22 : 26} color="#059669" />,
      tag: "Tienda",
      color: "#d1fae5",
    },
    {
      titulo: "Lentes a la medida",
      desc: "Fabricación según tu graduación y uso (descanso, progresivos, fotocromáticos).",
      icon: <Ruler size={isMobile ? 22 : 26} color="#7c3aed" />,
      tag: "Taller",
      color: "#e9d5ff",
    },
    {
      titulo: "Relojes",
      desc: "Selección de relojes de calidad para complementar tu estilo.",
      icon: <Watch size={isMobile ? 22 : 26} color="#ea580c" />,
      tag: "Tienda",
      color: "#fed7aa",
    },
  ];

  const ventajas = [
    { 
      icon: <ShieldCheck size={isMobile ? 20 : 22} />, 
      title: "Garantía real", 
      text: "Respaldamos tu compra y tu receta.",
      gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    },
    { 
      icon: <Sparkles size={isMobile ? 20 : 22} />, 
      title: "Tecnología", 
      text: "Equipos y materiales de última generación.",
      gradient: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    },
    { 
      icon: <Headphones size={isMobile ? 20 : 22} />, 
      title: "Acompañamiento", 
      text: "Postventa y ajustes sin complicaciones.",
      gradient: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  return (
    <main style={{ fontFamily: "var(--font-body)", color: "#1f2937", position: "relative", overflow: "hidden" }}>
      {/* Decorative blobs */}
      <div style={{
        position: "absolute",
        width: isMobile ? 300 : 500,
        height: isMobile ? 300 : 500,
        background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)",
        borderRadius: "50%",
        top: -100,
        right: -100,
        filter: "blur(60px)",
        pointerEvents: "none",
      }} />
      
      {/* Hero */}
      <section
        style={{
          background: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 40%, #3b82f6 100%)",
          color: "white",
          padding: isMobile ? "40px 16px" : "56px 20px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Animated circles */}
        <div style={{
          position: "absolute",
          width: isMobile ? 150 : 200,
          height: isMobile ? 150 : 200,
          background: "rgba(255,255,255,0.1)",
          borderRadius: "50%",
          top: -50,
          right: isMobile ? -50 : 100,
          animation: "float 6s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute",
          width: isMobile ? 100 : 150,
          height: isMobile ? 100 : 150,
          background: "rgba(255,255,255,0.08)",
          borderRadius: "50%",
          bottom: -30,
          left: isMobile ? -30 : 50,
          animation: "float 8s ease-in-out infinite",
          animationDelay: "1s",
        }} />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}
        >
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: isMobile ? "1.8rem" : "2.2rem",
              margin: 0,
              marginBottom: 8,
              fontWeight: 800,
            }}
          >
            Nuestros Servicios
          </h1>
          <p style={{ 
            maxWidth: 760, 
            fontSize: isMobile ? 14 : 17, 
            opacity: 0.95, 
            lineHeight: 1.7 
          }}>
            Soluciones completas para tu salud visual y estilo: desde el diagnóstico
            preciso hasta lentes y accesorios de calidad.
          </p>
          <div style={{ marginTop: isMobile ? 14 : 16 }}>
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="/citas"
              className="btn"
              style={{
                background: "white",
                color: "#1e40af",
                borderRadius: 12,
                padding: isMobile ? "10px 16px" : "12px 20px",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                fontSize: isMobile ? "0.9rem" : "1rem",
              }}
            >
              Reservar una cita
              <ArrowRight size={isMobile ? 16 : 18} />
            </motion.a>
          </div>
        </motion.div>
      </section>

      {/* Grid de servicios */}
      <section style={{ 
        maxWidth: 1100, 
        margin: "0 auto", 
        padding: isMobile ? "28px 16px" : "34px 20px" 
      }}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(260px, 1fr))",
            gap: isMobile ? 14 : 18,
          }}
        >
          {servicios.map((s, idx) => (
            <motion.article
              key={s.titulo}
              variants={itemVariants}
              whileHover={{ 
                y: -8,
                boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
              }}
              transition={{ duration: 0.3 }}
              style={{
                background: "var(--color-blanco)",
                border: "1px solid var(--color-gris-claro)",
                borderRadius: isMobile ? 12 : 16,
                padding: isMobile ? 16 : 20,
                boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Gradient overlay */}
              <div style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 100,
                height: 100,
                background: `radial-gradient(circle at top right, ${s.color} 0%, transparent 70%)`,
                opacity: 0.3,
                pointerEvents: "none",
              }} />

              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: isMobile ? 8 : 10,
                position: "relative",
                zIndex: 1,
              }}>
                <motion.span
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  style={{
                    background: "#eef2ff",
                    border: `2px solid ${s.color}`,
                    borderRadius: 12,
                    width: isMobile ? 38 : 44,
                    height: isMobile ? 38 : 44,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  {s.icon}
                </motion.span>
                <div style={{ display: "grid", gap: 4 }}>
                  <h3 style={{ 
                    margin: 0, 
                    fontFamily: "var(--font-subtitle)",
                    fontSize: isMobile ? "1rem" : "1.1rem",
                    fontWeight: 700,
                  }}>
                    {s.titulo}
                  </h3>
                  <small
                    style={{
                      color: "#1e40af",
                      fontWeight: 600,
                      background: "#eff6ff",
                      border: "1px solid #dbeafe",
                      borderRadius: 8,
                      padding: "2px 8px",
                      width: "fit-content",
                      fontSize: isMobile ? "0.7rem" : "0.75rem",
                    }}
                  >
                    {s.tag}
                  </small>
                </div>
              </div>
              <p style={{ 
                fontSize: isMobile ? 13 : 14, 
                marginTop: isMobile ? 10 : 12, 
                lineHeight: 1.6,
                position: "relative",
                zIndex: 1,
              }}>
                {s.desc}
              </p>
            </motion.article>
          ))}
        </motion.div>
      </section>

      {/* Por qué elegirnos */}
      <section style={{ 
        maxWidth: 1100, 
        margin: "0 auto", 
        padding: isMobile ? "0 16px 32px" : "0 20px 40px" 
      }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{
            background: "linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)",
            border: "1px solid #e5e7eb",
            borderRadius: isMobile ? 14 : 18,
            padding: isMobile ? 18 : 24,
            boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              fontFamily: "var(--font-heading)",
              color: "#1e40af",
              fontSize: isMobile ? "1.3rem" : "1.5rem",
              marginBottom: isMobile ? 12 : 16,
              fontWeight: 800,
            }}
          >
            ¿Por qué elegir Clínica El Áncora?
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(220px, 1fr))",
              gap: isMobile ? 12 : 16,
            }}
          >
            {ventajas.map((v, idx) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2, duration: 0.5 }}
                whileHover={{ 
                  scale: 1.03,
                  boxShadow: "0 12px 28px rgba(0,0,0,0.12)",
                }}
                style={{
                  background: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: isMobile ? 14 : 16,
                  display: "grid",
                  gap: 8,
                  position: "relative",
                  overflow: "hidden",
                  cursor: "pointer",
                }}
              >
                <div style={{
                  position: "absolute",
                  top: -20,
                  right: -20,
                  width: 80,
                  height: 80,
                  background: v.gradient,
                  borderRadius: "50%",
                  opacity: 0.1,
                  filter: "blur(20px)",
                }} />
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 8,
                  position: "relative",
                  zIndex: 1,
                }}>
                  <div style={{
                    background: v.gradient,
                    borderRadius: 10,
                    width: isMobile ? 32 : 36,
                    height: isMobile ? 32 : 36,
                    display: "grid",
                    placeItems: "center",
                    color: "white",
                  }}>
                    {v.icon}
                  </div>
                  <strong style={{ fontSize: isMobile ? "0.95rem" : "1rem" }}>{v.title}</strong>
                </div>
                <p style={{ 
                  margin: 0, 
                  fontSize: isMobile ? 13 : 14, 
                  lineHeight: 1.6,
                  position: "relative",
                  zIndex: 1,
                }}>
                  {v.text}
                </p>
              </motion.div>
            ))}
          </div>

          <div style={{ marginTop: isMobile ? 16 : 20, textAlign: "center" }}>
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="/citas"
              className="btn"
              style={{
                background: "linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)",
                color: "white",
                borderRadius: 12,
                padding: isMobile ? "10px 18px" : "12px 20px",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                border: "none",
                boxShadow: "0 8px 24px rgba(30,64,175,0.3)",
                fontSize: isMobile ? "0.9rem" : "1rem",
              }}
            >
              Agenda tu evaluación visual
              <ArrowRight size={isMobile ? 16 : 18} />
            </motion.a>
          </div>
        </motion.div>
      </section>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </main>
  );
}
