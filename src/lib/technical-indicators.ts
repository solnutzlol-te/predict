/**
 * Enhanced Technical Indicators Library
 * Implements RSI, MACD, Bollinger Bands, Support/Resistance, and more
 * All calculations use standard formulas from technical analysis
 */

import {
  PriceHistoryPoint,
  RSIIndicator,
  MACDIndicator,
  BollingerBandsIndicator,
  SupportResistanceLevel,
  CandlestickPattern,
  CandlestickPatternResult,
  VolumeProfile,
  EnhancedTechnicalIndicators,
  TechnicalIndicators,
} from '@/types/crypto';

/**
 * Calculates Simple Moving Average (SMA)
 * @param prices - Array of prices
 * @param period - Number of periods
 * @returns SMA value
 */
function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
  return sum / period;
}

/**
 * Calculates Exponential Moving Average (EMA)
 * @param prices - Array of prices
 * @param period - Number of periods
 * @returns EMA value
 */
function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return calculateSMA(prices, prices.length);
  
  const multiplier = 2 / (period + 1);
  let ema = calculateSMA(prices.slice(0, period), period);
  
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  
  return ema;
}

/**
 * Calculates RSI (Relative Strength Index)
 * RSI = 100 - (100 / (1 + RS)), where RS = Average Gain / Average Loss
 * @param prices - Price history array
 * @param period - RSI period (default 14)
 * @returns RSI indicator object
 */
export function calculateRSI(prices: PriceHistoryPoint[], period: number = 14): RSIIndicator {
  if (prices.length < period + 1) {
    return {
      value: 50,
      signal: 'neutral',
      trend: 'neutral',
    };
  }
  
  const priceChanges: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    priceChanges.push(prices[i].price - prices[i - 1].price);
  }
  
  let avgGain = 0;
  let avgLoss = 0;
  
  // Initial average gain/loss
  for (let i = 0; i < period; i++) {
    if (priceChanges[i] > 0) {
      avgGain += priceChanges[i];
    } else {
      avgLoss += Math.abs(priceChanges[i]);
    }
  }
  
  avgGain /= period;
  avgLoss /= period;
  
  // Subsequent smoothed averages
  for (let i = period; i < priceChanges.length; i++) {
    const change = priceChanges[i];
    if (change > 0) {
      avgGain = (avgGain * (period - 1) + change) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(change)) / period;
    }
  }
  
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  
  // Determine signal
  let signal: 'overbought' | 'oversold' | 'neutral';
  if (rsi > 70) signal = 'overbought';
  else if (rsi < 30) signal = 'oversold';
  else signal = 'neutral';
  
  // Determine trend
  let trend: 'bullish' | 'bearish' | 'neutral';
  if (rsi > 50 && priceChanges[priceChanges.length - 1] > 0) trend = 'bullish';
  else if (rsi < 50 && priceChanges[priceChanges.length - 1] < 0) trend = 'bearish';
  else trend = 'neutral';
  
  return { value: rsi, signal, trend };
}

/**
 * Calculates MACD (Moving Average Convergence Divergence)
 * MACD Line = 12-period EMA - 26-period EMA
 * Signal Line = 9-period EMA of MACD Line
 * Histogram = MACD Line - Signal Line
 * @param prices - Price history array
 * @returns MACD indicator object
 */
export function calculateMACD(prices: PriceHistoryPoint[]): MACDIndicator {
  const priceValues = prices.map(p => p.price);
  
  if (priceValues.length < 26) {
    return {
      macd: 0,
      signal: 0,
      histogram: 0,
      trend: 'neutral',
      crossover: 'none',
    };
  }
  
  // Calculate EMAs
  const ema12 = calculateEMA(priceValues, 12);
  const ema26 = calculateEMA(priceValues, 26);
  const macdLine = ema12 - ema26;
  
  // Calculate signal line (9-period EMA of MACD)
  const macdHistory: number[] = [];
  for (let i = 26; i <= priceValues.length; i++) {
    const slice = priceValues.slice(0, i);
    const ema12Temp = calculateEMA(slice, 12);
    const ema26Temp = calculateEMA(slice, 26);
    macdHistory.push(ema12Temp - ema26Temp);
  }
  
  const signalLine = calculateEMA(macdHistory, 9);
  const histogram = macdLine - signalLine;
  
  // Determine trend
  let trend: 'bullish' | 'bearish' | 'neutral';
  if (macdLine > signalLine && histogram > 0) trend = 'bullish';
  else if (macdLine < signalLine && histogram < 0) trend = 'bearish';
  else trend = 'neutral';
  
  // Detect crossover
  let crossover: 'bullish_crossover' | 'bearish_crossover' | 'none' = 'none';
  if (macdHistory.length >= 2) {
    const prevMACD = macdHistory[macdHistory.length - 2];
    const prevSignal = calculateEMA(macdHistory.slice(0, -1), 9);
    
    // Bullish crossover: MACD crosses above signal
    if (prevMACD <= prevSignal && macdLine > signalLine) {
      crossover = 'bullish_crossover';
    }
    // Bearish crossover: MACD crosses below signal
    else if (prevMACD >= prevSignal && macdLine < signalLine) {
      crossover = 'bearish_crossover';
    }
  }
  
  return {
    macd: macdLine,
    signal: signalLine,
    histogram,
    trend,
    crossover,
  };
}

/**
 * Calculates Bollinger Bands
 * Upper Band = SMA + (2 * Standard Deviation)
 * Middle Band = SMA
 * Lower Band = SMA - (2 * Standard Deviation)
 * @param prices - Price history array
 * @param period - Period for calculation (default 20)
 * @param stdDev - Standard deviation multiplier (default 2)
 * @returns Bollinger Bands indicator object
 */
export function calculateBollingerBands(
  prices: PriceHistoryPoint[],
  period: number = 20,
  stdDev: number = 2
): BollingerBandsIndicator {
  const priceValues = prices.map(p => p.price);
  const currentPrice = priceValues[priceValues.length - 1];
  
  if (priceValues.length < period) {
    return {
      upper: currentPrice * 1.05,
      middle: currentPrice,
      lower: currentPrice * 0.95,
      bandwidth: 10,
      position: 'middle',
      signal: 'neutral',
    };
  }
  
  // Calculate SMA
  const sma = calculateSMA(priceValues, period);
  
  // Calculate standard deviation
  const recentPrices = priceValues.slice(-period);
  const variance = recentPrices.reduce((sum, price) => {
    return sum + Math.pow(price - sma, 2);
  }, 0) / period;
  const standardDeviation = Math.sqrt(variance);
  
  const upper = sma + (stdDev * standardDeviation);
  const lower = sma - (stdDev * standardDeviation);
  const bandwidth = ((upper - lower) / sma) * 100;
  
  // Determine position
  let position: 'above_upper' | 'near_upper' | 'middle' | 'near_lower' | 'below_lower';
  const upperThreshold = upper - (upper - sma) * 0.2;
  const lowerThreshold = lower + (sma - lower) * 0.2;
  
  if (currentPrice > upper) position = 'above_upper';
  else if (currentPrice > upperThreshold) position = 'near_upper';
  else if (currentPrice < lower) position = 'below_lower';
  else if (currentPrice < lowerThreshold) position = 'near_lower';
  else position = 'middle';
  
  // Determine signal
  let signal: 'overbought' | 'oversold' | 'neutral';
  if (position === 'above_upper' || position === 'near_upper') signal = 'overbought';
  else if (position === 'below_lower' || position === 'near_lower') signal = 'oversold';
  else signal = 'neutral';
  
  return {
    upper,
    middle: sma,
    lower,
    bandwidth,
    position,
    signal,
  };
}

/**
 * Detects support and resistance levels
 * Uses local minima/maxima and clustering algorithm
 * @param prices - Price history array
 * @param threshold - Price threshold for clustering (default 2%)
 * @returns Array of support and resistance levels
 */
export function detectSupportResistance(
  prices: PriceHistoryPoint[],
  threshold: number = 0.02
): { supports: SupportResistanceLevel[]; resistances: SupportResistanceLevel[] } {
  if (prices.length < 10) {
    return { supports: [], resistances: [] };
  }
  
  const priceValues = prices.map(p => p.price);
  const currentPrice = priceValues[priceValues.length - 1];
  
  // Find local minima (potential support) and maxima (potential resistance)
  const supports: { price: number; touches: number }[] = [];
  const resistances: { price: number; touches: number }[] = [];
  
  for (let i = 2; i < priceValues.length - 2; i++) {
    const price = priceValues[i];
    const prev1 = priceValues[i - 1];
    const prev2 = priceValues[i - 2];
    const next1 = priceValues[i + 1];
    const next2 = priceValues[i + 2];
    
    // Local minimum (support)
    if (price < prev1 && price < prev2 && price < next1 && price < next2) {
      // Cluster similar price levels
      const existing = supports.find(s => Math.abs(s.price - price) / price < threshold);
      if (existing) {
        existing.touches++;
        existing.price = (existing.price * (existing.touches - 1) + price) / existing.touches;
      } else {
        supports.push({ price, touches: 1 });
      }
    }
    
    // Local maximum (resistance)
    if (price > prev1 && price > prev2 && price > next1 && price > next2) {
      const existing = resistances.find(r => Math.abs(r.price - price) / price < threshold);
      if (existing) {
        existing.touches++;
        existing.price = (existing.price * (existing.touches - 1) + price) / existing.touches;
      } else {
        resistances.push({ price, touches: 1 });
      }
    }
  }
  
  // Convert to proper format and determine strength
  const formatLevel = (level: { price: number; touches: number }, type: 'support' | 'resistance'): SupportResistanceLevel => {
    let strength: 'strong' | 'moderate' | 'weak';
    if (level.touches >= 3) strength = 'strong';
    else if (level.touches === 2) strength = 'moderate';
    else strength = 'weak';
    
    return {
      price: level.price,
      type,
      strength,
      touches: level.touches,
    };
  };
  
  // Filter to keep only relevant levels (within 20% of current price)
  const relevantSupports = supports
    .filter(s => s.price < currentPrice && s.price > currentPrice * 0.8)
    .sort((a, b) => b.price - a.price) // Closest to current price first
    .slice(0, 3)
    .map(s => formatLevel(s, 'support'));
  
  const relevantResistances = resistances
    .filter(r => r.price > currentPrice && r.price < currentPrice * 1.2)
    .sort((a, b) => a.price - b.price) // Closest to current price first
    .slice(0, 3)
    .map(r => formatLevel(r, 'resistance'));
  
  return {
    supports: relevantSupports,
    resistances: relevantResistances,
  };
}

/**
 * Identifies candlestick patterns
 * Analyzes recent price action for common patterns
 * @param prices - Price history array (needs OHLC data)
 * @returns Candlestick pattern result
 */
export function identifyCandlestickPattern(prices: PriceHistoryPoint[]): CandlestickPatternResult {
  // Note: This is a simplified version since we only have closing prices
  // In a real implementation, you'd need OHLC (Open, High, Low, Close) data
  
  if (prices.length < 4) {
    return {
      pattern: 'none',
      signal: 'neutral',
      confidence: 0,
      description: 'Insufficient data for pattern recognition',
    };
  }
  
  const recent = prices.slice(-4).map(p => p.price);
  const [p0, p1, p2, p3] = recent;
  
  // Calculate price changes
  const change1 = p1 - p0;
  const change2 = p2 - p1;
  const change3 = p3 - p2;
  
  // Doji: Very small body (< 0.1% change)
  if (Math.abs(change3) / p2 < 0.001) {
    return {
      pattern: 'doji',
      signal: 'neutral',
      confidence: 60,
      description: 'Doji pattern detected - indecision in the market',
    };
  }
  
  // Bullish Engulfing: Large green candle after red candle
  if (change2 < 0 && change3 > 0 && Math.abs(change3) > Math.abs(change2) * 1.5) {
    return {
      pattern: 'engulfing_bullish',
      signal: 'bullish',
      confidence: 75,
      description: 'Bullish engulfing pattern - strong reversal signal',
    };
  }
  
  // Bearish Engulfing: Large red candle after green candle
  if (change2 > 0 && change3 < 0 && Math.abs(change3) > Math.abs(change2) * 1.5) {
    return {
      pattern: 'engulfing_bearish',
      signal: 'bearish',
      confidence: 75,
      description: 'Bearish engulfing pattern - strong reversal signal',
    };
  }
  
  // Morning Star: Down, small body, up (bullish reversal)
  if (change1 < 0 && Math.abs(change2) < Math.abs(change1) * 0.5 && change3 > 0) {
    return {
      pattern: 'morning_star',
      signal: 'bullish',
      confidence: 70,
      description: 'Morning star pattern - bullish reversal',
    };
  }
  
  // Evening Star: Up, small body, down (bearish reversal)
  if (change1 > 0 && Math.abs(change2) < Math.abs(change1) * 0.5 && change3 < 0) {
    return {
      pattern: 'evening_star',
      signal: 'bearish',
      confidence: 70,
      description: 'Evening star pattern - bearish reversal',
    };
  }
  
  // Three White Soldiers: Three consecutive strong up candles
  if (change1 > 0 && change2 > 0 && change3 > 0 && 
      change1 > p0 * 0.01 && change2 > p1 * 0.01 && change3 > p2 * 0.01) {
    return {
      pattern: 'three_white_soldiers',
      signal: 'bullish',
      confidence: 80,
      description: 'Three white soldiers - strong bullish continuation',
    };
  }
  
  // Three Black Crows: Three consecutive strong down candles
  if (change1 < 0 && change2 < 0 && change3 < 0 &&
      Math.abs(change1) > p0 * 0.01 && Math.abs(change2) > p1 * 0.01 && Math.abs(change3) > p2 * 0.01) {
    return {
      pattern: 'three_black_crows',
      signal: 'bearish',
      confidence: 80,
      description: 'Three black crows - strong bearish continuation',
    };
  }
  
  return {
    pattern: 'none',
    signal: 'neutral',
    confidence: 0,
    description: 'No significant candlestick pattern detected',
  };
}

/**
 * Calculates volume profile
 * Shows volume distribution across price levels
 * @param prices - Price history with volumes
 * @param priceRanges - Number of price buckets (default 20)
 * @returns Volume profile array
 */
export function calculateVolumeProfile(
  pricesWithVolume: { price: number; volume: number }[],
  priceRanges: number = 20
): VolumeProfile[] {
  if (pricesWithVolume.length === 0) return [];
  
  const prices = pricesWithVolume.map(p => p.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceStep = (maxPrice - minPrice) / priceRanges;
  
  // Initialize buckets
  const buckets: { priceLevel: number; volume: number }[] = [];
  for (let i = 0; i < priceRanges; i++) {
    buckets.push({
      priceLevel: minPrice + priceStep * i + priceStep / 2,
      volume: 0,
    });
  }
  
  // Distribute volumes into buckets
  pricesWithVolume.forEach(({ price, volume }) => {
    const bucketIndex = Math.min(
      Math.floor((price - minPrice) / priceStep),
      priceRanges - 1
    );
    buckets[bucketIndex].volume += volume;
  });
  
  // Calculate percentages
  const totalVolume = buckets.reduce((sum, b) => sum + b.volume, 0);
  
  return buckets
    .map(bucket => ({
      priceLevel: bucket.priceLevel,
      volume: bucket.volume,
      percentage: (bucket.volume / totalVolume) * 100,
    }))
    .filter(b => b.volume > 0)
    .sort((a, b) => b.volume - a.volume);
}

/**
 * Combines all enhanced technical indicators
 * @param prices - Price history array
 * @param basicIndicators - Basic indicators from prediction engine
 * @returns Complete enhanced technical indicators
 */
export function calculateEnhancedIndicators(
  prices: PriceHistoryPoint[],
  basicIndicators: TechnicalIndicators
): EnhancedTechnicalIndicators {
  const rsi = calculateRSI(prices);
  const macd = calculateMACD(prices);
  const bollingerBands = calculateBollingerBands(prices);
  const { supports, resistances } = detectSupportResistance(prices);
  const candlestickPattern = identifyCandlestickPattern(prices);
  
  // Volume profile needs volume data - simulate it for now
  const volumeProfile = calculateVolumeProfile(
    prices.slice(-30).map(p => ({ price: p.price, volume: Math.random() * 1000000 }))
  );
  
  return {
    ...basicIndicators,
    rsi,
    macd,
    bollingerBands,
    supportLevels: supports,
    resistanceLevels: resistances,
    candlestickPattern,
    volumeProfile,
  };
}
