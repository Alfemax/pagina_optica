import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/adminApi';

export default function Overview() {
  const [kpi, setKpi] = useState(null);
  useEffect(() => { adminApi.overview().then(({data}) => setKpi(data.data)); }, []);
  if (!kpi) return <div>Cargando…</div>;

  const Card = ({title, value}) => (
    <div style={card}>
      <div style={{ fontSize:12, opacity:.7 }}>{title}</div>
      <div style={{ fontSize:28, fontWeight:700 }}>{value}</div>
    </div>
  );

  return (
    <>
      <h2 style={{ fontFamily:'var(--font-heading)' }}>Panel de administración</h2>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginTop:12 }}>
        <Card title="Usuarios" value={kpi.total_usuarios} />
        <Card title="Administradores" value={kpi.total_admins} />
        <Card title="Optometristas" value={kpi.total_optos} />
        <Card title="Pacientes" value={kpi.total_pac} />
      </div>
    </>
  );
}

const card = {
  border:'1px solid var(--color-gris-claro)', borderRadius:12, padding:'12px 14px',
  background:'#fff'
};
