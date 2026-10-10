import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { calculateFinalPrice, calculateFitnessGroupCut } from '../store';
import { Briefcase, Landmark, AlertTriangle, CheckCircle2 } from 'lucide-react';

const FitnessGroups = () => {
  const { data, addTransaction } = useContext(AppContext);
  const [showConfirm, setShowConfirm] = useState(false);

  // Filter active beneficiaries for this month's calculations
  const activeB = data.beneficiaries.filter(b => b.status === 'activo');
  
  // Totals for Fitness Group (FG) and Atlascore
  let fgTransferencia = 0;
  let fgEfectivo = 0;
  let atlasTransferencia = 0;
  let atlasEfectivo = 0;

  const transfersList = [];
  const cashList = [];

  activeB.forEach(b => {
    const plan = data.plans.find(p => p.id === b.plan) || { name: b.plan, basePrice: 0 };
    const fgCut = calculateFitnessGroupCut(plan.basePrice, b.paymentMethod, data.iva);
    
    if (b.paymentMethod === 'transferencia') {
      fgTransferencia += fgCut;
      atlasTransferencia += data.commission;
      transfersList.push({ b, plan, fgCut, atlasCut: data.commission });
    } else {
      fgEfectivo += fgCut;
      atlasEfectivo += data.commission;
      cashList.push({ b, plan, fgCut, atlasCut: data.commission });
    }
  });

  const totalToPayFG = fgTransferencia + fgEfectivo;
  const totalAtlasProfit = atlasTransferencia + atlasEfectivo;

  const today = new Date().getDate();
  const showPaymentAlert = today >= 5 && today <= 10;

  const handleLiquidate = () => {
    addTransaction({
      date: new Date().toISOString().split('T')[0],
      amount: totalToPayFG,
      type: 'egreso',
      method: 'mixto',
      beneficiary: 'Fitness Groups S.A.',
      details: 'Liquidación Mensual',
      ref: `LIQ-${Date.now().toString().slice(-4)}`
    });
    setShowConfirm(false);
    alert("Liquidación registrada con éxito en Pagos e Historial.");
  };

  return (
    <div className="fitness-groups-page">
      <div className="flex-between mb-6">
        <div>
          <h1>Pagos a Fitness Groups</h1>
          <p>Liquidación, diferenciación y comisión neta</p>
        </div>
      </div>

      {showPaymentAlert && (
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
          <div className="glass-panel" style={{ width: '400px', textAlign: 'center' }}>
            <h3 className="mb-4">Confirmar Liquidación</h3>
            <p className="mb-6">Se registrará un egreso por <strong>${totalToPayFG.toLocaleString()}</strong> a Fitness Groups.</p>
            <div className="flex-between">
              <button className="btn btn-outline" onClick={() => setShowConfirm(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleLiquidate}>Confirmar Pago</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-panel">
          <div className="flex-between mb-4">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Landmark size={20} color="var(--info)" />
              Total Transferencias
            </h3>
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
              Total Efectivo
            </h3>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="glass-panel">
          <h4 className="mb-4">Listado - Transferencias</h4>
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
                {transfersList.map((t, idx) => (
                  <tr key={idx}>
                    <td>{t.b.name} <span style={{display:'block', fontSize:'0.75rem', color:'var(--text-muted)'}}>{t.plan.name}</span></td>
                    <td>${t.fgCut.toLocaleString()}</td>
                    <td style={{color: 'var(--primary)'}}>${t.atlasCut.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="glass-panel">
          <h4 className="mb-4">Listado - Efectivo</h4>
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
                {cashList.map((t, idx) => (
                  <tr key={idx}>
                    <td>{t.b.name} <span style={{display:'block', fontSize:'0.75rem', color:'var(--text-muted)'}}>{t.plan.name}</span></td>
                    <td>${t.fgCut.toLocaleString()}</td>
                    <td style={{color: 'var(--primary)'}}>${t.atlasCut.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FitnessGroups;
