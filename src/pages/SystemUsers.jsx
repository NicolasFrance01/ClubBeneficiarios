import React, { useState } from 'react';
import { initialData } from '../store';
import { Shield, Plus, UserX } from 'lucide-react';

const SystemUsers = () => {
  const [users, setUsers] = useState(initialData.users);

  return (
    <div className="system-users-page">
      <div className="flex-between mb-6">
        <div>
          <h1>Fundadores y Administradores</h1>
          <p>Gestión de usuarios del sistema Atlascore</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={18} />
          Nuevo Usuario
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {users.map(user => (
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
            <button style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', padding: '0.5rem', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', cursor: 'pointer' }}>
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
        }}>
          <Plus size={32} color="var(--text-muted)" />
          <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Agregar Fundador</span>
        </div>
      </div>
    </div>
  );
};

export default SystemUsers;
