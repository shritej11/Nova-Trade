
import React, { useEffect, useState } from 'react';
import { NewsItem, Stock, MarketReport } from '../types';
import { generateMarketNews, generateMarketReports } from '../services/geminiService';
import { Card, Badge, Button } from './UI';
import { ArrowPathIcon, DocumentTextIcon, NewspaperIcon, FireIcon, PresentationChartLineIcon } from '@heroicons/react/24/solid';

interface NewsFeedProps {
  stocks: Stock[];
}

export const NewsFeed: React.FC<NewsFeedProps> = ({ stocks }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [reports, setReports] = useState<MarketReport[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (stocks.length === 0) return;
    setLoading(true);
    
    const [newsData, reportsData] = await Promise.all([
      generateMarketNews(stocks),
      generateMarketReports(stocks)
    ]);

    setNews(newsData);
    setReports(reportsData);
    setLoading(false);
  };

  useEffect(() => {
    if (stocks.length > 0 && news.length === 0) {
      fetchData();
    }
  }, [stocks.length]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10 animate-fade-in">
      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Market Intelligence Hub</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">AI-powered insights, real-time alerts, and deep dive reports.</p>
        </div>
        <Button onClick={fetchData} disabled={loading} variant="primary" className="flex items-center gap-2 shadow-lg shadow-blue-500/20">
          <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Analyzing...' : 'Refresh Intel'}
        </Button>
      </div>

      {loading && news.length === 0 && (
        <div className="py-24 text-center flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
           <div className="relative mb-4">
             <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
             <DocumentTextIcon className="h-16 w-16 text-accent relative z-10 animate-bounce" />
           </div>
           <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Aggregating Global Data</h3>
           <p className="text-slate-500 text-sm">Scanning headlines, generating reports, and analyzing sentiment...</p>
        </div>
      )}

      {/* Daily Reports Section */}
      {!loading && reports.length > 0 && (
        <div className="space-y-5">
          <div className="flex items-center gap-2 pb-2">
             <PresentationChartLineIcon className="h-6 w-6 text-purple-500" />
             <h3 className="text-xl font-bold text-slate-900 dark:text-white">Deep Dive Reports</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reports.map((report, idx) => (
              <div key={idx} className="flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                 {/* Card Header with Gradient */}
                 <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
                 
                 <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                       <Badge type="neutral" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {report.type}
                       </Badge>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{report.timestamp}</span>
                    </div>
                    
                    <h4 className="font-bold text-slate-900 dark:text-white text-xl mb-3 leading-tight group-hover:text-accent transition-colors">
                      {report.title}
                    </h4>
                    
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed flex-1">
                       {report.content}
                    </p>
                    
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                       <span className="text-xs text-slate-400 font-medium">AI Generated Analysis</span>
                       <button className="text-sm font-bold text-accent hover:text-blue-700 dark:hover:text-blue-400 flex items-center gap-1">
                          Read Full Report <span className="text-lg leading-none">→</span>
                       </button>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live News Feed Section */}
      {(!loading || news.length > 0) && (
         <div className="space-y-5 mt-8">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
               <div className="flex items-center gap-2">
                  <NewspaperIcon className="h-6 w-6 text-emerald-500" />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Live News Wire</h3>
               </div>
               <span className="text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 animate-pulse">
                  LIVE UPDATES
               </span>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {news.map((item, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700 flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {item.relatedStock && (
                        <span className="text-[10px] font-black bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-2 py-0.5 rounded uppercase tracking-wide">
                          {item.relatedStock}
                        </span>
                      )}
                      <Badge type={item.sentiment === 'Positive' ? 'success' : item.sentiment === 'Negative' ? 'danger' : 'neutral'}>
                        {item.sentiment}
                      </Badge>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-slate-400" /> {item.timestamp}
                      </span>
                    </div>
                    {item.sentiment === 'Negative' && <FireIcon className="h-5 w-5 text-red-500 opacity-80" />}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 leading-snug">
                    {item.headline}
                  </h3>
                  
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                    {item.summary}
                  </p>
                </div>
              ))}
            </div>
         </div>
      )}
    </div>
  );
};
