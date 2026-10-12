import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Plus, Edit2, Trash2, Camera, Clock, Check, Loader, X, Search, ArrowDown, ArrowUp } from 'lucide-react';
import { upload } from '@vercel/blob/client';

const Beneficiaries = () => {
  const { data, addBeneficiary, updateBeneficiary, toggleBeneficiaryStatus, removeBeneficiary, addReferent } = useContext(AppContext);
  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedUserHistory, setSelectedUserHistory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [newB, setNewB] = useState({ id: null, name: '', doc: '', email: '', phone: '', plan: 'silver', paymentMethod: 'efectivo', referente: '', foto_frente: '', foto_dorso: '' });
  const [uploadingFrente, setUploadingFrente] = useState(false);
  const [uploadingDorso, setUploadingDorso] = useState(false);

  const handleEdit = (b) => {
    setNewB({
      id: b.id,
      name: b.name,
      doc: b.doc,
      email: b.email || '',
      phone: b.phone || '',
      plan: b.plan,
      paymentMethod: b.paymentMethod || 'efectivo',
      referente: b.referente || b.referredBy || '',
      foto_frente: b.foto_frente || '',
      foto_dorso: b.foto_dorso || ''
    });
    setShowModal(true);
  };

  const handleSave = () => {
    const refName = (newB.referente || '').trim();
    if (refName) {
      const exists = (data.referents || []).some(r => r.name.toLowerCase() === refName.toLowerCase());
      if (!exists && addReferent) {
        addReferent({
          name: refName,
          commissionType: 'ingreso',
          commissionMonths: 1,
          commissionAmount: 2500,
          status: 'activo'
        });
      }
    }

    if (newB.id) {
      updateBeneficiary(newB.id, newB);
    } else {
      addBeneficiary({
        ...newB,
        status: 'activo',
        date: new Date().toISOString().split('T')[0]
      });
    }
    setShowModal(false);
    setNewB({ id: null, name: '', doc: '', email: '', phone: '', plan: 'silver', paymentMethod: 'efectivo', referente: '', foto_frente: '', foto_dorso: '' });
  };

  const handleViewHistory = (b) => {
    const userTxs = (data.transactions || []).filter(tx => tx.beneficiary.toLowerCase() === b.name.toLowerCase());
    setSelectedUserHistory({ user: b, transactions: userTxs });
    setShowHistoryModal(true);
  };

  const handleUploadDni = async (e, side) => {
    const file = e.target.files[0];
    if (!file) return;

    if (side === 'frente') setUploadingFrente(true);
    else setUploadingDorso(true);

    try {
      const newBlob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
      });
      
      setNewB(prev => ({ ...prev, [side === 'frente' ? 'foto_frente' : 'foto_dorso']: newBlob.url }));
    } catch (error) {
      console.error("Error al subir archivo:", error);
      alert("Error al subir la imagen: " + (error.message || error));
    } finally {
      if (side === 'frente') setUploadingFrente(false);
      else setUploadingDorso(false);
    }
  };

  const filteredBeneficiaries = data.beneficiaries.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.doc.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.email && b.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    ((b.referente || b.referredBy || '').toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="beneficiaries-page">
      <div className="flex-between mb-6">
        <div>
          <h1>Beneficiarios</h1>
          <p>Gestión de personas inscritas al club de beneficios</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div className="input-group" style={{ margin: 0, width: '250px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                className="input-field" 
                placeholder="Buscar por nombre, DNI o referente..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '32px' }}
              />
            </div>
            {searchTerm && <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '0.25rem', textAlign: 'right' }}>Resultados encontrados: {filteredBeneficiaries.length}</div>}
          </div>
          <button className="btn btn-primary" onClick={() => {
            setNewB({ id: null, name: '', doc: '', email: '', phone: '', plan: 'silver', paymentMethod: 'efectivo', referente: '', foto_frente: '', foto_dorso: '' });
            setShowModal(true);
          }}>
            <Plus size={18} />
            Nuevo
          </button>
        </div>
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
              {filteredBeneficiaries.map(b => {
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
                        <button style={{ background: 'none', border: 'none', color: 'var(--info)', cursor: 'pointer', padding: '0.25rem' }} title="Historial Transacciones" onClick={() => handleViewHistory(b)}>
                          <Clock size={18} />
                        </button>
                        <button style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0.25rem' }} title="Editar" onClick={() => handleEdit(b)}>
                          <Edit2 size={18} />
                        </button>
                        <button 
                          style={{ background: 'none', border: 'none', color: b.status === 'activo' ? 'var(--danger)' : 'var(--success)', cursor: 'pointer', padding: '0.25rem' }} 
                          title={b.status === 'activo' ? "Dar de baja" : "Dar de alta"} 
                          onClick={() => toggleBeneficiaryStatus(b.id)}
                        >
                          {b.status === 'activo' ? <ArrowDown size={18} /> : <ArrowUp size={18} />}
                        </button>
                        <button 
                          style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.25rem' }} 
                          title="Eliminar Beneficiario" 
                          onClick={() => {
                            if(window.confirm('¿Estás seguro de eliminar este beneficiario por completo?')) {
                              removeBeneficiary(b.id);
                            }
                          }}
                        >
                          <Trash2 size={18} />
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
                <input type="text" list="referentes-list" className="input-field" value={newB.referente} onChange={e => setNewB({...newB, referente: e.target.value})} placeholder="Ej. Nicolas" />
                <datalist id="referentes-list">
                  {Array.from(new Set([
                    ...(data.referents || []).map(r => r.name),
                    ...data.beneficiaries.map(b => b.referente || b.referredBy)
                  ].filter(Boolean))).map(ref => (
                    <option key={ref} value={ref} />
                  ))}
                </datalist>
              </div>

              <div className="input-group">
                <label>Foto DNI Frente</label>
                <label style={{ border: '1px dashed var(--border-strong)', padding: '1rem', textAlign: 'center', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: 'rgba(0,0,0,0.2)' }}>
                  <input type="file" style={{ display: 'none' }} accept="image/*" onChange={(e) => handleUploadDni(e, 'frente')} disabled={uploadingFrente} />
                  {uploadingFrente ? <Loader className="spin" size={24} color="var(--primary)" style={{ margin: '0 auto 0.5rem' }} /> : newB.foto_frente ? <img src={newB.foto_frente} alt="DNI Frente" style={{ maxWidth: '100%', maxHeight: '60px', objectFit: 'contain' }} /> : <Camera size={24} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem' }} />}
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>{newB.foto_frente ? 'Cambiar imagen' : 'Subir DNI Frente'}</span>
                </label>
              </div>
              <div className="input-group">
                <label>Foto DNI Dorso</label>
                <label style={{ border: '1px dashed var(--border-strong)', padding: '1rem', textAlign: 'center', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: 'rgba(0,0,0,0.2)' }}>
                  <input type="file" style={{ display: 'none' }} accept="image/*" onChange={(e) => handleUploadDni(e, 'dorso')} disabled={uploadingDorso} />
                  {uploadingDorso ? <Loader className="spin" size={24} color="var(--primary)" style={{ margin: '0 auto 0.5rem' }} /> : newB.foto_dorso ? <img src={newB.foto_dorso} alt="DNI Dorso" style={{ maxWidth: '100%', maxHeight: '60px', objectFit: 'contain' }} /> : <Camera size={24} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem' }} />}
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>{newB.foto_dorso ? 'Cambiar imagen' : 'Subir DNI Dorso'}</span>
                </label>
              </div>
            </div>
            <div className="flex-between mt-6">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={uploadingFrente || uploadingDorso}>Guardar Beneficiario</button>
            </div>
          </div>
        </div>
      )}

      {showHistoryModal && selectedUserHistory && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex-between mb-4">
              <h2 style={{ margin: 0 }}>Historial: {selectedUserHistory.user.name}</h2>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setShowHistoryModal(false)}>
                <X size={24} />
              </button>
            </div>
            
            {selectedUserHistory.transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                <Clock size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                <p>No hay transacciones registradas para este beneficiario.</p>
              </div>
            ) : (
              <div className="table-container" style={{ margin: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Detalle</th>
                      <th>Método</th>
                      <th>Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedUserHistory.transactions.slice().reverse().map(tx => (
                      <tr key={tx.id}>
                        <td style={{ fontSize: '0.85rem' }}>{tx.date}</td>
                        <td>{tx.details}</td>
                        <td style={{ textTransform: 'capitalize' }}>{tx.method}</td>
                        <td style={{ fontWeight: 600, color: tx.type === 'ingreso' ? 'var(--success)' : 'var(--danger)' }}>
                          {tx.type === 'ingreso' ? '+' : '-'}${Number(tx.amount).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <button className="btn btn-outline" onClick={() => setShowHistoryModal(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Beneficiaries;
