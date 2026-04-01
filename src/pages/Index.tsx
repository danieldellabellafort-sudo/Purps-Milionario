import { useState, useCallback, useEffect } from "react";
import { addMonths, subMonths, format } from "date-fns";
import { db, storage } from "@/lib/firebase";
import { doc, setDoc, onSnapshot, collection, query } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import MonthSelector from "@/components/MonthSelector";
import DayEntryForm from "@/components/DayEntryForm";
import DayTable, { type DayEntry } from "@/components/DayTable";
import MonthlySummary from "@/components/MonthlySummary";
import ProfitPieChart from "@/components/ProfitPieChart";
import RankingBoard from "@/components/RankingBoard";
import ImageCropper from "@/components/ImageCropper";
import PnlDownloadModal from "@/components/PnlDownloadModal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth, type Friend, ALL_FRIENDS } from "@/components/AuthProvider";
import { LogOut, Camera, ChevronLeft, ChevronRight, X, Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FriendMonthData = Record<string, Record<string, DayEntry[]>>;
// structure: { "friendName": { "2026-04": [entries] } }

const monthKey = (d: Date) => format(d, "yyyy-MM");

const STORAGE_KEY = "earnings-tracker-v2";

const formatTimeAgo = (timestamp: number) => {
  const diffMinutes = Math.round((Date.now() - timestamp) / 60000);
  if (diffMinutes < 60) {
    return `${diffMinutes} minuto${diffMinutes !== 1 ? 's' : ''} atrás`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  const remainingMinutes = diffMinutes % 60;
  
  if (diffHours < 24) {
    let str = `${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
    if (remainingMinutes > 0) {
      str += ` e ${remainingMinutes} minuto${remainingMinutes !== 1 ? 's' : ''}`;
    }
    return `${str} atrás`;
  }
  
  const diffDays = Math.floor(diffHours / 24);
  const remainingHours = diffHours % 24;
  
  let str = `${diffDays} dia${diffDays !== 1 ? 's' : ''}`;
  if (remainingHours > 0) {
    str += ` e ${remainingHours} hora${remainingHours !== 1 ? 's' : ''}`;
  }
  return `${str} atrás`;
};

const Index = () => {
  const { user, logout, friends } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 3, 1));
  const [selectedFriend, setSelectedFriend] = useState<Friend>(user || "Daniel");
  const [chartFriend, setChartFriend] = useState<Friend>(user || "Daniel");
  
  const [data, setData] = useState<FriendMonthData>({});
  const [profilePics, setProfilePics] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  const [editingEntry, setEditingEntry] = useState<DayEntry | null>(null);
  const [editGains, setEditGains] = useState("");
  const [editLosses, setEditLosses] = useState("");
  
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isPnlModalOpen, setIsPnlModalOpen] = useState(false);

  // Escuta o Banco de Dados em Tempo Real (Firestore)
  useEffect(() => {
    // Timer de segurança: Se o banco demorar mais de 3.5s (vazio), destrava a tela
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3500);

    const unsubData = onSnapshot(doc(db, "app", "global_data_v2"), (snapshot) => {
      if (snapshot.exists()) {
        setData(snapshot.data() as FriendMonthData);
        clearTimeout(timer); // Recebeu dados, para o timer
        setIsLoading(false); 
      } else {
        // Banco vazio, libera a entrada
        setIsLoading(false);
      }
    });

    const unsubPics = onSnapshot(doc(db, "app", "profile_pics_v2"), (snapshot) => {
      if (snapshot.exists()) {
        setProfilePics(snapshot.data() as Record<string, string>);
      }
    });

    return () => { 
      unsubData(); 
      unsubPics(); 
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    setChartFriend(selectedFriend);
  }, [selectedFriend]);

  const handleNextFriend = () => {
    const currentIndex = ALL_FRIENDS.indexOf(chartFriend);
    const nextIndex = (currentIndex + 1) % ALL_FRIENDS.length;
    setChartFriend(ALL_FRIENDS[nextIndex]);
  };

  const handlePrevFriend = () => {
    const currentIndex = ALL_FRIENDS.indexOf(chartFriend);
    const prevIndex = (currentIndex - 1 + ALL_FRIENDS.length) % ALL_FRIENDS.length;
    setChartFriend(ALL_FRIENDS[prevIndex]);
  };

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropImageSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    // reset input so the same file can be selected again
    e.target.value = '';
  };

  const handleApplyCrop = async (croppedBase64: string) => {
    if (!user) return;
    try {
      toast.info("Fazendo upload da sua foto...");
      
      // Salva no Firestore (para consulta rápida)
      const nextPics = { ...profilePics, [user]: croppedBase64 };
      await setDoc(doc(db, "app", "profile_pics_v2"), nextPics);

      // Também salva no Cloud Storage por garantia (opcional, mas pro futuro)
      const storageRef = ref(storage, `profiles/${user}.jpg`);
      await uploadString(storageRef, croppedBase64, 'data_url');

      toast.success("Foto de perfil salva na nuvem!");
      setCropImageSrc(null);
    } catch (e) {
      toast.error("Erro ao salvar foto no servidor.");
    }
  };

  const isOwner = selectedFriend === user;

  const save = async (next: FriendMonthData) => {
    try {
      // O Firestore recusa dados contendo 'undefined'.
      // Ao converter para JSON e voltar, as chaves 'undefined' (como 'image' vazia) são ignoradas e removidas da árvore corretamente.
      const cleanData = JSON.parse(JSON.stringify(next));
      await setDoc(doc(db, "app", "global_data_v2"), cleanData);
    } catch (e: any) {
      console.error("ERRO FIREBASE:", e);
      toast.error(`Erro ao sincronizar: ${e.message || "desconhecido"}`);
    }
  };

  const key = monthKey(currentMonth);
  const friendData = data[selectedFriend] || {};
  const entries = friendData[key] || [];

  const handleAdd = useCallback(
    (day: number, gains: number, losses: number, description: string, image?: string) => {
      // Only the owner can add
      if (selectedFriend !== user) return;
      
      const newEntry: DayEntry = { day, gains, losses, description, image, timestamp: Date.now() };
      const updated = [...entries, newEntry];
      toast.success(`Registro adicionado para o dia ${day}!`);
      
      save({
        ...data,
        [selectedFriend]: { ...friendData, [key]: updated },
      });
    },
    [entries, data, key, selectedFriend, friendData]
  );

  const handleRemove = useCallback(
    (entryToRemove: DayEntry) => {
      if (selectedFriend !== user) return;
      
      const updated = entries.filter((e) => {
        if (entryToRemove.timestamp) {
          return e.timestamp !== entryToRemove.timestamp;
        }
        return e.day !== entryToRemove.day;
      });
      
      save({
        ...data,
        [selectedFriend]: { ...friendData, [key]: updated },
      });
      toast.info(`Registro removido de ${selectedFriend}`);
    },
    [entries, data, key, selectedFriend, friendData]
  );

  const handleSaveEdit = () => {
    if (!editingEntry || selectedFriend !== user) return;
    const nGains = Number(editGains.replace(/\./g, "").replace(",", ".")) || 0;
    const nLosses = Number(editLosses.replace(/\./g, "").replace(",", ".")) || 0;

    const updated = entries.map(e => {
      if (editingEntry.timestamp) {
        return e.timestamp === editingEntry.timestamp 
          ? { ...e, gains: nGains, losses: nLosses, timestamp: Date.now() } 
          : e;
      }
      return e.day === editingEntry.day 
        ? { ...e, gains: nGains, losses: nLosses, timestamp: Date.now() } 
        : e;
    });

    save({
      ...data,
      [selectedFriend]: { ...friendData, [key]: updated },
    });

    toast.success(`Valores substituídos para o Dia ${editingEntry.day}`);
    setEditingEntry(null);
  };

  const initEdit = (entry: DayEntry) => {
    setEditingEntry(entry);
    setEditGains(entry.gains.toFixed(2).replace(".", ","));
    setEditLosses(entry.losses.toFixed(2).replace(".", ","));
  };

  // Get all friends totals for the month
  const friendTotals = ALL_FRIENDS.map((name) => {
    const fe = data[name]?.[key] || [];
    const gains = fe.reduce((s, e) => s + e.gains, 0);
    const losses = fe.reduce((s, e) => s + e.losses, 0);
    return { name, gains, losses, profit: gains - losses };
  });

  // Calcula Atividades Recentes (Últimas 20)
  const now = Date.now();
  
  const allActivities: (DayEntry & { friend: Friend })[] = [];
  ALL_FRIENDS.forEach(friendName => {
    Object.values(data[friendName] || {}).forEach(monthEntries => {
      monthEntries.forEach(entry => {
        if (entry.timestamp) {
          allActivities.push({ friend: friendName, ...entry });
        }
      });
    });
  });

  allActivities.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  const top20Activities = allActivities.slice(0, 20);

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-700">
      {isLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md">
           <div className="flex flex-col items-center gap-4 text-primary animate-pulse">
             <div className="w-12 h-12 border-4 border-t-transparent border-primary rounded-full animate-spin"></div>
             <p className="font-bold tracking-widest text-sm">SINCRONIZANDO COM A NUVEM...</p>
           </div>
        </div>
      )}
      {/* Header */}
      <header className="border-b bg-card/60 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 drop-shadow-sm">
            <span className="text-3xl">💰</span>
            Controle Financeiro
          </h1>
          <div className="flex items-center gap-2 sm:gap-4">
            <MonthSelector
              currentMonth={currentMonth}
              onPrev={() => setCurrentMonth(subMonths(currentMonth, 1))}
              onNext={() => setCurrentMonth(addMonths(currentMonth, 1))}
            />
            <div className="flex items-center gap-1 border-l pl-2 sm:pl-4 border-muted-foreground/20">
              <Button variant="ghost" size="icon" onClick={() => setIsPnlModalOpen(true)} title="Exportar Gráfico PNL">
                <Download className="h-5 w-5 hover:text-indigo-400 transition-colors" />
              </Button>
              <Button variant="ghost" size="icon" onClick={logout} title="Sair">
                <LogOut className="h-5 w-5 hover:text-red-500 transition-colors" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col xl:flex-row items-start gap-8">
        {/* Left Column: Podium view */}
        <aside className="w-full xl:w-80 shrink-0 xl:sticky xl:top-24">
          <RankingBoard friendTotals={friendTotals} profilePics={profilePics} />
        </aside>

        {/* Right Column: Existing Main UI */}
        <main className="flex-1 w-full space-y-8 min-w-0">
          {/* Friend selector tabs */}
          <div className="flex flex-wrap gap-2">
            {ALL_FRIENDS.map((name) => {
              const isActive = name === selectedFriend;
              const ft = friendTotals.find((f) => f.name === name)!;
              return (
                <button
                  key={name}
                  onClick={() => setSelectedFriend(name)}
                  className={cn(
                    "px-4 py-2 sm:px-5 sm:py-3 rounded-2xl text-sm font-semibold transition-all flex flex-col items-center gap-0.5 min-w-[90px] sm:min-w-[100px]",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105"
                      : "bg-card border hover:bg-accent hover:scale-[1.02]"
                  )}
                >
                  <div className="relative">
                    <img 
                      src={profilePics[name] || "/favicon.png"} 
                      alt={name} 
                      className={cn("w-10 h-10 rounded-full object-cover border-2 shadow-sm", isActive ? "border-primary" : "border-transparent")} 
                    />
                    {user === name && isActive && (
                      <label className="absolute -bottom-1 -right-2 bg-primary text-primary-foreground rounded-full p-1 cursor-pointer shadow-lg hover:scale-110 transition-transform">
                        <Camera className="w-3 h-3" />
                        <input type="file" className="hidden" accept="image/*" onChange={handleProfilePicChange} />
                      </label>
                    )}
                  </div>
                  <span>{name}</span>
                  <span className={cn(
                    "text-xs font-mono",
                    isActive ? "text-primary-foreground/80" : (ft.profit >= 0 ? "text-profit" : "text-loss")
                  )}>
                    {fmt(ft.profit)}
                  </span>
                </button>
              );
            })}
          </div>

        {/* Summary cards */}
        <MonthlySummary entries={entries} />

        {/* Chart + Form row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="icon" onClick={handlePrevFriend} className="hover:bg-primary/20">
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h2 className="font-semibold text-base text-center flex-1">
                Distribuição — {chartFriend}
              </h2>
              <Button variant="ghost" size="icon" onClick={handleNextFriend} className="hover:bg-primary/20">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
            <ProfitPieChart entries={data[chartFriend]?.[key] || []} />
          </div>

          {isOwner ? (
            <div className="glass-card rounded-2xl p-6 flex flex-col">
              <h2 className="font-semibold text-base mb-4">
                Novo Registro — {selectedFriend}
              </h2>
              <DayEntryForm onAdd={handleAdd} currentMonth={currentMonth} />
            </div>
          ) : (
             <div className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center text-center">
               <span className="text-4xl mb-4 opacity-50">🔒</span>
               <h2 className="font-semibold text-lg mb-2">Acesso Restrito</h2>
               <p className="text-muted-foreground text-sm">
                 Você está visualizando a carteira de {selectedFriend}.<br />
                 As adições e edições são limitadas ao dono da conta.
               </p>
             </div>
          )}
        </div>

        {/* Recent Actions Feed */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-semibold text-base mb-6 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
            Últimas 20 atualizações
          </h2>
          {top20Activities.length > 0 ? (
            <div className="flex flex-col gap-3">
              {top20Activities.map((act, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border bg-card/40 hover:bg-card/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <img src={profilePics[act.friend] || "/favicon.png"} alt={act.friend} className="w-10 h-10 rounded-full border shadow-sm object-cover" />
                    <div>
                      <p className="text-sm">
                        <span className="font-bold">{act.friend}</span> alterou o log do <strong className="text-primary font-mono bg-primary/10 px-1 rounded">Dia {act.day}</strong>
                      </p>
                      <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        🕐 {formatTimeAgo(act.timestamp || now)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm bg-background/50 p-2 px-4 rounded-lg">
                    {act.gains > 0 && <span className="text-profit font-mono font-bold">+{fmt(act.gains)}</span>}
                    {act.losses > 0 && <span className="text-loss font-mono font-bold">-{fmt(act.losses)}</span>}
                    {act.description && <span className="text-muted-foreground truncate max-w-[150px] italic">"{act.description}"</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center py-10 text-muted-foreground bg-accent/20 rounded-xl p-6 border-dashed border-2">
               <span className="text-4xl mb-4">🕵️</span>
               <p className="font-medium text-foreground text-center mb-1">Este Diário ainda está sem movimentações.</p>
               <p className="text-sm text-center opacity-80 max-w-sm">
                 Se você salvou dados anteriormente, eles podem estar **na conta do seu outro amigo**. Clique na foto de outro nome na barra superior para visualizar o perfil dele!
               </p>
             </div>
          )}
        </div>

        {/* Day-by-day table */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-base">
            Registros de {selectedFriend}
          </h2>
          <DayTable entries={entries} onRemove={isOwner ? handleRemove : undefined} onEdit={isOwner ? initEdit : undefined} />
        </div>
      </main>
      </div>

      {/* Editing Modal */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-card w-full max-w-sm rounded-[24px] shadow-2xl border p-6 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span className="bg-primary/10 text-primary px-2 rounded-md font-mono">D{editingEntry.day}</span>
                Modificar Valores
              </h2>
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={() => setEditingEntry(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground mb-4">
              Ao invés de acumular, esses valores irão substituir os ganhos e perdas inteiros cadastrados neste dia.
            </p>

            <div className="space-y-4 mb-6">
              <div className="space-y-2">
                <Label className="text-profit-foreground font-semibold">Qual foi o Ganho (R$)?</Label>
                <Input
                  value={editGains}
                  onChange={(e) => setEditGains(e.target.value)}
                  className="font-mono bg-background/50 h-12 text-lg text-profit focus-visible:ring-profit/30 border-profit/20"
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-loss-foreground font-semibold">Qual foi a Perda (R$)?</Label>
                <Input
                  value={editLosses}
                  onChange={(e) => setEditLosses(e.target.value)}
                  className="font-mono bg-background/50 h-12 text-lg text-loss focus-visible:ring-loss/30 border-loss/20"
                  placeholder="0,00"
                />
              </div>
            </div>

            <Button onClick={handleSaveEdit} className="w-full h-12 font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 transition-opacity gap-2">
              <Check className="w-5 h-5" />
              Salvar Alterações
            </Button>
          </div>
        </div>
      )}

      {cropImageSrc && (
        <ImageCropper
          imageSrc={cropImageSrc}
          onClose={() => setCropImageSrc(null)}
          onCropComplete={handleApplyCrop}
        />
      )}

      {isPnlModalOpen && (
        <PnlDownloadModal 
          data={data}
          onClose={() => setIsPnlModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Index;
