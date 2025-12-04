/**
 * Enhanced prediction engine with COMPREHENSIVE TECHNICAL ANALYSIS
 * Generates SHORT-TERM Long/Short trading calls with achievable targets
 * FULLY INTEGRATED: RSI, MACD, Bollinger Bands, Support/Resistance analysis
 * 
 * KEY PRINCIPLES:
 * - Targets based on actual 24h volatility and market cap
 * - Large caps (BTC, ETH): 3-6% moves
 * - Mid caps: 6-10% moves  
 * - Small caps: 10-20% moves
 * - Timeframes: 4h - 48h for most calls
 * - Stop losses tight (2-4% typically)
 * - BALANCED signals: both LONG and SHORT opportunities
 * - TECHNICAL INDICATORS: RSI, MACD, Bollinger Bands, Support/Resistance
 */

import {
  CryptoData,
  CryptoPrediction,
  PredictionType,
  SentimentScore,
  TechnicalIndicators,
  PredictionReason,
  EnhancedTechnicalIndicators,
} from '@/types/crypto';
import { fetchPriceHistory } from '@/lib/crypto-api';
import {
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  detectSupportResistance,
} from '@/lib/technical-indicators';

/**
 * Calculates basic technical indicators from crypto data
 * @param crypto - Cryptocurrency data from API
 * @returns Technical indicators object
 */
function calculateBasicIndicators(crypto: CryptoData): TechnicalIndicators {
  const price24h = crypto.price_change_percentage_24h || 0;
  const price7d = crypto.price_change_percentage_7d_in_currency || 0;
  
  // Calculate momentum (-100 to 100) with weighted average
  const momentum = Math.max(-100, Math.min(100, (price24h * 2.5 + price7d) / 3.5));
  
  // Determine trends with more sensitivity
  const trend_24h = price24h > 0.5 ? 'bullish' : price24h < -0.5 ? 'bearish' : 'neutral';
  const trend_7d = price7d > 1 ? 'bullish' : price7d < -1 ? 'bearish' : 'neutral';
  
  // Calculate REAL volatility based on 24h range
  const range = crypto.high_24h - crypto.low_24h;
  const volatility = Math.min(100, (range / crypto.current_price) * 100);
  
  // Volume signal (comparing to market cap)
  const volumeRatio = crypto.total_volume / crypto.market_cap;
  const volume_signal = volumeRatio > 0.15 ? 'high' : volumeRatio < 0.05 ? 'low' : 'normal';
  
  // Calculate strength (0-100) based on multiple factors
  const priceStrength = price24h > 0 ? Math.min(30, price24h * 3) : Math.max(-30, price24h * 3);
  const trendStrength = price7d > 0 ? Math.min(20, price7d * 2) : Math.max(-20, price7d * 2);
  const strength = Math.max(0, Math.min(100, 50 + priceStrength + trendStrength));
  
  return {
    trend_24h,
    trend_7d,
    momentum,
    volume_signal,
    volatility,
    strength,
  };
}

/**
 * Determines prediction type using COMPREHENSIVE TECHNICAL ANALYSIS
 * Integrates RSI, MACD, Bollinger Bands for accurate signals
 * @param indicators - Basic technical indicators
 * @param enhancedIndicators - Enhanced technical indicators (RSI, MACD, etc.)
 * @returns LONG, SHORT, or NEUTRAL prediction
 */
function determinePrediction(
  indicators: TechnicalIndicators,
  enhancedIndicators: Partial<EnhancedTechnicalIndicators> | null
): PredictionType {
  const { momentum, trend_24h, trend_7d, strength, volume_signal } = indicators;
  
  // Calculate base signal from price action
  let bullishScore = 0;
  let bearishScore = 0;
  
  // Price momentum signals
  if (momentum > 5 && trend_24h === 'bullish') bullishScore += 2;
  if (momentum > 10 && trend_7d === 'bullish') bullishScore += 2;
  if (momentum < -5 && trend_24h === 'bearish') bearishScore += 2;
  if (momentum < -10 && trend_7d === 'bearish') bearishScore += 2;
  
  // Volume confirmation
  if (volume_signal === 'high' && strength > 55) bullishScore += 1;
  if (volume_signal === 'high' && strength < 45) bearishScore += 1;
  
  // ENHANCED TECHNICAL ANALYSIS INTEGRATION
  if (enhancedIndicators) {
    // RSI Analysis (weight: 3 points)
    if (enhancedIndicators.rsi) {
      const rsi = enhancedIndicators.rsi;
      if (rsi.signal === 'oversold' && rsi.trend === 'bullish') {
        bullishScore += 3; // Strong buy signal
      } else if (rsi.signal === 'oversold') {
        bullishScore += 2; // Moderate buy signal
      } else if (rsi.signal === 'overbought' && rsi.trend === 'bearish') {
        bearishScore += 3; // Strong sell signal
      } else if (rsi.signal === 'overbought') {
        bearishScore += 2; // Moderate sell signal
      }
      
      // RSI momentum
      if (rsi.value > 50 && rsi.trend === 'bullish') bullishScore += 1;
      if (rsi.value < 50 && rsi.trend === 'bearish') bearishScore += 1;
    }
    
    // MACD Analysis (weight: 3 points)
    if (enhancedIndicators.macd) {
      const macd = enhancedIndicators.macd;
      if (macd.crossover === 'bullish_crossover') {
        bullishScore += 3; // Strong buy signal
      } else if (macd.crossover === 'bearish_crossover') {
        bearishScore += 3; // Strong sell signal
      }
      
      if (macd.trend === 'bullish' && macd.histogram > 0) {
        bullishScore += 2;
      } else if (macd.trend === 'bearish' && macd.histogram < 0) {
        bearishScore += 2;
      }
    }
    
    // Bollinger Bands Analysis (weight: 2 points)
    if (enhancedIndicators.bollingerBands) {
      const bb = enhancedIndicators.bollingerBands;
      if (bb.signal === 'oversold' || bb.position === 'below_lower') {
        bullishScore += 2; // Price near lower band = buy opportunity
      } else if (bb.signal === 'overbought' || bb.position === 'above_upper') {
        bearishScore += 2; // Price near upper band = sell opportunity
      }
      
      // Squeeze/expansion analysis
      if (bb.bandwidth < 5 && bb.position === 'near_lower') {
        bullishScore += 1; // Low volatility + near support = potential breakout up
      } else if (bb.bandwidth < 5 && bb.position === 'near_upper') {
        bearishScore += 1; // Low volatility + near resistance = potential breakout down
      }
    }
    
    // Support/Resistance Analysis (weight: 2 points)
    if (enhancedIndicators.supportLevels && enhancedIndicators.resistanceLevels) {
      const hasStrongSupport = enhancedIndicators.supportLevels.some(s => s.strength === 'strong');
      const hasStrongResistance = enhancedIndicators.resistanceLevels.some(r => r.strength === 'strong');
      
      if (hasStrongSupport && trend_24h === 'bullish') {
        bullishScore += 2; // Bouncing off strong support
      }
      if (hasStrongResistance && trend_24h === 'bearish') {
        bearishScore += 2; // Rejected at strong resistance
      }
    }
  }
  
  // Make prediction based on scores
  const scoreDifference = bullishScore - bearishScore;
  
  if (scoreDifference >= 3) return 'LONG';
  if (scoreDifference <= -3) return 'SHORT';
  
  // Fallback to basic momentum if scores are close
  if (momentum > 2) return 'LONG';
  if (momentum < -2) return 'SHORT';
  
  return 'NEUTRAL';
}

/**
 * Calculates sentiment score from all indicators
 * @param indicators - Basic technical indicators
 * @param prediction - Prediction type
 * @param enhancedIndicators - Enhanced technical indicators
 * @returns Sentiment score
 */
function calculateSentiment(
  indicators: TechnicalIndicators,
  prediction: PredictionType,
  enhancedIndicators: Partial<EnhancedTechnicalIndicators> | null
): SentimentScore {
  const { momentum, strength } = indicators;
  
  let sentimentScore = 0;
  
  // Base sentiment from momentum and strength
  if (prediction === 'LONG') {
    sentimentScore = (momentum + strength) / 2;
  } else if (prediction === 'SHORT') {
    sentimentScore = -(Math.abs(momentum) + (100 - strength)) / 2;
  }
  
  // Enhance with technical indicators
  if (enhancedIndicators) {
    // RSI contribution
    if (enhancedIndicators.rsi) {
      if (enhancedIndicators.rsi.signal === 'oversold') sentimentScore += 10;
      if (enhancedIndicators.rsi.signal === 'overbought') sentimentScore -= 10;
    }
    
    // MACD contribution
    if (enhancedIndicators.macd) {
      if (enhancedIndicators.macd.crossover === 'bullish_crossover') sentimentScore += 15;
      if (enhancedIndicators.macd.crossover === 'bearish_crossover') sentimentScore -= 15;
    }
    
    // Bollinger Bands contribution
    if (enhancedIndicators.bollingerBands) {
      if (enhancedIndicators.bollingerBands.signal === 'oversold') sentimentScore += 8;
      if (enhancedIndicators.bollingerBands.signal === 'overbought') sentimentScore -= 8;
    }
  }
  
  // Convert to sentiment category
  if (prediction === 'LONG') {
    if (sentimentScore > 60) return 'EXTREME_BULLISH';
    if (sentimentScore > 40) return 'BULLISH';
    return 'BULLISH';
  }
  
  if (prediction === 'SHORT') {
    if (sentimentScore < -60) return 'EXTREME_BEARISH';
    if (sentimentScore < -40) return 'BEARISH';
    return 'BEARISH';
  }
  
  return 'NEUTRAL';
}

/**
 * Calculates recommended leverage based on confidence and volatility
 * @param confidence - Confidence score (0-100)
 * @param volatility - Volatility percentage (0-100)
 * @param prediction - Prediction type
 * @returns Recommended leverage multiplier
 */
function calculateLeverage(
  confidence: number,
  volatility: number,
  prediction: PredictionType
): number {
  if (prediction === 'NEUTRAL') return 1;
  
  const baseMultiplier = confidence / 100;
  const volatilityFactor = Math.max(0.3, 1 - volatility / 100);
  const leverage = baseMultiplier * volatilityFactor * 10;
  
  // Conservative leverage caps
  if (volatility > 8) return Math.min(2, Math.max(1, Math.round(leverage)));
  if (volatility > 6) return Math.min(3, Math.max(1, Math.round(leverage)));
  if (volatility > 4) return Math.min(5, Math.max(2, Math.round(leverage)));
  if (volatility > 2) return Math.min(7, Math.max(3, Math.round(leverage)));
  
  return Math.min(10, Math.max(3, Math.round(leverage)));
}

/**
 * Determines risk level based on volatility, leverage, and market conditions
 * @param volatility - Volatility percentage
 * @param leverage - Recommended leverage
 * @param indicators - Technical indicators
 * @returns Risk level classification
 */
function calculateRiskLevel(
  volatility: number,
  leverage: number,
  indicators: TechnicalIndicators
): 'Low' | 'Medium' | 'High' | 'Extreme' {
  const riskScore = (volatility * 8) + (leverage * 3) + (100 - indicators.strength) * 0.2;
  
  if (riskScore > 70) return 'Extreme';
  if (riskScore > 45) return 'High';
  if (riskScore > 25) return 'Medium';
  return 'Low';
}

/**
 * Generates human-readable reasons for the prediction with REAL TECHNICAL ANALYSIS
 * @param crypto - Cryptocurrency data
 * @param indicators - Basic technical indicators
 * @param prediction - Prediction type
 * @param enhancedIndicators - Enhanced technical indicators
 * @returns Array of prediction reasons
 */
function generateReasons(
  crypto: CryptoData,
  indicators: TechnicalIndicators,
  prediction: PredictionType,
  enhancedIndicators: Partial<EnhancedTechnicalIndicators> | null
): PredictionReason[] {
  const reasons: PredictionReason[] = [];
  
  // RSI ANALYSIS (Priority #1)
  if (enhancedIndicators?.rsi) {
    const rsi = enhancedIndicators.rsi;
    if (rsi.signal === 'oversold') {
      reasons.push({
        category: 'RSI Signal',
        text: `RSI at ${rsi.value.toFixed(1)} indicates oversold conditions - potential bounce`,
        impact: 'positive',
      });
    } else if (rsi.signal === 'overbought') {
      reasons.push({
        category: 'RSI Signal',
        text: `RSI at ${rsi.value.toFixed(1)} indicates overbought conditions - potential correction`,
        impact: 'negative',
      });
    } else if (rsi.value > 50 && rsi.trend === 'bullish') {
      reasons.push({
        category: 'RSI Signal',
        text: `RSI at ${rsi.value.toFixed(1)} with bullish momentum`,
        impact: 'positive',
      });
    } else if (rsi.value < 50 && rsi.trend === 'bearish') {
      reasons.push({
        category: 'RSI Signal',
        text: `RSI at ${rsi.value.toFixed(1)} with bearish momentum`,
        impact: 'negative',
      });
    }
  }
  
  // MACD ANALYSIS (Priority #2)
  if (enhancedIndicators?.macd) {
    const macd = enhancedIndicators.macd;
    if (macd.crossover === 'bullish_crossover') {
      reasons.push({
        category: 'MACD Signal',
        text: 'Bullish MACD crossover detected - strong momentum shift',
        impact: 'positive',
      });
    } else if (macd.crossover === 'bearish_crossover') {
      reasons.push({
        category: 'MACD Signal',
        text: 'Bearish MACD crossover detected - momentum turning down',
        impact: 'negative',
      });
    } else if (macd.trend === 'bullish' && macd.histogram > 0) {
      reasons.push({
        category: 'MACD Signal',
        text: `MACD bullish with positive histogram (${macd.histogram.toFixed(2)})`,
        impact: 'positive',
      });
    } else if (macd.trend === 'bearish' && macd.histogram < 0) {
      reasons.push({
        category: 'MACD Signal',
        text: `MACD bearish with negative histogram (${macd.histogram.toFixed(2)})`,
        impact: 'negative',
      });
    }
  }
  
  // BOLLINGER BANDS ANALYSIS (Priority #3)
  if (enhancedIndicators?.bollingerBands) {
    const bb = enhancedIndicators.bollingerBands;
    if (bb.position === 'below_lower') {
      reasons.push({
        category: 'Bollinger Bands',
        text: 'Price below lower Bollinger Band - oversold signal',
        impact: 'positive',
      });
    } else if (bb.position === 'above_upper') {
      reasons.push({
        category: 'Bollinger Bands',
        text: 'Price above upper Bollinger Band - overbought signal',
        impact: 'negative',
      });
    } else if (bb.bandwidth < 5) {
      reasons.push({
        category: 'Bollinger Bands',
        text: `Bollinger Band squeeze (${bb.bandwidth.toFixed(1)}%) - breakout imminent`,
        impact: 'neutral',
      });
    }
  }
  
  // SUPPORT/RESISTANCE ANALYSIS (Priority #4)
  if (enhancedIndicators?.supportLevels && enhancedIndicators.supportLevels.length > 0) {
    const strongSupport = enhancedIndicators.supportLevels.find(s => s.strength === 'strong');
    if (strongSupport) {
      reasons.push({
        category: 'Support Level',
        text: `Strong support at $${strongSupport.price.toFixed(2)} (${strongSupport.touches} touches)`,
        impact: 'positive',
      });
    }
  }
  
  if (enhancedIndicators?.resistanceLevels && enhancedIndicators.resistanceLevels.length > 0) {
    const strongResistance = enhancedIndicators.resistanceLevels.find(r => r.strength === 'strong');
    if (strongResistance) {
      reasons.push({
        category: 'Resistance Level',
        text: `Strong resistance at $${strongResistance.price.toFixed(2)} (${strongResistance.touches} touches)`,
        impact: 'negative',
      });
    }
  }
  
  // Price momentum analysis
  const price24h = crypto.price_change_percentage_24h;
  if (Math.abs(price24h) > 2) {
    const isPositive = price24h > 0;
    reasons.push({
      category: 'Momentum',
      text: `${isPositive ? 'Strong upward' : 'Strong downward'} momentum with ${Math.abs(price24h).toFixed(2)}% move in 24h`,
      impact: isPositive ? 'positive' : 'negative',
    });
  }
  
  // Volume analysis
  if (indicators.volume_signal === 'high') {
    const impact = prediction === 'LONG' ? 'positive' : prediction === 'SHORT' ? 'negative' : 'neutral';
    reasons.push({
      category: 'Volume',
      text: 'High trading volume confirms strong market participation',
      impact,
    });
  }
  
  // Volatility analysis
  if (indicators.volatility > 5) {
    reasons.push({
      category: 'Risk',
      text: `High volatility (${indicators.volatility.toFixed(1)}%) - expect larger price swings`,
      impact: 'neutral',
    });
  }
  
  return reasons;
}

/**
 * Calculates REALISTIC target price and stop loss using support/resistance levels
 * @param crypto - Cryptocurrency data
 * @param prediction - Prediction type
 * @param indicators - Basic technical indicators
 * @param leverage - Recommended leverage
 * @param enhancedIndicators - Enhanced technical indicators with support/resistance
 * @returns Object with targetPrice and stopLoss
 */
function calculateTargets(
  crypto: CryptoData,
  prediction: PredictionType,
  indicators: TechnicalIndicators,
  leverage: number,
  enhancedIndicators: Partial<EnhancedTechnicalIndicators> | null
) {
  const currentPrice = crypto.current_price;
  const marketCapRank = crypto.market_cap_rank;
  const realVolatility = indicators.volatility;
  
  // Base target multipliers by market cap tier
  let baseTargetPercent = 0;
  let baseStopPercent = 0;
  
  if (marketCapRank <= 10) {
    baseTargetPercent = 0.045; // 4.5%
    baseStopPercent = 0.015;   // 1.5%
  } else if (marketCapRank <= 30) {
    baseTargetPercent = 0.07;  // 7%
    baseStopPercent = 0.025;   // 2.5%
  } else if (marketCapRank <= 50) {
    baseTargetPercent = 0.095; // 9.5%
    baseStopPercent = 0.03;    // 3%
  } else if (marketCapRank <= 100) {
    baseTargetPercent = 0.125; // 12.5%
    baseStopPercent = 0.035;   // 3.5%
  } else {
    baseTargetPercent = 0.16;  // 16%
    baseStopPercent = 0.045;   // 4.5%
  }
  
  // Adjust for volatility
  const volatilityMultiplier = Math.max(0.7, Math.min(1.8, realVolatility / 3));
  let targetPercent = baseTargetPercent * volatilityMultiplier;
  let stopPercent = baseStopPercent;
  
  // Tighter stops for leveraged positions
  if (leverage >= 5) stopPercent *= 0.6;
  else if (leverage >= 3) stopPercent *= 0.8;
  
  // USE SUPPORT/RESISTANCE LEVELS if available
  let targetPrice = currentPrice;
  let stopLoss = currentPrice;
  
  if (enhancedIndicators && prediction !== 'NEUTRAL') {
    if (prediction === 'LONG') {
      // Target: Next resistance level or calculated target
      if (enhancedIndicators.resistanceLevels && enhancedIndicators.resistanceLevels.length > 0) {
        const nextResistance = enhancedIndicators.resistanceLevels[0].price;
        const resistanceGain = (nextResistance - currentPrice) / currentPrice;
        
        // Use resistance if it's within reasonable range
        if (resistanceGain > 0.01 && resistanceGain < targetPercent * 1.5) {
          targetPrice = nextResistance;
        } else {
          targetPrice = currentPrice * (1 + targetPercent);
        }
      } else {
        targetPrice = currentPrice * (1 + targetPercent);
      }
      
      // Stop loss: Below nearest support or calculated stop
      if (enhancedIndicators.supportLevels && enhancedIndicators.supportLevels.length > 0) {
        const nearestSupport = enhancedIndicators.supportLevels[0].price;
        const supportDistance = (currentPrice - nearestSupport) / currentPrice;
        
        // Use support if it's within reasonable range
        if (supportDistance > 0.005 && supportDistance < stopPercent * 2) {
          stopLoss = nearestSupport * 0.995; // Slightly below support
        } else {
          stopLoss = currentPrice * (1 - stopPercent);
        }
      } else {
        stopLoss = currentPrice * (1 - stopPercent);
      }
    } else if (prediction === 'SHORT') {
      // Target: Next support level or calculated target
      if (enhancedIndicators.supportLevels && enhancedIndicators.supportLevels.length > 0) {
        const nextSupport = enhancedIndicators.supportLevels[0].price;
        const supportDrop = (currentPrice - nextSupport) / currentPrice;
        
        // Use support if it's within reasonable range
        if (supportDrop > 0.01 && supportDrop < targetPercent * 1.5) {
          targetPrice = nextSupport;
        } else {
          targetPrice = currentPrice * (1 - targetPercent);
        }
      } else {
        targetPrice = currentPrice * (1 - targetPercent);
      }
      
      // Stop loss: Above nearest resistance or calculated stop
      if (enhancedIndicators.resistanceLevels && enhancedIndicators.resistanceLevels.length > 0) {
        const nearestResistance = enhancedIndicators.resistanceLevels[0].price;
        const resistanceDistance = (nearestResistance - currentPrice) / currentPrice;
        
        // Use resistance if it's within reasonable range
        if (resistanceDistance > 0.005 && resistanceDistance < stopPercent * 2) {
          stopLoss = nearestResistance * 1.005; // Slightly above resistance
        } else {
          stopLoss = currentPrice * (1 + stopPercent);
        }
      } else {
        stopLoss = currentPrice * (1 + stopPercent);
      }
    }
  } else {
    // Fallback to percentage-based calculations
    if (prediction === 'LONG') {
      targetPrice = currentPrice * (1 + targetPercent);
      stopLoss = currentPrice * (1 - stopPercent);
    } else if (prediction === 'SHORT') {
      targetPrice = currentPrice * (1 - targetPercent);
      stopLoss = currentPrice * (1 + stopPercent);
    } else {
      targetPrice = currentPrice;
      stopLoss = currentPrice * 0.97;
    }
  }
  
  return { targetPrice, stopLoss };
}

/**
 * Determines trading timeframe based on volatility and momentum
 * @param volatility - Volatility percentage
 * @param momentum - Momentum score
 * @param marketCapRank - Market cap ranking
 * @returns Recommended timeframe
 */
function calculateTimeframe(volatility: number, momentum: number, marketCapRank: number): string {
  const strength = Math.abs(momentum);
  
  if (volatility > 8 && strength > 15) return '4-8h';
  if (volatility > 6) return '8-24h';
  if (strength > 20 && volatility > 3) return '1-2d';
  if (volatility < 2 && strength < 10) return '2-5d';
  if (marketCapRank <= 10) return '1-2d';
  
  return '12-36h';
}

/**
 * Generates analysis summary with technical indicators context
 * @param crypto - Cryptocurrency data
 * @param indicators - Technical indicators
 * @param prediction - Prediction type
 * @param leverage - Recommended leverage
 * @param targetPercent - Target percentage
 * @param enhancedIndicators - Enhanced technical indicators
 * @returns Analysis text
 */
function generateAnalysis(
  crypto: CryptoData,
  indicators: TechnicalIndicators,
  prediction: PredictionType,
  leverage: number,
  targetPercent: number,
  enhancedIndicators: Partial<EnhancedTechnicalIndicators> | null
): string {
  const name = crypto.name;
  const momentum = indicators.momentum.toFixed(1);
  const strength = indicators.strength.toFixed(0);
  const volatility = indicators.volatility.toFixed(1);
  const targetPct = (targetPercent * 100).toFixed(1);
  
  // Add technical context
  let techContext = '';
  if (enhancedIndicators) {
    const indicators_text = [];
    
    if (enhancedIndicators.rsi) {
      const rsi = enhancedIndicators.rsi;
      if (rsi.signal === 'oversold') indicators_text.push('RSI oversold');
      else if (rsi.signal === 'overbought') indicators_text.push('RSI overbought');
      else indicators_text.push(`RSI ${rsi.value.toFixed(0)}`);
    }
    
    if (enhancedIndicators.macd?.crossover !== 'none') {
      indicators_text.push(enhancedIndicators.macd.crossover === 'bullish_crossover' ? 'MACD buy signal' : 'MACD sell signal');
    }
    
    if (enhancedIndicators.bollingerBands) {
      const bb = enhancedIndicators.bollingerBands;
      if (bb.signal !== 'neutral') {
        indicators_text.push(`BB ${bb.signal}`);
      }
    }
    
    if (indicators_text.length > 0) {
      techContext = ` Technical: ${indicators_text.join(', ')}.`;
    }
  }
  
  if (prediction === 'LONG') {
    return `${name} shows bullish setup (momentum: ${momentum}) with ${strength}/100 strength.${techContext} Real 24h volatility: ${volatility}%. Target: ${targetPct}% upside. Consider ${leverage}x leverage with tight stops. Enter on dips for better risk/reward.`;
  }
  
  if (prediction === 'SHORT') {
    return `${name} exhibits bearish setup (momentum: ${momentum}) with ${strength}/100 strength.${techContext} Real 24h volatility: ${volatility}%. Target: ${targetPct}% downside. Use ${leverage}x leverage cautiously. Short rallies into resistance zones.`;
  }
  
  return `${name} trading neutral with momentum at ${momentum}.${techContext} Wait for directional confirmation or trade range-bound with 1x only.`;
}

/**
 * Main function: Generates complete prediction with COMPREHENSIVE TECHNICAL ANALYSIS
 * @param crypto - Cryptocurrency data from API
 * @returns Complete prediction with real technical analysis
 */
export async function generatePrediction(crypto: CryptoData): Promise<CryptoPrediction> {
  // Calculate basic indicators
  const indicators = calculateBasicIndicators(crypto);
  
  // Fetch historical price data for enhanced technical analysis
  let enhancedIndicators: Partial<EnhancedTechnicalIndicators> | null = null;
  
  try {
    const priceHistory = await fetchPriceHistory(crypto.id, 90);
    
    if (priceHistory && priceHistory.prices.length > 0) {
      // Calculate enhanced indicators
      const rsi = calculateRSI(priceHistory.prices);
      const macd = calculateMACD(priceHistory.prices);
      const bollingerBands = calculateBollingerBands(priceHistory.prices);
      const { supports, resistances } = detectSupportResistance(priceHistory.prices);
      
      enhancedIndicators = {
        ...indicators,
        rsi,
        macd,
        bollingerBands,
        supportLevels: supports,
        resistanceLevels: resistances,
      };
    }
  } catch (error) {
    console.error(`Failed to fetch price history for ${crypto.id}:`, error);
    // Continue with basic indicators only
  }
  
  // Determine prediction using enhanced technical analysis
  const prediction = determinePrediction(indicators, enhancedIndicators);
  
  // Calculate sentiment using enhanced indicators
  const sentiment = calculateSentiment(indicators, prediction, enhancedIndicators);
  
  // Calculate confidence
  const momentumScore = Math.abs(indicators.momentum) * 1.8;
  const volumeBonus = indicators.volume_signal === 'high' ? 10 : indicators.volume_signal === 'low' ? -5 : 0;
  
  // Technical indicator confidence boost
  let techBonus = 0;
  if (enhancedIndicators) {
    if (enhancedIndicators.rsi?.signal === 'oversold' || enhancedIndicators.rsi?.signal === 'overbought') techBonus += 10;
    if (enhancedIndicators.macd?.crossover !== 'none') techBonus += 15;
    if (enhancedIndicators.bollingerBands?.signal !== 'neutral') techBonus += 8;
  }
  
  const confidence = Math.round(
    Math.min(100, Math.max(30, 40 + momentumScore + volumeBonus + techBonus))
  );
  
  // Calculate leverage
  const leverage = calculateLeverage(confidence, indicators.volatility, prediction);
  
  // Calculate risk level
  const riskLevel = calculateRiskLevel(indicators.volatility, leverage, indicators);
  
  // Generate reasons with technical analysis
  const reasons = generateReasons(crypto, indicators, prediction, enhancedIndicators);
  
  // Calculate targets using support/resistance
  const { targetPrice, stopLoss } = calculateTargets(crypto, prediction, indicators, leverage, enhancedIndicators);
  
  // Calculate actual target percentage
  const targetPercent = prediction === 'LONG' 
    ? (targetPrice - crypto.current_price) / crypto.current_price
    : (crypto.current_price - targetPrice) / crypto.current_price;
  
  // Determine timeframe
  const timeframe = calculateTimeframe(indicators.volatility, indicators.momentum, crypto.market_cap_rank);
  
  // Generate analysis with technical context
  const analysis = generateAnalysis(crypto, indicators, prediction, leverage, targetPercent, enhancedIndicators);
  
  return {
    crypto,
    prediction,
    sentiment,
    confidence,
    indicators,
    reasons,
    targetPrice,
    stopLoss,
    timeframe,
    analysis,
    leverage,
    riskLevel,
  };
}

/**
 * Generates predictions for multiple cryptocurrencies with technical analysis
 * @param cryptos - Array of cryptocurrency data
 * @returns Array of predictions
 */
export async function generatePredictions(cryptos: CryptoData[]): Promise<CryptoPrediction[]> {
  // Process predictions sequentially to avoid rate limiting
  // (Parallel processing with limited concurrency would be ideal, but sequential is safer)
  const predictions: CryptoPrediction[] = [];
  
  for (const crypto of cryptos) {
    try {
      const prediction = await generatePrediction(crypto);
      predictions.push(prediction);
    } catch (error) {
      console.error(`Failed to generate prediction for ${crypto.id}:`, error);
      // Continue with other cryptos
    }
  }
  
  return predictions;
}
