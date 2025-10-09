import React, { useEffect, useRef } from 'react';

export default function Modal({ open, onClose, title, children, footer, maxHeight = '80vh' }) {
  const firstFieldRef = useRef(null);

  // Manejo de tecla Escape
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  return (
    <div style={backdrop} onClick={handleBackdropClick}>
      <div style={{ ...modal, maxHeight }}>
        <div style={header}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>

        <div style={body}>
          {typeof children === 'function' 
            ? children({ firstFieldRef }) 
            : children}
        </div>

        {footer && <div style={footerStyle}>{footer}</div>}
      </div>
    </div>
  );
}

const backdrop = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '20px'
};

const modal = {
  backgroundColor: 'white',
  borderRadius: '8px',
  width: '100%',
  maxWidth: '700px',
  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
  display: 'flex',
  flexDirection: 'column'
};

const header = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '20px 20px 0 20px',
  borderBottom: '1px solid #eee',
  paddingBottom: '15px',
  marginBottom: '15px'
};

const body = {
  padding: '0 20px',
  overflowY: 'auto',
  flex: 1
};

const footerStyle = {
  padding: '15px 20px 20px 20px',
  borderTop: '1px solid #eee',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '10px'
};

const closeBtn = {
  background: 'none',
  border: 'none',
  fontSize: '20px',
  cursor: 'pointer',
  padding: '5px',
  borderRadius: '4px',
  color: '#666'
};
