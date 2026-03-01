import { GoogleGenAI } from "@google/genai";
import { PortfolioItem } from '../types';

export const analyzePortfolio = async (apiKey: string, data: PortfolioItem[], customPrompt?: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key required");

  const ai = new GoogleGenAI({ apiKey });
  
  // Simplify data for token efficiency
  const summaryData = data.map(d => ({
    Symbol: d.Symbol,
    Qty: d.Quantity,
    Price: d.CurrentPrice,
    Purchase: d.PurchasePrice,
    HighLimit: d.HighLimit,
    LowLimit: d.LowLimit,
    UnrealizedPL: d.UnrealizedPL
  }));

  let finalPrompt = "";
  
  if (customPrompt) {
    finalPrompt = `
      You are an elite Financial Portfolio Analyst. 
      The user has asked the following specific question about their portfolio: "${customPrompt}"
      
      Using the provided portfolio data, answer the question accurately.
      Provide actionable advice where possible.
      Keep the response concise and use Markdown formatting.
    `;
  } else {
    finalPrompt = `
      You are an elite Financial Risk Manager and Portfolio Strategist. Analyze the provided portfolio data to provide a high-impact risk assessment.
      
      Your analysis must cover:
      1. **Concentration Risk:** Identify dangerous over-exposure to specific sectors or assets.
      2. **Performance Health:** Highlight assets with significant drawdown from Purchase Price.
      3. **Limit Analysis:** Critically evaluate assets near their 'HighLimit' (potential take-profit zone) or 'LowLimit' (potential stop-loss zone).
      
      **ACTIONABLE INSIGHTS REQUIRED:**
      Do not just list data. You must suggest concrete steps, such as:
      - "Consider hedging [Asset] due to..."
      - "Diversify holdings to reduce [Sector] exposure..."
      - "Watch [Asset] closely as it approaches Low Limit..."
      
      Format: Use Markdown with bold headers. Be concise and direct.
    `;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        ${finalPrompt}
        
        Portfolio Data:
        ${JSON.stringify(summaryData)}
      `,
    });

    return response.text || "Analysis complete.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating analysis. Please check your API Key.";
  }
};

export interface MarketNewsResponse {
  gainers: Array<{symbol: string, change: string, reason: string}>;
  losers: Array<{symbol: string, change: string, reason: string}>;
}

export const fetchMarketNews = async (apiKey: string): Promise<MarketNewsResponse | null> => {
  if (!apiKey) return null;
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Find the top 3 stock market gainers and top 3 losers for today in the US market. 
    Focus on large cap or currently trending stocks with significant movement.
    
    Return a valid JSON object with exactly two keys: "gainers" and "losers".
    Each value should be an array of objects containing:
    - "symbol" (e.g. NVDA)
    - "change" (e.g. +12.5% or -8.2%)
    - "reason" (A very brief, max 10 words explanation of why it moved, based on Google Finance news)
    
    Ensure the JSON is raw and parsable.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}],
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as MarketNewsResponse;
  } catch (error) {
    console.error("News Fetch Error:", error);
    return null;
  }
};