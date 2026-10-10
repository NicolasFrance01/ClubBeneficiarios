import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Plus, Edit2, Trash2, Camera, Clock, Check } from 'lucide-react';

const Beneficiaries = () => {
  const { data, addBeneficiary, toggleBeneficiaryStatus } = useContext(AppContext);
  const [showModal, setShowModal] = useState(false);
  const [newB, setNewB] = useState({ name: '', doc: '', email: '', phone: '', plan: 'silver', paymentMethod: 'efectivo', referente: '' });

  const handleSave = () => {
    addBeneficiary({
      ...newB,
      status: 'activo',
      date: new Date().toISOString().split('T')[0]
    });
    setShowModal(false);
  };

  return (
    <div className="beneficiaries-page">
      <div className="flex-between mb-6">
        <div>
          <h1>Beneficiarios</h1>
          <p>Gestión de personas inscritas al club de beneficios</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          Nuevo Beneficiario
        </button>
      </div>

      <div className="glass-panel">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Beneficiario</th>
                <th>Contacto</th>
                <th>Plan</th>
                <th>Ingresado por</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.beneficiaries.map(b => {
                const plan = data.plans.find(p => p.id === b.plan) || { name: b.plan, id: b.plan };
                return (
                  <tr key={b.id} style={{ opacity: b.status === 'inactivo' ? 0.5 : 1 }}>
                    <td>
                      <div>
                        <strong style={{ display: 'block', color: 'var(--text-main)' }}>{b.name}</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>DNI: {b.doc}</span>
                      </div>
                    </td>
                    <td>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.9rem' }}>{b.email}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{b.phone}</span>
                      </div>
                    </td>
                    <td><span className={`badge badge-${plan.id}`}>{plan.name}</span></td>
                    <td>{b.referente || b.referredBy || '-'}</td>
                    <td>
                      <span className={`badge`} style={{ 
                        background: b.status === 'activo' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: b.status === 'activo' ? 'var(--success)' : 'var(--danger)',
                        border: `1px solid ${b.status === 'activo' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                      }}>
                        {b.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button style={{ background: 'none', border: 'none', color: 'var(--info)', cursor: 'pointer', padding: '0.25rem' }} title="Historial Transacciones">
                          <Clock size={18} />
                        </button>
                        <button style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0.25rem' }} title="Editar">
                          <Edit2 size={18} />
                        </button>
                        <button style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.25rem' }} title={b.status === 'activo' ? "Dar de baja" : "Dar de alta"} onClick={() => toggleBeneficiaryStatus(b.id)}>
                          {b.status === 'activo' ? <Trash2 size={18} /> : <Check size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 className="mb-4">Agregar Beneficiario</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label>Nombre Completo</label>
                <input type="text" className="input-field" value={newB.name} onChange={e => setNewB({...newB, name: e.target.value})} placeholder="Ej. Nicolas France" />
              </div>
              <div className="input-group">
                <label>Documento (DNI)</label>
                <input type="text" className="input-field" value={newB.doc} onChange={e => setNewB({...newB, doc: e.target.value})} placeholder="Ej. 12345678" />
              </div>
              <div className="input-group">
                <label>Email</label>
                <input type="email" className="input-field" value={newB.email} onChange={e => setNewB({...newB, email: e.target.value})} placeholder="correo@ejemplo.com" />
              </div>
              <div className="input-group">
                <label>Teléfono</label>
                <input type="text" className="input-field" value={newB.phone} onChange={e => setNewB({...newB, phone: e.target.value})} placeholder="Ej. 351..." />
              </div>
              
              <div className="input-group">
                <label>Plan</label>
                <select className="input-field" value={newB.plan} onChange={e => setNewB({...newB, plan: e.target.value})}>
                  {data.plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>Método de Pago</label>
                <select className="input-field" value={newB.paymentMethod} onChange={e => setNewB({...newB, paymentMethod: e.target.value})}>
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                </select>
              </div>
              
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label>Ingresado Por (Referente)</label>
                <input type="text" className="input-field" value={newB.referente} onChange={e => setNewB({...newB, referente: e.target.value})} placeholder="Ej. Nicolas" />
              </div>

              <div className="input-group">
                <label>Foto DNI Frente</label>
                <div style={{ border: '1px dashed var(--border-strong)', padding: '2rem', textAlign: 'center', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: 'rgba(0,0,0,0.2)' }}>
                  <Camera size={24} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem' }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Subir imagen</span>
                </div>
              </div>
              <div className="input-group">
                <label>Foto DNI Dorso</label>
                <div style={{ border: '1px dashed var(--border-strong)', padding: '2rem', textAlign: 'center', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: 'rgba(0,0,0,0.2)' }}>
                  <Camera size={24} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem' }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Subir imagen</span>
                </div>
              </div>
            </div>
            <div className="flex-between mt-6">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave}>Guardar Beneficiario</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Beneficiaries;
