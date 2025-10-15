import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { usuario, rol, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const menuRef = useRef(null);
  const btnRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    function onClickOutside(e) {
      if (!open) return;
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        btnRef.current &&
        !btnRef.current.contains(e.target)
      ) setOpen(false);
    }
    function onEsc(e) { if (e.key === 'Escape') setOpen(false); }

    window.addEventListener('click', onClickOutside);
    window.addEventListener('keydown', onEsc);
    return () => {
      window.removeEventListener('click', onClickOutside);
      window.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleNavClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const linkStyle = ({ isActive }) => ({
    position: 'relative',
    textDecoration: 'none',
    color: 'inherit',
    padding: '6px 2px',
    fontFamily: 'var(--font-subtitle)',
    opacity: isActive ? 1 : 0.9,
    fontSize: isMobile ? '0.75rem' : '0.9rem',
  });

  return (
    <header style={{
      ...wrap,
      padding: isMobile ? '8px 12px' : '12px 20px',
    }}>
      <nav style={{
        ...bar,
        padding: isMobile ? '8px 0' : '12px 20px',
        gap: isMobile ? 6 : 16,
        flexWrap: isMobile ? 'wrap' : 'nowrap',
      }}>
        <Link to="/" onClick={handleNavClick} style={{
          ...brand,
          gap: isMobile ? 6 : 12,
          flex: isMobile ? '1' : 'none',
        }}>
          <span style={{
            ...logoWrap,
            width: isMobile ? 28 : 36,
            height: isMobile ? 28 : 36,
          }}>
            <img
              src="/images/logo-optica.png"
              alt="Clínica El Áncora"
              width={isMobile ? 28 : 36}
              height={isMobile ? 28 : 36}
              style={logoImg}
            />
            <span style={glow} aria-hidden />
          </span>
          {!isMobile && <span style={brandText}>Clínica El Áncora</span>}
        </Link>

        {!usuario ? (
          <>
            {isMobile ? (
              <div style={{
                width: '100%',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 4,
                marginTop: 6,
              }}>
                <NavItem to="/" styleFn={linkStyle} onClick={handleNavClick}>Inicio</NavItem>
                <NavItem to="/servicios" styleFn={linkStyle} onClick={handleNavClick}>Servicios</NavItem>
                <NavItem to="/quienes-somos" styleFn={linkStyle} onClick={handleNavClick}>Nosotros</NavItem>
                <NavItem to="/citas" styleFn={linkStyle} onClick={handleNavClick}>Agendar</NavItem>
                <NavItem to="/login" styleFn={linkStyle} onClick={handleNavClick}>Entrar</NavItem>
                <NavItem to="/registro" styleFn={linkStyle} accent onClick={handleNavClick}>Registro</NavItem>
              </div>
            ) : (
              <div style={linksWrap}>
                <NavItem to="/" styleFn={linkStyle} onClick={handleNavClick}>Inicio</NavItem>
                <NavItem to="/servicios" styleFn={linkStyle} onClick={handleNavClick}>Servicios</NavItem>
                <NavItem to="/quienes-somos" styleFn={linkStyle} onClick={handleNavClick}>¿Quiénes somos?</NavItem>
                <NavItem to="/citas" styleFn={linkStyle} onClick={handleNavClick}>Agendar Cita</NavItem>
                <NavItem to="/login" styleFn={linkStyle} onClick={handleNavClick}>Iniciar Sesión</NavItem>
                <NavItem to="/registro" styleFn={linkStyle} accent onClick={handleNavClick}>¡Regístrate!</NavItem>
              </div>
            )}
          </>
        ) : (
          <>
            {isMobile ? (
              <div style={{
                width: '100%',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 6,
                marginTop: 6,
              }}>
                <NavItem to="/" styleFn={linkStyle} onClick={handleNavClick}>Inicio</NavItem>
                <NavItem to="/servicios" styleFn={linkStyle} onClick={handleNavClick}>Servicios</NavItem>
                <NavItem to="/quienes-somos" styleFn={linkStyle} onClick={handleNavClick}>¿Quiénes?</NavItem>
                <NavItem to="/citas" styleFn={linkStyle} onClick={handleNavClick}>Agendar</NavItem>
              </div>
            ) : (
              <div style={authWrap}>
                <NavItem to="/" styleFn={linkStyle} onClick={handleNavClick}>Inicio</NavItem>
                <NavItem to="/servicios" styleFn={linkStyle} onClick={handleNavClick}>Servicios</NavItem>
                <NavItem to="/quienes-somos" styleFn={linkStyle} onClick={handleNavClick}>¿Quiénes somos?</NavItem>
                <NavItem to="/citas" styleFn={linkStyle} onClick={handleNavClick}>Agendar Cita</NavItem>
              </div>
            )}

            <div style={{ position: 'relative' }}>
              <button
                ref={btnRef}
                onClick={() => setOpen(v => !v)}
                className="btn"
                style={{
                  ...userBtn,
                  padding: isMobile ? '5px 8px' : '8px 12px',
                  fontSize: isMobile ? '0.7rem' : '0.9rem',
                  gap: isMobile ? 4 : 10,
                }}
                aria-haspopup="menu"
                aria-expanded={open}
              >
                <span style={{
                  ...avatar,
                  width: isMobile ? 20 : 26,
                  height: isMobile ? 20 : 26,
                  fontSize: isMobile ? '0.7rem' : '0.9rem',
                }} aria-hidden>{(usuario || 'U')[0].toUpperCase()}</span>
                {!isMobile && <span style={{ whiteSpace:'nowrap' }}>Hola, {usuario}</span>}
                {isMobile && <span style={{ whiteSpace:'nowrap' }}>Menú</span>}
                <span style={caret(open)} aria-hidden>▾</span>
              </button>

              {open && (
                <div
                  ref={menuRef}
                  role="menu"
                  style={{
                    ...menu,
                    minWidth: isMobile ? '180px' : '220px',
                    right: isMobile ? '-8px' : 0,
                  }}
                >
                  {rol === 1 && (
                    <Link to="/admin" onClick={()=>{setOpen(false); handleNavClick();}} style={{...item, fontSize: isMobile ? '0.8rem' : '0.9rem'}} role="menuitem">
                      <span>Dashboard Admin</span>
                    </Link>
                  )}
                  {rol === 2 && (
                    <Link to="/optometrista" onClick={()=>{setOpen(false); handleNavClick();}} style={{...item, fontSize: isMobile ? '0.8rem' : '0.9rem'}} role="menuitem">
                      <span>Dashboard Optometrista</span>
                    </Link>
                  )}

                  <Link to="/perfil" onClick={()=>{setOpen(false); handleNavClick();}} style={{...item, fontSize: isMobile ? '0.8rem' : '0.9rem'}} role="menuitem">
                    Configurar perfil
                  </Link>

                  {rol === 3 ? (
                    <Link to="/paciente" onClick={()=>{setOpen(false); handleNavClick();}} style={{...item, fontSize: isMobile ? '0.8rem' : '0.9rem'}} role="menuitem">
                      Mis citas
                    </Link>
                  ) : (
                    <Link to="/citas" onClick={()=>{setOpen(false); handleNavClick();}} style={{...item, fontSize: isMobile ? '0.8rem' : '0.9rem'}} role="menuitem">
                      Ver citas
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    style={{ ...item, width:'100%', textAlign:'left', background:'transparent', border:'none', fontSize: isMobile ? '0.8rem' : '0.9rem' }}
                    role="menuitem"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </nav>

      <style>{css}</style>
    </header>
  );
}

function NavItem({ to, children, styleFn, accent, onClick }) {
  return (
    <NavLink to={to} style={styleFn} className={accent ? 'nav-accent' : 'nav-link'} onClick={onClick}>
      <span className="nav-underline">{children}</span>
    </NavLink>
  );
}

/* ---------- Estilos ---------- */
const wrap = {
  position: 'sticky',
  top: 0,
  zIndex: 100,
  backdropFilter: 'saturate(140%) blur(8px)',
  background:
    'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
  borderBottom: '1px solid rgba(0,0,0,0.06)',
};
const bar = {
  maxWidth: 1200,
  margin: '0 auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};
const brand = { display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' };
const brandText = { fontFamily: 'var(--font-heading)', fontWeight: 800, letterSpacing: '.2px' };
const logoWrap = { position: 'relative', borderRadius: 10, overflow: 'hidden', boxShadow: '0 8px 18px rgba(0,0,0,0.08)' };
const logoImg = { width: '100%', height: '100%', objectFit: 'cover', display: 'block' };
const glow = { position: 'absolute', inset: -20, background: 'radial-gradient(40px 40px at 30% 30%, rgba(37,99,235,.35), transparent)', pointerEvents: 'none' };
const linksWrap = { display: 'flex', gap: 18, alignItems: 'center', fontFamily: 'var(--font-subtitle)' };
const authWrap  = { display: 'flex', gap: 18, alignItems: 'center' };
const userBtn = {
  display: 'flex', alignItems: 'center',
  background: 'linear-gradient(135deg, #0096c7, #00b4d8)',
  color: '#fff', border: 'none',
  borderRadius: 12, boxShadow: '0 10px 22px rgba(0,150,199,0.25)',
  cursor: 'pointer', transition: 'transform .15s ease', willChange: 'transform'
};
const avatar = { borderRadius: 999, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,.2)', fontWeight: 700 };
const caret = (open) => ({ marginLeft: 2, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .18s ease', fontSize: '0.8rem' });
const menu = {
  position: 'absolute', marginTop: 10, background: '#fff',
  border: '1px solid rgba(0,0,0,0.06)', borderRadius: 14,
  boxShadow: '0 18px 38px rgba(0,0,0,0.08)', zIndex: 50, overflow: 'hidden'
};
const item = {
  display: 'block', padding: '10px 14px', color: 'inherit',
  textDecoration: 'none', fontFamily: 'var(--font-subtitle)', cursor: 'pointer'
};
const css = `
  .nav-link .nav-underline,
  .nav-accent .nav-underline {
    position: relative;
    display: inline-block;
  }
  .nav-link .nav-underline::after {
    content: "";
    position: absolute;
    left: 0; bottom: -2px; height: 2px; width: 0%;
    background: linear-gradient(90deg, #0ea5e9, #22d3ee);
    transition: width .18s ease;
    border-radius: 2px;
  }
  .nav-link:hover .nav-underline::after, 
  .nav-link.active .nav-underline::after {
    width: 100%;
  }
  .nav-accent {
    padding: 4px 8px !important;
    border-radius: 10px;
    background: linear-gradient(135deg, #fde047 0%, #fbbf24 100%);
    box-shadow: 0 8px 14px rgba(251,191,36,.25);
  }
  .nav-accent:hover { transform: translateY(-1px); }
  .btn:focus, a:focus, button:focus {
    outline: 3px solid rgba(34,211,238,.55);
    outline-offset: 2px;
    border-radius: 10px;
  }
  @media (prefers-reduced-motion: reduce) {
    .nav-link .nav-underline::after { transition: none; }
  }
`;
