import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

// --- Injeção de Fontes ---
const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&family=Syne:wght@400..800&display=swap');

  .font-display { font-family: 'Syne', sans-serif; }
  .font-mono { font-family: 'DM Mono', monospace; }
  
  body {
    background-color: #0D0D0F;
    color: #F2F2F3;
  }
  
  .glass-panel {
    background: rgba(28, 28, 34, 0.9);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.07);
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.06), 0 4px 24px rgba(0, 0, 0, 0.4);
  }
  
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.1);
    border-radius: 4px;
  }
`;

// --- Estrutura de Dados (Mock) ---
const NAMES = ['Daniel', 'Perez', 'Ricardo', 'Morote', 'Pedro', 'Enzo'];
const COLORS = ['#7C5FFF', '#22C55E', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899'];
const ACTIVITIES = ['Aposta Futebol', 'Poker', 'Corrida', 'Roleta', 'Blackjack', 'Loteria'];

const generateMockData = () => {
  return NAMES.map((name, index) => {
    const entries = [];
    const numEntries = Math.floor(Math.random() * 8) + 8; // 8 to 15 entries
    let currentBalance = 0;
    
    for (let i = 0; i < numEntries; i++) {
      const day = Math.floor(Math.random() * 28) + 1;
      const isWin = Math.random() > 0.4;
      const amount = Math.floor(Math.random() * 1000) + 50;
      const gain = isWin ? amount : 0;
      const loss = isWin ? 0 : amount;
      currentBalance += (gain - loss);
      
      entries.push({
        id: `entry_${name}_${i}`,
        date: `2026-04-${day.toString().padStart(2, '0')}`,
        formattedDate: `${day.toString().padStart(2, '0')}/abr`,
        description: ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)],
        gain,
        loss,
        balanceAfter: currentBalance,
        currency: 'BRL',
        images: []
      });
    }
    
    entries.sort((a, b) => a.date.localeCompare(b.date));
    
    // Recalculate balance properly after sort
    let runBal = 0;
    entries.forEach(e => {
      runBal += (e.gain - e.loss);
      e.balanceAfter = runBal;
    });

    return {
      id: `usr_${index}`,
      name,
      avatar: name.substring(0, 2).toUpperCase(),
      avatarColor: COLORS[index],
      entries,
    };
  });
};

const initialUsersData = generateMockData();

// --- Utilitários ---
const formatBRL = (value) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

// --- Componentes ---

const AnimatedValue = ({ value, isCurrency = true }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    let startTime;
    const duration = 800; // 800ms
    const startValue = displayValue;
    
    const animate = (time) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      // easeOutQuart
      const ease = 1 - Math.pow(1 - progress, 4);
      const current = startValue + (value - startValue) * ease;
      setDisplayValue(current);
      if (progress < 1) requestAnimationFrame(animate);
    };
    
    requestAnimationFrame(animate);
  }, [value]);

  return <span>{isCurrency ? formatBRL(displayValue) : Math.round(displayValue)}</span>;
};

// 1. Header
const Header = ({ monthYear }) => (
  <header className="sticky top-0 z-50 glass-panel border-b-0 border-l-0 border-r-0 rounded-none bg-[#0D0D0F]/85">
    <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-2xl">💰</span>
        <h1 className="font-display text-xl sm:text-2xl font-bold hidden sm:block">Controle Financeiro</h1>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-white/5 rounded-full transition-colors"><ChevronIcon direction="left" /></button>
        <span className="font-display font-medium text-[#F2F2F3]">{monthYear}</span>
        <button className="p-2 hover:bg-white/5 rounded-full transition-colors"><ChevronIcon direction="right" /></button>
      </div>

      <div className="flex items-center gap-2 text-[#9999A8]">
        <button className="p-2 hover:text-[#F2F2F3] transition-colors"><DownloadIcon /></button>
        <button className="p-2 hover:text-[#EF4444] transition-colors"><LogoutIcon /></button>
      </div>
    </div>
  </header>
);

// 2. User Bar
const UserBar = ({ users, selectedUser, onSelectUser }) => (
  <div className="w-full overflow-x-auto custom-scrollbar pt-6 pb-4">
    <div className="max-w-7xl mx-auto px-4 flex sm:justify-center gap-4 sm:gap-6 min-w-max">
      {users.map(user => {
        const isSelected = selectedUser.id === user.id;
        const netProfit = user.entries.reduce((acc, e) => acc + e.gain - e.loss, 0);
        const isEmpty = user.entries.length === 0;

        return (
          <motion.div
            key={user.id}
            onClick={() => onSelectUser(user)}
            whileHover={{ y: -2 }}
            animate={isSelected ? { scale: 1.05 } : { scale: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
            className={`flex flex-col items-center gap-2 cursor-pointer relative p-2 rounded-xl transition-colors ${
              isSelected ? 'bg-white/5' : 'hover:bg-white/5'
            } ${isEmpty ? 'opacity-50' : ''}`}
          >
            {isSelected && (
              <motion.div 
                layoutId="userSelectBorder" 
                className="absolute inset-0 rounded-xl border-2 border-[#7C5FFF] shadow-[0_0_15px_rgba(124,95,255,0.2)]" 
              />
            )}
            <div 
              className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold shadow-lg"
              style={{ backgroundColor: user.avatarColor, color: '#FFF' }}
            >
              {user.avatar}
            </div>
            <div className="text-center z-10">
              <div className="font-medium text-sm text-[#F2F2F3]">{user.name}</div>
              {isEmpty ? (
                <div className="text-[10px] bg-[#F59E0B]/20 text-[#F59E0B] px-1.5 py-0.5 rounded mt-1">Sem dados</div>
              ) : (
                <div className={`text-xs font-mono mt-0.5 ${netProfit >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                  {netProfit >= 0 ? '+' : ''}{formatBRL(netProfit)}
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  </div>
);

// 3. Podium
const Podium = ({ ranking }) => {
  const top3 = ranking.slice(0, 3);
  const others = ranking.slice(3);

  const getMedal = (idx) => ['🥇','🥈','🥉'][idx];
  
  // Reorder for display: 2nd, 1st, 3rd
  const displayTop3 = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <div className="glass-panel p-6 rounded-2xl h-full flex flex-col hidden lg:flex">
      <h2 className="font-display text-[#F2F2F3] text-lg font-medium mb-8">Ranking do Mês</h2>
      
      <div className="flex items-end justify-center gap-2 mb-8 h-40">
        {displayTop3.map((user, i) => {
          if(!user) return null;
          // map visual position corresponding to logic index: logic index 1 is 2nd place, logic index 0 is 1st, logic 2 is 3rd
          const originalRank = top3.indexOf(user); 
          const heights = ['h-24', 'h-32', 'h-20'];
          
          return (
            <motion.div 
              key={user.id}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center"
            >
              <div className="text-2xl mb-1">{getMedal(originalRank)}</div>
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm mb-2 z-10 relative"
                style={{ backgroundColor: user.avatarColor }}
              >
                {user.avatar}
              </div>
              <div className={`w-20 ${heights[originalRank]} bg-[#7C5FFF]/20 rounded-t-xl border-t border-x border-[#7C5FFF]/50 flex flex-col items-center pt-2 relative overflow-hidden`}>
                <div className="absolute inset-0 bg-gradient-to-t from-transparent to-[#7C5FFF]/20" />
                <span className="font-bold text-[#F2F2F3] text-sm relative z-10">{user.name}</span>
                <span className={`text-[10px] font-mono mt-1 relative z-10 ${user.profit >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                  {user.profit < 0 ? '↓ ' : ''}{formatBRL(Math.abs(user.profit))}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 mt-auto">
        {others.map((user, idx) => (
          <motion.div 
            key={user.id}
            whileHover={{ y: -2, backgroundColor: 'rgba(255,255,255,0.05)' }}
            className="flex items-center justify-between p-2 rounded-lg border border-transparent hover:border-[rgba(255,255,255,0.07)] transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-[#6B6B7A] font-mono text-sm w-4">{idx + 4}º</span>
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: user.avatarColor }}
              >{user.avatar}</div>
              <span className="text-sm font-medium text-[#F2F2F3]">{user.name}</span>
            </div>
            <span className={`text-xs font-mono ${user.profit >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
               {user.profit < 0 ? '↓ ' : ''}{formatBRL(Math.abs(user.profit))}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// 4. Metrics
const Metrics = ({ globals }) => {
  const cards = [
    { label: 'Ganhos do grupo', value: globals.totalGain, icon: '↗', color: 'text-[#22C55E]', sub: '+12 registros este mês' },
    { label: 'Perdas do grupo', value: globals.totalLoss, icon: '↘', color: 'text-[#EF4444]', sub: '45% do total apostado' },
    { label: 'Lucro do grupo', value: globals.netProfit, icon: '💼', color: globals.netProfit >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]', sub: 'vs mês anterior: +8%' },
    { label: 'Dias ativos', value: globals.activeDays, icon: '📅', color: 'text-[#7C5FFF]', sub: 'de 30 dias em Abril', isNum: true }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((c, i) => (
        <motion.div 
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          whileHover={{ scale: 1.02 }}
          className="glass-panel p-5 rounded-2xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-5xl">
            {c.icon}
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className={`flex items-center justify-center w-8 h-8 rounded-full bg-[#1C1C22] border border-[rgba(255,255,255,0.07)] ${c.color} text-sm`}>
              {c.icon}
            </span>
            <h3 className="text-xs text-[#9999A8] font-medium">{c.label}</h3>
          </div>
          <div className={`text-xl sm:text-2xl font-display font-semibold mb-1 ${!c.isNum ? c.color : 'text-[#F2F2F3]'}`}>
            <AnimatedValue value={c.value} isCurrency={!c.isNum} />
          </div>
          <p className="text-[10px] text-[#6B6B7A]">{c.sub}</p>
        </motion.div>
      ))}
    </div>
  );
};

// 5. Evolution Chart
const EvolutionChart = ({ user }) => {
  // Compute cumulative data
  let cumGain = 0;
  let cumLoss = 0;
  let cumNet = 0;
  const chartData = user.entries.map(e => {
    cumGain += e.gain;
    cumLoss += e.loss;
    cumNet += (e.gain - e.loss);
    return {
      date: e.formattedDate,
      fullDate: e.date,
      gainAcc: cumGain,
      lossAcc: cumLoss,
      net: cumNet,
      dailyGain: e.gain,
      dailyLoss: e.loss,
    };
  });

  return (
    <div className="glass-panel p-6 rounded-2xl flex-1 flex flex-col min-h-[400px]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display text-[#F2F2F3] text-lg font-medium flex items-center gap-2">
          Evolução — {user.name}
        </h2>
        <div className="flex bg-[#141418] rounded-lg p-1 border border-[rgba(255,255,255,0.05)]">
          {['7d', '15d', 'Mês', 'Tudo'].map((f, i) => (
            <button key={f} className={`text-[10px] px-3 py-1.5 rounded-md transition-colors ${i===2 ? 'bg-[#7C5FFF] text-white' : 'text-[#9999A8] hover:text-white'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 w-full relative">
        {chartData.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-[#6B6B7A]">Sem dados neste período</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorGain" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#6B6B7A" fontSize={11} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="#6B6B7A" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `R$${v/1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#7C5FFF" strokeDasharray="3 3" label={{ position: 'insideTopLeft', fill: '#7C5FFF', fontSize: 10, value: 'Break-even' }} />
              <Area type="monotone" dataKey="gainAcc" stroke="#22C55E" strokeWidth={2} fillOpacity={1} fill="url(#colorGain)" />
              <Area type="monotone" dataKey="lossAcc" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorLoss)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-[rgba(255,255,255,0.05)]">
        <div className="flex items-center gap-2 text-xs text-[#9999A8]">
          <span className="w-3 h-3 rounded-sm bg-[#22C55E]"></span> Ganhos
        </div>
        <div className="flex items-center gap-2 text-xs text-[#9999A8]">
          <span className="w-3 h-3 rounded-sm bg-[#EF4444]"></span> Perdas
        </div>
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="glass-panel p-3 rounded-lg border border-[rgba(255,255,255,0.1)] shadow-xl min-w-[150px]">
        <p className="text-xs text-[#9999A8] mb-2 font-mono">{data.fullDate}</p>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-[#22C55E]">Ganho:</span>
          <span className="font-mono text-[#22C55E]">{formatBRL(data.dailyGain)}</span>
        </div>
        <div className="flex justify-between text-sm mb-2 pb-2 border-b border-[rgba(255,255,255,0.1)]">
          <span className="text-[#EF4444]">Perda:</span>
          <span className="font-mono text-[#EF4444]">{formatBRL(data.dailyLoss)}</span>
        </div>
        <div className="flex justify-between text-sm font-bold">
          <span className="text-[#F2F2F3]">Saldo:</span>
          <span className="font-mono text-[#F2F2F3]">{formatBRL(data.net)}</span>
        </div>
      </div>
    );
  }
  return null;
};

// 6. Entry Form
const EntryForm = ({ user }) => {
  const [descPlaceholder, setDescPlaceholder] = useState(ACTIVITIES[0]);
  const [currency, setCurrency] = useState('BRL');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setDescPlaceholder(ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)] + "...");
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      e.target.reset();
    }, 800);
  };

  const recent = [...user.entries].reverse().slice(0, 5);

  return (
    <div className="glass-panel p-6 rounded-2xl xl:w-[400px] w-full flex flex-col">
      <h2 className="font-display text-[#F2F2F3] text-lg font-medium mb-6">Novo Registro — {user.name}</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4 flex-1">
        <div className="grid grid-cols-2 gap-4">
          <div>
             <label className="text-xs text-[#9999A8] mb-1.5 block" htmlFor="date">Data</label>
             <input id="date" type="date" className="w-full bg-[#0D0D0F] border border-[rgba(255,255,255,0.07)] rounded-lg px-3 py-2.5 text-sm text-[#F2F2F3] focus:outline-none focus:border-[#7C5FFF] transition-colors" defaultValue="2026-04-15" required />
          </div>
          <div>
            <label className="text-xs text-[#9999A8] mb-1.5 block">Moeda</label>
            <div className="flex bg-[#0D0D0F] border border-[rgba(255,255,255,0.07)] rounded-lg p-1">
              {['BRL', 'USD', 'EUR'].map(c => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${currency === c ? 'bg-[#1C1C22] text-[#F2F2F3] shadow-sm' : 'text-[#6B6B7A] hover:text-[#9999A8]'}`}
                >{c}</button>
              ))}
            </div>
          </div>
        </div>

        {currency !== 'BRL' && (
          <div className="text-[10px] text-[#F59E0B] text-right">Taxa atual: 1 {currency} = R$ {currency==='USD' ? '5.17' : '5.54'}</div>
        )}

        <div>
           <label className="text-xs text-[#9999A8] mb-1.5 block" htmlFor="desc">Descrição</label>
           <textarea id="desc" rows="2" placeholder={descPlaceholder} className="w-full bg-[#0D0D0F] border border-[rgba(255,255,255,0.07)] rounded-lg px-3 py-2.5 text-sm text-[#F2F2F3] focus:outline-none focus:border-[#7C5FFF] transition-colors custom-scrollbar" required></textarea>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
             <label className="text-xs text-[#9999A8] mb-1.5 block" htmlFor="gain">Ganho (R$)</label>
             <input id="gain" type="number" min="0" placeholder="0,00" className="font-mono w-full bg-[#0D0D0F] border border-[rgba(255,255,255,0.07)] rounded-lg px-3 py-2.5 text-sm text-[#22C55E] focus:outline-none focus:border-[#22C55E] transition-colors placeholder:text-[#22C55E]/30" />
          </div>
          <div>
             <label className="text-xs text-[#9999A8] mb-1.5 block" htmlFor="loss">Perda (R$)</label>
             <input id="loss" type="number" min="0" placeholder="0,00" className="font-mono w-full bg-[#0D0D0F] border border-[rgba(255,255,255,0.07)] rounded-lg px-3 py-2.5 text-sm text-[#EF4444] focus:outline-none focus:border-[#EF4444] transition-colors placeholder:text-[#EF4444]/30" />
          </div>
        </div>

        <div className="border border-dashed border-[rgba(255,255,255,0.1)] rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/5 transition-colors">
          <div className="flex gap-4 text-[#9999A8]">
            <CameraIcon /> <ImageIcon />
          </div>
          <span className="text-xs text-[#6B6B7A]">Arraste ou clique para anexar (max 3)</span>
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className={`w-full h-12 rounded-lg font-medium text-sm flex items-center justify-center transition-all bg-[#7C5FFF] hover:bg-[#9B82FF] text-white shadow-[0_4px_14px_rgba(124,95,255,0.3)] relative overflow-hidden`}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : showSuccess ? (
            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="flex items-center gap-2">
              <CheckIcon /> Salvo!
            </motion.div>
          ) : (
            'Registrar resultado'
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-[rgba(255,255,255,0.05)]">
        <h3 className="text-xs font-medium text-[#9999A8] mb-4">Histórico recente</h3>
        <div className="space-y-2">
          {recent.length === 0 ? (
            <div className="text-xs text-[#6B6B7A] text-center py-4">Nenhum registro ainda</div>
          ) : recent.map(r => (
            <div key={r.id} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-md transition-colors cursor-pointer group">
              <div className="flex flex-col">
                 <span className="text-xs text-[#F2F2F3]">{r.formattedDate}</span>
                 <span className="text-[10px] text-[#6B6B7A] truncate w-24">{r.description}</span>
              </div>
              <div className="flex items-center gap-3">
                 {r.gain > 0 && <span className="font-mono text-xs text-[#22C55E]">+{formatBRL(r.gain)}</span>}
                 {r.loss > 0 && <span className="font-mono text-xs text-[#EF4444]">-{formatBRL(r.loss)}</span>}
                 <span className="font-mono text-[10px] text-[#9999A8] w-16 text-right group-hover:text-[#F2F2F3] transition-colors">{formatBRL(r.balanceAfter)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 7. Live Modal
const LiveModal = ({ isOpen, onClose, userName }) => {
  if(!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="glass-panel w-full max-w-sm rounded-3xl p-6 relative flex flex-col items-center"
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-[#9999A8] hover:text-white"><XIcon /></button>
        <h2 className="text-[#9999A8] text-sm mb-8 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse"></span> Ao vivo: {userName}</h2>
        
        <input type="number" placeholder="R$ 0,00" className="w-full text-center text-4xl font-display font-bold bg-transparent focus:outline-none mb-10 text-[#F2F2F3] placeholder:text-[#6B6B7A]" autoFocus />

        <div className="grid grid-cols-2 gap-4 w-full mb-8">
          <button className="h-24 rounded-2xl bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] text-lg font-bold hover:bg-[#22C55E]/20 transition-colors shadow-[0_0_20px_rgba(34,197,94,0.1)] hover:shadow-[0_0_30px_rgba(34,197,94,0.2)]">
            GANHEI
          </button>
          <button className="h-24 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-lg font-bold hover:bg-[#EF4444]/20 transition-colors shadow-[0_0_20px_rgba(239,68,68,0.1)] hover:shadow-[0_0_30px_rgba(239,68,68,0.2)]">
             PERDI
          </button>
        </div>

        <button onClick={onClose} className="text-sm text-[#9999A8] hover:text-white border-b border-transparent hover:border-white pb-0.5 transition-all">Salvar e fechar</button>
      </motion.div>
    </div>
  );
};

// 8. Toasts
const ActivityToast = ({ activeToasts }) => (
  <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
    <AnimatePresence>
      {activeToasts.map(t => (
        <motion.div
          key={t.id}
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          layout
          className="glass-panel py-3 px-4 rounded-xl flex items-center gap-3 text-sm shadow-xl border-l-[3px] border-l-[#7C5FFF]"
          role="status"
        >
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: t.color, color:'#fff' }}>{t.avatar}</div>
          <span className="text-[#F2F2F3]">{t.msg}</span>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

// Main Layout
export default function ControleFinanceiro() {
  const [users] = useState(initialUsersData);
  const [selectedUser, setSelectedUser] = useState(users[0]);
  const [liveModalOpen, setLiveModalOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Calculate Globals
  const globals = useMemo(() => {
    let tg = 0, tl = 0;
    const daysSet = new Set();
    users.forEach(u => {
      u.entries.forEach(e => {
        tg += e.gain;
        tl += e.loss;
        daysSet.add(e.date);
      });
    });
    return {
      totalGain: tg,
      totalLoss: tl,
      netProfit: tg - tl,
      activeDays: daysSet.size
    };
  }, [users]);

  // Ranking
  const ranking = useMemo(() => {
    return [...users].map(u => ({
      ...u,
      profit: u.entries.reduce((acc, e) => acc + e.gain - e.loss, 0)
    })).sort((a,b) => b.profit - a.profit);
  }, [users]);

  // Random Toasts Effect
  useEffect(() => {
    const notify = () => {
      const u = users[Math.floor(Math.random() * users.length)];
      const msgs = [
        `registrou ${formatBRL(Math.random() > 0.5 ? 150 : 50)} de ganho 🚀`,
        `acabou de entrar no vermelho 🔴`,
        `adicionou uma nova aposta de Futebol ⚽`,
        `está em sequência de 3 perdas 🥶`
      ];
      const newToast = { id: Date.now(), msg: `${u.name} ${msgs[Math.floor(Math.random() * msgs.length)]}`, avatar: u.avatar, color: u.avatarColor };
      setToasts(prev => {
        const next = [...prev, newToast];
        if(next.length > 3) next.shift();
        return next;
      });
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToast.id));
      }, 5000);
    };

    const interval = setInterval(notify, Math.random() * 4000 + 8000); // 8-12s
    return () => clearInterval(interval);
  }, [users]);

  return (
    <>
      <style>{fontStyles}</style>
      <div className="min-h-screen bg-[#0D0D0F] font-sans pb-20 lg:pb-8 selection:bg-[#7C5FFF]/30">
        <Header monthYear="Abril 2026" />
        
        <UserBar users={users} selectedUser={selectedUser} onSelectUser={setSelectedUser} />

        <main className="max-w-7xl mx-auto px-4 mt-6 flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-[340px] shrink-0">
            <Podium ranking={ranking} />
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            <Metrics globals={globals} />
            
            <div className="flex flex-col xl:flex-row gap-6">
              <EvolutionChart user={selectedUser} />
              <EntryForm user={selectedUser} />
            </div>
          </div>
        </main>

        <button 
          onClick={() => setLiveModalOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-[#7C5FFF] hover:bg-[#9B82FF] rounded-full flex items-center justify-center text-2xl shadow-[0_4px_20px_rgba(124,95,255,0.5)] z-50 transition-colors group"
          aria-label="Registrar ao vivo"
        >
          <span className="group-hover:animate-pulse">⚡</span>
        </button>

        <LiveModal isOpen={liveModalOpen} onClose={() => setLiveModalOpen(false)} userName={selectedUser.name} />
        
        <ActivityToast activeToasts={toasts} />
      </div>
    </>
  );
}

// Minimal Icons to keep it dependency free (SVG strings)
const ChevronIcon = ({ direction }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: direction === 'left' ? 'none' : 'rotate(180deg)' }}>
    <path d="M15 18l-6-6 6-6"/>
  </svg>
);
const DownloadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const LogoutIcon = () => (
   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
     <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
   </svg>
);
const CameraIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
  </svg>
);
const ImageIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
     <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const XIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
     <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
