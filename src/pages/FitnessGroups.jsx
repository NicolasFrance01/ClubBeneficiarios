import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { calculateFinalPrice, calculateFitnessGroupCut } from '../store';
import { Briefcase, Landmark, AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';
import MonthSelector from '../components/MonthSelector';
import { getCurrentMonth, getTransactionMonth, formatMonthLabel } from '../utils/monthUtils';

const FitnessGroups = () => {
  const { data, addTransaction } = useContext(AppContext);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  const currentMonth = getCurrentMonth();
  const isSelectedCurrent = selectedMonth === currentMonth;

  // Filter ingresos for the selected month
  const monthIngresos = (data.transactions || []).filter(tx => 
    tx.type === 'ingreso' && getTransactionMonth(tx.date) === selectedMonth
  );

  // Check if liquidation to FG was already executed for this selected month
  const existingLiquidation = (data.transactions || []).find(tx => 
    tx.type === 'egreso' && 
    (tx.beneficiary || '').toLowerCase().includes('fitness group') &&
    getTransactionMonth(tx.date) === selectedMonth
  );

  let fgTransferencia = 0;
  let fgEfectivo = 0;
  let atlasTransferencia = 0;
  let atlasEfectivo = 0;

  const transfersList = [];
  const cashList = [];

  monthIngresos.forEach(tx => {
    const bNameNorm = (tx.beneficiary || '').trim().toLowerCase();
    const b = (data.beneficiaries || []).find(ben => (ben.name || '').trim().toLowerCase() === bNameNorm);
    const plan = (data.plans || []).find(p => p.id === (b ? b.plan : null)) || { name: 'Plan Estándar', basePrice: 29000 };
    const amount = Number(tx.amount || 0);

    if (tx.method === 'transferencia') {
      const fgCut = calculateFitnessGroupCut(plan.basePrice, 'transferencia', data.iva);
      const atlasCut = Math.max(0, amount - fgCut);
      fgTransferencia += fgCut;
      atlasTransferencia += atlasCut;
      transfersList.push({ 
        b: b || { name: tx.beneficiary }, 
        plan, 
        fgCut, 
        atlasCut,
        tx 
      });
    } else {
      const fgCut = calculateFitnessGroupCut(plan.basePrice, 'efectivo', data.iva);
      const atlasCut = Math.max(0, amount - fgCut);
      fgEfectivo += fgCut;
      atlasEfectivo += atlasCut;
      cashList.push({ 
        b: b || { name: tx.beneficiary }, 
        plan, 
        fgCut, 
        atlasCut,
        tx 
      });
    }
  });

  const totalToPayFG = fgTransferencia + fgEfectivo;
  const totalAtlasProfit = atlasTransferencia + atlasEfectivo;

  const today = new Date().getDate();
  const showPaymentAlert = isSelectedCurrent && today >= 5 && today <= 10 && !existingLiquidation;

  const handleLiquidate = () => {
    const liqDate = isSelectedCurrent ? new Date().toISOString().split('T')[0] : `${selectedMonth}-10`;
    addTransaction({
      date: liqDate,
      amount: totalToPayFG,
      type: 'egreso',
      method: 'mixto',
      beneficiary: 'Fitness Groups S.A.',
      details: `Liquidación Mensual ${formatMonthLabel(selectedMonth)}`,
      ref: `LIQ-${Date.now().toString().slice(-4)}`
    });
    setShowConfirm(false);
    alert(`Liquidación de ${formatMonthLabel(selectedMonth)} registrada con éxito.`);
  };

  return (
    <div className="fitness-groups-page">
      <div className="flex-between mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Pagos a Fitness Groups</h1>
          <p>Liquidación, diferenciación y comisión neta por período</p>
        </div>
        <MonthSelector 
          selectedMonth={selectedMonth} 
          onChange={setSelectedMonth} 
          transactions={data.transactions || []} 
          label="Período"
        />
      </div>

      {/* Liquidation Status Banner */}
      {existingLiquidation ? (
        <div className="glass-panel mb-6" style={{ borderLeft: '4px solid var(--success)', background: 'rgba(16, 185, 129, 0.08)' }}>
          <div className="flex-between" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', margin: 0 }}>
              <CheckCircle2 size={20} /> Liquidación de {formatMonthLabel(selectedMonth)} Completada
            </h3>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--success)' }}>
              ${Number(existingLiquidation.amount).toLocaleString()}
            </span>
          </div>
          <p style={{ marginTop: '0.5rem', color: 'var(--text-main)', fontSize: '0.88rem' }}>
            Registrado como egreso el <strong>{String(existingLiquidation.date).slice(0, 10)}</strong> {existingLiquidation.ref ? `· Ref: ${existingLiquidation.ref}` : ''}.
          </p>
        </div>
      ) : totalToPayFG > 0 ? (
        <div className="glass-panel mb-6" style={{ borderLeft: '4px solid var(--primary)', background: 'rgba(0, 242, 254, 0.05)' }}>
          <div className="flex-between" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', margin: 0 }}>
                <ShieldCheck size={20} /> Liquidación Pendiente a Fitness Groups ({formatMonthLabel(selectedMonth)})
              </h3>
              <p style={{ marginTop: '0.35rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Basado en {monthIngresos.length} beneficiario{monthIngresos.length === 1 ? '' : 's'} que pagaron en este período.
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowConfirm(true)}>
              Liquidar Pago (${totalToPayFG.toLocaleString()})
            </button>
          </div>
        </div>
      ) : null}

      {showPaymentAlert && !existingLiquidation && (
        <div className="glass-panel mb-6" style={{ borderLeft: '4px solid var(--danger)', background: 'rgba(239, 68, 68, 0.05)' }}>
          <div className="flex-between">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', margin: 0 }}>
              <AlertTriangle size={20} /> ¡Atención! Período de Pago a Fitness Groups (Del 5 al 10)
            </h3>
            <button className="btn btn-danger" onClick={() => setShowConfirm(true)}>Liquidar Pago (${totalToPayFG.toLocaleString()})</button>
          </div>
          <p style={{ marginTop: '0.5rem', color: 'var(--text-main)', fontSize: '0.9rem' }}>
            Es momento de transferir o entregar el efectivo correspondiente al período a la administración de FG.
          </p>
        </div>
      )}

      {showConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '420px', textAlign: 'center' }}>
            <h3 className="mb-4">Confirmar Liquidación</h3>
            <p className="mb-6">
              Se registrará un egreso por <strong>${totalToPayFG.toLocaleString()}</strong> correspondiente a <strong>{formatMonthLabel(selectedMonth)}</strong> para Fitness Groups S.A.
            </p>
            <div className="flex-between">
              <button className="btn btn-outline" onClick={() => setShowConfirm(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleLiquidate}>Confirmar Pago</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-panel">
          <div className="flex-between mb-4">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Landmark size={20} color="var(--info)" />
              Total Transferencias ({transfersList.length})
            </h3>
            <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>${(fgTransferencia + atlasTransferencia).toLocaleString()}</span>
          </div>
          <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)' }}>
            <div className="flex-between mb-2" style={{ fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Corresponde a FG (Plan + IVA):</span>
              <strong>${fgTransferencia.toLocaleString()}</strong>
            </div>
            <div className="flex-between" style={{ fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Nos queda a nosotros (Atlascore):</span>
              <strong style={{ color: 'var(--primary)' }}>${atlasTransferencia.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        <div className="glass-panel">
          <div className="flex-between mb-4">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Briefcase size={20} color="var(--success)" />
              Total Efectivo ({cashList.length})
            </h3>
            <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>${(fgEfectivo + atlasEfectivo).toLocaleString()}</span>
          </div>
          <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)' }}>
            <div className="flex-between mb-2" style={{ fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Corresponde a FG (Solo Plan):</span>
              <strong>${fgEfectivo.toLocaleString()}</strong>
            </div>
            <div className="flex-between" style={{ fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Nos queda a nosotros (Atlascore):</span>
              <strong style={{ color: 'var(--primary)' }}>${atlasEfectivo.toLocaleString()}</strong>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-panel">
          <div className="flex-between mb-4">
            <h4 style={{ margin: 0 }}>Listado - Transferencias ({transfersList.length})</h4>
          </div>
          <div className="table-container" style={{ maxHeight: '300px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Beneficiario</th>
                  <th>FG</th>
                  <th>Atlascore</th>
                </tr>
              </thead>
              <tbody>
                {transfersList.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                      No hay pagos por transferencia en {formatMonthLabel(selectedMonth)}.
                    </td>
                  </tr>
                ) : (
                  transfersList.map((t, idx) => (
                    <tr key={idx}>
                      <td>
                        <strong>{t.b.name}</strong>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.plan.name}</span>
                      </td>
                      <td>${t.fgCut.toLocaleString()}</td>
                      <td style={{ color: 'var(--primary)', fontWeight: 600 }}>${t.atlasCut.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="glass-panel">
          <div className="flex-between mb-4">
            <h4 style={{ margin: 0 }}>Listado - Efectivo ({cashList.length})</h4>
          </div>
          <div className="table-container" style={{ maxHeight: '300px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Beneficiario</th>
                  <th>FG</th>
                  <th>Atlascore</th>
                </tr>
              </thead>
              <tbody>
                {cashList.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                      No hay pagos en efectivo en {formatMonthLabel(selectedMonth)}.
                    </td>
                  </tr>
                ) : (
                  cashList.map((t, idx) => (
                    <tr key={idx}>
                      <td>
                        <strong>{t.b.name}</strong>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.plan.name}</span>
                      </td>
                      <td>${t.fgCut.toLocaleString()}</td>
                      <td style={{ color: 'var(--primary)', fontWeight: 600 }}>${t.atlasCut.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FitnessGroups;
