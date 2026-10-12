import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  Plus, Edit2, Trash2, Camera, Clock, Loader, X, Search, 
  ArrowDown, ArrowUp, ChevronDown, UserCheck, Download, Shield, RotateCcw 
} from 'lucide-react';
import { upload } from '@vercel/blob/client';

const Beneficiaries = () => {
  const { data, addBeneficiary, updateBeneficiary, toggleBeneficiaryStatus, removeBeneficiary, addReferent } = useContext(AppContext);
  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedUserHistory, setSelectedUserHistory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [planFilter, setPlanFilter] = useState('todos');
  const [showReferenteList, setShowReferenteList] = useState(false);
  
  const [newB, setNewB] = useState({ 
    id: null, name: '', doc: '', email: '', phone: '', 
    plan: 'silver', paymentMethod: 'efectivo', referente: '', 
    foto_frente: '', foto_dorso: '' 
  });
  const [uploadingFrente, setUploadingFrente] = useState(false);
  const [uploadingDorso, setUploadingDorso] = useState(false);

  // Collect names from system users (/usuarios), registered referents (/referentes), and previous beneficiaries
  const userNames = Array.from(new Set((data.users || []).map(u => (u.name || '').trim()).filter(Boolean)));
  const referentListNames = Array.from(new Set((data.referents || []).map(r => (r.name || '').trim()).filter(Boolean)));
  const existingBeneficiaryRefNames = Array.from(new Set(
    data.beneficiaries.map(b => (b.referente || b.referredBy || b.referred_by || '').trim()).filter(Boolean)
  ));

  const allReferentNames = Array.from(new Set([
    ...userNames,
    ...referentListNames,
    ...existingBeneficiaryRefNames
  ])).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));

  const matchingReferents = allReferentNames.filter(r => 
    !newB.referente || r.toLowerCase().includes(newB.referente.toLowerCase())
  );

  const handleEdit = (b) => {
    setNewB({
      id: b.id,
      name: b.name,
      doc: b.doc,
      email: b.email || '',
      phone: b.phone || '',
      plan: b.plan,
      paymentMethod: b.paymentMethod || 'efectivo',
      referente: b.referente || b.referredBy || b.referred_by || '',
      foto_frente: b.foto_frente || '',
      foto_dorso: b.foto_dorso || ''
    });
    setShowReferenteList(false);
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
          status: 'activo'
        });
      }
    }

    const finalBeneficiaryPayload = {
      ...newB,
      referente: refName,
      referredBy: refName
    };

    if (newB.id) {
      updateBeneficiary(newB.id, finalBeneficiaryPayload);
    } else {
      addBeneficiary({
        ...finalBeneficiaryPayload,
        status: 'activo',
        date: new Date().toISOString().split('T')[0]
      });
    }
    setShowModal(false);
    setShowReferenteList(false);
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

  // Filter beneficiaries by search term, status filter and plan filter
  const filteredBeneficiaries = data.beneficiaries.filter(b => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = !term || (
      (b.name || '').toLowerCase().includes(term) ||
      (b.doc || '').toLowerCase().includes(term) ||
      (b.email || '').toLowerCase().includes(term) ||
      (b.phone || '').toLowerCase().includes(term) ||
      ((b.referente || b.referredBy || '').toLowerCase().includes(term))
    );

    const matchesStatus = statusFilter === 'todos' || b.status === statusFilter;
    const matchesPlan = planFilter === 'todos' || b.plan === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  // Export filtered beneficiaries with complete data to .CSV
  const handleExportCsv = () => {
    if (filteredBeneficiaries.length === 0) {
      alert('No hay beneficiarios que coincidan con los filtros aplicados para descargar.');
      return;
    }

    const headers = [
      'ID',
      'Nombre Completo',
      'Documento (DNI)',
      'Email',
      'Teléfono',
      'Plan ID',
      'Nombre Plan',
      'Precio Base Plan',
      'Comisión Atlascore',
      'Método de Pago',
      'Ingresado Por (Referente)',
      'Estado',
      'Fecha de Ingreso',
      'Foto Frente DNI (URL)',
      'Foto Dorso DNI (URL)'
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = filteredBeneficiaries.map(b => {
      const planObj = data.plans.find(p => p.id === b.plan) || {};
      const planName = planObj.name || b.plan || '';
      const planBasePrice = planObj.basePrice !== undefined ? `$${Number(planObj.basePrice).toLocaleString()}` : '';
      const planCommission = planObj.commission !== undefined ? `$${Number(planObj.commission).toLocaleString()}` : '';
      const paymentMethod = b.paymentMethod || b.payment_method || 'efectivo';
      const ref = b.referente || b.referredBy || b.referred_by || '';
      const dateVal = b.date || b.fecha_ingreso || '';
      const formattedDate = dateVal ? String(dateVal).split('T')[0] : '';

      return [
        b.id,
        b.name || '',
        b.doc || '',
        b.email || '',
        b.phone || '',
        b.plan || '',
        planName,
        planBasePrice,
        planCommission,
        paymentMethod,
        ref,
        b.status || 'activo',
        formattedDate,
        b.foto_frente || '',
        b.foto_dorso || ''
      ].map(escapeCsv).join(';');
    });

    // \uFEFF is the UTF-8 BOM to guarantee Excel on Windows displays accents and characters properly
    const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const today = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `beneficiarios_filtrados_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'todos' || planFilter !== 'todos';

  return (
    <div className="beneficiaries-page">
      <div className="flex-between mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Beneficiarios</h1>
          <p>Gestión de personas inscritas al club de beneficios</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-outline" 
            onClick={handleExportCsv}
            title="Descargar listado completo de los beneficiarios filtrados en .csv"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Download size={18} />
            Descargar CSV ({filteredBeneficiaries.length})
          </button>
          <button className="btn btn-primary" onClick={() => {
            setNewB({ id: null, name: '', doc: '', email: '', phone: '', plan: 'silver', paymentMethod: 'efectivo', referente: '', foto_frente: '', foto_dorso: '' });
            setShowModal(true);
          }}>
            <Plus size={18} />
            Nuevo Beneficiario
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel mb-4" style={{ padding: '0.85rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '220px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Buscar por nombre, DNI, teléfono, referente..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '32px', margin: 0 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Estado:</span>
            <select 
              className="input-field" 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)}
              style={{ margin: 0, padding: '0.45rem 0.75rem', width: 'auto' }}
            >
              <option value="todos">Todos ({data.beneficiaries.length})</option>
              <option value="activo">Solo Activos ({data.beneficiaries.filter(b => b.status === 'activo').length})</option>
              <option value="inactivo">Solo Inactivos ({data.beneficiaries.filter(b => b.status === 'inactivo').length})</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Plan:</span>
            <select 
              className="input-field" 
              value={planFilter} 
              onChange={e => setPlanFilter(e.target.value)}
              style={{ margin: 0, padding: '0.45rem 0.75rem', width: 'auto' }}
            >
              <option value="todos">Todos los planes</option>
              {data.plans.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button 
              className="btn btn-outline" 
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('todos');
                setPlanFilter('todos');
              }}
              title="Restablecer todos los filtros"
            >
              <RotateCcw size={14} />
              Limpiar
            </button>
          )}

          <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 500 }}>
            {filteredBeneficiaries.length} de {data.beneficiaries.length} beneficiarios
          </div>
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
              {filteredBeneficiaries.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    No se encontraron beneficiarios que coincidan con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredBeneficiaries.map(b => {
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
                          <span style={{ display: 'block', fontSize: '0.9rem' }}>{b.email || '-'}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{b.phone || '-'}</span>
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
                              if(window.confirm(`¿Estás seguro de eliminar a ${b.name} por completo?`)) {
                                removeBeneficiary(b.id);
                              }
                            }}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex-between mb-4">
              <h2 style={{ margin: 0 }}>{newB.id ? 'Modificar Beneficiario' : 'Agregar Beneficiario'}</h2>
              <button 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }} 
                onClick={() => setShowModal(false)}
              >
                <X size={22} />
              </button>
            </div>

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
              
              <div className="input-group" style={{ gridColumn: '1 / -1', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ margin: 0 }}>Ingresado Por (Referente)</label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Elige un usuario, referente o escribe uno nuevo</span>
                </div>

                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={newB.referente} 
                    onChange={e => {
                      setNewB({...newB, referente: e.target.value});
                      setShowReferenteList(true);
                    }} 
                    onFocus={() => setShowReferenteList(true)}
                    placeholder="Haz clic para ver la lista de referentes y usuarios..." 
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowReferenteList(!showReferenteList)}
                    style={{ 
                      position: 'absolute', 
                      right: '8px', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      background: 'none', 
                      border: 'none', 
                      color: 'var(--primary)', 
                      cursor: 'pointer',
                      padding: '0.25rem',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Desplegar lista de referentes y usuarios"
                  >
                    <ChevronDown size={18} style={{ transform: showReferenteList ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>
                </div>

                {showReferenteList && (
                  <>
                    <div 
                      style={{ position: 'fixed', inset: 0, zIndex: 40 }} 
                      onClick={() => setShowReferenteList(false)} 
                    />
                    <div 
                      style={{ 
                        position: 'absolute', 
                        top: '100%', 
                        left: 0, 
                        right: 0, 
                        zIndex: 50, 
                        marginTop: '4px',
                        maxHeight: '230px', 
                        overflowY: 'auto', 
                        padding: '0.4rem',
                        boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
                        border: '1px solid rgba(0, 242, 254, 0.3)',
                        borderRadius: 'var(--radius-sm)',
                        background: '#0d131f'
                      }}
                    >
                      <div 
                        onClick={() => {
                          setNewB({ ...newB, referente: '' });
                          setShowReferenteList(false);
                        }}
                        style={{ 
                          padding: '0.45rem 0.65rem', 
                          cursor: 'pointer', 
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.85rem',
                          color: 'var(--text-muted)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        (Sin referente / Ninguno)
                      </div>

                      {matchingReferents.map(refName => {
                        const isUser = userNames.includes(refName);
                        const isReferent = referentListNames.includes(refName);
                        const tagLabel = isUser && isReferent 
                          ? 'Usuario y Referente' 
                          : isUser 
                            ? 'Usuario / Fundador' 
                            : 'Referente';

                        return (
                          <div 
                            key={refName}
                            onClick={() => {
                              setNewB({ ...newB, referente: refName });
                              setShowReferenteList(false);
                            }}
                            style={{ 
                              padding: '0.5rem 0.65rem', 
                              cursor: 'pointer', 
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.9rem',
                              color: 'var(--text-main)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              transition: 'background 0.15s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 242, 254, 0.12)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {isUser ? <Shield size={16} color="var(--primary)" /> : <UserCheck size={16} color="var(--primary)" />}
                              <strong>{refName}</strong>
                            </div>
                            <span style={{ 
                              fontSize: '0.75rem', 
                              color: isUser ? 'var(--primary)' : 'var(--text-muted)',
                              background: isUser ? 'rgba(0, 242, 254, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px'
                            }}>
                              {tagLabel}
                            </span>
                          </div>
                        );
                      })}

                      {newB.referente.trim() && !matchingReferents.some(r => r.toLowerCase() === newB.referente.trim().toLowerCase()) && (
                        <div 
                          onClick={() => setShowReferenteList(false)}
                          style={{ 
                            padding: '0.55rem 0.65rem', 
                            cursor: 'pointer', 
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.85rem',
                            color: 'var(--primary)',
                            background: 'rgba(0, 242, 254, 0.08)',
                            borderTop: '1px solid rgba(255,255,255,0.08)',
                            marginTop: '0.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem'
                          }}
                        >
                          <Plus size={14} />
                          <span>Usar nuevo referente: <strong>"{newB.referente.trim()}"</strong></span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="input-group">
                <label>Foto DNI Frente</label>
                <label style={{ border: '1px dashed var(--border-strong)', padding: '1rem', textAlign: 'center', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: 'rgba(0,0,0,0.2)', display: 'block' }}>
                  <input type="file" style={{ display: 'none' }} accept="image/*" onChange={(e) => handleUploadDni(e, 'frente')} disabled={uploadingFrente} />
                  {uploadingFrente ? <Loader className="spin" size={24} color="var(--primary)" style={{ margin: '0 auto 0.5rem' }} /> : newB.foto_frente ? <img src={newB.foto_frente} alt="DNI Frente" style={{ maxWidth: '100%', maxHeight: '60px', objectFit: 'contain' }} /> : <Camera size={24} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem' }} />}
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>{newB.foto_frente ? 'Cambiar imagen' : 'Subir DNI Frente'}</span>
                </label>
              </div>
              <div className="input-group">
                <label>Foto DNI Dorso</label>
                <label style={{ border: '1px dashed var(--border-strong)', padding: '1rem', textAlign: 'center', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: 'rgba(0,0,0,0.2)', display: 'block' }}>
                  <input type="file" style={{ display: 'none' }} accept="image/*" onChange={(e) => handleUploadDni(e, 'dorso')} disabled={uploadingDorso} />
                  {uploadingDorso ? <Loader className="spin" size={24} color="var(--primary)" style={{ margin: '0 auto 0.5rem' }} /> : newB.foto_dorso ? <img src={newB.foto_dorso} alt="DNI Dorso" style={{ maxWidth: '100%', maxHeight: '60px', objectFit: 'contain' }} /> : <Camera size={24} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem' }} />}
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>{newB.foto_dorso ? 'Cambiar imagen' : 'Subir DNI Dorso'}</span>
                </label>
              </div>
            </div>
            <div className="flex-between mt-6">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={uploadingFrente || uploadingDorso}>
                {newB.id ? 'Guardar Cambios' : 'Guardar Beneficiario'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showHistoryModal && selectedUserHistory && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
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
