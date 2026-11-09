import React, { useContext, useState } from 'react';
import { calculateFinalPrice, calculateFitnessGroupCut } from '../store';
import { AppContext } from '../context/AppContext';
import { Users, TrendingUp, DollarSign, Activity, AlertCircle, ArrowRight, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const normalizeName = (str) =>
  (str || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');

const Dashboard = () => {
  const { data } = useContext(AppContext);
  const navigate = useNavigate();
  const [reminderSearch, setReminderSearch] = useState('');
  
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      const saved = localStorage.getItem(`atlascore_dismissed_reminders_${currentMonth}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleDismiss = (id) => {
    setDismissedIds(prev => {
      const next = prev.includes(id) ? prev : [...prev, id];
      try {
        localStorage.setItem(`atlascore_dismissed_reminders_${currentMonth}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Calculate stats
  const totalBeneficiaries = data.beneficiaries.filter(b => b.status === 'activo').length;
  
  let totalRevenue = 0;
  let totalAtlasCommission = 0;
  let totalFitnessGroup = 0;

  data.beneficiaries.forEach(b => {
    if (b.status === 'activo') {
      const plan = data.plans.find(p => p.id === b.plan);
      const finalPrice = calculateFinalPrice(plan.basePrice, b.paymentMethod, data.commission, data.iva);
      const fgCut = calculateFitnessGroupCut(plan.basePrice, b.paymentMethod, data.iva);
      totalRevenue += finalPrice;
      totalFitnessGroup += fgCut;
      totalAtlasCommission += data.commission;
    }
  });

  const isPaymentPeriod = new Date().getDate() >= 1;

  // All pending beneficiaries with resilient normalized matching
  const pendingBeneficiaries = data.beneficiaries.filter(b => {
    if (b.status !== 'activo') return false;
    if (dismissedIds.includes(b.id)) return false;
    const bNorm = normalizeName(b.name);
    const hasPaid = (data.transactions || []).some(tx => {
      if (tx.type !== 'ingreso') return false;
      const txNorm = normalizeName(tx.beneficiary);
      if (txNorm !== bNorm) return false;
      const dStr = String(tx.date || '');
      return dStr.startsWith(currentMonth);
    });
    return !hasPaid;
  });

  const filteredPending = pendingBeneficiaries.filter(b => {
    const term = reminderSearch.trim().toLowerCase();
    if (!term) return true;
    const plan = data.plans.find(p => p.id === b.plan);
    return (
      (b.name || '').toLowerCase().includes(term) ||
      (b.doc || '').toLowerCase().includes(term) ||
      (plan?.name || '').toLowerCase().includes(term) ||
      (b.paymentMethod || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="dashboard-page">
      <h1>Dashboard Principal</h1>
      <p className="mb-6">Resumen general de Atlascore &amp; Fitness Groups</p>

      {isPaymentPeriod && (
        <div className="glass-panel mb-6" style={{ borderLeft: '4px solid var(--primary)' }}>
          {/* Header + search inline */}
          <div className="flex-between mb-3" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', margin: 0 }}>
              <AlertCircle size={20} />
              Recordatorio de Pagos
              <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                ({filteredPending.length}{reminderSearch ? '' : ` / ${pendingBeneficiaries.length}`} pendiente{pendingBeneficiaries.length !== 1 ? 's' : ''})
              </span>
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              {/* Inline search */}
              <div style={{ position: 'relative' }}>
                <Search
                  size={14}
                  color="var(--text-muted)"
                  style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                />
                <input
                  type="text"
                  className="input-field"
                  placeholder="Buscar beneficiario..."
                  value={reminderSearch}
                  onChange={e => setReminderSearch(e.target.value)}
                  style={{ paddingLeft: '28px', margin: 0, fontSize: '0.82rem', padding: '0.38rem 0.75rem 0.38rem 28px', width: '220px' }}
                />
              </div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Período de cobro activo</span>
            </div>
          </div>

          {/* Scrollable table */}
          <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead style={{ position: 'sticky', top: 0, zIndex: 2, background: 'var(--bg-glass, #1a2235)' }}>
                <tr>
                  <th>Beneficiario</th>
                  <th>Plan</th>
                  <th>Monto a Cobrar</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredPending.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                      {reminderSearch
                        ? 'No hay coincidencias para la búsqueda.'
                        : '✅ Todos los beneficiarios han pagado este mes.'}
                    </td>
                  </tr>
                ) : (
                  filteredPending.map(b => {
                    const plan = data.plans.find(p => p.id === b.plan);
                    const finalPrice = calculateFinalPrice(plan.basePrice, b.paymentMethod, data.commission, data.iva);
                    return (
                      <tr key={b.id}>
                        <td><strong>{b.name}</strong></td>
                        <td><span className={`badge badge-${plan.id}`}>{plan.name}</span></td>
                        <td>
                          ${finalPrice.toLocaleString()}{' '}
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                            ({b.paymentMethod})
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <button
                              className="btn btn-primary"
                              style={{ padding: '0.4rem 0.9rem', fontSize: '0.82rem' }}
                              onClick={() => navigate('/pagos', { state: { prefill: b } })}
                            >
                              Registrar Pago <ArrowRight size={13} />
                            </button>
                            <button
                              title="Eliminar de recordatorio"
                              onClick={() => handleDismiss(b.id)}
                              style={{
                                background: 'rgba(239,68,68,0.1)',
                                border: '1px solid rgba(239,68,68,0.25)',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--danger)',
                                cursor: 'pointer',
                                padding: '0.38rem 0.5rem',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              <X size={15} />
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
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: 'var(--radius-md)' }}>
            <Users size={32} color="var(--info)" />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Beneficiarios Activos</p>
            <h2 style={{ margin: 0, fontSize: '2rem' }}>{totalBeneficiaries}</h2>
          </div>
        </div>

        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-md)' }}>
            <TrendingUp size={32} color="var(--success)" />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Ingreso Bruto Mensual</p>
            <h2 style={{ margin: 0, fontSize: '2rem' }}>${totalRevenue.toLocaleString()}</h2>
          </div>
        </div>

        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(251, 191, 36, 0.1)', borderRadius: 'var(--radius-md)' }}>
            <DollarSign size={32} color="var(--primary)" />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Comisión Atlascore</p>
            <h2 style={{ margin: 0, fontSize: '2rem', color: 'var(--primary)' }}>${totalAtlasCommission.toLocaleString()}</h2>
          </div>
        </div>

        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)' }}>
            <Activity size={32} color="var(--danger)" />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>A pagar a Fitness Groups</p>
            <h2 style={{ margin: 0, fontSize: '2rem' }}>${totalFitnessGroup.toLocaleString()}</h2>
          </div>
        </div>
      </div>

      <div className="glass-panel">
        <h3 className="mb-4">Actividad Reciente</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Beneficiario</th>
                <th>Plan</th>
                <th>Método</th>
                <th>Total Cuota</th>
              </tr>
            </thead>
            <tbody>
              {data.beneficiaries.map(b => {
                const plan = data.plans.find(p => p.id === b.plan);
                const finalPrice = calculateFinalPrice(plan.basePrice, b.paymentMethod, data.commission, data.iva);
                return (
                  <tr key={b.id}>
                    <td>{b.date}</td>
                    <td>{b.name}</td>
                    <td><span className={`badge badge-${plan.id}`}>{plan.name}</span></td>
                    <td style={{ textTransform: 'capitalize' }}>{b.paymentMethod}</td>
                    <td style={{ fontWeight: 600 }}>${finalPrice.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
