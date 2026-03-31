import { TrendingUp, TrendingDown, Wallet, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DayEntry } from "@/components/DayTable";

interface MonthlySummaryProps {
  entries: DayEntry[];
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const MonthlySummary = ({ entries }: MonthlySummaryProps) => {
  const totalGains = entries.reduce((s, e) => s + e.gains, 0);
  const totalLosses = entries.reduce((s, e) => s + e.losses, 0);
  const totalProfit = totalGains - totalLosses;

  const cards = [
    {
      label: "Ganhos",
      value: fmt(totalGains),
      icon: TrendingUp,
      bg: "bg-profit-bg",
      iconBg: "bg-profit/10",
      iconColor: "text-profit",
      textColor: "text-profit-foreground",
    },
    {
      label: "Perdas",
      value: fmt(totalLosses),
      icon: TrendingDown,
      bg: "bg-loss-bg",
      iconBg: "bg-loss/10",
      iconColor: "text-loss",
      textColor: "text-loss-foreground",
    },
    {
      label: "Lucro Mensal",
      value: fmt(totalProfit),
      icon: Wallet,
      bg: totalProfit >= 0 ? "bg-profit-bg" : "bg-loss-bg",
      iconBg: totalProfit >= 0 ? "bg-profit/10" : "bg-loss/10",
      iconColor: totalProfit >= 0 ? "text-profit" : "text-loss",
      textColor: totalProfit >= 0 ? "text-profit-foreground" : "text-loss-foreground",
    },
    {
      label: "Dias Registrados",
      value: String(entries.length),
      icon: CalendarDays,
      bg: "bg-accent",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      textColor: "text-accent-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className={cn(
            "rounded-2xl p-4 flex flex-col gap-3 animate-fade-in",
            c.bg
          )}
        >
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", c.iconBg)}>
            <c.icon className={cn("h-5 w-5", c.iconColor)} />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">{c.label}</p>
            <p className={cn("text-xl font-bold font-mono mt-0.5", c.textColor)}>{c.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MonthlySummary;
