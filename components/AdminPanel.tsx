
import React, { useState } from 'react';
import { User, Stock, SupportTicket, SystemLog } from '../types';
import { Card, Button, Badge, Input } from './UI';
import { 
  UsersIcon, 
  CurrencyDollarIcon, 
  ChartBarIcon, 
  ChatBubbleLeftRightIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  TrashIcon,
  WrenchScrewdriverIcon,
  FunnelIcon
} from '@heroicons/react/24/solid';

interface AdminPanelProps {
  allUsers: User[];
  stocks: Stock[];
  onUpdateUserStatus: (userId: string, status: 'ACTIVE' | 'BANNED') => void;
  onDeleteUser: (userId: string) => void;
  onUpdateStockPrice: (symbol: string, price: number) => void;
  isMarketOverride: boolean;
  onToggleMarketOverride: () => void;
  supportTickets: SupportTicket[];
  onResolveTicket: (ticketId: string) => void;
  systemLogs?: SystemLog[];
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  allUsers,
  stocks,
  onUpdateUserStatus,
  onDeleteUser,
  onUpdateStockPrice,
  isMarketOverride,
  onToggleMarketOverride,
  supportTickets,
  onResolveTicket,
  systemLogs = []
}) => {
  const [activeTab, setActiveTab] = useState<'USERS' | 'MARKET' | 'SUPPORT' | 'ANALYTICS'>('USERS');
  const [editingStock, setEditingStock] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');
  const [ticketFilter, setTicketFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL');

  const stats = {
    totalUsers: allUsers.length,
    totalVolume: allUsers.reduce((acc, u) => acc + u.tradeHistory.length, 0),
    activeTickets: supportTickets.filter(t => t.status === 'OPEN').length,
    totalValue: allUsers.reduce((acc, u) => {
      const portfolioVal = Object.entries(u.portfolio).reduce((pAcc, [sym, d]) => {
        const stock = stocks.find(s => s.symbol === sym);
        return pAcc + (d.quantity * (stock?.price || 0));
      }, 0);
      return acc + u.balance + portfolioVal;
    }, 0)
  };

  const filteredTickets = supportTickets
    .filter(t => ticketFilter === 'ALL' ? true : t.status === ticketFilter)
    .sort((a, b) => {
      // Always show OPEN first unless filtered
      if (ticketFilter === 'ALL' && a.status !== b.status) {
        return a.status === 'OPEN' ? -1 : 1;
      }
      // Then sort by newest timestamp
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

  return (
    <div className="max-w-6xl mx-auto">
      {/* Admin Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: 'USERS', icon: UsersIcon, label: 'User Management' },
          { id: 'MARKET', icon: CurrencyDollarIcon, label: 'Market Control' },
          { id: 'ANALYTICS', icon: ChartBarIcon, label: 'Analytics' },
          { id: 'SUPPORT', icon: ChatBubbleLeftRightIcon, label: 'Support Tickets' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
          >
            <tab.icon className="h-4 w-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Dashboard Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-slate-800 border-slate-700 p-4">
          <p className="text-slate-400 text-xs font-bold uppercase">Total Users</p>
          <p className="text-2xl font-mono text-white">{stats.totalUsers}</p>
        </Card>
        <Card className="bg-slate-800 border-slate-700 p-4">
          <p className="text-slate-400 text-xs font-bold uppercase">Total Trades</p>
          <p className="text-2xl font-mono text-emerald-400">{stats.totalVolume}</p>
        </Card>
        <Card className="bg-slate-800 border-slate-700 p-4">
          <p className="text-slate-400 text-xs font-bold uppercase">Platform Value</p>
          <p className="text-2xl font-mono text-blue-400">₹{(stats.totalValue / 10000000).toFixed(2)} Cr</p>
        </Card>
        <Card className="bg-slate-800 border-slate-700 p-4">
          <p className="text-slate-400 text-xs font-bold uppercase">Open Tickets</p>
          <p className="text-2xl font-mono text-yellow-400">{stats.activeTickets}</p>
        </Card>
      </div>

      {/* Tab Content */}
      {activeTab === 'USERS' && (
        <Card>
          <h3 className="text-xl font-bold text-white mb-4">User Directory</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-slate-400 text-xs uppercase border-b border-slate-700">
                  <th className="p-3">User</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Balance</th>
                  <th className="p-3">Role</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {allUsers.map(u => (
                  <tr key={u.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                    <td className="p-3 font-medium text-white">
                      {u.username}
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </td>
                    <td className="p-3">
                      <Badge type={u.status === 'ACTIVE' ? 'success' : 'danger'}>{u.status}</Badge>
                    </td>
                    <td className="p-3 font-mono text-slate-300">₹{u.balance.toLocaleString()}</td>
                    <td className="p-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${u.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700 text-slate-400'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      {u.role !== 'ADMIN' && (
                        <>
                          {u.status === 'ACTIVE' ? (
                            <Button 
                              variant="danger" 
                              className="px-2 py-1 text-xs"
                              onClick={() => onUpdateUserStatus(u.id, 'BANNED')}
                            >
                              <NoSymbolIcon className="h-3 w-3 inline mr-1" /> Ban
                            </Button>
                          ) : (
                            <Button 
                              variant="success" 
                              className="px-2 py-1 text-xs"
                              onClick={() => onUpdateUserStatus(u.id, 'ACTIVE')}
                            >
                              <CheckCircleIcon className="h-3 w-3 inline mr-1" /> Activate
                            </Button>
                          )}
                          <button 
                            className="text-slate-500 hover:text-red-400 transition-colors p-1"
                            title="Delete User"
                            onClick={() => { if(confirm('Delete user permanently?')) onDeleteUser(u.id); }}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'MARKET' && (
        <div className="space-y-6">
          <Card className="border-purple-500/30 bg-gradient-to-r from-slate-800 to-slate-900">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white">Simulation Control</h3>
                <p className="text-slate-400 text-sm">Override standard market hours for testing.</p>
              </div>
              <div className="flex items-center gap-4">
                 <div className={`text-sm font-bold ${isMarketOverride ? 'text-emerald-400' : 'text-slate-500'}`}>
                   {isMarketOverride ? 'MARKET FORCED OPEN' : 'STANDARD HOURS'}
                 </div>
                 <button 
                   onClick={onToggleMarketOverride}
                   className={`w-12 h-6 rounded-full relative transition-colors ${isMarketOverride ? 'bg-emerald-500' : 'bg-slate-600'}`}
                 >
                   <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${isMarketOverride ? 'left-7' : 'left-1'}`} />
                 </button>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-xl font-bold text-white mb-4">Stock Data Management</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stocks.map(stock => (
                <div key={stock.symbol} className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-white">{stock.symbol}</div>
                    <div className="text-xs text-slate-500">{stock.name}</div>
                  </div>
                  
                  {editingStock === stock.symbol ? (
                    <div className="flex items-center gap-1">
                      <Input 
                        type="number" 
                        value={tempPrice} 
                        onChange={(e) => setTempPrice(e.target.value)}
                        className="w-20 py-1 text-xs h-8"
                        autoFocus
                      />
                      <Button 
                        variant="success" 
                        className="px-2 py-1 h-8"
                        onClick={() => {
                          const val = parseFloat(tempPrice);
                          if (!isNaN(val)) {
                            onUpdateStockPrice(stock.symbol, val);
                            setEditingStock(null);
                          }
                        }}
                      >
                        ✓
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="text-white font-mono">₹{stock.price.toFixed(2)}</span>
                      <button 
                        onClick={() => { setEditingStock(stock.symbol); setTempPrice(stock.price.toString()); }}
                        className="text-slate-500 hover:text-accent"
                      >
                        <WrenchScrewdriverIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'SUPPORT' && (
        <Card>
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
             <h3 className="text-xl font-bold text-white">Support Ticket Management</h3>
             <div className="flex bg-slate-800 rounded-lg p-1">
                {(['ALL', 'OPEN', 'RESOLVED'] as const).map(filter => (
                  <button
                    key={filter}
                    onClick={() => setTicketFilter(filter)}
                    className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${ticketFilter === filter ? 'bg-purple-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                  >
                    {filter.charAt(0) + filter.slice(1).toLowerCase()}
                  </button>
                ))}
             </div>
           </div>

           {filteredTickets.length === 0 ? (
             <div className="text-center py-10 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
                <ChatBubbleLeftRightIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
                No {ticketFilter.toLowerCase() !== 'all' ? ticketFilter.toLowerCase() : ''} tickets found
             </div>
           ) : (
             <div className="space-y-3">
               {filteredTickets.map(ticket => (
                 <div key={ticket.id} className="p-4 bg-slate-900 rounded-lg border border-slate-800 flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-white font-bold text-base">{ticket.subject}</span>
                        <Badge type={ticket.status === 'OPEN' ? 'danger' : 'success'}>{ticket.status}</Badge>
                      </div>
                      <p className="text-slate-300 text-sm mb-3 p-3 bg-slate-950/50 rounded border border-slate-800/50">
                        {ticket.message}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-500 font-mono">
                         <span>User ID: <span className="text-slate-400">{ticket.userId}</span></span>
                         <span>•</span>
                         <span>{new Date(ticket.timestamp).toLocaleString()}</span>
                         <span>•</span>
                         <span>ID: {ticket.id}</span>
                      </div>
                    </div>
                    
                    {ticket.status === 'OPEN' && (
                      <div className="flex items-center">
                        <Button 
                          variant="success" 
                          onClick={() => onResolveTicket(ticket.id)} 
                          className="text-xs whitespace-nowrap flex items-center gap-2 w-full justify-center md:w-auto"
                        >
                          <CheckCircleIcon className="h-4 w-4" /> Mark Resolved
                        </Button>
                      </div>
                    )}
                 </div>
               ))}
             </div>
           )}
        </Card>
      )}

      {activeTab === 'ANALYTICS' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
             <h3 className="font-bold text-white mb-4">Top Traded Stocks</h3>
             <div className="space-y-2">
               {stocks
                 .map(s => ({ 
                   ...s, 
                   vol: allUsers.reduce((acc, u) => acc + u.tradeHistory.filter(t => t.symbol === s.symbol).length, 0) 
                 }))
                 .sort((a, b) => b.vol - a.vol)
                 .slice(0, 5)
                 .map((s, i) => (
                   <div key={s.symbol} className="flex justify-between items-center p-2 border-b border-slate-800 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 font-mono text-sm">#{i+1}</span>
                        <span className="text-white font-bold">{s.symbol}</span>
                      </div>
                      <span className="text-accent font-mono text-sm">{s.vol} Trades</span>
                   </div>
                 ))
               }
             </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between mb-4">
               <h3 className="font-bold text-white">Database Activity Logs</h3>
               <span className="text-xs text-slate-500">{systemLogs.length} events</span>
            </div>
            <div className="h-64 overflow-y-auto space-y-2 text-xs font-mono">
              {systemLogs.length === 0 ? (
                 <div className="text-slate-600 italic">No activity logs found.</div>
              ) : (
                systemLogs.slice(0, 50).map(log => (
                  <div key={log.id} className="p-2 bg-slate-900 rounded border-l-2 border-slate-600">
                     <div className="flex justify-between">
                        <span className={`font-bold ${log.action.includes('ADMIN') ? 'text-purple-400' : log.action.includes('BUY') ? 'text-emerald-400' : log.action.includes('SELL') ? 'text-red-400' : 'text-blue-400'}`}>
                           {log.action}
                        </span>
                        <span className="text-slate-600">{new Date(log.timestamp).toLocaleTimeString()}</span>
                     </div>
                     <div className="text-slate-400 mt-1">{log.targetId}</div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
