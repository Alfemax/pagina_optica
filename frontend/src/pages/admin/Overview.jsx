import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/adminApi';
import { Users, Shield, Stethoscope, Hospital, TrendingUp, Zap, Lock, Calendar } from 'lucide-react';

export default function Overview() {
  const [kpi, setKpi] = useState(null);
  
  useEffect(() => { 
    adminApi.overview().then(({data}) => setKpi(data.data)); 
  }, []);
  
  if (!kpi) return (
    <div style={loadingContainer}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={spinner}></div>
      <p style={loadingText}>Cargando datos...</p>
    </div>
  );

  const cards = [
    { 
      title: 'Usuarios Totales', 
      value: kpi.total_usuarios, 
      Icon: Users,
      color: '#0ea5e9',
      gradient: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
      bg: 'rgba(14, 165, 233, 0.1)'
    },
    { 
      title: 'Administradores', 
      value: kpi.total_admins, 
      Icon: Shield,
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      bg: 'rgba(139, 92, 246, 0.1)'
    },
    { 
      title: 'Optometristas', 
      value: kpi.total_optos, 
      Icon: Stethoscope,
      color: '#06b6d4',
      gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
      bg: 'rgba(6, 182, 212, 0.1)'
    },
    { 
      title: 'Pacientes', 
      value: kpi.total_pac, 
      Icon: Hospital,
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      bg: 'rgba(16, 185, 129, 0.1)'
    },
  ];

  return (
    <div style={container}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <header style={headerStyle}>
        <div>
          <h2 style={mainTitle}>Panel de Control</h2>
          <p style={subtitle}>Resumen general del sistema</p>
        </div>
        <div style={dateBox}>
          <Calendar size={18} style={{ color: 'rgba(0, 0, 0, 0.6)' }} />
          <span style={dateText}>
            {new Date().toLocaleDateString('es-GT', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </span>
        </div>
      </header>

      <div style={grid}>
        {cards.map((card, idx) => {
          const Icon = card.Icon;
          return (
            <div 
              key={idx} 
              style={{
                ...cardStyle,
                animation: `fadeIn 0.4s ease ${idx * 0.1}s backwards`,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = `0 12px 32px ${card.color}30`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
              }}
            >
              <div style={cardHeader}>
                <div style={{
                  ...iconBox, 
                  background: card.gradient,
                  boxShadow: `0 8px 20px ${card.color}40`,
                }}>
                  <Icon size={24} style={{ color: '#fff' }} />
                </div>
                <span style={cardTitle}>{card.title}</span>
              </div>
              <div style={cardValue}>{card.value.toLocaleString()}</div>
              <div style={cardFooter}>
                <div style={{
                  ...badge,
                  background: card.bg,
                  color: card.color,
                }}>
                  Activo
                </div>
              </div>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 3,
                height: '100%',
                background: card.gradient,
                borderTopLeftRadius: 2,
                borderBottomLeftRadius: 2,
              }} />
            </div>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div style={statsSection}>
        <h3 style={sectionTitle}>Estadísticas Rápidas</h3>
        <div style={statsGrid}>
          <div 
            style={statCard}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(14, 165, 233, 0.04)';
              e.currentTarget.style.borderColor = 'rgba(14, 165, 233, 0.3)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.08)';
            }}
          >
            <div style={{
              ...statIcon, 
              background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
              boxShadow: '0 8px 20px rgba(14, 165, 233, 0.3)',
            }}>
              <TrendingUp size={28} style={{ color: '#fff' }} />
            </div>
            <div style={statInfo}>
              <div style={statLabel}>Tasa de actividad</div>
              <div style={statValue}>98.5%</div>
            </div>
          </div>

          <div 
            style={statCard}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(245, 158, 11, 0.04)';
              e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.3)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.08)';
            }}
          >
            <div style={{
              ...statIcon, 
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              boxShadow: '0 8px 20px rgba(245, 158, 11, 0.3)',
            }}>
              <Zap size={28} style={{ color: '#fff' }} />
            </div>
            <div style={statInfo}>
              <div style={statLabel}>Rendimiento</div>
              <div style={statValue}>Óptimo</div>
            </div>
          </div>

          <div 
            style={statCard}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.04)';
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.08)';
            }}
          >
            <div style={{
              ...statIcon, 
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)',
            }}>
              <Lock size={28} style={{ color: '#fff' }} />
            </div>
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
const container = {
  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
  minHeight: '100vh',
  padding: '32px',
  color: '#1a1d29',
};

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
  border: '4px solid rgba(0, 0, 0, 0.1)',
  borderTop: '4px solid #0066cc',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
};

const loadingText = {
  color: 'rgba(0, 0, 0, 0.6)',
  fontSize: '0.9rem',
  margin: 0,
  fontWeight: 300,
  letterSpacing: '0.3px',
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 32,
  paddingBottom: 24,
  borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
  flexWrap: 'wrap',
  gap: 16,
};

const mainTitle = {
  margin: 0,
  fontSize: '1.75rem',
  fontWeight: 300,
  color: '#1a1d29',
  letterSpacing: '0.5px',
};

const subtitle = {
  margin: '8px 0 0 0',
  fontSize: '0.85rem',
  color: 'rgba(0, 0, 0, 0.5)',
  fontWeight: 300,
};

const dateBox = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 16px',
  background: '#ffffff',
  borderRadius: 2,
  border: '1px solid rgba(0, 0, 0, 0.08)',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
};

const dateText = {
  fontSize: '0.8rem',
  color: 'rgba(0, 0, 0, 0.7)',
  fontWeight: 400,
  textTransform: 'capitalize',
};

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 20,
  marginBottom: 32,
};

const cardStyle = {
  position: 'relative',
  background: '#ffffff',
  borderRadius: 2,
  padding: 24,
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  border: '1px solid rgba(0, 0, 0, 0.08)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  overflow: 'hidden',
};

const cardHeader = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  marginBottom: 20,
};

const iconBox = {
  width: 56,
  height: 56,
  borderRadius: 2,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'transform 0.3s ease',
};

const cardTitle = {
  fontSize: '0.8rem',
  color: 'rgba(0, 0, 0, 0.6)',
  fontWeight: 500,
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
};

const cardValue = {
  fontSize: '2.5rem',
  fontWeight: 300,
  color: '#1a1d29',
  marginBottom: 16,
  letterSpacing: '-0.5px',
};

const cardFooter = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
};

const badge = {
  fontSize: '0.7rem',
  fontWeight: 600,
  padding: '5px 12px',
  borderRadius: 2,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const statsSection = {
  marginTop: 32,
};

const sectionTitle = {
  fontSize: '1.1rem',
  fontWeight: 500,
  color: '#1a1d29',
  marginBottom: 20,
  letterSpacing: '0.3px',
};

const statsGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: 16,
};

const statCard = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  padding: 20,
  background: '#ffffff',
  borderRadius: 2,
  border: '1px solid rgba(0, 0, 0, 0.08)',
  transition: 'all 0.2s ease',
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
};

const statIcon = {
  width: 60,
  height: 60,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 2,
  flexShrink: 0,
};

const statInfo = {
  flex: 1,
};

const statLabel = {
  fontSize: '0.8rem',
  color: 'rgba(0, 0, 0, 0.5)',
  marginBottom: 6,
  fontWeight: 400,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const statValue = {
  fontSize: '1.4rem',
  fontWeight: 500,
  color: '#1a1d29',
  letterSpacing: '0.2px',
};
