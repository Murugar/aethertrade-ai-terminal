import React, { useState } from 'react';
import { Asset, AssetCategory } from '../types/trading';
import { Search, TrendingUp, TrendingDown } from 'lucide-react';

interface WatchlistProps {
  assets: Asset[];
  selectedSymbol: string;
  onSelectAsset: (asset: Asset) => void;
}

export const Watchlist: React.FC<WatchlistProps> = ({
  assets,
  selectedSymbol,
  onSelectAsset,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredAssets = assets.filter((asset) => {
    const matchesCategory =
      selectedCategory === 'ALL' || asset.category === selectedCategory;
    const matchesSearch =
      asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800/80 rounded-xl overflow-hidden shadow-lg text-xs font-mono">
      {/* Category Filter Tabs */}
      <div className="p-2 border-b border-slate-800/80 bg-slate-900/60 flex flex-col gap-2">
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          {['ALL', 'CRYPTO', 'EQUITIES', 'COMMODITIES', 'FOREX'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-slate-800 text-slate-100 font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
          <input
            type="text"
            placeholder="Search markets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Asset List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-850">
        {filteredAssets.map((asset) => {
          const isSelected = asset.symbol === selectedSymbol;
          const isPositive = asset.change24h >= 0;

          return (
            <div
              key={asset.symbol}
              onClick={() => onSelectAsset(asset)}
              className={`flex items-center justify-between px-3 py-2.5 cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-emerald-500/10 border-l-2 border-emerald-500'
                  : 'hover:bg-slate-900/60'
              }`}
            >
              <div className="flex flex-col">
                <span className="font-bold text-slate-100 text-xs">{asset.symbol}</span>
                <span className="text-[10px] text-slate-500 font-sans truncate max-w-[100px]">
                  {asset.name}
                </span>
              </div>

              <div className="flex flex-col text-right">
                <span className="font-bold text-slate-100 tabular-nums">
                  ${asset.price.toFixed(asset.price > 500 ? 2 : 4)}
                </span>
                <span
                  className={`text-[10px] font-semibold tabular-nums flex items-center justify-end gap-0.5 ${
                    isPositive ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp className="w-2.5 h-2.5" />
                  ) : (
                    <TrendingDown className="w-2.5 h-2.5" />
                  )}
                  {isPositive ? '+' : ''}
                  {asset.change24h.toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
