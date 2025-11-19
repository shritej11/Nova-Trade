
import React from 'react';
import { View, User } from '../types';
import { 
  HomeIcon, 
  NewspaperIcon, 
  UserCircleIcon, 
  ArrowRightOnRectangleIcon,
  AcademicCapIcon,
  CommandLineIcon,
  ChartPieIcon
} from '@heroicons/react/24/outline';

interface LayoutProps {
  children: React.ReactNode;
  currentView: View;
  onChangeView: (view: View) => void;
  user: User;
  onLogout: () => void;
  isMarketOpen: boolean;
  currentTime: Date;
  isMarketOverride: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentView, 
  onChangeView, 
  user, 
  onLogout,
  isMarketOpen,
  currentTime,
  isMarketOverride
}) => {
  const navItems = [
    { id: View.DASHBOARD, icon: HomeIcon, label: 'Dashboard' },
    { id: View.ANALYTICS, icon: ChartPieIcon, label: 'Analytics' },
    { id: View.ADVISOR, icon: AcademicCapIcon, label: 'AI Advisor' },
    { id: View.NEWS, icon: NewspaperIcon, label: 'Intelligence' },
    { id: View.PROFILE, icon: UserCircleIcon, label: 'Profile' },
  ];

  if (user.role === 'ADMIN') {
    navItems.push({ id: View.ADMIN_PANEL, icon: CommandLineIcon, label: 'Admin Panel' });
  }

  return (
    <div className="flex h-screen bg-primary transition-colors duration-300 overflow-hidden">
      {/* Sidebar */}
      <aside className={`w-20 lg:w-64 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-colors duration-300 ${user.role === 'ADMIN' ? 'bg-slate-50 dark:bg-slate-900 border-purple-200 dark:border-purple-900/30' : 'bg-secondary'}`}>
        <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-200 dark:border-slate-800">
          <div className={`h-8 w-8 rounded flex-shrink-0 ${user.role === 'ADMIN' ? 'bg-gradient-to-tr from-purple-500 to-pink-500' : 'bg-gradient-to-tr from-accent to-emerald-500'}`} />
          <span className="hidden lg:block ml-3 font-bold text-slate-900 dark:text-white text-lg tracking-tight">
            {user.role === 'ADMIN' ? 'Nova Admin' : 'NovaTrade'}
          </span>
        </div>

        <nav className="flex-1 py-6 flex flex-col gap-2 px-3">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`flex items-center p-3 rounded-xl transition-all group ${
                currentView === item.id 
                  ? user.role === 'ADMIN' 
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' 
                      : 'bg-accent text-white shadow-lg shadow-accent/20' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <item.icon className="h-6 w-6 flex-shrink-0" />
              <span className="hidden lg:block ml-3 font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${user.role === 'ADMIN' ? 'bg-purple-700' : 'bg-slate-700'}`}>
              {user.username.substring(0, 2).toUpperCase()}
            </div>
            <div className="hidden lg:block">
              <p className="text-sm text-slate-900 dark:text-white font-medium truncate w-32">{user.username}</p>
              <p className={`text-xs ${user.role === 'ADMIN' ? 'text-purple-500 dark:text-purple-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {user.role === 'ADMIN' ? 'Administrator' : 'Pro Account'}
              </p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center lg:justify-start p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            <span className="hidden lg:block ml-3 text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        {/* Header */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 bg-white/50 dark:bg-primary/50 backdrop-blur z-20 sticky top-0 transition-colors duration-300">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white capitalize flex items-center gap-2">
            {currentView === View.ADMIN_PANEL ? 'Administration' : currentView.toLowerCase().replace('_', ' ')}
          </h2>
          
          {/* Time and Market Status */}
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">
                {currentTime.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
              <span className="text-lg font-mono font-bold text-slate-900 dark:text-white leading-none">
                {currentTime.toLocaleTimeString('en-IN', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${isMarketOpen ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'}`}>
              <div className={`w-2 h-2 rounded-full ${isMarketOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-[10px] font-bold tracking-wider">
                {isMarketOpen ? 'MARKET OPEN' : 'MARKET CLOSED'}
              </span>
              {isMarketOverride && <span className="text-[9px] bg-purple-600 text-white px-1 rounded ml-1">ADMIN OVERRIDE</span>}
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="h-[calc(100vh-64px)] overflow-y-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
};