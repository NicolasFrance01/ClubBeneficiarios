import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { calculateFinalPrice, calculateFitnessGroupCut } from '../store';
import { calculateReferralDeductions } from '../utils/referralCalculations';
import { 
  ShieldCheck, Landmark, Briefcase, DollarSign, TrendingUp, Users, 
  ArrowRight, Search, CheckCircle2, AlertCircle, Copy, Check, Filter, Layers
} from 'lucide-react';

const Atlascore = () => {
  const { data } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('todos');
  const [copiedId, setCopiedId] = useState(null);

  // 1. Calculate Gross Atlascore Commissions from Transfer and Cash (same as in Payments.jsx)
  let totalTransferencia = 0;
  let fgTransferencia = 0;
  let atlasTransferencia = 0;

  let totalEfectivo = 0;
  let fgEfectivo = 0;
  let atlasEfectivo = 0;

  (data.beneficiaries || []).forEach(b => {
    if (b.status === 'activo') {
      const plan = (data.plans || []).find(p => p.id === b.plan);
      if (plan) {
        const planComm = Number(plan.commission) || 0;
        const fgCut = calculateFitnessGroupCut(plan.basePrice, b.paymentMethod, data.iva);
        if (b.paymentMethod === 'transferencia') {
          totalTransferencia += calculateFinalPrice(plan.basePrice, 'transferencia', planComm, data.iva);
          fgTransferencia += fgCut;
          atlasTransferencia += planComm;
        } else {
          totalEfectivo += calculateFinalPrice(plan.basePrice, 'efectivo', planComm, data.iva);
          fgEfectivo += fgCut;
          atlasEfectivo += planComm;
        }
      }
    }
  });

  const totalAtlasBruto = atlasTransferencia + atlasEfectivo;

  // 2. Calculate Referent Deductions based on configured timing rules
  const calculation = calculateReferralDeductions(
    data.beneficiaries || [],
    data.transactions || [],
    data.referents || [],
    data.plans || []
  );

  const totalDeduccionReferentes = calculation.totalReferentPayout || 0;
  const gananciaNetaAtlascore = Math.max(0, totalAtlasBruto - totalDeduccionReferentes);
  const margenNeto = totalAtlasBruto > 0 ? ((gananciaNetaAtlascore / totalAtlasBruto) * 100).toFixed(1) : 100;

  // Copy CBU/Alias helper
  const handleCopy = (id, text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter items
  const filteredItems = calculation.items.filter(item => {
    const matchesSearch = 
      item.beneficiaryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.referentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.planName && item.planName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesMethod = 
      selectedMethod === 'todos' || 
      item.paymentMethod.toLowerCase() === selectedMethod.toLowerCase();

    return matchesSearch && matchesMethod;
  });

  // Group summary by referent for payout cards
  const referentsWithPayouts = Object.values(calculation.referentSummary || {}).filter(s => s.totalCommissions > 0 || s.beneficiaryNames.size > 0);

  return (
    <div className="atlascore-page">
      {/* Page Header */}
      <div className="flex-between mb-6">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldCheck size={32} color="var(--primary)" />
            Módulo Atlascore
          </h1>
          <p>Consolidación de cuenta única, liquidación a referentes por tiempo y margen neto de ganancia</p>
        </div>
      </div>

      {/* Main Income Breakdown (Transferencia + Efectivo = Una Sola Cuenta) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        
        {/* Card: Transferencia */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div className="flex-between mb-2">
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Comisión Atlascore (Transferencia)
            </span>
            <Landmark size={20} color="var(--info)" />
          </div>
          <h2 style={{ margin: 0, color: 'var(--info)', fontSize: '1.8rem' }}>
            ${atlasTransferencia.toLocaleString()}
          </h2>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Recaudación total: ${totalTransferencia.toLocaleString()} | FG: ${fgTransferencia.toLocaleString()}
          </div>
        </div>

        {/* Card: Efectivo */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div className="flex-between mb-2">
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Comisión Atlascore (Efectivo)
            </span>
            <Briefcase size={20} color="var(--success)" />
          </div>
          <h2 style={{ margin: 0, color: 'var(--success)', fontSize: '1.8rem' }}>
            ${atlasEfectivo.toLocaleString()}
          </h2>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Recaudación total: ${totalEfectivo.toLocaleString()} | FG: ${fgEfectivo.toLocaleString()}
          </div>
        </div>

        {/* Card: Suma Total (Cuenta Única) */}
        <div className="glass-panel" style={{ padding: '1.25rem', border: '1px solid rgba(0, 242, 254, 0.3)' }}>
          <div className="flex-between mb-2">
            <span style={{ fontSize: '0.8rem', color: 'var(--primary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>
              Cuenta Única: Comisión Bruta Atlascore
            </span>
            <Layers size={20} color="var(--primary)" />
          </div>
          <h2 style={{ margin: 0, color: 'var(--primary)', fontSize: '1.8rem' }}>
            ${totalAtlasBruto.toLocaleString()}
          </h2>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Suma total bruta (Transferencia + Efectivo)
          </div>
        </div>
      </div>

      {/* Consolidation Hero Banner: Bruto - Referentes = Ganancia Neta Atlascore */}
      <div className="glass-panel mb-6" style={{ 
        padding: '1.5rem', 
        background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.08) 0%, rgba(79, 70, 229, 0.08) 100%)',
        border: '1px solid rgba(0, 242, 254, 0.3)',
        borderRadius: 'var(--radius-md)'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', alignItems: 'center' }}>
          
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>1. Comisión Bruta Total</span>
            <h2 style={{ margin: '0.25rem 0', color: 'var(--text-main)', fontSize: '1.8rem' }}>
              ${totalAtlasBruto.toLocaleString()}
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Transferencia + Efectivo</span>
          </div>

          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '1.25rem', color: 'var(--danger)', fontWeight: 700, margin: '0 0.5rem' }}>—</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--warning)', textTransform: 'uppercase' }}>2. Resta por Referentes</span>
            <h2 style={{ margin: '0.25rem 0', color: 'var(--warning)', fontSize: '1.8rem' }}>
              -${totalDeduccionReferentes.toLocaleString()}
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Liquidación a afiliados</span>
          </div>

          <div style={{ 
            background: 'rgba(0, 242, 254, 0.12)', 
            padding: '1rem 1.25rem', 
            borderRadius: 'var(--radius-sm)', 
            border: '1px solid rgba(0, 242, 254, 0.4)',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--primary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
              = Ganancia Neta Atlascore
            </span>
            <h1 style={{ margin: '0.25rem 0', color: '#00f2fe', fontSize: '2.2rem', textShadow: '0 0 20px rgba(0, 242, 254, 0.4)' }}>
              ${gananciaNetaAtlascore.toLocaleString()}
            </h1>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 600 }}>
              Margen de Ganancia Real: {margenNeto}%
            </span>
          </div>
        </div>
      </div>

      {/* Payout by Referent Cards */}
      <div className="mb-6">
        <h3 className="mb-3" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={20} color="var(--primary)" />
          Liquidación Detallada por Referente (A Restar de Atlascore)
        </h3>

        {referentsWithPayouts.length === 0 ? (
          <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No hay deducciones de referentes registradas aún. Configura referentes en el módulo "Referentes" y asígnalos a los beneficiarios.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {referentsWithPayouts.map(s => {
              const r = s.referent;
              const type = r.commissionType || r.commission_type || 'ingreso';
              const months = Number(r.commissionMonths ?? r.commission_months ?? 1);
              const cbu = r.cbuAlias || r.cbu_alias;

              return (
                <div key={r.id} className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
                  <div className="flex-between mb-2">
                    <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{r.name}</strong>
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.08)', fontSize: '0.75rem' }}>
                      {type === 'ingreso' ? 'Solo Ingreso' : type === 'meses' ? `Ingreso + ${months} Meses` : 'Por Siempre'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    Beneficiarios aportados: <strong style={{ color: 'var(--text-main)' }}>{s.beneficiaryNames.size}</strong> | Pagos calificados: <strong style={{ color: 'var(--text-main)' }}>{s.qualifiedPaymentsCount}</strong>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem' }}>
                    <div className="flex-between">
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total a Restar a Atlas:</span>
                      <strong style={{ fontSize: '1.25rem', color: 'var(--warning)' }}>${s.totalCommissions.toLocaleString()}</strong>
                    </div>
                  </div>

                  {cbu ? (
                    <div className="flex-between" style={{ fontSize: '0.8rem', background: 'rgba(0, 242, 254, 0.05)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>CBU/Alias: <strong style={{ color: 'var(--text-main)' }}>{cbu}</strong></span>
                      <button 
                        onClick={() => handleCopy(r.id, cbu)} 
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        title="Copiar CBU/Alias"
                      >
                        {copiedId === r.id ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                        {copiedId === r.id ? 'Copiado' : 'Copiar'}
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sin CBU/Alias configurado</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Itemized Transactions & Deductions Table */}
      <div className="glass-panel">
        <div className="flex-between mb-4">
          <div>
            <h3 style={{ margin: 0 }}>Desglose por Beneficiario, Cuota y Referente</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Detalle exacto de cuánto ingresa por cada beneficiario y cuánto se le resta a Atlascore por su referente
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '260px' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                className="input-field" 
                placeholder="Buscar beneficiario, referente..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '32px' }}
              />
            </div>

            <select 
              className="input-field" 
              value={selectedMethod} 
              onChange={(e) => setSelectedMethod(e.target.value)}
              style={{ width: 'auto' }}
            >
              <option value="todos">Todos los Métodos</option>
              <option value="transferencia">Transferencia</option>
              <option value="efectivo">Efectivo</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Beneficiario</th>
                <th>Plan & Método</th>
                <th>Cuota / Período</th>
                <th>Referente Asignado</th>
                <th>Regla de Tiempo</th>
                <th>Comisión Bruta Plan</th>
                <th>Resta Referente</th>
                <th>Neto para Atlascore</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    No se encontraron registros de beneficiarios o pagos.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item.id}>
                    <td>
                      <strong style={{ color: 'var(--text-main)', display: 'block' }}>{item.beneficiaryName}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DNI: {item.beneficiaryDoc}</span>
                    </td>

                    <td>
                      <span className="badge mb-1" style={{ background: 'rgba(255,255,255,0.05)' }}>{item.planName}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'capitalize' }}>
                        {item.paymentMethod}
                      </span>
                    </td>

                    <td>
                      <span style={{ fontWeight: 600 }}>{item.period}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{item.txDate}</span>
                    </td>

                    <td>
                      <strong style={{ color: item.referentName !== 'Ninguno' ? 'var(--text-main)' : 'var(--text-muted)' }}>
                        {item.referentName}
                      </strong>
                    </td>

                    <td>
                      {item.referentName === 'Ninguno' ? (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>-</span>
                      ) : item.isEligible ? (
                        <div>
                          <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}>
                            {item.referentRule}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--success)', display: 'block', marginTop: '0.2rem' }}>
                            ✓ Comisiona
                          </span>
                        </div>
                      ) : item.referentRule === 'Sin Comisión' ? (
                        <div>
                          <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
                            Sin Comisión
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--success)', display: 'block', marginTop: '0.2rem' }}>
                            100% queda en Atlascore
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)' }}>
                            {item.referentRule}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>
                            Tiempo Vencido (Queda en Atlas)
                          </span>
                        </div>
                      )}
                    </td>

                    <td style={{ fontWeight: 600 }}>
                      ${item.atlasGross.toLocaleString()}
                    </td>

                    <td style={{ fontWeight: 600, color: item.referentDeduction > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>
                      {item.referentDeduction > 0 ? `-$${item.referentDeduction.toLocaleString()}` : '$0'}
                    </td>

                    <td>
                      <strong style={{ color: 'var(--primary)', fontSize: '1rem' }}>
                        ${item.atlasNet.toLocaleString()}
                      </strong>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredItems.length > 0 && (
              <tfoot>
                <tr style={{ background: 'rgba(0,0,0,0.3)', fontWeight: 700, borderTop: '2px solid var(--border-light)' }}>
                  <td colSpan="5" style={{ textAlign: 'right', padding: '1rem' }}>Totales Consolidados:</td>
                  <td>${filteredItems.reduce((acc, i) => acc + i.atlasGross, 0).toLocaleString()}</td>
                  <td style={{ color: 'var(--warning)' }}>-${filteredItems.reduce((acc, i) => acc + i.referentDeduction, 0).toLocaleString()}</td>
                  <td style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>${filteredItems.reduce((acc, i) => acc + i.atlasNet, 0).toLocaleString()}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default Atlascore;
