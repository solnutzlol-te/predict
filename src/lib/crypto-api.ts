/**
 * Binance API integration for fetching real-time cryptocurrency data
 * NOW USES BACKEND PROXY to avoid CORS issues
 * 
 * All requests go through /api/binance/* instead of directly to Binance
 * 
 * Benefits of Binance over CoinGecko:
 * - ✅ 1200 requests/minute (vs CoinGecko's ~50/minute)
 * - ✅ No API key required
 * - ✅ Real-time exchange data
 * - ✅ Very reliable and fast
 */

import { CryptoData, PriceHistory, PriceHistoryPoint } from '@/types/crypto';

// Use our backend proxy API for Binance
const API_BASE = '/api/binance';

/**
 * List of stablecoins and wrapped tokens to exclude from trading signals
 * These include:
 * - Stablecoins (designed to maintain stable value)
 * - Wrapped tokens (wrapped versions of other assets)
 * - Liquid staking derivatives (stETH, rETH, etc.)
 * 
 * Only major, volatile, tradeable cryptocurrencies should generate signals
 * 
 * NOTE: Use exact coin IDs (lowercase, hyphenated)
 */
const EXCLUDED_COIN_IDS = [
  // Major stablecoins
  'tether',
  'usd-coin',
  'binance-usd',
  'dai',
  'frax',
  'true-usd',
  'paxos-standard',
  'gemini-dollar',
  'usdd',
  'first-digital-usd',
  'fdusd', // First Digital USD
  'terrausd',
  'fei-usd',
  'neutrino',
  'usdk',
  'usdx',
  'reserve',
  'origin-dollar',
  'figure-heloc', // Figure HELOC token (asset-backed stablecoin)
  
  // Wrapped tokens
  'wrapped-bitcoin',
  'weth',
  'wrapped-bnb',
  'coinbase-wrapped-btc', // Coinbase Wrapped BTC (cbBTC)
  
  // Liquid staking derivatives (these track ETH price, not good for separate signals)
  'staked-ether', // Lido Staked Ether (stETH)
  'wrapped-steth', // Wrapped stETH
  'wsteth', // Wrapped staked ETH
  'rocket-pool-eth', // Rocket Pool ETH
  'reth', // rETH
  'frax-ether', // Frax Ether
  'staked-frax-ether', // sfrxETH
  'ankr-staked-eth', // ankrETH
  'coinbase-wrapped-staked-eth', // cbETH
  'lido-dao', // LDO is fine, but stETH is not
  'wrapped-eeth', // Wrapped eETH
  'wrapped-beacon-eth', // Wrapped Beacon ETH
  
  // Other pegged assets
  'renbtc',
  'sbtc',
  'hbtc',
  
  // Meme coins to exclude
  'shiba-inu', // Shiba Inu (SHIB)
];

/**
 * Checks if a cryptocurrency has any trading platform support
 * @param symbol - Cryptocurrency symbol
 * @returns True if at least one platform supports this coin
 */
function hasAnyPlatformSupport(symbol: string): boolean {
  // Import the platform checking logic inline to avoid circular dependencies
  const upperSymbol = symbol.toUpperCase();
  
  // Major coins supported by most platforms
  const majorSymbols = [
    'BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'AVAX', 'MATIC', 'DOT', 
    'UNI', 'LINK', 'ATOM', 'LTC', 'BCH', 'NEAR', 'APT', 'ARB', 'OP', 'SUI',
    'FIL', 'ICP', 'VET', 'ALGO', 'HBAR', 'EOS', 'AAVE', 'MKR', 'CRV', 'LDO',
    'FTM', 'SAND', 'MANA', 'AXS', 'GRT', 'THETA', 'XTZ', 'ETC', 'FLOW'
  ];
  
  // Hyperliquid's extensive support list
  const hyperliquidSupported = [
    // Major coins
    'BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'AVAX', 'DOT', 'MATIC',
    'LTC', 'BCH', 'LINK', 'UNI', 'ATOM', 'XLM', 'NEAR', 'ALGO', 'VET', 'ICP',
    'FIL', 'HBAR', 'APT', 'ARB', 'OP', 'SUI', 'SEI', 'TIA', 'INJ', 'FTM',
    'SAND', 'MANA', 'AXS', 'GRT', 'EOS', 'AAVE', 'MKR', 'SNX', 'CRV', 'LDO',
    'RUNE', 'KAVA', 'ZIL', 'ONE', 'ENJ', 'BAT', 'ZRX', 'COMP', 'YFI', 'UMA',
    
    // Meme/community coins
    'WIF', 'BONK', 'PEPE', 'FLOKI', 'SHIB', 'MEME', 'BOME', 'MEW', 'POPCAT',
    'MOTHER', 'DADDY', 'WEN', 'MYRO', 'SILLY', 'PONKE', 'BRETT', 'MOG',
    
    // Privacy coins
    'XMR', 'ZEC', 'DASH',
    
    // DeFi & Gaming
    'JUP', 'RNDR', 'PENDLE', 'JTO', 'PYTH', 'WLD', 'BLUR', 'STRK', 'DYM',
    'ALT', 'PIXEL', 'PORTAL', 'MANTA', 'SAGA', 'OMNI', 'BB', 'LISTA', 'ZK',
    'ZRO', 'IO', 'NOT', 'DOGS', 'TON', 'CATI', 'HMSTR', 'EIGEN', 'USUAL',
    'MOVE', 'VANA', 'PENGU', 'BIO',
    
    // Layer 2s & Infrastructure
    'IMX', 'LRC', 'METIS', 'BOBA', 'CELO', 'SKL', 'ROSE', 'GLMR', 'MOVR',
    
    // Additional altcoins commonly traded
    'XML', 'CHROMA', 'XCH', 'OSMO', 'JUNO', 'SCRT', 'LUNA', 'LUNC', 'USTC',
    'AKT', 'DVPN', 'NGM', 'ROWAN', 'BAND', 'OCEAN', 'FET', 'AGIX', 'RLC',
    'NMR', 'CTSI', 'POLS', 'ORN', 'PERP', 'API3', 'BADGER', 'FARM', 'CREAM',
    'ALPHA', 'COVER', 'VALUE', 'DODO', 'SXP', 'FTT', 'SRM', 'RAY', 'FIDA',
    'COPE', 'STEP', 'MEDIA', 'TULIP', 'MER', 'ROPE', 'SLRS', 'SNY', 'MNGO',
    'OXY', 'BOP', 'SAMO', 'NINJA', 'SLND', 'PORT', 'PUFF', 'INVICTUS',
    
    // Gaming & Metaverse
    'GALA', 'ENJ', 'ALICE', 'TLM', 'ILV', 'YGG', 'GHST', 'WAXP', 'GODS',
    'SLP', 'COCOS', 'ERN', 'PYR', 'NAKA', 'UFO', 'TOWER', 'HERO', 'SENATE'
  ];
  
  // Check if supported by any platform
  return majorSymbols.includes(upperSymbol) || hyperliquidSupported.includes(upperSymbol);
}

/**
 * Fetches top cryptocurrencies by 24h volume from Binance
 * NOW USES BACKEND PROXY - No more CORS issues!
 * 
 * Automatically filters out:
 * - Stablecoins and wrapped tokens
 * - Tokens without any trading platform support
 * @param limit - Number of cryptocurrencies to fetch (default: 10)
 * @returns Array of cryptocurrency data (only tradeable coins with platform support)
 */
export async function fetchTopCryptos(limit: number = 10): Promise<CryptoData[]> {
  try {
    // Fetch extra coins to account for filtering
    const fetchLimit = limit + 50; // Increased buffer to account for filtering
    const response = await fetch(
      `${API_BASE}/markets?limit=${fetchLimit}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend API error:', response.status, errorText);
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();
    
    console.log(`Fetched ${data.length} coins from Binance backend proxy`);
    
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No cryptocurrency data received from API');
    }
    
    // Filter out stablecoins, wrapped tokens, liquid staking derivatives, AND non-tradeable tokens
    const filtered = data.filter((crypto: CryptoData) => {
      // Check if excluded (stablecoin, wrapped token, etc.)
      const isExcluded = EXCLUDED_COIN_IDS.includes(crypto.id);
      if (isExcluded) {
        console.log(`Filtering out: ${crypto.name} (${crypto.symbol.toUpperCase()}) - Excluded ID`);
        return false;
      }
      
      // Check if has ANY trading platform support
      const hasPlatformSupport = hasAnyPlatformSupport(crypto.symbol);
      if (!hasPlatformSupport) {
        console.log(`Filtering out: ${crypto.name} (${crypto.symbol.toUpperCase()}) - No platform support`);
        return false;
      }
      
      return true;
    });
    
    console.log(`After filtering: ${filtered.length} tradeable coins with platform support remaining`);
    
    const result = filtered.slice(0, limit);
    console.log(`Returning ${result.length} coins for predictions`);
    
    return result as CryptoData[];
  } catch (error) {
    console.error('Error fetching crypto data:', error);
    throw error;
  }
}

/**
 * Fetches detailed data for a specific cryptocurrency from Binance
 * NOW USES BACKEND PROXY
 * @param coinId - Coin ID (e.g., 'bitcoin', 'ethereum')
 * @returns Detailed cryptocurrency data
 */
export async function fetchCryptoDetail(coinId: string): Promise<CryptoData> {
  try {
    const response = await fetch(`${API_BASE}/coin/${coinId}`);

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();
    return data as CryptoData;
  } catch (error) {
    console.error('Error fetching crypto detail:', error);
    throw error;
  }
}

/**
 * Fetches global cryptocurrency market data from Binance
 * NOW USES BACKEND PROXY
 * @returns Global market statistics
 */
export async function fetchGlobalMarketData() {
  try {
    const response = await fetch(`${API_BASE}/global`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend API error:', response.status, errorText);
      throw new Error(`Backend API error: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching global market data:', error);
    throw error;
  }
}

/**
 * Interface for cryptocurrency search result
 */
export interface CryptoSearchResult {
  id: string;
  name: string;
  symbol: string;
  market_cap_rank: number | null;
  thumb: string;
  large: string;
}

/**
 * Searches for cryptocurrencies by symbol on Binance
 * NOW USES BACKEND PROXY
 * @param query - Search query (e.g., "bitcoin", "BTC")
 * @returns Array of matching cryptocurrency results
 */
export async function searchCryptos(query: string): Promise<CryptoSearchResult[]> {
  try {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const response = await fetch(
      `${API_BASE}/search?query=${encodeURIComponent(query.trim())}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend API error:', response.status, errorText);
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Search results for "${query}":`, data.coins?.length || 0, 'coins found');
    
    // Return top 10 results
    return (data.coins || []).slice(0, 10) as CryptoSearchResult[];
  } catch (error) {
    console.error('Error searching cryptocurrencies:', error);
    throw error;
  }
}

/**
 * Fetches data for a specific cryptocurrency by its ID
 * NOW USES BACKEND PROXY
 * 
 * Filters out:
 * - Stablecoins and wrapped tokens
 * - Tokens without any trading platform support
 * @param coinId - Coin ID (e.g., 'bitcoin')
 * @returns Cryptocurrency data or null if it's excluded or not tradeable
 */
export async function fetchCryptoById(coinId: string): Promise<CryptoData | null> {
  try {
    // Check if it's excluded first
    if (EXCLUDED_COIN_IDS.includes(coinId)) {
      console.log(`Rejected excluded coin: ${coinId}`);
      return null;
    }

    const response = await fetch(`${API_BASE}/coin/${coinId}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const errorText = await response.text();
      console.error('Backend API error:', response.status, errorText);
      throw new Error(`Backend API error: ${response.status}`);
    }

    const crypto = await response.json() as CryptoData;
    
    // Check if has ANY trading platform support
    if (!hasAnyPlatformSupport(crypto.symbol)) {
      console.log(`Rejected non-tradeable coin: ${crypto.name} (${crypto.symbol.toUpperCase()}) - No platform support`);
      return null;
    }

    return crypto;
  } catch (error) {
    console.error('Error fetching crypto by ID:', error);
    throw error;
  }
}

/**
 * Fetches historical price data for a cryptocurrency from Binance
 * NOW USES BACKEND PROXY - No more CORS issues!
 * @param coinId - Coin ID
 * @param days - Number of days of history (1, 7, 30, 90, 365)
 * @returns Price history with timestamps and prices
 */
export async function fetchPriceHistory(coinId: string, days: number = 7): Promise<PriceHistory> {
  try {
    const response = await fetch(
      `${API_BASE}/price-history/${coinId}?days=${days}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend API error:', response.status, errorText);
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();
    return data as PriceHistory;
  } catch (error) {
    console.error('Error fetching price history:', error);
    throw error;
  }
}
