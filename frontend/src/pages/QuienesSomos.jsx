import React from "react";

export default function QuienesSomos() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px" }}>
      <h2 style={{ fontFamily: "var(--font-heading)", marginBottom: 20 }}>
        ¿Quiénes somos?
      </h2>
      <p style={{ fontSize: 16, lineHeight: 1.6 }}>
        En Clínica El Áncora somos un equipo comprometido con la salud visual
        y el bienestar de nuestros pacientes. Ofrecemos servicios especializados en
        exámenes de la vista, tratamientos oculares y la adaptación de lentes a la medida,
        combinando tecnología moderna con atención personalizada.
      </p>
      <p style={{ fontSize: 16, lineHeight: 1.6, marginTop: 14 }}>
        Además, ponemos a disposición una selección de aros, lentes y relojes de
        calidad para que cada persona encuentre el complemento ideal según su estilo
        y necesidades. Nuestra misión es cuidar tu visión y brindarte confianza
        en cada consulta y producto.
      </p>
    </main>
  );
}
