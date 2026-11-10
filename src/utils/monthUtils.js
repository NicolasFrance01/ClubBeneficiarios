/**
 * Utility functions for month filtering and formatting
 */

export const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Returns current month string in YYYY-MM format (e.g., '2026-11')
 */
export const getCurrentMonth = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

/**
 * Extracts YYYY-MM from a date string, timestamp or Date object
 */
export const getTransactionMonth = (dateRaw) => {
  if (!dateRaw) return '';
  const str = String(dateRaw).trim();
  // If it already starts with YYYY-MM
  if (/^\d{4}-\d{2}/.test(str)) {
    return str.slice(0, 7);
  }
  try {
    const d = new Date(dateRaw);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      return `${y}-${m}`;
    }
  } catch {}
  return '';
};

/**
 * Formats YYYY-MM into a friendly label like "Noviembre 2026"
 */
export const formatMonthLabel = (yearMonthStr) => {
  if (!yearMonthStr || yearMonthStr === 'todos') return 'Histórico Completo';
  const parts = yearMonthStr.split('-');
  if (parts.length !== 2) return yearMonthStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const monthName = MONTH_NAMES_ES[monthIdx] || parts[1];
  return `${monthName} ${year}`;
};

/**
 * Extracts all unique YYYY-MM months from transactions, ensuring current month is present
 */
export const getAvailableMonths = (transactions = [], includeAllOption = false) => {
  const current = getCurrentMonth();
  const set = new Set();
  set.add(current);

  (transactions || []).forEach(tx => {
    const m = getTransactionMonth(tx.date);
    if (m) set.add(m);
  });

  const sorted = Array.from(set).sort().reverse();
  if (includeAllOption) {
    return ['todos', ...sorted];
  }
  return sorted;
};

/**
 * Returns previous or next YYYY-MM month string
 */
export const changeMonth = (yearMonthStr, offset) => {
  if (!yearMonthStr || yearMonthStr === 'todos') {
    yearMonthStr = getCurrentMonth();
  }
  const parts = yearMonthStr.split('-');
  let y = parseInt(parts[0], 10);
  let m = parseInt(parts[1], 10) - 1; // 0-indexed

  m += offset;
  while (m < 0) {
    m += 12;
    y -= 1;
  }
  while (m > 11) {
    m -= 12;
    y += 1;
  }

  return `${y}-${String(m + 1).padStart(2, '0')}`;
};
