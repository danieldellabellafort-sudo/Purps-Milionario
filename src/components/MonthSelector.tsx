import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MonthSelectorProps {
  currentMonth: Date;
  onPrev: () => void;
  onNext: () => void;
}

const MonthSelector = ({ currentMonth, onPrev, onNext }: MonthSelectorProps) => {
  const label = format(currentMonth, "MMMM yyyy", { locale: ptBR });

  return (
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="icon" onClick={onPrev} className="rounded-xl hover:bg-accent">
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <span className="text-xl font-bold capitalize min-w-[200px] text-center tracking-tight">
        {label}
      </span>
      <Button variant="ghost" size="icon" onClick={onNext} className="rounded-xl hover:bg-accent">
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default MonthSelector;
