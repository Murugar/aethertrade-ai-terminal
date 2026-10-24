import { Asset, Candle, OrderBook, RecentTrade, TechnicalIndicators } from '../types/trading';

export const INITIAL_ASSETS: Asset[] = [
  {
    symbol: 'BTC/USD',
    name: 'Bitcoin',
    category: 'CRYPTO',
    price: 94820.50,
    change24h: 3.42,
    high24h: 96100.00,
    low24h: 92450.00,
    volume24h: 42890124000,
    decimals: 2,
    minSize: 0.001,
    leverageMax: 50,
    baseSpread: 1.5,
    atr: 1420.00,
  },
  {
    symbol: 'ETH/USD',
    name: 'Ethereum',
    category: 'CRYPTO',
    price: 3418.75,
    change24h: 4.88,
    high24h: 3490.00,
    low24h: 3260.50,
    volume24h: 21450300000,
    decimals: 2,
    minSize: 0.01,
    leverageMax: 50,
    baseSpread: 0.25,
    atr: 94.50,
  },
  {
    symbol: 'SOL/USD',
    name: 'Solana',
    category: 'CRYPTO',
    price: 198.40,
    change24h: -1.25,
    high24h: 206.50,
    low24h: 192.10,
    volume24h: 7890120000,
    decimals: 2,
    minSize: 0.1,
    leverageMax: 30,
    baseSpread: 0.08,
    atr: 8.60,
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corp',
    category: 'EQUITIES',
    price: 138.65,
    change24h: 2.74,
    high24h: 141.20,
    low24h: 134.80,
    volume24h: 14500000000,
    decimals: 2,
    minSize: 1,
    leverageMax: 20,
    baseSpread: 0.04,
    atr: 4.10,
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc',
    category: 'EQUITIES',
    price: 232.40,
    change24h: 0.95,
    high24h: 234.80,
    low24h: 230.10,
    volume24h: 8900000000,
    decimals: 2,
    minSize: 1,
    leverageMax: 20,
    baseSpread: 0.03,
    atr: 3.20,
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc',
    category: 'EQUITIES',
    price: 254.80,
    change24h: -2.15,
    high24h: 263.40,
    low24h: 251.20,
    volume24h: 11200000000,
    decimals: 2,
    minSize: 1,
    leverageMax: 20,
    baseSpread: 0.05,
    atr: 9.80,
  },
  {
    symbol: 'EUR/USD',
    name: 'Euro / US Dollar',
    category: 'FOREX',
    price: 1.0845,
    change24h: -0.18,
    high24h: 1.0882,
    low24h: 1.0820,
    volume24h: 85000000000,
    decimals: 4,
    minSize: 1000,
    leverageMax: 50,
    baseSpread: 0.0001,
    atr: 0.0045,
  },
  {
    symbol: 'XAU/USD',
    name: 'Gold Spot / USD',
    category: 'COMMODITIES',
    price: 2742.60,
    change24h: 1.12,
    high24h: 2758.40,
    low24h: 2715.00,
    volume24h: 34000000000,
    decimals: 2,
    minSize: 0.1,
    leverageMax: 30,
    baseSpread: 0.35,
    atr: 28.50,
  },
];

// Generate synthetic historical candles with realistic market drift
export function generateCandleHistory(basePrice: number, count: number = 80, intervalMinutes: number = 15): Candle[] {
  const candles: Candle[] = [];
  const now = Date.now();
  const intervalMs = intervalMinutes * 60 * 1000;
  let currentPrice = basePrice * 0.94; // Start slightly lower to show natural progression

  for (let i = count; i >= 0; i--) {
    const time = now - i * intervalMs;
    // Mean-reverting drift + random volatility
    const drift = (basePrice - currentPrice) * 0.02;
    const volatility = basePrice * 0.006;
    const randomStep = (Math.random() - 0.48) * volatility;
    const open = currentPrice;
    const close = Math.max(open * 0.5, open + drift + randomStep);
    const wickHigh = Math.max(open, close) + Math.random() * volatility * 0.8;
    const wickLow = Math.min(open, close) - Math.random() * volatility * 0.8;
    const volume = Math.floor(basePrice * (10 + Math.random() * 50));

    candles.push({
      time,
      open: Number(open.toFixed(2)),
      high: Number(wickHigh.toFixed(2)),
      low: Number(wickLow.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    });

    currentPrice = close;
  }

  // Ensure last candle closes near basePrice
  if (candles.length > 0) {
    candles[candles.length - 1].close = basePrice;
  }

  return candles;
}

// Calculate technical indicators from candle series
export function calculateIndicators(candles: Candle[]): TechnicalIndicators {
  if (candles.length < 20) {
    return {
      rsi: 54.2,
      ema20: candles[candles.length - 1]?.close || 100,
      ema50: candles[candles.length - 1]?.close || 100,
      macd: { macdLine: 1.2, signalLine: 0.9, histogram: 0.3 },
      bollingerBands: {
        upper: (candles[candles.length - 1]?.close || 100) * 1.03,
        middle: candles[candles.length - 1]?.close || 100,
        lower: (candles[candles.length - 1]?.close || 100) * 0.97,
      },
      atr: (candles[candles.length - 1]?.close || 100) * 0.015,
    };
  }

  const closes = candles.map((c) => c.close);
  const n = closes.length;

  // 1. EMA Helper
  const calcEMA = (period: number): number => {
    const k = 2 / (period + 1);
    let ema = closes.slice(0, period).reduce((acc, v) => acc + v, 0) / period;
    for (let i = period; i < n; i++) {
      ema = closes[i] * k + ema * (1 - k);
    }
    return ema;
  };

  const ema20 = calcEMA(20);
  const ema50 = calcEMA(Math.min(50, n - 1));

  // 2. RSI (14 period)
  let gains = 0;
  let losses = 0;
  const rsiPeriod = 14;
  for (let i = n - rsiPeriod; i < n; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }
  const avgGain = gains / rsiPeriod;
  const avgLoss = losses / rsiPeriod;
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi = Number((100 - 100 / (1 + rs)).toFixed(1));

  // 3. MACD (12, 26, 9)
  const ema12 = calcEMA(12);
  const ema26 = calcEMA(Math.min(26, n - 1));
  const macdLine = ema12 - ema26;
  const signalLine = macdLine * 0.85; // approximate signal smoothing
  const histogram = Number((macdLine - signalLine).toFixed(2));

  // 4. Bollinger Bands (20, 2)
  const recent20 = closes.slice(-20);
  const mean = recent20.reduce((a, b) => a + b, 0) / 20;
  const variance = recent20.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / 20;
  const stdDev = Math.sqrt(variance);

  // 5. ATR (14)
  let trSum = 0;
  for (let i = n - 14; i < n; i++) {
    const h = candles[i].high;
    const l = candles[i].low;
    const pc = candles[i - 1]?.close || candles[i].open;
    const tr = Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc));
    trSum += tr;
  }
  const atr = Number((trSum / 14).toFixed(2));

  return {
    rsi,
    ema20: Number(ema20.toFixed(2)),
    ema50: Number(ema50.toFixed(2)),
    macd: {
      macdLine: Number(macdLine.toFixed(2)),
      signalLine: Number(signalLine.toFixed(2)),
      histogram,
    },
    bollingerBands: {
      upper: Number((mean + 2 * stdDev).toFixed(2)),
      middle: Number(mean.toFixed(2)),
      lower: Number((mean - 2 * stdDev).toFixed(2)),
    },
    atr,
  };
}

// Generate Level 2 Order Book with realistic depth curves
export function generateOrderBook(currentPrice: number, baseSpread: number = 0.5): OrderBook {
  const bids: { price: number; amount: number; total: number }[] = [];
  const asks: { price: number; amount: number; total: number }[] = [];

  const spread = Math.max(baseSpread, currentPrice * 0.00015);
  const bestBid = currentPrice - spread / 2;
  const bestAsk = currentPrice + spread / 2;

  let bidTotal = 0;
  for (let i = 0; i < 9; i++) {
    const step = (i + 1) * (spread * 0.8) + (Math.random() * spread * 0.2);
    const price = Number((bestBid - step).toFixed(2));
    const amount = Number(((0.5 + Math.random() * 2.5) * (1 + i * 0.25)).toFixed(3));
    bidTotal += amount;
    bids.push({ price, amount, total: Number(bidTotal.toFixed(3)) });
  }

  let askTotal = 0;
  for (let i = 0; i < 9; i++) {
    const step = (i + 1) * (spread * 0.8) + (Math.random() * spread * 0.2);
    const price = Number((bestAsk + step).toFixed(2));
    const amount = Number(((0.5 + Math.random() * 2.5) * (1 + i * 0.25)).toFixed(3));
    askTotal += amount;
    asks.push({ price, amount, total: Number(askTotal.toFixed(3)) });
  }

  return {
    bids,
    asks,
    spread: Number(spread.toFixed(2)),
    spreadPercent: Number(((spread / currentPrice) * 100).toFixed(4)),
  };
}

// Generate Initial Recent Trades
export function generateInitialRecentTrades(currentPrice: number): RecentTrade[] {
  const trades: RecentTrade[] = [];
  const now = Date.now();
  for (let i = 0; i < 15; i++) {
    const offset = (Math.random() - 0.5) * (currentPrice * 0.0008);
    trades.push({
      id: 'trade-' + (now - i * 1500) + '-' + Math.floor(Math.random() * 1000),
      price: Number((currentPrice + offset).toFixed(2)),
      amount: Number((0.05 + Math.random() * 1.8).toFixed(3)),
      side: Math.random() > 0.48 ? 'BUY' : 'SELL',
      time: now - i * 1500,
    });
  }
  return trades;
}
