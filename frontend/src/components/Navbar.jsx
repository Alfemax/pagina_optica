import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { usuario, rol, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const btnRef = useRef(null);

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

  const linkStyle = ({ isActive }) => ({
    position: 'relative',
    textDecoration: 'none',
    color: 'inherit',
    padding: '6px 2px',
    fontFamily: 'var(--font-subtitle)',
    opacity: isActive ? 1 : 0.9,
  });

  return (
    <header style={wrap}>
      <nav style={bar}>
        <Link to="/" style={brand}>
          <span style={logoWrap}>
            <img
              src="/images/logo-optica.png"
              alt="Clínica El Áncora"
              width="36"
              height="36"
              style={logoImg}
            />
            <span style={glow} aria-hidden />
          </span>
          <span style={brandText}>Clínica El Áncora</span>
        </Link>

        {!usuario ? (
          <div style={linksWrap}>
            <NavItem to="/" styleFn={linkStyle}>Inicio</NavItem>
            <NavItem to="/servicios" styleFn={linkStyle}>Servicios</NavItem>
            <NavItem to="/quienes-somos" styleFn={linkStyle}>¿Quiénes somos?</NavItem>
            <NavItem to="/citas" styleFn={linkStyle}>Agendar Cita</NavItem>
            <NavItem to="/login" styleFn={linkStyle}>Iniciar Sesión</NavItem>
            <NavItem to="/registro" styleFn={linkStyle} accent>¡Regístrate!</NavItem>
          </div>
        ) : (
          <div style={authWrap}>
            <NavItem to="/" styleFn={linkStyle}>Inicio</NavItem>
            <NavItem to="/servicios" styleFn={linkStyle}>Servicios</NavItem>
            <NavItem to="/quienes-somos" styleFn={linkStyle}>¿Quiénes somos?</NavItem>
            <NavItem to="/citas" styleFn={linkStyle}>Agendar Cita</NavItem>

            <div style={{ position: 'relative' }}>
              <button
                ref={btnRef}
                onClick={() => setOpen(v => !v)}
                className="btn"
                style={userBtn}
                aria-haspopup="menu"
                aria-expanded={open}
              >
                <span style={avatar} aria-hidden>{(usuario || 'U')[0].toUpperCase()}</span>
                <span style={{ whiteSpace:'nowrap' }}>Hola, {usuario}</span>
                <span style={caret(open)} aria-hidden>▾</span>
              </button>

              {open && (
                <div
                  ref={menuRef}
                  role="menu"
                  style={menu}
                >
                  {rol === 1 && (
                    <Link to="/admin" onClick={()=>setOpen(false)} style={item} role="menuitem">
                      <span>Dashboard Admin</span>
                    </Link>
                  )}
                  {rol === 2 && (
                    <Link to="/optometrista" onClick={()=>setOpen(false)} style={item} role="menuitem">
                      <span>Dashboard Optometrista</span>
                    </Link>
                  )}

                  <Link to="/perfil" onClick={()=>setOpen(false)} style={item} role="menuitem">
                    Configurar perfil
                  </Link>

                  {/* CAMBIO: si es PACIENTE (rol 3), “Ver citas” abre el dashboard del paciente */}
                  {rol === 3 ? (
                    <Link to="/paciente" onClick={()=>setOpen(false)} style={item} role="menuitem">
                      Mis citas
                    </Link>
                  ) : (
                    <Link to="/citas" onClick={()=>setOpen(false)} style={item} role="menuitem">
                      Ver citas
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    style={{ ...item, width:'100%', textAlign:'left', background:'transparent', border:'none' }}
                    role="menuitem"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      <style>{css}</style>
    </header>
  );
}

function NavItem({ to, children, styleFn, accent }) {
  return (
    <NavLink to={to} style={styleFn} className={accent ? 'nav-accent' : 'nav-link'}>
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
  padding: '12px 20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
};
const brand = { display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'inherit' };
const brandText = { fontFamily: 'var(--font-heading)', fontWeight: 800, letterSpacing: '.2px' };
const logoWrap = { position: 'relative', width: 36, height: 36, borderRadius: 10, overflow: 'hidden', boxShadow: '0 8px 18px rgba(0,0,0,0.08)' };
const logoImg = { width: '100%', height: '100%', objectFit: 'cover', display: 'block' };
const glow = { position: 'absolute', inset: -20, background: 'radial-gradient(40px 40px at 30% 30%, rgba(37,99,235,.35), transparent)', pointerEvents: 'none' };
const linksWrap = { display: 'flex', gap: 18, alignItems: 'center', fontFamily: 'var(--font-subtitle)' };
const authWrap  = { display: 'flex', gap: 18, alignItems: 'center' };
const userBtn = {
  display: 'flex', alignItems: 'center', gap: 10,
  background: 'linear-gradient(135deg, #0096c7, #00b4d8)',
  color: '#fff', border: 'none', padding: '8px 12px',
  borderRadius: 12, boxShadow: '0 10px 22px rgba(0,150,199,0.25)',
  cursor: 'pointer', transition: 'transform .15s ease', willChange: 'transform'
};
const avatar = { width: 26, height: 26, borderRadius: 999, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,.2)', fontWeight: 700 };
const caret = (open) => ({ marginLeft: 2, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .18s ease' });
const menu = {
  position: 'absolute', right: 0, marginTop: 10, background: '#fff',
  border: '1px solid rgba(0,0,0,0.06)', borderRadius: 14, minWidth: 220,
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
    padding: 6px 10px !important;
    border-radius: 12px;
    background: linear-gradient(135deg, #fde047 0%, #fbbf24 100%);
    box-shadow: 0 10px 18px rgba(251,191,36,.25);
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
