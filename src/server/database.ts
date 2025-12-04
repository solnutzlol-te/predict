/**
 * Database Module - Hybrid Storage (PostgreSQL + In-Memory Fallback)
 * 
 * This module provides database storage with automatic fallback:
 * - ✅ PostgreSQL when DATABASE_URL is set (persistent, multi-user)
 * - ✅ In-memory storage as fallback (temporary, single-instance)
 * 
 * Environment Variables:
 * - DATABASE_URL: PostgreSQL connection string (Neon, Vercel, etc.)
 * 
 * On Vercel deployment:
 * 1. Set DATABASE_URL in Vercel dashboard (Settings → Environment Variables)
 * 2. Run SQL schema from docs/DATABASE_SETUP.md in Neon console
 * 3. Deploy - database will work automatically!
 */

import {
  PredictionEntry,
  PredictionHistoryEntry,
  PredictionStats,
  SavePredictionRequestSchema,
} from "./schema";
import type { z } from "zod";

type SavePredictionRequest = z.infer<typeof SavePredictionRequestSchema>;

// In-memory storage (fallback)
const inMemoryPredictions: Map<string, PredictionEntry> = new Map();
const inMemoryHistory: Map<string, PredictionHistoryEntry> = new Map();

// PostgreSQL client (initialized if DATABASE_URL exists)
let pgPool: any = null;
let dbInitialized = false;

/**
 * Initialize PostgreSQL connection if DATABASE_URL is set
 */
async function initPostgres() {
  if (dbInitialized) return !!pgPool;
  
  dbInitialized = true;

  if (!process.env.DATABASE_URL) {
    console.log('[Database] 💾 Using in-memory storage (data will reset on restart)');
    console.log('[Database] ℹ️  To enable persistent storage: Set DATABASE_URL in Vercel dashboard');
    return false;
  }

  try {
    // Try to load pg module (only available in Node.js environment)
    const pgModule = await import('pg').catch(() => null);
    
    if (!pgModule) {
      console.warn('[Database] ⚠️  pg module not available, using in-memory storage');
      return false;
    }
    
    const { Pool } = pgModule;
    
    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 10, // Max connections
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    // Test connection with timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout')), 5000)
    );
    
    await Promise.race([
      pgPool.query('SELECT NOW()'),
      timeoutPromise
    ]);
    
    console.log('[Database] ✅ Connected to PostgreSQL database');
    return true;
  } catch (error) {
    console.error('[Database] ⚠️  PostgreSQL connection failed, using in-memory fallback:', error);
    pgPool = null;
    return false;
  }
}

// Initialize on module load (non-blocking)
let initPromise: Promise<boolean> | null = null;

function ensureInit(): Promise<boolean> {
  if (!initPromise) {
    initPromise = initPostgres().catch((error) => {
      console.error('[Database] Initialization error:', error);
      return false;
    });
  }
  return initPromise;
}

/**
 * Database interface - works with both PostgreSQL and in-memory storage
 */
export const db = {
  /**
   * Gets the latest predictions (one per coin, most recent)
   * @returns Array of latest predictions
   */
  async getLatestPredictions(): Promise<PredictionEntry[]> {
    try {
      await ensureInit(); // Ensure initialization is complete

      if (pgPool) {
        try {
          const result = await pgPool.query(`
            SELECT DISTINCT ON (coin_id) 
              id, coin_id, coin_name, coin_symbol, prediction, sentiment,
              confidence, predicted_price, target_price, stop_loss, leverage,
              risk_level, timeframe, analysis, reasons, indicators, created_at
            FROM predictions
            ORDER BY coin_id, created_at DESC
          `);
          
          const predictions = result.rows.map((row: any) => ({
            id: row.id,
            coinId: row.coin_id,
            coinName: row.coin_name,
            coinSymbol: row.coin_symbol,
            prediction: row.prediction,
            sentiment: row.sentiment,
            confidence: row.confidence,
            predictedPrice: row.predicted_price,
            targetPrice: row.target_price,
            stopLoss: row.stop_loss,
            leverage: row.leverage,
            riskLevel: row.risk_level,
            timeframe: row.timeframe,
            analysis: row.analysis,
            reasons: JSON.parse(row.reasons),
            indicators: JSON.parse(row.indicators),
            createdAt: row.created_at,
          }));
          
          console.log(`[Database] 📊 Fetched ${predictions.length} predictions from PostgreSQL`);
          return predictions;
        } catch (error) {
          console.error('[Database] ⚠️  PostgreSQL query failed, using in-memory data:', error);
        }
      }

      // Fallback to in-memory
      console.log(`[Database] 💾 Fetched ${inMemoryPredictions.size} predictions from in-memory storage`);
      return Array.from(inMemoryPredictions.values());
    } catch (error) {
      console.error('[Database] getLatestPredictions error:', error);
      return [];
    }
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
    try {
      await ensureInit();

      if (pgPool) {
        try {
          const cutoff = Date.now() - maxAge;
          const result = await pgPool.query(
            `SELECT * FROM predictions 
             WHERE coin_id = $1 AND created_at > $2 
             ORDER BY created_at DESC LIMIT 1`,
            [coinId, cutoff]
          );
          
          if (result.rows.length === 0) return null;
          
          const row = result.rows[0];
          return {
            id: row.id,
            coinId: row.coin_id,
            coinName: row.coin_name,
            coinSymbol: row.coin_symbol,
            prediction: row.prediction,
            sentiment: row.sentiment,
            confidence: row.confidence,
            predictedPrice: row.predicted_price,
            targetPrice: row.target_price,
            stopLoss: row.stop_loss,
            leverage: row.leverage,
            riskLevel: row.risk_level,
            timeframe: row.timeframe,
            analysis: row.analysis,
            reasons: JSON.parse(row.reasons),
            indicators: JSON.parse(row.indicators),
            createdAt: row.created_at,
          };
        } catch (error) {
          console.error('[Database] ⚠️  PostgreSQL query failed:', error);
        }
      }

      // Fallback
      const pred = inMemoryPredictions.get(coinId);
      if (!pred) return null;
      
      const age = Date.now() - pred.createdAt;
      return age <= maxAge ? pred : null;
    } catch (error) {
      console.error('[Database] getRecentPrediction error:', error);
      return null;
    }
  },

  /**
   * Saves a new prediction
   * @param data - Prediction data
   * @returns Saved prediction
   */
  async savePrediction(data: SavePredictionRequest): Promise<PredictionEntry> {
    try {
      await ensureInit();

      const id = `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = Date.now();

      const predictionEntry: PredictionEntry = {
        id,
        ...data,
        createdAt: now,
      };

      if (pgPool) {
        try {
          // Save to predictions table
          await pgPool.query(
            `INSERT INTO predictions (
              id, coin_id, coin_name, coin_symbol, prediction, sentiment,
              confidence, predicted_price, target_price, stop_loss, leverage,
              risk_level, timeframe, analysis, reasons, indicators, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
            [
              id, data.coinId, data.coinName, data.coinSymbol, data.prediction,
              data.sentiment, data.confidence, data.predictedPrice, data.targetPrice,
              data.stopLoss, data.leverage, data.riskLevel, data.timeframe,
              data.analysis, JSON.stringify(data.reasons), JSON.stringify(data.indicators),
              now
            ]
          );

          // Also insert into history
          const historyId = `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await pgPool.query(
            `INSERT INTO prediction_history (
              id, prediction_id, coin_id, coin_name, coin_symbol, prediction,
              confidence, predicted_price, target_price, stop_loss, timestamp, outcome
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')`,
            [
              historyId, id, data.coinId, data.coinName, data.coinSymbol,
              data.prediction, data.confidence, data.predictedPrice,
              data.targetPrice, data.stopLoss, now
            ]
          );

          console.log(`[Database] ✅ Saved prediction ${id} (${data.coinSymbol}) to PostgreSQL`);
          return predictionEntry;
        } catch (error) {
          console.error('[Database] ⚠️  PostgreSQL save failed, using in-memory:', error);
        }
      }

      // Fallback to in-memory
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
      
      console.log(`[Database] 💾 Saved prediction ${id} (${data.coinSymbol}) to in-memory storage`);
      
      return predictionEntry;
    } catch (error) {
      console.error('[Database] savePrediction error:', error);
      throw error;
    }
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
    try {
      await ensureInit();

      if (pgPool) {
        try {
          const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
          const result = await pgPool.query(
            `SELECT * FROM prediction_history 
             WHERE timestamp > $1 
             ORDER BY timestamp DESC 
             LIMIT $2`,
            [cutoff, limit]
          );

          const entries = result.rows.map((row: any) => ({
            id: row.id,
            predictionId: row.prediction_id,
            coinId: row.coin_id,
            coinName: row.coin_name,
            coinSymbol: row.coin_symbol,
            prediction: row.prediction,
            confidence: row.confidence,
            predictedPrice: row.predicted_price,
            targetPrice: row.target_price,
            stopLoss: row.stop_loss,
            actualPrice: row.actual_price,
            timestamp: row.timestamp,
            evaluatedAt: row.evaluated_at,
            outcome: row.outcome,
            profitLoss: row.profit_loss,
          }));

          console.log(`[Database] 📊 Fetched ${entries.length} history entries from PostgreSQL`);
          return entries;
        } catch (error) {
          console.error('[Database] ⚠️  PostgreSQL query failed:', error);
        }
      }

      // Fallback
      const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
      const entries = Array.from(inMemoryHistory.values())
        .filter(e => e.timestamp > cutoff)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
      
      console.log(`[Database] 💾 Fetched ${entries.length} history entries from in-memory storage`);
      return entries;
    } catch (error) {
      console.error('[Database] getPredictionHistory error:', error);
      return [];
    }
  },

  /**
   * Gets all pending predictions
   * @returns Array of pending history entries
   */
  async getPendingPredictions(): Promise<PredictionHistoryEntry[]> {
    try {
      await ensureInit();

      if (pgPool) {
        try {
          const result = await pgPool.query(
            `SELECT * FROM prediction_history WHERE outcome = 'pending' ORDER BY timestamp DESC`
          );

          return result.rows.map((row: any) => ({
            id: row.id,
            predictionId: row.prediction_id,
            coinId: row.coin_id,
            coinName: row.coin_name,
            coinSymbol: row.coin_symbol,
            prediction: row.prediction,
            confidence: row.confidence,
            predictedPrice: row.predicted_price,
            targetPrice: row.target_price,
            stopLoss: row.stop_loss,
            actualPrice: row.actual_price,
            timestamp: row.timestamp,
            evaluatedAt: row.evaluated_at,
            outcome: row.outcome,
            profitLoss: row.profit_loss,
          }));
        } catch (error) {
          console.error('[Database] ⚠️  PostgreSQL query failed:', error);
        }
      }

      // Fallback
      return Array.from(inMemoryHistory.values()).filter(e => e.outcome === 'pending');
    } catch (error) {
      console.error('[Database] getPendingPredictions error:', error);
      return [];
    }
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
    try {
      await ensureInit();

      if (pgPool) {
        try {
          await pgPool.query(
            `UPDATE prediction_history 
             SET actual_price = $1, outcome = $2, profit_loss = $3, evaluated_at = $4 
             WHERE id = $5`,
            [actualPrice, outcome, profitLoss, evaluatedAt, id]
          );
          
          console.log(`[Database] ✅ Evaluated prediction ${id}: ${outcome} (${profitLoss.toFixed(2)}%)`);
          return;
        } catch (error) {
          console.error('[Database] ⚠️  PostgreSQL update failed:', error);
        }
      }

      // Fallback
      const entry = inMemoryHistory.get(id);
      if (entry) {
        entry.actualPrice = actualPrice;
        entry.outcome = outcome;
        entry.profitLoss = profitLoss;
        entry.evaluatedAt = evaluatedAt;
        
        console.log(`[Database] 💾 Evaluated prediction ${id}: ${outcome} (${profitLoss.toFixed(2)}%)`);
      }
    } catch (error) {
      console.error('[Database] evaluatePrediction error:', error);
    }
  },

  /**
   * Gets prediction statistics
   * @returns Statistics object
   */
  async getPredictionStats(): Promise<PredictionStats> {
    try {
      await ensureInit();

      if (pgPool) {
        try {
          const result = await pgPool.query(`
            SELECT 
              COUNT(*) FILTER (WHERE outcome != 'pending') as total,
              COUNT(*) FILTER (WHERE outcome = 'win') as wins,
              COUNT(*) FILTER (WHERE outcome = 'loss') as losses,
              COUNT(*) FILTER (WHERE outcome = 'neutral') as neutral,
              COUNT(*) FILTER (WHERE outcome = 'pending') as total_pending,
              AVG(profit_loss) FILTER (WHERE outcome != 'pending') as avg_profit,
              COUNT(*) FILTER (WHERE prediction = 'LONG' AND outcome = 'win')::float / 
                NULLIF(COUNT(*) FILTER (WHERE prediction = 'LONG' AND outcome != 'pending'), 0) * 100 as long_win_rate,
              COUNT(*) FILTER (WHERE prediction = 'SHORT' AND outcome = 'win')::float / 
                NULLIF(COUNT(*) FILTER (WHERE prediction = 'SHORT' AND outcome != 'pending'), 0) * 100 as short_win_rate
            FROM prediction_history
          `);

          const row = result.rows[0];
          const total = parseInt(row.total) || 0;
          const wins = parseInt(row.wins) || 0;

          return {
            total,
            wins,
            losses: parseInt(row.losses) || 0,
            neutral: parseInt(row.neutral) || 0,
            winRate: total > 0 ? (wins / total) * 100 : 0,
            avgProfit: parseFloat(row.avg_profit) || 0,
            longWinRate: parseFloat(row.long_win_rate) || 0,
            shortWinRate: parseFloat(row.short_win_rate) || 0,
            totalPending: parseInt(row.total_pending) || 0,
          };
        } catch (error) {
          console.error('[Database] ⚠️  PostgreSQL stats query failed:', error);
        }
      }

      // Fallback
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
      // Return default stats on error
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
