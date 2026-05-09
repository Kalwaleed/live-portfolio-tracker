import { RawHolding } from '../types';

/**
 * Generic currency conversion rule. A rule matches by symbol predicate and
 * converts a foreign-denominated number into USD.
 *
 * Adding a new currency = adding a new rule. The pipeline step does not
 * need to change.
 */
export interface CurrencyRule {
  /** Returns true if this rule applies to the given symbol. */
  symbolMatches(symbol: string): boolean;
  /** Converts a foreign-denominated value to USD. */
  toUsd(foreignAmount: number): number;
}

/** SAR/USD = 3.75 (pegged). Matches Saudi Tadawul tickers (e.g. '4280', '4280.SR'). */
export const SAUDI_RIYAL_RULE: CurrencyRule = {
  symbolMatches: (symbol) => symbol === '4280' || symbol.startsWith('4280.'),
  toUsd: (sar) => sar / 3.75,
};

const PRICE_FIELDS: Array<keyof RawHolding> = [
  'CurrentPrice', 'PurchasePrice', 'HighLimit', 'LowLimit',
  'Open', 'High', 'Low', 'Commission',
];

/**
 * Apply a list of currency rules to each row. Each row is matched against
 * each rule in order; the first match converts every price-denominated
 * field on that row.
 *
 * Pure: returns new rows, never mutates inputs.
 */
export const applyCurrencyRules = (
  rows: RawHolding[],
  rules: CurrencyRule[]
): RawHolding[] =>
  rows.map((row) => {
    const rule = rules.find((r) => r.symbolMatches(row.Symbol));
    if (!rule) return row;
    const converted = { ...row };
    for (const field of PRICE_FIELDS) {
      converted[field] = rule.toUsd(row[field] as number) as never;
    }
    return converted;
  });
