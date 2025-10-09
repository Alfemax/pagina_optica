import React, { useEffect, useMemo, useState } from 'react';
import { optoApi } from '../../services/optoApi';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { Calendar, TrendingUp, Users, Clock, AlertTriangle, CheckCircle2, FileText } from 'lucide-react';

const COLORS = ['#0ea5e9','#22c55e','#ef4444','#f59e0b','#8b5cf6','#14b8a6','#e11d48','#64748b'];

export default function CRM() {
  const today = new Date().toISOString().slice(0,10);
  const thirtyAgo = new Date(Date.now() - 29 * 24 * 3600 * 1000).toISOString().slice(0,10);

  const [range, setRange] = useState({ from: thirtyAgo, to: today, granularity:'day' });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await optoApi.analytics(range);
      setData(data);
    } finally { setLoading(false); }
  };
  useEffect(()=>{ fetchData(); }, [range.from, range.to, range.granularity]);

  const serie = data?.charts?.serie || [];
  const estados = (data?.charts?.byEstado || []).map((x,i)=>({ name: x.estado, value: +x.n }));
  const motivos = data?.charts?.topMotivos || [];
  const productividad = data?.charts?.productividad || [];

  return (
    <div style={{ maxWidth: 1200, margin:'0 auto', padding:'24px 20px', display:'grid', gap:18 }}>
      {/* Filtros */}
      <div className="card" style={{ borderRadius:14, padding:14, display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:12 }}>
        <div style={{ gridColumn:'1 / 4' }}>
          <label className="subtitle">Rango</label>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <input type="date" value={range.from} onChange={e=>setRange(r=>({...r, from:e.target.value}))} className="input"/>
            <input type="date" value={range.to}   onChange={e=>setRange(r=>({...r, to:e.target.value}))}   className="input"/>
          </div>
        </div>
        <div>
          <label className="subtitle">Granularidad</label>
          <select value={range.granularity} onChange={e=>setRange(r=>({...r, granularity:e.target.value}))} className="input">
            <option value="day">Día</option>
            <option value="month">Mes</option>
          </select>
        </div>
        <div style={{ alignSelf:'end' }}>
          <button className="btn" onClick={fetchData} style={{ width:'100%' }}>Actualizar</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:12 }}>
        <Kpi icon={<Calendar size={18}/>}     label="Citas"           value={data?.kpis?.citas_total}/>
        <Kpi icon={<CheckCircle2 size={18}/>} label="Completadas"     value={data?.kpis?.citas_completadas}/>
        <Kpi icon={<AlertTriangle size={18}/>}label="No show %"       value={`${data?.kpis?.tasa_noshow_pct ?? 0}%`}/>
        <Kpi icon={<TrendingUp size={18}/>}   label="Con receta %"     value={`${data?.kpis?.tasa_con_receta_pct ?? 0}%`}/>
        <Kpi icon={<Clock size={18}/>}        label="Min atendidos"   value={data?.kpis?.minutos_atendidos}/>
        <Kpi icon={<Users size={18}/>}        label="Pacientes nuevos" value={data?.kpis?.pacientes_nuevos}/>
      </div>

      {/* Gráficos */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:12 }}>
        {/* Serie temporal */}
        <div className="card" style={{ borderRadius:14, padding:14 }}>
          <h3 style={{ marginTop:0, display:'flex', alignItems:'center', gap:8 }}>
            <TrendingUp size={18}/> Tendencia de citas
          </h3>
          <div style={{ height:300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={serie}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bucket" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#0ea5e9" name="Total"/>
                <Line type="monotone" dataKey="confirmadas" stroke="#22c55e" name="Confirmadas"/>
                <Line type="monotone" dataKey="completadas" stroke="#16a34a" name="Completadas"/>
                <Line type="monotone" dataKey="canceladas" stroke="#ef4444" name="Canceladas"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Estados (pie) */}
        <div className="card" style={{ borderRadius:14, padding:14 }}>
          <h3 style={{ marginTop:0 }}>Distribución por estado</h3>
          <div style={{ height:300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={estados} dataKey="value" nameKey="name" outerRadius={90} label>
                  {estados.map((entry, index) => (
                    <Cell key={`c-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Barras: Top motivos & Productividad */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div className="card" style={{ borderRadius:14, padding:14 }}>
          <h3 style={{ marginTop:0, display:'flex', alignItems:'center', gap:8 }}>
            <FileText size={18}/> Motivos más frecuentes
          </h3>
          <div style={{ height:280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={motivos}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="motivo" interval={0} angle={-20} textAnchor="end" height={60}/>
                <YAxis />
                <Tooltip />
                <Bar dataKey="n" name="Citas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ borderRadius:14, padding:14 }}>
          <h3 style={{ marginTop:0 }}>Productividad (min/día)</h3>
          <div style={{ height:280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productividad}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bucket" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="minutos" name="Minutos"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon, label, value }) {
  return (
    <div className="card" style={{ borderRadius:14, padding:14, display:'grid', gap:4 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, opacity:.8 }}>{icon}{label}</div>
      <div style={{ fontSize:24, fontWeight:700 }}>{value ?? '—'}</div>
    </div>
  );
}
