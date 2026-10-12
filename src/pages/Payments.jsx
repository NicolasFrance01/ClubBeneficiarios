import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { calculateFinalPrice, calculateFitnessGroupCut } from '../store';
import { ArrowUpRight, ArrowDownRight, Briefcase, Landmark, Plus, Paperclip, Loader, Search, Edit2, Trash2, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { upload } from '@vercel/blob/client';

const Payments = () => {
  const { data, addTransaction, updateTransaction, removeTransaction } = useContext(AppContext);
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const initialTx = { 
    beneficiary: '', 
    amount: '', 
    type: 'ingreso', 
    method: 'transferencia', 
    details: 'Cuota Mensual', 
    ref: '', 
    comprobante_url: '',
    date: ''
  };

  const [txForm, setTxForm] = useState(initialTx);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  useEffect(() => {
    if (location.state?.prefill) {
      const b = location.state.prefill;
      const plan = data.plans.find(p => p.id === b.plan);
      const planComm = plan ? (Number(plan.commission) || 0) : 5000;
      const finalPrice = plan ? calculateFinalPrice(plan.basePrice, b.paymentMethod, planComm, data.iva) : 0;
      
      setEditingTx(null);
      setTxForm({
        ...initialTx,
        beneficiary: b.name,
        amount: finalPrice,
        method: b.paymentMethod,
        date: new Date().toISOString().slice(0, 16)
      });
      setShowModal(true);
    }
  }, [location.state]);

  const handleOpenCreateModal = () => {
    setEditingTx(null);
    setTxForm({
      ...initialTx,
      date: new Date().toISOString().slice(0, 16)
    });
    setShowModal(true);
  };

  const handleEditTx = (tx) => {
    setEditingTx(tx);
    let dtVal = '';
    if (tx.date) {
      try {
        const d = new Date(tx.date);
        if (!isNaN(d.getTime())) {
          const pad = n => String(n).padStart(2, '0');
          dtVal = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        }
      } catch {
        dtVal = String(tx.date).slice(0, 16);
      }
    }
    setTxForm({
      beneficiary: tx.beneficiary || '',
      amount: tx.amount !== undefined ? tx.amount : '',
      type: tx.type || 'ingreso',
      method: tx.method || 'transferencia',
      details: tx.details || '',
      ref: tx.ref || '',
      comprobante_url: tx.comprobante_url || tx.comprobanteUrl || '',
      date: dtVal || new Date().toISOString().slice(0, 16)
    });
    setShowModal(true);
  };

  const handleDeleteTx = (tx) => {
    const person = tx.beneficiary || 'esta transacción';
    const amountStr = Number(tx.amount || 0).toLocaleString();
    if (window.confirm(`¿Estás seguro de eliminar el registro de "${person}" por $${amountStr}? Esta acción no se puede deshacer.`)) {
      removeTransaction(tx.id);
    }
  };

  const handleUploadReceipt = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingReceipt(true);
    try {
      const newBlob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
      });
      setTxForm(prev => ({ ...prev, comprobante_url: newBlob.url }));
    } catch (error) {
      console.error("Error subiendo comprobante:", error);
      alert("No se pudo subir el comprobante: " + (error.message || error));
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleSaveTx = () => {
    if (!txForm.beneficiary.trim()) {
      alert('Por favor indica la entidad o persona.');
      return;
    }
    if (txForm.amount === '' || isNaN(Number(txForm.amount))) {
      alert('Por favor ingresa un monto numérico válido.');
      return;
    }

    const payload = {
      beneficiary: txForm.beneficiary.trim(),
      amount: Number(txForm.amount),
      type: txForm.type,
      method: txForm.method,
      details: txForm.details.trim(),
      ref: txForm.ref.trim(),
      comprobante_url: txForm.comprobante_url || '',
      date: txForm.date ? txForm.date.replace('T', ' ') : new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    if (editingTx) {
      updateTransaction(editingTx.id, payload);
    } else {
      addTransaction(payload);
    }

    setShowModal(false);
    setEditingTx(null);
    setTxForm(initialTx);
  };

  const formatDateDisplay = (rawDate) => {
    if (!rawDate) return '-';
    try {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch {}
    return String(rawDate).replace('T', ' ').slice(0, 16);
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
        const planComm = Number(plan.commission) || 0;
        const fgCut = calculateFitnessGroupCut(plan.basePrice, b.paymentMethod, data.iva);
        if (b.paymentMethod === 'transferencia') {
          totalTransferencia += calculateFinalPrice(plan.basePrice, 'transferencia', planComm, data.iva);
          fgTransferencia += fgCut;
        } else {
          totalEfectivo += calculateFinalPrice(plan.basePrice, 'efectivo', planComm, data.iva);
          fgEfectivo += fgCut;
        }
      }
    }
  });

  const filteredHistory = paymentHistory.filter(tx => 
    (tx.beneficiary || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tx.details || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tx.ref && tx.ref.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="payments-page">
      <div className="flex-between mb-6">
        <div>
          <h1>Pagos e Historial</h1>
          <p>Diferencial de ingresos y liquidaciones a Fitness Groups</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreateModal}>
          <Plus size={18} /> Registrar Transacción
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
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
        <div className="flex-between mb-4" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: 0 }}>Historial de Transacciones</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {filteredHistory.length} transacci{filteredHistory.length === 1 ? 'ón' : 'ones'} registrada{filteredHistory.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="input-group" style={{ margin: 0, width: '300px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                className="input-field" 
                placeholder="Buscar por nombre, detalle o ref..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '32px', margin: 0 }}
              />
            </div>
          </div>
        </div>
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
                <th style={{ textAlign: 'center', width: '100px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No se encontraron transacciones con los filtros actuales.
                  </td>
                </tr>
              ) : (
                filteredHistory.map(tx => (
                  <tr key={tx.id}>
                    <td style={{ fontSize: '0.88rem', whiteSpace: 'nowrap' }}>{formatDateDisplay(tx.date)}</td>
                    <td>
                      {tx.type === 'ingreso' 
                        ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--success)', fontSize: '0.85rem' }}><ArrowDownRight size={16}/> Ingreso</span>
                        : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--danger)', fontSize: '0.85rem' }}><ArrowUpRight size={16}/> Egreso</span>
                      }
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{tx.method}</td>
                    <td><strong style={{ color: 'var(--text-main)' }}>{tx.beneficiary}</strong></td>
                    <td>
                      <span style={{ display: 'block' }}>{tx.details}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem' }}>
                        Ref: {tx.ref || '-'}
                        {tx.comprobante_url && (
                          <a href={tx.comprobante_url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Paperclip size={12} /> Ver adjunto
                          </a>
                        )}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: tx.type === 'ingreso' ? 'var(--text-main)' : 'var(--danger)', whiteSpace: 'nowrap' }}>
                      ${Number(tx.amount).toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                        <button 
                          style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0.3rem', borderRadius: '4px' }} 
                          title="Modificar transacción" 
                          onClick={() => handleEditTx(tx)}
                        >
                          <Edit2 size={17} />
                        </button>
                        <button 
                          style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.3rem', borderRadius: '4px' }} 
                          title="Eliminar transacción" 
                          onClick={() => handleDeleteTx(tx)}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex-between mb-4">
              <h2 style={{ margin: 0 }}>{editingTx ? 'Modificar Transacción' : 'Registrar Transacción'}</h2>
              <button 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }} 
                onClick={() => setShowModal(false)}
              >
                <X size={22} />
              </button>
            </div>
            
            <div className="input-group">
              <label>Entidad / Persona</label>
              <input 
                type="text" 
                className="input-field" 
                value={txForm.beneficiary} 
                onChange={e => setTxForm({...txForm, beneficiary: e.target.value})} 
                placeholder="Ej. Juan Perez, Fitness Group, etc."
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label>Tipo</label>
                <select className="input-field" value={txForm.type} onChange={e => setTxForm({...txForm, type: e.target.value})}>
                  <option value="ingreso">Ingreso</option>
                  <option value="egreso">Egreso</option>
                </select>
              </div>
              <div className="input-group">
                <label>Monto ($)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={txForm.amount} 
                  onChange={e => setTxForm({...txForm, amount: e.target.value})} 
                  placeholder="0"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label>Método</label>
                <select className="input-field" value={txForm.method} onChange={e => setTxForm({...txForm, method: e.target.value})}>
                  <option value="transferencia">Transferencia</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="mixto">Mixto (Varios)</option>
                </select>
              </div>
              <div className="input-group">
                <label>Fecha y Hora</label>
                <input 
                  type="datetime-local" 
                  className="input-field" 
                  value={txForm.date} 
                  onChange={e => setTxForm({...txForm, date: e.target.value})} 
                />
              </div>
            </div>

            <div className="input-group">
              <label>Referencia / Recibo (Opcional)</label>
              <input 
                type="text" 
                className="input-field" 
                value={txForm.ref} 
                onChange={e => setTxForm({...txForm, ref: e.target.value})} 
                placeholder="Ej. TRX-1234, REC-5678"
              />
            </div>

            <div className="input-group mb-4">
              <label>Detalle</label>
              <input 
                type="text" 
                className="input-field" 
                value={txForm.details} 
                onChange={e => setTxForm({...txForm, details: e.target.value})} 
                placeholder="Ej. Cuota Mensual Octubre"
              />
            </div>

            <div className="input-group mb-6">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ margin: 0 }}>Comprobante / Captura (Opcional)</label>
                {txForm.comprobante_url && (
                  <button 
                    type="button" 
                    onClick={() => setTxForm(prev => ({ ...prev, comprobante_url: '' }))}
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '0.8rem', cursor: 'pointer', padding: 0 }}
                  >
                    Quitar adjunto
                  </button>
                )}
              </div>

              {txForm.comprobante_url ? (
                <div style={{ position: 'relative', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', background: 'rgba(0,0,0,0.2)' }}>
                  {txForm.comprobante_url.toLowerCase().endsWith('.pdf') ? (
                    <a href={txForm.comprobante_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', padding: '0.75rem', justifyContent: 'center' }}>
                      <Paperclip size={24} /> Ver Archivo PDF Adjunto
                    </a>
                  ) : (
                    <a href={txForm.comprobante_url} target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center' }}>
                      <img src={txForm.comprobante_url} alt="Comprobante" style={{ maxWidth: '100%', maxHeight: '150px', objectFit: 'contain', borderRadius: '4px' }} />
                    </a>
                  )}
                  <label style={{ display: 'block', textAlign: 'center', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <input type="file" style={{ display: 'none' }} accept="image/*,.pdf" onChange={handleUploadReceipt} onClick={(e) => (e.target.value = null)} disabled={uploadingReceipt} />
                    {uploadingReceipt ? 'Subiendo...' : 'Cambiar comprobante'}
                  </label>
                </div>
              ) : (
                <label style={{ border: '1px dashed var(--border-strong)', padding: '1rem', textAlign: 'center', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: 'rgba(0,0,0,0.2)', display: 'block' }}>
                  <input type="file" style={{ display: 'none' }} accept="image/*,.pdf" onChange={handleUploadReceipt} onClick={(e) => (e.target.value = null)} disabled={uploadingReceipt} />
                  {uploadingReceipt ? <Loader className="spin" size={20} color="var(--primary)" style={{ margin: '0 auto 0.5rem' }} /> : <Paperclip size={20} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem' }} />}
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>
                    Adjuntar archivo...
                  </span>
                </label>
              )}
            </div>

            <div className="flex-between">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSaveTx} disabled={uploadingReceipt}>
                {editingTx ? 'Guardar Cambios' : 'Registrar Transacción'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
