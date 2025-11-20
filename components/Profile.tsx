
import React, { useState } from 'react';
import { User, SupportTicket, Stock } from '../types';
import { Card, Button, Badge, Input, TextArea } from './UI';
import { 
  UserCircleIcon, 
  BanknotesIcon, 
  BriefcaseIcon, 
  ClockIcon,
  ShieldCheckIcon,
  TicketIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/solid';

interface ProfileProps {
  user: User;
  tickets: SupportTicket[];
  onCreateTicket: (subject: string, message: string) => void;
  onResetAccount: () => void;
  stocks: Stock[]; // For portfolio calculations
  isMarketOverride?: boolean;
  onToggleMarketOverride?: () => void;
  theme: string;
  onToggleTheme: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ 
  user, 
  tickets, 
  onCreateTicket, 
  onResetAccount, 
  stocks,
  isMarketOverride,
  onToggleMarketOverride,
  theme,
  onToggleTheme
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SUPPORT'>('OVERVIEW');
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);

  // Calculate Portfolio Value
  const portfolioValue = Object.entries(user.portfolio).reduce((acc, [symbol, details]) => {
    const stock = stocks.find(s => s.symbol === symbol);
    // Explicit type assertion to avoid 'unknown' type error
    const qty = (details as { quantity: number }).quantity;
    return acc + (qty * (stock?.price || 0));
  }, 0);

  const totalNetWorth = user.balance + portfolioValue;
  
  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTicketSubject && newTicketMessage) {
      onCreateTicket(newTicketSubject, newTicketMessage);
      setNewTicketSubject('');
      setNewTicketMessage('');
      setShowNewTicketForm(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-10">
      {/* Profile Header */}
      <div className="relative mb-8 group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
        <Card className="relative bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center md:items-start gap-6 p-8">
          <div className="relative">
             <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white border-4 border-white dark:border-slate-900 shadow-xl ${user.role === 'ADMIN' ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gradient-to-br from-accent to-emerald-500'}`}>
               {user.username.substring(0, 2).toUpperCase()}
             </div>
             <div className={`absolute bottom-0 right-0 w-6 h-6 rounded-full border-4 border-white dark:border-slate-900 ${user.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'}`} />
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2 justify-center md:justify-start">
               <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{user.username}</h1>
               <Badge type={user.role === 'ADMIN' ? 'neutral' : 'success'}>
                  {user.role === 'ADMIN' ? 'Administrator' : 'Pro Trader'}
               </Badge>
            </div>
            <p className="text-slate-500 dark:text-slate-400 mb-4">{user.email}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
               <span className="flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  <ClockIcon className="h-3 w-3" /> Joined {new Date(parseInt(user.id)).toLocaleDateString()}
               </span>
               <span className="flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  <ShieldCheckIcon className="h-3 w-3" /> KYC Verified
               </span>
            </div>
          </div>

          <div className="text-right hidden md:block">
             <div className="text-slate-400 text-xs uppercase font-bold mb-1">Net Worth</div>
             <div className="text-2xl font-mono text-slate-900 dark:text-white font-bold">₹{totalNetWorth.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-slate-200 dark:border-slate-800 pb-1">
         <button 
           onClick={() => setActiveTab('OVERVIEW')}
           className={`pb-2 px-2 text-sm font-bold transition-colors relative ${activeTab === 'OVERVIEW' ? 'text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
         >
            Account Overview
            {activeTab === 'OVERVIEW' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-accent rounded-full" />}
         </button>
         <button 
           onClick={() => setActiveTab('SUPPORT')}
           className={`pb-2 px-2 text-sm font-bold transition-colors relative ${activeTab === 'SUPPORT' ? 'text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
         >
            Support Center
            {activeTab === 'SUPPORT' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-accent rounded-full" />}
         </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Theme Settings Card */}
          <Card className="flex justify-between items-center">
             <div>
               <h3 className="text-lg font-bold text-slate-900 dark:text-white">Appearance</h3>
               <p className="text-slate-500 dark:text-slate-400 text-sm">Customize your visual experience.</p>
             </div>
             <button 
               onClick={onToggleTheme}
               className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
             >
                {theme === 'dark' ? (
                   <>
                     <MoonIcon className="h-5 w-5 text-purple-400" />
                     <span className="text-sm font-bold text-white">Dark Mode</span>
                   </>
                ) : (
                   <>
                     <SunIcon className="h-5 w-5 text-orange-400" />
                     <span className="text-sm font-bold text-slate-700">Light Mode</span>
                   </>
                )}
             </button>
          </Card>

          {/* Admin Market Control Section */}
          {user.role === 'ADMIN' && onToggleMarketOverride && (
             <Card className="border-purple-500/30 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
               <div className="flex justify-between items-center">
                 <div>
                   <div className="flex items-center gap-2">
                     <ShieldCheckIcon className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                     <h3 className="text-lg font-bold text-slate-900 dark:text-white">Admin Controls</h3>
                   </div>
                   <p className="text-slate-500 dark:text-slate-400 text-sm pl-7">Global simulation settings.</p>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className={`text-xs font-bold uppercase ${isMarketOverride ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                      {isMarketOverride ? 'Market Forced Open' : 'Standard Market Hours'}
                    </div>
                    <button 
                      onClick={onToggleMarketOverride}
                      className={`w-12 h-6 rounded-full relative transition-colors ${isMarketOverride ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${isMarketOverride ? 'left-7' : 'left-1'}`} />
                    </button>
                 </div>
               </div>
             </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <Card className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-2">
                   <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400">
                      <BanknotesIcon className="h-6 w-6" />
                   </div>
                   <span className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase">Cash Balance</span>
                </div>
                <div className="text-2xl font-mono text-slate-900 dark:text-white font-bold pl-1">₹{user.balance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
             </Card>

             <Card className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-2">
                   <div className="p-2 bg-blue-500/20 rounded-lg text-blue-600 dark:text-blue-400">
                      <BriefcaseIcon className="h-6 w-6" />
                   </div>
                   <span className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase">Holdings Value</span>
                </div>
                <div className="text-2xl font-mono text-slate-900 dark:text-white font-bold pl-1">₹{portfolioValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
             </Card>

             <Card className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-2">
                   <div className="p-2 bg-purple-500/20 rounded-lg text-purple-600 dark:text-purple-400">
                      <ArrowPathIcon className="h-6 w-6" />
                   </div>
                   <span className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase">Total Trades</span>
                </div>
                <div className="text-2xl font-mono text-slate-900 dark:text-white font-bold pl-1">{user.tradeHistory.length}</div>
             </Card>
          </div>

          <Card className="border-red-500/20 bg-red-500/5">
             <h3 className="text-red-600 dark:text-red-400 font-bold mb-2">Danger Zone</h3>
             <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
               Resetting your account will wipe all trade history, portfolio holdings, and restore your balance to the initial ₹1,00,000. This action cannot be undone.
             </p>
             <Button variant="danger" onClick={onResetAccount}>Reset Trading Account</Button>
          </Card>
        </div>
      )}

      {/* Support Tab */}
      {activeTab === 'SUPPORT' && (
        <div className="space-y-6 animate-fade-in">
           <div className="flex justify-between items-center">
              <div>
                 <h3 className="text-xl font-bold text-slate-900 dark:text-white">Support Tickets</h3>
                 <p className="text-slate-500 dark:text-slate-400 text-sm">View status or raise a new issue</p>
              </div>
              <Button onClick={() => setShowNewTicketForm(!showNewTicketForm)} variant="secondary">
                 {showNewTicketForm ? 'Cancel' : 'Raise Ticket'}
              </Button>
           </div>

           {showNewTicketForm && (
              <Card className="border-accent/50 bg-slate-50 dark:bg-slate-800/50">
                 <form onSubmit={handleSubmitTicket} className="space-y-4">
                    <div>
                       <label className="text-sm text-slate-500 dark:text-slate-400 mb-1 block">Subject</label>
                       <Input 
                          value={newTicketSubject} 
                          onChange={(e) => setNewTicketSubject(e.target.value)}
                          placeholder="Brief summary of the issue..."
                          required
                       />
                    </div>
                    <div>
                       <label className="text-sm text-slate-500 dark:text-slate-400 mb-1 block">Description</label>
                       <TextArea 
                          value={newTicketMessage}
                          onChange={(e) => setNewTicketMessage(e.target.value)}
                          placeholder="Describe the issue in detail..."
                          rows={4}
                          required
                       />
                    </div>
                    <div className="flex justify-end">
                       <Button type="submit" className="flex items-center gap-2">
                          <PaperAirplaneIcon className="h-4 w-4" /> Submit Ticket
                       </Button>
                    </div>
                 </form>
              </Card>
           )}

           <div className="space-y-3">
              {tickets.length === 0 ? (
                 <div className="text-center py-12 bg-slate-100 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-800 border-dashed">
                    <TicketIcon className="h-12 w-12 mx-auto text-slate-400 dark:text-slate-600 mb-2" />
                    <p className="text-slate-500">No support tickets found.</p>
                 </div>
              ) : (
                 tickets.map(ticket => (
                    <Card key={ticket.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors group">
                       <div className="flex justify-between items-start">
                          <div>
                             <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-slate-900 dark:text-white">{ticket.subject}</span>
                                <Badge type={ticket.status === 'OPEN' ? 'danger' : 'success'}>{ticket.status}</Badge>
                             </div>
                             <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2 mb-2">{ticket.message}</p>
                             <span className="text-xs text-slate-500 dark:text-slate-600 flex items-center gap-1">
                                <ClockIcon className="h-3 w-3" /> {new Date(ticket.timestamp).toLocaleString()}
                                <span className="mx-1">•</span>
                                ID: {ticket.id}
                             </span>
                          </div>
                       </div>
                    </Card>
                 ))
              )}
           </div>
        </div>
      )}
    </div>
  );
};
