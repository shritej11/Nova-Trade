
import React, { useState, useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine, 
  CartesianGrid,
  ComposedChart,
  Bar,
  Line
} from 'recharts';
import { StockDataPoint } from '../types';
import { Button } from './UI';

interface StockChartProps {
  data: StockDataPoint[];
  color?: string;
  targetPrice?: number;
  theme?: string;
}

type TimeFrame = '5M' | '10M' | '30M' | '1H';

// Helper to calculate Moving Average
const calculateMA = (data: StockDataPoint[], period: number) => {
  return data.map((item, index, array) => {
    if (index < period - 1) return { ...item, ma: null };
    const slice = array.slice(index - period + 1, index + 1);
    const sum = slice.reduce((acc, curr) => acc + curr.close, 0);
    return { ...item, ma: sum / period };
  });
};

// Custom Candlestick Shape
const Candlestick = (props: any) => {
  const { x, y, width, height, payload, yAxis } = props;
  
  // Critical Fix: Access OHLC from payload, not top-level props
  if (!payload || !yAxis) return null;
  const { open, high, low, close } = payload;

  const isGreen = close >= open;
  const color = isGreen ? "#10b981" : "#ef4444"; // Emerald-500 : Red-500
  
  const yScale = yAxis.scale;
  
  const yOpen = yScale(open);
  const yClose = yScale(close);
  const yHighVal = yScale(high);
  const yLow = yScale(low);
  
  const bodyHeight = Math.max(2, Math.abs(yOpen - yClose)); // Ensure at least 2px height to be visible
  const bodyY = Math.min(yOpen, yClose);

  return (
    <g>
      {/* Wick */}
      <line 
        x1={x + width / 2} 
        y1={yHighVal} 
        x2={x + width / 2} 
        y2={yLow} 
        stroke={color} 
        strokeWidth={1.5} 
      />
      {/* Body */}
      <rect 
        x={x} 
        y={bodyY} 
        width={width} 
        height={bodyHeight} 
        fill={color} 
        stroke={color}
      />
    </g>
  );
};

const StockChart: React.FC<StockChartProps> = ({ data, color = "#3b82f6", targetPrice, theme = 'light' }) => {
  const [chartType, setChartType] = useState<'AREA' | 'CANDLE'>('CANDLE');
  const [indicator, setIndicator] = useState<'NONE' | 'SMA'>('NONE');
  const [timeframe, setTimeframe] = useState<TimeFrame>('5M');

  const isPositive = data.length > 1 && data[data.length - 1].close >= data[0].close;
  const strokeColor = isPositive ? "#10b981" : "#ef4444";
  
  // Filter data based on timeframe logic (Simulated based on data points)
  // 1 tick = 2 seconds
  // 5M = 300s = 150 ticks
  // 10M = 600s = 300 ticks
  // 30M = 1800s = 900 ticks
  // 1H = 3600s = 1800 ticks
  const filteredData = useMemo(() => {
    // If we don't have enough data, show everything we have
    // Otherwise, slice the last N ticks to simulate "Zoom"
    let ticks = 150; // default 5M
    switch(timeframe) {
      case '5M': ticks = 150; break;
      case '10M': ticks = 300; break;
      case '30M': ticks = 900; break;
      case '1H': ticks = 1800; break;
    }
    return data.length > ticks ? data.slice(data.length - ticks) : data;
  }, [data, timeframe]);

  // Calculate domain for Y-Axis
  const minPrice = Math.min(...filteredData.map(d => d.low));
  const maxPrice = Math.max(...filteredData.map(d => d.high));
  const padding = (maxPrice - minPrice) * 0.1; // 10% padding
  const domainMin = Math.max(0, minPrice - padding);
  const domainMax = targetPrice ? Math.max(maxPrice, targetPrice) + padding : maxPrice + padding;

  // Dynamic Theme Colors
  const isDark = theme === 'dark';
  const axisColor = isDark ? '#64748b' : '#94a3b8';
  const gridColor = isDark ? '#475569' : '#e2e8f0';
  const tooltipBg = isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)';
  const tooltipBorder = isDark ? '#334155' : '#cbd5e1';
  const tooltipText = isDark ? '#f1f5f9' : '#0f172a';

  // Prepare data with indicators
  const chartData = useMemo(() => {
    if (indicator === 'SMA') {
      return calculateMA(filteredData, 20); // 20-period SMA
    }
    return filteredData;
  }, [filteredData, indicator]);

  const ChartToggle = ({ active, label, onClick, className = '' }: any) => (
    <button 
      onClick={onClick}
      className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${active ? 'bg-white dark:bg-slate-600 shadow text-slate-900 dark:text-white border border-slate-200 dark:border-slate-500' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'} ${className}`}
    >
      {label}
    </button>
  );

  // If no data, show empty state
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-slate-400">Loading chart data...</div>;
  }

  return (
    <div className="h-full w-full select-none flex flex-col">
      {/* Chart Controls Toolbar (Top) - Just Indicators & Types */}
      <div className="flex justify-end items-center mb-2 px-2 gap-2">
        {/* Chart Type */}
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
          <ChartToggle active={chartType === 'AREA'} label="Line" onClick={() => setChartType('AREA')} />
          <ChartToggle active={chartType === 'CANDLE'} label="Candle" onClick={() => setChartType('CANDLE')} />
        </div>
        
        {/* Indicators */}
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
          <ChartToggle active={indicator === 'NONE'} label="No Ind" onClick={() => setIndicator('NONE')} />
          <ChartToggle active={indicator === 'SMA'} label="SMA 20" onClick={() => setIndicator('SMA')} />
        </div>
      </div>

      <div className="flex-1 min-h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke={gridColor} 
              opacity={0.5} 
            />
            
            <Tooltip 
              contentStyle={{ 
                backgroundColor: tooltipBg, 
                borderColor: tooltipBorder, 
                borderRadius: '8px', 
                color: tooltipText,
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                fontSize: '12px'
              }}
              itemStyle={{ color: tooltipText, fontWeight: 600 }}
              labelStyle={{ color: axisColor, marginBottom: '4px' }}
              formatter={(value: number, name: string) => {
                if (name === 'ma') return [`₹${value.toFixed(2)}`, 'SMA (20)'];
                if (name === 'open') return [`₹${value.toFixed(2)}`, 'Open'];
                if (name === 'high') return [`₹${value.toFixed(2)}`, 'High'];
                if (name === 'low') return [`₹${value.toFixed(2)}`, 'Low'];
                if (name === 'close') return [`₹${value.toFixed(2)}`, 'Close'];
                return [`₹${value.toFixed(2)}`, 'Price'];
              }}
              labelFormatter={(label) => `Time: ${label}`}
            />
            
            <XAxis dataKey="time" hide={true} />
            
            <YAxis 
              domain={[domainMin, domainMax]} 
              orientation="right" 
              tick={{ fill: axisColor, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) => `₹${val.toFixed(0)}`}
              width={45}
            />
            
            {chartType === 'AREA' && (
              <Area 
                type="monotone" 
                dataKey="close" 
                stroke={strokeColor} 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorPrice)" 
                isAnimationActive={false}
              />
            )}

            {chartType === 'CANDLE' && (
              <Bar
                dataKey="close" 
                shape={<Candlestick />}
                isAnimationActive={false}
                minPointSize={1}
              />
            )}

            {indicator === 'SMA' && (
               <Line 
                 type="monotone" 
                 dataKey="ma" 
                 stroke="#fbbf24" 
                 strokeWidth={2} 
                 dot={false}
                 isAnimationActive={false}
               />
            )}
            
            {targetPrice && (
              <ReferenceLine 
                y={targetPrice} 
                stroke="#eab308" 
                strokeDasharray="3 3"
                label={{ position: 'insideRight', value: 'AI Target', fill: '#eab308', fontSize: 10, fontWeight: 'bold' }} 
              />
            )}

          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Toolbar: Timeframe Selection (Replaces Brush) */}
      <div className="mt-3 px-4 flex justify-center">
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 w-full max-w-md shadow-sm border border-slate-200 dark:border-slate-700">
          <ChartToggle active={timeframe === '5M'} label="5M" onClick={() => setTimeframe('5M')} className="flex-1 text-center" />
          <ChartToggle active={timeframe === '10M'} label="10M" onClick={() => setTimeframe('10M')} className="flex-1 text-center" />
          <ChartToggle active={timeframe === '30M'} label="30M" onClick={() => setTimeframe('30M')} className="flex-1 text-center" />
          <ChartToggle active={timeframe === '1H'} label="1H" onClick={() => setTimeframe('1H')} className="flex-1 text-center" />
        </div>
      </div>
    </div>
  );
};

export default StockChart;
