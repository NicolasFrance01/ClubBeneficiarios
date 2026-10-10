import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { ShieldCheck, Lock, Mail, ArrowRight, KeyRound } from 'lucide-react';

const Login = () => {
  const { login, changePassword } = useContext(AppContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // States for password change flow
  const [requireChange, setRequireChange] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email && password) {
      const result = login(email, password);
      if (result.success) {
        // Logged in successfully
        setError('');
      } else if (result.requireChange) {
        setRequireChange(true);
        setPendingUser(result.user);
        setError('');
      } else {
        setError(result.error || 'Credenciales incorrectas.');
      }
    } else {
      setError('Por favor completa todos los campos.');
    }
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setError('Por favor completa ambos campos.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    
    changePassword(pendingUser.id, newPassword);
  };

  if (requireChange) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '3rem 2rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <div style={{ background: 'linear-gradient(135deg, var(--info), var(--primary))', padding: '1rem', borderRadius: '50%', color: '#fff' }}>
              <KeyRound size={40} />
            </div>
          </div>
          
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Cambio de Contraseña Requerido</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
            Hola {pendingUser.name}, es tu primer ingreso o un administrador restableció tu cuenta. Por seguridad, debes crear una nueva contraseña.
          </p>

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.9rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handlePasswordChange} style={{ textAlign: 'left' }}>
            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Lock size={16} /> Nueva Contraseña</label>
              <input 
                type="password" 
                className="input-field" 
                placeholder="Mínimo 6 caracteres" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div className="input-group" style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Lock size={16} /> Confirmar Contraseña</label>
              <input 
                type="password" 
                className="input-field" 
                placeholder="Vuelve a escribir la contraseña" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}>
              Guardar e Ingresar <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '3rem 2rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))', padding: '1rem', borderRadius: '50%', color: '#000' }}>
            <ShieldCheck size={40} />
          </div>
        </div>
        
        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Bienvenido a Atlascore</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Portal exclusivo para Fundadores</p>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.9rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div className="input-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Mail size={16} /> Correo Electrónico</label>
            <input 
              type="email" 
              className="input-field" 
              placeholder="master@atlascore.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div className="input-group" style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Lock size={16} /> Contraseña</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}>
            Ingresar al Sistema <ArrowRight size={18} />
          </button>
        </form>

        <p style={{ marginTop: '2rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          © 2026 Atlascore Beneficios Fitness. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};

export default Login;
