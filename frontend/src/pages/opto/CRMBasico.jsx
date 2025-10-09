import React, { useEffect, useState } from 'react';
import { apiAuth } from '../../services/apiAuth';

export default function CRMBasico() {
  const [data, setData] = useState(null);
  useEffect(() => {
    apiAuth.get('/opto/crm').then(({data}) => setData(data.data));
  }, []);
  return (
    <>
      <h2 style={{ fontFamily: 'var(--font-heading)' }}>CRM Básico</h2>
      {!data ? (
        <div>Cargando…</div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div style={{ border:'1px solid var(--color-gris-claro)', borderRadius:12, padding:12 }}>
            <h4 style={{ marginTop:0 }}>Pendientes</h4>
            <ul>{(data.pendientes||[]).map(p => <li key={p.id}>{p.paciente} — {p.nota} (vence {p.vence})</li>)}</ul>
          </div>
          <div style={{ border:'1px solid var(--color-gris-claro)', borderRadius:12, padding:12 }}>
            <h4 style={{ marginTop:0 }}>Últimas citas</h4>
            <ul>{(data.ultimas_citas||[]).map((c,i) => <li key={i}>{c}</li>)}</ul>
          </div>
        </div>
      )}
    </>
  );
}
