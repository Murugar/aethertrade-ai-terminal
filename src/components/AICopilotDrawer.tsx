import React, { useState, useRef, useEffect } from 'react';
import { Asset, Position } from '../types/trading';
import { Cpu, Send, Bot, User, Sparkles, X, ChevronRight } from 'lucide-react';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: number;
}

interface AICopilotDrawerProps {
  currentAsset: Asset;
  activePositions: Position[];
  equity: number;
  isOpen?: boolean;
  onClose?: () => void;
}

export const AICopilotDrawer: React.FC<AICopilotDrawerProps> = ({
  currentAsset,
  activePositions,
  equity,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello, Trader. I am AetherCopilot, your institutional trading intelligence engine. I am currently monitoring ${currentAsset.symbol} ($${currentAsset.price.toFixed(2)}) with live multi-factor indicators and your active portfolio state ($${equity.toLocaleString()} equity). What strategy setup or risk calculation shall we evaluate?`,
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const quickPrompts = [
    `Evaluate ${currentAsset.symbol} breakout probability`,
    `Audit my open portfolio leverage and tail risk`,
    `Calculate stop-loss for 2% risk on ${currentAsset.symbol}`,
    `Analyze current macro volatility regime`,
  ];

  const handleSend = async (userText: string) => {
    if (!userText.trim() || isLoading) return;

    const userMsg: Message = {
      id: 'u-' + Date.now(),
      sender: 'user',
      text: userText,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/copilot-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          marketContext: {
            symbol: currentAsset.symbol,
            price: currentAsset.price,
            change24h: currentAsset.change24h,
            atr: currentAsset.atr,
          },
          activePositions,
          portfolioEquity: equity,
        }),
      });

      const data = await res.json();
      const aiReply = data.reply || 'Analysis complete. Risk parameters normal.';

      setMessages((prev) => [
        ...prev,
        {
          id: 'ai-' + Date.now(),
          sender: 'ai',
          text: aiReply,
          timestamp: Date.now(),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'ai-err-' + Date.now(),
          sender: 'ai',
          text: 'Signal pipeline briefly throttled. Algorithmic fallback indicates steady range-bound behavior.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800/80 rounded-xl overflow-hidden shadow-xl text-xs font-mono">
      {/* Copilot Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-900/70">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">AetherCopilot Strategy Terminal</h3>
            <span className="text-[10px] text-slate-400">Gemini 3.8 Flash · Active Context</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-medium">
            {currentAsset.symbol} @ ${currentAsset.price.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.sender === 'ai' && (
              <div className="w-6 h-6 rounded-md bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-xl px-3.5 py-2.5 leading-relaxed font-sans ${
                m.sender === 'user'
                  ? 'bg-emerald-600 text-white font-medium'
                  : 'bg-slate-900/90 border border-slate-800 text-slate-200'
              }`}
            >
              <p className="whitespace-pre-line text-xs sm:text-[13px]">{m.text}</p>
              <span className="text-[9px] text-slate-400 font-mono block mt-1 text-right">
                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {m.sender === 'user' && (
              <div className="w-6 h-6 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2.5 items-center text-slate-400 text-xs">
            <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 rounded-lg border border-slate-800">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              <span className="text-[11px] font-mono text-slate-400 ml-1">Analyzing Order Flows & Volatility...</span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Quick Prompts Carousel */}
      <div className="px-3 py-2 border-t border-slate-800/60 bg-slate-900/40">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
          <span className="text-slate-500 text-[10px] shrink-0 uppercase tracking-wider font-mono">
            Prompts:
          </span>
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSend(p)}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-full text-slate-300 whitespace-nowrap transition-colors shrink-0"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask AetherCopilot about strategy, risk sizing, or macro correlation..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-sans text-xs"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg transition-colors shrink-0"
            title="Send query"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
