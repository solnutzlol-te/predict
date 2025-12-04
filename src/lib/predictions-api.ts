/**
 * Predictions API Client
 * Handles all API calls for predictions and history
 * Replaces localStorage with centralized backend storage
 */

import { client } from '@/lib/api';
import {
  CryptoPrediction,
  PredictionHistoryEntry,
} from '@/types/crypto';

/**
 * API Response Types
 * These match the actual server responses (not the Zod schemas)
 */
interface PredictionStatsResponse {
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
 * Saves a prediction to the server
 * @param prediction - Prediction to save
 * @returns Success status
 */
export async function savePrediction(prediction: CryptoPrediction): Promise<boolean> {
  try {
    const response = await client.api.predictions.$post({
      json: {
        coinId: prediction.crypto.id,
        coinName: prediction.crypto.name,
        coinSymbol: prediction.crypto.symbol,
        prediction: prediction.prediction,
        sentiment: prediction.sentiment,
        confidence: prediction.confidence,
        predictedPrice: prediction.crypto.current_price,
        targetPrice: prediction.targetPrice,
        stopLoss: prediction.stopLoss,
        leverage: prediction.leverage,
        riskLevel: prediction.riskLevel,
        timeframe: prediction.timeframe,
        analysis: prediction.analysis,
        reasons: prediction.reasons,
        indicators: prediction.indicators,
      },
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error saving prediction:', error);
    return false;
  }
}

/**
 * Fetches prediction history from the server
 * @param days - Number of days to look back (default: 7)
 * @param limit - Maximum number of results (default: 100)
 * @returns Array of history entries
 */
export async function fetchPredictionHistory(
  days: number = 7,
  limit: number = 100
): Promise<PredictionHistoryEntry[]> {
  try {
    const response = await client.api.predictions.history.$get({
      query: {
        days: days.toString(),
        limit: limit.toString(),
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch history');
    }
    
    const data = await response.json();
    return (data.history || []) as PredictionHistoryEntry[];
  } catch (error) {
    console.error('Error fetching history:', error);
    return [];
  }
}

/**
 * Evaluates pending predictions with current prices
 * @param prices - Map of coin ID to current price
 * @returns Number of predictions evaluated
 */
export async function evaluatePredictions(
  prices: Record<string, number>
): Promise<number> {
  try {
    const response = await client.api.predictions.evaluate.$post({
      json: {
        prices,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to evaluate predictions');
    }
    
    const data = await response.json();
    return data.evaluatedCount || 0;
  } catch (error) {
    console.error('Error evaluating predictions:', error);
    return 0;
  }
}

/**
 * Fetches prediction statistics
 * @returns Prediction stats
 */
export async function fetchPredictionStats(): Promise<PredictionStatsResponse> {
  try {
    const response = await client.api.predictions.stats.$get();
    
    if (!response.ok) {
      throw new Error('Failed to fetch stats');
    }
    
    const data = await response.json();
    return (data.stats || {
      total: 0,
      wins: 0,
      losses: 0,
      neutral: 0,
      winRate: 0,
      avgProfit: 0,
      longWinRate: 0,
      shortWinRate: 0,
      totalPending: 0,
    }) as PredictionStatsResponse;
  } catch (error) {
    console.error('Error fetching stats:', error);
    return {
      total: 0,
      wins: 0,
      losses: 0,
      neutral: 0,
      winRate: 0,
      avgProfit: 0,
      longWinRate: 0,
      shortWinRate: 0,
      totalPending: 0,
    };
  }
}
