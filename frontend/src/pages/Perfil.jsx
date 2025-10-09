import React, { useEffect, useState, useMemo } from 'react';
import { profileApi } from '../services/profileApi';
import { useAuth } from '../context/AuthContext.jsx';

export default function Perfil() {
  const { usuario: usuarioCtx } = useAuth();
  const [me, setMe] = useState(null);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [msg, setMsg] = useState('');

  // cambio de contraseña (modal simple)
  const [step, setStep] = useState('idle'); // idle | code
  const [code, setCode] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [deadline, setDeadline] = useState(null);
  const [, tick] = useState(0);

  useEffect(() => { const t=setInterval(()=>tick(x=>x+1),1000); return ()=>clearInterval(t); },[]);
  const remaining = useMemo(() => deadline ? Math.max(0, Math.floor((deadline - Date.now())/1000)) : 0, [deadline, tick]);

  useEffect(() => {
    (async () => {
      const { data } = await profileApi.getMe();
      setMe(data.data);
      setNombre(data.data.usuario || '');
      setTelefono(data.data.telefono || '');
    })();
  }, []);

  if (!me) return <div style={{ padding: 24 }}>Cargando…</div>;

  const onSave = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await profileApi.update({ usuario: nombre, telefono });
      setMsg('Perfil actualizado.');
    } catch (err) {
      setMsg(err.response?.data?.error || 'No se pudo actualizar');
    }
  };

  const onReqPwd = async () => {
    setMsg('');
    try {
      await profileApi.reqPwd();
      setStep('code');
      setDeadline(Date.now() + 5*60*1000);
      setMsg('Te enviamos un código. Tienes 5 minutos para usarlo.');
    } catch (err) {
      setMsg(err.response?.data?.error || 'No se pudo solicitar el código');
    }
  };

  const onConfPwd = async (e) => {
    e.preventDefault();
    setMsg('');
    if (remaining <= 0) return setMsg('El código expiró, vuelve a solicitarlo.');
    if (newPass !== confirm) return setMsg('Las contraseñas no coinciden.');
    try {
      await profileApi.confPwd({ code, newPassword: newPass });
      setMsg('Contraseña actualizada. Serás redirigido al inicio en 5 segundos…');
      setTimeout(() => (window.location.href = '/'), 5000);
    } catch (err) {
      setMsg(err.response?.data?.error || 'No se pudo actualizar la contraseña');
    }
  };

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <h2 style={{ fontFamily:'var(--font-heading)' }}>Configurar perfil</h2>
      <form onSubmit={onSave} style={box}>
        <div style={grid2}>
          <label>Nombre
            <input value={nombre} onChange={(e)=>setNombre(e.target.value)} required />
          </label>
          <label>Teléfono
            <input value={telefono} onChange={(e)=>setTelefono(e.target.value)} />
          </label>
          <label style={{ gridColumn:'1 / -1' }}>Correo (solo lectura)
            <input value={me.correo} readOnly />
          </label>
        </div>
        <div style={{ display:'flex', gap:10, marginTop:12 }}>
          <button className="btn">Guardar cambios</button>
          <button type="button" className="btn" onClick={onReqPwd}>Cambiar contraseña</button>
        </div>
        {msg && <small style={{ display:'block', marginTop:8 }}>{msg}</small>}
      </form>

      {step === 'code' && (
        <form onSubmit={onConfPwd} style={{ ...box, marginTop:16 }}>
          <h3 className="subtitle" style={{ marginTop:0 }}>Confirmar cambio de contraseña</h3>
          <div style={{ fontSize:14, opacity:.8, marginBottom:8 }}>
            Tiempo restante: <b>{fmt(remaining)}</b>
          </div>
          <div style={grid2}>
            <label>Código (6 dígitos)
              <input value={code} onChange={(e)=>setCode(e.target.value)} maxLength={6} required />
            </label>
            <label>Nueva contraseña
              <input type="password" value={newPass} onChange={(e)=>setNewPass(e.target.value)} required />
            </label>
            <label>Confirmar nueva contraseña
              <input type="password" value={confirm} onChange={(e)=>setConfirm(e.target.value)} required />
            </label>
          </div>
          <button className="btn" disabled={remaining<=0}>Actualizar contraseña</button>
        </form>
      )}
    </main>
  );
}

const box = { border:'1px solid var(--color-gris-claro)', borderRadius:12, background:'#fff', padding:16 };
const grid2 = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 };
function fmt(s){ const m=String(Math.floor(s/60)).padStart(2,'0'); const ss=String(s%60).padStart(2,'0'); return `${m}:${ss}`; }
