
import React, { useState, useEffect } from 'react';
import { User, Stock, View, Trade, SupportTicket, SystemLog, Order, StockDataPoint } from './types';
import { Auth } from './components/Auth';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { NewsFeed } from './components/NewsFeed';
import { Advisor } from './components/Advisor';
import { Analytics } from './components/Analytics';
import { AdminPanel } from './components/AdminPanel';
import { Profile } from './components/Profile';
import { CommunityChat } from './components/CommunityChat';
import { fetchRealTimePrices } from './services/geminiService';
import { DBService } from './services/db';

// Expanded List of 50 Major Indian Stocks
const INITIAL_STOCK_SYMBOLS = [
  { symbol: 'TCS', name: 'Tata Consultancy Services', price: 3480.00, sector: 'IT' },
  { symbol: 'INFY', name: 'Infosys Ltd', price: 1425.80, sector: 'IT' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', price: 1512.25, sector: 'Finance' },
  { symbol: 'RELIANCE', name: 'Reliance Industries', price: 2355.50, sector: 'Energy' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors', price: 960.40, sector: 'Auto' },
  { symbol: 'ITC', name: 'ITC Ltd', price: 445.50, sector: 'FMCG' },
  { symbol: 'SBIN', name: 'State Bank of India', price: 575.20, sector: 'Finance' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance', price: 7200.00, sector: 'Finance' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', price: 2500.00, sector: 'FMCG' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', price: 950.00, sector: 'Finance' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel', price: 880.00, sector: 'Telecom' },
  { symbol: 'LT', name: 'Larsen & Toubro', price: 2900.00, sector: 'Construction' },
  { symbol: 'AXISBANK', name: 'Axis Bank', price: 980.00, sector: 'Finance' },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', price: 1750.00, sector: 'Finance' },
  { symbol: 'MARUTI', name: 'Maruti Suzuki', price: 10500.00, sector: 'Auto' },
  { symbol: 'SUNPHARMA', name: 'Sun Pharma', price: 1150.00, sector: 'Pharma' },
  { symbol: 'TITAN', name: 'Titan Company', price: 3100.00, sector: 'Consumer' },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement', price: 8500.00, sector: 'Construction' },
  { symbol: 'WIPRO', name: 'Wipro Ltd', price: 410.00, sector: 'IT' },
  { symbol: 'TATASTEEL', name: 'Tata Steel', price: 130.00, sector: 'Metal' },
  { symbol: 'ASIANPAINT', name: 'Asian Paints', price: 3200.00, sector: 'Consumer' },
  { symbol: 'HCLTECH', name: 'HCL Technologies', price: 1250.00, sector: 'IT' },
  { symbol: 'NTPC', name: 'NTPC Ltd', price: 240.00, sector: 'Energy' },
  { symbol: 'POWERGRID', name: 'Power Grid Corp', price: 210.00, sector: 'Energy' },
  { symbol: 'M&M', name: 'Mahindra & Mahindra', price: 1600.00, sector: 'Auto' },
  { symbol: 'ADANIENT', name: 'Adani Enterprises', price: 2500.00, sector: 'Energy' },
  { symbol: 'ADANIGREEN', name: 'Adani Green', price: 950.00, sector: 'Energy' },
  { symbol: 'ADANIPORTS', name: 'Adani Ports', price: 820.00, sector: 'Infrastructure' },
  { symbol: 'COALINDIA', name: 'Coal India', price: 350.00, sector: 'Energy' },
  { symbol: 'ONGC', name: 'ONGC', price: 190.00, sector: 'Energy' },
  { symbol: 'BPCL', name: 'BPCL', price: 350.00, sector: 'Energy' },
  { symbol: 'GRASIM', name: 'Grasim Industries', price: 1950.00, sector: 'Construction' },
  { symbol: 'JSWSTEEL', name: 'JSW Steel', price: 820.00, sector: 'Metal' },
  { symbol: 'HINDALCO', name: 'Hindalco Industries', price: 480.00, sector: 'Metal' },
  { symbol: 'DRREDDY', name: 'Dr Reddys Labs', price: 5600.00, sector: 'Pharma' },
  { symbol: 'CIPLA', name: 'Cipla', price: 1200.00, sector: 'Pharma' },
  { symbol: 'DIVISLAB', name: 'Divis Laboratories', price: 3700.00, sector: 'Pharma' },
  { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals', price: 5200.00, sector: 'Healthcare' },
  { symbol: 'EICHERMOT', name: 'Eicher Motors', price: 3400.00, sector: 'Auto' },
  { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto', price: 5100.00, sector: 'Auto' },
  { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp', price: 3100.00, sector: 'Auto' },
  { symbol: 'TATACONSUM', name: 'Tata Consumer', price: 900.00, sector: 'FMCG' },
  { symbol: 'NESTLEIND', name: 'Nestle India', price: 24000.00, sector: 'FMCG' },
  { symbol: 'BRITANNIA', name: 'Britannia', price: 4800.00, sector: 'FMCG' },
  { symbol: 'TECHM', name: 'Tech Mahindra', price: 1200.00, sector: 'IT' },
  { symbol: 'LTIM', name: 'LTIMindtree', price: 5200.00, sector: 'IT' },
  { symbol: 'PIDILITIND', name: 'Pidilite Industries', price: 2500.00, sector: 'Chemicals' },
  { symbol: 'SBILIFE', name: 'SBI Life Insurance', price: 1350.00, sector: 'Finance' },
  { symbol: 'HDFCLIFE', name: 'HDFC Life', price: 650.00, sector: 'Finance' },
  { symbol: 'BAJAJHLDNG', name: 'Bajaj Holdings', price: 7200.00, sector: 'Finance' },
];

// Generate Initial Stocks with OHLC History
const generateInitialStocks = (): Stock[] => {
  return INITIAL_STOCK_SYMBOLS.map(s => {
    const history: StockDataPoint[] = [];
    let price = s.price * 0.95; // Start slightly lower
    
    for (let i = 0; i < 30; i++) {
      const volatility = 0.005;
      const change = (Math.random() * volatility * 2) - volatility;
      const close = price * (1 + change);
      const open = price;
      const high = Math.max(open, close) + (Math.random() * price * 0.002);
      const low = Math.min(open, close) - (Math.random() * price * 0.002);
      
      history.push({
        time: `10:${30 + i}`,
        price: close, // for line chart compatibility
        open,
        high,
        low,
        close
      });
      price = close;
    }
    
    const currentPrice = history[history.length-1].close;
    const startPrice = history[0].close;

    return {
      ...s,
      price: currentPrice,
      change: ((currentPrice - startPrice) / startPrice) * 100,
      changeAmount: currentPrice - startPrice,
      history
    };
  });
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [stocks, setStocks] = useState<Stock[]>(generateInitialStocks());
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAutoSync, setIsAutoSync] = useState(false);
  const [dataSources, setDataSources] = useState<{ title: string; uri: string }[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [isMarketOverride, setIsMarketOverride] = useState(false);
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [theme, setTheme] = useState<string>(() => localStorage.getItem('theme') || 'dark');

  // ... Theme & Time Effects ...
  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    DBService.init();
  }, []);

  // Market Logic: Update Prices & Check Orders
  useEffect(() => {
    const interval = setInterval(() => {
      // Only run simulation if market is OPEN or Override is TRUE
      // This visual indicator logic is handled by the clock effect, but this check ensures simulation loop correctness
      if (!isMarketOpen && !isMarketOverride) return;

      setStocks(prevStocks => prevStocks.map(stock => {
        // 1. Simulate new price tick (OHLC)
        const volatility = 0.0015; 
        const changePercent = (Math.random() * volatility * 2) - volatility;
        const prevClose = stock.price;
        const newClose = Math.max(0.01, prevClose * (1 + changePercent));
        
        const open = prevClose;
        const high = Math.max(open, newClose) + (Math.random() * prevClose * 0.0005);
        const low = Math.min(open, newClose) - (Math.random() * prevClose * 0.0005);

        const newPoint: StockDataPoint = {
           time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
           price: newClose,
           open, high, low, close: newClose
        };

        // Limit history to last 50 points for performant "running" chart
        const prevHistory = stock.history.length > 50 ? stock.history.slice(1) : stock.history;
        
        return {
          ...stock,
          price: newClose,
          change: ((newClose - stock.history[0].close) / stock.history[0].close) * 100,
          changeAmount: newClose - stock.history[0].close,
          history: [...prevHistory, newPoint]
        };
      }));

      // 2. Check Stop-Loss / Take-Profit Triggers for Current User
      if (user && user.activeOrders && user.activeOrders.length > 0) {
        let updatedOrders = [...user.activeOrders];
        let ordersTriggered = false;
        let portfolioUpdates = { ...user.portfolio };
        let balanceUpdate = user.balance;
        let newTrades: Trade[] = [];

        updatedOrders = updatedOrders.filter(order => {
           const stock = stocks.find(s => s.symbol === order.symbol);
           if (!stock) return true; // keep order if stock not found

           let triggered = false;
           if (order.type === 'STOP_LOSS' && stock.price <= order.triggerPrice) triggered = true;
           if (order.type === 'TAKE_PROFIT' && stock.price >= order.triggerPrice) triggered = true;

           if (triggered) {
              ordersTriggered = true;
              // Execute Sell
              const currentHolding = portfolioUpdates[order.symbol];
              if (currentHolding && currentHolding.quantity >= order.quantity) {
                 const revenue = stock.price * order.quantity;
                 const buyCost = currentHolding.avgBuyPrice * order.quantity;
                 const profitLoss = revenue - buyCost;

                 newTrades.push({
                    id: `TR-${Date.now()}`,
                    symbol: order.symbol,
                    type: order.type === 'STOP_LOSS' ? 'SL_TRIGGER' : 'TP_TRIGGER',
                    quantity: order.quantity,
                    price: stock.price,
                    timestamp: new Date().toISOString(),
                    totalValue: revenue,
                    profitLoss
                 });

                 balanceUpdate += revenue;
                 const remaining = currentHolding.quantity - order.quantity;
                 if (remaining <= 0) delete portfolioUpdates[order.symbol];
                 else portfolioUpdates[order.symbol] = { ...currentHolding, quantity: remaining };
              }
              return false; // Remove order
           }
           return true; // Keep order
        });

        if (ordersTriggered) {
           const updatedUser = { 
              ...user, 
              activeOrders: updatedOrders,
              balance: balanceUpdate,
              portfolio: portfolioUpdates,
              tradeHistory: [...user.tradeHistory, ...newTrades]
           };
           setUser(updatedUser);
           DBService.saveUser(updatedUser);
           newTrades.forEach(t => {
             DBService.logActivity(t.type, user.id, t.symbol, `Auto execution @ ${t.price.toFixed(2)}`);
             alert(`Order Executed: ${t.type} for ${t.symbol} at ₹${t.price.toFixed(2)}`);
           });
        }
      }

    }, 1000); // Update every 1000ms (1 second) for fluid chart movement

    return () => clearInterval(interval);
  }, [isMarketOpen, isMarketOverride, user, stocks]);

  // ... Auth & View logic (Login, Logout, etc.) ...
  const handleLogin = async (username: string, isAdmin: boolean, email?: string) => {
    let dbUser = await DBService.getUser(username);
    if (dbUser) {
      if (!dbUser.activeOrders) dbUser.activeOrders = []; // Migration
      if (!dbUser.wishlist) dbUser.wishlist = [];
      setUser(dbUser);
    } else {
      const newUser: User = {
        id: Date.now().toString(),
        username,
        email: email || `${username}@test.com`,
        balance: 100000,
        role: isAdmin ? 'ADMIN' : 'USER',
        status: 'ACTIVE',
        portfolio: {},
        tradeHistory: [],
        activeOrders: [],
        wishlist: [],
      };
      await DBService.saveUser(newUser);
      setUser(newUser);
    }
  };

  const handleLogout = () => { setUser(null); };

  const handleSyncMarket = async () => {
    setIsSyncing(true);
    
    // Process in chunks of 15 to avoid overwhelming the model/prompt limit and ensure ALL stocks are updated
    const chunkSize = 15;
    const allUpdates: {symbol: string, price: number}[] = [];
    const allSources: any[] = [];

    for (let i = 0; i < stocks.length; i += chunkSize) {
        const chunk = stocks.slice(i, i + chunkSize).map(s => s.symbol);
        const { prices, sources } = await fetchRealTimePrices(chunk);
        if (prices && prices.length > 0) {
          allUpdates.push(...prices);
        }
        if (sources && sources.length > 0) {
          allSources.push(...sources);
        }
    }

    // Update global sources if any found
    if (allSources.length) setDataSources(allSources.slice(0, 5)); 
    
    setStocks(prev => prev.map(s => {
       const real = allUpdates.find(p => p.symbol === s.symbol);
       if (real) {
          const newPoint = { 
             // Ensure time format is consistent with simulation logic (HH:MM:SS)
             time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
             price: real.price, 
             open: real.price, high: real.price, low: real.price, close: real.price 
          };
          // Append to history instead of replacing to keep the chart continuity
          return { 
             ...s, 
             price: real.price, 
             changeAmount: real.price - s.history[0].close,
             change: ((real.price - s.history[0].close) / s.history[0].close) * 100,
             history: [...s.history, newPoint] 
          };
       }
       return s;
    }));
    setIsSyncing(false);
  };

  const handleBuy = async (symbol: string, qty: number, sl?: number, tp?: number) => {
    if (!user) return;
    const stock = stocks.find(s => s.symbol === symbol);
    if (!stock) return;
    
    const cost = stock.price * qty;
    if (user.balance >= cost) {
      const currentHolding = user.portfolio[symbol] || { quantity: 0, avgBuyPrice: 0 };
      const totalCost = (currentHolding.quantity * currentHolding.avgBuyPrice) + cost;
      const newQty = currentHolding.quantity + qty;

      const newTrade: Trade = {
        id: Date.now().toString(),
        symbol,
        type: 'BUY',
        quantity: qty,
        price: stock.price,
        timestamp: new Date().toISOString(),
        totalValue: cost
      };

      let newOrders = [...(user.activeOrders || [])];
      if (sl) newOrders.push({ id: `ORD-${Date.now()}-SL`, symbol, type: 'STOP_LOSS', triggerPrice: sl, quantity: qty, timestamp: new Date().toISOString() });
      if (tp) newOrders.push({ id: `ORD-${Date.now()}-TP`, symbol, type: 'TAKE_PROFIT', triggerPrice: tp, quantity: qty, timestamp: new Date().toISOString() });

      const updatedUser: User = {
        ...user,
        balance: user.balance - cost,
        portfolio: { ...user.portfolio, [symbol]: { quantity: newQty, avgBuyPrice: totalCost / newQty } },
        tradeHistory: [...user.tradeHistory, newTrade],
        activeOrders: newOrders
      };
      
      await DBService.saveUser(updatedUser);
      setUser(updatedUser);
    } else {
      alert("Insufficient funds!");
    }
  };

  const handleSell = async (symbol: string, qty: number) => {
    if (!user) return;
    const stock = stocks.find(s => s.symbol === symbol);
    if (!stock) return;
    
    const currentHolding = user.portfolio[symbol];
    if (currentHolding && currentHolding.quantity >= qty) {
      const revenue = stock.price * qty;
      const newQty = currentHolding.quantity - qty;
      
      const newPortfolio = { ...user.portfolio };
      if (newQty === 0) delete newPortfolio[symbol];
      else newPortfolio[symbol] = { ...currentHolding, quantity: newQty };

      const buyCost = currentHolding.avgBuyPrice * qty;
      const profitLoss = revenue - buyCost;

      const newTrade: Trade = {
        id: Date.now().toString(),
        symbol, type: 'SELL', quantity: qty, price: stock.price, timestamp: new Date().toISOString(), totalValue: revenue, profitLoss
      };

      // Remove associated orders if position is closed (Simplified: remove all for symbol if fully closed)
      let newOrders = user.activeOrders;
      if (newQty === 0) {
        newOrders = user.activeOrders.filter(o => o.symbol !== symbol);
      }

      const updatedUser = {
        ...user,
        balance: user.balance + revenue,
        portfolio: newPortfolio,
        tradeHistory: [...user.tradeHistory, newTrade],
        activeOrders: newOrders
      };

      await DBService.saveUser(updatedUser);
      setUser(updatedUser);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!user) return;
    const updatedUser = { ...user, activeOrders: user.activeOrders.filter(o => o.id !== orderId) };
    await DBService.saveUser(updatedUser);
    setUser(updatedUser);
  };

  // Toggle Override Logic
  const handleToggleMarketOverride = () => {
    setIsMarketOverride(prev => {
      const newState = !prev;
      // Immediate UI update logic
      const now = new Date();
      const h = now.getHours();
      // Force update isMarketOpen based on the NEW override state instantly
      setIsMarketOpen((h >= 9 && h < 15) || newState);
      return newState;
    });
  };

  // Clock
  useEffect(() => {
    const t = setInterval(() => {
       const now = new Date();
       setCurrentTime(now);
       const h = now.getHours();
       // Standard logic: Market is open if 9-15 OR Override is on.
       setIsMarketOpen((h >= 9 && h < 15) || isMarketOverride);
    }, 1000);
    return () => clearInterval(t);
  }, [isMarketOverride]);

  // ... Render ...
  if (!user) return <Auth onLogin={handleLogin} />;

  return (
    <div className="h-screen overflow-hidden">
      <Layout 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        user={user} 
        onLogout={handleLogout}
        isMarketOpen={isMarketOpen}
        currentTime={currentTime}
        isMarketOverride={isMarketOverride}
      >
        {currentView === View.DASHBOARD && (
          <Dashboard 
            user={user} 
            stocks={stocks} 
            onBuy={handleBuy} 
            onSell={handleSell}
            onCancelOrder={handleCancelOrder}
            onSync={handleSyncMarket}
            isSyncing={isSyncing}
            dataSources={dataSources}
            isMarketOpen={isMarketOpen}
            isAutoSync={isAutoSync}
            onToggleAutoSync={() => setIsAutoSync(!isAutoSync)}
            onToggleWishlist={async (s) => {
              if (user) {
                const newWishlist = user.wishlist.includes(s) 
                  ? user.wishlist.filter(w => w !== s)
                  : [...user.wishlist, s];
                const updated = { ...user, wishlist: newWishlist };
                setUser(updated);
                await DBService.saveUser(updated);
              }
            }}
          />
        )}
        {currentView === View.ANALYTICS && <Analytics user={user} stocks={stocks} />}
        {currentView === View.ADVISOR && <Advisor user={user} stocks={stocks} />}
        {currentView === View.NEWS && <NewsFeed stocks={stocks} />}
        {currentView === View.ADMIN_PANEL && user.role === 'ADMIN' && <AdminPanel allUsers={allUsers} stocks={stocks} onUpdateUserStatus={async()=>{}} onDeleteUser={async()=>{}} onUpdateStockPrice={()=>{}} isMarketOverride={isMarketOverride} onToggleMarketOverride={handleToggleMarketOverride} supportTickets={[]} onResolveTicket={()=>{}} systemLogs={[]} />}
        {currentView === View.PROFILE && <Profile user={user} tickets={[]} onCreateTicket={()=>{}} onResetAccount={()=>{}} stocks={stocks} theme={theme} onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')} isMarketOverride={isMarketOverride} onToggleMarketOverride={handleToggleMarketOverride} />}
      </Layout>
      <CommunityChat user={user} />
    </div>
  );
};

export default App;
