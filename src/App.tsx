/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Asset,
  Candle,
  OrderBook as OrderBookType,
  Position,
  Order,
  TradeFill,
  RecentTrade,
  AISignal,
  AccountState,
  TechnicalIndicators,
  OrderSide,
  OrderType,
} from './types/trading';
import {
  INITIAL_ASSETS,
  generateCandleHistory,
  calculateIndicators,
  generateOrderBook,
  generateInitialRecentTrades,
} from './services/marketData';
import { TopNav } from './components/TopNav';
import { Watchlist } from './components/Watchlist';
import { CandleChart } from './components/CandleChart';
import { OrderBook } from './components/OrderBook';
import { OrderTicket } from './components/OrderTicket';
import { AISignalPanel } from './components/AISignalPanel';
import { PositionsAndOrders } from './components/PositionsAndOrders';
import { AICopilotDrawer } from './components/AICopilotDrawer';
import { AnalyticsView } from './components/AnalyticsView';
import { SecurityModal } from './components/SecurityModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import {
  TrendingUp,
  TrendingDown,
  Cpu,
  Layers,
  BarChart3,
  SlidersHorizontal,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export default function App() {
  // Navigation & View State
  const [currentTab, setCurrentTab] = useState<'terminal' | 'analytics' | 'copilot' | 'risk' | 'history'>('terminal');
  const [mobileSubTab, setMobileSubTab] = useState<'chart' | 'trade' | 'book' | 'positions'>('chart');
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState<boolean>(false);

  // Market & Asset State
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC/USD');
  const [timeframe, setTimeframe] = useState<string>('15m');

  const selectedAsset = assets.find((a) => a.symbol === selectedSymbol) || assets[0];

  // Candles, Indicators & Order Book
  const [candles, setCandles] = useState<Candle[]>(() =>
    generateCandleHistory(selectedAsset.price, 80, 15)
  );
  const [indicators, setIndicators] = useState<TechnicalIndicators>(() =>
    calculateIndicators(candles)
  );
  const [orderBook, setOrderBook] = useState<OrderBookType>(() =>
    generateOrderBook(selectedAsset.price, selectedAsset.baseSpread)
  );
  const [recentTrades, setRecentTrades] = useState<RecentTrade[]>(() =>
    generateInitialRecentTrades(selectedAsset.price)
  );

  // Trading & Execution State
  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tradeHistory, setTradeHistory] = useState<TradeFill[]>([]);

  // Account State ($50,000 starting paper equity)
  const [accountState, setAccountState] = useState<AccountState>({
    equity: 50000.0,
    availableBalance: 50000.0,
    usedMargin: 0.0,
    totalUnrealizedPnl: 0.0,
    totalRealizedPnl: 0.0,
    winRate: 66.7,
    totalTrades: 3,
    profitFactor: 2.45,
    maxDrawdown: 1.8,
  });

  // AI Decision Support State
  const [aiSignal, setAiSignal] = useState<AISignal | null>(null);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState<boolean>(false);

  // Preset values applied from AI to order ticket
  const [presetTarget, setPresetTarget] = useState<number | undefined>(undefined);
  const [presetStopLoss, setPresetStopLoss] = useState<number | undefined>(undefined);

  // Security Settings
  const [is2FAEnabled, setIs2FAEnabled] = useState<boolean>(true);
  const [slippageTolerance, setSlippageTolerance] = useState<number>(0.5);
  const [maxLeverageCap, setMaxLeverageCap] = useState<number>(25);
  const [dailyLossLimitPercent, setDailyLossLimitPercent] = useState<number>(4.0);

  // Ref to hold mutable prices for tick engine without re-binding intervals
  const assetsRef = useRef(assets);
  assetsRef.current = assets;
  const positionsRef = useRef(positions);
  positionsRef.current = positions;
  const ordersRef = useRef(orders);
  ordersRef.current = orders;

  // 1. Fetch AI Signal for current asset
  const fetchAISignal = useCallback(async (asset: Asset, tf: string, inds: TechnicalIndicators) => {
    setIsAnalyzingAI(true);
    try {
      const res = await fetch('/api/ai/analyze-asset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: asset.symbol,
          currentPrice: asset.price,
          change24h: asset.change24h,
          high24h: asset.high24h,
          low24h: asset.low24h,
          volume24h: asset.volume24h,
          rsi: inds.rsi,
          macd: inds.macd.histogram,
          ema20: inds.ema20,
          ema50: inds.ema50,
          atr: inds.atr,
          timeframe: tf,
        }),
      });
      const data = await res.json();
      setAiSignal({
        bias: data.bias || 'BUY',
        confidence: data.confidence || 75,
        keyDrivers: data.keyDrivers || ['Momentum expansion', 'Order book absorption'],
        targetPrice: data.targetPrice || asset.price * 1.03,
        stopLoss: data.stopLoss || asset.price * 0.98,
        riskRewardRatio: data.riskRewardRatio || '1 : 2.1',
        volatilityRegime: data.volatilityRegime || 'NORMAL_VOLATILITY',
        suggestedAction: data.suggestedAction || 'Accumulate with measured stop loss',
        technicalSummary: data.technicalSummary || 'Indicator confluence favorable.',
        timestamp: Date.now(),
        isSimulatedAI: data.isSimulatedAI,
      });
    } catch (err) {
      console.error('Failed to get AI signal:', err);
    } finally {
      setIsAnalyzingAI(false);
    }
  }, []);

  // When selected symbol or timeframe changes, regenerate candles and fetch new AI analysis
  const handleSelectAsset = (asset: Asset) => {
    setSelectedSymbol(asset.symbol);
    const newCandles = generateCandleHistory(asset.price, 80, 15);
    const newInds = calculateIndicators(newCandles);
    setCandles(newCandles);
    setIndicators(newInds);
    setOrderBook(generateOrderBook(asset.price, asset.baseSpread));
    setRecentTrades(generateInitialRecentTrades(asset.price));
    setPresetTarget(undefined);
    setPresetStopLoss(undefined);
    fetchAISignal(asset, timeframe, newInds);
  };

  const handleTimeframeChange = (tf: string) => {
    setTimeframe(tf);
    const minutes = tf === '1m' ? 1 : tf === '5m' ? 5 : tf === '15m' ? 15 : tf === '1h' ? 60 : tf === '4h' ? 240 : 1440;
    const newCandles = generateCandleHistory(selectedAsset.price, 80, minutes);
    const newInds = calculateIndicators(newCandles);
    setCandles(newCandles);
    setIndicators(newInds);
    fetchAISignal(selectedAsset, tf, newInds);
  };

  // Initial AI Signal fetch on mount
  useEffect(() => {
    fetchAISignal(selectedAsset, timeframe, indicators);
  }, []);

  // 2. Real-Time Market Simulation Engine (Live Brownian Motion & Order Checks)
  useEffect(() => {
    const interval = setInterval(() => {
      // Pick random asset to update
      const currentAssets = assetsRef.current;
      const updatedAssets = currentAssets.map((asset) => {
        // Drift + shock
        const volatility = asset.price * 0.0008;
        const shock = (Math.random() - 0.495) * volatility;
        const newPrice = Number(Math.max(asset.price * 0.5, asset.price + shock).toFixed(asset.decimals));
        const newChange = Number((asset.change24h + (shock / asset.price) * 10).toFixed(2));
        const newHigh = Math.max(asset.high24h, newPrice);
        const newLow = Math.min(asset.low24h, newPrice);

        return {
          ...asset,
          price: newPrice,
          change24h: newChange,
          high24h: newHigh,
          low24h: newLow,
        };
      });

      setAssets(updatedAssets);

      // If active asset updated, refresh live candle, order book, and recent trade
      const activeCurrent = updatedAssets.find((a) => a.symbol === selectedSymbol);
      if (activeCurrent) {
        setCandles((prevCandles) => {
          if (prevCandles.length === 0) return prevCandles;
          const lastCandle = { ...prevCandles[prevCandles.length - 1] };
          lastCandle.close = activeCurrent.price;
          lastCandle.high = Math.max(lastCandle.high, activeCurrent.price);
          lastCandle.low = Math.min(lastCandle.low, activeCurrent.price);
          lastCandle.volume += Math.floor(Math.random() * 8 + 1);

          const updated = [...prevCandles.slice(0, -1), lastCandle];
          setIndicators(calculateIndicators(updated));
          return updated;
        });

        // Dynamic Order Book update
        setOrderBook(generateOrderBook(activeCurrent.price, activeCurrent.baseSpread));

        // Occasional recent trade push (60% chance per tick)
        if (Math.random() > 0.4) {
          const side: 'BUY' | 'SELL' = Math.random() > 0.48 ? 'BUY' : 'SELL';
          const offset = (Math.random() - 0.5) * (activeCurrent.price * 0.0003);
          const tradePrice = Number((activeCurrent.price + offset).toFixed(activeCurrent.decimals));
          const newTrade: RecentTrade = {
            id: 't-' + Date.now() + '-' + Math.floor(Math.random() * 100),
            price: tradePrice,
            amount: Number((0.02 + Math.random() * 1.2).toFixed(3)),
            side,
            time: Date.now(),
          };
          setRecentTrades((prev) => [newTrade, ...prev.slice(0, 24)]);
        }

        // Check resting Limit Orders
        setOrders((prevOrders) => {
          const remainingOrders: Order[] = [];
          prevOrders.forEach((ord) => {
            if (ord.status !== 'OPEN' || ord.symbol !== activeCurrent.symbol) {
              remainingOrders.push(ord);
              return;
            }

            const isFilled =
              (ord.side === 'BUY' && activeCurrent.price <= ord.price) ||
              (ord.side === 'SELL' && activeCurrent.price >= ord.price);

            if (isFilled) {
              // Execute order fill
              executeFill({
                symbol: ord.symbol,
                side: ord.side,
                type: ord.type,
                price: activeCurrent.price,
                amount: ord.amount,
                leverage: ord.leverage,
                stopLoss: ord.stopLoss,
                takeProfit: ord.takeProfit,
              });
            } else {
              remainingOrders.push(ord);
            }
          });
          return remainingOrders;
        });

        // Update Active Positions PnL and check Stop Loss / Take Profit triggers
        setPositions((prevPositions) => {
          let updatedAny = false;
          const remainingPositions: Position[] = [];

          prevPositions.forEach((pos) => {
            const assetForPos = updatedAssets.find((a) => a.symbol === pos.symbol) || activeCurrent;
            const currentP = assetForPos.price;

            // Check TP / SL hit
            const tpHit = pos.takeProfit && (pos.side === 'LONG' ? currentP >= pos.takeProfit : currentP <= pos.takeProfit);
            const slHit = pos.stopLoss && (pos.side === 'LONG' ? currentP <= pos.stopLoss : currentP >= pos.stopLoss);
            const liqHit = pos.liquidationPrice > 0 && (pos.side === 'LONG' ? currentP <= pos.liquidationPrice : currentP >= pos.liquidationPrice);

            if (tpHit || slHit || liqHit) {
              // Trigger auto close
              handleClosePosition(pos.id, currentP, liqHit ? 'Liquidation triggered' : tpHit ? 'Take Profit reached' : 'Stop Loss executed');
              updatedAny = true;
            } else {
              // Update unrealized PnL
              const priceDelta = pos.side === 'LONG' ? currentP - pos.entryPrice : pos.entryPrice - currentP;
              const unrealizedPnl = priceDelta * pos.amount * pos.leverage;
              const unrealizedPnlPercent = pos.margin > 0 ? (unrealizedPnl / pos.margin) * 100 : 0;

              remainingPositions.push({
                ...pos,
                currentPrice: currentP,
                unrealizedPnl: Number(unrealizedPnl.toFixed(2)),
                unrealizedPnlPercent: Number(unrealizedPnlPercent.toFixed(2)),
              });
            }
          });

          return remainingPositions;
        });
      }
    }, 750);

    return () => clearInterval(interval);
  }, [selectedSymbol]);

  // Recalculate account equity and used margin whenever positions change
  useEffect(() => {
    let totalMargin = 0;
    let totalUnrealized = 0;

    positions.forEach((p) => {
      totalMargin += p.margin;
      totalUnrealized += p.unrealizedPnl;
    });

    const newEquity = 50000 + accountState.totalRealizedPnl + totalUnrealized;
    const newAvailable = Math.max(0, newEquity - totalMargin);

    setAccountState((prev) => ({
      ...prev,
      equity: Number(newEquity.toFixed(2)),
      availableBalance: Number(newAvailable.toFixed(2)),
      usedMargin: Number(totalMargin.toFixed(2)),
      totalUnrealizedPnl: Number(totalUnrealized.toFixed(2)),
    }));
  }, [positions, accountState.totalRealizedPnl]);

  // 3. Execution Engine
  const executeFill = (orderDetails: {
    symbol: string;
    side: OrderSide;
    type: OrderType;
    price: number;
    amount: number;
    leverage: number;
    stopLoss?: number;
    takeProfit?: number;
  }) => {
    const notional = orderDetails.amount * orderDetails.price;
    const margin = orderDetails.leverage > 0 ? notional / orderDetails.leverage : notional;
    const fee = Number((notional * 0.0004).toFixed(2)); // 4 bps institutional fee

    // Check account-level leverage cap
    const safeLeverage = Math.min(orderDetails.leverage, maxLeverageCap);

    // Liquidation Price calculation
    const maintenance = 0.01;
    const liqDistance = (orderDetails.price * (1 - maintenance)) / safeLeverage;
    const liquidationPrice =
      orderDetails.side === 'BUY'
        ? Math.max(0, orderDetails.price - liqDistance)
        : orderDetails.price + liqDistance;

    const newPosition: Position = {
      id: 'pos-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      symbol: orderDetails.symbol,
      side: orderDetails.side === 'BUY' ? 'LONG' : 'SHORT',
      entryPrice: orderDetails.price,
      currentPrice: orderDetails.price,
      amount: orderDetails.amount,
      leverage: safeLeverage,
      margin: Number(margin.toFixed(2)),
      unrealizedPnl: 0,
      unrealizedPnlPercent: 0,
      stopLoss: orderDetails.stopLoss,
      takeProfit: orderDetails.takeProfit,
      liquidationPrice: Number(liquidationPrice.toFixed(2)),
      openedAt: Date.now(),
    };

    setPositions((prev) => [newPosition, ...prev]);

    // Record in Trade History
    const fillLog: TradeFill = {
      id: 'fill-' + Date.now(),
      orderId: 'ord-' + Date.now(),
      symbol: orderDetails.symbol,
      side: orderDetails.side,
      price: orderDetails.price,
      amount: orderDetails.amount,
      leverage: safeLeverage,
      fee,
      timestamp: Date.now(),
    };
    setTradeHistory((prev) => [fillLog, ...prev]);
  };

  const handleExecuteOrder = (orderData: {
    symbol: string;
    side: OrderSide;
    type: OrderType;
    price: number;
    amount: number;
    leverage: number;
    stopLoss?: number;
    takeProfit?: number;
  }) => {
    if (orderData.type === 'MARKET') {
      executeFill(orderData);
    } else {
      // Place resting Limit/Stop order
      const newOrder: Order = {
        id: 'ord-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        symbol: orderData.symbol,
        side: orderData.side,
        type: orderData.type,
        price: orderData.price,
        amount: orderData.amount,
        leverage: Math.min(orderData.leverage, maxLeverageCap),
        stopLoss: orderData.stopLoss,
        takeProfit: orderData.takeProfit,
        status: 'OPEN',
        createdAt: Date.now(),
      };
      setOrders((prev) => [newOrder, ...prev]);
    }
  };

  const handleClosePosition = (positionId: string, exitPrice?: number, reason?: string) => {
    setPositions((prev) => {
      const pos = prev.find((p) => p.id === positionId);
      if (!pos) return prev;

      const asset = assetsRef.current.find((a) => a.symbol === pos.symbol) || selectedAsset;
      const closePrice = exitPrice || asset.price;
      const priceDelta = pos.side === 'LONG' ? closePrice - pos.entryPrice : pos.entryPrice - closePrice;
      const realized = Number((priceDelta * pos.amount * pos.leverage).toFixed(2));
      const fee = Number((pos.amount * closePrice * 0.0004).toFixed(2));
      const netRealized = Number((realized - fee).toFixed(2));

      // Update trade history
      const fillLog: TradeFill = {
        id: 'close-' + Date.now(),
        orderId: pos.id,
        symbol: pos.symbol,
        side: pos.side === 'LONG' ? 'SELL' : 'BUY',
        price: closePrice,
        amount: pos.amount,
        leverage: pos.leverage,
        realizedPnl: netRealized,
        fee,
        timestamp: Date.now(),
      };
      setTradeHistory((th) => [fillLog, ...th]);

      // Update account stats
      setAccountState((acc) => {
        const newTotalRealized = acc.totalRealizedPnl + netRealized;
        const newTotalTrades = acc.totalTrades + 1;
        const isWin = netRealized > 0;
        const previousWins = Math.round((acc.winRate / 100) * acc.totalTrades);
        const newWins = previousWins + (isWin ? 1 : 0);
        const newWinRate = Number(((newWins / newTotalTrades) * 100).toFixed(1));

        return {
          ...acc,
          totalRealizedPnl: Number(newTotalRealized.toFixed(2)),
          totalTrades: newTotalTrades,
          winRate: newWinRate,
        };
      });

      return prev.filter((p) => p.id !== positionId);
    });
  };

  const handleCancelOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  // Master Panic Kill Switch: Close all active positions and cancel all open orders
  const handlePanicKillSwitch = () => {
    positions.forEach((p) => handleClosePosition(p.id));
    setOrders([]);
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans pb-16 md:pb-0">
      {/* 1. Header (Adhering to Top Bar Contract) */}
      <TopNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        equity={accountState.equity}
        availableBalance={accountState.availableBalance}
        unrealizedPnl={accountState.totalUnrealizedPnl}
        is2FAEnabled={is2FAEnabled}
        onOpenSecurity={() => setIsSecurityModalOpen(true)}
        onPanicKillSwitch={handlePanicKillSwitch}
        openPositionsCount={positions.length}
      />

      {/* Main Content Router */}
      <main className="flex-1 flex flex-col p-2 sm:p-4 gap-3 max-w-[1920px] mx-auto w-full">
        {/* VIEW 1: MAIN TERMINAL */}
        {currentTab === 'terminal' && (
          <div className="flex-1 flex flex-col gap-3">
            {/* Desktop 3-Column Terminal Layout */}
            <div className="hidden lg:grid lg:grid-cols-12 gap-3 flex-1 min-h-[580px]">
              {/* Left Column (2 Cols): Watchlist */}
              <div className="lg:col-span-2 h-full">
                <Watchlist
                  assets={assets}
                  selectedSymbol={selectedSymbol}
                  onSelectAsset={handleSelectAsset}
                />
              </div>

              {/* Middle Column (7 Cols): Candlestick Chart & AI Signal Panel */}
              <div className="lg:col-span-7 flex flex-col gap-3 h-full">
                <div className="flex-1 min-h-[420px]">
                  <CandleChart
                    candles={candles}
                    symbol={selectedSymbol}
                    currentPrice={selectedAsset.price}
                    timeframe={timeframe}
                    onTimeframeChange={handleTimeframeChange}
                    activePositions={positions}
                    aiSignal={aiSignal}
                    indicators={indicators}
                  />
                </div>
                {/* AI Decision Support Signal Strip */}
                <div className="h-[210px]">
                  <AISignalPanel
                    asset={selectedAsset}
                    aiSignal={aiSignal}
                    isLoading={isAnalyzingAI}
                    onRefresh={() => fetchAISignal(selectedAsset, timeframe, indicators)}
                    onApplySignal={(target, sl) => {
                      setPresetTarget(target);
                      setPresetStopLoss(sl);
                    }}
                    indicators={indicators}
                  />
                </div>
              </div>

              {/* Right Column (3 Cols): Order Book & Execution Ticket */}
              <div className="lg:col-span-3 flex flex-col gap-3 h-full">
                <div className="h-[290px]">
                  <OrderBook
                    orderBook={orderBook}
                    recentTrades={recentTrades}
                    currentPrice={selectedAsset.price}
                    symbol={selectedSymbol}
                  />
                </div>
                <div className="flex-1 min-h-[340px]">
                  <OrderTicket
                    asset={selectedAsset}
                    currentPrice={selectedAsset.price}
                    availableBalance={accountState.availableBalance}
                    equity={accountState.equity}
                    openPositionsCount={positions.length}
                    onExecuteOrder={handleExecuteOrder}
                    presetTargetPrice={presetTarget}
                    presetStopLoss={presetStopLoss}
                  />
                </div>
              </div>
            </div>

            {/* Mobile / Tablet Responsive Layout with Thumb Controls */}
            <div className="flex lg:hidden flex-col gap-3 flex-1">
              {/* Mobile Sub-Tab Segmented Control */}
              <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-mono">
                <button
                  onClick={() => setMobileSubTab('chart')}
                  className={`flex-1 py-2 rounded-lg font-bold transition-colors ${
                    mobileSubTab === 'chart'
                      ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                      : 'text-slate-400'
                  }`}
                >
                  Chart
                </button>
                <button
                  onClick={() => setMobileSubTab('trade')}
                  className={`flex-1 py-2 rounded-lg font-bold transition-colors ${
                    mobileSubTab === 'trade'
                      ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                      : 'text-slate-400'
                  }`}
                >
                  Trade
                </button>
                <button
                  onClick={() => setMobileSubTab('book')}
                  className={`flex-1 py-2 rounded-lg font-bold transition-colors ${
                    mobileSubTab === 'book'
                      ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                      : 'text-slate-400'
                  }`}
                >
                  Book
                </button>
                <button
                  onClick={() => setMobileSubTab('positions')}
                  className={`flex-1 py-2 rounded-lg font-bold transition-colors relative ${
                    mobileSubTab === 'positions'
                      ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                      : 'text-slate-400'
                  }`}
                >
                  Positions ({positions.length})
                </button>
              </div>

              {/* Mobile View Switches */}
              {mobileSubTab === 'chart' && (
                <div className="flex flex-col gap-3">
                  <div className="h-[360px]">
                    <CandleChart
                      candles={candles}
                      symbol={selectedSymbol}
                      currentPrice={selectedAsset.price}
                      timeframe={timeframe}
                      onTimeframeChange={handleTimeframeChange}
                      activePositions={positions}
                      aiSignal={aiSignal}
                      indicators={indicators}
                    />
                  </div>
                  <div className="min-h-[220px]">
                    <AISignalPanel
                      asset={selectedAsset}
                      aiSignal={aiSignal}
                      isLoading={isAnalyzingAI}
                      onRefresh={() => fetchAISignal(selectedAsset, timeframe, indicators)}
                      onApplySignal={(target, sl) => {
                        setPresetTarget(target);
                        setPresetStopLoss(sl);
                        setMobileSubTab('trade');
                      }}
                      indicators={indicators}
                    />
                  </div>
                </div>
              )}

              {mobileSubTab === 'trade' && (
                <div className="min-h-[460px]">
                  <OrderTicket
                    asset={selectedAsset}
                    currentPrice={selectedAsset.price}
                    availableBalance={accountState.availableBalance}
                    equity={accountState.equity}
                    openPositionsCount={positions.length}
                    onExecuteOrder={(order) => {
                      handleExecuteOrder(order);
                      setMobileSubTab('positions');
                    }}
                    presetTargetPrice={presetTarget}
                    presetStopLoss={presetStopLoss}
                  />
                </div>
              )}

              {mobileSubTab === 'book' && (
                <div className="h-[460px]">
                  <OrderBook
                    orderBook={orderBook}
                    recentTrades={recentTrades}
                    currentPrice={selectedAsset.price}
                    symbol={selectedSymbol}
                  />
                </div>
              )}

              {mobileSubTab === 'positions' && (
                <div className="min-h-[380px]">
                  <PositionsAndOrders
                    positions={positions}
                    orders={orders}
                    tradeHistory={tradeHistory}
                    onClosePosition={handleClosePosition}
                    onCancelOrder={handleCancelOrder}
                    onCloseAllPositions={handlePanicKillSwitch}
                  />
                </div>
              )}
            </div>

            {/* Bottom Row: Active Positions & Orders (Desktop) */}
            <div className="hidden lg:block h-[240px]">
              <PositionsAndOrders
                positions={positions}
                orders={orders}
                tradeHistory={tradeHistory}
                onClosePosition={handleClosePosition}
                onCancelOrder={handleCancelOrder}
                onCloseAllPositions={handlePanicKillSwitch}
              />
            </div>
          </div>
        )}

        {/* VIEW 2: ANALYTICS & MACRO SENTIMENT RADAR */}
        {currentTab === 'analytics' && (
          <div className="flex-1 min-h-[600px]">
            <AnalyticsView accountState={accountState} positions={positions} />
          </div>
        )}

        {/* VIEW 3: AI COPILOT STRATEGY CHAT */}
        {currentTab === 'copilot' && (
          <div className="flex-1 min-h-[600px] max-w-4xl mx-auto w-full">
            <AICopilotDrawer
              currentAsset={selectedAsset}
              activePositions={positions}
              equity={accountState.equity}
            />
          </div>
        )}

        {/* VIEW 4: RISK & CONTROLS */}
        {currentTab === 'risk' && (
          <div className="flex-1 min-h-[500px] max-w-2xl mx-auto w-full">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 font-mono space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-100">Live Execution Risk Rules</h2>
                  <p className="text-slate-400 text-xs font-sans">
                    Configure institutional circuit breakers, 2FA guard, and slippage tolerances.
                  </p>
                </div>
              </div>

              {/* 2FA Status */}
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-200 block text-xs">Two-Factor Authentication</span>
                  <span className="text-slate-400 text-[11px] font-sans">
                    Hardware key biometric signing on order placement
                  </span>
                </div>
                <button
                  onClick={() => setIs2FAEnabled(!is2FAEnabled)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    is2FAEnabled
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {is2FAEnabled ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>

              {/* Slippage tolerance */}
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-200">Execution Slippage Cap</span>
                  <span className="font-bold text-emerald-400">{slippageTolerance}%</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[0.1, 0.5, 1.0, 2.0].map((tol) => (
                    <button
                      key={tol}
                      onClick={() => setSlippageTolerance(tol)}
                      className={`py-1.5 rounded-lg border text-xs font-semibold ${
                        slippageTolerance === tol
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {tol}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Leverage Ceiling */}
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-200">Account Leverage Ceiling</span>
                  <span className="font-bold text-amber-400">{maxLeverageCap}x</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="50"
                  step="1"
                  value={maxLeverageCap}
                  onChange={(e) => setMaxLeverageCap(parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Emergency Flatten */}
              <div className="p-4 bg-rose-500/10 rounded-xl border border-rose-500/30">
                <span className="font-bold text-rose-300 block text-xs mb-1">Emergency Kill Switch</span>
                <p className="text-[11px] text-slate-300 font-sans mb-3">
                  Instantly close all {positions.length} active positions and cancel all open limit orders.
                </p>
                <button
                  onClick={handlePanicKillSwitch}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs transition-colors"
                >
                  CANCEL ALL ORDERS & FLATTEN INVENTORY
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 5: TRADE HISTORY LOGS */}
        {currentTab === 'history' && (
          <div className="flex-1 min-h-[500px]">
            <PositionsAndOrders
              positions={positions}
              orders={orders}
              tradeHistory={tradeHistory}
              onClosePosition={handleClosePosition}
              onCancelOrder={handleCancelOrder}
              onCloseAllPositions={handlePanicKillSwitch}
            />
          </div>
        )}
      </main>

      {/* Security Modal */}
      <SecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        is2FAEnabled={is2FAEnabled}
        onToggle2FA={() => setIs2FAEnabled(!is2FAEnabled)}
        slippageTolerance={slippageTolerance}
        onSetSlippageTolerance={setSlippageTolerance}
        maxLeverageCap={maxLeverageCap}
        onSetMaxLeverageCap={setMaxLeverageCap}
        dailyLossLimitPercent={dailyLossLimitPercent}
        onSetDailyLossLimitPercent={setDailyLossLimitPercent}
        onPanicKillSwitch={handlePanicKillSwitch}
        openPositionsCount={positions.length}
      />

      {/* Ergonomic Mobile Bottom Nav (Thumb zone) */}
      <MobileBottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        openPositionsCount={positions.length}
      />
    </div>
  );
}
