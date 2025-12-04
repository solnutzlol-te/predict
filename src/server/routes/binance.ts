import { Hono } from "hono";

/**
 * Binance Public API Proxy Routes - Simplified Version
 * 
 * This is a simplified version to avoid compilation issues.
 * Uses minimal dependencies and straightforward logic.
 */

const BINANCE_API = 'https://api.binance.com/api/v3';
const CACHE_TTL = 30000; // 30 seconds

// Simple cache
const cache = new Map<string, { data: any; timestamp: number }>();

/**
 * Fetches data from Binance API with caching
 */
async function fetchBinance(endpoint: string): Promise<any> {
  const key = `binance:${endpoint}`;
  const cached = cache.get(key);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.data;
  }
  
  const response = await fetch(`${BINANCE_API}${endpoint}`);
  if (!response.ok) {
    throw new Error(`Binance API error: ${response.status}`);
  }
  
  const data = await response.json();
  cache.set(key, { data, timestamp: Date.now() });
  
  return data;
}

/**
 * Symbol mappings
 */
const SYMBOLS: Record<string, string> = {
  'bitcoin': 'BTCUSDT',
  'ethereum': 'ETHUSDT',
  'binancecoin': 'BNBUSDT',
  'ripple': 'XRPUSDT',
  'cardano': 'ADAUSDT',
  'solana': 'SOLUSDT',
  'polkadot': 'DOTUSDT',
  'dogecoin': 'DOGEUSDT',
  'polygon': 'MATICUSDT',
  'tron': 'TRXUSDT',
  'avalanche-2': 'AVAXUSDT',
  'chainlink': 'LINKUSDT',
  'uniswap': 'UNIUSDT',
  'litecoin': 'LTCUSDT',
  'cosmos': 'ATOMUSDT',
  'stellar': 'XLMUSDT',
  'bitcoin-cash': 'BCHUSDT',
  'ethereum-classic': 'ETCUSDT',
  'algorand': 'ALGOUSDT',
  'filecoin': 'FILUSDT',
  'near': 'NEARUSDT',
  'vechain': 'VETUSDT',
  'hedera-hashgraph': 'HBARUSDT',
  'internet-computer': 'ICPUSDT',
  'aptos': 'APTUSDT',
  'arbitrum': 'ARBUSDT',
  'optimism': 'OPUSDT',
  'the-open-network': 'TONUSDT',
  'sui': 'SUIUSDT',
  'pepe': 'PEPEUSDT',
  'immutable-x': 'IMXUSDT',
  'aave': 'AAVEUSDT',
  'maker': 'MKRUSDT',
};

/**
 * Creates Binance API routes
 */
export function createBinanceRoute() {
  const route = new Hono();
  
  // Get markets
  route.get("/markets", async (c) => {
    try {
      const limit = parseInt(c.req.query('limit') || '10');
      const tickers = await fetchBinance('/ticker/24hr');
      
      const usdtPairs = tickers
        .filter((t: any) => t.symbol.endsWith('USDT'))
        .sort((a: any, b: any) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
        .slice(0, limit)
        .map((ticker: any, index: number) => {
          const symbol = ticker.symbol.replace('USDT', '');
          const coinId = symbol.toLowerCase();
          
          return {
            id: coinId,
            symbol: symbol.toLowerCase(),
            name: symbol,
            current_price: parseFloat(ticker.lastPrice),
            market_cap: parseFloat(ticker.quoteVolume) * 365,
            market_cap_rank: index + 1,
            total_volume: parseFloat(ticker.quoteVolume),
            price_change_percentage_24h: parseFloat(ticker.priceChangePercent),
            price_change_percentage_7d_in_currency: null,
            high_24h: parseFloat(ticker.highPrice),
            low_24h: parseFloat(ticker.lowPrice),
            ath: parseFloat(ticker.highPrice),
            ath_change_percentage: parseFloat(ticker.priceChangePercent),
            circulating_supply: null,
            max_supply: null,
            image: `https://assets.coincap.io/assets/icons/${symbol.toLowerCase()}@2x.png`,
            last_updated: new Date(ticker.closeTime).toISOString(),
          };
        });
      
      return c.json(usdtPairs);
    } catch (error) {
      console.error('[Binance] Error in /markets:', error);
      return c.json({ error: 'Failed to fetch markets' }, 500);
    }
  });
  
  // Get global stats
  route.get("/global", async (c) => {
    try {
      const tickers = await fetchBinance('/ticker/24hr');
      const usdtPairs = tickers.filter((t: any) => t.symbol.endsWith('USDT'));
      
      const totalVolume = usdtPairs.reduce((sum: number, t: any) => 
        sum + parseFloat(t.quoteVolume), 0);
      
      const btc = usdtPairs.find((t: any) => t.symbol === 'BTCUSDT');
      
      return c.json({
        total_market_cap: { usd: totalVolume * 10 },
        total_volume: { usd: totalVolume },
        market_cap_percentage: { btc: 45, eth: 18 },
        market_cap_change_percentage_24h_usd: btc ? parseFloat(btc.priceChangePercent) : 0,
      });
    } catch (error) {
      console.error('[Binance] Error in /global:', error);
      return c.json({ error: 'Failed to fetch global data' }, 500);
    }
  });
  
  // Get coin data
  route.get("/coin/:id", async (c) => {
    try {
      const coinId = c.req.param('id');
      const symbol = SYMBOLS[coinId] || (coinId.toUpperCase() + 'USDT');
      
      const ticker = await fetchBinance(`/ticker/24hr?symbol=${symbol}`);
      const baseSymbol = symbol.replace('USDT', '');
      
      return c.json({
        id: coinId,
        symbol: baseSymbol.toLowerCase(),
        name: baseSymbol,
        current_price: parseFloat(ticker.lastPrice),
        market_cap: parseFloat(ticker.quoteVolume) * 365,
        market_cap_rank: 0,
        total_volume: parseFloat(ticker.quoteVolume),
        price_change_percentage_24h: parseFloat(ticker.priceChangePercent),
        price_change_percentage_7d_in_currency: null,
        high_24h: parseFloat(ticker.highPrice),
        low_24h: parseFloat(ticker.lowPrice),
        ath: parseFloat(ticker.highPrice),
        ath_change_percentage: parseFloat(ticker.priceChangePercent),
        circulating_supply: null,
        max_supply: null,
        image: `https://assets.coincap.io/assets/icons/${baseSymbol.toLowerCase()}@2x.png`,
        last_updated: new Date(ticker.closeTime).toISOString(),
      });
    } catch (error) {
      console.error('[Binance] Error in /coin:', error);
      return c.json({ error: 'Coin not found' }, 404);
    }
  });
  
  // Search coins
  route.get("/search", async (c) => {
    try {
      const query = (c.req.query('query') || '').toLowerCase();
      if (!query) {
        return c.json({ coins: [] });
      }
      
      const tickers = await fetchBinance('/ticker/24hr');
      const matches = tickers
        .filter((t: any) => t.symbol.endsWith('USDT'))
        .filter((t: any) => {
          const symbol = t.symbol.replace('USDT', '').toLowerCase();
          return symbol.includes(query);
        })
        .slice(0, 20)
        .map((t: any) => {
          const symbol = t.symbol.replace('USDT', '');
          return {
            id: symbol.toLowerCase(),
            name: symbol,
            symbol: symbol.toLowerCase(),
            market_cap_rank: 0,
            thumb: `https://assets.coincap.io/assets/icons/${symbol.toLowerCase()}@2x.png`,
            large: `https://assets.coincap.io/assets/icons/${symbol.toLowerCase()}@2x.png`,
          };
        });
      
      return c.json({ coins: matches });
    } catch (error) {
      console.error('[Binance] Error in /search:', error);
      return c.json({ error: 'Search failed' }, 500);
    }
  });
  
  // Get price history
  route.get("/price-history/:id", async (c) => {
    try {
      const coinId = c.req.param('id');
      const days = parseInt(c.req.query('days') || '7');
      const symbol = SYMBOLS[coinId] || (coinId.toUpperCase() + 'USDT');
      
      let interval = '1h';
      let limit = days * 24;
      
      if (days === 1) {
        interval = '15m';
        limit = 96;
      } else if (days <= 7) {
        interval = '1h';
      } else if (days <= 30) {
        interval = '4h';
        limit = days * 6;
      } else {
        interval = '1d';
        limit = days;
      }
      
      const klines = await fetchBinance(`/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
      
      const prices = klines.map((k: any) => ({
        timestamp: k[0],
        price: parseFloat(k[4])
      }));
      
      return c.json({
        coinId,
        prices,
        market_caps: [],
        total_volumes: []
      });
    } catch (error) {
      console.error('[Binance] Error in /price-history:', error);
      return c.json({ error: 'Failed to fetch price history' }, 500);
    }
  });
  
  return route;
}
