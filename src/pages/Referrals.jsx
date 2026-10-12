import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { calculateReferralDeductions } from '../utils/referralCalculations';
import { 
  Users, Plus, Edit2, Trash2, Eye, Search, CheckCircle2, Clock, 
  DollarSign, Share2, Award, ArrowRight, X, AlertCircle, Phone, CreditCard, Info
} from 'lucide-react';

const Referrals = () => {
  const { data, addReferent, updateReferent, removeReferent } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('todos');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReferent, setSelectedReferent] = useState(null);

  const [form, setForm] = useState({
    id: null,
    name: '',
    phone: '',
    email: '',
    cbuAlias: '',
    commissionType: 'ingreso', // 'ingreso' | 'meses' | 'siempre'
    commissionMonths: 1,
    status: 'activo'
  });

  // Calculate deductions & performance using shared engine
  const calculation = calculateReferralDeductions(
    data.beneficiaries || [],
    data.transactions || [],
    data.referents || [],
    data.plans || []
  );

  const referentSummary = calculation.referentSummary || {};

  const handleOpenAdd = () => {
    setForm({
      id: null,
      name: '',
      phone: '',
      email: '',
      cbuAlias: '',
      commissionType: 'ingreso',
      commissionMonths: 1,
      status: 'activo'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (ref) => {
    setForm({
      id: ref.id,
      name: ref.name || '',
      phone: ref.phone || '',
      email: ref.email || '',
      cbuAlias: ref.cbuAlias || ref.cbu_alias || '',
      commissionType: ref.commissionType || ref.commission_type || 'ingreso',
      commissionMonths: Number(ref.commissionMonths ?? ref.commission_months ?? 1),
      status: ref.status || 'activo'
    });
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('Por favor ingresa el nombre del referente.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      cbuAlias: form.cbuAlias.trim(),
      commissionType: form.commissionType,
      commissionMonths: parseInt(form.commissionMonths) || 1,
      status: form.status
    };

    if (form.id) {
      updateReferent(form.id, payload);
    } else {
      addReferent(payload);
    }

    setShowModal(false);
  };

  const handleOpenDetails = (ref) => {
    setSelectedReferent(ref);
    setShowDetailModal(true);
  };

  // Filter list
  const filteredReferents = (data.referents || []).filter(r => {
    const matchesSearch = 
      (r.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.cbuAlias || r.cbu_alias || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'todos' || (r.commissionType || r.commission_type) === typeFilter;
    return matchesSearch && matchesType;
  });

  // Global KPIs
  const totalReferentsCount = (data.referents || []).length;
  let totalReferredBeneficiaries = 0;
  Object.values(referentSummary).forEach(s => {
    totalReferredBeneficiaries += s.beneficiaryNames ? s.beneficiaryNames.size : 0;
  });
  const totalCommissionToPay = calculation.totalReferentPayout || 0;

  return (
    <div className="referrals-page">
      {/* Header */}
      <div className="flex-between mb-6">
        <div>
          <h1>Módulo de Referentes</h1>
          <p>Administración de referentes, reglas de tiempo de comisión y liquidaciones</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} /> Nuevo Referente
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div className="flex-between mb-2">
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Referentes Activos</span>
            <Users size={20} color="var(--primary)" />
          </div>
          <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.8rem' }}>{totalReferentsCount}</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Afiliados registrados en el sistema</span>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div className="flex-between mb-2">
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Beneficiarios Aportados</span>
            <Award size={20} color="var(--info)" />
          </div>
          <h2 style={{ margin: 0, color: 'var(--info)', fontSize: '1.8rem' }}>{totalReferredBeneficiaries}</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Captados a través de referentes</span>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div className="flex-between mb-2">
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total a Liquidar Referentes</span>
            <DollarSign size={20} color="var(--warning)" />
          </div>
          <h2 style={{ margin: 0, color: 'var(--warning)', fontSize: '1.8rem' }}>${totalCommissionToPay.toLocaleString()}</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Deducción de ganancia Atlascore</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel mb-4" style={{ padding: '1rem 1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flex: 1, minWidth: '260px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '350px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Buscar por nombre, teléfono, alias..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Filtrar Tipo:</span>
          <select 
            className="input-field" 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ width: 'auto', padding: '0.4rem 0.8rem' }}
          >
            <option value="todos">Todos los Tipos</option>
            <option value="ingreso">Solo Ingreso</option>
            <option value="meses">Por Cantidad de Meses</option>
            <option value="siempre">Por Siempre</option>
          </select>
        </div>
      </div>

      {/* Referents Table */}
      <div className="glass-panel">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Referente</th>
                <th>Contacto & Pago</th>
                <th>Regla de Tiempo</th>
                <th>Comisión Asignada</th>
                <th>Beneficiarios</th>
                <th>Total Devengado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredReferents.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    No hay referentes registrados con los filtros seleccionados. Crea uno con el botón "Nuevo Referente".
                  </td>
                </tr>
              ) : (
                filteredReferents.map(ref => {
                  const summary = referentSummary[ref.id] || { totalCommissions: 0, beneficiaryNames: new Set(), qualifiedPaymentsCount: 0 };
                  const bCount = summary.beneficiaryNames ? summary.beneficiaryNames.size : 0;
                  const type = ref.commissionType || ref.commission_type || 'ingreso';
                  const months = Number(ref.commissionMonths ?? ref.commission_months ?? 1);

                  return (
                    <tr key={ref.id} style={{ opacity: ref.status === 'inactivo' ? 0.6 : 1 }}>
                      <td>
                        <div>
                          <strong style={{ display: 'block', color: 'var(--text-main)', fontSize: '0.95rem' }}>{ref.name}</strong>
                          <span style={{ fontSize: '0.75rem', color: ref.status === 'activo' ? 'var(--success)' : 'var(--danger)' }}>
                            ● {ref.status === 'activo' ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div style={{ fontSize: '0.85rem' }}>
                          {ref.phone && <div style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Phone size={12} color="var(--primary)" /> {ref.phone}</div>}
                          {ref.email && <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{ref.email}</div>}
                          {(ref.cbuAlias || ref.cbu_alias) && (
                            <div style={{ color: 'var(--info)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                              <CreditCard size={12} /> CBU/Alias: {ref.cbuAlias || ref.cbu_alias}
                            </div>
                          )}
                          {!ref.phone && !ref.email && !ref.cbuAlias && !ref.cbu_alias && <span style={{ color: 'var(--text-muted)' }}>-</span>}
                        </div>
                      </td>

                      <td>
                        {type === 'ingreso' && (
                          <span className="badge" style={{ background: 'rgba(0, 242, 254, 0.1)', color: 'var(--primary)', border: '1px solid rgba(0, 242, 254, 0.3)' }}>
                            Solo Ingreso (1 cuota)
                          </span>
                        )}
                        {type === 'meses' && (
                          <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                            Ingreso + {months} {months === 1 ? 'Mes' : 'Meses'}
                          </span>
                        )}
                        {type === 'siempre' && (
                          <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                            Por Siempre
                          </span>
                        )}
                      </td>

                      <td>
                        <span className="badge" style={{ background: 'rgba(0, 242, 254, 0.08)', color: 'var(--primary)', border: '1px solid rgba(0, 242, 254, 0.2)' }}>
                          100% Comisión según Plan
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>
                          (Silver, Gold o Platinum)
                        </span>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="badge" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-main)' }}>
                            {bCount} {bCount === 1 ? 'beneficiario' : 'beneficiarios'}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div>
                          <strong style={{ color: 'var(--warning)', fontSize: '1.05rem', display: 'block' }}>
                            ${summary.totalCommissions.toLocaleString()}
                          </strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {summary.qualifiedPaymentsCount} {summary.qualifiedPaymentsCount === 1 ? 'cuota comisionada' : 'cuotas comisionadas'}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button 
                            style={{ background: 'none', border: 'none', color: 'var(--info)', cursor: 'pointer', padding: '0.35rem' }} 
                            title="Ver Beneficiarios traídos"
                            onClick={() => handleOpenDetails(ref)}
                          >
                            <Eye size={18} />
                          </button>
                          <button 
                            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0.35rem' }} 
                            title="Editar Referente"
                            onClick={() => handleOpenEdit(ref)}
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.35rem' }} 
                            title="Eliminar Referente"
                            onClick={() => {
                              if (window.confirm(`¿Estás seguro de eliminar al referente "${ref.name}"?`)) {
                                removeReferent(ref.id);
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

      {/* Modal: Crear / Editar Referente */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex-between mb-4">
              <h2 style={{ margin: 0 }}>{form.id ? 'Editar Referente' : 'Nuevo Referente'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="input-group">
                <label>Nombre Completo del Referente *</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ej: Lucas Rossi" 
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })} 
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label>Teléfono</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Ej: 3512345678" 
                    value={form.phone} 
                    onChange={(e) => setForm({ ...form, phone: e.target.value })} 
                  />
                </div>
                <div className="input-group">
                  <label>Email</label>
                  <input 
                    type="email" 
                    className="input-field" 
                    placeholder="correo@ejemplo.com" 
                    value={form.email} 
                    onChange={(e) => setForm({ ...form, email: e.target.value })} 
                  />
                </div>
              </div>

              <div className="input-group">
                <label>CBU / CVU / Alias Bancario (Para liquidación)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ej: lucas.rossi.mp o 00000031..." 
                  value={form.cbuAlias} 
                  onChange={(e) => setForm({ ...form, cbuAlias: e.target.value })} 
                />
              </div>

              {/* Commission Rule Configuration */}
              <div style={{ background: 'rgba(0, 242, 254, 0.05)', border: '1px solid rgba(0, 242, 254, 0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem' }}>
                <label style={{ color: 'var(--primary)', fontWeight: 600, display: 'block', marginBottom: '0.75rem', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.5px' }}>
                  Esquema de Tiempo de Comisión
                </label>

                <div className="input-group" style={{ marginBottom: '1rem' }}>
                  <label>Modalidad de cobro de comisión:</label>
                  <select 
                    className="input-field" 
                    value={form.commissionType} 
                    onChange={(e) => setForm({ ...form, commissionType: e.target.value })}
                  >
                    <option value="ingreso">Solo Ingreso (Solo comisiona la cuota de alta de cada nuevo beneficiario)</option>
                    <option value="meses">Por Cantidad de Meses (Ingreso + N meses posteriores)</option>
                    <option value="siempre">Por Siempre (Todas las cuotas mensuales indefinidamente)</option>
                  </select>
                </div>

                {form.commissionType === 'meses' && (
                  <div className="input-group" style={{ marginBottom: '1rem' }}>
                    <label>Cantidad de meses posteriores a comisionar:</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="60" 
                      className="input-field" 
                      value={form.commissionMonths} 
                      onChange={(e) => setForm({ ...form, commissionMonths: e.target.value })} 
                      placeholder="Ej: 1 (Cobra ingreso + 1 mes)"
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                      Ej: Con {form.commissionMonths || 1} mes(es), cobrará la cuota de ingreso + {form.commissionMonths || 1} cuota(s) mensual(es) subsiguiente(s).
                    </small>
                  </div>
                )}

                {/* Info Card: Full Plan Commission */}
                <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--primary)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <Info size={18} color="var(--primary)" style={{ minWidth: '18px', marginTop: '2px' }} />
                  <div>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)', display: 'block' }}>
                      Valor de la Comisión: 100% de la Comisión del Plan
                    </strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      El referente siempre recibe el valor total de la comisión de Atlascore según el plan que venda cada beneficiario (Silver, Gold o Platinum), descontándose del total de Atlascore durante el tiempo configurado.
                    </span>
                  </div>
                </div>
              </div>

              <div className="input-group">
                <label>Estado</label>
                <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn" style={{ background: 'rgba(255,255,255,0.1)' }} onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {form.id ? 'Guardar Cambios' : 'Crear Referente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Detalle de Beneficiarios Traídos */}
      {showDetailModal && selectedReferent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '750px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="flex-between mb-4">
              <div>
                <h2 style={{ margin: 0 }}>Beneficiarios de {selectedReferent.name}</h2>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>
                  Regla actual: <strong>{selectedReferent.commissionType === 'ingreso' ? 'Solo Ingreso' : selectedReferent.commissionType === 'meses' ? `Ingreso + ${selectedReferent.commissionMonths || 1} Meses` : 'Por Siempre'}</strong> (100% comisión del plan contratado)
                </p>
              </div>
              <button onClick={() => setShowDetailModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div className="table-container mb-4">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Beneficiario</th>
                    <th>Plan</th>
                    <th>Fecha / Período</th>
                    <th>¿Comisiona?</th>
                    <th>Comisión Referente</th>
                    <th>Queda para Atlas</th>
                  </tr>
                </thead>
                <tbody>
                  {calculation.items.filter(item => item.referentName.toLowerCase() === selectedReferent.name.trim().toLowerCase()).length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        Este referente aún no tiene beneficiarios asociados. En el módulo de Beneficiarios, asigna este referente en el campo "Ingresado Por".
                      </td>
                    </tr>
                  ) : (
                    calculation.items
                      .filter(item => item.referentName.toLowerCase() === selectedReferent.name.trim().toLowerCase())
                      .map(item => (
                        <tr key={item.id}>
                          <td>
                            <strong>{item.beneficiaryName}</strong>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>DNI: {item.beneficiaryDoc}</span>
                          </td>
                          <td>{item.planName}</td>
                          <td>
                            <span style={{ fontSize: '0.85rem' }}>{item.period}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{item.txDate}</span>
                          </td>
                          <td>
                            {item.isEligible ? (
                              <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}>
                                Calificado
                              </span>
                            ) : (
                              <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)' }}>
                                Tiempo Vencido
                              </span>
                            )}
                          </td>
                          <td style={{ fontWeight: 600, color: item.isEligible ? 'var(--warning)' : 'var(--text-muted)' }}>
                            ${item.referentDeduction.toLocaleString()}
                          </td>
                          <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                            ${item.atlasNet.toLocaleString()}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => setShowDetailModal(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Referrals;
