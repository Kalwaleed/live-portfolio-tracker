export const fmtUsd = (val: number | undefined, opts?: { compact?: boolean }) => {
  if (val === undefined || Number.isNaN(val)) return '—';
  if (opts?.compact) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(val);
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(val);
};

export const fmtNum = (val: number | undefined, decimals = 2) => {
  if (val === undefined || Number.isNaN(val)) return '—';
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(val);
};

export const fmtInt = (val: number | undefined) => {
  if (val === undefined || Number.isNaN(val)) return '—';
  return new Intl.NumberFormat('en-US').format(Math.round(val));
};

export const fmtPct = (val: number | undefined, decimals = 2, withSign = true) => {
  if (val === undefined || Number.isNaN(val)) return '—';
  const sign = withSign && val > 0 ? '+' : '';
  return `${sign}${val.toFixed(decimals)}%`;
};

export const fmtSignedUsd = (val: number | undefined) => {
  if (val === undefined || Number.isNaN(val)) return '—';
  const sign = val > 0 ? '+' : '';
  return sign + fmtUsd(val);
};

export const cls = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ');

export const plClass = (val: number | undefined) => {
  if (val === undefined || val === 0) return 'text-ink-2';
  return val > 0 ? 'text-green' : 'text-red';
};
