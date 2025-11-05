import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { BarChart3, Users, Key, Shield, Settings, Activity } from 'lucide-react';

const navItems = [
  { to: '/admin', label: 'Inicio', Icon: BarChart3, end: true },
  { to: '/admin/usuarios', label: 'Usuarios', Icon: Users },
  { to: '/admin/roles', label: 'Roles', Icon: Key },
  { to: '/admin/seguridad', label: 'Seguridad', Icon: Shield },
  { to: '/admin/configuracion', label: 'Configuración', Icon: Settings },
];

export default function AdminLayout() {
  return (
    <>
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          margin-bottom: 4px;
          border-radius: 2px;
          background: transparent;
          color: rgba(0, 0, 0, 0.6);
          text-decoration: none;
          font-weight: 400;
          font-size: 0.9rem;
          transition: all 0.15s ease;
          border: 1px solid transparent;
          letter-spacing: 0.2px;
          position: relative;
          overflow: hidden;
        }
        
        .nav-link::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: 3px;
          background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%);
          transform: scaleY(0);
          transition: transform 0.2s ease;
        }
        
        .nav-link:hover:not(.active) {
          background: rgba(0, 102, 204, 0.08);
          border-color: rgba(0, 102, 204, 0.15);
          color: rgba(0, 0, 0, 0.9);
        }
        
        .nav-link.active {
          background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%);
          color: #fff;
          font-weight: 500;
          box-shadow: 0 4px 12px rgba(0, 102, 204, 0.3);
        }
        
        .nav-link.active::before {
          transform: scaleY(1);
        }
        
        .nav-link svg {
          transition: transform 0.2s ease;
        }
        
        .nav-link:hover svg {
          transform: scale(1.1);
        }
      `}</style>

      <div style={container}>
        {/* Sidebar */}
        <aside style={sidebar}>
          <div style={header}>
            <div style={logo}>
              <Activity size={24} />
            </div>
            <div>
              <h3 style={title}>Admin Panel</h3>
              <p style={subtitle}>Clínica El Áncora</p>
            </div>
          </div>
          
          <nav style={nav}>
            {navItems.map((item, idx) => {
              const Icon = item.Icon;
              return (
                <NavLink 
                  key={item.to} 
                  to={item.to} 
                  end={item.end} 
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  style={{
                    animation: `slideIn 0.3s ease ${idx * 0.05}s backwards`,
                  }}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div style={footer}>
            <div style={statusDot} />
            <span style={statusText}>Sistema operativo</span>
          </div>
        </aside>

        {/* Main Content */}
        <main style={main}>
          <Outlet />
        </main>
      </div>
    </>
  );
}

const container = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
  display: 'grid',
  gridTemplateColumns: '280px 1fr',
  gap: 0,
};

const sidebar = {
  background: 'linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)',
  backdropFilter: 'blur(10px)',
  padding: '28px 20px',
  borderRight: '1px solid rgba(0, 0, 0, 0.08)',
  height: '100vh',
  position: 'sticky',
  top: 0,
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '4px 0 20px rgba(0, 0, 0, 0.05)',
};

const header = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  marginBottom: 32,
  paddingBottom: 24,
  borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
};

const logo = {
  width: 48,
  height: 48,
  borderRadius: 2,
  background: 'linear-gradient(135deg, #0066cc 0%, #0052a3 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  boxShadow: '0 8px 20px rgba(0, 102, 204, 0.4)',
  transition: 'transform 0.2s ease',
  cursor: 'pointer',
};

const title = {
  margin: 0,
  fontSize: '1.1rem',
  fontWeight: 500,
  color: '#1a1d29',
  letterSpacing: '0.3px',
};

const subtitle = {
  margin: '2px 0 0 0',
  fontSize: '0.7rem',
  color: 'rgba(0, 0, 0, 0.5)',
  fontWeight: 300,
  letterSpacing: '0.3px',
};

const nav = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
};

const footer = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  paddingTop: 20,
  borderTop: '1px solid rgba(0, 0, 0, 0.08)',
  marginTop: 'auto',
};

const statusDot = {
  width: 8,
  height: 8,
  borderRadius: '50%',
  background: '#10b981',
  boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)',
  animation: 'pulse 2s ease-in-out infinite',
};

const statusText = {
  fontSize: '0.75rem',
  color: 'rgba(0, 0, 0, 0.5)',
  fontWeight: 400,
};

const main = {
  padding: 0,
  minHeight: '100vh',
  overflow: 'auto',
};
