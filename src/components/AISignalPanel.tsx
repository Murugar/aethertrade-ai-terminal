import React from 'react';
import { AISignal, Asset, TechnicalIndicators } from '../types/trading';
import { Cpu, RefreshCw, ArrowUpRight, ArrowDownRight, Compass, Check, AlertCircle } from 'lucide-react';

interface AISignalPanelProps {
  asset: Asset;
  aiSignal: AISignal | null;
  isLoading: boolean;
  onRefresh: () => void;
  onApplySignal: (target: number, stopLoss: number) => void;
  indicators: TechnicalIndicators;
}

export const AISignalPanel: React.FC<AISignalPanelProps> = ({
  asset,
  aiSignal,
  isLoading,
  onRefresh,
  onApplySignal,
  indicators,
}) => {
  const isBuy = aiSignal?.bias.includes('BUY');
  const isSell = aiSignal?.bias.includes('SELL');

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800/80 rounded-xl overflow-hidden shadow-lg p-3.5 sm:p-4 text-xs font-mono">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Cpu className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-xs sm:text-sm">AI Decision Support</h3>
            <span className="text-[10px] text-slate-400">Gemini Quantitative Engine</span>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 text-[11px] transition-colors disabled:opacity-50"
          title="Run fresh deep inference"
        >
          <RefreshCw className={`w-3 h-3 text-emerald-400 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isLoading ? 'Analyzing...' : 'Refresh'}</span>
        </button>
      </div>

      {aiSignal ? (
        <div className="flex flex-col gap-3.5 pt-3.5 flex-1 overflow-y-auto">
          {/* Signal Headline Box */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between ${
              isBuy
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : isSell
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : 'bg-slate-900/90 border-slate-800 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  isBuy ? 'bg-emerald-500/20 text-emerald-400' : isSell ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {isBuy ? (
                  <ArrowUpRight className="w-5 h-5" />
                ) : isSell ? (
                  <ArrowDownRight className="w-5 h-5" />
                ) : (
                  <Compass className="w-5 h-5" />
                )}
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider block opacity-80">Algorithmic Bias</span>
                <span className="text-base font-extrabold tracking-tight">
                  {aiSignal.bias.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider block opacity-80">Confidence</span>
              <span className="text-lg font-extrabold tabular-nums font-mono">
                {aiSignal.confidence}%
              </span>
            </div>
          </div>

          {/* Key Targets Grid */}
          <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-900/60 rounded-xl border border-slate-800/80">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase">Target Price</span>
              <span className="text-sm font-bold text-emerald-400 tabular-nums">
                ${aiSignal.targetPrice.toFixed(2)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase">Stop Loss</span>
              <span className="text-sm font-bold text-rose-400 tabular-nums">
                ${aiSignal.stopLoss.toFixed(2)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase">Risk / Reward</span>
              <span className="text-sm font-bold text-amber-400 tabular-nums">
                {aiSignal.riskRewardRatio}
              </span>
            </div>
          </div>

          {/* 1-Click Apply to Order Ticket Button */}
          <button
            onClick={() => onApplySignal(aiSignal.targetPrice, aiSignal.stopLoss)}
            className="w-full py-2 px-3 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply AI Target & SL to Order Ticket</span>
          </button>

          {/* Tactical Recommendation */}
          <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/60">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
              Actionable Tactical Plan
            </span>
            <p className="text-slate-200 text-xs leading-relaxed font-sans">
              {aiSignal.suggestedAction}
            </p>
          </div>

          {/* Key Drivers */}
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1.5">
              Multi-Factor Market Drivers
            </span>
            <div className="space-y-1.5">
              {aiSignal.keyDrivers?.map((driver, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-2 rounded-lg bg-slate-900/40 border border-slate-800/40 text-[11px] text-slate-300 font-sans"
                >
                  <span className="text-emerald-400 font-mono mt-0.5">·</span>
                  <span className="leading-snug">{driver}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Indicator Confluence Telemetry */}
          <div className="p-2.5 bg-slate-900/30 rounded-lg border border-slate-800/40 text-[10px] text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
            <span>
              RSI (14): <strong className="text-slate-200 font-mono">{indicators.rsi.toFixed(1)}</strong>
            </span>
            <span>
              20 EMA: <strong className="text-slate-200 font-mono">${indicators.ema20.toFixed(2)}</strong>
            </span>
            <span>
              Regime: <strong className="text-slate-200 font-mono">{aiSignal.volatilityRegime.replace('_', ' ')}</strong>
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 py-8 text-center text-slate-400">
          <Cpu className="w-8 h-8 text-slate-600 mb-2 animate-pulse" />
          <p className="text-xs">Generating algorithmic intelligence for {asset.symbol}...</p>
        </div>
      )}
    </div>
  );
};
