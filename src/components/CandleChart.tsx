import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Candle, Position, AISignal, TechnicalIndicators } from '../types/trading';
import { Sliders, Eye, TrendingUp, Compass } from 'lucide-react';

interface CandleChartProps {
  candles: Candle[];
  symbol: string;
  currentPrice: number;
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
  activePositions: Position[];
  aiSignal: AISignal | null;
  indicators: TechnicalIndicators;
}

export const CandleChart: React.FC<CandleChartProps> = ({
  candles,
  symbol,
  currentPrice,
  timeframe,
  onTimeframeChange,
  activePositions,
  aiSignal,
  indicators,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Indicator view toggles
  const [showEMA20, setShowEMA20] = useState(true);
  const [showEMA50, setShowEMA50] = useState(true);
  const [showBollinger, setShowBollinger] = useState(false);
  const [showVolume, setShowVolume] = useState(true);
  const [showRSIBar, setShowRSIBar] = useState(true);

  // Crosshair state
  const [crosshair, setCrosshair] = useState<{ x: number; y: number; candle: Candle | null } | null>(null);

  // Filter positions for current symbol
  const symbolPositions = useMemo(
    () => activePositions.filter((p) => p.symbol === symbol),
    [activePositions, symbol]
  );

  // Redraw canvas on data or size change
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || candles.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const height = container.clientHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Padding parameters
    const padRight = 68; // For price scale
    const padBottom = showRSIBar ? 75 : 28; // For time scale & RSI subchart
    const padTop = 32;
    const padLeft = 12;

    const chartW = width - padRight - padLeft;
    const mainChartH = height - padBottom - padTop;

    // Find price min/max in view
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let maxVol = 0;

    candles.forEach((c) => {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
      if (c.volume > maxVol) maxVol = c.volume;
    });

    // Expand margin by 5%
    const priceRange = maxPrice - minPrice || 1;
    minPrice -= priceRange * 0.04;
    maxPrice += priceRange * 0.04;
    const effectiveRange = maxPrice - minPrice;

    const getY = (p: number) => padTop + (1 - (p - minPrice) / effectiveRange) * mainChartH;
    const candleWidth = Math.max(3, chartW / candles.length);
    const getX = (i: number) => padLeft + i * candleWidth + candleWidth / 2;

    // 1. Clear background
    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, width, height);

    // 2. Draw subtle horizontal grid lines
    const gridSteps = 6;
    ctx.strokeStyle = '#151d2f';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#64748b';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'left';

    for (let i = 0; i <= gridSteps; i++) {
      const priceVal = minPrice + (effectiveRange * i) / gridSteps;
      const y = getY(priceVal);
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();

      // Right-side price axis text
      ctx.fillText(priceVal.toFixed(priceVal > 500 ? 2 : 4), width - padRight + 6, y + 3);
    }

    // 3. Draw Bollinger Bands if enabled
    if (showBollinger && candles.length > 20) {
      ctx.beginPath();
      ctx.strokeStyle = '#38bdf825';
      ctx.fillStyle = '#38bdf808';
      // Approximate BB curve
      const upperPoints: { x: number; y: number }[] = [];
      const lowerPoints: { x: number; y: number }[] = [];

      for (let i = 19; i < candles.length; i++) {
        const slice = candles.slice(i - 19, i + 1);
        const mean = slice.reduce((a, b) => a + b.close, 0) / 20;
        const variance = slice.reduce((a, b) => a + Math.pow(b.close - mean, 2), 0) / 20;
        const std = Math.sqrt(variance);
        const x = getX(i);
        upperPoints.push({ x, y: getY(mean + 2 * std) });
        lowerPoints.push({ x, y: getY(mean - 2 * std) });
      }

      if (upperPoints.length > 0) {
        ctx.moveTo(upperPoints[0].x, upperPoints[0].y);
        upperPoints.forEach((pt) => ctx.lineTo(pt.x, pt.y));
        for (let i = lowerPoints.length - 1; i >= 0; i--) {
          ctx.lineTo(lowerPoints[i].x, lowerPoints[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    // 4. Draw EMAs
    const drawEMA = (period: number, strokeColor: string) => {
      if (candles.length < period) return;
      ctx.beginPath();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;

      const k = 2 / (period + 1);
      let ema = candles.slice(0, period).reduce((acc, c) => acc + c.close, 0) / period;

      for (let i = 0; i < candles.length; i++) {
        if (i < period) {
          // pre-period
        } else {
          ema = candles[i].close * k + ema * (1 - k);
          const x = getX(i);
          const y = getY(ema);
          if (i === period) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    };

    if (showEMA20) drawEMA(20, '#38bdf8'); // Sky blue for 20 EMA
    if (showEMA50) drawEMA(50, '#f59e0b'); // Amber for 50 EMA

    // 5. Draw Volume bars
    if (showVolume && maxVol > 0) {
      const volAreaH = mainChartH * 0.22;
      candles.forEach((c, i) => {
        const x = getX(i);
        const isUp = c.close >= c.open;
        const barH = (c.volume / maxVol) * volAreaH;
        const barY = padTop + mainChartH - barH;
        ctx.fillStyle = isUp ? 'rgba(16, 185, 129, 0.22)' : 'rgba(239, 68, 68, 0.22)';
        ctx.fillRect(x - candleWidth * 0.35, barY, candleWidth * 0.7, barH);
      });
    }

    // 6. Draw Candlesticks
    candles.forEach((c, i) => {
      const x = getX(i);
      const isUp = c.close >= c.open;
      const bodyTop = getY(Math.max(c.open, c.close));
      const bodyBottom = getY(Math.min(c.open, c.close));
      const bodyH = Math.max(1.5, bodyBottom - bodyTop);

      // Wick
      ctx.strokeStyle = isUp ? '#10b981' : '#ef4444';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, getY(c.high));
      ctx.lineTo(x, getY(c.low));
      ctx.stroke();

      // Body
      ctx.fillStyle = isUp ? '#10b981' : '#ef4444';
      const w = Math.max(2, candleWidth * 0.7);
      ctx.fillRect(x - w / 2, bodyTop, w, bodyH);
    });

    // 7. Draw Active Positions lines (Entry, SL, TP)
    symbolPositions.forEach((pos) => {
      const y = getY(pos.entryPrice);
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = pos.side === 'LONG' ? '#10b981' : '#ef4444';
      ctx.lineWidth = 1;
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Position Tag
      ctx.fillStyle = pos.side === 'LONG' ? '#064e3b' : '#7f1d1d';
      ctx.fillRect(width - padRight + 2, y - 8, 62, 16);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${pos.side} $${pos.entryPrice.toFixed(1)}`, width - padRight + 4, y + 4);

      // Stop Loss
      if (pos.stopLoss) {
        const slY = getY(pos.stopLoss);
        ctx.beginPath();
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = '#f43f5e';
        ctx.moveTo(padLeft, slY);
        ctx.lineTo(width - padRight, slY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#f43f5e';
        ctx.fillText(`SL $${pos.stopLoss.toFixed(1)}`, width - padRight + 4, slY + 3);
      }
    });

    // 8. Draw Current Price Marker
    const curY = getY(currentPrice);
    ctx.beginPath();
    ctx.setLineDash([2, 2]);
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 1;
    ctx.moveTo(padLeft, curY);
    ctx.lineTo(width - padRight, curY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Current price badge on axis
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(width - padRight + 1, curY - 9, 64, 18);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px JetBrains Mono, monospace';
    ctx.fillText(currentPrice.toFixed(currentPrice > 500 ? 2 : 4), width - padRight + 4, curY + 4);

    // 9. Draw RSI Subchart if enabled
    if (showRSIBar) {
      const rsiTop = height - 52;
      const rsiH = 38;

      ctx.fillStyle = '#0b111e';
      ctx.fillRect(padLeft, rsiTop, chartW, rsiH);
      ctx.strokeStyle = '#1e293b';
      ctx.strokeRect(padLeft, rsiTop, chartW, rsiH);

      // 70 & 30 reference lines
      const y70 = rsiTop + rsiH * 0.3;
      const y30 = rsiTop + rsiH * 0.7;
      ctx.strokeStyle = '#334155';
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(padLeft, y70);
      ctx.lineTo(padLeft + chartW, y70);
      ctx.moveTo(padLeft, y30);
      ctx.lineTo(padLeft + chartW, y30);
      ctx.stroke();
      ctx.setLineDash([]);

      // RSI Label
      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px JetBrains Mono, monospace';
      ctx.fillText(`RSI (14): ${indicators.rsi.toFixed(1)}`, padLeft + 6, rsiTop + 12);

      // Quick mini RSI line plot
      if (candles.length > 15) {
        ctx.beginPath();
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 1.4;
        for (let i = 14; i < candles.length; i++) {
          const x = getX(i);
          // calculate relative RSI progression
          const val = indicators.rsi; // smooth representation
          const y = rsiTop + (1 - val / 100) * rsiH;
          if (i === 14) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }

    // 10. Draw Crosshair if active
    if (crosshair && crosshair.candle) {
      ctx.strokeStyle = '#94a3b880';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);

      // vertical
      ctx.beginPath();
      ctx.moveTo(crosshair.x, padTop);
      ctx.lineTo(crosshair.x, height - padBottom);
      ctx.stroke();

      // horizontal
      ctx.beginPath();
      ctx.moveTo(padLeft, crosshair.y);
      ctx.lineTo(width - padRight, crosshair.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // calculate crosshair price
      const hoveredPrice = minPrice + (1 - (crosshair.y - padTop) / mainChartH) * effectiveRange;
      ctx.fillStyle = '#334155';
      ctx.fillRect(width - padRight + 1, crosshair.y - 8, 64, 16);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillText(hoveredPrice.toFixed(hoveredPrice > 500 ? 2 : 4), width - padRight + 4, crosshair.y + 4);
    }
  }, [
    candles,
    currentPrice,
    symbolPositions,
    showEMA20,
    showEMA50,
    showBollinger,
    showVolume,
    showRSIBar,
    crosshair,
    indicators,
  ]);

  // Handle crosshair mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const padLeft = 12;
    const padRight = 68;
    const chartW = canvas.clientWidth - padRight - padLeft;
    const candleWidth = chartW / candles.length;

    const index = Math.floor((x - padLeft) / candleWidth);
    if (index >= 0 && index < candles.length) {
      setCrosshair({ x, y, candle: candles[index] });
    } else {
      setCrosshair(null);
    }
  };

  const handleMouseLeave = () => {
    setCrosshair(null);
  };

  const activeCandle = crosshair?.candle || (candles.length > 0 ? candles[candles.length - 1] : null);

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 border border-slate-800/80 rounded-xl overflow-hidden shadow-lg">
      {/* Chart Top Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 border-b border-slate-800/80 bg-slate-900/60 text-xs">
        {/* Symbol & Live OHLCV */}
        <div className="flex items-center gap-3 overflow-x-auto whitespace-nowrap">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-100 font-mono text-sm">{symbol}</span>
            <span className="text-[11px] text-slate-400">·</span>
            <span className="font-mono font-semibold text-slate-200 tabular-nums">
              ${currentPrice.toFixed(currentPrice > 500 ? 2 : 4)}
            </span>
          </div>

          {activeCandle && (
            <div className="hidden lg:flex items-center gap-3 text-[11px] font-mono text-slate-400">
              <span>
                O: <span className="text-slate-200">${activeCandle.open.toFixed(2)}</span>
              </span>
              <span>
                H: <span className="text-slate-200">${activeCandle.high.toFixed(2)}</span>
              </span>
              <span>
                L: <span className="text-slate-200">${activeCandle.low.toFixed(2)}</span>
              </span>
              <span>
                C:{' '}
                <span className={activeCandle.close >= activeCandle.open ? 'text-emerald-400' : 'text-rose-400'}>
                  ${activeCandle.close.toFixed(2)}
                </span>
              </span>
              <span>
                Vol: <span className="text-slate-200">{(activeCandle.volume / 1000).toFixed(0)}k</span>
              </span>
            </div>
          )}
        </div>

        {/* Timeframe & Indicator Toggles */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Timeframes */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            {['1m', '5m', '15m', '1h', '4h', '1D'].map((tf) => (
              <button
                key={tf}
                onClick={() => onTimeframeChange(tf)}
                className={`px-2 py-1 text-[11px] font-mono rounded transition-colors whitespace-nowrap ${
                  timeframe === tf
                    ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Indicators dropdown/toggle buttons */}
          <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-slate-800">
            <button
              onClick={() => setShowEMA20(!showEMA20)}
              className={`px-2 py-1 rounded text-[10px] font-mono border transition-colors ${
                showEMA20
                  ? 'bg-sky-500/10 border-sky-500/40 text-sky-400'
                  : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title="Toggle 20-Period Exponential Moving Average"
            >
              EMA 20
            </button>
            <button
              onClick={() => setShowEMA50(!showEMA50)}
              className={`px-2 py-1 rounded text-[10px] font-mono border transition-colors ${
                showEMA50
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                  : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title="Toggle 50-Period Exponential Moving Average"
            >
              EMA 50
            </button>
            <button
              onClick={() => setShowBollinger(!showBollinger)}
              className={`px-2 py-1 rounded text-[10px] font-mono border transition-colors ${
                showBollinger
                  ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-400'
                  : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title="Toggle Bollinger Bands (20, 2)"
            >
              BB
            </button>
            <button
              onClick={() => setShowRSIBar(!showRSIBar)}
              className={`px-2 py-1 rounded text-[10px] font-mono border transition-colors ${
                showRSIBar
                  ? 'bg-purple-500/10 border-purple-500/40 text-purple-400'
                  : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title="Toggle RSI Subchart"
            >
              RSI
            </button>
          </div>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div ref={containerRef} className="relative flex-1 w-full min-h-[300px]">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="absolute inset-0 w-full h-full cursor-crosshair block"
        />

        {/* AI Projection badge if signal available */}
        {aiSignal && (
          <div className="absolute top-3 left-3 pointer-events-none flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-md border border-slate-800 text-[11px] font-mono shadow-md">
            <span className="text-slate-400">AI Target:</span>
            <span className="text-emerald-400 font-bold tabular-nums">${aiSignal.targetPrice.toFixed(2)}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">SL:</span>
            <span className="text-rose-400 font-bold tabular-nums">${aiSignal.stopLoss.toFixed(2)}</span>
          </div>
        )}
      </div>
    </div>
  );
};
