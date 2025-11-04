import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/admin', label: 'Inicio', icon: '📊', end: true },
  { to: '/admin/usuarios', label: 'Usuarios', icon: '👥' },
  { to: '/admin/roles', label: 'Roles', icon: '🔑' },
  { to: '/admin/seguridad', label: 'Seguridad', icon: '🛡️' },
  { to: '/admin/configuracion', label: 'Configuración', icon: '⚙️' },
];

const linkStyle = ({ isActive }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '12px 16px',
  marginBottom: 6,
  borderRadius: 12,
  background: isActive ? 'linear-gradient(135deg, #0ea5e9, #22d3ee)' : 'transparent',
  color: isActive ? '#fff' : '#64748b',
  textDecoration: 'none',
  fontWeight: isActive ? 600 : 500,
  fontSize: 15,
  transition: 'all 0.2s ease',
  border: isActive ? 'none' : '1px solid transparent',
});

export default function AdminLayout() {
  return (
    <div style={container}>
      {/* Sidebar */}
      <aside style={sidebar}>
        <div style={header}>
          <div style={logo}>👨‍⚕️</div>
          <h3 style={title}>Admin Panel</h3>
        </div>
        
        <nav style={nav}>
          {navItems.map(item => (
            <NavLink 
              key={item.to} 
              to={item.to} 
              end={item.end} 
              style={linkStyle}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main style={main}>
        <Outlet />
      </main>
    </div>
  );
}

const container = {
  minHeight: '100vh',
  background: 'linear-gradient(to bottom, #f8fafc 0%, #f1f5f9 100%)',
  display: 'grid',
  gridTemplateColumns: '280px 1fr',
  gap: 24,
  padding: 24,
};

const sidebar = {
  background: '#fff',
  borderRadius: 20,
  padding: 24,
  boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
  height: 'fit-content',
  position: 'sticky',
  top: 24,
};

const header = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginBottom: 32,
  paddingBottom: 24,
  borderBottom: '1px solid #e5e7eb',
};

const logo = {
  width: 48,
  height: 48,
  borderRadius: 12,
  background: 'linear-gradient(135deg, #0ea5e9, #22d3ee)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 24,
  boxShadow: '0 8px 18px rgba(14,165,233,0.25)',
};

const title = {
  margin: 0,
  fontSize: 20,
  fontWeight: 700,
  color: '#0f172a',
  fontFamily: 'var(--font-heading)',
};

const nav = {
  display: 'flex',
  flexDirection: 'column',
};

const main = {
  background: '#fff',
  borderRadius: 20,
  padding: 32,
  boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
  minHeight: 'calc(100vh - 48px)',
};
