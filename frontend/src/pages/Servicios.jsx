import React from "react";

export default function Servicios() {
  const servicios = [
    { titulo: "Exámenes de la vista", desc: "Evaluaciones completas para diagnosticar problemas visuales." },
    { titulo: "Tratamiento de los ojos", desc: "Atención clínica para diferentes afecciones oculares." },
    { titulo: "Venta de aros", desc: "Variedad de aros modernos y clásicos para todos los estilos." },
    { titulo: "Lentes a la medida", desc: "Fabricación de lentes personalizados según tu graduación." },
    { titulo: "Relojes", desc: "Venta de relojes de calidad como complemento de tu estilo." },
  ];

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px" }}>
      <h2 style={{ fontFamily: "var(--font-heading)", marginBottom: 24 }}>
        Nuestros Servicios
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 20,
        }}
      >
        {servicios.map((s) => (
          <div
            key={s.titulo}
            style={{
              background: "var(--color-blanco)",
              border: "1px solid var(--color-gris-claro)",
              borderRadius: 12,
              padding: 20,
              boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
              transition: "transform 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <h3 style={{ fontFamily: "var(--font-subtitle)" }}>{s.titulo}</h3>
            <p style={{ fontSize: 14, marginTop: 6 }}>{s.desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
