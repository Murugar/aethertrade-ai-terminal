import React from 'react';
import { ShieldCheck, ShieldAlert, Cpu, Activity, Zap, AlertTriangle } from 'lucide-react';

interface TopNavProps {
  currentTab: 'terminal' | 'analytics' | 'copilot' | 'risk' | 'history';
  onSelectTab: (tab: 'terminal' | 'analytics' | 'copilot' | 'risk' | 'history') => void;
  equity: number;
  availableBalance: number;
  unrealizedPnl: number;
  is2FAEnabled: boolean;
  onOpenSecurity: () => void;
  onPanicKillSwitch: () => void;
  openPositionsCount: number;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentTab,
  onSelectTab,
  equity,
  unrealizedPnl,
  is2FAEnabled,
  onOpenSecurity,
  onPanicKillSwitch,
  openPositionsCount,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-4 sm:px-6 py-3 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('terminal');
          }}
          className="flex items-center gap-2.5 text-slate-100 font-bold tracking-tight text-base sm:text-lg whitespace-nowrap group"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:border-emerald-500 transition-colors">
            <Zap className="w-4 h-4" />
          </div>
          <span>AetherTrade AI</span>
        </a>
      </div>

      {/* Zone 2: Clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-xs sm:text-sm font-medium text-slate-400">
        <button
          onClick={() => onSelectTab('terminal')}
          className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            currentTab === 'terminal'
              ? 'text-emerald-400 border-b border-emerald-400 font-semibold'
              : 'hover:text-slate-200'
          }`}
        >
          Terminal
        </button>
        <button
          onClick={() => onSelectTab('analytics')}
          className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            currentTab === 'analytics'
              ? 'text-emerald-400 border-b border-emerald-400 font-semibold'
              : 'hover:text-slate-200'
          }`}
        >
          Analytics & Radar
        </button>
        <button
          onClick={() => onSelectTab('copilot')}
          className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 flex items-center gap-1.5 ${
            currentTab === 'copilot'
              ? 'text-emerald-400 border-b border-emerald-400 font-semibold'
              : 'hover:text-slate-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-emerald-400" />
          AI Copilot
        </button>
        <button
          onClick={() => onSelectTab('risk')}
          className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            currentTab === 'risk'
              ? 'text-emerald-400 border-b border-emerald-400 font-semibold'
              : 'hover:text-slate-200'
          }`}
        >
          Risk Controls
        </button>
        <button
          onClick={() => onSelectTab('history')}
          className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            currentTab === 'history'
              ? 'text-emerald-400 border-b border-emerald-400 font-semibold'
              : 'hover:text-slate-200'
          }`}
        >
          Trade Logs
        </button>
      </nav>

      {/* Zone 3: 1 primary action area */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Equity Pill */}
        <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-lg text-xs">
          <div className="flex flex-col text-right">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Portfolio Equity</span>
            <span className="font-mono font-bold text-slate-100 tabular-nums text-sm">
              ${equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div className="flex flex-col text-right">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Unrealized PnL</span>
            <span
              className={`font-mono font-bold tabular-nums text-sm ${
                unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {unrealizedPnl >= 0 ? '+' : ''}${unrealizedPnl.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Security / 2FA status button */}
        <button
          onClick={onOpenSecurity}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 transition-colors text-xs text-slate-300 font-medium whitespace-nowrap"
          title="Security & Protection Controls"
        >
          {is2FAEnabled ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">2FA Secure</span>
            </>
          ) : (
            <>
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Set 2FA</span>
            </>
          )}
        </button>

        {/* Panic Kill Switch */}
        {openPositionsCount > 0 && (
          <button
            onClick={onPanicKillSwitch}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 hover:text-rose-200 text-xs font-semibold transition-all whitespace-nowrap"
            title="Emergency: Flatten all positions and cancel all open orders"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Panic Close ({openPositionsCount})</span>
            <span className="sm:hidden">Panic</span>
          </button>
        )}
      </div>
    </header>
  );
};
