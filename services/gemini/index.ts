export { callGemini, useAiStats, __resetGatewayForTests } from './gateway';
export { useAiQuery } from './useAiQuery';
export { auditSpec, moversSpec, earningsSpec, sectorClassifierSpec } from './specs';
export type {
  PortfolioAnalysis,
  MarketNewsResponse,
  EarningsResponse,
  SectorClassificationResponse,
  SectorClassification,
  AiFinding,
  AiAction,
  FindingTag,
  ActionVerb,
  MarketNewsItem,
  EarningsItem,
  EarningsStatus,
} from './specs';
export {
  portfolioAnalysisSchema,
  marketNewsSchema,
  earningsSchema,
  sectorClassificationSchema,
  SECTOR_ENUM,
} from './schemas';
export type {
  Result,
  GeminiError,
  GeminiErrorKind,
  GeminiSpec,
  AiStats,
} from './types';
