import React, { useState } from 'react';
import { initialData, calculateFinalPrice } from '../store';
import { Edit3, CheckCircle2, Info } from 'lucide-react';

const Plans = () => {
  const [commission, setCommission] = useState(initialData.commission);
  const [isEditing, setIsEditing] = useState(false);

  const handleSaveCommission = () => {
    // In a real app, save to backend/context
    initialData.commission = parseInt(commission);
    setIsEditing(false);
  };

  return (
    <div className="plans-page">
      <div className="flex-between mb-6">
        <div>
          <h1>Planes y Valores</h1>
          <p>Configuración de precios de Fitness Groups y comisiones de Atlascore</p>
        </div>
        
        <div className="glass-panel" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Comisión Atlascore</p>
            {isEditing ? (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                <input 
                  type="number" 
                  className="input-field" 
                  value={commission} 
                  onChange={(e) => setCommission(e.target.value)}
                  style={{ width: '100px', padding: '0.25rem 0.5rem' }}
                />
                <button className="btn btn-primary" onClick={handleSaveCommission} style={{ padding: '0.25rem 0.5rem' }}>Guardar</button>
              </div>
            ) : (
              <h3 style={{ margin: 0, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                ${parseInt(commission).toLocaleString()}
                <button onClick={() => setIsEditing(true)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <Edit3 size={16} />
                </button>
              </h3>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {initialData.plans.map(plan => (
          <div key={plan.id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <span className={`badge badge-${plan.id} mb-4`}>{plan.name}</span>
              <h2>${plan.basePrice.toLocaleString()}</h2>
              <p style={{ fontSize: '0.85rem' }}>Valor base (Efectivo a Fitness Group)</p>
            </div>
            
            <div style={{ flex: 1 }}>
              <h4 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>Enfoque</h4>
              <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>{plan.description}</p>
              
              <h4 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>Actividades Core</h4>
              <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>{plan.includes}</p>
              
              <h4 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>Sedes Clave</h4>
              <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>{plan.sedes}</p>
            </div>

            <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>
                <Info size={16} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Valor Final al Beneficiario</span>
              </div>
              
              <div className="flex-between" style={{ marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Pagando en Efectivo:</span>
                <strong>${calculateFinalPrice(plan.basePrice, 'efectivo', parseInt(commission), initialData.iva).toLocaleString()}</strong>
              </div>
              <div className="flex-between" style={{ fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Pagando Transferencia (c/IVA):</span>
                <strong>${calculateFinalPrice(plan.basePrice, 'transferencia', parseInt(commission), initialData.iva).toLocaleString()}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Plans;
