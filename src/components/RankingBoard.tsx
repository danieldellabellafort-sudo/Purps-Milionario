import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";

interface RankingProps {
  friendTotals: { name: string; profit: number }[];
  profilePics: Record<string, string>;
}

const RankingBoard = ({ friendTotals, profilePics }: RankingProps) => {
  // Ordena descendente pelo lucro
  const sorted = [...friendTotals].sort((a, b) => b.profit - a.profit);
  
  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const getMedalColor = (idx: number) => {
    if (idx === 0) return "text-yellow-400 drop-shadow-md"; // Gold
    if (idx === 1) return "text-gray-400 drop-shadow-md"; // Silver
    if (idx === 2) return "text-amber-600 drop-shadow-md"; // Bronze
    return "text-muted-foreground";
  };

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col items-center w-full">
      <div className="flex items-center gap-2 mb-8 w-full justify-center">
        <Trophy className="w-6 h-6 text-yellow-500" />
        <h2 className="font-bold text-lg">Pódio de Lucros</h2>
      </div>

      {/* Podium Top 3 */}
      <div className="flex items-end justify-center gap-2 mb-8 h-48 w-full border-b pb-4">
        {[1, 0, 2].map((visualIndex) => {
          const ft = sorted[visualIndex];
          if (!ft) return null;

          const heightClass = visualIndex === 0 ? 'h-32' : visualIndex === 1 ? 'h-24' : 'h-16';
          const bgClass = visualIndex === 0 ? 'bg-yellow-500/20 border-yellow-500/50' : 
                          visualIndex === 1 ? 'bg-gray-400/20 border-gray-400/50' : 
                          'bg-amber-600/20 border-amber-600/50';

          return (
            <div key={ft.name} className="flex flex-col items-center flex-1 min-w-0">
              <span className={cn("font-bold text-sm mb-1", getMedalColor(visualIndex))}>
                {visualIndex + 1}º
              </span>
              <img 
                src={profilePics[ft.name] || "/favicon.png"} 
                alt={ft.name}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover mb-2 border-2 shadow-sm border-background"
              />
              <div className={cn("w-full rounded-t-lg border flex flex-col items-center justify-start pt-2 px-1 relative overflow-hidden", heightClass, bgClass)}>
                <span className="text-xs font-semibold truncate w-full text-center">{ft.name}</span>
                <span className={cn("text-[9px] sm:text-[11px] font-mono mt-1 w-full text-center truncate font-medium", ft.profit >= 0 ? "text-profit" : "text-loss")}>
                  {fmt(ft.profit)}
                </span>
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-background to-transparent pointer-events-none" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabela do Resto (4º em diante) */}
      <div className="w-full flex flex-col gap-2">
        {sorted.slice(3).map((ft, idx) => (
          <div key={ft.name} className="flex items-center justify-between p-3 rounded-xl bg-card border shadow-sm transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground font-bold text-sm w-4">{idx + 4}º</span>
              <img src={profilePics[ft.name] || "/favicon.png"} className="w-8 h-8 rounded-full object-cover border" />
              <span className="font-medium text-sm">{ft.name}</span>
            </div>
            <span className={cn("font-mono text-sm font-semibold", ft.profit >= 0 ? "text-profit" : "text-loss")}>
              {fmt(ft.profit)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RankingBoard;
