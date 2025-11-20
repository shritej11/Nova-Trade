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
        return pAcc + ((d as any).quantity * (stock?.price || 0));
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
    <div className="max-w-6xl mx-auto pb-10">
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
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-purple-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'}`}
          >
            <tab.icon className="h-4 w-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Dashboard Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 p-4">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">Total Users</p>
          <p className="text-2xl font-mono text-slate-900 dark:text-white">{stats.totalUsers}</p>
        </Card>
        <Card className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 p-4">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">Total Trades</p>
          <p className="text-2xl font-mono text-emerald-600 dark:text-emerald-400">{stats.totalVolume}</p>
        </Card>
        <Card className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 p-4">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">Platform Value</p>
          <p className="text-2xl font-mono text-blue-600 dark:text-blue-400">₹{(stats.totalValue / 10000000).toFixed(2)} Cr</p>
        </Card>
        <Card className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 p-4">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">Open Tickets</p>
          <p className="text-2xl font-mono text-yellow-500 dark:text-yellow-400">{stats.activeTickets}</p>
        </Card>
      </div>

      {/* Tab Content */}
      {activeTab === 'USERS' && (
        <Card>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">User Directory</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400 text-xs uppercase border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3">User</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Balance</th>
                  <th className="p-3">Role</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {allUsers.map(u => (
                  <tr key={u.id} className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3 font-medium text-slate-900 dark:text-white">
                      {u.username}
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </td>
                    <td className="p-3">
                      <Badge type={u.status === 'ACTIVE' ? 'success' : 'danger'}>{u.status}</Badge>
                    </td>
                    <td className="p-3 font-mono text-slate-700 dark:text-slate-300">₹{u.balance.toLocaleString()}</td>
                    <td className="p-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${u.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
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
                            className="text-slate-400 hover:text-red-500 transition-colors p-1"
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
          <Card className="border-purple-500/30 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Simulation Control</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Override standard market hours for testing.</p>
              </div>
              <div className="flex items-center gap-4">
                 <div className={`text-sm font-bold ${isMarketOverride ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-500'}`}>
                   {isMarketOverride ? 'MARKET FORCED OPEN' : 'STANDARD HOURS'}
                 </div>
                 <button 
                   onClick={onToggleMarketOverride}
