import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip, XAxis, CartesianGrid, ReferenceLine } from "recharts";
import { X, Maximize2 } from "lucide-react";

export default function SolanaWidget() {
  const [data, setData] = useState<any[]>([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [price, setPrice] = useState<number>(0);
  const [change, setChange] = useState<number>(0);
  const [oldPrice, setOldPrice] = useState<number>(0);

  useEffect(() => {
    const fetchSolana = async () => {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/coins/solana/market_chart?vs_currency=usd&days=1');
        const json = await res.json();
        const prices = json.prices.map((p: any) => ({ time: p[0], value: p[1] }));
        setData(prices);
        
        const currentPrice = prices[prices.length - 1].value;
        const startPrice = prices[0].value;
        setPrice(currentPrice);
        setOldPrice(startPrice);
        setChange(((currentPrice - startPrice) / startPrice) * 100);
      } catch (e) {
        console.error("error fetching solana", e);
      }
    };
    fetchSolana();
    const int = setInterval(fetchSolana, 60000);
    return () => clearInterval(int);
  }, []);

  if (data.length === 0) return (
    <div className="flex items-center justify-center w-[140px] h-10 bg-card rounded-full border shadow-sm animate-pulse">
      <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
    </div>
  );

  const isUp = change >= 0;
  const color = isUp ? "#10b981" : "#ef4444";

  return (
    <>
    <div onClick={() => setIsFullScreen(true)} className="flex items-center gap-2 bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-full border shadow-sm h-10 hover:shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95 group relative">
      <div className="flex items-center gap-1.5 shrink-0">
        <img src="https://assets.coingecko.com/coins/images/4128/standard/solana.png" alt="SOL" className="w-5 h-5 rounded-full" />
        <div className="flex flex-col justify-center">
          <span className="text-[9px] font-bold text-muted-foreground uppercase leading-none mt-0.5 tracking-wider">Solana</span>
          <span className="text-xs font-mono font-bold leading-none">${price.toFixed(2)}</span>
        </div>
      </div>
      
      <div className="w-14 h-6 opacity-80 pointer-events-none">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorValueTiny" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <YAxis domain={['auto', 'auto']} hide />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              fillOpacity={1} 
              fill="url(#colorValueTiny)" 
              strokeWidth={1.5} 
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isUp ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
        {isUp ? '+' : ''}{change.toFixed(1)}%
      </span>
      <Maximize2 className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity absolute right-1 top-1" />
    </div>

    {isFullScreen && createPortal(
      <div className="fixed inset-0 z-[200] bg-background/95 backdrop-blur-md flex flex-col p-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center bg-card p-4 rounded-2xl shadow border mb-4">
          <div className="flex items-center gap-3">
            <img src="https://assets.coingecko.com/coins/images/4128/standard/solana.png" alt="SOL" className="w-10 h-10 rounded-full" />
            <div>
              <h2 className="font-bold text-xl uppercase tracking-widest text-muted-foreground leading-none">Solana</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-mono font-bold leading-none">${price.toFixed(2)}</span>
                <span className={`text-sm font-bold px-2 py-0.5 rounded-lg ${isUp ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                  {isUp ? '+' : ''}{change.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); setIsFullScreen(false); }} className="p-3 bg-muted hover:bg-muted/80 rounded-full transition-colors self-start cursor-pointer">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 bg-card rounded-2xl border shadow p-2 sm:p-6 min-h-0 flex flex-col gap-2 relative">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.2} />
              <XAxis 
                dataKey="time" 
                tickFormatter={(time) => new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                minTickGap={50}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                domain={['auto', 'auto']} 
                width={80} 
                orientation="right"
                tickFormatter={(v) => `$${v.toFixed(2)}`} 
                className="text-xs font-mono font-bold" 
                tick={{ fill: 'currentColor', opacity: 0.6 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Preço']}
                labelFormatter={(label) => new Date(label).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <ReferenceLine y={oldPrice} stroke="currentColor" strokeDasharray="3 3" opacity={0.3} />
              <Area 
                type="linear" 
                dataKey="value" 
                stroke={color} 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#colorValue)" 
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}
