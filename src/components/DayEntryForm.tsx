import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Plus, Camera, ImageIcon } from "lucide-react";
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
  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
    const today = new Date();
    return (today >= monthStart && today <= monthEnd) ? today : undefined;
  });
  const [gains, setGains] = useState("");
  const [losses, setLosses] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<string | undefined>();
  const [open, setOpen] = useState(false);

  const [currency, setCurrency] = useState<'BRL' | 'USD'>('BRL');
  const [usdRate, setUsdRate] = useState<number>(5.0); // Fallback

  useEffect(() => {
    fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL')
      .then(res => res.json())
      .then(data => {
        if (data?.USDBRL?.ask) {
          setUsdRate(parseFloat(data.USDBRL.ask));
        }
      })
      .catch(console.error);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;
    
    let g = parseFloat(gains.replace(",", ".")) || 0;
    let l = parseFloat(losses.replace(",", ".")) || 0;
    
    if (currency === 'USD') {
      g = g * usdRate;
      l = l * usdRate;
    }
    
    if (g === 0 && l === 0) return;
    onAdd(selectedDate.getDate(), g, l, description.trim(), image);
    
    const today = new Date();
    setSelectedDate((today >= monthStart && today <= monthEnd) ? today : undefined);
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
      <div className="flex items-center gap-2 mb-1 justify-between bg-muted/30 p-1.5 rounded-lg border">
        <Label className="text-xs text-muted-foreground font-semibold ml-1">Moeda de Lançamento:</Label>
        <div className="flex gap-1">
          <Button
            type="button"
            variant={currency === 'BRL' ? 'default' : 'outline'}
            size="sm"
            className="h-7 text-xs px-3 shadow-none"
            onClick={() => setCurrency('BRL')}
          >
            BRL
          </Button>
          <Button
            type="button"
            variant={currency === 'USD' ? 'default' : 'outline'}
            size="sm"
            className="h-7 text-xs px-3 shadow-none flex gap-1"
            onClick={() => setCurrency('USD')}
          >
            USD
            <span className="text-[9px] opacity-70 border-l pl-1 border-current ml-1">R$ {usdRate.toFixed(2)}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Ganho ({currency === 'USD' ? 'US$' : 'R$'})</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={gains}
            onChange={(e) => setGains(e.target.value)}
            className="font-mono text-base h-12"
          />
          {currency === 'USD' && gains && !isNaN(parseFloat(gains.replace(",", "."))) && (
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">≈ R$ {(parseFloat(gains.replace(",", ".")) * usdRate).toFixed(2)}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Perda ({currency === 'USD' ? 'US$' : 'R$'})</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={losses}
            onChange={(e) => setLosses(e.target.value)}
            className="font-mono text-base h-12"
          />
          {currency === 'USD' && losses && !isNaN(parseFloat(losses.replace(",", "."))) && (
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">≈ R$ {(parseFloat(losses.replace(",", ".")) * usdRate).toFixed(2)}</p>
          )}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Imagem Opcional</Label>
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1 gap-2 h-12 border-dashed bg-background/50 hover:bg-primary/10" onClick={() => document.getElementById('camera-input')?.click()}>
            <Camera className="w-5 h-5" />
            Tirar Foto
          </Button>
          <Button type="button" variant="outline" className="flex-1 gap-2 h-12 border-dashed bg-background/50 hover:bg-primary/10" onClick={() => document.getElementById('file-input')?.click()}>
            <ImageIcon className="w-5 h-5" />
            Galeria
          </Button>
        </div>
        <Input
          id="camera-input"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageChange}
          className="hidden"
        />
        <Input
          id="file-input"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
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
