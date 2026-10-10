import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Shield, Plus, UserX } from 'lucide-react';

const SystemUsers = () => {
  const { data, addUser, removeUser } = useContext(AppContext);
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', role: 'Fundador' });

  const handleSave = () => {
    if (newUser.name.trim()) {
      addUser(newUser);
      setShowModal(false);
      setNewUser({ name: '', role: 'Fundador' });
    }
  };

  return (
    <div className="system-users-page">
      <div className="flex-between mb-6">
        <div>
          <h1>Fundadores y Administradores</h1>
          <p>Gestión de usuarios del sistema Atlascore</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          Nuevo Usuario
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {data.users.map(user => (
          <div key={user.id} className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000'
            }}>
              <Shield size={28} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{user.name}</h3>
              <p style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 500, margin: '0.25rem 0' }}>{user.role}</p>
            </div>
            <button 
              style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', padding: '0.5rem', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', cursor: 'pointer' }}
              onClick={() => removeUser(user.id)}
              title="Eliminar usuario"
            >
              <UserX size={18} />
            </button>
          </div>
        ))}

        <div className="glass-panel" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          flexDirection: 'column',
          gap: '1rem',
          borderStyle: 'dashed',
          cursor: 'pointer',
          opacity: 0.7,
          minHeight: '120px'
        }} onClick={() => setShowModal(true)}>
          <Plus size={32} color="var(--text-muted)" />
          <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Agregar Fundador</span>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px' }}>
            <h2 className="mb-4">Agregar Nuevo Usuario</h2>
            
            <div className="input-group mb-4">
              <label>Nombre Completo</label>
              <input 
                type="text" 
                className="input-field" 
                value={newUser.name} 
                onChange={e => setNewUser({...newUser, name: e.target.value})} 
                placeholder="Ej. Juan Perez" 
              />
            </div>
            
            <div className="input-group mb-6">
              <label>Rol / Puesto</label>
              <select 
                className="input-field" 
                value={newUser.role} 
                onChange={e => setNewUser({...newUser, role: e.target.value})}
              >
                <option value="Fundador">Fundador</option>
                <option value="Administrador">Administrador</option>
                <option value="Soporte">Soporte</option>
              </select>
            </div>

            <div className="flex-between">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave}>Guardar Usuario</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemUsers;
