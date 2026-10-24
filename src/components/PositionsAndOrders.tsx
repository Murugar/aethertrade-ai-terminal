import React, { useState } from 'react';
import { Position, Order, TradeFill } from '../types/trading';
import { X, CheckCircle2, Clock, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface PositionsAndOrdersProps {
  positions: Position[];
  orders: Order[];
  tradeHistory: TradeFill[];
  onClosePosition: (positionId: string) => void;
  onCancelOrder: (orderId: string) => void;
  onCloseAllPositions: () => void;
}

export const PositionsAndOrders: React.FC<PositionsAndOrdersProps> = ({
  positions,
  orders,
  tradeHistory,
  onClosePosition,
  onCancelOrder,
  onCloseAllPositions,
}) => {
  const [activeTab, setActiveTab] = useState<'positions' | 'orders' | 'history'>('positions');

  const openOrders = orders.filter((o) => o.status === 'OPEN');

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800/80 rounded-xl overflow-hidden shadow-lg text-xs font-mono">
      {/* Top Tabs */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-800/80 bg-slate-900/60">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('positions')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap font-medium ${
              activeTab === 'positions'
                ? 'bg-slate-800 text-slate-100 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Active Positions ({positions.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap font-medium ${
              activeTab === 'orders'
                ? 'bg-slate-800 text-slate-100 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Open Orders ({openOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap font-medium ${
              activeTab === 'history'
                ? 'bg-slate-800 text-slate-100 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Trade Logs ({tradeHistory.length})
          </button>
        </div>

        {activeTab === 'positions' && positions.length > 0 && (
          <button
            onClick={onCloseAllPositions}
            className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded text-[11px] transition-colors"
          >
            Close All ({positions.length})
          </button>
        )}
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        {/* TAB 1: ACTIVE POSITIONS */}
        {activeTab === 'positions' && (
          positions.length > 0 ? (
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-800/60 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-950/40">
                  <th className="px-3.5 py-2">Symbol / Side</th>
                  <th className="px-3 py-2 text-right">Size</th>
                  <th className="px-3 py-2 text-right">Entry Price</th>
                  <th className="px-3 py-2 text-right">Mark Price</th>
                  <th className="px-3 py-2 text-right">Liquidation</th>
                  <th className="px-3 py-2 text-right">Margin</th>
                  <th className="px-3 py-2 text-right">Unrealized PnL</th>
                  <th className="px-3 py-2 text-right">TP / SL</th>
                  <th className="px-3.5 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {positions.map((pos) => {
                  const isProfit = pos.unrealizedPnl >= 0;
                  return (
                    <tr key={pos.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-3.5 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-100">{pos.symbol}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              pos.side === 'LONG'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {pos.side} {pos.leverage}x
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-slate-200 tabular-nums">
                        {pos.amount.toFixed(3)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-slate-300 tabular-nums">
                        ${pos.entryPrice.toFixed(pos.entryPrice > 500 ? 2 : 4)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-slate-100 font-semibold tabular-nums">
                        ${pos.currentPrice.toFixed(pos.currentPrice > 500 ? 2 : 4)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-rose-400 tabular-nums">
                        {pos.liquidationPrice > 0 ? `$${pos.liquidationPrice.toFixed(2)}` : 'None'}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-slate-300 tabular-nums">
                        ${pos.margin.toFixed(2)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold tabular-nums">
                        <span className={isProfit ? 'text-emerald-400' : 'text-rose-400'}>
                          {isProfit ? '+' : ''}${pos.unrealizedPnl.toFixed(2)} ({isProfit ? '+' : ''}
                          {pos.unrealizedPnlPercent.toFixed(2)}%)
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right text-[11px] text-slate-400 tabular-nums">
                        <div>TP: {pos.takeProfit ? `$${pos.takeProfit.toFixed(1)}` : '—'}</div>
                        <div>SL: {pos.stopLoss ? `$${pos.stopLoss.toFixed(1)}` : '—'}</div>
                      </td>
                      <td className="px-3.5 py-2.5 text-right">
                        <button
                          onClick={() => onClosePosition(pos.id)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] transition-colors"
                        >
                          Market Close
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-slate-500">
              <Clock className="w-6 h-6 mb-2 opacity-50" />
              <p className="text-xs">No active positions open.</p>
              <span className="text-[10px] text-slate-600 mt-0.5">
                Use the Order Ticket or apply an AI signal to enter a trade.
              </span>
            </div>
          )
        )}

        {/* TAB 2: OPEN ORDERS */}
        {activeTab === 'orders' && (
          openOrders.length > 0 ? (
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-800/60 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-950/40">
                  <th className="px-3.5 py-2">Symbol</th>
                  <th className="px-3 py-2">Type / Side</th>
                  <th className="px-3 py-2 text-right">Order Price</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                  <th className="px-3 py-2 text-right">Leverage</th>
                  <th className="px-3 py-2 text-right">Created</th>
                  <th className="px-3.5 py-2 text-right">Cancel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {openOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-3.5 py-2.5 font-bold text-slate-100">{ord.symbol}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          ord.side === 'BUY'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-rose-500/15 text-rose-400'
                        }`}
                      >
                        {ord.type} {ord.side}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-slate-200 tabular-nums">
                      ${ord.price.toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-slate-300 tabular-nums">
                      {ord.amount.toFixed(3)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-slate-400 tabular-nums">
                      {ord.leverage}x
                    </td>
                    <td className="px-3 py-2.5 text-right text-slate-500 tabular-nums text-[11px]">
                      {new Date(ord.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="px-3.5 py-2.5 text-right">
                      <button
                        onClick={() => onCancelOrder(ord.id)}
                        className="px-2 py-0.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded transition-colors text-[11px]"
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-slate-500">
              <p className="text-xs">No pending limit orders.</p>
            </div>
          )
        )}

        {/* TAB 3: TRADE HISTORY */}
        {activeTab === 'history' && (
          tradeHistory.length > 0 ? (
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-800/60 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-950/40">
                  <th className="px-3.5 py-2">Time</th>
                  <th className="px-3 py-2">Symbol</th>
                  <th className="px-3 py-2">Side</th>
                  <th className="px-3 py-2 text-right">Executed Price</th>
                  <th className="px-3 py-2 text-right">Size</th>
                  <th className="px-3 py-2 text-right">Realized PnL</th>
                  <th className="px-3.5 py-2 text-right">Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {tradeHistory.map((th) => {
                  const hasPnl = th.realizedPnl !== undefined;
                  const isProfit = (th.realizedPnl || 0) >= 0;
                  return (
                    <tr key={th.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-3.5 py-2.5 text-slate-500 text-[11px] tabular-nums">
                        {new Date(th.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-3 py-2.5 font-bold text-slate-200">{th.symbol}</td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            th.side === 'BUY'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-rose-500/15 text-rose-400'
                          }`}
                        >
                          {th.side}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-slate-300 tabular-nums">
                        ${th.price.toFixed(2)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-slate-400 tabular-nums">
                        {th.amount.toFixed(3)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold tabular-nums">
                        {hasPnl ? (
                          <span className={isProfit ? 'text-emerald-400' : 'text-rose-400'}>
                            {isProfit ? '+' : ''}${th.realizedPnl?.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-mono text-slate-500 tabular-nums">
                        ${th.fee.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-slate-500">
              <p className="text-xs">No trade history yet.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};
