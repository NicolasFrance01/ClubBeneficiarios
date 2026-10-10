import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Shield, Plus, UserX, Edit2 } from 'lucide-react';

const SystemUsers = () => {
  const { data, addUser, updateUser, removeUser, activeUser } = useContext(AppContext);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  const [newUser, setNewUser] = useState({ 
    id: null, name: '', role: 'Fundador', email: '', password: '', needsPasswordChange: true 
  });

  const handleEdit = (u) => {
    setNewUser({ ...u });
    setEditingUser(u.id);
    setShowModal(true);
  };

  const handleSave = () => {
    if (newUser.name.trim() && newUser.email.trim()) {
      if (editingUser) {
        updateUser(editingUser, newUser);
      } else {
        // Enforce password when creating
        if (!newUser.password.trim()) {
          alert('Debes asignar una contraseña por defecto.');
          return;
        }
        addUser({ ...newUser, needsPasswordChange: true });
      }
      setShowModal(false);
      setNewUser({ id: null, name: '', role: 'Fundador', email: '', password: '', needsPasswordChange: true });
      setEditingUser(null);
    }
  };

  return (
    <div className="system-users-page">
      <div className="flex-between mb-6">
        <div>
          <h1>Fundadores y Administradores</h1>
          <p>Gestión de usuarios del sistema Atlascore</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setEditingUser(null);
          setNewUser({ id: null, name: '', role: 'Fundador', email: '', password: '', needsPasswordChange: true });
          setShowModal(true);
        }}>
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
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
                {user.name} {activeUser?.id === user.id && <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 'normal', marginLeft: '0.5rem' }}>(Tú)</span>}
              </h3>
              <p style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 500, margin: '0.25rem 0' }}>{user.role}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>{user.email}</p>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                style={{ background: 'none', border: 'none', padding: '0.5rem', color: 'var(--primary)', cursor: 'pointer' }}
                onClick={() => handleEdit(user)}
                title="Editar usuario"
              >
                <Edit2 size={18} />
              </button>
              {activeUser?.id !== user.id && (
                <button 
                  style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', padding: '0.5rem', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', cursor: 'pointer' }}
                  onClick={() => removeUser(user.id)}
                  title="Eliminar usuario"
                >
                  <UserX size={18} />
                </button>
              )}
            </div>
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
        }} onClick={() => {
          setEditingUser(null);
          setNewUser({ id: null, name: '', role: 'Fundador', email: '', password: '', needsPasswordChange: true });
          setShowModal(true);
        }}>
          <Plus size={32} color="var(--text-muted)" />
          <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Agregar Fundador</span>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '450px' }}>
            <h2 className="mb-4">{editingUser ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}</h2>
            
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

            <div className="input-group mb-4">
              <label>Correo Electrónico (Para ingresar)</label>
              <input 
                type="email" 
                className="input-field" 
                value={newUser.email} 
                onChange={e => setNewUser({...newUser, email: e.target.value})} 
                placeholder="juan@atlascore.com" 
              />
            </div>
            
            <div className="input-group mb-4">
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

            {!editingUser && (
              <div className="input-group mb-4">
                <label>Contraseña Temporal</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={newUser.password} 
                  onChange={e => setNewUser({...newUser, password: e.target.value})} 
                  placeholder="Ej. temporal123" 
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--info)', display: 'block', marginTop: '0.5rem' }}>
                  El usuario deberá cambiar esta contraseña al ingresar por primera vez.
                </span>
              </div>
            )}
            
            {editingUser && (
              <div className="input-group mb-4">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={newUser.needsPasswordChange}
                    onChange={e => setNewUser({...newUser, needsPasswordChange: e.target.checked})}
                  />
                  Forzar cambio de contraseña en próximo inicio de sesión
                </label>
              </div>
            )}

            <div className="flex-between mt-6">
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
