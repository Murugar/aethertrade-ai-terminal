import React from 'react';
import { BarChart3, TrendingUp, Cpu, PieChart, ShieldCheck } from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: string;
  onSelectTab: (tab: any) => void;
  openPositionsCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  openPositionsCount,
}) => {
  const tabs = [
    { id: 'terminal', label: 'Terminal', icon: BarChart3 },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
    { id: 'copilot', label: 'Copilot', icon: Cpu },
    { id: 'risk', label: 'Security', icon: ShieldCheck },
    { id: 'history', label: 'Logs', icon: TrendingUp },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 md:hidden">
      <div className="grid grid-cols-5 items-center h-16 max-w-lg mx-auto px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className="min-h-[44px] min-w-[44px] flex flex-col items-center justify-center relative transition-colors"
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'text-emerald-400 scale-110' : 'text-slate-400 hover:text-slate-200'
                  }`}
                />
                {tab.id === 'terminal' && openPositionsCount > 0 && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 bg-emerald-500 text-[9px] font-bold text-slate-950 rounded-full flex items-center justify-center font-mono">
                    {openPositionsCount}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] font-medium tracking-tight mt-1 transition-colors ${
                  isActive ? 'text-emerald-400 font-bold' : 'text-slate-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
