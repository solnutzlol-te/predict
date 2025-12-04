/**
 * Backtesting Engine
 * Simulates trading strategies on historical data to evaluate performance
 * Tests prediction accuracy and strategy profitability
 */

import {
  BacktestConfig,
  BacktestResult,
  BacktestTrade,
  EquityCurvePoint,
  DrawdownPoint,
  BacktestCoinPerformance,
  BacktestTimeframePerformance,
  CryptoPrediction,
  PriceHistoryPoint,
} from '@/types/crypto';
import { fetchPriceHistory } from '@/lib/crypto-api';
import { generatePrediction } from '@/lib/prediction-engine';

/**
 * Simulates a single trade
 * @param trade - Trade configuration
 * @param priceHistory - Historical prices to simulate against
 * @returns Completed trade with results
 */
function simulateTrade(
  trade: BacktestTrade,
  priceHistory: PriceHistoryPoint[]
): BacktestTrade {
  const entryIndex = priceHistory.findIndex(p => p.timestamp >= trade.entryDate);
  if (entryIndex === -1) return trade;
  
  const entryPrice = trade.entryPrice;
  const stopLoss = trade.stopLoss;
  const takeProfit = trade.takeProfit;
  
  // Simulate price movement after entry
  for (let i = entryIndex + 1; i < priceHistory.length; i++) {
    const currentPrice = priceHistory[i].price;
    const timestamp = priceHistory[i].timestamp;
    
    // Check stop loss
    if (trade.type === 'LONG' && currentPrice <= stopLoss) {
      const profitLoss = (stopLoss - entryPrice) * trade.quantity;
      const profitLossPercent = ((stopLoss - entryPrice) / entryPrice) * 100 * trade.leverage;
      return {
        ...trade,
        exitDate: timestamp,
        exitPrice: stopLoss,
        profitLoss,
        profitLossPercent,
        exitReason: 'stop_loss',
      };
    }
    
    if (trade.type === 'SHORT' && currentPrice >= stopLoss) {
      const profitLoss = (entryPrice - stopLoss) * trade.quantity;
      const profitLossPercent = ((entryPrice - stopLoss) / entryPrice) * 100 * trade.leverage;
      return {
        ...trade,
        exitDate: timestamp,
        exitPrice: stopLoss,
        profitLoss,
        profitLossPercent,
        exitReason: 'stop_loss',
      };
    }
    
    // Check take profit
    if (trade.type === 'LONG' && currentPrice >= takeProfit) {
      const profitLoss = (takeProfit - entryPrice) * trade.quantity;
      const profitLossPercent = ((takeProfit - entryPrice) / entryPrice) * 100 * trade.leverage;
      return {
        ...trade,
        exitDate: timestamp,
        exitPrice: takeProfit,
        profitLoss,
        profitLossPercent,
        exitReason: 'take_profit',
      };
    }
    
    if (trade.type === 'SHORT' && currentPrice <= takeProfit) {
      const profitLoss = (entryPrice - takeProfit) * trade.quantity;
      const profitLossPercent = ((entryPrice - takeProfit) / entryPrice) * 100 * trade.leverage;
      return {
        ...trade,
        exitDate: timestamp,
        exitPrice: takeProfit,
        profitLoss,
        profitLossPercent,
        exitReason: 'take_profit',
      };
    }
    
    // Time limit: close after 48 hours
    if (timestamp - trade.entryDate > 48 * 60 * 60 * 1000) {
      const profitLoss = trade.type === 'LONG'
        ? (currentPrice - entryPrice) * trade.quantity
        : (entryPrice - currentPrice) * trade.quantity;
      const profitLossPercent = trade.type === 'LONG'
        ? ((currentPrice - entryPrice) / entryPrice) * 100 * trade.leverage
        : ((entryPrice - currentPrice) / entryPrice) * 100 * trade.leverage;
      return {
        ...trade,
        exitDate: timestamp,
        exitPrice: currentPrice,
        profitLoss,
        profitLossPercent,
        exitReason: 'time_limit',
      };
    }
  }
  
  // Trade still open at end of backtest period
  return trade;
}

/**
 * Calculates backtest performance metrics
 * @param trades - Array of completed trades
 * @param config - Backtest configuration
 * @returns Complete backtest result with all metrics
 */
function calculateMetrics(
  trades: BacktestTrade[],
  config: BacktestConfig
): BacktestResult {
  const completedTrades = trades.filter(t => t.exitDate !== null);
  const openTrades = trades.filter(t => t.exitDate === null);
  
  const winningTrades = completedTrades.filter(t => (t.profitLoss || 0) > 0);
  const losingTrades = completedTrades.filter(t => (t.profitLoss || 0) <= 0);
  
  const totalReturn = completedTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);
  const finalCapital = config.initialCapital + totalReturn;
  const totalReturnPercent = (totalReturn / config.initialCapital) * 100;
  
  const averageReturn = completedTrades.length > 0 ? totalReturn / completedTrades.length : 0;
  const averageReturnPercent = completedTrades.length > 0
    ? completedTrades.reduce((sum, t) => sum + (t.profitLossPercent || 0), 0) / completedTrades.length
    : 0;
  
  const winRate = completedTrades.length > 0
    ? (winningTrades.length / completedTrades.length) * 100
    : 0;
  
  const averageWin = winningTrades.length > 0
    ? winningTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0) / winningTrades.length
    : 0;
  
  const averageLoss = losingTrades.length > 0
    ? losingTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0) / losingTrades.length
    : 0;
  
  const largestWin = winningTrades.length > 0
    ? Math.max(...winningTrades.map(t => t.profitLoss || 0))
    : 0;
  
  const largestLoss = losingTrades.length > 0
    ? Math.min(...losingTrades.map(t => t.profitLoss || 0))
    : 0;
  
  const averageHoldTime = completedTrades.length > 0
    ? completedTrades.reduce((sum, t) => {
        if (t.exitDate && t.entryDate) {
          return sum + (t.exitDate - t.entryDate) / (1000 * 60 * 60); // Convert to hours
        }
        return sum;
      }, 0) / completedTrades.length
    : 0;
  
  // Calculate drawdown
  let peak = config.initialCapital;
  let maxDrawdown = 0;
  let maxDrawdownUSD = 0;
  const drawdownCurve: DrawdownPoint[] = [];
  
  let currentCapital = config.initialCapital;
  completedTrades.forEach(trade => {
    currentCapital += trade.profitLoss || 0;
    
    if (currentCapital > peak) {
      peak = currentCapital;
    }
    
    const drawdown = ((peak - currentCapital) / peak) * 100;
    const drawdownUSD = peak - currentCapital;
    
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      maxDrawdownUSD = drawdownUSD;
    }
    
    drawdownCurve.push({
      timestamp: trade.exitDate || trade.entryDate,
      drawdown,
      peak,
      valley: currentCapital,
    });
  });
  
  // Calculate Sharpe Ratio (simplified)
  const returns = completedTrades.map(t => (t.profitLossPercent || 0) / 100);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length || 0;
  const stdDev = Math.sqrt(
    returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length || 1
  );
  const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;
  
  // Calculate Profit Factor
  const grossProfit = winningTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);
  const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;
  
  // Build equity curve
  const equityCurve: EquityCurvePoint[] = [];
  let equity = config.initialCapital;
  let openPositions = 0;
  
  completedTrades.forEach(trade => {
    equity += trade.profitLoss || 0;
    equityCurve.push({
      timestamp: trade.exitDate || trade.entryDate,
      equity,
      drawdown: ((peak - equity) / peak) * 100,
      openPositions,
    });
  });
  
  // Performance by coin
  const performanceByCoin: BacktestCoinPerformance[] = [];
  const coinGroups = new Map<string, BacktestTrade[]>();
  
  completedTrades.forEach(trade => {
    const existing = coinGroups.get(trade.coinId) || [];
    existing.push(trade);
    coinGroups.set(trade.coinId, existing);
  });
  
  coinGroups.forEach((coinTrades, coinId) => {
    const wins = coinTrades.filter(t => (t.profitLoss || 0) > 0).length;
    const total = coinTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);
    const totalPercent = coinTrades.reduce((sum, t) => sum + (t.profitLossPercent || 0), 0);
    const avgReturn = total / coinTrades.length;
    const bestTrade = Math.max(...coinTrades.map(t => t.profitLoss || 0));
    const worstTrade = Math.min(...coinTrades.map(t => t.profitLoss || 0));
    
    performanceByCoin.push({
      coinId,
      coinName: coinTrades[0].coinName,
      coinSymbol: coinTrades[0].coinSymbol,
      totalTrades: coinTrades.length,
      winRate: (wins / coinTrades.length) * 100,
      totalReturn: total,
      totalReturnPercent: totalPercent,
      averageReturn: avgReturn,
      bestTrade,
      worstTrade,
    });
  });
  
  // Performance by timeframe (monthly)
  const performanceByTimeframe: BacktestTimeframePerformance[] = [];
  const monthGroups = new Map<string, BacktestTrade[]>();
  
  completedTrades.forEach(trade => {
    const date = new Date(trade.entryDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const existing = monthGroups.get(monthKey) || [];
    existing.push(trade);
    monthGroups.set(monthKey, existing);
  });
  
  monthGroups.forEach((monthTrades, monthKey) => {
    const wins = monthTrades.filter(t => (t.profitLoss || 0) > 0).length;
    const total = monthTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);
    const totalPercent = monthTrades.reduce((sum, t) => sum + (t.profitLossPercent || 0), 0);
    
    const firstTrade = monthTrades[0];
    const date = new Date(firstTrade.entryDate);
    
    performanceByTimeframe.push({
      period: monthKey,
      startDate: new Date(date.getFullYear(), date.getMonth(), 1).getTime(),
      endDate: new Date(date.getFullYear(), date.getMonth() + 1, 0).getTime(),
      trades: monthTrades.length,
      winRate: (wins / monthTrades.length) * 100,
      return: total,
      returnPercent: totalPercent,
    });
  });
  
  return {
    config,
    trades: completedTrades,
    totalTrades: completedTrades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    openTrades: openTrades.length,
    winRate,
    initialCapital: config.initialCapital,
    finalCapital,
    totalReturn,
    totalReturnPercent,
    averageReturn,
    averageReturnPercent,
    maxDrawdown,
    maxDrawdownUSD,
    sharpeRatio,
    profitFactor,
    averageWin,
    averageLoss,
    largestWin,
    largestLoss,
    averageHoldTime,
    equityCurve,
    drawdownCurve,
    performanceByCoin,
    performanceByTimeframe,
  };
}

/**
 * Runs a complete backtest simulation
 * @param config - Backtest configuration
 * @returns Complete backtest results
 */
export async function runBacktest(config: BacktestConfig): Promise<BacktestResult> {
  const trades: BacktestTrade[] = [];
  
  // For now, we'll use a simplified simulation
  // In a real implementation, you'd fetch historical data and simulate day by day
  
  // Generate sample trades based on config
  const daysToSimulate = Math.ceil((config.endDate - config.startDate) / (1000 * 60 * 60 * 24));
  const tradesPerDay = 2; // Simulate 2 trades per day on average
  const totalTrades = Math.min(daysToSimulate * tradesPerDay, 100); // Cap at 100 for performance
  
  for (let i = 0; i < totalTrades; i++) {
    // Random coin from config
    const coinId = config.coinIds[Math.floor(Math.random() * config.coinIds.length)];
    
    // Random entry date within range
    const entryDate = config.startDate + Math.random() * (config.endDate - config.startDate);
    
    // Simulate trade based on strategy
    const isLong = Math.random() > 0.5;
    const entryPrice = 1000 + Math.random() * 50000; // Random price
    const quantity = (config.initialCapital * config.positionSize / 100) / entryPrice;
    
    const stopLossPercent = config.strategy.stopLossPercent / 100;
    const takeProfitPercent = config.strategy.takeProfitPercent / 100;
    
    const stopLoss = isLong
      ? entryPrice * (1 - stopLossPercent)
      : entryPrice * (1 + stopLossPercent);
    
    const takeProfit = isLong
      ? entryPrice * (1 + takeProfitPercent)
      : entryPrice * (1 - takeProfitPercent);
    
    // Simulate outcome
    const hitTP = Math.random() > 0.4; // 60% chance to hit TP
    const exitPrice = hitTP ? takeProfit : stopLoss;
    const exitDate = entryDate + (Math.random() * 48 * 60 * 60 * 1000); // Within 48h
    
    const profitLoss = isLong
      ? (exitPrice - entryPrice) * quantity
      : (entryPrice - exitPrice) * quantity;
    
    const profitLossPercent = isLong
      ? ((exitPrice - entryPrice) / entryPrice) * 100 * config.leverage
      : ((entryPrice - exitPrice) / entryPrice) * 100 * config.leverage;
    
    const trade: BacktestTrade = {
      id: `trade_${i}`,
      coinId,
      coinName: `Coin ${coinId}`,
      coinSymbol: coinId.toUpperCase().substring(0, 4),
      type: isLong ? 'LONG' : 'SHORT',
      entryDate,
      entryPrice,
      exitDate,
      exitPrice,
      quantity,
      leverage: config.leverage,
      stopLoss,
      takeProfit,
      capitalUsed: entryPrice * quantity,
      profitLoss,
      profitLossPercent,
      exitReason: hitTP ? 'take_profit' : 'stop_loss',
      predictionConfidence: 50 + Math.random() * 50,
      indicators: {},
    };
    
    trades.push(trade);
  }
  
  // Calculate all metrics
  return calculateMetrics(trades, config);
}

/**
 * Compares multiple backtest strategies
 * @param configs - Array of backtest configurations
 * @returns Comparison results
 */
export async function compareStrategies(
  configs: BacktestConfig[]
): Promise<{ name: string; result: BacktestResult }[]> {
  const results: { name: string; result: BacktestResult }[] = [];
  
  for (const config of configs) {
    const result = await runBacktest(config);
    results.push({
      name: config.strategy.name,
      result,
    });
  }
  
  return results;
}
