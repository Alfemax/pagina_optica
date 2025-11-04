import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/adminApi';

export default function Overview() {
  const [kpi, setKpi] = useState(null);
  
  useEffect(() => { 
    adminApi.overview().then(({data}) => setKpi(data.data)); 
  }, []);
  
  if (!kpi) return (
    <div style={loadingContainer}>
      <div style={spinner}></div>
      <p style={loadingText}>Cargando datos...</p>
    </div>
  );

  const cards = [
    { 
      title: 'Usuarios Totales', 
      value: kpi.total_usuarios, 
      icon: '👥',
      color: '#0ea5e9',
      bg: '#f0f9ff'
    },
    { 
      title: 'Administradores', 
      value: kpi.total_admins, 
      icon: '👨‍💼',
      color: '#8b5cf6',
      bg: '#f5f3ff'
    },
    { 
      title: 'Optometristas', 
      value: kpi.total_optos, 
      icon: '👨‍⚕️',
      color: '#06b6d4',
      bg: '#ecfeff'
    },
    { 
      title: 'Pacientes', 
      value: kpi.total_pac, 
      icon: '🏥',
      color: '#10b981',
      bg: '#f0fdf4'
    },
  ];

  return (
    <div>
      <header style={headerStyle}>
        <div>
          <h2 style={mainTitle}>Panel de Control</h2>
          <p style={subtitle}>Resumen general del sistema</p>
        </div>
        <div style={dateBox}>
          <span style={dateIcon}>📅</span>
          <span style={dateText}>{new Date().toLocaleDateString('es-GT', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</span>
        </div>
      </header>

      <div style={grid}>
        {cards.map((card, idx) => (
          <div key={idx} style={{...cardStyle, borderLeft: `4px solid ${card.color}`}}>
            <div style={cardHeader}>
              <div style={{...iconBox, background: card.bg, color: card.color}}>
                {card.icon}
              </div>
              <span style={cardTitle}>{card.title}</span>
            </div>
            <div style={cardValue}>{card.value}</div>
            <div style={cardFooter}>
              <span style={badge}>Activo</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div style={statsSection}>
        <h3 style={sectionTitle}>Estadísticas Rápidas</h3>
        <div style={statsGrid}>
          <div style={statCard}>
            <div style={statIcon}>📈</div>
            <div style={statInfo}>
              <div style={statLabel}>Tasa de actividad</div>
              <div style={statValue}>98.5%</div>
            </div>
          </div>
          <div style={statCard}>
            <div style={statIcon}>⚡</div>
            <div style={statInfo}>
              <div style={statLabel}>Rendimiento</div>
              <div style={statValue}>Óptimo</div>
            </div>
          </div>
          <div style={statCard}>
            <div style={statIcon}>🔒</div>
            <div style={statInfo}>
              <div style={statLabel}>Seguridad</div>
              <div style={statValue}>Alta</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Styles
const loadingContainer = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 400,
  gap: 16,
};

const spinner = {
  width: 48,
  height: 48,
  border: '4px solid #e5e7eb',
  borderTop: '4px solid #0ea5e9',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
};

const loadingText = {
  color: '#64748b',
  fontSize: 14,
  margin: 0,
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 32,
  paddingBottom: 24,
  borderBottom: '1px solid #e5e7eb',
};

const mainTitle = {
  margin: 0,
  fontSize: 32,
  fontWeight: 700,
  color: '#0f172a',
  fontFamily: 'var(--font-heading)',
};

const subtitle = {
  margin: '8px 0 0 0',
  fontSize: 15,
  color: '#64748b',
};

const dateBox = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 16px',
  background: '#f8fafc',
  borderRadius: 12,
  border: '1px solid #e5e7eb',
};

const dateIcon = {
  fontSize: 18,
};

const dateText = {
  fontSize: 13,
  color: '#475569',
  fontWeight: 500,
  textTransform: 'capitalize',
};

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 20,
  marginBottom: 32,
};

const cardStyle = {
  background: '#fff',
  borderRadius: 16,
  padding: 24,
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  border: '1px solid #e5e7eb',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
};

const cardHeader = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginBottom: 16,
};

const iconBox = {
  width: 48,
  height: 48,
  borderRadius: 12,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 24,
};

const cardTitle = {
  fontSize: 14,
  color: '#64748b',
  fontWeight: 500,
};

const cardValue = {
  fontSize: 36,
  fontWeight: 700,
  color: '#0f172a',
  marginBottom: 12,
};

const cardFooter = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const badge = {
  fontSize: 11,
  fontWeight: 600,
  color: '#10b981',
  background: '#f0fdf4',
  padding: '4px 10px',
  borderRadius: 999,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const statsSection = {
  marginTop: 32,
};

const sectionTitle = {
  fontSize: 18,
  fontWeight: 700,
  color: '#0f172a',
  marginBottom: 16,
  fontFamily: 'var(--font-heading)',
};

const statsGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 16,
};

const statCard = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  padding: 20,
  background: '#f8fafc',
  borderRadius: 12,
  border: '1px solid #e5e7eb',
};

const statIcon = {
  fontSize: 32,
  width: 56,
  height: 56,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#fff',
  borderRadius: 12,
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
};

const statInfo = {
  flex: 1,
};

const statLabel = {
  fontSize: 13,
  color: '#64748b',
  marginBottom: 4,
};

const statValue = {
  fontSize: 20,
  fontWeight: 700,
  color: '#0f172a',
};
