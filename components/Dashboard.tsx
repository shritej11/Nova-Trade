
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Stock, User, Prediction, Order } from '../types';
import { Card, Button, Badge, Input } from './UI';
import StockChart from './StockChart';
import { predictStockPrice } from '../services/geminiService';
import { 
  SparklesIcon, 
  ArrowPathIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  XCircleIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  StarIcon
} from '@heroicons/react/24/solid';
import { StarIcon as StarIconOutline } from '@heroicons/react/24/outline';

interface DashboardProps {
  user: User;
  stocks: Stock[];
  onBuy: (symbol: string, qty: number, sl?: number, tp?: number) => void;
  onSell: (symbol: string, qty: number) => void;
  onCancelOrder: (orderId: string) => void;
  onSync: () => void;
  isSyncing: boolean;
  dataSources: { title: string; uri: string }[];
  isMarketOpen: boolean;
  isAutoSync: boolean;
  onToggleAutoSync: () => void;
  onToggleWishlist: (symbol: string) => void;
  theme: string;
}

// Internal component to handle individual stock price flashing
const StockListItem: React.FC<{
  stock: Stock;
  isSelected: boolean;
  isWishlisted: boolean;
  onSelect: (stock: Stock) => void;
  onToggleWishlist: (symbol: string) => void;
}> = ({ stock, isSelected, isWishlisted, onSelect, onToggleWishlist }) => {
  const [flashState, setFlashState] = useState<'up' | 'down' | null>(null);
  const prevPriceRef = useRef(stock.price);

  useEffect(() => {
    if (stock.price > prevPriceRef.current) {
      setFlashState('up');
    } else if (stock.price < prevPriceRef.current) {
      setFlashState('down');
    }
    
    prevPriceRef.current = stock.price;

    const timer = setTimeout(() => {
      setFlashState(null);
    }, 1000); // Flash duration

    return () => clearTimeout(timer);
  }, [stock.price]);

  // Dynamic background based on flash state or selection
  let bgClass = "bg-white dark:bg-slate-900"; // Default
  if (flashState === 'up') bgClass = "bg-emerald-100 dark:bg-emerald-900/40 transition-colors duration-500";
  else if (flashState === 'down') bgClass = "bg-red-100 dark:bg-red-900/40 transition-colors duration-500";
  else if (isSelected) bgClass = "bg-slate-100 dark:bg-slate-800";
  else bgClass = "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors";

  const borderClass = isSelected ? "border-l-accent shadow-md" : "border-l-transparent";

  return (
    <Card 
      className={`cursor-pointer border-l-4 p-3 ${bgClass} ${borderClass}`}
    >
      <div className="flex items-start gap-3">
        <div 
           onClick={(e) => {
             e.stopPropagation();
             onToggleWishlist(stock.symbol);
           }}
           className="mt-0.5 text-slate-400 hover:text-yellow-400 transition-colors"
        >
           {isWishlisted ? <StarIcon className="h-5 w-5 text-yellow-400" /> : <StarIconOutline className="h-5 w-5" />}
        </div>
        <div className="flex-1" onClick={() => onSelect(stock)}>
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-slate-900 dark:text-white text-sm">{stock.symbol}</span>
            <Badge type={stock.change >= 0 ? 'success' : 'danger'}>
              {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate w-20">{stock.name}</span>
            <span className={`text-sm font-mono font-medium ${flashState === 'up' ? 'text-emerald-600 dark:text-emerald-400 scale-110' : flashState === 'down' ? 'text-red-600 dark:text-red-400 scale-110' : 'text-slate-900 dark:text-white'} transition-all duration-300`}>
              ₹{stock.price.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ 
  user, 
  stocks, 
  onBuy, 
  onSell,
  onCancelOrder,
  onSync, 
  isSyncing, 
  dataSources,
  isMarketOpen,
  isAutoSync,
  onToggleAutoSync,
  onToggleWishlist,
  theme
}) => {
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [tradeQty, setTradeQty] = useState<number>(1);
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [aiPrediction, setAiPrediction] = useState<Prediction | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewFilter, setViewFilter] = useState<'ALL' | 'WATCHLIST'>('ALL');

  const canTrade = isMarketOpen || user.role === 'ADMIN';
  const wishlist = user.wishlist || [];
  const activeOrders = user.activeOrders || [];

  // Initialize selected stock
  useEffect(() => {
    if (stocks.length > 0 && !selectedStock) {
      setSelectedStock(stocks[0]);
    } else if (selectedStock) {
      const updated = stocks.find(s => s.symbol === selectedStock.symbol);
      if (updated) setSelectedStock(updated);
    }
  }, [stocks, selectedStock]);

  // Automatic Sync Effect (Every 10 Seconds)
  useEffect(() => {
    const intervalId = setInterval(() => {
        // Trigger sync to fetch real-time data
        if (!isSyncing) {
           onSync();
        }
    }, 10000); // 10000ms = 10 seconds

    return () => clearInterval(intervalId);
  }, [onSync, isSyncing]);

  // Filter stocks
  const filteredStocks = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return stocks.filter(s => {
      const matchesSearch = s.symbol.toLowerCase().includes(term) || s.name.toLowerCase().includes(term);
      const matchesWishlist = viewFilter === 'WATCHLIST' ? wishlist.includes(s.symbol) : true;
      return matchesSearch && matchesWishlist;
    });
  }, [stocks, searchTerm, viewFilter, wishlist]);

  const handlePrediction = async () => {
    if (!selectedStock) return;
    setIsPredicting(true);
    const pred = await predictStockPrice(selectedStock);
    setAiPrediction(pred);
    setIsPredicting(false);
  };

  const handleBuySubmit = () => {
    if(!selectedStock) return;
    const sl = stopLoss ? parseFloat(stopLoss) : undefined;
    const tp = takeProfit ? parseFloat(takeProfit) : undefined;
    onBuy(selectedStock.symbol, tradeQty, sl, tp);
    setStopLoss('');
    setTakeProfit('');
  };

  // Calculate Portfolio Metrics
  const portfolioMetrics = useMemo(() => {
    let currentValue = 0;
    let totalCost = 0;

    Object.entries(user.portfolio).forEach(([symbol, details]) => {
      const currentPrice = stocks.find(s => s.symbol === symbol)?.price || 0;
      const position = details as { quantity: number; avgBuyPrice: number };
      
      currentValue += currentPrice * position.quantity;
      totalCost += position.avgBuyPrice * position.quantity;
    });

    const profitLoss = currentValue - totalCost;
    const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

    return { currentValue, totalCost, profitLoss, profitLossPercent };
  }, [user.portfolio, stocks]);

  const totalNetWorth = user.balance + portfolioMetrics.currentValue;
  const formatINR = (val: number) => val.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      {/* Left Column: Market List */}
      <div className="lg:col-span-3 flex flex-col h-[calc(100vh-100px)]">
        {/* Market Controls */}
        <div className="flex flex-col gap-3 mb-4 flex-shrink-0">
          <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Live Market</h2>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={onSync} 
                  disabled={isSyncing}
                  className="px-2 py-1 text-xs flex items-center gap-1 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200"
                >
                  <ArrowPathIcon className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Sync'}
                </Button>
              </div>
          </div>

          <div className="flex p-1 bg-slate-200 dark:bg-slate-800 rounded-lg">
             <button 
               onClick={() => setViewFilter('ALL')}
               className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${viewFilter === 'ALL' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
             >
               All Stocks
             </button>
             <button 
               onClick={() => setViewFilter('WATCHLIST')}
               className={`flex-1 py-1.5 text-xs font-bold rounded transition-all flex items-center justify-center gap-1 ${viewFilter === 'WATCHLIST' ? 'bg-white dark:bg-slate-700 text-yellow-600 dark:text-yellow-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
             >
               <StarIcon className="h-3 w-3" /> Watchlist
             </button>
          </div>

          <div className="relative group">
            <Input 
              placeholder="Search symbol..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-8 py-2 text-sm"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-accent transition-colors" />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <XCircleIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-2 pb-4">
          {filteredStocks.map(stock => (
              <StockListItem 
                key={stock.symbol}
                stock={stock}
                isSelected={selectedStock?.symbol === stock.symbol}
                isWishlisted={wishlist.includes(stock.symbol)}
                onSelect={(s) => { setSelectedStock(s); setAiPrediction(null); }}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
        </div>
      </div>

      {/* Middle Column: Charts & Trading */}
      <div className="lg:col-span-6 flex flex-col gap-6 h-[calc(100vh-100px)] overflow-y-auto">
        {selectedStock ? (
          <>
            <Card className="relative overflow-hidden min-h-[450px] flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {selectedStock.name} 
                      <span className="text-lg text-slate-500 font-normal">({selectedStock.symbol})</span>
                    </h1>
                    <button onClick={() => onToggleWishlist(selectedStock.symbol)}>
                       {wishlist.includes(selectedStock.symbol) ? <StarIcon className="h-6 w-6 text-yellow-400" /> : <StarIconOutline className="h-6 w-6 text-slate-400" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    {/* Added key to trigger animation on price change */}
                    <span key={selectedStock.price} className="text-3xl font-mono text-slate-900 dark:text-white animate-[pulse_0.5s_ease-in-out]">
                      ₹{selectedStock.price.toFixed(2)}
                    </span>
                    <div className={`flex flex-col text-xs font-bold ${selectedStock.change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                       <span>{selectedStock.change >= 0 ? '+' : ''}{selectedStock.changeAmount.toFixed(2)}</span>
                       <span>({selectedStock.change.toFixed(2)}%)</span>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="secondary" 
                  onClick={handlePrediction} 
                  disabled={isPredicting}
                  className="flex items-center gap-2 text-sm border border-slate-300 dark:border-slate-600"
                >
                  <SparklesIcon className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />
                  {isPredicting ? 'Analyzing...' : 'AI Insight'}
                </Button>
              </div>

              <div className="flex-1 w-full min-h-[300px]">
                <StockChart 
                  data={selectedStock.history} 
                  targetPrice={aiPrediction?.symbol === selectedStock.symbol ? aiPrediction.targetPrice : undefined}
                  theme={theme}
                />
              </div>

              {aiPrediction && aiPrediction.symbol === selectedStock.symbol && (
                 // ... AI Prediction UI ...
                 <div className="mt-4 bg-slate-50 dark:bg-slate-900/80 backdrop-blur rounded-xl border border-slate-200 dark:border-slate-700/50 animate-fade-in relative overflow-hidden group shadow-lg">
                   <div className="p-5 relative z-10">
                      <div className="flex justify-between items-start mb-4">
                         <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-lg">
                            <SparklesIcon className="h-5 w-5 text-accent" /> Gemini Intelligence
                         </h3>
                         <div className="flex items-center gap-2">
                            <Badge type="neutral">{aiPrediction.confidence}% Conf.</Badge>
                            <Badge type={aiPrediction.prediction === 'Bullish' ? 'success' : aiPrediction.prediction === 'Bearish' ? 'danger' : 'neutral'}>
                              {aiPrediction.prediction}
                            </Badge>
                         </div>
                      </div>
                      
                      {/* Technical Indicators Grid */}
                      <div className="grid grid-cols-3 gap-4 mb-4 bg-white dark:bg-slate-950/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700/30">
                        <div className="text-center">
                          <div className="text-[10px] uppercase text-slate-500 font-bold mb-1">RSI (14)</div>
                          <div className={`font-mono font-bold ${aiPrediction.technicalIndicators.rsi > 70 ? 'text-red-500 dark:text-red-400' : aiPrediction.technicalIndicators.rsi < 30 ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                            {aiPrediction.technicalIndicators.rsi}
                          </div>
                        </div>
                        <div className="text-center border-l border-slate-200 dark:border-slate-700/50">
                          <div className="text-[10px] uppercase text-slate-500 font-bold mb-1">MACD</div>
                          <div className={`font-bold text-xs ${aiPrediction.technicalIndicators.macd === 'Bullish' ? 'text-emerald-500 dark:text-emerald-400' : aiPrediction.technicalIndicators.macd === 'Bearish' ? 'text-red-500 dark:text-red-400' : 'text-yellow-500 dark:text-yellow-400'}`}>
                            {aiPrediction.technicalIndicators.macd}
                          </div>
                        </div>
                        <div className="text-center border-l border-slate-200 dark:border-slate-700/50">
                          <div className="text-[10px] uppercase text-slate-500 font-bold mb-1">Trend</div>
                          <div className="font-bold text-xs flex items-center justify-center gap-1 text-slate-900 dark:text-white">
                            {aiPrediction.technicalIndicators.trend === 'Up' ? <ArrowTrendingUpIcon className="h-3 w-3 text-emerald-500 dark:text-emerald-400" /> : aiPrediction.technicalIndicators.trend === 'Down' ? <ArrowTrendingDownIcon className="h-3 w-3 text-red-500 dark:text-red-400" /> : <span>→</span>}
                            {aiPrediction.technicalIndicators.trend}
                          </div>
                        </div>
                      </div>

                      {/* Sentiment Gauge */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs mb-1">
                           <span className="text-red-500 dark:text-red-400 font-bold">Fear</span>
                           <span className="text-slate-500 dark:text-slate-400">Sentiment: {aiPrediction.sentimentScore}/100</span>
                           <span className="text-emerald-500 dark:text-emerald-400 font-bold">Greed</span>
                        </div>
                        <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative">
                           <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500 opacity-30" />
                           <div 
                             className="h-full w-2 bg-slate-900 dark:bg-white rounded-full absolute top-0 transition-all duration-1000 shadow-[0_0_10px_rgba(0,0,0,0.2)]"
                             style={{ left: `${aiPrediction.sentimentScore}%` }}
                           />
                        </div>
                      </div>

                      <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">{aiPrediction.reasoning}</p>

                      {/* Key Levels */}
                      <div className="flex gap-4 text-xs">
                         <div className="flex-1 p-2 rounded bg-red-500/10 border border-red-500/20">
                            <span className="block text-red-600 dark:text-red-400 font-bold mb-1">Resistance</span>
                            <div className="font-mono text-slate-700 dark:text-slate-300">{aiPrediction.resistanceLevels.map(l => `₹${l}`).join(', ')}</div>
                         </div>
                         <div className="flex-1 p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
                            <span className="block text-emerald-600 dark:text-emerald-400 font-bold mb-1">Support</span>
                            <div className="font-mono text-slate-700 dark:text-slate-300">{aiPrediction.supportLevels.map(l => `₹${l}`).join(', ')}</div>
                         </div>
                      </div>
                   </div>
                 </div>
              )}
            </Card>

            {!canTrade && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center justify-center gap-2 text-red-600 dark:text-red-300 text-sm font-medium">
                <ClockIcon className="h-5 w-5" /> Market Closed (9 AM - 3 PM)
              </div>
            )}

            <Card className={!canTrade ? 'opacity-60 pointer-events-none grayscale-[0.5]' : ''}>
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-bold text-slate-900 dark:text-white">Place Order</h3>
                 <div className="text-xs text-slate-500 dark:text-slate-400">
                    Wallet: <span className="text-slate-900 dark:text-white font-mono">{formatINR(user.balance)}</span>
                 </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Quantity</label>
                  <div className="relative">
                    <Input 
                      type="number" 
                      min="1" 
                      value={tradeQty} 
                      onChange={(e) => setTradeQty(Math.max(1, parseInt(e.target.value) || 0))}
                      className="text-lg font-mono font-bold text-slate-900 dark:text-white"
                    />
                    <span className="absolute right-3 top-2.5 text-slate-400 text-xs">Qty</span>
                  </div>
                </div>
                <div className="text-right pb-2 flex flex-col justify-end">
                  <span className="text-xs text-slate-500 block mb-1">Total Value</span>
                  <span className="text-xl font-mono text-slate-900 dark:text-white font-bold">₹{(selectedStock.price * tradeQty).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Advanced Order Options */}
              <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-100 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700/50">
                <div>
                   <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Stop Loss (Optional)</label>
                   <Input 
                      type="number" 
                      placeholder="Price" 
                      value={stopLoss}
                      onChange={(e) => setStopLoss(e.target.value)}
                      className="text-sm h-8"
                   />
                </div>
                <div>
                   <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Take Profit (Optional)</label>
                   <Input 
                      type="number" 
                      placeholder="Price" 
                      value={takeProfit}
                      onChange={(e) => setTakeProfit(e.target.value)}
                      className="text-sm h-8"
                   />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Button variant="success" onClick={handleBuySubmit} className="h-12 text-lg">
                  BUY {selectedStock.symbol}
                </Button>
                <Button 
                  variant="danger" 
                  onClick={() => onSell(selectedStock.symbol, tradeQty)}
                  disabled={!user.portfolio[selectedStock.symbol] || user.portfolio[selectedStock.symbol].quantity < tradeQty}
                  className="h-12 text-lg"
                >
                  SELL {selectedStock.symbol}
                </Button>
              </div>
            </Card>
          </>
        ) : (
           <div className="flex items-center justify-center h-full text-slate-500">Select a stock</div>
        )}
      </div>

      {/* Right Column: Portfolio & Orders */}
      <div className="lg:col-span-3 flex flex-col gap-4 h-[calc(100vh-100px)] overflow-y-auto">
        <Card className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-700">
          <h2 className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider mb-1 font-bold">Total Net Worth</h2>
          <div className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white font-mono mb-4 truncate">
            {formatINR(totalNetWorth)}
          </div>
          <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700/50">
                <div className="flex items-center gap-1.5">
                   <ChartBarIcon className="h-4 w-4 text-slate-400" />
                   <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Total P/L</span>
                </div>
                <div className={`flex flex-col items-end ${portfolioMetrics.profitLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    <span className="font-bold text-sm font-mono">{portfolioMetrics.profitLoss >= 0 ? '+' : ''}{formatINR(portfolioMetrics.profitLoss)}</span>
                </div>
          </div>
        </Card>

        {/* Active Orders Section */}
        {activeOrders.length > 0 && (
          <div className="flex flex-col gap-2">
             <div className="flex items-center justify-between px-1">
               <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase">Active Orders</h3>
               <Badge type="neutral">{activeOrders.length}</Badge>
             </div>
             {activeOrders.map(order => (
               <Card key={order.id} className="p-3 border-l-4 border-l-yellow-500 flex justify-between items-center">
                  <div>
                     <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">{order.symbol}</span>
                        <span className="text-[10px] bg-slate-700 text-white px-1 rounded">{order.type === 'STOP_LOSS' ? 'SL' : 'TP'}</span>
                     </div>
                     <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Trigger @ <span className="font-mono text-slate-700 dark:text-white">₹{order.triggerPrice}</span>
                     </div>
                  </div>
                  <button 
                    onClick={() => onCancelOrder(order.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                    title="Cancel Order"
                  >
                    <XCircleIcon className="h-5 w-5" />
                  </button>
               </Card>
             ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-2">
           <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase">Your Assets</h3>
        </div>
        
        <div className="flex-1 space-y-2 overflow-y-auto pr-1">
          {Object.entries(user.portfolio).map(([symbol, details]) => {
               const position = details as { quantity: number; avgBuyPrice: number };
               const stock = stocks.find(s => s.symbol === symbol);
               const currentVal = (stock?.price || 0) * position.quantity;
               const gainLoss = currentVal - (position.avgBuyPrice * position.quantity);
               return (
                 <Card key={symbol} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                   <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-900 dark:text-white">{symbol}</span>
                      <span className={`text-xs font-bold ${gainLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {gainLoss >= 0 ? '+' : ''}{gainLoss.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                      </span>
                   </div>
                   <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                      <span>{position.quantity} units @ ₹{position.avgBuyPrice.toFixed(2)}</span>
                      <span>₹{currentVal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                   </div>
                 </Card>
               );
          })}
          {Object.keys(user.portfolio).length === 0 && (
            <div className="text-center py-10 text-slate-500 text-sm border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
              No assets owned yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
