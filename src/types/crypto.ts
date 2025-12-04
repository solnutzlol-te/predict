/**
 * Type definitions for cryptocurrency data structures
 * Used throughout the application for type safety
 */

export interface CryptoData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency: number;
  high_24h: number;
  low_24h: number;
  ath: number;
  ath_change_percentage: number;
  circulating_supply: number;
  max_supply: number | null;
  image: string;
  last_updated: string;
}

export type PredictionType = 'LONG' | 'SHORT' | 'NEUTRAL';

export type SentimentScore = 'EXTREME_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'EXTREME_BEARISH';

export interface TechnicalIndicators {
  trend_24h: 'bullish' | 'bearish' | 'neutral';
  trend_7d: 'bullish' | 'bearish' | 'neutral';
  momentum: number; // -100 to 100
  volume_signal: 'high' | 'normal' | 'low';
  volatility: number; // 0-100
  strength: number; // 0-100
}

export interface PredictionReason {
  category: string;
  text: string;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface CryptoPrediction {
  crypto: CryptoData;
  prediction: PredictionType;
  sentiment: SentimentScore;
  confidence: number; // 0-100
  indicators: TechnicalIndicators;
  reasons: PredictionReason[];
  targetPrice: number;
  stopLoss: number;
  timeframe: string;
  analysis: string;
  leverage: number; // Recommended leverage (1x - 10x)
  riskLevel: 'Low' | 'Medium' | 'High' | 'Extreme'; // Risk assessment
}

export interface MarketOverview {
  totalMarketCap: number;
  totalVolume: number;
  btcDominance: number;
  marketSentiment: SentimentScore;
  trending: string[];
}

/**
 * Price history data point for charts
 */
export interface PriceHistoryPoint {
  timestamp: number;
  price: number;
}

/**
 * Complete price history data for a cryptocurrency
 */
export interface PriceHistory {
  coinId: string;
  prices: PriceHistoryPoint[];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

/**
 * Watchlist item stored in local storage
 */
export interface WatchlistItem {
  coinId: string;
  name: string;
  symbol: string;
  image: string;
  addedAt: number;
}

/**
 * Prediction history entry for tracking accuracy
 */
export interface PredictionHistoryEntry {
  id: string;
  coinId: string;
  coinName: string;
  coinSymbol: string;
  prediction: PredictionType;
  confidence: number;
  predictedPrice: number;
  targetPrice: number;
  stopLoss: number;
  actualPrice: number | null;
  timestamp: number;
  outcome: 'pending' | 'win' | 'loss' | 'neutral';
  profitLoss: number | null; // Percentage
}

/**
 * Portfolio holding entry
 * Stores information about a cryptocurrency position in the user's portfolio
 */
export interface PortfolioHolding {
  id: string;
  coinId: string;
  coinName: string;
  coinSymbol: string;
  coinImage: string;
  amount: number; // Amount of coins held
  buyPrice: number; // Price at which the coin was purchased (USD)
  purchaseDate: number; // Timestamp of purchase
  notes?: string; // Optional notes about the position
}

/**
 * Portfolio statistics
 * Calculated metrics for the entire portfolio
 */
export interface PortfolioStats {
  totalValue: number; // Current total value in USD
  totalCost: number; // Total cost basis in USD
  totalProfitLoss: number; // Total profit/loss in USD
  totalProfitLossPercent: number; // Total profit/loss as percentage
  holdingsCount: number; // Number of holdings
  topGainer: {
    name: string;
    profitPercent: number;
  } | null;
  topLoser: {
    name: string;
    lossPercent: number;
  } | null;
}

/**
 * News article from CryptoPanic API
 */
export interface CryptoNews {
  id: string;
  title: string;
  url: string;
  source: string;
  published_at: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  currencies: Array<{
    code: string;
    title: string;
  }>;
}

/**
 * Filter options for predictions
 */
export interface PredictionFilters {
  riskLevels: ('Low' | 'Medium' | 'High' | 'Extreme')[];
  leverageRange: {
    min: number;
    max: number;
  } | null;
  timeframes: string[];
  predictionTypes: PredictionType[];
}

/**
 * Sort options for predictions
 */
export type PredictionSortOption = 
  | 'confidence-desc'
  | 'confidence-asc'
  | 'price-change-desc'
  | 'price-change-asc'
  | 'market-cap-desc'
  | 'market-cap-asc'
  | 'volume-desc'
  | 'volume-asc';

/**
 * ==================== ENHANCED TECHNICAL ANALYSIS ====================
 */

/**
 * RSI (Relative Strength Index) indicator
 * Measures momentum and overbought/oversold conditions
 */
export interface RSIIndicator {
  value: number; // 0-100
  signal: 'overbought' | 'oversold' | 'neutral'; // >70 overbought, <30 oversold
  trend: 'bullish' | 'bearish' | 'neutral';
}

/**
 * MACD (Moving Average Convergence Divergence) indicator
 * Shows trend direction and momentum
 */
export interface MACDIndicator {
  macd: number; // MACD line
  signal: number; // Signal line
  histogram: number; // MACD - Signal
  trend: 'bullish' | 'bearish' | 'neutral';
  crossover: 'bullish_crossover' | 'bearish_crossover' | 'none';
}

/**
 * Bollinger Bands indicator
 * Measures volatility and price extremes
 */
export interface BollingerBandsIndicator {
  upper: number; // Upper band
  middle: number; // Middle band (SMA)
  lower: number; // Lower band
  bandwidth: number; // (upper - lower) / middle * 100
  position: 'above_upper' | 'near_upper' | 'middle' | 'near_lower' | 'below_lower';
  signal: 'overbought' | 'oversold' | 'neutral';
}

/**
 * Support and Resistance levels
 * Key price levels for technical analysis
 */
export interface SupportResistanceLevel {
  price: number;
  type: 'support' | 'resistance';
  strength: 'strong' | 'moderate' | 'weak'; // Based on number of touches
  touches: number; // How many times price touched this level
}

/**
 * Candlestick pattern recognition
 */
export type CandlestickPattern =
  | 'doji'
  | 'hammer'
  | 'shooting_star'
  | 'engulfing_bullish'
  | 'engulfing_bearish'
  | 'morning_star'
  | 'evening_star'
  | 'three_white_soldiers'
  | 'three_black_crows'
  | 'none';

export interface CandlestickPatternResult {
  pattern: CandlestickPattern;
  signal: 'bullish' | 'bearish' | 'neutral';
  confidence: number; // 0-100
  description: string;
}

/**
 * Volume Profile - shows volume distribution at price levels
 */
export interface VolumeProfile {
  priceLevel: number;
  volume: number;
  percentage: number; // % of total volume
}

/**
 * Complete enhanced technical indicators
 * Extends basic indicators with advanced TA
 */
export interface EnhancedTechnicalIndicators extends TechnicalIndicators {
  rsi: RSIIndicator;
  macd: MACDIndicator;
  bollingerBands: BollingerBandsIndicator;
  supportLevels: SupportResistanceLevel[];
  resistanceLevels: SupportResistanceLevel[];
  candlestickPattern: CandlestickPatternResult;
  volumeProfile: VolumeProfile[];
}

/**
 * Multi-timeframe analysis
 */
export type Timeframe = '1h' | '4h' | '1d' | '1w';

export interface MultiTimeframeAnalysis {
  timeframe: Timeframe;
  indicators: EnhancedTechnicalIndicators;
  trend: 'bullish' | 'bearish' | 'neutral';
  strength: number; // 0-100
}

/**
 * ==================== BACKTESTING SYSTEM ====================
 */

/**
 * Backtest configuration
 * Defines the parameters for running a backtest
 */
export interface BacktestConfig {
  startDate: number; // Timestamp
  endDate: number; // Timestamp
  initialCapital: number; // Starting balance in USD
  coinIds: string[]; // Cryptocurrencies to include
  strategy: BacktestStrategy;
  maxPositions: number; // Max simultaneous positions
  positionSize: number; // % of capital per position
  leverage: number; // Leverage multiplier
  includeShorts: boolean; // Allow SHORT positions
}

/**
 * Backtesting strategy configuration
 */
export interface BacktestStrategy {
  name: string;
  description: string;
  entryRules: StrategyRule[];
  exitRules: StrategyRule[];
  stopLossPercent: number; // % stop loss
  takeProfitPercent: number; // % take profit
  minConfidence: number; // Minimum prediction confidence (0-100)
  riskLevels: ('Low' | 'Medium' | 'High' | 'Extreme')[]; // Allowed risk levels
  leverageRange: { min: number; max: number }; // Allowed leverage range
}

/**
 * Strategy rule for entries/exits
 */
export interface StrategyRule {
  indicator: string; // e.g., 'rsi', 'macd', 'bollingerBands'
  condition: 'above' | 'below' | 'crossover' | 'equals';
  value: number | string;
  weight: number; // Importance weight (0-1)
}

/**
 * Individual backtest trade
 */
export interface BacktestTrade {
  id: string;
  coinId: string;
  coinName: string;
  coinSymbol: string;
  type: 'LONG' | 'SHORT';
  entryDate: number; // Timestamp
  entryPrice: number;
  exitDate: number | null; // Timestamp (null if still open)
  exitPrice: number | null;
  quantity: number; // Number of coins
  leverage: number;
  stopLoss: number;
  takeProfit: number;
  capitalUsed: number; // USD invested
  profitLoss: number | null; // USD profit/loss
  profitLossPercent: number | null; // % return
  exitReason: 'take_profit' | 'stop_loss' | 'signal_exit' | 'time_limit' | 'open' | null;
  predictionConfidence: number;
  indicators: Partial<EnhancedTechnicalIndicators>; // Indicators at entry
}

/**
 * Backtest results and performance metrics
 */
export interface BacktestResult {
  config: BacktestConfig;
  trades: BacktestTrade[];
  
  // Performance metrics
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  openTrades: number;
  winRate: number; // Percentage
  
  // Financial metrics
  initialCapital: number;
  finalCapital: number;
  totalReturn: number; // USD
  totalReturnPercent: number; // Percentage
  averageReturn: number; // USD per trade
  averageReturnPercent: number; // % per trade
  
  // Risk metrics
  maxDrawdown: number; // Maximum % loss from peak
  maxDrawdownUSD: number; // Maximum USD loss from peak
  sharpeRatio: number; // Risk-adjusted return
  profitFactor: number; // Gross profit / Gross loss
  
  // Trade metrics
  averageWin: number; // USD
  averageLoss: number; // USD
  largestWin: number; // USD
  largestLoss: number; // USD
  averageHoldTime: number; // Hours
  
  // Equity curve data for charting
  equityCurve: EquityCurvePoint[];
  drawdownCurve: DrawdownPoint[];
  
  // By coin analysis
  performanceByCoin: BacktestCoinPerformance[];
  
  // By timeframe
  performanceByTimeframe: BacktestTimeframePerformance[];
}

/**
 * Equity curve point for charting
 */
export interface EquityCurvePoint {
  timestamp: number;
  equity: number; // Total capital value
  drawdown: number; // % drawdown from peak
  openPositions: number;
}

/**
 * Drawdown point for risk analysis
 */
export interface DrawdownPoint {
  timestamp: number;
  drawdown: number; // % loss from peak
  peak: number; // Peak equity before drawdown
  valley: number; // Lowest equity during drawdown
}

/**
 * Performance breakdown by cryptocurrency
 */
export interface BacktestCoinPerformance {
  coinId: string;
  coinName: string;
  coinSymbol: string;
  totalTrades: number;
  winRate: number;
  totalReturn: number;
  totalReturnPercent: number;
  averageReturn: number;
  bestTrade: number;
  worstTrade: number;
}

/**
 * Performance breakdown by time period
 */
export interface BacktestTimeframePerformance {
  period: string; // e.g., "Jan 2024", "Week 1"
  startDate: number;
  endDate: number;
  trades: number;
  winRate: number;
  return: number;
  returnPercent: number;
}

/**
 * Backtest comparison for multiple strategies
 */
export interface BacktestComparison {
  strategies: {
    name: string;
    result: BacktestResult;
  }[];
  comparisonMetrics: {
    metric: string;
    values: { strategy: string; value: number }[];
  }[];
}

/**
 * Saved backtest for historical reference
 */
export interface SavedBacktest {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  config: BacktestConfig;
  result: BacktestResult;
  notes?: string;
}
