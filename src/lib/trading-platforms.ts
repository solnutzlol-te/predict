/**
 * Trading platform link generator and configuration
 * Generates direct links to perpetual trading platforms for specific cryptocurrencies
 */

export interface TradingPlatform {
  id: string;
  name: string;
  logo: string; // URL to platform logo or SVG path
  color: string; // Brand color in HSL format
  bgColor: string; // Background color for button
  generateUrl: (symbol: string) => string;
}

/**
 * Trading platforms configuration
 * Each platform has a unique URL structure for perp trading
 */
export const TRADING_PLATFORMS: TradingPlatform[] = [
  {
    id: 'hyperliquid',
    name: 'Hyperliquid',
    // Using a simple lightning bolt emoji as a fallback since the SVG isn't loading
    logo: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23a78bfa"%3E%3Cpath d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"/%3E%3C/svg%3E',
    color: 'hsl(280, 100%, 70%)', // Purple brand color
    bgColor: 'bg-purple-500/10',
    generateUrl: (symbol: string) => {
      // Hyperliquid uses format: https://app.hyperliquid.xyz/trade/{SYMBOL}
      return `https://app.hyperliquid.xyz/trade/${symbol.toUpperCase()}`;
    },
  },
  {
    id: 'binance',
    name: 'Binance',
    logo: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 126.61 126.61"%3E%3Cg fill="%23f3ba2f"%3E%3Cpath d="M38.73 53.2l24.59-24.58 24.6 24.6 14.3-14.31L63.32 0 24.42 38.9l14.31 14.3z"/%3E%3Cpath d="M0 63.31l14.3-14.3 14.31 14.3-14.3 14.3zM38.73 73.41l24.59 24.59 24.6-24.6 14.31 14.29-38.9 38.91-38.91-38.88v-.03l14.31-14.28z"/%3E%3Cpath d="M98 63.31l14.3-14.3 14.31 14.3-14.3 14.3z"/%3E%3Cpath d="M77.83 63.3L63.32 48.78 52.16 59.94l-2.98 3.01-2.98 2.98 14.31 14.32 14.32-14.32 2.98-2.98z"/%3E%3C/g%3E%3C/svg%3E',
    color: 'hsl(45, 93%, 58%)',
    bgColor: 'bg-yellow-500/10',
    generateUrl: (symbol: string) => {
      // Binance uses format: https://www.binance.com/en/futures/{SYMBOL}USDT
      return `https://www.binance.com/en/futures/${symbol.toUpperCase()}USDT`;
    },
  },
  {
    id: 'bybit',
    name: 'Bybit',
    logo: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"%3E%3Cpath fill="%23f7a600" d="M120 0C53.7 0 0 53.7 0 120s53.7 120 120 120 120-53.7 120-120S186.3 0 120 0zm50.7 170.7c-3.5 3.5-8.3 5.3-13 5.3s-9.5-1.8-13-5.3L120 145.9l-24.7 24.8c-3.5 3.5-8.3 5.3-13 5.3s-9.5-1.8-13-5.3c-7.2-7.2-7.2-18.8 0-26L94 119.9 69.3 95.2c-7.2-7.2-7.2-18.8 0-26s18.8-7.2 26 0L120 94l24.7-24.8c7.2-7.2 18.8-7.2 26 0s7.2 18.8 0 26L146 120l24.7 24.8c7.2 7.1 7.2 18.7 0 25.9z"/%3E%3C/svg%3E',
    color: 'hsl(38, 95%, 56%)',
    bgColor: 'bg-orange-500/10',
    generateUrl: (symbol: string) => {
      // Bybit uses format: https://www.bybit.com/trade/usdt/{SYMBOL}USDT
      return `https://www.bybit.com/trade/usdt/${symbol.toUpperCase()}USDT`;
    },
  },
  {
    id: 'okx',
    name: 'OKX',
    logo: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23fff"%3E%3Cpath d="M15 9h6v6h-6zM9 9h6v6H9zM3 9h6v6H3zM15 3h6v6h-6zM9 3h6v6H9zM3 3h6v6H3zM15 15h6v6h-6zM9 15h6v6H9zM3 15h6v6H3z"/%3E%3C/svg%3E',
    color: 'hsl(0, 0%, 10%)',
    bgColor: 'bg-gray-500/10',
    generateUrl: (symbol: string) => {
      // OKX uses format: https://www.okx.com/trade-swap/{symbol}-usdt-swap
      return `https://www.okx.com/trade-swap/${symbol.toLowerCase()}-usdt-swap`;
    },
  },
];

/**
 * Checks if a symbol is supported on a specific platform
 * Some platforms may not support all cryptocurrencies
 * @param platformId - Trading platform ID
 * @param symbol - Cryptocurrency symbol (e.g., 'BTC', 'ETH')
 * @returns True if supported, false otherwise
 */
export function isPlatformSupported(platformId: string, symbol: string): boolean {
  const upperSymbol = symbol.toUpperCase();
  
  // Most major platforms support top cryptocurrencies
  const majorSymbols = [
    'BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'AVAX', 'MATIC', 'DOT', 
    'UNI', 'LINK', 'ATOM', 'LTC', 'BCH', 'NEAR', 'APT', 'ARB', 'OP', 'SUI',
    'FIL', 'ICP', 'VET', 'ALGO', 'HBAR', 'EOS', 'AAVE', 'MKR', 'CRV', 'LDO',
    'FTM', 'SAND', 'MANA', 'AXS', 'GRT', 'THETA', 'XTZ', 'ETC', 'FLOW', 'ICP'
  ];
  
  // Hyperliquid has extensive coin support - updated list based on their actual platform
  if (platformId === 'hyperliquid') {
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
    return hyperliquidSupported.includes(upperSymbol);
  }
  
  // For other platforms (Binance, Bybit, OKX), they support most top coins
  return majorSymbols.includes(upperSymbol);
}

/**
 * Gets available trading platforms for a specific cryptocurrency
 * @param symbol - Cryptocurrency symbol (e.g., 'BTC', 'ETH')
 * @returns Array of available trading platforms
 */
export function getAvailablePlatforms(symbol: string): TradingPlatform[] {
  return TRADING_PLATFORMS.filter(platform => isPlatformSupported(platform.id, symbol));
}
