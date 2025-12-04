import { Hono } from "hono";

/**
 * CoinGecko API Proxy Routes
 * 
 * This route acts as a backend proxy for all CoinGecko API calls.
 * 
 * Why we need this:
 * - Solves CORS issues (browser can't directly call CoinGecko API)
 * - Enables server-side caching for better performance
 * - Centralizes API key management (if needed in future)
 * - Provides consistent error handling
 * 
 * All CoinGecko API calls from the frontend now go through this proxy.
 */

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

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
    timestamp: Date.now(),
  });
}

/**
 * Makes a request to CoinGecko API with caching
 */
async function fetchFromCoinGecko(endpoint: string): Promise<any> {
  // Check cache first
  const cached = getCached(endpoint);
  if (cached) {
    console.log(`[CoinGecko Proxy] Cache hit: ${endpoint}`);
    return cached;
  }
  
  console.log(`[CoinGecko Proxy] Fetching: ${endpoint}`);
  
  try {
    const url = `${COINGECKO_API}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; CryptoPredictor/1.0)',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[CoinGecko API Error] ${response.status}: ${errorText}`);
      throw new Error(`CoinGecko API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    // Cache the response
    setCache(endpoint, data);
    
    return data;
  } catch (error) {
    console.error(`[CoinGecko Proxy] Fetch error for ${endpoint}:`, error);
    throw error;
  }
}

export function createCoinGeckoRoute() {
  const route = new Hono()
    /**
     * GET /api/coingecko/markets
     * Fetches top cryptocurrencies by market cap
     * Query params:
     * - per_page: number (default: 10)
     * - page: number (default: 1)
     */
    .get("/markets", async (c) => {
      try {
        const perPage = c.req.query('per_page') || '10';
        const page = c.req.query('page') || '1';
        
        const endpoint = `/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=false&price_change_percentage=24h,7d`;
        const data = await fetchFromCoinGecko(endpoint);
        
        return c.json(data);
      } catch (error) {
        console.error('[CoinGecko Proxy] Error fetching markets:', error);
        return c.json({ 
          error: 'Failed to fetch market data',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
      }
    })
    
    /**
     * GET /api/coingecko/global
     * Fetches global cryptocurrency market data
     */
    .get("/global", async (c) => {
      try {
        const data = await fetchFromCoinGecko('/global');
        return c.json(data.data); // CoinGecko wraps global data in a 'data' property
      } catch (error) {
        console.error('[CoinGecko Proxy] Error fetching global data:', error);
        return c.json({ 
          error: 'Failed to fetch global market data',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
      }
    })
    
    /**
     * GET /api/coingecko/search
     * Searches for cryptocurrencies by name or symbol
     * Query params:
     * - query: string (search term)
     */
    .get("/search", async (c) => {
      try {
        const query = c.req.query('query');
        
        if (!query || query.trim().length === 0) {
          return c.json({ coins: [] });
        }
        
        const endpoint = `/search?query=${encodeURIComponent(query.trim())}`;
        const data = await fetchFromCoinGecko(endpoint);
        
        return c.json(data);
      } catch (error) {
        console.error('[CoinGecko Proxy] Error searching:', error);
        return c.json({ 
          error: 'Failed to search cryptocurrencies',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
      }
    })
    
    /**
     * GET /api/coingecko/coin/:id
     * Fetches detailed data for a specific cryptocurrency
     * Path params:
     * - id: string (CoinGecko coin ID, e.g., 'bitcoin')
     */
    .get("/coin/:id", async (c) => {
      try {
        const coinId = c.req.param('id');
        
        const endpoint = `/coins/markets?vs_currency=usd&ids=${coinId}&price_change_percentage=24h,7d`;
        const data = await fetchFromCoinGecko(endpoint);
        
        if (!data || data.length === 0) {
          return c.json({ error: 'Coin not found' }, 404);
        }
        
        return c.json(data[0]);
      } catch (error) {
        console.error('[CoinGecko Proxy] Error fetching coin:', error);
        return c.json({ 
          error: 'Failed to fetch coin data',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
      }
    })
    
    /**
     * GET /api/coingecko/price-history/:id
     * Fetches historical price data for a cryptocurrency
     * Path params:
     * - id: string (CoinGecko coin ID)
     * Query params:
     * - days: number (1, 7, 14, 30, 90, 180, 365, or 'max')
     */
    .get("/price-history/:id", async (c) => {
      try {
        const coinId = c.req.param('id');
        const days = c.req.query('days') || '7';
        
        console.log(`[CoinGecko Proxy] Requesting price history for ${coinId}, days=${days}`);
        
        const endpoint = `/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;
        const data = await fetchFromCoinGecko(endpoint);
        
        // Validate response structure
        if (!data || !data.prices || !Array.isArray(data.prices)) {
          console.error('[CoinGecko Proxy] Invalid response structure:', data);
          throw new Error('Invalid response structure from CoinGecko API');
        }
        
        // Transform into our format
        const prices = data.prices.map((point: [number, number]) => ({
          timestamp: point[0],
          price: point[1],
        }));
        
        const result = {
          coinId,
          prices,
          market_caps: data.market_caps || [],
          total_volumes: data.total_volumes || [],
        };
        
        console.log(`[CoinGecko Proxy] Successfully fetched ${prices.length} price points for ${coinId}`);
        
        return c.json(result);
      } catch (error) {
        console.error('[CoinGecko Proxy] Error fetching price history:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return c.json({ 
          error: 'Failed to fetch price history',
          details: errorMessage,
          coinId: c.req.param('id'),
          days: c.req.query('days') || '7'
        }, 500);
      }
    });

  return route;
}
