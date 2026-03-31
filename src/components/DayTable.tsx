import { Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DayEntry {
  day: number;
  gains: number;
  losses: number;
  description?: string;
  image?: string; // Base64 da imagem
  timestamp?: number;
}

interface DayTableProps {
  entries: DayEntry[];
  onRemove?: (day: number) => void;
  onEdit?: (entry: DayEntry) => void;
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const DayTable = ({ entries, onRemove, onEdit }: DayTableProps) => {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p className="text-sm">Nenhum registro ainda.</p>
        <p className="text-xs mt-1">Selecione um dia no calendário e adicione seus valores.</p>
      </div>
    );
  }

  const sorted = [...entries].sort((a, b) => a.day - b.day);

  const hasActions = onRemove !== undefined || onEdit !== undefined;

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/40">
            <th className="w-16 px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider text-left">Dia</th>
            <th className="px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider text-left">Descrição / Imagem</th>
            <th className="px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider text-right">Ganho</th>
            <th className="px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider text-right">Perda</th>
            <th className="px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider text-right">Lucro</th>
            {hasActions && <th className="w-24 px-4 py-3"></th>}
          </tr>
        </thead>
        <tbody>
          {sorted.map((entry, i) => {
            const profit = entry.gains - entry.losses;
            return (
              <tr
                key={entry.day}
                className="border-t hover:bg-muted/20 transition-colors"
              >
                <td className="px-4 py-3 font-mono font-semibold">
                  {String(entry.day).padStart(2, "0")}
                </td>
                <td className="px-4 py-3 text-muted-foreground max-w-[200px]">
                  <div className="flex items-center gap-3">
                    <span className="truncate">{entry.description || "—"}</span>
                    {entry.image && (
                      <a href={entry.image} target="_blank" rel="noopener noreferrer" className="shrink-0 group">
                        <img src={entry.image} alt="Nota" className="w-8 h-8 object-cover rounded shadow-sm group-hover:scale-110 transition-transform cursor-pointer" />
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-mono text-profit-foreground">
                  +{fmt(entry.gains)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-loss-foreground">
                  -{fmt(entry.losses)}
                </td>
                <td
                  className={cn(
                    "px-4 py-3 text-right font-mono font-bold",
                    profit >= 0 ? "text-profit" : "text-loss"
                  )}
                >
                  {fmt(profit)}
                </td>
                {hasActions && (
                  <td className="w-24 px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(entry)}
                          className="p-2 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Editar registros"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      {onRemove && (
                        <button
                          onClick={() => onRemove(entry.day)}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          title="Remover dia"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DayTable;
