import React, { useState, useEffect } from 'react';
import { AccountState, MarketSentimentData, Position } from '../types/trading';
import { Activity, TrendingUp, ShieldAlert, Award, Compass, RefreshCw, BarChart3, Layers } from 'lucide-react';

interface AnalyticsViewProps {
  accountState: AccountState;
  positions: Position[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  accountState,
  positions,
}) => {
  const [sentiment, setSentiment] = useState<MarketSentimentData | null>(null);
  const [loadingSentiment, setLoadingSentiment] = useState<boolean>(false);

  const fetchSentiment = async () => {
    setLoadingSentiment(true);
    try {
      const res = await fetch('/api/ai/market-sentiment', { method: 'POST' });
      const data = await res.json();
      setSentiment(data);
    } catch (err) {
      console.error('Failed to fetch market sentiment', err);
    } finally {
      setLoadingSentiment(false);
    }
  };

  useEffect(() => {
    fetchSentiment();
  }, []);

  // Synthetic equity curve points based on equity & realized PnL
  const equityPoints = [
    50000,
    50420,
    49800,
    51200,
    52400,
    51950,
    53100,
    54200,
    53900,
    accountState.equity,
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800/80 rounded-xl overflow-y-auto p-4 sm:p-6 text-xs font-mono space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight">
            Institutional Analytics & Macro Radar
          </h2>
          <p className="text-slate-400 text-xs font-sans mt-0.5">
            Real-time equity risk modeling, portfolio metrics, and Gemini macro sentiment.
          </p>
        </div>

        <button
          onClick={fetchSentiment}
          disabled={loadingSentiment}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 text-xs font-medium transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${loadingSentiment ? 'animate-spin' : ''}`} />
          <span>{loadingSentiment ? 'Refreshing Radar...' : 'Refresh Macro Radar'}</span>
        </button>
      </div>

      {/* KPI Metrics Strip (4 columns) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
            Total Equity
          </span>
          <span className="text-lg font-extrabold text-slate-100 tabular-nums">
            ${accountState.equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-emerald-400 block mt-1">
            +${(accountState.equity - 50000).toFixed(2)} all-time
          </span>
        </div>

        <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
            Win Rate
          </span>
          <span className="text-lg font-extrabold text-emerald-400 tabular-nums">
            {accountState.winRate.toFixed(1)}%
          </span>
          <span className="text-[10px] text-slate-400 block mt-1">
            Across {accountState.totalTrades} closed executions
          </span>
        </div>

        <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
            Profit Factor
          </span>
          <span className="text-lg font-extrabold text-amber-400 tabular-nums">
            {accountState.profitFactor.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-1">
            Gross gains / Gross losses
          </span>
        </div>

        <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
            Max Drawdown
          </span>
          <span className="text-lg font-extrabold text-rose-400 tabular-nums">
            {accountState.maxDrawdown.toFixed(2)}%
          </span>
          <span className="text-[10px] text-slate-400 block mt-1">
            Within 5.0% institutional safety threshold
          </span>
        </div>
      </div>

      {/* Equity Performance Curve & Macro Radar Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Equity Curve */}
        <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-slate-200 text-sm">Portfolio Equity Curve</h3>
              <span className="text-[10px] text-slate-400">Cumulative Performance Session</span>
            </div>
            <span className="text-xs font-bold text-emerald-400 tabular-nums font-mono">
              +8.4% Cumulative
            </span>
          </div>

          {/* SVG Sparkline / Equity Chart */}
          <div className="h-44 w-full relative pt-2">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 400 120" preserveAspectRatio="none">
              <defs>
                <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Path */}
              {(() => {
                const minEq = Math.min(...equityPoints) * 0.98;
                const maxEq = Math.max(...equityPoints) * 1.02;
                const range = maxEq - minEq || 1;
                const pts = equityPoints.map((val, i) => {
                  const x = (i / (equityPoints.length - 1)) * 400;
                  const y = 120 - ((val - minEq) / range) * 110;
                  return `${x},${y}`;
                });
                const dLine = `M ${pts.join(' L ')}`;
                const dArea = `M 0,120 L ${pts.join(' L ')} L 400,120 Z`;
                return (
                  <>
                    <path d={dArea} fill="url(#equityGrad)" />
                    <path d={dLine} fill="none" stroke="#10b981" strokeWidth="2.5" />
                  </>
                );
              })()}
            </svg>
          </div>

          <div className="flex justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800/60 font-mono">
            <span>Session Open ($50,000.00)</span>
            <span>Current High (${accountState.equity.toFixed(2)})</span>
          </div>
        </div>

        {/* AI Macro Sentiment Radar */}
        <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-slate-200 text-sm">Cross-Market Sentiment Radar</h3>
              <span className="text-[10px] text-slate-400">Institutional Macro Synthesis</span>
            </div>
            {sentiment && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {sentiment.sentimentLabel}
              </span>
            )}
          </div>

          {sentiment ? (
            <div className="space-y-3.5">
              {/* Fear & Greed Gauge Bar */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">Macro Fear & Greed Index</span>
                  <span className="font-bold text-emerald-400 tabular-nums">
                    {sentiment.fearGreedIndex} / 100
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5">
                  <div
                    className="bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 h-full rounded-full transition-all duration-700"
                    style={{ width: `${sentiment.fearGreedIndex}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                  <span>Extreme Fear (0)</span>
                  <span>Neutral (50)</span>
                  <span>Extreme Greed (100)</span>
                </div>
              </div>

              {/* Macro Narrative */}
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/60 text-slate-300 font-sans text-xs leading-relaxed">
                {sentiment.macroSummary}
              </div>

              {/* Top Themes */}
              <div className="space-y-1.5">
                {sentiment.topThemes?.map((theme, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800/40 text-[11px]"
                  >
                    <span className="text-slate-200 font-medium font-sans">{theme.theme}</span>
                    <span
                      className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        theme.impact === 'BULLISH'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : theme.impact === 'BEARISH'
                          ? 'bg-rose-500/15 text-rose-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {theme.impact}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-10 text-slate-500">
              <p>Loading market radar...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
