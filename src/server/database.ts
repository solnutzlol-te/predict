/**
 * Database Module - In-Memory Storage Only (Simplified for Vercel)
 * 
 * This simplified version uses only in-memory storage to avoid
 * PostgreSQL module loading issues in Vercel serverless functions.
 * 
 * Data will be preserved during the lifetime of the serverless function instance,
 * which typically lasts for several minutes to hours.
 * 
 * To add PostgreSQL support:
 * 1. Uncomment the PostgreSQL code sections below
 * 2. Set DATABASE_URL in Vercel environment variables
 * 3. Redeploy
 */

import {
  PredictionEntry,
  PredictionHistoryEntry,
  PredictionStats,
  SavePredictionRequestSchema,
} from "./schema";
import type { z } from "zod";

type SavePredictionRequest = z.infer<typeof SavePredictionRequestSchema>;

// In-memory storage
const inMemoryPredictions: Map<string, PredictionEntry> = new Map();
const inMemoryHistory: Map<string, PredictionHistoryEntry> = new Map();

console.log('[Database] 💾 Using in-memory storage');

/**
 * Database interface - in-memory only for now
 */
export const db = {
  /**
   * Gets the latest predictions (one per coin, most recent)
   * @returns Array of latest predictions
   */
  async getLatestPredictions(): Promise<PredictionEntry[]> {
    const predictions = Array.from(inMemoryPredictions.values());
    console.log(`[Database] 💾 Fetched ${predictions.length} predictions`);
    return predictions;
  },

  /**
   * Gets a recent prediction for a specific coin
   * @param coinId - CoinGecko coin ID
   * @param maxAge - Maximum age in milliseconds
   * @returns Recent prediction or null
   */
  async getRecentPrediction(
    coinId: string,
    maxAge: number
  ): Promise<PredictionEntry | null> {
    const pred = inMemoryPredictions.get(coinId);
    if (!pred) return null;
    
    const age = Date.now() - pred.createdAt;
    return age <= maxAge ? pred : null;
  },

  /**
   * Saves a new prediction
   * @param data - Prediction data
   * @returns Saved prediction
   */
  async savePrediction(data: SavePredictionRequest): Promise<PredictionEntry> {
    const id = `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const predictionEntry: PredictionEntry = {
      id,
      ...data,
      createdAt: now,
    };

    const historyId = `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const historyEntry: PredictionHistoryEntry = {
      id: historyId,
      predictionId: id,
      coinId: data.coinId,
      coinName: data.coinName,
      coinSymbol: data.coinSymbol,
      prediction: data.prediction,
      confidence: data.confidence,
      predictedPrice: data.predictedPrice,
      targetPrice: data.targetPrice,
      stopLoss: data.stopLoss,
      actualPrice: null,
      timestamp: now,
      evaluatedAt: null,
      outcome: 'pending',
      profitLoss: null,
    };

    inMemoryPredictions.set(data.coinId, predictionEntry);
    inMemoryHistory.set(historyId, historyEntry);
    
    console.log(`[Database] 💾 Saved prediction ${id} (${data.coinSymbol})`);
    
    return predictionEntry;
  },

  /**
   * Gets prediction history
   * @param days - Number of days to look back
   * @param limit - Maximum number of results
   * @returns Array of history entries
   */
  async getPredictionHistory(
    days: number = 7,
    limit: number = 100
  ): Promise<PredictionHistoryEntry[]> {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    const entries = Array.from(inMemoryHistory.values())
      .filter(e => e.timestamp > cutoff)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
    
    console.log(`[Database] 💾 Fetched ${entries.length} history entries`);
    return entries;
  },

  /**
   * Gets all pending predictions
   * @returns Array of pending history entries
   */
  async getPendingPredictions(): Promise<PredictionHistoryEntry[]> {
    return Array.from(inMemoryHistory.values()).filter(e => e.outcome === 'pending');
  },

  /**
   * Evaluates a prediction with actual outcome
   * @param id - History entry ID
   * @param actualPrice - Current price
   * @param outcome - Prediction outcome
   * @param profitLoss - Profit/loss percentage
   * @param evaluatedAt - Evaluation timestamp
   */
  async evaluatePrediction(
    id: string,
    actualPrice: number,
    outcome: "win" | "loss" | "neutral",
    profitLoss: number,
    evaluatedAt: number
  ): Promise<void> {
    const entry = inMemoryHistory.get(id);
    if (entry) {
      entry.actualPrice = actualPrice;
      entry.outcome = outcome;
      entry.profitLoss = profitLoss;
      entry.evaluatedAt = evaluatedAt;
      
      console.log(`[Database] 💾 Evaluated prediction ${id}: ${outcome} (${profitLoss.toFixed(2)}%)`);
    }
  },

  /**
   * Gets prediction statistics
   * @returns Statistics object
   */
  async getPredictionStats(): Promise<PredictionStats> {
    try {
      const entries = Array.from(inMemoryHistory.values());
      const completed = entries.filter(e => e.outcome !== 'pending');
      
      const total = completed.length;
      const wins = completed.filter(e => e.outcome === 'win').length;
      const losses = completed.filter(e => e.outcome === 'loss').length;
      const neutral = completed.filter(e => e.outcome === 'neutral').length;
      
      const avgProfit = completed.reduce((sum, e) => sum + (e.profitLoss || 0), 0) / (total || 1);
      
      const longPreds = completed.filter(e => e.prediction === 'LONG');
      const shortPreds = completed.filter(e => e.prediction === 'SHORT');
      
      return {
        total,
        wins,
        losses,
        neutral,
        winRate: total > 0 ? (wins / total) * 100 : 0,
        avgProfit,
        longWinRate: longPreds.length > 0 ? (longPreds.filter(e => e.outcome === 'win').length / longPreds.length) * 100 : 0,
        shortWinRate: shortPreds.length > 0 ? (shortPreds.filter(e => e.outcome === 'win').length / shortPreds.length) * 100 : 0,
        totalPending: entries.filter(e => e.outcome === 'pending').length,
      };
    } catch (error) {
      console.error('[Database] getPredictionStats error:', error);
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
  },
};
