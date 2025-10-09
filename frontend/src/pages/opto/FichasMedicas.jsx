import React, { useEffect, useMemo, useRef, useState } from 'react';
import { optoApi } from '../../services/optoApi';
import Modal from '../../components/Modal';

export default function FichasMedicas() {
  const [pacientes, setPacientes] = useState([]);
  const [selPaciente, setSelPaciente] = useState('');
  const [q, setQ] = useState('');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null); // ficha en edición o null
  const [form, setForm] = useState(defaultForm());

  function defaultForm() {
    return {
      id_paciente: '',
      ocupacion: '',
      usa_anteojos: 0,
      usa_anteojos_prev: 0,
      graduacion_od_prev: '',
      graduacion_oi_prev: '',
      cefalea: 0, ardor_ocular: 0, prurito: 0, es_diabetico: 0,
      dolor_ocular: 0, epifora: 0, moscas_volantes: 0, es_hipertenso: 0,
      fotofobia: 0, sombras: 0, halos: 0, hay_embarazo: 0,
      antecedentes_familiares: '',
      tratamiento_actual: '',
      agudeza_sc_od: '', agudeza_sc_oi: '',
      agudeza_cc_od: '', agudeza_cc_oi: '',
      oftalmoscopia_nl: 0, oftalmoscopia_no_normal: 0,
      consideraciones_od: '', consideraciones_oi: '',
      retinoscopia_od: '', retinoscopia_oi: '',
      test_bicromatico_s: 0, test_bicromatico_n: 0,
      cilindros_cruzados_s: 0, cilindros_cruzados_n: 0,
      baston_madox_s: 0, baston_madox_n: 0,
      forias: '', tropias: '',
      grad_final_ld_od: '', grad_final_ld_oi: '',
      grad_final_add_od: '', grad_final_add_oi: '',
      tratamiento_diagnostico: '',
      activo: 1,
    };
  }

  // Combobox pacientes
  async function loadPacientes() {
    const { data } = await optoApi.pacientesList('');
    setPacientes(data.data || []);
  }

  async function loadList() {
    setLoading(true);
    try {
      const params = {};
      if (selPaciente) params.paciente = selPaciente;
      if (q) params.q = q;
      const { data } = await optoApi.fichasList(params);
      setList(data.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPacientes(); }, []);
  useEffect(() => { loadList(); }, [selPaciente]);

  const pacMap = useMemo(() => {
    const m = new Map();
    pacientes.forEach(p => m.set(String(p.id_paciente), p));
    return m;
  }, [pacientes]);

  function onNew() {
    const f = defaultForm();
    f.id_paciente = selPaciente || '';
    setForm(f);
    setEditing(null);
    setOpenForm(true);
  }

  function onEdit(row) {
    setEditing(row);
    const f = { ...defaultForm(), ...row };
    f.id_paciente = row.id_paciente;
    setForm(f);
    setOpenForm(true);
  }

  async function onSave(e) {
    e.preventDefault(); // evita submit/blur indeseado
    if (!form.id_paciente) return alert('Selecciona paciente');
    const { activo, id_ficha, ...payload } = form;
    try {
      if (editing) {
        await optoApi.fichaUpdate(editing.id_ficha, payload);
      } else {
        await optoApi.fichaCreate(payload);
      }
      setOpenForm(false);
      await loadList();
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo guardar');
    }
  }

  async function onToggle(row) {
    try {
      await optoApi.fichaToggle(row.id_ficha, row.activo ? 0 : 1);
      await loadList();
    } catch (err) {
      alert('No se pudo cambiar el estado');
    }
  }

  // 🔽 Exporta con PDF del backend (abre pestaña nueva)
  async function onExport(row) {
    try {
      const { data } = await optoApi.fichaPdfBlob(row.id_ficha);
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      // Si prefieres descarga directa:
      // const a = document.createElement('a');
      // a.href = url; a.download = `ficha_${row.id_ficha}.pdf`; a.click();
      // URL.revokeObjectURL(url);
    } catch (e) {
      alert('No se pudo generar el PDF');
    }
  }

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-heading)', marginTop: 0 }}>Fichas Médicas</h2>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={selPaciente} onChange={(e)=>setSelPaciente(e.target.value)} style={{ padding: 8, borderRadius: 8 }}>
          <option value="">— Filtrar por paciente —</option>
          {pacientes.map(p => (
            <option key={p.id_paciente} value={p.id_paciente}>
              {p.nombres} {p.apellidos}
            </option>
          ))}
        </select>
        <input
          placeholder="Buscar (diagnóstico/nombre)"
          value={q}
          onChange={(e)=>setQ(e.target.value)}
          onKeyDown={(e)=> e.key==='Enter' && loadList()}
          style={{ padding: 8, borderRadius: 8, minWidth: 260 }}
        />
        <button className="btn" onClick={loadList}>Buscar</button>
        <button className="btn" onClick={onNew} style={{ background: 'var(--color-azul-turquesa)', color: '#fff' }}>
          + Nueva ficha
        </button>
      </div>

      <div style={{ marginTop: 16 }}>
        {loading ? <p>Cargando…</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                <th style={{ padding: 8 }}>#</th>
                <th style={{ padding: 8 }}>Paciente</th>
                <th style={{ padding: 8 }}>Diagnóstico / Tratamiento</th>
                <th style={{ padding: 8 }}>Estado</th>
                <th style={{ padding: 8, width: 260 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list.map(row => (
                <tr key={row.id_ficha} style={{ borderBottom: '1px solid #f2f2f2' }}>
                  <td style={{ padding: 8 }}>{row.id_ficha}</td>
                  <td style={{ padding: 8 }}>{row.paciente_nombre}</td>
                  <td style={{ padding: 8 }}>{row.tratamiento_diagnostico?.slice(0, 90) || '—'}</td>
                  <td style={{ padding: 8 }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 999,
                      background: row.activo ? '#E8F7EE' : '#FBECEC',
                      color: row.activo ? '#18794E' : '#B61E1E',
                      fontSize: 12
                    }}>
                      {row.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="btn" onClick={()=>onEdit(row)}>Editar</button>
                    <button className="btn" onClick={()=>onExport(row)}>Exportar PDF</button>
                    <button className="btn" onClick={()=>onToggle(row)} style={{ background: '#eee' }}>
                      {row.activo ? 'Inhabilitar' : 'Habilitar'}
                    </button>
                  </td>
                </tr>
              ))}
              {!list.length && !loading && (
                <tr><td colSpan={5} style={{ padding: 16, opacity: .7 }}>Sin resultados</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal crear/editar */}
      <Modal
        open={openForm}
        onClose={()=>setOpenForm(false)}
        title={editing ? `Editar ficha #${editing.id_ficha}` : 'Nueva ficha médica'}
        footer={(
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn" onClick={()=>setOpenForm(false)} style={{ background: '#eee' }}>Cancelar</button>
            <button className="btn" onClick={onSave} style={{ background: 'var(--color-amarillo-optica)' }}>
              Guardar
            </button>
          </div>
        )}
      >
        {/* 🔽 Contenedor con scroll interno para evitar “saltos” y permitir bajar */}
        <div style={{ maxHeight: '65vh', overflow: 'auto', paddingRight: 6 }}>
          <form
            onSubmit={onSave}
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
          >
            {/* Paciente */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="subtitle">Paciente</label>
              <select
                value={form.id_paciente}
                onChange={(e)=>setForm({ ...form, id_paciente: e.target.value })}
                required
                style={{ width: '100%', padding: 8, borderRadius: 8 }}
              >
                <option value="">— Selecciona —</option>
                {pacientes.map(p => (
                  <option key={p.id_paciente} value={p.id_paciente}>
                    {p.nombres} {p.apellidos}
                  </option>
                ))}
              </select>
            </div>

            {/* Ocupación + anteojos */}
            <div>
              <label className="subtitle">Ocupación</label>
              <input
                type="text"
                value={form.ocupacion}
                onChange={(e)=>setForm({ ...form, ocupacion: e.target.value })}
              />
            </div>
            <div>
              <label className="subtitle">Anteojos</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <label><input type="checkbox" checked={!!form.usa_anteojos} onChange={(e)=>setForm({ ...form, usa_anteojos: e.target.checked?1:0 })}/> Usa</label>
                <label><input type="checkbox" checked={!!form.usa_anteojos_prev} onChange={(e)=>setForm({ ...form, usa_anteojos_prev: e.target.checked?1:0 })}/> No usa ant.</label>
              </div>
            </div>

            {/* Graduación previa */}
            <div>
              <label className="subtitle">Graduación O.D. (20/…)</label>
              <input type="text" value={form.graduacion_od_prev} onChange={(e)=>setForm({ ...form, graduacion_od_prev: e.target.value })}/>
            </div>
            <div>
              <label className="subtitle">Graduación O.I. (20/…)</label>
              <input type="text" value={form.graduacion_oi_prev} onChange={(e)=>setForm({ ...form, graduacion_oi_prev: e.target.value })}/>
            </div>

            {/* Síntomas */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="subtitle">Síntomas</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(120px,1fr))', gap: 10 }}>
                {[
                  ['cefalea','Cefalea'],['ardor_ocular','Ardor ocular'],['prurito','Prurito (picor)'],['es_diabetico','Es diabético'],
                  ['dolor_ocular','Dolor ocular'],['epifora','Epífora'],['moscas_volantes','Moscas volantes'],['es_hipertenso','Es hipertenso'],
                  ['fotofobia','Fotofobia'],['sombras','Sombras'],['halos','Halos'],['hay_embarazo','Hay embarazo']
                ].map(([k,label])=>(
                  <label key={k}><input type="checkbox" checked={!!form[k]} onChange={(e)=>setForm({ ...form, [k]: e.target.checked?1:0 })}/> {label}</label>
                ))}
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label className="subtitle">Antecedentes familiares</label>
              <textarea value={form.antecedentes_familiares} onChange={(e)=>setForm({ ...form, antecedentes_familiares: e.target.value })}/>
            </div>

            {/* Otros */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="subtitle">Tratamiento actual</label>
              <textarea value={form.tratamiento_actual} onChange={(e)=>setForm({ ...form, tratamiento_actual: e.target.value })}/>
            </div>

            <div>
              <label className="subtitle">Agudeza s/c O.D.</label>
              <input type="text" value={form.agudeza_sc_od} onChange={(e)=>setForm({ ...form, agudeza_sc_od: e.target.value })}/>
            </div>
            <div>
              <label className="subtitle">Agudeza s/c O.I.</label>
              <input type="text" value={form.agudeza_sc_oi} onChange={(e)=>setForm({ ...form, agudeza_sc_oi: e.target.value })}/>
            </div>
            <div>
              <label className="subtitle">Agudeza c/c ant. O.D.</label>
              <input type="text" value={form.agudeza_cc_od} onChange={(e)=>setForm({ ...form, agudeza_cc_od: e.target.value })}/>
            </div>
            <div>
              <label className="subtitle">Agudeza c/c ant. O.I.</label>
              <input type="text" value={form.agudeza_cc_oi} onChange={(e)=>setForm({ ...form, agudeza_cc_oi: e.target.value })}/>
            </div>

            {/* Oftalmoscopia */}
            <div>
              <label className="subtitle">Oftalmoscopia</label>
              <div>
                <label><input type="checkbox" checked={!!form.oftalmoscopia_nl} onChange={(e)=>setForm({ ...form, oftalmoscopia_nl: e.target.checked?1:0 })}/> N.L.</label>{' '}
                <label><input type="checkbox" checked={!!form.oftalmoscopia_no_normal} onChange={(e)=>setForm({ ...form, oftalmoscopia_no_normal: e.target.checked?1:0 })}/> No normal</label>
              </div>
            </div>
            <div />

            <div>
              <label className="subtitle">Consid. O.D.</label>
              <input type="text" value={form.consideraciones_od} onChange={(e)=>setForm({ ...form, consideraciones_od: e.target.value })}/>
            </div>
            <div>
              <label className="subtitle">Consid. O.I.</label>
              <input type="text" value={form.consideraciones_oi} onChange={(e)=>setForm({ ...form, consideraciones_oi: e.target.value })}/>
            </div>

            {/* Retinoscopia */}
            <div>
              <label className="subtitle">Retinoscopia O.D.</label>
              <input type="text" value={form.retinoscopia_od} onChange={(e)=>setForm({ ...form, retinoscopia_od: e.target.value })}/>
            </div>
            <div>
              <label className="subtitle">Retinoscopia O.I.</label>
              <input type="text" value={form.retinoscopia_oi} onChange={(e)=>setForm({ ...form, retinoscopia_oi: e.target.value })}/>
            </div>

            {/* Subjetivo */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="subtitle">Tests</label>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <CheckPair form={form} setForm={setForm} yes="test_bicromatico_s" no="test_bicromatico_n" label="Test Bicromático" />
                <CheckPair form={form} setForm={setForm} yes="cilindros_cruzados_s" no="cilindros_cruzados_n" label="Cilindros Cruzados" />
                <CheckPair form={form} setForm={setForm} yes="baston_madox_s" no="baston_madox_n" label="Bastón de Madox" />
              </div>
            </div>

            <div>
              <label className="subtitle">Forias</label>
              <input type="text" value={form.forias} onChange={(e)=>setForm({ ...form, forias: e.target.value })}/>
            </div>
            <div>
              <label className="subtitle">Tropias</label>
              <input type="text" value={form.tropias} onChange={(e)=>setForm({ ...form, tropias: e.target.value })}/>
            </div>

            {/* Graduación final */}
            <div>
              <label className="subtitle">Grad. Final L.D. O.D.</label>
              <input type="text" value={form.grad_final_ld_od} onChange={(e)=>setForm({ ...form, grad_final_ld_od: e.target.value })}/>
            </div>
            <div>
              <label className="subtitle">Grad. Final L.D. O.I.</label>
              <input type="text" value={form.grad_final_ld_oi} onChange={(e)=>setForm({ ...form, grad_final_ld_oi: e.target.value })}/>
            </div>
            <div>
              <label className="subtitle">ADD Visión cercana O.D.</label>
              <input type="text" value={form.grad_final_add_od} onChange={(e)=>setForm({ ...form, grad_final_add_od: e.target.value })}/>
            </div>
            <div>
              <label className="subtitle">ADD Visión cercana O.I.</label>
              <input type="text" value={form.grad_final_add_oi} onChange={(e)=>setForm({ ...form, grad_final_add_oi: e.target.value })}/>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label className="subtitle">Tratamiento y diagnóstico</label>
              <textarea value={form.tratamiento_diagnostico} onChange={(e)=>setForm({ ...form, tratamiento_diagnostico: e.target.value })}/>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}

function CheckPair({ form, setForm, yes, no, label }) {
  return (
    <div>
      <div style={{ fontSize: 12, marginBottom: 4 }}>{label}</div>
      <label style={{ marginRight: 10 }}>
        <input
          type="checkbox"
          checked={!!form[yes]}
          onChange={(e)=>setForm({ ...form, [yes]: e.target.checked?1:0, [no]: 0 })}
        /> Sí
      </label>
      <label>
        <input
          type="checkbox"
          checked={!!form[no]}
          onChange={(e)=>setForm({ ...form, [no]: e.target.checked?1:0, [yes]: 0 })}
        /> No
      </label>
    </div>
  );
}
