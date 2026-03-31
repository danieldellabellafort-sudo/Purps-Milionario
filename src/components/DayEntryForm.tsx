import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DayEntryFormProps {
  onAdd: (day: number, gains: number, losses: number, description: string, image?: string) => void;
  currentMonth: Date;
}

const DayEntryForm = ({ onAdd, currentMonth }: DayEntryFormProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [gains, setGains] = useState("");
  const [losses, setLosses] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<string | undefined>();
  const [open, setOpen] = useState(false);

  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;
    const g = parseFloat(gains) || 0;
    const l = parseFloat(losses) || 0;
    if (g === 0 && l === 0) return;
    onAdd(selectedDate.getDate(), g, l, description.trim(), image);
    setSelectedDate(undefined);
    setGains("");
    setLosses("");
    setDescription("");
    setImage(undefined);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setImage(undefined);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="space-y-1.5 w-full sm:w-auto">
        <Label className="text-xs text-muted-foreground">Data</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full sm:w-[200px] justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate
                ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR })
                : "Selecionar dia"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date);
                setOpen(false);
              }}
              disabled={(date) => date < monthStart || date > monthEnd}
              defaultMonth={currentMonth}
              locale={ptBR}
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Descrição / Motivo</Label>
        <Input
          type="text"
          placeholder="Ex: Aposta futebol, jogo de cartas..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="text-base h-12"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Ganho (R$)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            value={gains}
            onChange={(e) => setGains(e.target.value)}
            className="font-mono text-base h-12"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Perda (R$)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            value={losses}
            onChange={(e) => setLosses(e.target.value)}
            className="font-mono text-base h-12"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Imagem Opcional</Label>
        <Input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="text-base h-12 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
        />
        {image && <img src={image} alt="Preview" className="mt-2 h-16 w-16 object-cover rounded-md shadow" />}
      </div>
      <Button type="submit" className="w-full h-12 gap-2 text-base">
        <Plus className="h-5 w-5" />
        Adicionar
      </Button>
    </form>
  );
};

export default DayEntryForm;
