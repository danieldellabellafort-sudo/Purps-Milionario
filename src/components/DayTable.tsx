import { useState, useEffect } from "react";
import { Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getEntryImage } from "@/lib/imageStorage";

const SmartImage = ({ src, alt, className, onClick }: { src: string, alt?: string, className?: string, onClick?: () => void }) => {
  const [actualSrc, setActualSrc] = useState<string | null>(null);

  useEffect(() => {
    if (src.startsWith('data:image/')) {
      setActualSrc(src);
    } else if (src.startsWith('img_')) {
      getEntryImage(src).then(base64 => {
        if (base64) setActualSrc(base64);
      });
    } else {
      setActualSrc(src);
    }
  }, [src]);

  if (!actualSrc) return <div className={cn("bg-muted animate-pulse pointer-events-none", className)} />;

  return <img src={actualSrc} alt={alt} className={className} onClick={onClick} />;
};

export interface DayEntry {
  day: number;
  gains: number;
  losses: number;
  description?: string;
  image?: string; // Base64 da imagem
  images?: string[]; // Suporte a múltiplas imagens
  timestamp?: number;
}

interface DayTableProps {
  entries: DayEntry[];
  onRemove?: (entry: DayEntry) => void;
  onEdit?: (entry: DayEntry) => void;
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const DayTable = ({ entries, onRemove, onEdit }: DayTableProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
                key={entry.timestamp || `${entry.day}-${i}`}
                className="border-t hover:bg-muted/20 transition-colors"
              >
                <td className="px-4 py-3 font-mono font-semibold">
                  {String(entry.day).padStart(2, "0")}
                </td>
                <td className="px-4 py-3 text-muted-foreground max-w-[200px]">
                  <div className="flex items-center gap-3">
                    <span className="truncate">{entry.description || "—"}</span>
                    {!!(entry.images?.length || entry.image) && (
                      <div className="flex items-center gap-1">
                        {(entry.images || (entry.image ? [entry.image] : [])).map((img, idx) => (
                          <button key={idx} type="button" onClick={() => setSelectedImage(img)} className="shrink-0 group focus:outline-none">
                            <SmartImage src={img} alt={`Nota ${idx + 1}`} className="w-8 h-8 object-cover rounded shadow-sm group-hover:scale-110 transition-transform cursor-pointer" />
                          </button>
                        ))}
                      </div>
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
                          onClick={() => onRemove(entry)}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          title="Remover registro"
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

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 cursor-pointer animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <SmartImage 
            src={selectedImage} 
            alt="Imagem ampliada" 
            className="max-w-full max-h-full object-contain rounded-md" 
          />
        </div>
      )}
    </div>
  );
};

export default DayTable;
