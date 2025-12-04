/**
 * Prediction history tracking system - NOW WITH CENTRALIZED BACKEND
 * 
 * This module now uses a centralized API for storing predictions and history.
 * All predictions are shared globally across all browsers and devices.
 * 
 * Features:
 * - ✅ Same predictions on every browser
 * - ✅ History persists across devices
 * - ✅ Automatic evaluation of pending predictions
 * - ✅ Real-time win/loss tracking
 * 
 * Fallback: If API fails, uses localStorage as backup
 */

import { PredictionHistoryEntry, CryptoPrediction } from '@/types/crypto';
import {
  fetchPredictionHistory as fetchHistoryFromAPI,
  savePrediction as savePredictionToAPI,
  evaluatePredictions as evaluatePredictionsOnAPI,
  fetchPredictionStats as fetchStatsFromAPI,
} from '@/lib/predictions-api';

const HISTORY_KEY = 'crypto-prediction-history';
const MAX_HISTORY_ENTRIES = 100;
const EVALUATION_TIMEFRAME = 48 * 60 * 60 * 1000; // 48 hours

/**
 * Retrieves prediction history from API (or localStorage as fallback)
 * @returns Array of prediction history entries
 */
export function getPredictionHistory(): PredictionHistoryEntry[] {
  try {
    // Try localStorage as immediate fallback
    const stored = localStorage.getItem(HISTORY_KEY);
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error reading prediction history:', error);
    return [];
  }
}

/**
 * Saves prediction history to localStorage (local cache)
 * @param history - Array of prediction history entries
 */
function savePredictionHistory(history: PredictionHistoryEntry[]): void {
  try {
    const trimmed = history.slice(0, MAX_HISTORY_ENTRIES);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Error saving prediction history:', error);
  }
}

/**
 * Records a new prediction in the history
 * NOW SAVES TO API - predictions are shared globally!
 * @param prediction - The prediction to record
 */
export async function recordPrediction(prediction: CryptoPrediction): Promise<void> {
  try {
    // Save to API (global storage)
    const success = await savePredictionToAPI(prediction);
    
    if (!success) {
      console.warn('Failed to save prediction to API, using localStorage fallback');
      // Fallback to localStorage
      recordPredictionLocal(prediction);
    }
  } catch (error) {
    console.error('Error recording prediction:', error);
    // Fallback to localStorage
    recordPredictionLocal(prediction);
  }
}

/**
 * Local fallback for recording predictions
 */
function recordPredictionLocal(prediction: CryptoPrediction): void {
  const history = getPredictionHistory();
  
  // Check if we already have a very recent prediction for this coin
  const recentPrediction = history.find(
    h => h.coinId === prediction.crypto.id && 
    Date.now() - h.timestamp < 5 * 60 * 1000
  );
  
  if (recentPrediction) {
    console.log(`Skipping duplicate prediction for ${prediction.crypto.name}`);
    return;
  }
  
  const entry: PredictionHistoryEntry = {
    id: `${prediction.crypto.id}-${Date.now()}`,
    coinId: prediction.crypto.id,
    coinName: prediction.crypto.name,
    coinSymbol: prediction.crypto.symbol,
    prediction: prediction.prediction,
    confidence: prediction.confidence,
    predictedPrice: prediction.crypto.current_price,
    targetPrice: prediction.targetPrice,
    stopLoss: prediction.stopLoss,
    actualPrice: null,
    timestamp: Date.now(),
    outcome: 'pending',
    profitLoss: null,
  };
  
  const updated = [entry, ...history];
  savePredictionHistory(updated);
}

/**
 * Evaluates pending predictions against current price data
 * NOW USES API - evaluations are shared globally!
 * @param currentPrices - Map of coin ID to current price
 */
export async function evaluatePendingPredictions(currentPrices: Map<string, number>): Promise<void> {
  try {
    // Convert Map to plain object for API
    const pricesObj: Record<string, number> = {};
    currentPrices.forEach((price, coinId) => {
      pricesObj[coinId] = price;
    });
    
    // Evaluate on API (affects global history)
    const evaluatedCount = await evaluatePredictionsOnAPI(pricesObj);
    
    if (evaluatedCount > 0) {
      console.log(`✅ Evaluated ${evaluatedCount} predictions on server`);
    }
  } catch (error) {
    console.error('Error evaluating predictions on API:', error);
    // Fallback to local evaluation
    evaluatePendingPredictionsLocal(currentPrices);
  }
}

/**
 * Local fallback for evaluating predictions
 */
function evaluatePendingPredictionsLocal(currentPrices: Map<string, number>): void {
  const history = getPredictionHistory();
  let hasChanges = false;
  
  const now = Date.now();
  
  const updated = history.map(entry => {
    if (entry.outcome !== 'pending') {
      return entry;
    }
    
    const currentPrice = currentPrices.get(entry.coinId);
    if (!currentPrice) {
      return entry;
    }
    
    const age = now - entry.timestamp;
    if (age > EVALUATION_TIMEFRAME) {
      hasChanges = true;
      const priceChange = ((currentPrice - entry.predictedPrice) / entry.predictedPrice) * 100;
      return {
        ...entry,
        actualPrice: currentPrice,
        outcome: 'neutral' as const,
        profitLoss: priceChange,
      };
    }
    
    let newOutcome: 'win' | 'loss' | 'neutral' | 'pending' = 'pending';
    
    if (entry.prediction === 'LONG') {
      if (currentPrice >= entry.targetPrice) {
        newOutcome = 'win';
      } else if (currentPrice <= entry.stopLoss) {
        newOutcome = 'loss';
      }
    } else if (entry.prediction === 'SHORT') {
      if (currentPrice <= entry.targetPrice) {
        newOutcome = 'win';
      } else if (currentPrice >= entry.stopLoss) {
        newOutcome = 'loss';
      }
    }
    
    if (newOutcome !== 'pending') {
      hasChanges = true;
      const priceChange = entry.prediction === 'LONG' 
        ? ((currentPrice - entry.predictedPrice) / entry.predictedPrice) * 100
        : ((entry.predictedPrice - currentPrice) / entry.predictedPrice) * 100;
      
      return {
        ...entry,
        actualPrice: currentPrice,
        outcome: newOutcome,
        profitLoss: priceChange,
      };
    }
    
    return entry;
  });
  
  if (hasChanges) {
    savePredictionHistory(updated);
    console.log('✅ Evaluated predictions locally');
  }
}

/**
 * Updates a specific prediction with actual outcome (local only)
 * @param entryId - ID of the prediction entry
 * @param actualPrice - Actual price at evaluation time
 */
export function evaluatePrediction(entryId: string, actualPrice: number): void {
  const history = getPredictionHistory();
  const index = history.findIndex(h => h.id === entryId);
  
  if (index === -1) {
    return;
  }
  
  const entry = history[index];
  
  let outcome: 'win' | 'loss' | 'neutral' = 'neutral';
  
  if (entry.prediction === 'LONG') {
    if (actualPrice >= entry.targetPrice) {
      outcome = 'win';
    } else if (actualPrice <= entry.stopLoss) {
      outcome = 'loss';
    }
  } else if (entry.prediction === 'SHORT') {
    if (actualPrice <= entry.targetPrice) {
      outcome = 'win';
    } else if (actualPrice >= entry.stopLoss) {
      outcome = 'loss';
    }
  }
  
  const priceChange = entry.prediction === 'LONG'
    ? ((actualPrice - entry.predictedPrice) / entry.predictedPrice) * 100
    : ((entry.predictedPrice - actualPrice) / entry.predictedPrice) * 100;
  
  entry.actualPrice = actualPrice;
  entry.outcome = outcome;
  entry.profitLoss = priceChange;
  
  savePredictionHistory(history);
}

/**
 * Prediction stats type matching API response
 */
interface PredictionStats {
  total: number;
  wins: number;
  losses: number;
  neutral: number;
  winRate: number;
  avgProfit: number;
  longWinRate: number;
  shortWinRate: number;
  totalPending: number;
}

/**
 * Gets statistics about prediction accuracy
 * NOW FETCHES FROM API - stats are shared globally!
 * @returns Object with win rate, total predictions, etc.
 */
export async function getPredictionStats(): Promise<PredictionStats> {
  try {
    // Fetch from API (global stats)
    const stats = await fetchStatsFromAPI();
    return stats;
  } catch (error) {
    console.error('Error fetching stats from API:', error);
    // Fallback to local calculation
    return getPredictionStatsLocal();
  }
}

/**
 * Local fallback for getting stats
 */
function getPredictionStatsLocal(): PredictionStats {
  const history = getPredictionHistory();
  const completed = history.filter(h => h.outcome !== 'pending');
  
  const total = completed.length;
  const wins = completed.filter(h => h.outcome === 'win').length;
  const losses = completed.filter(h => h.outcome === 'loss').length;
  const neutral = completed.filter(h => h.outcome === 'neutral').length;
  
  const winRate = total > 0 ? (wins / total) * 100 : 0;
  
  const avgProfit = completed
    .filter(h => h.profitLoss !== null)
    .reduce((sum, h) => sum + (h.profitLoss || 0), 0) / (total || 1);
  
  const longPredictions = completed.filter(h => h.prediction === 'LONG');
  const shortPredictions = completed.filter(h => h.prediction === 'SHORT');
  
  const longWinRate = longPredictions.length > 0
    ? (longPredictions.filter(h => h.outcome === 'win').length / longPredictions.length) * 100
    : 0;
  
  const shortWinRate = shortPredictions.length > 0
    ? (shortPredictions.filter(h => h.outcome === 'win').length / shortPredictions.length) * 100
    : 0;
  
  return {
    total,
    wins,
    losses,
    neutral,
    winRate,
    avgProfit,
    longWinRate,
    shortWinRate,
    totalPending: history.filter(h => h.outcome === 'pending').length,
  };
}

/**
 * Gets recent predictions (last N days)
 * NOW FETCHES FROM API - history is shared globally!
 * @param days - Number of days to look back
 * @returns Array of recent prediction entries
 */
export async function getRecentPredictions(days: number = 7): Promise<PredictionHistoryEntry[]> {
  try {
    // Fetch from API (global history)
    const history = await fetchHistoryFromAPI(days, 100);
    
    // Also cache to localStorage for offline access
    savePredictionHistory(history);
    
    return history;
  } catch (error) {
    console.error('Error fetching recent predictions from API:', error);
    // Fallback to localStorage
    const history = getPredictionHistory();
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    return history.filter(h => h.timestamp >= cutoff);
  }
}

/**
 * Clears all prediction history (local only)
 */
export function clearPredictionHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error('Error clearing prediction history:', error);
  }
}
