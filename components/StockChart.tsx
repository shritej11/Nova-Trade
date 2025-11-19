
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
  Brush,
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
}

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
  const { x, y, width, height, low, high, open, close } = props;
  const isGreen = close >= open;
  const color = isGreen ? "#10b981" : "#ef4444";
  const ratio = Math.abs(height / (open - close)); // pixels per value unit
  
  // Calculate y positions
  // Recharts scale is inverted (0 is top)
  const yHigh = y - (high - Math.max(open, close)) * ratio; // This calculation depends heavily on YAxis domain which we don't have easy access to in custom shape props without passing scale.
  // Simplified approach: Use standard Recharts ErrorBar or rely on payload if possible.
  
  // Better approach for Custom Shape in Recharts is complex. 
  // Let's use a simpler approximation: The Bar represents the body (Open-Close).
  // We draw the wick manually relative to the body.
  
  // Actually, Recharts doesn't pass scale to custom shape easily.
  // We will use the passed 'y' and 'height' which correspond to the Bar (Body)
  // We need to manually draw the wicks based on data relative to body.
  // However, Recharts computes y/height based on the dataKey. 
  // If dataKey is 'close', y/height are for close.
  
  // Strategy: Use a Composite Chart.
  // 1. Bar for Body (top: max(open, close), bottom: min(open, close))
  // 2. ErrorBar for Wicks? No, ErrorBar is symmetric.
  // 3. We will use SVG lines inside the custom shape.
  
  // Let's trust the payload which contains the raw data
  const { payload, yAxis } = props;
  if (!payload || !yAxis) return null;

  // We need the scale function from yAxis to map values to pixels
  const yScale = yAxis.scale;
  
  const yOpen = yScale(open);
  const yClose = yScale(close);
  const yHighVal = yScale(high);
  const yLow = yScale(low);
  const bodyHeight = Math.abs(yOpen - yClose);
  const bodyY = Math.min(yOpen, yClose);

  return (
    <g>
      {/* Wick */}
      <line x1={x + width / 2} y1={yHighVal} x2={x + width / 2} y2={yLow} stroke={color} strokeWidth={1} />
      {/* Body */}
      <rect 
        x={x} 
        y={bodyY} 
        width={width} 
        height={Math.max(1, bodyHeight)} 
        fill={color} 
        stroke={color}
      />
    </g>
  );
};

const StockChart: React.FC<StockChartProps> = ({ data, color = "#3b82f6", targetPrice }) => {
  const [chartType, setChartType] = useState<'AREA' | 'CANDLE'>('AREA');
  const [indicator, setIndicator] = useState<'NONE' | 'SMA'>('NONE');

  const isPositive = data.length > 1 && data[data.length - 1].close >= data[0].close;
  const strokeColor = isPositive ? "#10b981" : "#ef4444";
  
  // Calculate domain
  const minPrice = Math.min(...data.map(d => d.low));
  const maxPrice = Math.max(...data.map(d => d.high));
  const padding = (maxPrice - minPrice) * 0.05;
  const domainMin = Math.max(0, minPrice - padding);
  const domainMax = targetPrice ? Math.max(maxPrice, targetPrice) + padding : maxPrice + padding;

  // Prepare data with indicators
  const chartData = useMemo(() => {
    if (indicator === 'SMA') {
      return calculateMA(data, 20); // 20-period SMA
    }
    return data;
  }, [data, indicator]);

  return (
    <div className="h-full w-full select-none flex flex-col">
      {/* Chart Controls */}
      <div className="flex justify-end gap-2 mb-2 px-4">
        <div className="flex bg-slate-200 dark:bg-slate-800 rounded-lg p-0.5">
          <button 
            onClick={() => setChartType('AREA')}
            className={`px-2 py-1 text-[10px] font-bold rounded ${chartType === 'AREA' ? 'bg-white dark:bg-slate-600 shadow' : 'text-slate-500'}`}
          >
            Line
          </button>
          <button 
            onClick={() => setChartType('CANDLE')}
            className={`px-2 py-1 text-[10px] font-bold rounded ${chartType === 'CANDLE' ? 'bg-white dark:bg-slate-600 shadow' : 'text-slate-500'}`}
          >
            Candle
          </button>
        </div>
        
        <div className="flex bg-slate-200 dark:bg-slate-800 rounded-lg p-0.5">
          <button 
            onClick={() => setIndicator('NONE')}
            className={`px-2 py-1 text-[10px] font-bold rounded ${indicator === 'NONE' ? 'bg-white dark:bg-slate-600 shadow' : 'text-slate-500'}`}
          >
            No Ind
          </button>
          <button 
            onClick={() => setIndicator('SMA')}
            className={`px-2 py-1 text-[10px] font-bold rounded ${indicator === 'SMA' ? 'bg-white dark:bg-slate-600 shadow' : 'text-slate-500'}`}
          >
            SMA 20
          </button>
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke="#475569" 
              opacity={0.2} 
            />
            
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                borderColor: '#334155', 
                borderRadius: '8px', 
                color: '#f1f5f9',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                fontSize: '12px'
              }}
              itemStyle={{ color: '#fff', fontWeight: 600 }}
              labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
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
              tick={{ fill: '#64748b', fontSize: 11 }}
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
                dataKey="close" // This is effectively dummy, shape handles the rest
                shape={<Candlestick />}
                isAnimationActive={false}
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

            <Brush 
              dataKey="time" 
              height={25} 
              stroke="#64748b"
              fill="rgba(30, 41, 59, 0.5)" 
              tickFormatter={() => ''}
              travellerWidth={10}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StockChart;
