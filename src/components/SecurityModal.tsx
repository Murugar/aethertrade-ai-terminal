import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Lock, AlertTriangle, X, Check, Sliders, Smartphone } from 'lucide-react';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  is2FAEnabled: boolean;
  onToggle2FA: () => void;
  slippageTolerance: number;
  onSetSlippageTolerance: (tol: number) => void;
  maxLeverageCap: number;
  onSetMaxLeverageCap: (cap: number) => void;
  dailyLossLimitPercent: number;
  onSetDailyLossLimitPercent: (limit: number) => void;
  onPanicKillSwitch: () => void;
  openPositionsCount: number;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({
  isOpen,
  onClose,
  is2FAEnabled,
  onToggle2FA,
  slippageTolerance,
  onSetSlippageTolerance,
  maxLeverageCap,
  onSetMaxLeverageCap,
  dailyLossLimitPercent,
  onSetDailyLossLimitPercent,
  onPanicKillSwitch,
  openPositionsCount,
}) => {
  const [authCode, setAuthCode] = useState('');
  const [successToast, setSuccessToast] = useState('');

  if (!isOpen) return null;

  const handle2FASubmit = () => {
    onToggle2FA();
    setSuccessToast(is2FAEnabled ? 'Two-Factor Authentication disabled' : 'Two-Factor Authentication activated successfully');
    setTimeout(() => setSuccessToast(''), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl text-xs font-mono animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Security & Capital Preservation</h3>
              <span className="text-[10px] text-slate-400">Execution Guardrails & Hardening</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {successToast && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successToast}</span>
            </div>
          )}

          {/* 1. Two-Factor Authentication & Biometrics */}
          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-slate-200">Hardware 2FA / WebAuthn Guard</span>
              </div>
              <button
                onClick={handle2FASubmit}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  is2FAEnabled
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {is2FAEnabled ? 'ENABLED' : 'ENABLE 2FA'}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              Enforces cryptographically signed approval before high-notional orders or leverage adjustments can execute.
            </p>
          </div>

          {/* 2. Slippage Protection Tolerance */}
          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-200">Execution Slippage Cap</span>
              <span className="text-emerald-400 font-bold tabular-nums font-mono">
                {slippageTolerance}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans mb-3">
              Market orders reject automatically if execution price drifts beyond this threshold.
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[0.1, 0.5, 1.0, 2.0].map((tol) => (
                <button
                  key={tol}
                  onClick={() => onSetSlippageTolerance(tol)}
                  className={`py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                    slippageTolerance === tol
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tol}%
                </button>
              ))}
            </div>
          </div>

          {/* 3. Account Max Leverage Ceiling */}
          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-200">Maximum Leverage Ceiling</span>
              <span className="text-amber-400 font-bold tabular-nums font-mono">{maxLeverageCap}x</span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans mb-2">
              Hard account-level governor preventing excessive margin risk during volatile trading sessions.
            </p>
            <input
              type="range"
              min="2"
              max="50"
              step="1"
              value={maxLeverageCap}
              onChange={(e) => onSetMaxLeverageCap(parseInt(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[9px] text-slate-500 mt-1">
              <span>2x Conservative</span>
              <span>10x Balanced</span>
              <span>25x Aggressive</span>
              <span>50x Maximum</span>
            </div>
          </div>

          {/* 4. Daily Drawdown Circuit Breaker */}
          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-200">Daily Drawdown Circuit Breaker</span>
              <span className="text-rose-400 font-bold tabular-nums font-mono">{dailyLossLimitPercent}%</span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans mb-2">
              Trading automatically pauses if intraday equity falls by more than this percentage.
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[2, 4, 6, 10].map((limit) => (
                <button
                  key={limit}
                  onClick={() => onSetDailyLossLimitPercent(limit)}
                  className={`py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                    dailyLossLimitPercent === limit
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {limit}%
                </button>
              ))}
            </div>
          </div>

          {/* 5. Master Emergency Kill Switch */}
          <div className="p-4 bg-rose-500/10 rounded-xl border border-rose-500/30">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-rose-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Emergency Master Kill Switch
              </span>
              <span className="text-[10px] text-rose-400">
                {openPositionsCount} active positions
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-sans mb-3">
              Immediately market-flattens all open inventory and cancels all resting orders across all pairs.
            </p>
            <button
              onClick={() => {
                onPanicKillSwitch();
                onClose();
              }}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>FLATTEN ALL POSITIONS & CANCEL ORDERS</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
