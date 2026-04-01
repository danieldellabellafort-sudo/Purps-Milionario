import { useEffect, useState } from "react";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";

export default function SolanaWidget() {
  const [data, setData] = useState<any[]>([]);
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
    <div className="flex items-center gap-2 bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-full border shadow-sm h-10 hover:shadow-md transition-shadow">
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
    </div>
  );
}
