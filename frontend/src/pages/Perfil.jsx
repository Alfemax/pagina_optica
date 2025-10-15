import React, { useEffect, useState, useMemo } from 'react';
import { profileApi } from '../services/profileApi';
import { useAuth } from '../context/AuthContext.jsx';
import { motion } from 'framer-motion';
import { User, Phone, Mail, Lock, Save, Clock, CheckCircle2, AlertCircle, Loader2, Shield } from 'lucide-react';

export default function Perfil() {
  const { usuario: usuarioCtx } = useAuth();
  const [me, setMe] = useState(null);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // cambio de contraseña (modal simple)
  const [step, setStep] = useState('idle'); // idle | code
  const [code, setCode] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [deadline, setDeadline] = useState(null);
  const [, tick] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => { 
    const t=setInterval(()=>tick(x=>x+1),1000); 
    return ()=>clearInterval(t); 
  },[]);

  const remaining = useMemo(() => 
    deadline ? Math.max(0, Math.floor((deadline - Date.now())/1000)) : 0, 
    [deadline, tick]
  );

  useEffect(() => {
    (async () => {
      try {
        const { data } = await profileApi.getMe();
        setMe(data.data);
        setNombre(data.data.usuario || '');
        setTelefono(data.data.telefono || '');
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  if (!me) return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '60vh',
      gap: 10,
    }}>
      <Loader2 className="spin" size={20} />
      <span>Cargando perfil...</span>
    </div>
  );

  const onSave = async (e) => {
    e.preventDefault();
    setMsg('');
    setLoading(true);
    try {
      await profileApi.update({ usuario: nombre, telefono });
      setMsg('✅ Perfil actualizado correctamente.');
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.error || 'No se pudo actualizar'));
    } finally {
      setLoading(false);
    }
  };

  const onReqPwd = async () => {
    setMsg('');
    setLoading(true);
    try {
      await profileApi.reqPwd();
      setStep('code');
      setDeadline(Date.now() + 5*60*1000);
      setMsg('✅ Te enviamos un código. Tienes 5 minutos para usarlo.');
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.error || 'No se pudo solicitar el código'));
    } finally {
      setLoading(false);
    }
  };

  const onConfPwd = async (e) => {
    e.preventDefault();
    setMsg('');
    if (remaining <= 0) return setMsg('⏱️ El código expiró, vuelve a solicitarlo.');
    if (newPass !== confirm) return setMsg('❌ Las contraseñas no coinciden.');
    setLoading(true);
    try {
      await profileApi.confPwd({ code, newPassword: newPass });
      setMsg('✅ Contraseña actualizada. Serás redirigido al inicio en 5 segundos…');
      setTimeout(() => (window.location.href = '/'), 5000);
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.error || 'No se pudo actualizar la contraseña'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ 
      maxWidth: 900, 
      margin: '0 auto', 
      padding: isMobile ? '16px 12px' : '24px 20px',
      position: 'relative',
    }}>
      {/* Decorative blob */}
      <div style={{
        position: 'absolute',
        width: isMobile ? 200 : 300,
        height: isMobile ? 200 : 300,
        background: 'radial-gradient(circle, rgba(14,165,233,0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        top: -50,
        right: -50,
        filter: 'blur(60px)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? 10 : 12,
          marginBottom: isMobile ? 16 : 20,
          padding: isMobile ? '12px 14px' : '16px 20px',
          background: 'linear-gradient(135deg, rgba(14,165,233,0.08) 0%, rgba(6,182,212,0.12) 100%)',
          borderRadius: isMobile ? 12 : 14,
          border: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <div style={{
          width: isMobile ? 40 : 48,
          height: isMobile ? 40 : 48,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
          display: 'grid',
          placeItems: 'center',
          color: 'white',
          fontWeight: 800,
          fontSize: isMobile ? '1.2rem' : '1.4rem',
        }}>
          {(me.usuario || 'U')[0].toUpperCase()}
        </div>
        <div>
          <h2 style={{ 
            margin: 0, 
            fontFamily:'var(--font-heading)',
            fontSize: isMobile ? '1.2rem' : '1.5rem',
          }}>
            Configurar perfil
          </h2>
          <small style={{ opacity: 0.7, fontSize: isMobile ? '0.8rem' : '0.85rem' }}>
            Gestiona tu información personal
          </small>
        </div>
      </motion.div>

      {/* Form principal */}
      <motion.form 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        onSubmit={onSave} 
        style={{
          border:'1px solid rgba(0,0,0,0.06)', 
          borderRadius: isMobile ? 14 : 16, 
          background:'linear-gradient(180deg, #ffffff 0%, #fafafa 100%)', 
          padding: isMobile ? 16 : 20,
          boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
          position: 'relative',
        }}
      >
        <div style={{ 
          display:'grid', 
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
          gap: isMobile ? 12 : 16,
        }}>
          <InputField
            icon={<User size={isMobile ? 16 : 18} />}
            label="Nombre completo"
            value={nombre}
            onChange={(e)=>setNombre(e.target.value)}
            required
            isMobile={isMobile}
          />
          <InputField
            icon={<Phone size={isMobile ? 16 : 18} />}
            label="Teléfono"
            value={telefono}
            onChange={(e)=>setTelefono(e.target.value)}
            type="tel"
            isMobile={isMobile}
          />
          <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
            <InputField
              icon={<Mail size={isMobile ? 16 : 18} />}
              label="Correo electrónico"
              value={me.correo}
              readOnly
              disabled
              isMobile={isMobile}
            />
          </div>
        </div>

        <div style={{ 
          display:'flex', 
          flexWrap: 'wrap',
          gap: isMobile ? 8 : 10, 
          marginTop: isMobile ? 14 : 16,
        }}>
          <motion.button 
            whileTap={{ scale: 0.97 }}
            className="btn"
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
              color: 'white',
              fontWeight: 700,
              boxShadow: '0 8px 20px rgba(14,165,233,0.3)',
              padding: isMobile ? '8px 14px' : '10px 16px',
              fontSize: isMobile ? '0.85rem' : '0.95rem',
            }}
          >
            {loading ? <Loader2 className="spin" size={16} /> : <Save size={16} />}
            Guardar cambios
          </motion.button>
          <motion.button 
            whileTap={{ scale: 0.97 }}
            type="button" 
            className="btn"
            onClick={onReqPwd}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
              color: 'white',
              fontWeight: 700,
              boxShadow: '0 8px 20px rgba(124,58,237,0.3)',
              padding: isMobile ? '8px 14px' : '10px 16px',
              fontSize: isMobile ? '0.85rem' : '0.95rem',
            }}
          >
            <Lock size={16} />
            Cambiar contraseña
          </motion.button>
        </div>

        {msg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ 
              marginTop: 12,
              padding: isMobile ? '10px 12px' : '12px 14px',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: msg.startsWith('✅') ? '#ecfdf5' : msg.startsWith('⏱️') ? '#fef3c7' : '#fef2f2',
              border: `1px solid ${msg.startsWith('✅') ? '#d1fae5' : msg.startsWith('⏱️') ? '#fde68a' : '#fecaca'}`,
              color: msg.startsWith('✅') ? '#065f46' : msg.startsWith('⏱️') ? '#92400e' : '#991b1b',
              fontSize: isMobile ? '0.8rem' : '0.85rem',
            }}
          >
            {msg.startsWith('✅') ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{msg}</span>
          </motion.div>
        )}
      </motion.form>

      {/* Form cambio de contraseña */}
      {step === 'code' && (
        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          onSubmit={onConfPwd} 
          style={{ 
            border:'1px solid rgba(0,0,0,0.06)', 
            borderRadius: isMobile ? 14 : 16, 
            background:'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)', 
            padding: isMobile ? 16 : 20, 
            marginTop: isMobile ? 14 : 18,
            boxShadow: '0 8px 24px rgba(124,58,237,0.15)',
          }}
        >
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 10, 
            marginBottom: isMobile ? 12 : 16,
          }}>
            <Shield size={isMobile ? 20 : 24} color="#7c3aed" />
            <h3 style={{ 
              margin: 0, 
              fontFamily: 'var(--font-heading)',
              fontSize: isMobile ? '1.1rem' : '1.3rem',
            }}>
              Confirmar cambio de contraseña
            </h3>
          </div>

          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: isMobile ? '8px 10px' : '10px 12px',
            background: remaining > 60 ? '#dbeafe' : '#fef3c7',
            borderRadius: 10,
            marginBottom: isMobile ? 12 : 14,
            fontSize: isMobile ? '0.85rem' : '0.9rem',
          }}>
            <Clock size={16} />
            <span>Tiempo restante: <b>{fmt(remaining)}</b></span>
          </div>

          <div style={{ 
            display:'grid', 
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', 
            gap: isMobile ? 12 : 14,
          }}>
            <InputField
              icon={<Shield size={isMobile ? 16 : 18} />}
              label="Código (6 dígitos)"
              value={code}
              onChange={(e)=>setCode(e.target.value)}
              maxLength={6}
              required
              isMobile={isMobile}
            />
            <InputField
              icon={<Lock size={isMobile ? 16 : 18} />}
              label="Nueva contraseña"
              type="password"
              value={newPass}
              onChange={(e)=>setNewPass(e.target.value)}
              required
              isMobile={isMobile}
            />
            <InputField
              icon={<Lock size={isMobile ? 16 : 18} />}
              label="Confirmar contraseña"
              type="password"
              value={confirm}
              onChange={(e)=>setConfirm(e.target.value)}
              required
              isMobile={isMobile}
            />
          </div>

          <motion.button 
            whileTap={{ scale: 0.97 }}
            className="btn" 
            disabled={remaining<=0 || loading}
            style={{
              marginTop: isMobile ? 12 : 14,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: remaining<=0 ? '#9ca3af' : 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
              color: 'white',
              fontWeight: 700,
              boxShadow: remaining<=0 ? 'none' : '0 8px 20px rgba(124,58,237,0.3)',
              padding: isMobile ? '10px 14px' : '12px 16px',
              fontSize: isMobile ? '0.85rem' : '0.95rem',
            }}
          >
            {loading ? <Loader2 className="spin" size={16} /> : <CheckCircle2 size={16} />}
            Actualizar contraseña
          </motion.button>
        </motion.form>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </main>
  );
}

function InputField({ icon, label, isMobile, ...props }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ 
        fontSize: isMobile ? '0.8rem' : '0.85rem', 
        fontWeight: 600,
        opacity: 0.8,
      }}>
        {label}
      </span>
      <div style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute',
          left: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'grid',
          placeItems: 'center',
          width: isMobile ? 24 : 28,
          height: isMobile ? 24 : 28,
          background: 'linear-gradient(135deg, rgba(14,165,233,0.1) 0%, rgba(6,182,212,0.15) 100%)',
          borderRadius: 8,
          color: '#0ea5e9',
        }}>
          {icon}
        </div>
        <input 
          {...props}
          style={{
            width: '100%',
            padding: isMobile ? '10px 12px 10px 44px' : '12px 14px 12px 48px',
            borderRadius: 10,
            border: '1px solid rgba(0,0,0,0.08)',
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            transition: 'all 0.2s ease',
            background: props.disabled ? '#f9fafb' : 'white',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#0ea5e9';
            e.target.style.boxShadow = '0 0 0 4px rgba(14,165,233,0.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(0,0,0,0.08)';
            e.target.style.boxShadow = 'none';
          }}
        />
      </div>
    </label>
  );
}

function fmt(s){ 
  const m=String(Math.floor(s/60)).padStart(2,'0'); 
  const ss=String(s%60).padStart(2,'0'); 
  return `${m}:${ss}`; 
}
