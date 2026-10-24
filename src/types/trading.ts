export type AssetCategory = 'CRYPTO' | 'EQUITIES' | 'FOREX' | 'COMMODITIES';

export interface Asset {
  symbol: string;
  name: string;
  category: AssetCategory;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  decimals: number;
  minSize: number;
  leverageMax: number;
  baseSpread: number;
  atr: number;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OrderBookLevel {
  price: number;
  amount: number;
  total: number;
}

export interface OrderBook {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number;
  spreadPercent: number;
}

export type PositionSide = 'LONG' | 'SHORT';

export interface Position {
  id: string;
  symbol: string;
  side: PositionSide;
  entryPrice: number;
  currentPrice: number;
  amount: number;
  leverage: number;
  margin: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  stopLoss?: number;
  takeProfit?: number;
  liquidationPrice: number;
  openedAt: number;
}

export type OrderType = 'MARKET' | 'LIMIT' | 'STOP_MARKET';
export type OrderSide = 'BUY' | 'SELL';
export type OrderStatus = 'OPEN' | 'FILLED' | 'CANCELLED';

export interface Order {
  id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  price: number;
  amount: number;
  leverage: number;
  stopLoss?: number;
  takeProfit?: number;
  status: OrderStatus;
  createdAt: number;
  filledAt?: number;
}

export interface TradeFill {
  id: string;
  orderId: string;
  symbol: string;
  side: OrderSide;
  price: number;
  amount: number;
  leverage: number;
  realizedPnl?: number;
  fee: number;
  timestamp: number;
}

export interface RecentTrade {
  id: string;
  price: number;
  amount: number;
  side: 'BUY' | 'SELL';
  time: number;
}

export interface AISignal {
  bias: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
  confidence: number;
  keyDrivers: string[];
  targetPrice: number;
  stopLoss: number;
  riskRewardRatio: string;
  volatilityRegime: string;
  suggestedAction: string;
  technicalSummary: string;
  timestamp: number;
  isSimulatedAI?: boolean;
}

export interface PreTradeRiskAudit {
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  riskScore: number;
  warnings: string[];
  maxDrawdownPercent: string;
  suggestedMaxLeverage: number;
  recommendation: string;
}

export interface MarketSentimentData {
  sentimentScore: number;
  sentimentLabel: string;
  macroSummary: string;
  topThemes: {
    theme: string;
    impact: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    details: string;
  }[];
  fearGreedIndex: number;
}

export interface TechnicalIndicators {
  rsi: number;
  ema20: number;
  ema50: number;
  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  };
  atr: number;
}

export interface AccountState {
  equity: number;
  availableBalance: number;
  usedMargin: number;
  totalUnrealizedPnl: number;
  totalRealizedPnl: number;
  winRate: number;
  totalTrades: number;
  profitFactor: number;
  maxDrawdown: number;
}
