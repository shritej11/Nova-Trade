
import React, { useEffect, useState } from 'react';
import { NewsItem, Stock, MarketReport } from '../types';
import { generateMarketNews, generateMarketReports } from '../services/geminiService';
import { Card, Badge, Button } from './UI';
import { ArrowPathIcon, DocumentTextIcon, NewspaperIcon, FireIcon } from '@heroicons/react/24/solid';

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
    
    // Fetch both in parallel
    const [newsData, reportsData] = await Promise.all([
      generateMarketNews(stocks),
      generateMarketReports(stocks)
    ]);

    setNews(newsData);
    setReports(reportsData);
    setLoading(false);
  };

  useEffect(() => {
    // Initial fetch if data not present
    if (stocks.length > 0 && news.length === 0) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stocks.length]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Market Intelligence Hub</h2>
          <p className="text-slate-400">Deep dive analysis and real-time updates.</p>
        </div>
        <Button onClick={fetchData} disabled={loading} variant="secondary" className="flex items-center gap-2">
          <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Intelligence
        </Button>
      </div>

      {loading && news.length === 0 && (
        <div className="py-20 text-center text-slate-500 animate-pulse flex flex-col items-center">
           <DocumentTextIcon className="h-12 w-12 mb-4 opacity-50" />
           <p>Aggregating global data...</p>
           <p className="text-xs">Generating reports & news headlines</p>
        </div>
      )}

      {/* Daily Reports Section */}
      {!loading && reports.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white border-b border-slate-800 pb-2">
             <DocumentTextIcon className="h-5 w-5 text-accent" />
             <h3 className="text-lg font-bold">Daily Research Reports</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reports.map((report, idx) => (
              <Card key={idx} className="bg-slate-900 border border-slate-800 relative overflow-hidden group">
                 <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500" />
                 <div className="mb-3">
                    <div className="flex justify-between items-start">
                       <Badge type="neutral">{report.type}</Badge>
                       <span className="text-[10px] text-slate-500">{report.timestamp}</span>
                    </div>
                    <h4 className="font-bold text-white mt-2 text-lg leading-snug group-hover:text-accent transition-colors">{report.title}</h4>
                 </div>
                 <p className="text-slate-300 text-sm leading-relaxed line-clamp-6">
                    {report.content}
                 </p>
                 <button className="mt-4 text-xs text-accent hover:underline font-bold">Read Full Analysis →</button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Live News Feed Section */}
      {(!loading || news.length > 0) && (
         <div className="space-y-4">
            <div className="flex items-center gap-2 text-white border-b border-slate-800 pb-2 mt-8">
               <NewspaperIcon className="h-5 w-5 text-emerald-400" />
               <h3 className="text-lg font-bold">Live News Wire</h3>
               <span className="text-xs text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full ml-2">{news.length} updates</span>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {news.map((item, idx) => (
                <Card key={idx} className="hover:bg-slate-800/80 transition-colors border-l-2 border-l-transparent hover:border-l-emerald-500 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {item.relatedStock && <span className="text-[10px] font-bold bg-slate-700 text-white px-1.5 rounded">{item.relatedStock}</span>}
                      <span className="text-xs text-slate-500">{item.timestamp}</span>
                      <Badge type={item.sentiment === 'Positive' ? 'success' : item.sentiment === 'Negative' ? 'danger' : 'neutral'}>
                        {item.sentiment}
                      </Badge>
                    </div>
                    <h3 className="text-base font-bold text-white mb-2 leading-snug">{item.headline}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed line-clamp-2">{item.summary}</p>
                  </div>
                  <div className="mt-3 flex justify-end">
                     {item.sentiment === 'Negative' && <FireIcon className="h-4 w-4 text-red-500/50" />}
                  </div>
                </Card>
              ))}
            </div>
         </div>
      )}
    </div>
  );
};
