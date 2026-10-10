import React from 'react';
import { initialData, calculateFinalPrice, calculateFitnessGroupCut } from '../store';
import { ArrowUpRight, ArrowDownRight, Briefcase, Landmark } from 'lucide-react';

const Payments = () => {
  // Mock payment history
  const paymentHistory = [
    { id: 101, date: '2026-10-09 10:30', amount: 65000, type: 'ingreso', method: 'transferencia', beneficiary: 'Maria Gomez', details: 'Cuota Octubre', ref: 'TRX-9921' },
    { id: 102, date: '2026-10-08 15:45', amount: 34000, type: 'ingreso', method: 'efectivo', beneficiary: 'Juan Perez', details: 'Cuota Octubre', ref: 'REC-0012' },
    { id: 103, date: '2026-10-05 09:00', amount: 45000, type: 'egreso', method: 'transferencia', beneficiary: 'Fitness Group S.A.', details: 'Liquidación Quincenal', ref: 'TRX-1092' },
  ];

  let totalTransferencia = 0;
  let totalEfectivo = 0;
  let fgTransferencia = 0;
  let fgEfectivo = 0;
  let atlasComisionTotal = 0;

  initialData.beneficiaries.forEach(b => {
    if (b.status === 'activo') {
      const plan = initialData.plans.find(p => p.id === b.plan);
      const fgCut = calculateFitnessGroupCut(plan.basePrice, b.paymentMethod, initialData.iva);
      
      atlasComisionTotal += initialData.commission;

      if (b.paymentMethod === 'transferencia') {
        const finalPrice = calculateFinalPrice(plan.basePrice, 'transferencia', initialData.commission, initialData.iva);
        totalTransferencia += finalPrice;
        fgTransferencia += fgCut;
      } else {
        const finalPrice = calculateFinalPrice(plan.basePrice, 'efectivo', initialData.commission, initialData.iva);
        totalEfectivo += finalPrice;
        fgEfectivo += fgCut;
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
        <button className="btn btn-primary">Registrar Transacción</button>
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
              <strong style={{ color: 'var(--primary)' }}>${(initialData.commission * initialData.beneficiaries.filter(b => b.paymentMethod === 'transferencia' && b.status === 'activo').length).toLocaleString()}</strong>
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
              <strong style={{ color: 'var(--primary)' }}>${(initialData.commission * initialData.beneficiaries.filter(b => b.paymentMethod === 'efectivo' && b.status === 'activo').length).toLocaleString()}</strong>
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
              {paymentHistory.map(tx => (
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
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ref: {tx.ref}</span>
                  </td>
                  <td style={{ fontWeight: 600 }}>${tx.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Payments;
