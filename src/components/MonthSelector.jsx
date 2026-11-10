import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { 
  getCurrentMonth, 
  formatMonthLabel, 
  getAvailableMonths, 
  changeMonth 
} from '../utils/monthUtils';

const MonthSelector = ({
  selectedMonth,
  onChange,
  transactions = [],
  includeAllOption = false,
  label = 'Filtrar por Mes'
}) => {
  const currentMonth = getCurrentMonth();
  const availableMonths = getAvailableMonths(transactions, includeAllOption);

  const handlePrev = () => {
    const next = changeMonth(selectedMonth, -1);
    onChange(next);
  };

  const handleNext = () => {
    const next = changeMonth(selectedMonth, 1);
    onChange(next);
  };

  const isCurrent = selectedMonth === currentMonth;

  return (
    <div 
      className="glass-panel" 
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '0.6rem', 
        padding: '0.45rem 0.85rem',
        borderRadius: 'var(--radius-sm)',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid var(--border-light)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem' }}>
        <Calendar size={16} />
        {label && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginRight: '0.2rem' }}>{label}:</span>}
      </div>

      {/* Prev button */}
      <button
        onClick={handlePrev}
        disabled={selectedMonth === 'todos'}
        title="Mes anterior"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--border-light)',
          borderRadius: '4px',
          color: selectedMonth === 'todos' ? 'var(--text-muted)' : 'var(--text-main)',
          cursor: selectedMonth === 'todos' ? 'not-allowed' : 'pointer',
          padding: '0.25rem 0.4rem',
          display: 'flex',
          alignItems: 'center',
          opacity: selectedMonth === 'todos' ? 0.4 : 1
        }}
      >
        <ChevronLeft size={16} />
      </button>

      {/* Select dropdown */}
      <select
        value={selectedMonth}
        onChange={(e) => onChange(e.target.value)}
        className="input-field"
        style={{
          margin: 0,
          padding: '0.35rem 0.75rem',
          fontSize: '0.88rem',
          fontWeight: 600,
          color: 'var(--text-main)',
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid var(--border-light)',
          borderRadius: '4px',
          cursor: 'pointer',
          width: 'auto'
        }}
      >
        {includeAllOption && (
          <option value="todos">Todos los meses (Histórico completo)</option>
        )}
        {availableMonths.filter(m => m !== 'todos').map(m => (
          <option key={m} value={m}>
            {formatMonthLabel(m)} {m === currentMonth ? '• (Mes Actual)' : ''}
          </option>
        ))}
      </select>

      {/* Next button */}
      <button
        onClick={handleNext}
        disabled={selectedMonth === 'todos'}
        title="Mes siguiente"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--border-light)',
          borderRadius: '4px',
          color: selectedMonth === 'todos' ? 'var(--text-muted)' : 'var(--text-main)',
          cursor: selectedMonth === 'todos' ? 'not-allowed' : 'pointer',
          padding: '0.25rem 0.4rem',
          display: 'flex',
          alignItems: 'center',
          opacity: selectedMonth === 'todos' ? 0.4 : 1
        }}
      >
        <ChevronRight size={16} />
      </button>

      {/* Quick jump to current month button if not on current */}
      {!isCurrent && (
        <button
          onClick={() => onChange(currentMonth)}
          className="btn btn-outline"
          title="Volver al mes actual"
          style={{
            padding: '0.25rem 0.55rem',
            fontSize: '0.78rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            borderColor: 'var(--primary)',
            color: 'var(--primary)'
          }}
        >
          <RotateCcw size={12} />
          Mes actual
        </button>
      )}
    </div>
  );
};

export default MonthSelector;
