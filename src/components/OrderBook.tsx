import React, { useState } from 'react';
import { OrderBook as OrderBookType, RecentTrade } from '../types/trading';

interface OrderBookProps {
  orderBook: OrderBookType;
  recentTrades: RecentTrade[];
  currentPrice: number;
  symbol: string;
  onPriceClick?: (price: number) => void;
}

export const OrderBook: React.FC<OrderBookProps> = ({
  orderBook,
  recentTrades,
  currentPrice,
  symbol,
  onPriceClick,
}) => {
  const [activeTab, setActiveTab] = useState<'book' | 'trades'>('book');

  // Max total depth calculation for visual bars
  const maxBidTotal = orderBook.bids[orderBook.bids.length - 1]?.total || 1;
  const maxAskTotal = orderBook.asks[orderBook.asks.length - 1]?.total || 1;
  const maxDepth = Math.max(maxBidTotal, maxAskTotal);

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800/80 rounded-xl overflow-hidden shadow-lg">
      {/* Tab Switcher Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/80 bg-slate-900/60">
        <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('book')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              activeTab === 'book'
                ? 'bg-slate-800 text-slate-100 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Order Book
          </button>
          <button
            onClick={() => setActiveTab('trades')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              activeTab === 'trades'
                ? 'bg-slate-800 text-slate-100 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Recent Trades
          </button>
        </div>

        <span className="text-[11px] font-mono text-slate-400 tabular-nums">
          Spread: ${orderBook.spread.toFixed(2)} ({orderBook.spreadPercent.toFixed(3)}%)
        </span>
      </div>

      {activeTab === 'book' ? (
        <div className="flex flex-col flex-1 text-xs font-mono select-none overflow-hidden">
          {/* Column Titles */}
          <div className="grid grid-cols-3 px-3 py-1.5 text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-800/40">
            <span>Price (USD)</span>
            <span className="text-right">Size</span>
            <span className="text-right">Total Depth</span>
          </div>

          {/* Asks (Sells) - Reversed so highest price is at top */}
          <div className="flex flex-col-reverse justify-end flex-1 overflow-hidden px-1 py-1">
            {orderBook.asks.slice(0, 8).map((ask, i) => {
              const depthPercent = Math.min(100, (ask.total / maxDepth) * 100);
              return (
                <div
                  key={`ask-${i}`}
                  onClick={() => onPriceClick?.(ask.price)}
                  className="relative grid grid-cols-3 px-2 py-0.5 hover:bg-rose-500/10 cursor-pointer group rounded"
                >
                  {/* Depth Bar Background */}
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-rose-500/15 pointer-events-none rounded transition-all duration-300"
                    style={{ width: `${depthPercent}%` }}
                  />
                  <span className="text-rose-400 group-hover:text-rose-300 font-semibold z-10 tabular-nums">
                    {ask.price.toFixed(ask.price > 500 ? 2 : 4)}
                  </span>
                  <span className="text-right text-slate-300 z-10 tabular-nums">{ask.amount.toFixed(3)}</span>
                  <span className="text-right text-slate-400 z-10 tabular-nums">{ask.total.toFixed(3)}</span>
                </div>
              );
            })}
          </div>

          {/* Mid Market Spread Bar */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-y border-slate-800 my-0.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-100 tabular-nums">
                ${currentPrice.toFixed(currentPrice > 500 ? 2 : 4)}
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">MARK</span>
            </div>
            <span className="text-[10px] text-slate-400">Level 2 Aggregated</span>
          </div>

          {/* Bids (Buys) */}
          <div className="flex flex-col flex-1 overflow-hidden px-1 py-1">
            {orderBook.bids.slice(0, 8).map((bid, i) => {
              const depthPercent = Math.min(100, (bid.total / maxDepth) * 100);
              return (
                <div
                  key={`bid-${i}`}
                  onClick={() => onPriceClick?.(bid.price)}
                  className="relative grid grid-cols-3 px-2 py-0.5 hover:bg-emerald-500/10 cursor-pointer group rounded"
                >
                  {/* Depth Bar Background */}
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-emerald-500/15 pointer-events-none rounded transition-all duration-300"
                    style={{ width: `${depthPercent}%` }}
                  />
                  <span className="text-emerald-400 group-hover:text-emerald-300 font-semibold z-10 tabular-nums">
                    {bid.price.toFixed(bid.price > 500 ? 2 : 4)}
                  </span>
                  <span className="text-right text-slate-300 z-10 tabular-nums">{bid.amount.toFixed(3)}</span>
                  <span className="text-right text-slate-400 z-10 tabular-nums">{bid.total.toFixed(3)}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Recent Trades Feed */
        <div className="flex flex-col flex-1 text-xs font-mono overflow-y-auto px-2 py-1">
          <div className="grid grid-cols-3 px-2 py-1.5 text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-800/40">
            <span>Price (USD)</span>
            <span className="text-right">Size</span>
            <span className="text-right">Time</span>
          </div>

          <div className="flex flex-col divide-y divide-slate-900/60">
            {recentTrades.map((t) => (
              <div key={t.id} className="grid grid-cols-3 px-2 py-1.5 hover:bg-slate-900/40 rounded transition-colors">
                <span
                  className={`font-semibold tabular-nums ${
                    t.side === 'BUY' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {t.price.toFixed(t.price > 500 ? 2 : 4)}
                </span>
                <span className="text-right text-slate-300 tabular-nums">{t.amount.toFixed(3)}</span>
                <span className="text-right text-slate-400 tabular-nums">
                  {new Date(t.time).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
