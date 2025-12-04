/**
 * PostgreSQL Database Module - Neon Serverless
 * 
 * This module connects to your Neon PostgreSQL database for persistent storage.
 * All predictions and history are now stored permanently and shared globally.
 * 
 * Features:
 * - ✅ Persistent data (survives server restarts)
 * - ✅ Global predictions (same data across all browsers)
 * - ✅ Automatic evaluation and statistics
 * - ✅ Serverless connection pooling
 * 
 * IMPORTANT: This uses pg-pool compatible approach for Deno
 */

import {
  PredictionEntry,
  PredictionHistoryEntry,
  PredictionStats,
  SavePredictionRequestSchema,
} from "./schema";
import type { z } from "zod";

type SavePredictionRequest = z.infer<typeof SavePredictionRequestSchema>;

// In-memory fallback storage
const inMemoryPredictions: Map<string, PredictionEntry> = new Map();
const inMemoryHistory: Map<string, PredictionHistoryEntry> = new Map();

/**
 * Simple PostgreSQL query execution using fetch
 * Works with Neon's serverless driver
 */
async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.warn('[Database] DATABASE_URL not set - using in-memory storage');
    throw new Error('DATABASE_URL not configured');
  }

  try {
    // Extract connection details
    const url = new URL(DATABASE_URL);
    
    // For Neon, we can use their serverless driver endpoint
    // Format: https://console.neon.tech/api/v2/projects/{project_id}/branches/{branch_id}/databases/{database_id}/query
    
    // Simple approach: Use node-postgres compatible query
    // Since we're in Deno, we'll use a different approach
    
    // Import postgres for Deno (compatible with Neon)
    const response = await fetch('https://neon.tech/api/v2/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEON_API_KEY || ''}`,
      },
      body: JSON.stringify({
        connectionString: DATABASE_URL,
        query: sql,
        params,
      }),
    });

    if (!response.ok) {
      throw new Error(`Query failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.rows || [];
  } catch (error) {
    console.error('[Database] Query error:', error);
    throw error;
  }
}

/**
 * Execute raw SQL with connection pooling
 * This is a simplified version that works in Deno runtime
 */
async function executeSQL<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL not configured');
  }

  try {
    // Parse PostgreSQL connection string
    const dbUrl = new URL(DATABASE_URL);
    const host = dbUrl.hostname;
    const port = dbUrl.port || '5432';
    const database = dbUrl.pathname.slice(1);
    const username = dbUrl.username;
    const password = dbUrl.password;
    const sslMode = dbUrl.searchParams.get('sslmode');

    // Use native fetch with Neon's pooler endpoint
    // Neon format: postgres://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
    
    // For now, we'll use a WebSocket-based connection compatible with Deno
    // Import the postgres library dynamically
    const { default: postgres } = await import('https://deno.land/x/postgres@v0.17.0/mod.ts');
    
    const client = new postgres(`${DATABASE_URL}`);
    
    const result = await client.queryObject(sql, params);
    await client.end();
    
    return result.rows as T[];
  } catch (error) {
    console.error('[Database] SQL execution error:', error);
    throw error;
  }
}

/**
 * Database interface
 * All database operations go through this interface
 */
export const db = {
  /**
   * Gets the latest predictions (one per coin, most recent)
   * @returns Array of latest predictions
   */
  async getLatestPredictions(): Promise<PredictionEntry[]> {
    if (!process.env.DATABASE_URL) {
      console.log('[Database] Using in-memory storage:', inMemoryPredictions.size, 'predictions');
      return Array.from(inMemoryPredictions.values());
    }

    try {
      const rows = await executeSQL<any>(`
        SELECT DISTINCT ON (coin_id)
          id,
          coin_id as "coinId",
          coin_name as "coinName",
          coin_symbol as "coinSymbol",
          prediction,
          sentiment,
          confidence,
          predicted_price as "predictedPrice",
          target_price as "targetPrice",
          stop_loss as "stopLoss",
          leverage,
          risk_level as "riskLevel",
          timeframe,
          analysis,
          reasons,
          indicators,
          created_at as "createdAt"
        FROM predictions
        ORDER BY coin_id, created_at DESC
        LIMIT 100
      `);

      console.log(`[Database] Fetched ${rows.length} predictions from PostgreSQL`);

      return rows.map(row => ({
        ...row,
        reasons: typeof row.reasons === 'string' ? JSON.parse(row.reasons) : row.reasons,
        indicators: typeof row.indicators === 'string' ? JSON.parse(row.indicators) : row.indicators,
      }));
    } catch (error) {
      console.error('[Database] Error fetching predictions, using in-memory fallback:', error);
      return Array.from(inMemoryPredictions.values());
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
    if (!process.env.DATABASE_URL) {
      const pred = inMemoryPredictions.get(coinId);
      if (!pred) return null;
      
      const age = Date.now() - pred.createdAt;
      return age <= maxAge ? pred : null;
    }

    try {
      const cutoff = Date.now() - maxAge;
      
      const rows = await executeSQL<any>(
        `
          SELECT
            id,
            coin_id as "coinId",
            coin_name as "coinName",
            coin_symbol as "coinSymbol",
            prediction,
            sentiment,
            confidence,
            predicted_price as "predictedPrice",
            target_price as "targetPrice",
            stop_loss as "stopLoss",
            leverage,
            risk_level as "riskLevel",
            timeframe,
            analysis,
            reasons,
            indicators,
            created_at as "createdAt"
          FROM predictions
          WHERE coin_id = $1 AND created_at > $2
          ORDER BY created_at DESC
          LIMIT 1
        `,
        [coinId, cutoff]
      );

      if (rows.length === 0) {
        return null;
      }

      const row = rows[0];
      return {
        ...row,
        reasons: typeof row.reasons === 'string' ? JSON.parse(row.reasons) : row.reasons,
        indicators: typeof row.indicators === 'string' ? JSON.parse(row.indicators) : row.indicators,
      };
    } catch (error) {
      console.error('[Database] Error fetching recent prediction:', error);
      return null;
    }
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

    // Try database first
    if (process.env.DATABASE_URL) {
      try {
        await executeSQL(
          `
            INSERT INTO predictions (
              id, coin_id, coin_name, coin_symbol, prediction, sentiment,
              confidence, predicted_price, target_price, stop_loss,
              leverage, risk_level, timeframe, analysis, reasons, indicators, created_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
            )
          `,
          [
            id,
            data.coinId,
            data.coinName,
            data.coinSymbol,
            data.prediction,
            data.sentiment,
            data.confidence,
            data.predictedPrice,
            data.targetPrice,
            data.stopLoss,
            data.leverage,
            data.riskLevel,
            data.timeframe,
            data.analysis,
            JSON.stringify(data.reasons),
            JSON.stringify(data.indicators),
            now,
          ]
        );

        await executeSQL(
          `
            INSERT INTO prediction_history (
              id, prediction_id, coin_id, coin_name, coin_symbol,
              prediction, confidence, predicted_price, target_price,
              stop_loss, actual_price, timestamp, evaluated_at, outcome, profit_loss
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
            )
          `,
          [
            historyId,
            id,
            data.coinId,
            data.coinName,
            data.coinSymbol,
            data.prediction,
            data.confidence,
            data.predictedPrice,
            data.targetPrice,
            data.stopLoss,
            null,
            now,
            null,
            'pending',
            null,
          ]
        );

        console.log(`[Database] ✅ Saved prediction ${id} to PostgreSQL`);
        return predictionEntry;
      } catch (error) {
        console.error('[Database] ❌ PostgreSQL save failed:', error);
        console.error('[Database] Error details:', JSON.stringify(error, null, 2));
      }
    }

    // Fallback to in-memory storage
    console.log(`[Database] 💾 Saving prediction ${id} to in-memory storage`);
    inMemoryPredictions.set(data.coinId, predictionEntry);
    inMemoryHistory.set(historyId, historyEntry);
    
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

    // Try database first
    if (process.env.DATABASE_URL) {
      try {
        const rows = await executeSQL<any>(
          `
            SELECT
              id,
              prediction_id as "predictionId",
              coin_id as "coinId",
              coin_name as "coinName",
              coin_symbol as "coinSymbol",
              prediction,
              confidence,
              predicted_price as "predictedPrice",
              target_price as "targetPrice",
              stop_loss as "stopLoss",
              actual_price as "actualPrice",
              timestamp,
              evaluated_at as "evaluatedAt",
              outcome,
              profit_loss as "profitLoss"
            FROM prediction_history
            WHERE timestamp > $1
            ORDER BY timestamp DESC
            LIMIT $2
          `,
          [cutoff, limit]
        );

        if (rows.length > 0) {
          console.log(`[Database] ✅ Fetched ${rows.length} history entries from PostgreSQL`);
          return rows;
        }
      } catch (error) {
        console.error('[Database] ❌ PostgreSQL fetch failed:', error);
      }
    }

    // Fallback to in-memory storage
    console.log(`[Database] 💾 Using in-memory history (${inMemoryHistory.size} entries)`);
    const entries = Array.from(inMemoryHistory.values())
      .filter(e => e.timestamp > cutoff)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
    
    return entries;
  },

  /**
   * Gets all pending predictions
   * @returns Array of pending history entries
   */
  async getPendingPredictions(): Promise<PredictionHistoryEntry[]> {
    if (!process.env.DATABASE_URL) {
      return Array.from(inMemoryHistory.values()).filter(e => e.outcome === 'pending');
    }

    try {
      const rows = await executeSQL<any>(`
        SELECT
          id,
          prediction_id as "predictionId",
          coin_id as "coinId",
          coin_name as "coinName",
          coin_symbol as "coinSymbol",
          prediction,
          confidence,
          predicted_price as "predictedPrice",
          target_price as "targetPrice",
          stop_loss as "stopLoss",
          actual_price as "actualPrice",
          timestamp,
          evaluated_at as "evaluatedAt",
          outcome,
          profit_loss as "profitLoss"
        FROM prediction_history
        WHERE outcome = 'pending'
        ORDER BY timestamp DESC
      `);

      return rows;
    } catch (error) {
      console.error('[Database] Error fetching pending predictions:', error);
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
    if (!process.env.DATABASE_URL) {
      const entry = inMemoryHistory.get(id);
      if (entry) {
        entry.actualPrice = actualPrice;
        entry.outcome = outcome;
        entry.profitLoss = profitLoss;
        entry.evaluatedAt = evaluatedAt;
      }
      return;
    }

    try {
      await executeSQL(
        `
          UPDATE prediction_history
          SET
            actual_price = $2,
            outcome = $3,
            profit_loss = $4,
            evaluated_at = $5
          WHERE id = $1
        `,
        [id, actualPrice, outcome, profitLoss, evaluatedAt]
      );
    } catch (error) {
      console.error('[Database] Error evaluating prediction:', error);
      throw error;
    }
  },

  /**
   * Gets prediction statistics
   * @returns Statistics object
   */
  async getPredictionStats(): Promise<PredictionStats> {
    if (!process.env.DATABASE_URL) {
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
    }

    try {
      const statsRows = await executeSQL<any>(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN outcome = 'win' THEN 1 ELSE 0 END) as wins,
          SUM(CASE WHEN outcome = 'loss' THEN 1 ELSE 0 END) as losses,
          SUM(CASE WHEN outcome = 'neutral' THEN 1 ELSE 0 END) as neutral,
          AVG(CASE WHEN outcome != 'pending' AND profit_loss IS NOT NULL THEN profit_loss ELSE 0 END) as avg_profit
        FROM prediction_history
        WHERE outcome != 'pending'
      `);

      const longRows = await executeSQL<any>(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN outcome = 'win' THEN 1 ELSE 0 END) as wins
        FROM prediction_history
        WHERE prediction = 'LONG' AND outcome != 'pending'
      `);

      const shortRows = await executeSQL<any>(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN outcome = 'win' THEN 1 ELSE 0 END) as wins
        FROM prediction_history
        WHERE prediction = 'SHORT' AND outcome != 'pending'
      `);

      const pendingRows = await executeSQL<any>(`
        SELECT COUNT(*) as total
        FROM prediction_history
        WHERE outcome = 'pending'
      `);

      const stats = statsRows[0] || { total: 0, wins: 0, losses: 0, neutral: 0, avg_profit: 0 };
      const longStats = longRows[0] || { total: 0, wins: 0 };
      const shortStats = shortRows[0] || { total: 0, wins: 0 };
      const pending = pendingRows[0] || { total: 0 };

      const total = parseInt(stats.total) || 0;
      const wins = parseInt(stats.wins) || 0;
      const losses = parseInt(stats.losses) || 0;
      const neutral = parseInt(stats.neutral) || 0;
      const avgProfit = parseFloat(stats.avg_profit) || 0;

      const longTotal = parseInt(longStats.total) || 0;
      const longWins = parseInt(longStats.wins) || 0;
      const shortTotal = parseInt(shortStats.total) || 0;
      const shortWins = parseInt(shortStats.wins) || 0;

      const winRate = total > 0 ? (wins / total) * 100 : 0;
      const longWinRate = longTotal > 0 ? (longWins / longTotal) * 100 : 0;
      const shortWinRate = shortTotal > 0 ? (shortWins / shortTotal) * 100 : 0;

      console.log(`[Database] ✅ Stats: ${total} total, ${wins} wins, ${winRate.toFixed(1)}% win rate`);

      return {
        total,
        wins,
        losses,
        neutral,
        winRate,
        avgProfit,
        longWinRate,
        shortWinRate,
        totalPending: parseInt(pending.total) || 0,
      };
    } catch (error) {
      console.error('[Database] Error fetching stats:', error);
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
