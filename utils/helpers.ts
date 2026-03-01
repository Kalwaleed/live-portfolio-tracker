import { PortfolioItem } from '../types';

/**
 * Robust date parser for mixed formats (YYYY/MM/DD and 20251118)
 */
export const parseDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const cleanStr = dateStr.toString().trim();
  
  // Handle 20251118 format
  if (/^\d{8}$/.test(cleanStr)) {
    const y = cleanStr.substring(0, 4);
    const m = cleanStr.substring(4, 6);
    const d = cleanStr.substring(6, 8);
    return `${y}-${m}-${d}`;
  }
  
  // Handle YYYY/MM/DD or YYYY-MM-DD
  return cleanStr.replace(/\//g, '-');
};

/**
 * Infers sector based on common tickers for demo purposes
 */
const deriveSector = (symbol: string): string => {
  const map: Record<string, string> = {
    'NVDA': 'Technology', 'AAPL': 'Technology', 'MSFT': 'Technology', 'AMD': 'Technology', 'INTC': 'Technology', 'AVGO': 'Technology', 'ORCL': 'Technology',
    'TSLA': 'Automotive', 'F': 'Automotive', 'GM': 'Automotive', 'TM': 'Automotive',
    'GOOGL': 'Communication', 'GOOG': 'Communication', 'META': 'Communication', 'NFLX': 'Communication', 'DIS': 'Communication',
    'AMZN': 'Consumer Cyclical', 'HD': 'Consumer Cyclical', 'MCD': 'Consumer Cyclical', 'NKE': 'Consumer Cyclical',
    'WMT': 'Consumer Defensive', 'PG': 'Consumer Defensive', 'KO': 'Consumer Defensive', 'COST': 'Consumer Defensive',
    'JPM': 'Financial', 'BAC': 'Financial', 'V': 'Financial', 'MA': 'Financial', 'WFC': 'Financial', '4280': 'Financial',
    'LLY': 'Healthcare', 'JNJ': 'Healthcare', 'UNH': 'Healthcare', 'PFE': 'Healthcare', 'MRK': 'Healthcare',
    'XOM': 'Energy', 'CVX': 'Energy', 'SHELL': 'Energy',
    'BA': 'Industrials', 'CAT': 'Industrials', 'GE': 'Industrials',
    'PLTR': 'Technology', 'COIN': 'Financial'
  };
  // Normalize symbol for lookup (remove suffixes like .SR, .SE)
  const cleanSym = symbol.toUpperCase().replace(/\..*$/, '');
  // Default to 'Crypto' instead of 'Other' as requested
  return map[cleanSym] || 'Crypto';
};

/**
 * Calculates financial metrics for a portfolio item
 */
export const calculateMetrics = (item: PortfolioItem, isLive: boolean): PortfolioItem => {
  // In a real app, isLive would trigger a fetch. Here we simulate live fluctuation
  const liveMultiplier = isLive ? 1 + (Math.random() * 0.04 - 0.02) : 1; 
  const effectivePrice = item.CurrentPrice * liveMultiplier;

  const marketValue = item.Quantity * effectivePrice;
  const costBasis = item.Quantity * item.PurchasePrice;
  const unrealizedPL = marketValue - costBasis;

  return {
    ...item,
    CurrentPrice: effectivePrice,
    MarketValue: marketValue,
    CostBasis: costBasis,
    UnrealizedPL: unrealizedPL,
  };
};

/**
 * Parses raw CSV text into PortfolioItem objects
 */
export const parseCSV = (csvText: string): PortfolioItem[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  // Remove quotes from headers if present
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const results: PortfolioItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Split by comma, handling potential quotes roughly (assuming simple CSV for now)
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    
    if (values.length < headers.length) continue;

    const item: Partial<Record<keyof PortfolioItem, string | number>> = {};
    
    headers.forEach((header, index) => {
      // Normalize header key to match PortfolioItem keys mostly
      const key = header.replace(/\s+/g, ''); 
      
      let val: string | number = values[index];
      
      const floatFields = [
          'CurrentPrice', 'Price', 'Last', 'LastPrice', 
          'Change', 'Open', 'High', 'Low', 
          'PurchasePrice', 'Cost', 'CostBasis', 'AvgCost',
          'Commission', 'HighLimit', 'LowLimit'
      ];

      const intFields = ['Volume', 'Quantity', 'Qty'];

      if (floatFields.includes(key)) {
        val = parseFloat(val as string) || 0;
      } else if (intFields.includes(key)) {
         val = parseInt(val as string, 10) || 0;
      }

      // Map common CSV header variations to our Type
      if (key === 'Qty') item['Quantity'] = val;
      else if (['Ticker', 'Stock', 'Symbol'].includes(key)) item['Symbol'] = val;
      else if (['CurrentPrice', 'Price', 'Last', 'LastPrice'].includes(key)) item['CurrentPrice'] = val;
      else if (['PurchasePrice', 'Cost', 'AvgCost', 'CostBasis'].includes(key)) item['PurchasePrice'] = val;
      else if (key === 'TradeDate') item['TradeDate'] = val;
      // Direct match fallback
      else item[key] = val;
    });

    // Ensure required fields exist
    if (item.Symbol) {
       const symbolStr = String(item.Symbol).trim();

       // Currency Conversion Script for symbol '4280' (SAR to USD)
       // Exchange Rate: 1 USD = 3.75 SAR
       // Checks for '4280', '4280.SR', '4280.SE' etc.
       if (symbolStr === '4280' || symbolStr.startsWith('4280.')) {
         const USD_TO_SAR_RATE = 3.75;
         
         const convertToUSD = (val: number) => (val || 0) / USD_TO_SAR_RATE;

         item.CurrentPrice = convertToUSD(item.CurrentPrice);
         item.PurchasePrice = convertToUSD(item.PurchasePrice);
         item.HighLimit = convertToUSD(item.HighLimit);
         item.LowLimit = convertToUSD(item.LowLimit);
         item.Open = convertToUSD(item.Open);
         item.High = convertToUSD(item.High);
         item.Low = convertToUSD(item.Low);
         item.Commission = convertToUSD(item.Commission);
       }

       // Enrich with Sector if missing
       const sector = item.Sector || deriveSector(item.Symbol);

       results.push({
           Symbol: item.Symbol,
           CurrentPrice: item.CurrentPrice || 0,
           Date: item.Date || '',
           Time: item.Time || '',
           Change: item.Change || 0,
           Open: item.Open || 0,
           High: item.High || 0,
           Low: item.Low || 0,
           Volume: item.Volume || 0,
           TradeDate: item.TradeDate || '',
           PurchasePrice: item.PurchasePrice || 0,
           Quantity: item.Quantity || 0,
           Commission: item.Commission || 0,
           HighLimit: item.HighLimit || 0,
           LowLimit: item.LowLimit || 0,
           Comment: item.Comment || '',
           TransactionType: item.TransactionType || '',
           Sector: sector
       });
    }
  }
  return results;
};

export const formatCurrency = (val: number | undefined) => {
  if (val === undefined) return '-';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
};

export const formatNumber = (val: number | undefined) => {
  if (val === undefined) return '-';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(val);
};