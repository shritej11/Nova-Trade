import React, { useState, useEffect } from 'react';
import { User, Stock, AdvisorReport } from '../types';
import { Card, Button, Badge } from './UI';
import { generateAdvisorReport } from '../services/geminiService';
import { 
  AcademicCapIcon, 
  LightBulbIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  ChartBarIcon,
  PresentationChartLineIcon,
  ArrowPathIcon
} from '@heroicons/react/24/solid';

interface AdvisorProps {
  user: User;
  stocks: Stock[];
}

export const Advisor: React.FC<AdvisorProps> = ({ user, stocks }) => {
  const [report, setReport] = useState<AdvisorReport | null>(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    const data = await generateAdvisorReport(user, stocks);
    setReport(data);
    setLoading(false);
  };

  // Auto-generate if first time visit and data exists
  useEffect(() => {
    if (!report && user.tradeHistory.length > 0 && Object.keys(user.portfolio).length > 0) {
      generateReport();
    }
  }, []);

  const hasActivity = user.tradeHistory.length > 0 || Object.keys(user.portfolio).length > 0;

  if (!hasActivity) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
        <div className="bg-slate-800 p-6 rounded-full mb-6">
          <AcademicCapIcon className="h-16 w-16 text-accent" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Your AI Tutor is Ready</h2>
        <p className="text-slate-400 mb-6">
          Start trading to unlock personalized insights. The AI needs to see your portfolio and trade history to give you advice.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 pb-10">
      {/* Header Section */}
      <div className="lg:col-span-3 flex justify-between items-center mb-2">
        <div>
           <h2 className="text-2xl font-bold text-white">Personalized Investment Insights</h2>
           <p className="text-slate-400 text-sm">Deep learning analysis of your portfolio and trading behavior.</p>
        </div>
        <Button onClick={generateReport} disabled={loading} className="flex items-center gap-2">
           <AcademicCapIcon className="h-5 w-5" />
           {loading ? 'Analyzing...' : 'Refresh Analysis'}
        </Button>
      </div>

      {loading && !report && (
         <div className="lg:col-span-3 py-20 text-center text-slate-500 animate-pulse flex flex-col items-center">
            <LightBulbIcon className="h-10 w-10 mb-4 text-yellow-500/50" />
            Thinking... Analyzing market correlations and your history...
         </div>
      )}

      {report && (
        <>
          {/* Portfolio Health & Risk */}
          <Card className="lg:col-span-1 bg-gradient-to-b from-slate-800 to-slate-900">
             <div className="flex items-center gap-2 mb-6">
               <ChartBarIcon className="h-5 w-5 text-accent" />
               <h3 className="font-bold text-white">Portfolio Health</h3>
             </div>
             
             <div className="space-y-6">
                <div>
                   <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-400">Risk Profile</span>
                      <span className="text-white font-bold">{report.riskProfile}</span>
                   </div>
                   <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${report.riskScore > 70 ? 'bg-red-500' : report.riskScore > 40 ? 'bg-yellow-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${report.riskScore}%` }} 
                      />
                   </div>
                   <p className="text-xs text-slate-500 mt-1 text-right">{report.riskScore}/100 Risk Score</p>
                </div>

                <div>
                   <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-400">Diversification</span>
                      <span className="text-white font-bold">{report.diversificationScore >= 70 ? 'Excellent' : report.diversificationScore >= 40 ? 'Moderate' : 'Poor'}</span>
                   </div>
                   <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500 rounded-full transition-all duration-1000"
                        style={{ width: `${report.diversificationScore}%` }} 
                      />
                   </div>
                   <p className="text-xs text-slate-500 mt-1 text-right">{report.diversificationScore}/100 Score</p>
                </div>
             </div>
          </Card>

          {/* AI Insights List */}
          <Card className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
               <LightBulbIcon className="h-5 w-5 text-yellow-400" />
               <h3 className="font-bold text-white">Smart Suggestions</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {report.portfolioInsights.map((insight, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                     <div className="flex items-start gap-3">
                        {insight.type === 'warning' && <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />}
                        {insight.type === 'suggestion' && <ArrowPathIcon className="h-5 w-5 text-blue-400 flex-shrink-0" />}
                        {insight.type === 'good' && <CheckCircleIcon className="h-5 w-5 text-emerald-400 flex-shrink-0" />}
                        <div>
                           <h4 className="text-white font-bold text-sm mb-1">{insight.title}</h4>
                           <p className="text-slate-400 text-xs leading-relaxed">{insight.description}</p>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
          </Card>

          {/* Learning Path */}
          <Card className="lg:col-span-3 bg-accent/10 border-accent/20">
             <div className="flex items-start gap-4">
                <div className="bg-accent/20 p-3 rounded-lg">
                   <AcademicCapIcon className="h-8 w-8 text-accent" />
                </div>
                <div>
                   <h3 className="text-lg font-bold text-white mb-1">Today's Learning Path: {report.learningPath.topic}</h3>
                   <p className="text-slate-300 text-sm leading-relaxed">{report.learningPath.content}</p>
                </div>
             </div>
          </Card>

          {/* Trade Reviews (The "Tutor") */}
          <div className="lg:col-span-3">
             <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <PresentationChartLineIcon className="h-6 w-6 text-slate-400" />
                Recent Trade Review
             </h3>
             <div className="space-y-4">
                {user.tradeHistory.slice(-5).reverse().map((trade) => {
                   const review = report.tradeReviews.find(r => r.tradeId === trade.id);
                   return (
                      <Card key={trade.id} className="group hover:border-slate-600 transition-colors">
                         <div className="flex flex-col md:flex-row md:items-start gap-6">
                            <div className="min-w-[150px]">
                               <div className="flex items-center gap-2 mb-1">
                                  <Badge type={trade.type === 'BUY' ? 'success' : 'danger'}>{trade.type}</Badge>
                                  <span className="text-white font-bold">{trade.symbol}</span>
                               </div>
                               <div className="text-xs text-slate-400 mb-1">{new Date(trade.timestamp).toLocaleString()}</div>
                               <div className="text-sm text-white font-mono">
                                  {trade.quantity} @ ₹{trade.price.toFixed(2)}
                               </div>
                               {trade.profitLoss !== undefined && (
                                  <div className={`text-xs font-bold mt-1 ${trade.profitLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                     {trade.profitLoss >= 0 ? '+' : ''}₹{trade.profitLoss.toFixed(2)}
                                  </div>
                               )}
                            </div>
                            
                            <div className="flex-1 border-l border-slate-800 pl-0 md:pl-6 pt-4 md:pt-0">
                               {review ? (
                                  <>
                                     <p className="text-slate-300 text-sm mb-2">
                                        <span className="text-accent font-bold">AI Analysis: </span>
                                        {review.analysis}
                                     </p>
                                     <p className="text-slate-400 text-xs bg-slate-900/50 p-2 rounded italic">
                                        <span className="text-yellow-500 not-italic font-bold">Tip: </span>
                                        {review.whatToImprove}
                                     </p>
                                  </>
                               ) : (
                                  <p className="text-slate-500 text-xs italic">Analysis pending...</p>
                               )}
                            </div>
                         </div>
                      </Card>
                   );
                })}
             </div>
          </div>
        </>
      )}
    </div>
  );
};