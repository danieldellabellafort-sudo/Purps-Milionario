import { useState, useCallback, useEffect } from "react";
import { addMonths, subMonths, format } from "date-fns";
import { db, storage } from "@/lib/firebase";
import { doc, setDoc, onSnapshot, collection, query } from "firebase/firestore";

import MonthSelector from "@/components/MonthSelector";
import DayEntryForm from "@/components/DayEntryForm";
import DayTable, { type DayEntry } from "@/components/DayTable";
import MonthlySummary from "@/components/MonthlySummary";
import ProfitPieChart from "@/components/ProfitPieChart";
import RankingBoard from "@/components/RankingBoard";
import ImageCropper from "@/components/ImageCropper";
import { saveChunkedProfilePic, subscribeToChunkedProfilePics } from "@/lib/profileStorage";
import PnlDownloadModal from "@/components/PnlDownloadModal";
import SolanaWidget from "@/components/SolanaWidget";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth, type Friend, ALL_FRIENDS } from "@/components/AuthProvider";
import { LogOut, Camera, ChevronLeft, ChevronRight, X, Check, Download, Moon, Sun, Crown, TrendingUp } from "lucide-react";
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
  const [selectedFriend, setSelectedFriend] = useState<Friend>(user === "MASTER" ? "Daniel" : (user || "Daniel"));
  const [chartFriend, setChartFriend] = useState<Friend>(user === "MASTER" ? "Daniel" : (user || "Daniel"));
  const [podiumView, setPodiumView] = useState<'alltime' | 'daily'>('alltime');
  
  const [data, setData] = useState<FriendMonthData>({});
  const [profilePics, setProfilePics] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  const [editingEntry, setEditingEntry] = useState<DayEntry | null>(null);
  const [editGains, setEditGains] = useState("");
  const [editLosses, setEditLosses] = useState("");
  const [editDescription, setEditDescription] = useState("");
  
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isPnlModalOpen, setIsPnlModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("theme");
      if (stored === "dark") return true;
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

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

    // Mantém compatibilidade com fotos antigas
    const unsubPicsV2 = onSnapshot(doc(db, "app", "profile_pics_v2"), (snapshot) => {
      if (snapshot.exists()) {
        setProfilePics(prev => ({ ...snapshot.data() as Record<string, string>, ...prev }));
      }
    });

    // Escuta mudanças nas fotos de perfil (Novo sistema otimizado sem limite de 1MB)
    const unsubPicsChunked = subscribeToChunkedProfilePics((newPics) => {
      setProfilePics(prev => ({ ...prev, ...newPics }));
    });

    return () => { 
      unsubData(); 
      unsubPicsV2();
      unsubPicsChunked(); 
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
      const isGif = file.type === "image/gif" || file.name.toLowerCase().endsWith(".gif");
      if (isGif) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error("Para evitar lentidão na sua rede, GIFs devem ter no máximo 10MB!");
          e.target.value = '';
          return;
        }
        
        // Modal de edição vai aparecer SOMENTE se for um GIF
        const reader = new FileReader();
        reader.onloadend = () => {
          setCropImageSrc(reader.result as string);
          e.target.value = ''; 
        };
        reader.readAsDataURL(file);
      } else {
        // Se NÃO for GIF, aplica direto
        const reader = new FileReader();
        reader.onloadend = () => {
          handleApplyCrop(reader.result as string, false);
          e.target.value = '';
        };
        reader.readAsDataURL(file);
      }
    } else {
       e.target.value = ''; // Reset if no file
    }
  };

  const handleApplyCrop = async (croppedBase64: string, isGif: boolean = false) => {
    if (!user) return;
    setCropImageSrc(null);
    
    const targetUser = user === "MASTER" ? selectedFriend : user;

    // Atualização imediata local na UI (Optimistic update)
    setProfilePics((prev) => ({ ...prev, [targetUser]: croppedBase64 }));

    try {
      await saveChunkedProfilePic(targetUser, croppedBase64);
      if (isGif) {
        toast.success("Foto salva com sucesso! (GIF Animado 100% Suportado)");
      } else {
        toast.success("Foto salva com sucesso!");
      }
    } catch (e: any) {
      console.error(e);
      toast.error("Falha ao salvar a imagem no banco.");
    }
  };

  const isOwner = selectedFriend === user || user === "MASTER";

  const save = async (next: FriendMonthData) => {
    try {
      // O Firestore recusa dados contendo 'undefined'.
      // Ao converter para JSON e voltar, as chaves 'undefined' (como 'image' vazia) são ignoradas e removidas da árvore corretamente.
      const cleanData = JSON.parse(JSON.stringify(next));

      // START HOTFIX MIGRATION TO AVOID 1MB LIMIT
      let isMigrating = false;
      for (const friend of Object.keys(cleanData)) {
        for (const month of Object.keys(cleanData[friend])) {
          const monthEntries = cleanData[friend][month];
          for (const entry of monthEntries) {
            if (entry.image && entry.image.startsWith("data:image/")) {
              if (!isMigrating) toast.info("Otimizando imagens antigas para economizar espaço...");
              isMigrating = true;
              const { saveEntryImage } = await import('@/lib/imageStorage');
              entry.image = await saveEntryImage(entry.image);
            }
            if (entry.images && Array.isArray(entry.images)) {
              for (let i = 0; i < entry.images.length; i++) {
                if (entry.images[i].startsWith("data:image/")) {
                  if (!isMigrating) toast.info("Otimizando imagens antigas para economizar espaço...");
                  isMigrating = true;
                  const { saveEntryImage } = await import('@/lib/imageStorage');
                  entry.images[i] = await saveEntryImage(entry.images[i]);
                }
              }
            }
          }
        }
      }
      if (isMigrating) toast.success("Imagens otimizadas com sucesso! Reduzindo espaço.");
      // END HOTFIX

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
    (day: number, gains: number, losses: number, description: string, images?: string[]) => {
      // Only the owner can add
      if (selectedFriend !== user && user !== "MASTER") return;
      
      const newEntry: DayEntry = { day, gains, losses, description, images, timestamp: Date.now() };
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
      if (selectedFriend !== user && user !== "MASTER") return;
      
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
    if (!editingEntry || (selectedFriend !== user && user !== "MASTER")) return;
    const nGains = Number(editGains.replace(/\./g, "").replace(",", ".")) || 0;
    const nLosses = Number(editLosses.replace(/\./g, "").replace(",", ".")) || 0;

    const updated = entries.map(e => {
      if (editingEntry.timestamp) {
        return e.timestamp === editingEntry.timestamp 
          ? { ...e, gains: nGains, losses: nLosses, description: editDescription.trim(), timestamp: Date.now() } 
          : e;
      }
      return e.day === editingEntry.day 
        ? { ...e, gains: nGains, losses: nLosses, description: editDescription.trim(), timestamp: Date.now() } 
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
    setEditDescription(entry.description || "");
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

  const historicalTotals = ALL_FRIENDS.map((name) => {
    let allEntries: { ts: number; profit: number }[] = [];
    const friendMonths = data[name] || {};
    
    Object.keys(friendMonths).forEach((monthKey) => {
      const [yearStr, monthStr] = monthKey.split("-");
      const year = parseInt(yearStr);
      const monthIndex = parseInt(monthStr) - 1; 
      
      const entries = friendMonths[monthKey];
      entries.forEach((e) => {
        const ts = e.timestamp || new Date(year, monthIndex, e.day, 12, 0, 0).getTime();
        allEntries.push({
          ts: ts,
          profit: e.gains - e.losses,
        });
      });
    });

    allEntries.sort((a, b) => a.ts - b.ts);

    let currentAcc = 0;
    let maxPeak = 0;
    let maxDailyProfit = 0;
    
    allEntries.forEach(e => {
      currentAcc += e.profit;
      if (currentAcc > maxPeak) {
        maxPeak = currentAcc;
      }
      if (e.profit > maxDailyProfit) {
        maxDailyProfit = e.profit;
      }
    });

    return { name, profit: currentAcc, maxPeak: maxPeak, maxDailyProfit };
  });
  
  historicalTotals.sort((a, b) => b.maxPeak - a.maxPeak);
  const top1AllTime = historicalTotals.length > 0 && historicalTotals[0].maxPeak > 0 ? historicalTotals[0] : null;

  const topDailyGains = [...historicalTotals]
    .filter(f => f.maxDailyProfit > 0)
    .sort((a, b) => b.maxDailyProfit - a.maxDailyProfit)
    .slice(0, 3);

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
              <Button variant="ghost" size="icon" onClick={() => setIsDarkMode(!isDarkMode)} title="Alternar Tema">
                {isDarkMode ? <Sun className="h-5 w-5 hover:text-amber-400 transition-colors" /> : <Moon className="h-5 w-5 hover:text-indigo-400 transition-colors" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setIsPnlModalOpen(true)} title="Exportar Gráfico PNL">
                <Download className="h-5 w-5 hover:text-indigo-400 transition-colors" />
              </Button>
              <Button variant="ghost" size="icon" onClick={logout} title="Sair">
                <LogOut className="h-5 w-5 hover:text-red-500 transition-colors" />
              </Button>
              <div className="hidden sm:block ml-2 border-l pl-4 border-muted-foreground/20">
                <SolanaWidget />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col xl:flex-row items-start gap-8">
        {/* Left Column: Podium view */}
        <aside className="w-full xl:w-80 shrink-0 xl:sticky xl:top-24 space-y-6">
          {(top1AllTime && top1AllTime.maxPeak > 0) || (topDailyGains.length > 0) ? (
            <div className={cn("glass-card rounded-2xl p-6 flex flex-col items-center w-full relative overflow-hidden group transition-all duration-500", podiumView === 'alltime' ? "shadow-[0_0_15px_rgba(234,179,8,0.15)] border-yellow-500/30" : "shadow-[0_0_15px_rgba(34,197,94,0.15)] border-green-500/30")}>
              <div className={cn("absolute inset-0 transition-colors pointer-events-none", podiumView === 'alltime' ? "bg-yellow-500/5 group-hover:bg-yellow-500/10" : "bg-green-500/5 group-hover:bg-green-500/10")} />
              
              {/* Navigation overlay */}
              <button 
                onClick={() => setPodiumView(podiumView === 'alltime' ? 'daily' : 'alltime')}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-white/10 transition-colors z-20 text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setPodiumView(podiumView === 'alltime' ? 'daily' : 'alltime')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-white/10 transition-colors z-20 text-muted-foreground hover:text-foreground"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {podiumView === 'alltime' && top1AllTime && (
                <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-300">
                  <div className="flex items-center gap-2 mb-4 w-full justify-center text-yellow-500">
                    <Crown className="w-6 h-6 drop-shadow-md" />
                    <h2 className="font-bold text-sm tracking-widest uppercase bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">Top 1 Longo Prazo</h2>
                  </div>
                  <img 
                    src={profilePics[top1AllTime.name] || "/favicon.png"} 
                    alt={top1AllTime.name}
                    className="w-16 h-16 rounded-full object-cover mb-3 border-2 border-yellow-500/50 shadow-lg shadow-yellow-500/20 transition-transform group-hover:scale-105"
                  />
                  <span className="font-bold text-lg">{top1AllTime.name}</span>
                  <span className="font-mono text-xl font-bold text-profit mt-1 drop-shadow-sm flex flex-col items-center">
                    {fmt(top1AllTime.maxPeak)}
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Pico Histórico</span>
                  </span>
                </div>
              )}

              {podiumView === 'daily' && topDailyGains.length > 0 && (
                <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-300">
                  <div className="flex items-center gap-2 mb-6 w-full justify-center text-green-500">
                    <TrendingUp className="w-5 h-5 drop-shadow-md" />
                    <h2 className="font-bold text-sm tracking-widest uppercase bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">Ganho Diário</h2>
                  </div>
                  
                  <div className="flex items-end justify-center gap-2 h-40 w-full px-2 relative z-10">
                    {[1, 0, 2].map((visualIndex) => {
                      const ft = topDailyGains[visualIndex];
                      if (!ft) return <div key={`empty-${visualIndex}`} className="flex-1 min-w-0" />;

                      const heightClass = visualIndex === 0 ? 'h-28' : visualIndex === 1 ? 'h-20' : 'h-14';
                      const bgClass = visualIndex === 0 ? 'bg-green-500/20 border-green-500/50' : 
                                      visualIndex === 1 ? 'bg-emerald-500/20 border-emerald-500/40' : 
                                      'bg-teal-600/20 border-teal-600/40';

                      return (
                        <div key={ft.name} className="flex flex-col items-center flex-1 min-w-0">
                          <span className="font-bold text-xs mb-1 text-muted-foreground/80">
                            {visualIndex + 1}º
                          </span>
                          <img 
                            src={profilePics[ft.name] || "/favicon.png"} 
                            alt={ft.name}
                            className={cn("rounded-full object-cover mb-2 border shadow-sm border-background", visualIndex === 0 ? "w-10 h-10" : "w-8 h-8")}
                          />
                          <div className={cn("w-full rounded-t-lg border flex flex-col items-center justify-start pt-1.5 px-1 relative overflow-hidden", heightClass, bgClass)}>
                            <span className="text-[10px] font-semibold truncate w-full text-center text-foreground/90">{ft.name}</span>
                            <span className="text-[10px] font-mono mt-0.5 w-full text-center truncate font-bold text-green-400 drop-shadow-sm">
                              {fmt(ft.maxDailyProfit)}
                            </span>
                            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-background to-transparent pointer-events-none" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : null}
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
                    {(user === name || user === "MASTER") && isActive && (
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
                    {act.description && <span className="text-muted-foreground truncate max-w-[150px] italic cursor-help" title={act.description}>"{act.description}"</span>}
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
                <Label className="text-foreground font-semibold">Descrição (opcional)</Label>
                <Input
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="bg-background/50 h-12 text-base focus-visible:ring-primary/30 border-primary/20"
                  placeholder="Motivo..."
                />
              </div>
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
          onCropComplete={(croppedBase64) => handleApplyCrop(croppedBase64, cropImageSrc.startsWith('data:image/gif'))}
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
