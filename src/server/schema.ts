import z from "zod";

export const HelloPayloadSchema = z.object({
  message: z.string(),
});
export type HelloPayloadSchema = z.infer<typeof HelloPayloadSchema>;

/**
 * ==================== PREDICTIONS & HISTORY SCHEMAS ====================
 */

/**
 * Prediction entry schema - represents a single prediction stored in database
 */
export const PredictionEntrySchema = z.object({
  id: z.string(), // UUID or auto-generated ID
  coinId: z.string(), // CoinGecko coin ID
  coinName: z.string(),
  coinSymbol: z.string(),
  prediction: z.enum(['LONG', 'SHORT', 'NEUTRAL']),
  sentiment: z.enum(['EXTREME_BULLISH', 'BULLISH', 'NEUTRAL', 'BEARISH', 'EXTREME_BEARISH']),
  confidence: z.number().min(0).max(100),
  predictedPrice: z.number(),
  targetPrice: z.number(),
  stopLoss: z.number(),
  leverage: z.number().min(1).max(100),
  riskLevel: z.enum(['Low', 'Medium', 'High', 'Extreme']),
  timeframe: z.string(),
  analysis: z.string(),
  reasons: z.array(z.object({
    category: z.string(),
    text: z.string(),
    impact: z.enum(['positive', 'negative', 'neutral']),
  })),
  indicators: z.object({
    trend_24h: z.enum(['bullish', 'bearish', 'neutral']),
    trend_7d: z.enum(['bullish', 'bearish', 'neutral']),
    momentum: z.number(),
    volume_signal: z.enum(['high', 'normal', 'low']),
    volatility: z.number(),
    strength: z.number(),
  }),
  createdAt: z.number(), // Timestamp
});

export type PredictionEntry = z.infer<typeof PredictionEntrySchema>;

/**
 * Prediction history entry schema - tracks prediction outcomes
 */
export const PredictionHistoryEntrySchema = z.object({
  id: z.string(),
  predictionId: z.string(), // Reference to PredictionEntry.id
  coinId: z.string(),
  coinName: z.string(),
  coinSymbol: z.string(),
  prediction: z.enum(['LONG', 'SHORT', 'NEUTRAL']),
  confidence: z.number().min(0).max(100),
  predictedPrice: z.number(),
  targetPrice: z.number(),
  stopLoss: z.number(),
  actualPrice: z.number().nullable(),
  timestamp: z.number(), // When prediction was made
  evaluatedAt: z.number().nullable(), // When prediction was evaluated
  outcome: z.enum(['pending', 'win', 'loss', 'neutral']),
  profitLoss: z.number().nullable(), // Percentage profit/loss
});

export type PredictionHistoryEntry = z.infer<typeof PredictionHistoryEntrySchema>;

/**
 * Request schema for saving a prediction
 */
export const SavePredictionRequestSchema = z.object({
  coinId: z.string(),
  coinName: z.string(),
  coinSymbol: z.string(),
  prediction: z.enum(['LONG', 'SHORT', 'NEUTRAL']),
  sentiment: z.enum(['EXTREME_BULLISH', 'BULLISH', 'NEUTRAL', 'BEARISH', 'EXTREME_BEARISH']),
  confidence: z.number().min(0).max(100),
  predictedPrice: z.number(),
  targetPrice: z.number(),
  stopLoss: z.number(),
  leverage: z.number().min(1).max(100),
  riskLevel: z.enum(['Low', 'Medium', 'High', 'Extreme']),
  timeframe: z.string(),
  analysis: z.string(),
  reasons: z.array(z.object({
    category: z.string(),
    text: z.string(),
    impact: z.enum(['positive', 'negative', 'neutral']),
  })),
  indicators: z.object({
    trend_24h: z.enum(['bullish', 'bearish', 'neutral']),
    trend_7d: z.enum(['bullish', 'bearish', 'neutral']),
    momentum: z.number(),
    volume_signal: z.enum(['high', 'normal', 'low']),
    volatility: z.number(),
    strength: z.number(),
  }),
});

/**
 * Request schema for evaluating predictions with current prices
 */
export const EvaluatePredictionsRequestSchema = z.object({
  prices: z.record(z.string(), z.number()), // Map of coinId -> current price
});

/**
 * Stats response schema
 */
export const PredictionStatsSchema = z.object({
  total: z.number(),
  wins: z.number(),
  losses: z.number(),
  neutral: z.number(),
  winRate: z.number(),
  avgProfit: z.number(),
  longWinRate: z.number(),
  shortWinRate: z.number(),
  totalPending: z.number(),
});

export type PredictionStats = z.infer<typeof PredictionStatsSchema>;
