import { RawHolding } from '../types';

/**
 * Robust date parser for mixed formats (YYYY/MM/DD and YYYYMMDD).
 */
export const parseDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const cleanStr = dateStr.toString().trim();
  if (/^\d{8}$/.test(cleanStr)) {
    const y = cleanStr.substring(0, 4);
    const m = cleanStr.substring(4, 6);
    const d = cleanStr.substring(6, 8);
    return `${y}-${m}-${d}`;
  }
  return cleanStr.replace(/\//g, '-');
};

const FLOAT_HEADERS = new Set([
  'CurrentPrice', 'Price', 'Last', 'LastPrice',
  'Change', 'Open', 'High', 'Low',
  'PurchasePrice', 'Cost', 'CostBasis', 'AvgCost',
  'Commission', 'HighLimit', 'LowLimit',
]);

const INT_HEADERS = new Set(['Volume', 'Quantity', 'Qty']);

const SYMBOL_HEADERS = new Set(['Ticker', 'Stock', 'Symbol']);
const PRICE_HEADERS = new Set(['CurrentPrice', 'Price', 'Last', 'LastPrice']);
const COST_HEADERS = new Set(['PurchasePrice', 'Cost', 'AvgCost', 'CostBasis']);

const STRING_FIELDS = new Set(['Symbol', 'Date', 'Time', 'TradeDate', 'Comment', 'TransactionType', 'Sector']);

const coerce = (header: string, raw: string): string | number => {
  if (FLOAT_HEADERS.has(header)) return parseFloat(raw) || 0;
  if (INT_HEADERS.has(header)) return parseInt(raw, 10) || 0;
  return raw;
};

const canonicalKey = (header: string): keyof RawHolding | null => {
  const k = header.replace(/\s+/g, '');
  if (k === 'Qty') return 'Quantity';
  if (SYMBOL_HEADERS.has(k)) return 'Symbol';
  if (PRICE_HEADERS.has(k)) return 'CurrentPrice';
  if (COST_HEADERS.has(k)) return 'PurchasePrice';
  // Direct passthrough for known RawHolding fields
  const knownFields = new Set<keyof RawHolding>([
    'Symbol', 'Quantity', 'CurrentPrice', 'PurchasePrice',
    'HighLimit', 'LowLimit', 'Date', 'Time', 'Change',
    'Open', 'High', 'Low', 'Volume', 'TradeDate',
    'Commission', 'Comment', 'TransactionType', 'Sector',
  ]);
  return knownFields.has(k as keyof RawHolding) ? (k as keyof RawHolding) : null;
};

const EMPTY_RAW: RawHolding = {
  Symbol: '', Quantity: 0, CurrentPrice: 0, PurchasePrice: 0,
  HighLimit: 0, LowLimit: 0,
  Date: '', Time: '', Change: 0,
  Open: 0, High: 0, Low: 0, Volume: 0,
  TradeDate: '', Commission: 0,
  Comment: '', TransactionType: '',
};

/**
 * Parse raw CSV text into RawHolding rows. No currency conversion, no
 * sector inference — those are downstream pipeline steps.
 */
export const parseCSV = (csvText: string): RawHolding[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const results: RawHolding[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    if (values.length < headers.length) continue;

    const row: RawHolding = { ...EMPTY_RAW };
    for (let j = 0; j < headers.length; j++) {
      const key = canonicalKey(headers[j]);
      if (!key) continue;
      const coerced = coerce(key, values[j]);
      if (STRING_FIELDS.has(key)) {
        (row[key] as string) = String(coerced);
      } else {
        (row[key] as number) = typeof coerced === 'number' ? coerced : parseFloat(String(coerced)) || 0;
      }
    }

    if (row.Symbol) results.push(row);
  }
  return results;
};
