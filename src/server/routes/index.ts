import { Hono } from "hono";

/**
 * Route Setup with Error Isolation
 * Each route is wrapped in try-catch to prevent initialization failures
 */

export function setupRoutes(app: Hono) {
  console.log('[Routes] Starting route setup...');
  
  const routes = new Hono();
  
  // Example route
  try {
    console.log('[Routes] Loading example route...');
    const { createExampleRoute } = require("./example");
    routes.route("/example", createExampleRoute());
    console.log('[Routes] ✓ Example route loaded');
  } catch (error) {
    console.error('[Routes] ✗ Failed to load example route:', error);
  }
  
  // Predictions route
  try {
    console.log('[Routes] Loading predictions route...');
    const { createPredictionsRoute } = require("./predictions");
    routes.route("/predictions", createPredictionsRoute());
    console.log('[Routes] ✓ Predictions route loaded');
  } catch (error) {
    console.error('[Routes] ✗ Failed to load predictions route:', error);
  }
  
  // CoinGecko route
  try {
    console.log('[Routes] Loading coingecko route...');
    const { createCoinGeckoRoute } = require("./coingecko");
    routes.route("/coingecko", createCoinGeckoRoute());
    console.log('[Routes] ✓ CoinGecko route loaded');
  } catch (error) {
    console.error('[Routes] ✗ Failed to load coingecko route:', error);
  }
  
  // Binance route
  try {
    console.log('[Routes] Loading binance route...');
    const { createBinanceRoute } = require("./binance");
    routes.route("/binance", createBinanceRoute());
    console.log('[Routes] ✓ Binance route loaded');
  } catch (error) {
    console.error('[Routes] ✗ Failed to load binance route:', error);
    
    // Add a fallback error route for Binance
    routes.get("/binance/*", (c) => {
      return c.json({ 
        error: 'Binance route failed to initialize',
        message: 'The Binance API proxy is temporarily unavailable'
      }, 503);
    });
  }
  
  console.log('[Routes] All routes processed');
  
  const entry = app.route("/api", routes);
  
  console.log('[Routes] Routes registered to /api');
  
  return entry;
}

export type AppType = ReturnType<typeof setupRoutes>;
