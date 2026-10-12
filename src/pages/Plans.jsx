import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { calculateFinalPrice } from '../store';
import { Edit3, CheckCircle2, Info, Check, X, ShieldCheck } from 'lucide-react';

const Plans = () => {
  const { data, updatePlanCommission } = useContext(AppContext);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [tempCommission, setTempCommission] = useState('');

  const handleStartEdit = (plan) => {
    setEditingPlanId(plan.id);
    setTempCommission(plan.commission || 5000);
  };

  const handleSavePlanCommission = (planId) => {
    const val = parseFloat(tempCommission);
    if (!isNaN(val) && val >= 0) {
      updatePlanCommission(planId, val);
    }
    setEditingPlanId(null);
  };

  const handleCancelEdit = () => {
    setEditingPlanId(null);
  };

  return (
    <div className="plans-page">
      <div className="flex-between mb-6">
        <div>
          <h1>Planes y Valores</h1>
          <p>Precios de Fitness Groups y comisiones individuales de Atlascore por plan</p>
        </div>
        
        <div className="glass-panel" style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ShieldCheck size={24} color="var(--primary)" />
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Esquema de Comisiones</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Cada plan tiene su propia comisión asignada</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {data.plans.map(plan => {
          const planComm = Number(plan.commission) || 0;
          const isThisEditing = editingPlanId === plan.id;
          const precioEfectivo = calculateFinalPrice(plan.basePrice, 'efectivo', planComm, data.iva);
          const precioTransferencia = calculateFinalPrice(plan.basePrice, 'transferencia', planComm, data.iva);

          return (
            <div key={plan.id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <div className="flex-between mb-2">
                  <span className={`badge badge-${plan.id}`}>{plan.name}</span>
                </div>
                <h2>${plan.basePrice.toLocaleString()}</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Costo base a Fitness Group (Efectivo)</p>
              </div>

              {/* Individual Atlascore Commission Section */}
              <div style={{ 
                background: 'rgba(0, 242, 254, 0.05)', 
                border: '1px solid rgba(0, 242, 254, 0.2)', 
                borderRadius: 'var(--radius-sm)', 
                padding: '1rem', 
                marginBottom: '1.25rem' 
              }}>
                <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Comisión Atlascore
                  </span>
                  {!isThisEditing && (
                    <button 
                      onClick={() => handleStartEdit(plan)} 
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}
                      title="Modificar comisión de este plan"
                    >
                      <Edit3 size={14} /> Editar
                    </button>
                  )}
                </div>

                {isThisEditing ? (
                  <div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ color: 'var(--primary)', fontWeight: 700 }}>$</span>
                      <input 
                        type="number" 
                        className="input-field" 
                        value={tempCommission} 
                        onChange={(e) => setTempCommission(e.target.value)}
                        style={{ padding: '0.4rem 0.6rem', flex: 1, fontSize: '1rem' }}
                        autoFocus
                      />
                      <button 
                        className="btn btn-primary" 
                        onClick={() => handleSavePlanCommission(plan.id)}
                        style={{ padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        title="Guardar nueva comisión"
                      >
                        <Check size={16} />
                      </button>
                      <button 
                        style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--text-muted)', borderRadius: 'var(--radius-sm)', padding: '0.4rem 0.6rem', cursor: 'pointer' }}
                        onClick={handleCancelEdit}
                        title="Cancelar"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                      Se actualizará inmediatamente el valor final al beneficiario.
                    </p>
                  </div>
                ) : (
                  <div>
                    <h3 style={{ margin: 0, color: 'var(--primary)', fontSize: '1.35rem' }}>
                      ${planComm.toLocaleString()}
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                      Ganancia de Atlascore por beneficiario en este plan
                    </p>
                  </div>
                )}
              </div>
              
              <div style={{ flex: 1 }}>
                <h4 style={{ color: 'var(--text-main)', marginBottom: '0.35rem', fontSize: '0.9rem' }}>Enfoque</h4>
                <p style={{ fontSize: '0.85rem', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>{plan.description}</p>
                
                <h4 style={{ color: 'var(--text-main)', marginBottom: '0.35rem', fontSize: '0.9rem' }}>Actividades Core</h4>
                <p style={{ fontSize: '0.85rem', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>{plan.includes}</p>
                
                <h4 style={{ color: 'var(--text-main)', marginBottom: '0.35rem', fontSize: '0.9rem' }}>Sedes Clave</h4>
                <p style={{ fontSize: '0.85rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>{plan.sedes}</p>
              </div>

              {/* Dynamic Final Price Section */}
              <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginTop: '1rem', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--primary)' }}>
                  <Info size={16} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Valor Final al Beneficiario</span>
                </div>
                
                <div className="flex-between" style={{ marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Pagando en Efectivo:</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(Base + Comisión)</span>
                  </div>
                  <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>${precioEfectivo.toLocaleString()}</strong>
                </div>

                <div className="flex-between" style={{ fontSize: '0.9rem', paddingTop: '0.4rem', borderTop: '1px dashed var(--border-light)' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Transferencia (c/IVA):</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(Base + IVA 21% + Comisión)</span>
                  </div>
                  <strong style={{ fontSize: '1.05rem', color: 'var(--primary)' }}>${precioTransferencia.toLocaleString()}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Plans;
