import React, { useState } from 'react';
import { initialData, calculateFinalPrice, calculateFitnessGroupCut } from '../store';
import { Users, TrendingUp, DollarSign, Activity } from 'lucide-react';

const Dashboard = () => {
  const [data] = useState(initialData);

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

  return (
    <div className="dashboard-page">
      <h1>Dashboard Principal</h1>
      <p className="mb-6">Resumen general de Atlascore & Fitness Groups</p>

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
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Pago a Fitness Groups</p>
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
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
