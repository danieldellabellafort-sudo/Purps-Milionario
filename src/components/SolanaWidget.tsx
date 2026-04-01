import { useEffect, useState } from "react";
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip, XAxis } from "recharts";
import { X, Maximize2 } from "lucide-react";

export default function SolanaWidget() {
  const [data, setData] = useState<any[]>([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [price, setPrice] = useState<number>(0);
  const [change, setChange] = useState<number>(0);

  useEffect(() => {
    const fetchSolana = async () => {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/coins/solana/market_chart?vs_currency=usd&days=1');
        const json = await res.json();
        const prices = json.prices.map((p: any) => ({ time: p[0], value: p[1] }));
        setData(prices);
        
        const currentPrice = prices[prices.length - 1].value;
        const oldPrice = prices[0].value;
        setPrice(currentPrice);
        setChange(((currentPrice - oldPrice) / oldPrice) * 100);
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
      
      <div className="w-14 h-6 opacity-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <YAxis domain={['auto', 'auto']} hide />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={isUp ? "#10b981" : "#ef4444"} 
              strokeWidth={1.5} 
              dot={false} 
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isUp ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
        {isUp ? '+' : ''}{change.toFixed(1)}%
      </span>
      <Maximize2 className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity absolute right-1 top-1" />
    </div>

    {isFullScreen && (
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

        <div className="flex-1 bg-card rounded-2xl border shadow p-2 sm:p-6 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis 
                dataKey="time" 
                hide 
              />
              <YAxis 
                domain={['auto', 'auto']} 
                width={80} 
                tickFormatter={(v) => `$${v.toFixed(2)}`} 
                className="text-xs font-mono font-bold" 
                tick={{ fill: 'currentColor', opacity: 0.6 }}
              />
              <Tooltip 
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Preço']}
                labelFormatter={(label) => new Date(label).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={isUp ? "#10b981" : "#ef4444"} 
                strokeWidth={3} 
                dot={false}
                activeDot={{ r: 6, fill: isUp ? "#10b981" : "#ef4444", stroke: "currentColor", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    )}
    </>
  );
}
