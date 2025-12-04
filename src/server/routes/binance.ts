import { Hono } from "hono";

/**
 * Binance Public API Proxy Routes - Ultra-Minimal Version
 * 
 * This version is designed to be 100% bulletproof for Vercel serverless.
 * Zero external calls during initialization, all logic deferred to request time.
 */

const BINANCE_API = 'https://api.binance.com/api/v3';

/**
 * Symbol mappings from CoinGecko IDs to Binance trading pairs
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
 * IMPORTANT: No external calls during route creation
 */
export function createBinanceRoute() {
  console.log('[Binance] Creating route...');
  
  const route = new Hono();
  
  // Health check endpoint
  route.get("/health", (c) => {
    return c.json({ status: 'ok', service: 'binance-proxy' });
  });
  
  // Get markets endpoint
  route.get("/markets", async (c) => {
    try {
      console.log('[Binance] Fetching markets...');
      const limit = parseInt(c.req.query('limit') || '10');
      
      const response = await fetch(`${BINANCE_API}/ticker/24hr`);
      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status}`);
      }
      
      const tickers = await response.json();
      
      const usdtPairs = tickers
        .filter((t: any) => t.symbol && t.symbol.endsWith('USDT'))
        .sort((a: any, b: any) => parseFloat(b.quoteVolume || 0) - parseFloat(a.quoteVolume || 0))
        .slice(0, limit)
        .map((ticker: any, index: number) => {
          const symbol = ticker.symbol.replace('USDT', '');
          const coinId = symbol.toLowerCase();
          
          return {
            id: coinId,
            symbol: symbol.toLowerCase(),
            name: symbol,
            current_price: parseFloat(ticker.lastPrice || 0),
            market_cap: parseFloat(ticker.quoteVolume || 0) * 365,
            market_cap_rank: index + 1,
            total_volume: parseFloat(ticker.quoteVolume || 0),
            price_change_percentage_24h: parseFloat(ticker.priceChangePercent || 0),
            price_change_percentage_7d_in_currency: null,
            high_24h: parseFloat(ticker.highPrice || 0),
            low_24h: parseFloat(ticker.lowPrice || 0),
            ath: parseFloat(ticker.highPrice || 0),
            ath_change_percentage: parseFloat(ticker.priceChangePercent || 0),
            circulating_supply: null,
            max_supply: null,
            image: `https://assets.coincap.io/assets/icons/${symbol.toLowerCase()}@2x.png`,
            last_updated: new Date(ticker.closeTime || Date.now()).toISOString(),
          };
        });
      
      console.log(`[Binance] Returning ${usdtPairs.length} markets`);
      return c.json(usdtPairs);
      
    } catch (error) {
      console.error('[Binance] Error in /markets:', error);
      return c.json({ 
        error: 'Failed to fetch markets',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });
  
  // Get global stats endpoint
  route.get("/global", async (c) => {
    try {
      console.log('[Binance] Fetching global stats...');
      
      const response = await fetch(`${BINANCE_API}/ticker/24hr`);
      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status}`);
      }
      
      const tickers = await response.json();
      const usdtPairs = tickers.filter((t: any) => t.symbol && t.symbol.endsWith('USDT'));
      
      const totalVolume = usdtPairs.reduce((sum: number, t: any) => 
        sum + parseFloat(t.quoteVolume || 0), 0);
      
      const btc = usdtPairs.find((t: any) => t.symbol === 'BTCUSDT');
      
      const result = {
        total_market_cap: { usd: totalVolume * 10 },
        total_volume: { usd: totalVolume },
        market_cap_percentage: { btc: 45, eth: 18 },
        market_cap_change_percentage_24h_usd: btc ? parseFloat(btc.priceChangePercent || 0) : 0,
      };
      
      console.log('[Binance] Returning global stats');
      return c.json(result);
      
    } catch (error) {
      console.error('[Binance] Error in /global:', error);
      return c.json({ 
        error: 'Failed to fetch global data',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });
  
  // Get coin data endpoint
  route.get("/coin/:id", async (c) => {
    try {
      const coinId = c.req.param('id');
      console.log(`[Binance] Fetching coin data for ${coinId}...`);
      
      const symbol = SYMBOLS[coinId] || (coinId.toUpperCase() + 'USDT');
      
      const response = await fetch(`${BINANCE_API}/ticker/24hr?symbol=${symbol}`);
      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status}`);
      }
      
      const ticker = await response.json();
      const baseSymbol = symbol.replace('USDT', '');
      
      const result = {
        id: coinId,
        symbol: baseSymbol.toLowerCase(),
        name: baseSymbol,
        current_price: parseFloat(ticker.lastPrice || 0),
        market_cap: parseFloat(ticker.quoteVolume || 0) * 365,
        market_cap_rank: 0,
        total_volume: parseFloat(ticker.quoteVolume || 0),
        price_change_percentage_24h: parseFloat(ticker.priceChangePercent || 0),
        price_change_percentage_7d_in_currency: null,
        high_24h: parseFloat(ticker.highPrice || 0),
        low_24h: parseFloat(ticker.lowPrice || 0),
        ath: parseFloat(ticker.highPrice || 0),
        ath_change_percentage: parseFloat(ticker.priceChangePercent || 0),
        circulating_supply: null,
        max_supply: null,
        image: `https://assets.coincap.io/assets/icons/${baseSymbol.toLowerCase()}@2x.png`,
        last_updated: new Date(ticker.closeTime || Date.now()).toISOString(),
      };
      
      console.log(`[Binance] Returning coin data for ${coinId}`);
      return c.json(result);
      
    } catch (error) {
      console.error('[Binance] Error in /coin:', error);
      return c.json({ 
        error: 'Coin not found',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 404);
    }
  });
  
  // Search coins endpoint
  route.get("/search", async (c) => {
    try {
      const query = (c.req.query('query') || '').toLowerCase();
      console.log(`[Binance] Searching for: ${query}`);
      
      if (!query) {
        return c.json({ coins: [] });
      }
      
      const response = await fetch(`${BINANCE_API}/ticker/24hr`);
      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status}`);
      }
      
      const tickers = await response.json();
      
      const matches = tickers
        .filter((t: any) => t.symbol && t.symbol.endsWith('USDT'))
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
      
      console.log(`[Binance] Found ${matches.length} matches`);
      return c.json({ coins: matches });
      
    } catch (error) {
      console.error('[Binance] Error in /search:', error);
      return c.json({ 
        error: 'Search failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });
  
  // Get price history endpoint
  route.get("/price-history/:id", async (c) => {
    try {
      const coinId = c.req.param('id');
      const days = parseInt(c.req.query('days') || '7');
      console.log(`[Binance] Fetching price history for ${coinId}, ${days} days`);
      
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
      
      const response = await fetch(`${BINANCE_API}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status}`);
      }
      
      const klines = await response.json();
      
      const prices = klines.map((k: any) => ({
        timestamp: k[0],
        price: parseFloat(k[4])
      }));
      
      const result = {
        coinId,
        prices,
        market_caps: [],
        total_volumes: []
      };
      
      console.log(`[Binance] Returning ${prices.length} price points`);
      return c.json(result);
      
    } catch (error) {
      console.error('[Binance] Error in /price-history:', error);
      return c.json({ 
        error: 'Failed to fetch price history',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });
  
  console.log('[Binance] Route created successfully');
  return route;
}
