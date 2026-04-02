import { useState, useRef, useMemo } from "react";
import * as htmlToImage from "html-to-image";
import { toast } from "sonner";
import { Download, X, TrendingUp, Paintbrush, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, type Friend, ALL_FRIENDS } from "@/components/AuthProvider";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface PnlDownloadModalProps {
  data: Record<string, Record<string, { day: number; gains: number; losses: number }[]>>;
  onClose: () => void;
}

const PnlDownloadModal = ({ data, onClose }: PnlDownloadModalProps) => {
  const { user } = useAuth();
  const [selectedFriend, setSelectedFriend] = useState<Friend>(user || "Daniel");
  const [daysRange, setDaysRange] = useState<number>(30);
  const [bgColor, setBgColor] = useState<string>("#121212");
  const [textColor, setTextColor] = useState<string>("#ffffff");
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [bgType, setBgType] = useState<"image" | "video" | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const chartRef = useRef<HTMLDivElement>(null);

  const handleCustomBgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');
      const reader = new FileReader();
      reader.onloadend = () => {
         setBgImage(reader.result as string);
         setBgType(isVideo ? 'video' : 'image');
      };
      reader.readAsDataURL(file);
    }
    e.target.value = ''; // Reset
  };

  const chartData = useMemo(() => {
    let allEntries: { ts: number; display: string; profit: number; acc: number }[] = [];
    const friendMonths = data[selectedFriend] || {};
    
    Object.keys(friendMonths).forEach((monthKey) => {
      const [yearStr, monthStr] = monthKey.split("-");
      const year = parseInt(yearStr);
      const monthIndex = parseInt(monthStr) - 1; 
      
      const entries = friendMonths[monthKey];
      entries.forEach((e) => {
        const dateObj = new Date(year, monthIndex, e.day, 12, 0, 0); 
        allEntries.push({
          ts: dateObj.getTime(),
          display: `${String(e.day).padStart(2, '0')}/${monthStr}`,
          profit: e.gains - e.losses,
          acc: 0
        });
      });
    });

    allEntries.sort((a, b) => a.ts - b.ts);

    let currentAcc = 0;
    allEntries = allEntries.map(e => {
      currentAcc += e.profit;
      return { ...e, acc: currentAcc };
    });

    return daysRange === 999 ? allEntries : allEntries.slice(-daysRange);
  }, [data, selectedFriend, daysRange]);

  const handleDownload = async () => {
    if (!chartRef.current || isExporting) return;
    setIsExporting(true);

    try {
      const isAnimated = bgType === 'video' || (bgType === 'image' && bgImage?.includes('image/gif'));
      
      if (isAnimated) {
        toast.info("Gravando GIF Animado... Aguarde!", { duration: 4000 });
        
        const frames: string[] = [];
        const captureCount = 18; // 18 frames
        const intervalMs = 150; // Every 150ms

        const w = chartRef.current.offsetWidth;
        const h = chartRef.current.offsetHeight;

        // Foto 100% transparente do gráfico (sem fundo)
        const chartDataUrl = await htmlToImage.toPng(chartRef.current, {
          backgroundColor: 'transparent',
          pixelRatio: 1, 
          skipFonts: true
        });
        const chartImg = new Image();
        chartImg.src = chartDataUrl;
        await new Promise(r => chartImg.onload = r);

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        const mediaEl = document.getElementById("pnl-bg-media") as any;

        for (let i = 0; i < captureCount; i++) {
           // 1. Cor de base
           ctx.fillStyle = bgColor;
           ctx.fillRect(0, 0, w, h);

           // 2. Desenha o frame atual exato do Video ou GIF rolando
           if (mediaEl) {
             const mWidth = mediaEl.videoWidth || mediaEl.naturalWidth || w;
             const mHeight = mediaEl.videoHeight || mediaEl.naturalHeight || h;
             const mediaAspect = mWidth / mHeight;
             const canvasAspect = w / h;
             
             let drawW = w;
             let drawH = h;
             let offX = 0;
             let offY = 0;

             if (mediaAspect > canvasAspect) {
               drawW = h * mediaAspect;
               offX = (w - drawW) / 2;
             } else {
               drawH = w / mediaAspect;
               offY = (h - drawH) / 2;
             }
             ctx.drawImage(mediaEl, offX, offY, drawW, drawH);
           }

           // 3. Película preta em cima da mídia pra clareza
           if (bgImage) {
             ctx.fillStyle = "rgba(0,0,0,0.6)";
             ctx.fillRect(0, 0, w, h);
           }

           // 4. Cola o Gráfico
           ctx.drawImage(chartImg, 0, 0, w, h);

           frames.push(canvas.toDataURL("image/png", 0.5)); // Mais leve pra RAM
           await new Promise(r => setTimeout(r, intervalMs));
        }

        toast.info("Processando arquivo final...", { duration: 3000 });

        const gifshotModule = await import("gifshot");
        const gifshot = gifshotModule.default || gifshotModule;

        gifshot.createGIF({
           images: frames,
           interval: intervalMs / 1000, 
           gifWidth: w,
           gifHeight: h,
           numFrames: captureCount
        }, (obj: any) => {
           if (!obj.error) {
              const link = document.createElement("a");
              link.href = obj.image;
              link.download = `PNL_${selectedFriend}_${daysRange}d.gif`;
              link.click();
              toast.success("GIF Animado baixado com sucesso!");
           } else {
              toast.error("Ocorreu um erro gerando o GIF.");
           }
           setIsExporting(false);
        });

      } else {
        toast.info("Salvando gráfico em PNG...", { duration: 2000 });
        
        // Modalidade Estática Sem GIF
        const w = chartRef.current.offsetWidth;
        const h = chartRef.current.offsetHeight;
        const chartDataUrl = await htmlToImage.toPng(chartRef.current, { backgroundColor: 'transparent', pixelRatio: 2, skipFonts: true });
        
        const chartImg = new Image();
        chartImg.src = chartDataUrl;
        await new Promise(r => chartImg.onload = r);

        const canvas = document.createElement("canvas");
        canvas.width = w * 2; // Alta resolução (pixelRatio: 2)
        canvas.height = h * 2;
        const ctx = canvas.getContext("2d")!;
        const mediaEl = document.getElementById("pnl-bg-media") as any;

        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (mediaEl && bgImage) {
             const mWidth = mediaEl.naturalWidth || mediaEl.videoWidth || w;
             const mHeight = mediaEl.naturalHeight || mediaEl.videoHeight || h;
             const mediaAspect = mWidth / mHeight;
             const canvasAspect = w / h;
             let drawW = canvas.width;
             let drawH = canvas.height;
             let offX = 0;
             let offY = 0;
             if (mediaAspect > canvasAspect) {
               drawW = canvas.height * mediaAspect;
               offX = (canvas.width - drawW) / 2;
             } else {
               drawH = canvas.width / mediaAspect;
               offY = (canvas.height - drawH) / 2;
             }
             ctx.drawImage(mediaEl, offX, offY, drawW, drawH);
        }

        if (bgImage) {
           ctx.fillStyle = "rgba(0,0,0,0.6)";
           ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(chartImg, 0, 0, canvas.width, canvas.height);

        const finalDataUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = finalDataUrl;
        link.download = `PNL_${selectedFriend}_${daysRange}d.png`;
        link.click();
        toast.success("Imagem PNG exportada com sucesso!");
        setIsExporting(false);
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro fatal ao exportar o gráfico.");
      setIsExporting(false);
    }
  };

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const isPositive = chartData.length > 0 && chartData[chartData.length - 1].acc >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
       <div className="bg-card w-full max-w-[800px] rounded-2xl shadow-2xl border p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="text-indigo-500 w-6 h-6" />
              Exportador de Gráfico PNL (Lucro)
            </h2>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-destructive/10 hover:text-destructive" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex flex-wrap items-end gap-4 mb-6 bg-accent/30 p-4 rounded-xl border">
             <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
               <label className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">Carteira</label>
               <select 
                 className="bg-background border rounded-lg px-3 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                 value={selectedFriend}
                 onChange={(e) => setSelectedFriend(e.target.value as Friend)}
               >
                 {ALL_FRIENDS.map(f => <option key={f} value={f}>{f}</option>)}
               </select>
             </div>
             
             <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
               <label className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">Tempo Linear</label>
               <select 
                 className="bg-background border rounded-lg px-3 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                 value={daysRange}
                 onChange={(e) => setDaysRange(Number(e.target.value))}
               >
                 <option value={1}>Última entrada de dia</option>
                 <option value={5}>Últimos 5 dias</option>
                 <option value={7}>Últimos 7 dias</option>
                 <option value={15}>Últimos 15 dias</option>
                 <option value={30}>Últimos 30 dias</option>
                 <option value={999}>Todos os Tempos (Max)</option>
               </select>
             </div>
             
             <div className="flex flex-col gap-1.5 min-w-[140px] border-l border-white/10 pl-4 h-12 justify-end">
                <label className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1">
                  <Paintbrush className="w-3 h-3" /> Fundo & Texto
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <input 
                      type="color" 
                      value={bgColor}
                      title="Cor de Fundo"
                      onChange={(e) => { setBgColor(e.target.value); setBgImage(null); setBgType(null); }}
                      className="w-10 h-10 rounded-full cursor-pointer bg-transparent border-0 outline-none hover:scale-105 transition-transform" 
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <input 
                      type="color" 
                      value={textColor}
                      title="Cor dos Textos"
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-10 h-10 rounded-full cursor-pointer bg-transparent border-0 outline-none hover:scale-105 transition-transform" 
                    />
                  </div>
                  <div className="flex flex-col items-center border-l border-white/10 pl-3">
                    <label className="w-10 h-10 bg-background border flex items-center justify-center rounded-lg cursor-pointer hover:bg-accent/50 transition-colors" title="Personalizado (Foto ou GIF/MP4)">
                       <ImageIcon className="w-5 h-5 text-muted-foreground" />
                       <input type="file" className="hidden" accept="image/*,video/mp4,video/webm" onChange={handleCustomBgChange} />
                    </label>
                  </div>
                  {bgImage && (
                    <Button variant="ghost" size="sm" onClick={() => { setBgImage(null); setBgType(null); }} className="h-8 px-2 text-xs text-red-400">Limpar</Button>
                  )}
                </div>
             </div>
             
             <div className="ml-auto w-full sm:w-auto">
               <Button onClick={handleDownload} disabled={isExporting} className="w-full font-bold gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg h-10 mt-6 sm:mt-0">
                 {isExporting ? "Gravando Grafico..." : <><Download className="w-4 h-4" /> Baixar PNL</>}
               </Button>
             </div>
          </div>

          <div 
            className="w-full h-[380px] rounded-xl border border-[#2b2d31] relative overflow-hidden bg-cover bg-center"
            style={{ backgroundColor: bgColor }}
          >
            {bgType === 'video' && bgImage && (
              <video 
                id="pnl-bg-media"
                src={bgImage} 
                autoPlay 
                loop 
                muted 
                playsInline 
                className="absolute inset-0 w-full h-full object-cover z-0"
              />
            )}
            
            {bgType === 'image' && bgImage && (
               <img 
                 id="pnl-bg-media"
                 src={bgImage}
                 className="absolute inset-0 w-full h-full object-cover z-0"
               />
            )}

            {/* Dark overlay for contrast if custom image/video is used */}
            {bgImage && <div className="absolute inset-0 bg-black/60 z-0 pointer-events-none" />}

            {/* Chart Container - This holds the transparent SVGs to be screenshotted ONCE */}
            <div id="pnl-chart-capture" ref={chartRef} className="absolute inset-0 z-10 w-full h-full">
              <div className="absolute top-5 left-6 z-10" style={{ color: textColor }}>
                 <h3 className="text-xl font-bold" style={{ opacity: 0.9 }}>Gráfico de P&L — {selectedFriend}</h3>
                 <p className="text-sm font-semibold" style={{ opacity: 0.6 }}>{daysRange === 999 ? 'Todo Histórico' : `Últimos ${daysRange} registros computados`}</p>
              </div>
            
            {chartData.length > 0 ? (
               <div className="absolute top-5 right-6 text-right z-10 bg-[#00000050] px-4 py-2 rounded-xl backdrop-blur-md border border-white/5" style={{ color: textColor }}>
                 <p className="text-[11px] font-bold uppercase tracking-widest" style={{ opacity: 0.7 }}>Lucro Acumulado</p>
                 <p className={`text-2xl font-mono font-bold ${isPositive ? 'text-green-400' : 'text-red-500'}`}>
                   {fmt(chartData[chartData.length - 1].acc)}
                 </p>
               </div>
            ) : null}

            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" className="z-10 relative">
                <LineChart data={chartData} margin={{ top: 80, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke={textColor} strokeOpacity={0.15} vertical={false} />
                  <XAxis dataKey="display" stroke={textColor} strokeOpacity={0.4} tick={{ fill: textColor, opacity: 0.6, fontSize: 13, fontWeight: 600 }} dy={10} axisLine={false} tickLine={false} />
                  <YAxis 
                    stroke={textColor} 
                    strokeOpacity={0.4}
                    tick={{ fill: textColor, opacity: 0.6, fontSize: 13, fontWeight: 600 }} 
                    tickFormatter={(v) => `R$${v}`} 
                    width={85}
                    axisLine={false}
                    tickLine={false}
                    dx={-5}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: bgColor !== '#121212' ? bgColor : '#18181b', borderColor: textColor, borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)', opacity: 0.95 }}
                    itemStyle={{ color: textColor, fontWeight: 'bold' }}
                    labelStyle={{ color: textColor, opacity: 0.7, marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}
                    formatter={(value: number) => [fmt(value), "Banca Acumulada"]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="acc" 
                    stroke={isPositive ? "#22c55e" : "#ef4444"} 
                    strokeWidth={4} 
                    dot={{ fill: bgColor, stroke: isPositive ? "#22c55e" : "#ef4444", strokeWidth: 3, r: 6 }} 
                    activeDot={{ r: 8, strokeWidth: 0, fill: isPositive ? "#22c55e" : "#ef4444" }}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
               <div className="w-full h-full flex flex-col items-center justify-center text-white/30 pt-16">
                 <TrendingUp className="w-16 h-16 mb-4 opacity-20" />
                 <p className="font-semibold" style={{ color: textColor }}>Nenhuma entrada de lucro ou perda encontrada para plotar.</p>
               </div>
            )}
            </div>
          </div>
       </div>
    </div>
  );
};

export default PnlDownloadModal;
