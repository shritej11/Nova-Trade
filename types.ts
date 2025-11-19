
export interface StockDataPoint {
  time: string;
  price: number; // Close price for line chart
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number; // Percent change
  changeAmount: number;
  sector: string;
  history: StockDataPoint[]; // Updated for charts
}

export interface Order {
  id: string;
  symbol: string;
  type: 'STOP_LOSS' | 'TAKE_PROFIT';
  triggerPrice: number;
  quantity: number;
  timestamp: string;
}

export interface Trade {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL' | 'SL_TRIGGER' | 'TP_TRIGGER';
  quantity: number;
  price: number;
  timestamp: string;
  totalValue: number;
  profitLoss?: number; // Only for SELL orders
}

export type UserRole = 'USER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'PENDING' | 'BANNED';

export interface User {
  id: string;
  username: string;
  email: string;
  balance: number;
  role: UserRole;
  status: UserStatus;
  portfolio: {
    [symbol: string]: {
      quantity: number;
      avgBuyPrice: number;
    };
  };
  activeOrders: Order[]; // New: For SL/TP
  tradeHistory: Trade[];
  kycVerified?: boolean;
  wishlist: string[]; // Array of stock symbols
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  message: string;
  status: 'OPEN' | 'RESOLVED';
  timestamp: string;
}

export interface SystemLog {
  id: string;
  action: string;
  adminId: string;
  targetId?: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  role: UserRole;
  text: string;
  timestamp: string;
  isUser: boolean; 
}

export interface NewsItem {
  headline: string;
  summary: string;
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  timestamp: string;
  relatedStock?: string;
}

export interface MarketReport {
  id: string;
  title: string;
  content: string;
  type: 'Market Summary' | 'Sector Spotlight' | 'Technical Strategy';
  timestamp: string;
}

export interface Prediction {
  symbol: string;
  prediction: 'Bullish' | 'Bearish' | 'Neutral';
  confidence: number; // 0-100
  targetPrice: number;
  reasoning: string;
  sentimentScore: number; // 0-100 (0=Extreme Fear, 100=Extreme Greed)
  technicalIndicators: {
    rsi: number;
    macd: 'Bullish' | 'Bearish' | 'Neutral';
    trend: 'Up' | 'Down' | 'Sideways';
  };
  supportLevels: number[];
  resistanceLevels: number[];
}

export interface AdvisorReport {
  riskProfile: string;
  riskScore: number; // 0-100 (0 safe, 100 risky)
  diversificationScore: number; // 0-100
  portfolioInsights: {
    title: string;
    description: string;
    type: 'warning' | 'suggestion' | 'good';
  }[];
  tradeReviews: {
    tradeId: string;
    analysis: string;
    whatToImprove: string;
  }[];
  learningPath: {
    topic: string;
    content: string;
  };
}

export enum View {
  DASHBOARD = 'DASHBOARD',
  MARKET = 'MARKET',
  NEWS = 'NEWS',
  PROFILE = 'PROFILE',
  ADVISOR = 'ADVISOR',
  ADMIN_PANEL = 'ADMIN_PANEL',
  ANALYTICS = 'ANALYTICS'
}
