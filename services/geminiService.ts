
import { GoogleGenAI, Type } from "@google/genai";
import { Stock, NewsItem, Prediction, User, AdvisorReport, MarketReport } from "../types";

// Initialize Gemini Client
// process.env.API_KEY is injected by the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateMarketNews = async (stocks: Stock[]): Promise<NewsItem[]> => {
  try {
    // Optimization: Select a subset of stocks (e.g., top 15 random or volatile) 
    const shuffled = [...stocks].sort(() => 0.5 - Math.random());
    const selectedStocks = shuffled.slice(0, 15);
    
    const stockList = selectedStocks.map(s => `${s.symbol} (₹${s.price.toFixed(2)}, ${s.change >= 0 ? '+' : ''}${s.change.toFixed(2)}%)`).join(', ');
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate 8 distinct, realistic financial news snippets based on these Indian market stocks: ${stockList}. 
      Mix corporate announcements, earnings rumors, and sector trends. Make them sound like real-time NSE/BSE flashes.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              headline: { type: Type.STRING },
              summary: { type: Type.STRING },
              sentiment: { type: Type.STRING, enum: ['Positive', 'Negative', 'Neutral'] },
              timestamp: { type: Type.STRING, description: "Use realistic time like '2 mins ago'" },
              relatedStock: { type: Type.STRING }
            },
            required: ['headline', 'summary', 'sentiment', 'timestamp']
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as NewsItem[];
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch news:", error);
    return [];
  }
};

export const generateMarketReports = async (stocks: Stock[]): Promise<MarketReport[]> => {
  try {
    const topGainers = [...stocks].sort((a,b) => b.change - a.change).slice(0, 3);
    const topLosers = [...stocks].sort((a,b) => a.change - b.change).slice(0, 3);
    
    const summaryData = `
      Top Gainers: ${topGainers.map(s => s.symbol).join(', ')}
      Top Losers: ${topLosers.map(s => s.symbol).join(', ')}
      Total Stocks Tracked: ${stocks.length}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Based on this market data: ${summaryData}, generate 3 distinct market reports:
      1. 'Market Summary': A general overview of today's market sentiment in India.
      2. 'Sector Spotlight': Pick a random sector (IT, Banking, Auto, etc.) and write a brief analysis.
      3. 'Technical Strategy': A generic technical trading tip for the day.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              content: { type: Type.STRING },
              type: { type: Type.STRING, enum: ['Market Summary', 'Sector Spotlight', 'Technical Strategy'] },
              timestamp: { type: Type.STRING }
            },
            required: ['id', 'title', 'content', 'type', 'timestamp']
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as MarketReport[];
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch reports:", error);
    return [];
  }
};

export const predictStockPrice = async (stock: Stock): Promise<Prediction | null> => {
  try {
    // Simplify history for prompt token efficiency
    const historyStr = stock.history.slice(-20).map(h => h.price.toFixed(2)).join(', ');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Perform a deep technical analysis on ${stock.name} (${stock.symbol}).
      Current Price: ₹${stock.price}.
      Recent Price History (last 20 ticks): [${historyStr}].
      
      Provide:
      1. Prediction (Bullish/Bearish/Neutral)
      2. Confidence Level
      3. A specific price target
      4. Reasoning based on patterns (e.g., Head and Shoulders, Support bounce)
      5. Simulated Technical Indicators (RSI, MACD state)
      6. Sentiment Score (0-100, where <30 is Fear, >70 is Greed)
      7. Key Support and Resistance levels near current price.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            symbol: { type: Type.STRING },
            prediction: { type: Type.STRING, enum: ['Bullish', 'Bearish', 'Neutral'] },
            confidence: { type: Type.NUMBER, description: "Percentage 0-100" },
            targetPrice: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
            sentimentScore: { type: Type.NUMBER, description: "0 to 100" },
            technicalIndicators: {
              type: Type.OBJECT,
              properties: {
                rsi: { type: Type.NUMBER },
                macd: { type: Type.STRING, enum: ['Bullish', 'Bearish', 'Neutral'] },
                trend: { type: Type.STRING, enum: ['Up', 'Down', 'Sideways'] }
              },
              required: ['rsi', 'macd', 'trend']
            },
            supportLevels: { type: Type.ARRAY, items: { type: Type.NUMBER } },
            resistanceLevels: { type: Type.ARRAY, items: { type: Type.NUMBER } }
          },
          required: ['symbol', 'prediction', 'confidence', 'targetPrice', 'reasoning', 'sentimentScore', 'technicalIndicators', 'supportLevels', 'resistanceLevels']
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as Prediction;
    }
    return null;
  } catch (error) {
    console.error("Prediction failed:", error);
    return null;
  }
};

export const generateAdvisorReport = async (user: User, stocks: Stock[]): Promise<AdvisorReport | null> => {
  try {
    const portfolioSummary = Object.entries(user.portfolio).map(([symbol, data]) => {
      const stock = stocks.find(s => s.symbol === symbol);
      return {
        symbol,
        qty: data.quantity,
        avgPrice: data.avgBuyPrice,
        currentPrice: stock?.price || 0,
        sector: stock?.sector || 'Unknown'
      };
    });

    // Get last 5 trades
    const recentTrades = user.tradeHistory.slice(-5);

    const prompt = `
      Act as an expert AI Financial Tutor and Portfolio Manager.
      
      USER PORTFOLIO:
      ${JSON.stringify(portfolioSummary)}

      RECENT TRADES:
      ${JSON.stringify(recentTrades)}

      Analyze the user's trading behavior and portfolio health.
      1. Determine risk profile (Conservative, Balanced, Aggressive).
      2. Score diversification (0-100).
      3. Provide specific insights: e.g., "Too much tech exposure", "Good profit taking on TCS".
      4. Review the recent trades: Explain WHY they were good or bad moves based on general market principles (buy low/sell high, emotional trading checks).
      5. Create a short 'Learning Path' topic based on their activity.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskProfile: { type: Type.STRING },
            riskScore: { type: Type.NUMBER },
            diversificationScore: { type: Type.NUMBER },
            portfolioInsights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['warning', 'suggestion', 'good'] }
                }
              }
            },
            tradeReviews: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  tradeId: { type: Type.STRING },
                  analysis: { type: Type.STRING },
                  whatToImprove: { type: Type.STRING }
                }
              }
            },
            learningPath: {
              type: Type.OBJECT,
              properties: {
                topic: { type: Type.STRING },
                content: { type: Type.STRING }
              }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AdvisorReport;
    }
    return null;
  } catch (error) {
    console.error("Advisor report generation failed:", error);
    return null;
  }
};

export const fetchRealTimePrices = async (symbols: string[]): Promise<{ prices: {symbol: string, price: number}[], sources: {title: string, uri: string}[] }> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Find the current real-time trading price in Indian Rupee (INR) for these NSE/BSE stocks: ${symbols.join(', ')}. 
      Do not return simulated or old data. Use Google Search to find the latest price.
      Return the output strictly as a valid JSON array of objects with 'symbol' (string) and 'price' (number) keys.
      Example: [{"symbol": "TCS", "price": 3500.00}, {"symbol": "RELIANCE", "price": 2400.50}]`,
      config: {
        tools: [{ googleSearch: {} }],
        // Note: responseMimeType is NOT allowed with googleSearch
      },
    });

    let prices: {symbol: string, price: number}[] = [];
    
    if (response.text) {
      try {
        // Use a more robust cleaning method to handle Markdown code blocks
        let cleanText = response.text;
        
        // Remove Markdown code block symbols if present (```json ... ```)
        if (cleanText.includes("```")) {
          cleanText = cleanText.replace(/```(?:json)?/g, "").replace(/```/g, "");
        }
        
        // Find array part
        const jsonMatch = cleanText.match(/\[[\s\S]*\]/);
        
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            // Validate it's an array
            if (Array.isArray(parsed)) {
              prices = parsed;
            }
        } else {
            console.warn("No JSON array found in response text:", response.text);
        }
      } catch (e) {
        console.error("Failed to parse price JSON", e);
      }
    }

    // Extract Grounding Sources (Required by Gemini API Policy)
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => {
        if (chunk.web) return { title: chunk.web.title, uri: chunk.web.uri };
        return null;
      })
      .filter((s: any) => s !== null) as {title: string, uri: string}[] || [];

    return { prices, sources };
  } catch (error) {
    console.error("Real-time fetch failed:", error);
    return { prices: [], sources: [] };
  }
};
