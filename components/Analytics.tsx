
import React, { useMemo, useState } from 'react';
import { User, Stock, Trade } from '../types';
import { Card, Button, Badge, Input } from './UI';
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ScatterChart, Scatter, ZAxis, ReferenceLine
} from 'recharts';
import { 
  ArrowDownTrayIcon, 
  ChartPieIcon, 
  ChartBarIcon, 
  ScaleIcon,
  ArrowTrendingUpIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  XMarkIcon
} from '@heroicons/react/24/solid';

interface AnalyticsProps {
  user: User;
  stocks: Stock[];
}

const COLORS = ['#3b82f6', '#10b981', '#eab308', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

export const Analytics: React.FC<AnalyticsProps> = ({ user, stocks }) => {
  const [timeRange, setTimeRange] = useState<'ALL' | 'RECENT'>('ALL');
  const [selectedSector, setSelectedSector] = useState<string | null>(null);

  // --- 1. Sector Diversification Logic with Drill-Down ---
  const sectorData = useMemo(() => {
    const sectors: { [key: string]: { value: number, stocks: { symbol: string, qty: number, val: number }[] } } = {};
    let totalValue = 0;

    Object.entries(user.portfolio).forEach(([symbol, details]) => {
      const stock = stocks.find(s => s.symbol === symbol);
      if (stock) {
        const value = stock.price * details.quantity;
        if (!sectors[stock.sector]) sectors[stock.sector] = { value: 0, stocks: [] };
        
        sectors[stock.sector].value += value;
        sectors[stock.sector].stocks.push({ symbol, qty: details.quantity, val: value });
        totalValue += value;
      }
    });

    return Object.entries(sectors).map(([name, data]) => ({
      name,
      value: data.value,
      stocks: data.stocks,
      percent: totalValue > 0 ? ((data.value / totalValue) * 100).toFixed(1) : '0'
    })).sort((a, b) => b.value - a.value);
  }, [user.portfolio, stocks]);

  // --- 2. Cumulative P/L Curve (Equity Curve) ---
  const equityCurve = useMemo(() => {
    let runningPL = 0;
    const closedTrades = user.tradeHistory.filter(t => t.type === 'SELL');
    
    const data = closedTrades.map((t, i) => {
      runningPL += (t.profitLoss || 0);
      return {
        index: i + 1,
        date: new Date(t.timestamp).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }),
        fullDate: new Date(t.timestamp).toLocaleString(),
        pl: t.profitLoss || 0,
        cumulative: runningPL,
        symbol: t.symbol
      };
    });

    if (timeRange === 'RECENT') {
      return data.slice(-10);
    }
    return data;
  }, [user.tradeHistory, timeRange]);

  // --- 3. Win/Loss Scatter Data ---
  const scatterData = useMemo(() => {
    return user.tradeHistory
      .filter(t => t.type === 'SELL')
      .map((t, i) => ({
        x: i + 1, // Trade sequence
        y: t.profitLoss || 0, // P/L Amount
        z: t.totalValue, // Trade Size (Bubble size)
        symbol: t.symbol,
        isWin: (t.profitLoss || 0) >= 0
      }));
  }, [user.tradeHistory]);

  // --- 4. Advanced Metrics ---
  const metrics = useMemo(() => {
    const closedTrades = user.tradeHistory.filter(t => t.type === 'SELL');
    const totalRealizedPL = closedTrades.reduce((acc, t) => acc + (t.profitLoss || 0), 0);
    
    // Best & Worst
    const sortedByPL = [...closedTrades].sort((a, b) => (b.profitLoss || 0) - (a.profitLoss || 0));
    const bestTrade = sortedByPL[0];
    const worstTrade = sortedByPL[sortedByPL.length - 1];

    // Win Rate
    const wins = closedTrades.filter(t => (t.profitLoss || 0) > 0).length;
    const winRate = closedTrades.length > 0 ? ((wins / closedTrades.length) * 100).toFixed(1) : '0.0';

    return { totalRealizedPL, bestTrade, worstTrade, winRate, totalTrades: closedTrades.length };
  }, [user.tradeHistory]);

  const formatINR = (val: number) => val.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  const handleExportHistory = () => {
    const headers = ["ID,Timestamp,Symbol,Type,Quantity,Price,TotalValue,ProfitLoss\n"];
    const rows = user.tradeHistory.map(t => {
      return `${t.id},"${new Date(t.timestamp).toLocaleString()}",${t.symbol},${t.type},${t.quantity},${t.price},${t.totalValue},${t.profitLoss || 0}`;
    });
    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + headers + rows.join("\n"));
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `trade_history_${user.username}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ChartPieIcon className="h-7 w-7 text-accent" /> Performance Analytics
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Deep dive into your trading performance and behavior.</p>
        </div>
        <Button onClick={handleExportHistory} variant="secondary" className="flex items-center gap-2 text-sm">
          <ArrowDownTrayIcon className="h-4 w-4" /> Export Data
        </Button>
      </div>

      {/* 1. Hero Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-blue-500 bg-gradient-to-br from-white to-blue-50 dark:from-slate-800 dark:to-slate-900">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Realized P/L</div>
          <div className={`text-2xl font-mono font-bold ${metrics.totalRealizedPL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {metrics.totalRealizedPL >= 0 ? '+' : ''}{formatINR(metrics.totalRealizedPL)}
          </div>
        </Card>
        
        <Card className="p-4 border-l-4 border-l-purple-500 bg-gradient-to-br from-white to-purple-50 dark:from-slate-800 dark:to-slate-900">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Win Rate</div>
          <div className="flex items-end gap-2">
            <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white">{metrics.winRate}%</div>
            <div className="text-xs text-slate-400 mb-1">/ {metrics.totalTrades} trades</div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-500 bg-gradient-to-br from-white to-emerald-50 dark:from-slate-800 dark:to-slate-900">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Best Trade</div>
          {metrics.bestTrade ? (
            <div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">+{formatINR(metrics.bestTrade.profitLoss || 0)}</div>
              <div className="text-xs text-slate-500 flex items-center gap-1">
                 <TrophyIcon className="h-3 w-3 text-yellow-500" /> {metrics.bestTrade.symbol}
              </div>
            </div>
          ) : ( <div className="text-slate-400 text-sm italic">No trades yet</div> )}
        </Card>

        <Card className="p-4 border-l-4 border-l-red-500 bg-gradient-to-br from-white to-red-50 dark:from-slate-800 dark:to-slate-900">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Worst Trade</div>
          {metrics.worstTrade ? (
            <div>
              <div className="text-lg font-bold text-red-600 dark:text-red-400 font-mono">{formatINR(metrics.worstTrade.profitLoss || 0)}</div>
              <div className="text-xs text-slate-500 flex items-center gap-1">
                 <ExclamationTriangleIcon className="h-3 w-3 text-red-400" /> {metrics.worstTrade.symbol}
              </div>
            </div>
          ) : ( <div className="text-slate-400 text-sm italic">No trades yet</div> )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. Interactive Equity Curve */}
        <Card className="lg:col-span-2 min-h-[400px] flex flex-col">
           <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                 <ArrowTrendingUpIcon className="h-5 w-5 text-accent" />
                 <h3 className="font-bold text-slate-900 dark:text-white">Equity Curve (Cumulative P/L)</h3>
              </div>
              <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                 <button onClick={() => setTimeRange('RECENT')} className={`px-3 py-1 text-xs font-bold rounded ${timeRange === 'RECENT' ? 'bg-white dark:bg-slate-600 shadow text-slate-900 dark:text-white' : 'text-slate-500'}`}>Last 10</button>
                 <button onClick={() => setTimeRange('ALL')} className={`px-3 py-1 text-xs font-bold rounded ${timeRange === 'ALL' ? 'bg-white dark:bg-slate-600 shadow text-slate-900 dark:text-white' : 'text-slate-500'}`}>All Time</button>
              </div>
           </div>

           {equityCurve.length > 0 ? (
             <div className="flex-1 w-full h-full">
               <ResponsiveContainer width="100%" height={320}>
                 <AreaChart data={equityCurve} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                   <defs>
                     <linearGradient id="colorPl" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                       <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                   <XAxis dataKey="index" tick={{fill: '#94a3b8', fontSize: 10}} tickFormatter={(val) => `#${val}`} />
                   <YAxis stroke="#64748b" fontSize={10} tickFormatter={(val) => `₹${val}`} />
                   <RechartsTooltip 
                     contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: '#334155', color: 'white', borderRadius: '8px', fontSize: '12px' }}
                     labelStyle={{ color: '#94a3b8', marginBottom: '5px' }}
                     formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Cumulative P/L']}
                     labelFormatter={(label, payload) => {
                        if (payload && payload.length > 0) return `${payload[0].payload.fullDate}`;
                        return '';
                     }}
                   />
                   <Area 
                     type="monotone" 
                     dataKey="cumulative" 
                     stroke="#3b82f6" 
                     strokeWidth={3}
                     fillOpacity={1} 
                     fill="url(#colorPl)" 
                   />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
           ) : (
             <div className="flex-1 flex items-center justify-center text-slate-500 text-sm italic border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                No trading history to display chart.
             </div>
           )}
        </Card>

        {/* 3. Interactive Sector Allocation */}
        <Card className="min-h-[400px] flex flex-col relative overflow-hidden">
           <div className="flex items-center gap-2 mb-4">
              <ChartPieIcon className="h-5 w-5 text-accent" />
              <h3 className="font-bold text-slate-900 dark:text-white">Sector Allocation</h3>
           </div>
           
           {sectorData.length > 0 ? (
             <div className="flex-1 w-full h-full relative">
               <ResponsiveContainer width="100%" height={250}>
                 <PieChart>
                   <Pie
                     data={sectorData}
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={80}
                     paddingAngle={5}
                     dataKey="value"
                     onClick={(data) => setSelectedSector(data.name === selectedSector ? null : data.name)}
                     className="cursor-pointer"
                   >
                     {sectorData.map((entry, index) => (
                       <Cell 
                         key={`cell-${index}`} 
                         fill={COLORS[index % COLORS.length]} 
                         stroke="rgba(0,0,0,0)"
                         opacity={selectedSector && selectedSector !== entry.name ? 0.3 : 1}
                       />
                     ))}
                   </Pie>
                   <RechartsTooltip 
                     formatter={(value: number) => formatINR(value)}
                     contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: '#334155', color: 'white', borderRadius: '8px' }}
                   />
                   <Legend 
                      layout="horizontal" 
                      verticalAlign="bottom" 
                      align="center" 
                      iconType="circle"
                      wrapperStyle={{ fontSize: '10px', marginTop: '10px' }}
                   />
                 </PieChart>
               </ResponsiveContainer>

               {/* Drill Down Panel Overlay */}
               {selectedSector && (
                 <div className="absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700 p-4 animate-fade-in max-h-[150px] overflow-y-auto rounded-t-xl shadow-xl z-10">
                    <div className="flex justify-between items-center mb-2">
                       <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-accent" /> {selectedSector} Holdings
                       </h4>
                       <button onClick={() => setSelectedSector(null)} className="text-slate-500 hover:text-red-500">
                          <XMarkIcon className="h-4 w-4" />
                       </button>
                    </div>
                    <div className="space-y-2">
                       {sectorData.find(s => s.name === selectedSector)?.stocks.map(s => (
                          <div key={s.symbol} className="flex justify-between text-xs border-b border-slate-700/20 pb-1 last:border-0">
                             <span className="font-bold text-slate-700 dark:text-slate-300">{s.symbol}</span>
                             <span className="font-mono text-slate-500">{s.qty} units • {formatINR(s.val)}</span>
                          </div>
                       ))}
                    </div>
                 </div>
               )}

               <div className="text-center mt-4 text-xs text-slate-500">
                  {selectedSector ? 'Showing details below' : 'Click a slice to view stocks'}
               </div>
             </div>
           ) : (
             <div className="flex-1 flex items-center justify-center text-slate-500 text-sm italic border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                No holdings.
             </div>
           )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* 4. Win/Loss Scatter Plot */}
         <Card className="lg:col-span-2 min-h-[300px]">
            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2">
                  <ScaleIcon className="h-5 w-5 text-slate-400" />
                  <h3 className="font-bold text-slate-900 dark:text-white">Win/Loss Distribution</h3>
               </div>
               <div className="text-[10px] text-slate-500 italic">Bubble size = Trade Value</div>
            </div>
            {scatterData.length > 0 ? (
               <ResponsiveContainer width="100%" height={250}>
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                     <XAxis type="number" dataKey="x" name="Trade Sequence" tick={{fontSize: 10}} label={{ value: 'Trade #', position: 'insideBottomRight', offset: -5, fontSize: 10 }} />
                     <YAxis type="number" dataKey="y" name="P/L" tick={{fontSize: 10}} label={{ value: 'Profit/Loss (₹)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                     <ZAxis type="number" dataKey="z" range={[50, 400]} name="Value" />
                     <RechartsTooltip 
                        cursor={{ strokeDasharray: '3 3' }} 
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: '#334155', color: 'white', borderRadius: '8px' }}
                        formatter={(value: any, name: any, props: any) => {
                           if (name === 'P/L') return `₹${Number(value).toFixed(2)}`;
                           if (name === 'Value') return `Val: ₹${Number(value).toFixed(0)}`;
                           return value;
                        }}
                        labelFormatter={() => ''}
                     />
                     <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1} />
                     <Scatter name="Trades" data={scatterData} fill="#8884d8">
                        {scatterData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.isWin ? '#10b981' : '#ef4444'} />
                        ))}
                     </Scatter>
                  </ScatterChart>
               </ResponsiveContainer>
            ) : (
               <div className="h-48 flex items-center justify-center text-slate-500 text-sm italic border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                  No closed trades to analyze patterns.
               </div>
            )}
         </Card>

         {/* Summary Stats */}
         <Card>
            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
               <ChartBarIcon className="h-5 w-5 text-purple-400" /> Trading Habits
            </h3>
            <div className="space-y-4">
               <div className="bg-slate-100 dark:bg-slate-800/50 p-3 rounded-lg">
                  <div className="text-xs text-slate-500 uppercase mb-1">Avg Win Size</div>
                  <div className="text-lg font-mono font-bold text-emerald-500">
                     {(() => {
                        const wins = user.tradeHistory.filter(t => t.type === 'SELL' && (t.profitLoss || 0) > 0);
                        const total = wins.reduce((acc, t) => acc + (t.profitLoss || 0), 0);
                        return wins.length ? formatINR(total / wins.length) : '₹0';
                     })()}
                  </div>
               </div>
               <div className="bg-slate-100 dark:bg-slate-800/50 p-3 rounded-lg">
                  <div className="text-xs text-slate-500 uppercase mb-1">Avg Loss Size</div>
                  <div className="text-lg font-mono font-bold text-red-500">
                     {(() => {
                        const losses = user.tradeHistory.filter(t => t.type === 'SELL' && (t.profitLoss || 0) < 0);
                        const total = losses.reduce((acc, t) => acc + (t.profitLoss || 0), 0);
                        return losses.length ? formatINR(total / losses.length) : '₹0';
                     })()}
                  </div>
               </div>
            </div>
         </Card>
      </div>
    </div>
  );
};
