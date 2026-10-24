import React, { useState, useMemo } from 'react';
import { Asset, OrderSide, OrderType, PreTradeRiskAudit } from '../types/trading';
import { ShieldCheck, ShieldAlert, AlertTriangle, Cpu, CheckCircle2, Sliders } from 'lucide-react';

interface OrderTicketProps {
  asset: Asset;
  currentPrice: number;
  availableBalance: number;
  equity: number;
  openPositionsCount: number;
  onExecuteOrder: (order: {
    symbol: string;
    side: OrderSide;
    type: OrderType;
    price: number;
    amount: number;
    leverage: number;
    stopLoss?: number;
    takeProfit?: number;
  }) => void;
  presetTargetPrice?: number;
  presetStopLoss?: number;
}

export const OrderTicket: React.FC<OrderTicketProps> = ({
  asset,
  currentPrice,
  availableBalance,
  equity,
  openPositionsCount,
  onExecuteOrder,
  presetTargetPrice,
  presetStopLoss,
}) => {
  const [side, setSide] = useState<OrderSide>('BUY');
  const [type, setType] = useState<OrderType>('MARKET');
  const [priceInput, setPriceInput] = useState<string>(currentPrice.toString());
  const [amountInput, setAmountInput] = useState<string>('0.05');
  const [leverage, setLeverage] = useState<number>(5);
  const [takeProfitInput, setTakeProfitInput] = useState<string>('');
  const [stopLossInput, setStopLossInput] = useState<string>('');
  const [isAuditingRisk, setIsAuditingRisk] = useState<boolean>(false);
  const [riskAudit, setRiskAudit] = useState<PreTradeRiskAudit | null>(null);

  // Sync preset levels if user clicked "Apply to Order Ticket" from AI Signal
  React.useEffect(() => {
    if (presetTargetPrice) setTakeProfitInput(presetTargetPrice.toFixed(2));
    if (presetStopLoss) setStopLossInput(presetStopLoss.toFixed(2));
  }, [presetTargetPrice, presetStopLoss]);

  // Update limit price input when asset changes
  React.useEffect(() => {
    setPriceInput(currentPrice.toFixed(asset.decimals));
  }, [asset.symbol]);

  const effectivePrice = type === 'MARKET' ? currentPrice : parseFloat(priceInput) || currentPrice;
  const amount = parseFloat(amountInput) || 0;
  const notionalValue = amount * effectivePrice;
  const leveragedNotional = notionalValue;
  const marginRequired = leverage > 0 ? notionalValue / leverage : notionalValue;

  // Liquidation Price calculation approximation
  const liquidationPrice = useMemo(() => {
    if (leverage <= 1 || effectivePrice <= 0) return 0;
    const maintenanceMargin = 0.01; // 1% maintenance margin
    const liqDistance = (effectivePrice * (1 - maintenanceMargin)) / leverage;
    return side === 'BUY'
      ? Math.max(0, effectivePrice - liqDistance)
      : effectivePrice + liqDistance;
  }, [effectivePrice, leverage, side]);

  // Handle Quick Size Percentage Buttons
  const handleQuickPercent = (pct: number) => {
    const maxMarginToUse = availableBalance * (pct / 100);
    const maxNotional = maxMarginToUse * leverage;
    if (effectivePrice > 0) {
      const calculatedAmount = maxNotional / effectivePrice;
      setAmountInput(calculatedAmount.toFixed(3));
    }
  };

  // Perform AI Risk Audit before execution
  const runAIRiskAudit = async () => {
    setIsAuditingRisk(true);
    try {
      const res = await fetch('/api/ai/pretrade-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: asset.symbol,
          side,
          amount,
          leverage,
          entryPrice: effectivePrice,
          stopLoss: stopLossInput ? parseFloat(stopLossInput) : undefined,
          accountEquity: equity,
          openPositionsCount,
        }),
      });
      const data = await res.json();
      setRiskAudit(data);
    } catch (err) {
      console.error('Failed to run AI risk audit', err);
    } finally {
      setIsAuditingRisk(false);
    }
  };

  const handlePlaceOrder = () => {
    if (amount <= 0 || marginRequired > availableBalance) return;

    onExecuteOrder({
      symbol: asset.symbol,
      side,
      type,
      price: effectivePrice,
      amount,
      leverage,
      stopLoss: stopLossInput ? parseFloat(stopLossInput) : undefined,
      takeProfit: takeProfitInput ? parseFloat(takeProfitInput) : undefined,
    });

    // Reset risk audit
    setRiskAudit(null);
  };

  const canExecute = amount > 0 && marginRequired <= availableBalance;

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800/80 rounded-xl overflow-hidden shadow-lg p-3.5 sm:p-4 text-xs font-mono">
      {/* Side Tabs: Buy / Sell */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800 mb-3.5">
        <button
          onClick={() => setSide('BUY')}
          className={`py-2 text-xs font-bold rounded-md transition-all ${
            side === 'BUY'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          BUY / LONG
        </button>
        <button
          onClick={() => setSide('SELL')}
          className={`py-2 text-xs font-bold rounded-md transition-all ${
            side === 'SELL'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          SELL / SHORT
        </button>
      </div>

      {/* Order Type Selector */}
      <div className="flex items-center gap-1.5 mb-3 text-[11px]">
        {(['MARKET', 'LIMIT', 'STOP_MARKET'] as OrderType[]).map((ot) => (
          <button
            key={ot}
            onClick={() => setType(ot)}
            className={`flex-1 py-1 px-2 rounded border transition-colors ${
              type === ot
                ? 'bg-slate-800 border-slate-700 text-slate-100 font-bold'
                : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:text-slate-300'
            }`}
          >
            {ot.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1">
        {/* Limit Price Input if type is LIMIT or STOP_MARKET */}
        {type !== 'MARKET' && (
          <div>
            <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
              Order Price (USD)
            </label>
            <div className="relative">
              <input
                type="number"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono text-xs tabular-nums"
                step="any"
              />
              <span className="absolute right-3 top-2 text-[10px] text-slate-400">USD</span>
            </div>
          </div>
        )}

        {/* Order Size / Amount */}
        <div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider mb-1">
            <span>Size ({asset.symbol.split('/')[0]})</span>
            <span className="tabular-nums">
              Max: {((availableBalance * leverage) / effectivePrice).toFixed(3)}
            </span>
          </div>
          <div className="relative">
            <input
              type="number"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono text-xs tabular-nums"
              step="any"
              min="0.001"
            />
            <span className="absolute right-3 top-2 text-[10px] text-slate-400">
              {asset.symbol.split('/')[0]}
            </span>
          </div>

          {/* Quick Percent Buttons */}
          <div className="grid grid-cols-4 gap-1 mt-1.5">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                onClick={() => handleQuickPercent(pct)}
                className="py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-[10px] text-slate-400 hover:text-slate-200 transition-colors"
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>

        {/* Leverage Slider */}
        <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="text-slate-400">Leverage:</span>
            <span className="font-bold text-amber-400 font-mono tabular-nums">{leverage}x</span>
          </div>
          <input
            type="range"
            min="1"
            max={asset.leverageMax || 50}
            step="1"
            value={leverage}
            onChange={(e) => setLeverage(parseInt(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <div className="flex justify-between text-[9px] text-slate-400 mt-1">
            <span>1x Spot</span>
            <span>10x</span>
            <span>25x</span>
            <span>{asset.leverageMax || 50}x Max</span>
          </div>
        </div>

        {/* Take Profit & Stop Loss */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-emerald-400/90 uppercase tracking-wider block mb-1">
              Take Profit ($)
            </label>
            <input
              type="number"
              placeholder="e.g. 98000"
              value={takeProfitInput}
              onChange={(e) => setTakeProfitInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono text-xs tabular-nums"
              step="any"
            />
          </div>
          <div>
            <label className="text-[10px] text-rose-400/90 uppercase tracking-wider block mb-1">
              Stop Loss ($)
            </label>
            <input
              type="number"
              placeholder="e.g. 93000"
              value={stopLossInput}
              onChange={(e) => setStopLossInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rose-500 font-mono text-xs tabular-nums"
              step="any"
            />
          </div>
        </div>

        {/* Order Economics Summary */}
        <div className="flex flex-col gap-1.5 p-2.5 bg-slate-900/40 rounded-lg border border-slate-800 text-[11px]">
          <div className="flex justify-between">
            <span className="text-slate-400">Notional Exposure:</span>
            <span className="font-semibold text-slate-200 tabular-nums">${notionalValue.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Margin Required:</span>
            <span
              className={`font-semibold tabular-nums ${
                marginRequired > availableBalance ? 'text-rose-400' : 'text-slate-200'
              }`}
            >
              ${marginRequired.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Est. Liquidation:</span>
            <span className="font-semibold text-rose-400 tabular-nums">
              {liquidationPrice > 0 ? `$${liquidationPrice.toFixed(2)}` : 'N/A (1x)'}
            </span>
          </div>
        </div>

        {/* AI Pre-Trade Risk Audit Button & Display */}
        <div className="flex flex-col gap-2">
          <button
            onClick={runAIRiskAudit}
            disabled={isAuditingRisk || amount <= 0}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-medium transition-colors disabled:opacity-50"
          >
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>{isAuditingRisk ? 'Auditing Institutional Risk...' : 'Run AI Risk Guard Check'}</span>
          </button>

          {riskAudit && (
            <div
              className={`p-2.5 rounded-lg border text-[11px] ${
                riskAudit.riskLevel === 'CRITICAL'
                  ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                  : riskAudit.riskLevel === 'HIGH'
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                  : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold flex items-center gap-1">
                  {riskAudit.riskLevel === 'LOW' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  AI Risk Rating: {riskAudit.riskLevel} ({riskAudit.riskScore}/100)
                </span>
                <span className="text-[10px] text-slate-400">Max DD: {riskAudit.maxDrawdownPercent}</span>
              </div>
              <p className="text-[10px] text-slate-300 mb-1 leading-relaxed">{riskAudit.recommendation}</p>
              {riskAudit.warnings?.length > 0 && (
                <ul className="list-disc list-inside text-[10px] text-slate-400 space-y-0.5">
                  {riskAudit.warnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Execution Button */}
      <div className="pt-3 border-t border-slate-800/80 mt-auto">
        <button
          onClick={handlePlaceOrder}
          disabled={!canExecute}
          className={`w-full py-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-all shadow-lg ${
            side === 'BUY'
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
              : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40'
          } disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99]`}
        >
          {side === 'BUY' ? 'Execute Long Order' : 'Execute Short Order'}
        </button>
        {marginRequired > availableBalance && (
          <p className="text-center text-[10px] text-rose-400 mt-1">
            Insufficient available margin (${availableBalance.toFixed(2)})
          </p>
        )}
      </div>
    </div>
  );
};
