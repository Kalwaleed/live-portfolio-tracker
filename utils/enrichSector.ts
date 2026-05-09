import { Holding, RawHolding } from '../types';

/**
 * The controlled sector vocabulary. Every classification — CSV-provided,
 * static-map, or AI-derived — must produce one of these labels (or
 * 'Unclassified' as a transient pending-AI state).
 */
export const SECTORS = [
  'Technology',
  'Financial',
  'Healthcare',
  'Energy',
  'Industrials',
  'Consumer Cyclical',
  'Consumer Defensive',
  'Communication',
  'Real Estate',
  'Materials',
  'Utilities',
  'Crypto',
] as const;

export type Sector = (typeof SECTORS)[number] | 'Unclassified';

/**
 * Sector classification map: ticker → sector + a default for symbols not
 * yet known. The default 'Unclassified' is a transient state — the AI
 * resolver fills these in after upload.
 */
export interface SectorMap {
  bySymbol: Record<string, string>;
  defaultSector: string;
}

/**
 * Static map of common tickers. Curated knowledge — treat as authoritative.
 * AI classifications are stored in a separate cache and only consulted when
 * the static map misses.
 *
 * Includes:
 *   - S&P 500 top 100+ by market cap
 *   - Major sector ETFs
 *   - Top 30 crypto by market cap (explicit Crypto, never inferred)
 *   - Saudi Tadawul listings the project supports today
 */
export const DEFAULT_SECTOR_MAP: SectorMap = {
  bySymbol: {
    // ---------- Technology ----------
    NVDA: 'Technology', AAPL: 'Technology', MSFT: 'Technology',
    AMD: 'Technology', INTC: 'Technology', AVGO: 'Technology',
    ORCL: 'Technology', PLTR: 'Technology', TSM: 'Technology',
    QCOM: 'Technology', ADBE: 'Technology', CSCO: 'Technology',
    CRM: 'Technology', NOW: 'Technology', INTU: 'Technology',
    AMAT: 'Technology', MU: 'Technology', LRCX: 'Technology',
    KLAC: 'Technology', ANET: 'Technology', IBM: 'Technology',
    TXN: 'Technology', PANW: 'Technology', CRWD: 'Technology',
    FTNT: 'Technology', SNOW: 'Technology', NET: 'Technology',
    DDOG: 'Technology', ZS: 'Technology', MDB: 'Technology',
    OKTA: 'Technology', TEAM: 'Technology', ADSK: 'Technology',
    WDAY: 'Technology', U: 'Technology', SHOP: 'Technology',
    RBLX: 'Technology', ASML: 'Technology', ARM: 'Technology',
    SMCI: 'Technology', DELL: 'Technology', HPQ: 'Technology',
    HPE: 'Technology', NXPI: 'Technology', MRVL: 'Technology',
    ON: 'Technology', WDC: 'Technology', STX: 'Technology',
    GLW: 'Technology', JNPR: 'Technology', FFIV: 'Technology',
    XLK: 'Technology', SMH: 'Technology', SOXX: 'Technology',
    QQQ: 'Technology',

    // ---------- Financial ----------
    JPM: 'Financial', BAC: 'Financial', WFC: 'Financial',
    GS: 'Financial', MS: 'Financial', C: 'Financial',
    USB: 'Financial', PNC: 'Financial', TFC: 'Financial',
    COF: 'Financial', AXP: 'Financial', V: 'Financial',
    MA: 'Financial', PYPL: 'Financial', SQ: 'Financial',
    BLK: 'Financial', BX: 'Financial', KKR: 'Financial',
    APO: 'Financial', CG: 'Financial', ARES: 'Financial',
    CME: 'Financial', ICE: 'Financial', SCHW: 'Financial',
    IBKR: 'Financial', RY: 'Financial', TD: 'Financial',
    BMO: 'Financial', NDAQ: 'Financial', MKTX: 'Financial',
    MCO: 'Financial', SPGI: 'Financial', MMC: 'Financial',
    AON: 'Financial', AJG: 'Financial', WTW: 'Financial',
    'BRK.A': 'Financial', 'BRK.B': 'Financial', BRK: 'Financial',
    COIN: 'Financial', HOOD: 'Financial', SOFI: 'Financial',
    AFL: 'Financial', ALL: 'Financial', PRU: 'Financial',
    MET: 'Financial', TRV: 'Financial', PGR: 'Financial',
    CB: 'Financial', HIG: 'Financial', LNC: 'Financial',
    XLF: 'Financial', KBE: 'Financial', KRE: 'Financial',
    '4280': 'Financial', // Kingdom Holding (Tadawul)

    // ---------- Healthcare ----------
    LLY: 'Healthcare', JNJ: 'Healthcare', UNH: 'Healthcare',
    PFE: 'Healthcare', MRK: 'Healthcare', ABBV: 'Healthcare',
    NVO: 'Healthcare', TMO: 'Healthcare', ABT: 'Healthcare',
    AMGN: 'Healthcare', BMY: 'Healthcare', CVS: 'Healthcare',
    MDT: 'Healthcare', GILD: 'Healthcare', REGN: 'Healthcare',
    VRTX: 'Healthcare', ISRG: 'Healthcare', CI: 'Healthcare',
    HUM: 'Healthcare', ELV: 'Healthcare', ZTS: 'Healthcare',
    BIIB: 'Healthcare', MRNA: 'Healthcare', BNTX: 'Healthcare',
    NVAX: 'Healthcare', BSX: 'Healthcare', SYK: 'Healthcare',
    EW: 'Healthcare', BDX: 'Healthcare', BAX: 'Healthcare',
    A: 'Healthcare', IDXX: 'Healthcare', IQV: 'Healthcare',
    DXCM: 'Healthcare', ALGN: 'Healthcare', ILMN: 'Healthcare',
    MTD: 'Healthcare', RMD: 'Healthcare', WAT: 'Healthcare',
    HCA: 'Healthcare', CNC: 'Healthcare', MOH: 'Healthcare',
    XLV: 'Healthcare', IBB: 'Healthcare', XBI: 'Healthcare',

    // ---------- Energy ----------
    XOM: 'Energy', CVX: 'Energy', SHELL: 'Energy', SHEL: 'Energy',
    BP: 'Energy', TTE: 'Energy', COP: 'Energy', EOG: 'Energy',
    SLB: 'Energy', PSX: 'Energy', MPC: 'Energy', VLO: 'Energy',
    OXY: 'Energy', FANG: 'Energy', KMI: 'Energy', EQT: 'Energy',
    DVN: 'Energy', HES: 'Energy', MRO: 'Energy', WMB: 'Energy',
    OKE: 'Energy', ENB: 'Energy', TRP: 'Energy', SU: 'Energy',
    HAL: 'Energy', BKR: 'Energy', PXD: 'Energy', APA: 'Energy',
    XLE: 'Energy', XOP: 'Energy', OIH: 'Energy',

    // ---------- Industrials ----------
    BA: 'Industrials', CAT: 'Industrials', GE: 'Industrials',
    RTX: 'Industrials', LMT: 'Industrials', NOC: 'Industrials',
    GD: 'Industrials', HON: 'Industrials', MMM: 'Industrials',
    UPS: 'Industrials', FDX: 'Industrials', CSX: 'Industrials',
    NSC: 'Industrials', UNP: 'Industrials', LUV: 'Industrials',
    DAL: 'Industrials', AAL: 'Industrials', UAL: 'Industrials',
    JBHT: 'Industrials', CHRW: 'Industrials', EMR: 'Industrials',
    ETN: 'Industrials', ITW: 'Industrials', PH: 'Industrials',
    ROP: 'Industrials', JCI: 'Industrials', AME: 'Industrials',
    FAST: 'Industrials', TT: 'Industrials', OTIS: 'Industrials',
    CMI: 'Industrials', PCAR: 'Industrials', DE: 'Industrials',
    AGCO: 'Industrials', URI: 'Industrials', GWW: 'Industrials',
    XLI: 'Industrials', ITA: 'Industrials',

    // ---------- Consumer Cyclical ----------
    AMZN: 'Consumer Cyclical', HD: 'Consumer Cyclical',
    MCD: 'Consumer Cyclical', NKE: 'Consumer Cyclical',
    LOW: 'Consumer Cyclical', SBUX: 'Consumer Cyclical',
    TJX: 'Consumer Cyclical', BKNG: 'Consumer Cyclical',
    MAR: 'Consumer Cyclical', HLT: 'Consumer Cyclical',
    GM: 'Consumer Cyclical', F: 'Consumer Cyclical',
    TSLA: 'Consumer Cyclical', STLA: 'Consumer Cyclical',
    RACE: 'Consumer Cyclical', LULU: 'Consumer Cyclical',
    ROST: 'Consumer Cyclical', BURL: 'Consumer Cyclical',
    ULTA: 'Consumer Cyclical', BBY: 'Consumer Cyclical',
    EBAY: 'Consumer Cyclical', ETSY: 'Consumer Cyclical',
    CHWY: 'Consumer Cyclical', W: 'Consumer Cyclical',
    RH: 'Consumer Cyclical', WSM: 'Consumer Cyclical',
    ORLY: 'Consumer Cyclical', AZO: 'Consumer Cyclical',
    CMG: 'Consumer Cyclical', YUM: 'Consumer Cyclical',
    DPZ: 'Consumer Cyclical', DRI: 'Consumer Cyclical',
    QSR: 'Consumer Cyclical', PII: 'Consumer Cyclical',
    XLY: 'Consumer Cyclical',

    // ---------- Consumer Defensive ----------
    WMT: 'Consumer Defensive', PG: 'Consumer Defensive',
    KO: 'Consumer Defensive', PEP: 'Consumer Defensive',
    COST: 'Consumer Defensive', CL: 'Consumer Defensive',
    KHC: 'Consumer Defensive', MDLZ: 'Consumer Defensive',
    MO: 'Consumer Defensive', PM: 'Consumer Defensive',
    EL: 'Consumer Defensive', K: 'Consumer Defensive',
    GIS: 'Consumer Defensive', KMB: 'Consumer Defensive',
    CHD: 'Consumer Defensive', CLX: 'Consumer Defensive',
    KR: 'Consumer Defensive', SYY: 'Consumer Defensive',
    HSY: 'Consumer Defensive', MNST: 'Consumer Defensive',
    KDP: 'Consumer Defensive', STZ: 'Consumer Defensive',
    BUD: 'Consumer Defensive', DEO: 'Consumer Defensive',
    XLP: 'Consumer Defensive',

    // ---------- Communication ----------
    GOOGL: 'Communication', GOOG: 'Communication',
    META: 'Communication', NFLX: 'Communication',
    DIS: 'Communication', T: 'Communication',
    VZ: 'Communication', CMCSA: 'Communication',
    TMUS: 'Communication', CHTR: 'Communication',
    WBD: 'Communication', PARA: 'Communication',
    SPOT: 'Communication', ROKU: 'Communication',
    EA: 'Communication', TTWO: 'Communication',
    MTCH: 'Communication', PINS: 'Communication',
    SNAP: 'Communication', LYV: 'Communication',
    XLC: 'Communication',

    // ---------- Real Estate ----------
    PLD: 'Real Estate', AMT: 'Real Estate', CCI: 'Real Estate',
    EQIX: 'Real Estate', PSA: 'Real Estate', SPG: 'Real Estate',
    O: 'Real Estate', WELL: 'Real Estate', AVB: 'Real Estate',
    EQR: 'Real Estate', DLR: 'Real Estate', VICI: 'Real Estate',
    EXR: 'Real Estate', MAA: 'Real Estate', ESS: 'Real Estate',
    CPT: 'Real Estate', VTR: 'Real Estate', INVH: 'Real Estate',
    SBAC: 'Real Estate', WY: 'Real Estate', BXP: 'Real Estate',
    XLRE: 'Real Estate', VNQ: 'Real Estate',

    // ---------- Materials ----------
    LIN: 'Materials', SHW: 'Materials', APD: 'Materials',
    ECL: 'Materials', FCX: 'Materials', NEM: 'Materials',
    NUE: 'Materials', DOW: 'Materials', DD: 'Materials',
    STLD: 'Materials', MLM: 'Materials', VMC: 'Materials',
    CTVA: 'Materials', MOS: 'Materials', CF: 'Materials',
    IFF: 'Materials', LYB: 'Materials', BLL: 'Materials',
    IP: 'Materials', PKG: 'Materials', GOLD: 'Materials',
    XLB: 'Materials', GDX: 'Materials', SLV: 'Materials',
    GLD: 'Materials',

    // ---------- Utilities ----------
    NEE: 'Utilities', SO: 'Utilities', DUK: 'Utilities',
    AEP: 'Utilities', SRE: 'Utilities', D: 'Utilities',
    EXC: 'Utilities', XEL: 'Utilities', PEG: 'Utilities',
    ED: 'Utilities', AEE: 'Utilities', ETR: 'Utilities',
    WEC: 'Utilities', ES: 'Utilities', AWK: 'Utilities',
    PPL: 'Utilities', CMS: 'Utilities', DTE: 'Utilities',
    XLU: 'Utilities',

    // ---------- Broad index ETFs (default to Communication for "everything") ----------
    SPY: 'Communication', VOO: 'Communication', VTI: 'Communication',
    IVV: 'Communication', IWM: 'Communication', DIA: 'Communication',

    // ---------- Crypto (top tokens — explicit, never inferred) ----------
    BTC: 'Crypto', ETH: 'Crypto', SOL: 'Crypto', ADA: 'Crypto',
    DOT: 'Crypto', MATIC: 'Crypto', AVAX: 'Crypto', BNB: 'Crypto',
    XRP: 'Crypto', LINK: 'Crypto', UNI: 'Crypto', USDT: 'Crypto',
    USDC: 'Crypto', DAI: 'Crypto', BUSD: 'Crypto', SHIB: 'Crypto',
    DOGE: 'Crypto', LTC: 'Crypto', BCH: 'Crypto', TRX: 'Crypto',
    ATOM: 'Crypto', NEAR: 'Crypto', FIL: 'Crypto', ICP: 'Crypto',
    APT: 'Crypto', ARB: 'Crypto', OP: 'Crypto', INJ: 'Crypto',
    AAVE: 'Crypto', GRT: 'Crypto', MKR: 'Crypto', SAND: 'Crypto',
    MANA: 'Crypto', AXS: 'Crypto', ALGO: 'Crypto', EGLD: 'Crypto',
    FTM: 'Crypto', RUNE: 'Crypto', KAVA: 'Crypto', TIA: 'Crypto',
    SUI: 'Crypto', SEI: 'Crypto', PYTH: 'Crypto', JUP: 'Crypto',
    HBAR: 'Crypto', VET: 'Crypto', FLOW: 'Crypto', CRV: 'Crypto',
    LDO: 'Crypto', RPL: 'Crypto',
  },
  defaultSector: 'Unclassified',
};

/**
 * Enrich each row with a Sector field. Resolution order:
 *   1. CSV-provided Sector on the row (if present and non-empty)
 *   2. Lookup in `map.bySymbol` (suffixes like '.SR' or '.SE' stripped)
 *   3. `map.defaultSector` fallback (typically 'Unclassified', then the
 *      sectorResolver fires AI classification for those rows)
 *
 * Pure: returns new Holding[] rows, never mutates inputs.
 */
export const enrichSector = (
  rows: RawHolding[],
  map: SectorMap = DEFAULT_SECTOR_MAP
): Holding[] =>
  rows.map((row) => {
    if (row.Sector && row.Sector.trim() !== '') {
      return { ...row, Sector: row.Sector };
    }
    const cleanSym = row.Symbol.toUpperCase().replace(/\..*$/, '');
    const sector = map.bySymbol[cleanSym] ?? map.defaultSector;
    return { ...row, Sector: sector };
  });
