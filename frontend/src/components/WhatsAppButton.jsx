import React from 'react';

export default function WhatsAppButton({
  phone = '50255551234',
  msg = 'Hola, quisiera agendar una cita',
  children = 'Agendar Cita',
}) {
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="btn"
       style={{ display: 'inline-block', fontWeight: 600, background: 'var(--color-amarillo-optica)', color: 'var(--color-negro)' }}>
      {children}
    </a>
  );
}
