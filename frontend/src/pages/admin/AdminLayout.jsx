import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const link = ({ isActive }) => ({
  display: 'block',
  padding: '10px 12px',
  marginBottom: 10,
  borderRadius: 10,
  border: '1px solid var(--color-gris-claro)',
  background: isActive ? '#f6f6f6' : 'white',
  textDecoration: 'none',
  color: 'inherit',
  fontFamily: 'var(--font-subtitle)'
});

export default function AdminLayout() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px', display: 'grid', gridTemplateColumns: '240px 1fr', gap: 20 }}>
      <aside>
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-heading)' }}>Administrador</h3>
        <NavLink to="/admin" end style={link}>Inicio</NavLink>
        <NavLink to="/admin/usuarios" style={link}>Usuarios</NavLink>
        <NavLink to="/admin/roles" style={link}>Roles</NavLink>
        <NavLink to="/admin/seguridad" style={link}>Seguridad</NavLink>
        <NavLink to="/admin/configuracion" style={link}>Configuración</NavLink>
      </aside>
      <section>
        <Outlet />
      </section>
    </div>
  );
}
