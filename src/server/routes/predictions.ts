import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  SavePredictionRequestSchema,
  EvaluatePredictionsRequestSchema,
  PredictionEntry,
  PredictionHistoryEntry,
  PredictionStats,
} from "../schema";
import { db } from "../database";

/**
 * Predictions API Routes
 * Provides endpoints for:
 * - Fetching current predictions (global, shared across all users)
 * - Saving new predictions
 * - Fetching prediction history
 * - Evaluating pending predictions
 * - Getting prediction statistics
 */
export function createPredictionsRoute() {
  const route = new Hono()
    /**
     * GET /predictions
     * Fetches the latest predictions for all cryptocurrencies
     * Returns: Array of PredictionEntry objects
     */
    .get("/", async (c) => {
      try {
        const predictions = await db.getLatestPredictions();
        return c.json({ predictions });
      } catch (error) {
        console.error("Error fetching predictions:", error);
        return c.json({ error: "Failed to fetch predictions" }, 500);
      }
    })

    /**
     * POST /predictions
     * Saves a new prediction to the database
     * Body: SavePredictionRequestSchema
     */
    .post("/", zValidator("json", SavePredictionRequestSchema), async (c) => {
      try {
        const data = c.req.valid("json");
        
        // Check if a recent prediction already exists for this coin (within last 5 minutes)
        const recentPrediction = await db.getRecentPrediction(
          data.coinId,
          5 * 60 * 1000 // 5 minutes
        );

        if (recentPrediction) {
          // Return existing prediction to avoid duplicates
          return c.json({ 
            success: true, 
            prediction: recentPrediction,
            message: "Recent prediction already exists"
          });
        }

        // Save new prediction
        const prediction = await db.savePrediction(data);
        
        return c.json({ success: true, prediction });
      } catch (error) {
        console.error("Error saving prediction:", error);
        return c.json({ error: "Failed to save prediction" }, 500);
      }
    })

    /**
     * GET /predictions/history
     * Fetches prediction history (all evaluated predictions)
     * Query params:
     *   - days: number of days to look back (default: 7)
     *   - limit: max number of results (default: 100)
     */
    .get("/history", async (c) => {
      try {
        const days = parseInt(c.req.query("days") || "7");
        const limit = parseInt(c.req.query("limit") || "100");

        const history = await db.getPredictionHistory(days, limit);
        
        return c.json({ history });
      } catch (error) {
        console.error("Error fetching prediction history:", error);
        return c.json({ error: "Failed to fetch history" }, 500);
      }
    })

    /**
     * POST /predictions/evaluate
     * Evaluates pending predictions against current prices
     * Body: { prices: { [coinId]: currentPrice } }
     */
    .post("/evaluate", zValidator("json", EvaluatePredictionsRequestSchema), async (c) => {
      try {
        const { prices } = c.req.valid("json");
        
        // Get all pending predictions
        const pendingPredictions = await db.getPendingPredictions();
        
        const now = Date.now();
        const EVALUATION_TIMEFRAME = 48 * 60 * 60 * 1000; // 48 hours
        
        let evaluatedCount = 0;

        // Evaluate each pending prediction
        for (const pred of pendingPredictions) {
          const currentPrice = prices[pred.coinId];
          
          if (!currentPrice) continue;

          const age = now - pred.timestamp;
          let outcome: "win" | "loss" | "neutral" | "pending" = "pending";

          // Check if prediction has expired
          if (age > EVALUATION_TIMEFRAME) {
            outcome = "neutral";
          } else {
            // Evaluate based on prediction type
            if (pred.prediction === "LONG") {
              if (currentPrice >= pred.targetPrice) {
                outcome = "win";
              } else if (currentPrice <= pred.stopLoss) {
                outcome = "loss";
              }
            } else if (pred.prediction === "SHORT") {
              if (currentPrice <= pred.targetPrice) {
                outcome = "win";
              } else if (currentPrice >= pred.stopLoss) {
                outcome = "loss";
              }
            }
          }

          // Update if outcome changed
          if (outcome !== "pending") {
            const priceChange = pred.prediction === "LONG"
              ? ((currentPrice - pred.predictedPrice) / pred.predictedPrice) * 100
              : ((pred.predictedPrice - currentPrice) / pred.predictedPrice) * 100;

            await db.evaluatePrediction(
              pred.id,
              currentPrice,
              outcome,
              priceChange,
              now
            );
            evaluatedCount++;
          }
        }
        
        return c.json({ 
          success: true, 
          evaluatedCount,
          message: `Evaluated ${evaluatedCount} predictions`
        });
      } catch (error) {
        console.error("Error evaluating predictions:", error);
        return c.json({ error: "Failed to evaluate predictions" }, 500);
      }
    })

    /**
     * GET /predictions/stats
     * Gets prediction statistics (win rate, total predictions, etc.)
     */
    .get("/stats", async (c) => {
      try {
        const stats = await db.getPredictionStats();
        return c.json({ stats });
      } catch (error) {
        console.error("Error fetching stats:", error);
        return c.json({ error: "Failed to fetch stats" }, 500);
      }
    });

  return route;
}
