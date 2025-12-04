import { Hono } from "hono";

/**
 * Binance Public API Proxy Routes
 * 
 * This route acts as a backend proxy for all Binance Public API calls.
 * 
 * Why Binance over CoinGecko:
 * - ✅ 1200 requests/minute (vs CoinGecko's ~50/minute)
 * - ✅ No API key required
 * - ✅ Real-time exchange data
 * - ✅ Very reliable and fast
 * - ✅ Completely free
 * 
 * API Documentation: https://binance-docs.github.io/apidocs/spot/en/
 */

const BINANCE_API = 'https://api.binance.com/api/v3';

// Simple in-memory cache with TTL
interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 30000; // 30 seconds

/**
 * Gets data from cache if valid, otherwise returns null
 */
function getCached(key: string): any | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  const age = Date.now() - entry.timestamp;
  if (age > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

/**
 * Stores data in cache
 */
function setCache(key: string, data: any): void {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

/**
 * Makes a request to Binance API with caching
 */
async function fetchFromBinance(endpoint: string): Promise<any> {
  const cacheKey = `binance:${endpoint}`;
  
  // Check cache first
  const cached = getCached(cacheKey);
  if (cached) {
    console.log('[Binance API] Cache hit:', endpoint);
    return cached;
  }
  
  console.log('[Binance API] Fetching from Binance:', endpoint);
  
  try {
    const url = `${BINANCE_API}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Cache the result
    setCache(cacheKey, data);
    
    return data;
  } catch (error) {
    console.error('[Binance API] Error fetching:', endpoint, error);
    throw error;
  }
}

/**
 * Symbol mapping from common names to Binance trading pairs
 * Maps CoinGecko IDs to Binance symbols
 */
const SYMBOL_MAP: Record<string, string> = {
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
  'monero': 'XMRUSDT',
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
  'eos': 'EOSUSDT',
  'the-graph': 'GRTUSDT',
  'tezos': 'XTZUSDT',
  'decentraland': 'MANAUSDT',
  'the-sandbox': 'SANDUSDT',
  'axie-infinity': 'AXSUSDT',
  'zcash': 'ZECUSDT',
  'fantom': 'FTMUSDT',
  'kucoin-shares': 'KCSUSDT',
  'neo': 'NEOUSDT',
  'curve-dao-token': 'CRVUSDT',
  'gala': 'GALAUSDT',
  'enjincoin': 'ENJUSDT'
};

/**
 * Converts Binance symbol to CoinGecko-style ID
 */
function binanceSymbolToCoinId(symbol: string): string {
  // Remove USDT suffix
  const baseSymbol = symbol.replace('USDT', '').toLowerCase();
  
  // Check if we have a reverse mapping
  for (const [coinId, binanceSymbol] of Object.entries(SYMBOL_MAP)) {
    if (binanceSymbol === symbol) {
      return coinId;
    }
  }
  
  // Fallback: use the base symbol as ID
  return baseSymbol;
}

export function createBinanceRoute() {
  console.log('[Binance Route] Creating Binance route...');
  
  const route = new Hono()
    /**
     * GET /api/binance/markets
     * Fetches top cryptocurrencies by 24h volume
     * Query params:
     * - limit: number (default: 10)
     */
    .get("/markets", async (c) => {
      try {
        console.log('[Binance Route] /markets endpoint called');
        const limit = parseInt(c.req.query('limit') || '10');
        
        console.log('[Binance Route] Fetching tickers from Binance...');
        
        // Get 24h ticker data for all symbols
        const tickers = await fetchFromBinance('/ticker/24hr');
        
        console.log(`[Binance Route] Received ${tickers.length} tickers from Binance`);
        
        // Filter for USDT pairs only and sort by volume
        const usdtPairs = tickers
          .filter((t: any) => t.symbol.endsWith('USDT'))
          .sort((a: any, b: any) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
          .slice(0, limit);
        
        console.log(`[Binance Route] Filtered to ${usdtPairs.length} USDT pairs`);
        
        // Transform to our format (similar to CoinGecko)
        const transformed = usdtPairs.map((ticker: any, index: number) => {
          const symbol = ticker.symbol.replace('USDT', '');
          const coinId = binanceSymbolToCoinId(ticker.symbol);
          
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
        
        console.log(`[Binance Route] Successfully transformed ${transformed.length} markets`);
        return c.json(transformed);
      } catch (error) {
        console.error('[Binance Route] Error in /markets:', error);
        console.error('[Binance Route] Error stack:', error instanceof Error ? error.stack : 'No stack');
        
        return c.json({ 
          error: 'Failed to fetch market data',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }, 500);
      }
    })
    
    /**
     * GET /api/binance/global
     * Returns mock global data (Binance doesn't provide this)
     */
    .get("/global", async (c) => {
      try {
        console.log('[Binance Route] /global endpoint called');
        
        // Get top coins for approximation
        const tickers = await fetchFromBinance('/ticker/24hr');
        const usdtPairs = tickers.filter((t: any) => t.symbol.endsWith('USDT'));
        
        // Calculate totals
        const totalVolume = usdtPairs.reduce((sum: number, t: any) => 
          sum + parseFloat(t.quoteVolume), 0);
        
        const btcTicker = usdtPairs.find((t: any) => t.symbol === 'BTCUSDT');
        
        // Mock global data
        const globalData = {
          total_market_cap: { usd: totalVolume * 10 },
          total_volume: { usd: totalVolume },
          market_cap_percentage: {
            btc: 45,
            eth: 18,
          },
          market_cap_change_percentage_24h_usd: 
            btcTicker ? parseFloat(btcTicker.priceChangePercent) : 0,
        };
        
        console.log('[Binance Route] Successfully returned global data');
        return c.json(globalData);
      } catch (error) {
        console.error('[Binance Route] Error in /global:', error);
        console.error('[Binance Route] Error stack:', error instanceof Error ? error.stack : 'No stack');
        
        return c.json({ 
          error: 'Failed to fetch global data',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }, 500);
      }
    });
  
  console.log('[Binance Route] Binance route created successfully');
  return route;
}  
  console.log(`[Binance Proxy] Fetching: ${endpoint}`);
  
  try {
    const url = `${BINANCE_API}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Binance API Error] ${response.status}: ${errorText}`);
      throw new Error(`Binance API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    // Cache the response
    setCache(endpoint, data);
    
    return data;
  } catch (error) {
    console.error(`[Binance Proxy] Fetch error for ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Symbol mapping from common names to Binance trading pairs
 * Maps CoinGecko IDs to Binance symbols
 */
const SYMBOL_MAP: Record<string, string> = {
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
  'monero': 'XMRUSDT',
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
  'eos': 'EOSUSDT',
  'the-graph': 'GRTUSDT',
  'tezos': 'XTZUSDT',
  'decentraland': 'MANAUSDT',
  'the-sandbox': 'SANDUSDT',
  'axie-infinity': 'AXSUSDT',
  'zcash': 'ZECUSDT',
  'fantom': 'FTMUSDT',
  'kucoin-shares': 'KCSUSDT',
  'neo': 'NEOUSDT',
  'curve-dao-token': 'CRVUSDT',
  'gala': 'GALAUSDT',
  'enjincoin': 'ENJUSDT',
};

/**
 * Converts Binance symbol to CoinGecko-style ID
 */
function binanceSymbolToCoinId(symbol: string): string {
  // Remove USDT suffix and convert to lowercase
  const base = symbol.replace('USDT', '').toLowerCase();
  
  // Find matching CoinGecko ID
  for (const [coinId, binanceSymbol] of Object.entries(SYMBOL_MAP)) {
    if (binanceSymbol === symbol) {
      return coinId;
    }
  }
  
  // Default: just use the base symbol
  return base;
}

/**
 * Gets all tradeable symbols on Binance
 */
async function getAllSymbols(): Promise<string[]> {
  const exchangeInfo = await fetchFromBinance('/exchangeInfo');
  
  // Filter for USDT pairs only (stablecoin pairs for price in USD)
  const symbols = exchangeInfo.symbols
    .filter((s: any) => s.symbol.endsWith('USDT') && s.status === 'TRADING')
    .map((s: any) => s.symbol);
  
  return symbols;
}

export function createBinanceRoute() {
  const route = new Hono()
    /**
     * GET /api/binance/markets
     * Fetches top cryptocurrencies by 24h volume
     * Query params:
     * - limit: number (default: 10)
     */
    .get("/markets", async (c) => {
      try {
        console.log('[Binance Route] /markets endpoint called');
        const limit = parseInt(c.req.query('limit') || '10');
        
        // Get 24h ticker data for all symbols
        const tickers = await fetchFromBinance('/ticker/24hr');
        
        // Filter for USDT pairs only and sort by volume
        const usdtPairs = tickers
          .filter((t: any) => t.symbol.endsWith('USDT'))
          .sort((a: any, b: any) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
          .slice(0, limit);
        
        // Transform to our format (similar to CoinGecko)
        const transformed = usdtPairs.map((ticker: any, index: number) => {
          const symbol = ticker.symbol.replace('USDT', '');
          const coinId = binanceSymbolToCoinId(ticker.symbol);
          
          return {
            id: coinId,
            symbol: symbol.toLowerCase(),
            name: symbol, // Binance doesn't provide full names, use symbol
            current_price: parseFloat(ticker.lastPrice),
            market_cap: parseFloat(ticker.quoteVolume) * 365, // Estimate based on volume
            market_cap_rank: index + 1,
            total_volume: parseFloat(ticker.quoteVolume),
            price_change_percentage_24h: parseFloat(ticker.priceChangePercent),
            price_change_percentage_7d_in_currency: null, // Not available from 24h ticker
            high_24h: parseFloat(ticker.highPrice),
            low_24h: parseFloat(ticker.lowPrice),
            ath: parseFloat(ticker.highPrice), // Use 24h high as approximation
            ath_change_percentage: parseFloat(ticker.priceChangePercent),
            circulating_supply: null, // Not available from Binance
            max_supply: null,
            image: `https://assets.coincap.io/assets/icons/${symbol.toLowerCase()}@2x.png`,
            last_updated: new Date(ticker.closeTime).toISOString(),
          };
        });
        
        console.log(`[Binance Route] Successfully returned ${transformed.length} markets`);
        return c.json(transformed);
      } catch (error) {
        console.error('[Binance Proxy] Error fetching markets:', error);
        console.error('[Binance Proxy] Error stack:', error instanceof Error ? error.stack : 'No stack');
        return c.json({ 
          error: 'Failed to fetch market data',
          details: error instanceof Error ? error.message : 'Unknown error',
          stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
        }, 500);
      }
    })
    
    /**
     * GET /api/binance/coin/:id
     * Fetches detailed data for a specific cryptocurrency
     * Path params:
     * - id: string (coin ID or symbol)
     */
    .get("/coin/:id", async (c) => {
      try {
        const coinId = c.req.param('id');
        
        // Convert coin ID to Binance symbol
        const binanceSymbol = SYMBOL_MAP[coinId] || `${coinId.toUpperCase()}USDT`;
        
        // Get 24h ticker data
        const ticker = await fetchFromBinance(`/ticker/24hr?symbol=${binanceSymbol}`);
        
        const symbol = binanceSymbol.replace('USDT', '');
        
        const transformed = {
          id: coinId,
          symbol: symbol.toLowerCase(),
          name: symbol,
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
          image: `https://cryptologos.cc/logos/${symbol.toLowerCase()}-${symbol.toLowerCase()}-logo.png`,
          last_updated: new Date(ticker.closeTime).toISOString(),
        };
        
        return c.json(transformed);
      } catch (error) {
        console.error('[Binance Proxy] Error fetching coin:', error);
        return c.json({ 
          error: 'Failed to fetch coin data',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
      }
    })
    
    /**
     * GET /api/binance/price-history/:id
     * Fetches historical price data (klines/candlesticks)
     * Path params:
     * - id: string (coin ID)
     * Query params:
     * - days: number (1, 7, 30, 90, 365)
     */
    .get("/price-history/:id", async (c) => {
      try {
        const coinId = c.req.param('id');
        const days = parseInt(c.req.query('days') || '7');
        
        console.log(`[Binance Proxy] Requesting price history for ${coinId}, days=${days}`);
        
        // Convert coin ID to Binance symbol
        const binanceSymbol = SYMBOL_MAP[coinId] || `${coinId.toUpperCase()}USDT`;
        
        // Calculate interval based on days
        let interval = '1h';
        let limit = days * 24; // hourly data points
        
        if (days <= 1) {
          interval = '15m';
          limit = 96; // 15-min intervals for 24h
        } else if (days <= 7) {
          interval = '1h';
          limit = days * 24;
        } else if (days <= 30) {
          interval = '4h';
          limit = days * 6;
        } else {
          interval = '1d';
          limit = days;
        }
        
        // Binance has a max limit of 1000
        if (limit > 1000) limit = 1000;
        
        // Fetch klines (candlestick data)
        const klines = await fetchFromBinance(`/klines?symbol=${binanceSymbol}&interval=${interval}&limit=${limit}`);
        
        // Transform to our format
        const prices = klines.map((kline: any[]) => ({
          timestamp: kline[0], // Open time
          price: parseFloat(kline[4]), // Close price
        }));
        
        const result = {
          coinId,
          prices,
          market_caps: [], // Not available from Binance
          total_volumes: klines.map((kline: any[]) => [kline[0], parseFloat(kline[5])]), // [timestamp, volume]
        };
        
        console.log(`[Binance Proxy] Successfully fetched ${prices.length} price points for ${coinId}`);
        
        return c.json(result);
      } catch (error) {
        console.error('[Binance Proxy] Error fetching price history:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return c.json({ 
          error: 'Failed to fetch price history',
          details: errorMessage,
          coinId: c.req.param('id'),
          days: c.req.query('days') || '7'
        }, 500);
      }
    })
    
    /**
     * GET /api/binance/search
     * Searches for cryptocurrencies by symbol
     * Query params:
     * - query: string
     */
    .get("/search", async (c) => {
      try {
        const query = c.req.query('query');
        
        if (!query || query.trim().length === 0) {
          return c.json({ coins: [] });
        }
        
        const searchTerm = query.trim().toUpperCase();
        
        // Get all trading symbols
        const symbols = await getAllSymbols();
        
        // Filter symbols that match the search
        const matches = symbols
          .filter(s => s.includes(searchTerm))
          .slice(0, 10);
        
        // Transform to search result format
        const results = matches.map((symbol, index) => {
          const base = symbol.replace('USDT', '');
          const coinId = binanceSymbolToCoinId(symbol);
          
          return {
            id: coinId,
            name: base,
            symbol: base.toLowerCase(),
            market_cap_rank: null,
            thumb: `https://cryptologos.cc/logos/${base.toLowerCase()}-${base.toLowerCase()}-logo.png`,
            large: `https://cryptologos.cc/logos/${base.toLowerCase()}-${base.toLowerCase()}-logo.png`,
          };
        });
        
        return c.json({ coins: results });
      } catch (error) {
        console.error('[Binance Proxy] Error searching:', error);
        return c.json({ 
          error: 'Failed to search cryptocurrencies',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
      }
    })
    
    /**
     * GET /api/binance/global
     * Returns mock global data (Binance doesn't provide this)
     */
    .get("/global", async (c) => {
      try {
        console.log('[Binance Route] /global endpoint called');
        // Get top coins for approximation
        const tickers = await fetchFromBinance('/ticker/24hr');
        const usdtPairs = tickers.filter((t: any) => t.symbol.endsWith('USDT'));
        
        // Calculate totals
        const totalVolume = usdtPairs.reduce((sum: number, t: any) => 
          sum + parseFloat(t.quoteVolume), 0);
        
        const btcTicker = usdtPairs.find((t: any) => t.symbol === 'BTCUSDT');
        const btcPrice = btcTicker ? parseFloat(btcTicker.lastPrice) : 0;
        
        // Mock global data
        const globalData = {
          total_market_cap: { usd: totalVolume * 10 }, // Rough estimate
          total_volume: { usd: totalVolume },
          market_cap_percentage: {
            btc: 45, // Approximate
            eth: 18,
          },
          market_cap_change_percentage_24h_usd: 
            btcTicker ? parseFloat(btcTicker.priceChangePercent) : 0,
        };
        
        console.log('[Binance Route] Successfully returned global data');
        return c.json(globalData);
      } catch (error) {
        console.error('[Binance Proxy] Error fetching global data:', error);
        console.error('[Binance Proxy] Error stack:', error instanceof Error ? error.stack : 'No stack');
        return c.json({ 
          error: 'Failed to fetch global data',
          details: error instanceof Error ? error.message : 'Unknown error',
          stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
        }, 500);
      }
    });

  return route;
}
