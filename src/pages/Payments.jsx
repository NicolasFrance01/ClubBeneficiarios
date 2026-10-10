import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { calculateFinalPrice, calculateFitnessGroupCut } from '../store';
import { ArrowUpRight, ArrowDownRight, Briefcase, Landmark, Plus, Paperclip, Loader } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { upload } from '@vercel/blob/client';

const Payments = () => {
  const { data, addTransaction } = useContext(AppContext);
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [newTx, setNewTx] = useState({ 
    beneficiary: '', amount: '', type: 'ingreso', method: 'transferencia', details: 'Cuota Mensual', ref: '', comprobante_url: ''
  });
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  useEffect(() => {
    if (location.state?.prefill) {
      const b = location.state.prefill;
      const plan = data.plans.find(p => p.id === b.plan);
      const finalPrice = calculateFinalPrice(plan.basePrice, b.paymentMethod, data.commission, data.iva);
      
      setNewTx(prev => ({
        ...prev,
        beneficiary: b.name,
        amount: finalPrice,
        method: b.paymentMethod
      }));
      setShowModal(true);
    }
  }, [location.state]);

  const handleUploadReceipt = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingReceipt(true);
    try {
      const newBlob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
      });
      setNewTx(prev => ({ ...prev, comprobante_url: newBlob.url }));
    } catch (error) {
      console.error("Error subiendo comprobante:", error);
      alert("No se pudo subir el comprobante. Intenta de nuevo.");
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleSaveTx = () => {
    addTransaction({
      ...newTx,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16)
    });
    setShowModal(false);
    setNewTx({ beneficiary: '', amount: '', type: 'ingreso', method: 'transferencia', details: 'Cuota Mensual', ref: '', comprobante_url: '' });
  };

  const paymentHistory = data.transactions || [
    { id: 101, date: '2026-10-09 10:30', amount: 65000, type: 'ingreso', method: 'transferencia', beneficiary: 'Maria Gomez', details: 'Cuota Octubre', ref: 'TRX-9921', comprobante_url: '' },
    { id: 102, date: '2026-10-08 15:45', amount: 34000, type: 'ingreso', method: 'efectivo', beneficiary: 'Juan Perez', details: 'Cuota Octubre', ref: 'REC-0012', comprobante_url: '' }
  ];

  let totalTransferencia = 0;
  let totalEfectivo = 0;
  let fgTransferencia = 0;
  let fgEfectivo = 0;

  data.beneficiaries.forEach(b => {
    if (b.status === 'activo') {
      const plan = data.plans.find(p => p.id === b.plan);
      if (plan) {
        const fgCut = calculateFitnessGroupCut(plan.basePrice, b.paymentMethod, data.iva);
        if (b.paymentMethod === 'transferencia') {
          totalTransferencia += calculateFinalPrice(plan.basePrice, 'transferencia', data.commission, data.iva);
          fgTransferencia += fgCut;
        } else {
          totalEfectivo += calculateFinalPrice(plan.basePrice, 'efectivo', data.commission, data.iva);
          fgEfectivo += fgCut;
        }
      }
    }
  });

  return (
    <div className="payments-page">
      <div className="flex-between mb-6">
        <div>
          <h1>Pagos e Historial</h1>
          <p>Diferencial de ingresos y liquidaciones a Fitness Groups</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Registrar Transacción
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-panel">
          <div className="flex-between mb-4">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Landmark size={20} color="var(--info)" />
              Ingresos por Transferencia
            </h3>
            <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>${totalTransferencia.toLocaleString()}</span>
          </div>
          <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)' }}>
            <div className="flex-between mb-2" style={{ fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>A liquidar a Fitness Group (Plan + IVA)</span>
              <strong>${fgTransferencia.toLocaleString()}</strong>
            </div>
            <div className="flex-between" style={{ fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Comisión Atlascore</span>
              <strong style={{ color: 'var(--primary)' }}>${(totalTransferencia - fgTransferencia).toLocaleString()}</strong>
            </div>
          </div>
        </div>

        <div className="glass-panel">
          <div className="flex-between mb-4">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Briefcase size={20} color="var(--success)" />
              Ingresos en Efectivo
            </h3>
            <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>${totalEfectivo.toLocaleString()}</span>
          </div>
          <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)' }}>
            <div className="flex-between mb-2" style={{ fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>A liquidar a Fitness Group (Solo Plan)</span>
              <strong>${fgEfectivo.toLocaleString()}</strong>
            </div>
            <div className="flex-between" style={{ fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Comisión Atlascore</span>
              <strong style={{ color: 'var(--primary)' }}>${(totalEfectivo - fgEfectivo).toLocaleString()}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel">
        <h3 className="mb-4">Historial de Transacciones</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Tipo</th>
                <th>Método</th>
                <th>Entidad / Persona</th>
                <th>Detalle</th>
                <th>Monto</th>
              </tr>
            </thead>
            <tbody>
              {paymentHistory.slice().reverse().map(tx => (
                <tr key={tx.id}>
                  <td style={{ fontSize: '0.9rem' }}>{tx.date}</td>
                  <td>
                    {tx.type === 'ingreso' 
                      ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--success)', fontSize: '0.85rem' }}><ArrowDownRight size={16}/> Ingreso</span>
                      : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--danger)', fontSize: '0.85rem' }}><ArrowUpRight size={16}/> Egreso</span>
                    }
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>{tx.method}</td>
                  <td>{tx.beneficiary}</td>
                  <td>
                    <span style={{ display: 'block' }}>{tx.details}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      Ref: {tx.ref || '-'}
                      {tx.comprobante_url && (
                        <a href={tx.comprobante_url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Paperclip size={12} /> Ver adjunto
                        </a>
                      )}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>${Number(tx.amount).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px' }}>
            <h2 className="mb-4">Registrar Transacción</h2>
            
            <div className="input-group">
              <label>Entidad / Persona</label>
              <input type="text" className="input-field" value={newTx.beneficiary} onChange={e => setNewTx({...newTx, beneficiary: e.target.value})} />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label>Tipo</label>
                <select className="input-field" value={newTx.type} onChange={e => setNewTx({...newTx, type: e.target.value})}>
                  <option value="ingreso">Ingreso</option>
                  <option value="egreso">Egreso</option>
                </select>
              </div>
              <div className="input-group">
                <label>Monto</label>
                <input type="number" className="input-field" value={newTx.amount} onChange={e => setNewTx({...newTx, amount: e.target.value})} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label>Método</label>
                <select className="input-field" value={newTx.method} onChange={e => setNewTx({...newTx, method: e.target.value})}>
                  <option value="transferencia">Transferencia</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="mixto">Mixto (Varios)</option>
                </select>
              </div>
              <div className="input-group">
                <label>Referencia / Recibo (Opcional)</label>
                <input type="text" className="input-field" value={newTx.ref} onChange={e => setNewTx({...newTx, ref: e.target.value})} />
              </div>
            </div>

            <div className="input-group mb-4">
              <label>Detalle</label>
              <input type="text" className="input-field" value={newTx.details} onChange={e => setNewTx({...newTx, details: e.target.value})} />
            </div>

            <div className="input-group mb-6">
              <label>Comprobante / Captura (Opcional)</label>
              {newTx.comprobante_url ? (
                <div style={{ position: 'relative', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-sm)', padding: '0.5rem', background: 'rgba(0,0,0,0.2)' }}>
                  {newTx.comprobante_url.toLowerCase().endsWith('.pdf') ? (
                    <a href={newTx.comprobante_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', padding: '1rem', justifyContent: 'center' }}>
                      <Paperclip size={24} /> Ver Archivo PDF Adjunto
                    </a>
                  ) : (
                    <a href={newTx.comprobante_url} target="_blank" rel="noreferrer">
                      <img src={newTx.comprobante_url} alt="Comprobante" style={{ width: '100%', maxHeight: '150px', objectFit: 'contain', borderRadius: '4px' }} />
                    </a>
                  )}
                  <label style={{ display: 'block', textAlign: 'center', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <input type="file" style={{ display: 'none' }} accept="image/*,.pdf" onChange={handleUploadReceipt} disabled={uploadingReceipt} />
                    {uploadingReceipt ? 'Subiendo...' : 'Cambiar comprobante'}
                  </label>
                </div>
              ) : (
                <label style={{ border: '1px dashed var(--border-strong)', padding: '1rem', textAlign: 'center', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: 'rgba(0,0,0,0.2)', display: 'block' }}>
                  <input type="file" style={{ display: 'none' }} accept="image/*,.pdf" onChange={handleUploadReceipt} disabled={uploadingReceipt} />
                  {uploadingReceipt ? <Loader className="spin" size={20} color="var(--primary)" style={{ margin: '0 auto 0.5rem' }} /> : <Paperclip size={20} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem' }} />}
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>
                    Adjuntar archivo...
                  </span>
                </label>
              )}
            </div>

            <div className="flex-between">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSaveTx} disabled={uploadingReceipt}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
