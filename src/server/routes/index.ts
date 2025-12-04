import { Hono } from "hono";

// Import routes with error handling
let createExampleRoute: any;
let createPredictionsRoute: any;
let createCoinGeckoRoute: any;
let createBinanceRoute: any;

try {
  const exampleModule = require("./example");
  createExampleRoute = exampleModule.createExampleRoute;
} catch (error) {
  console.error('[Routes] Failed to load example route:', error);
  createExampleRoute = () => new Hono().get("/", (c) => c.json({ error: "Example route failed to load" }));
}

try {
  const predictionsModule = require("./predictions");
  createPredictionsRoute = predictionsModule.createPredictionsRoute;
} catch (error) {
  console.error('[Routes] Failed to load predictions route:', error);
  createPredictionsRoute = () => new Hono().get("/", (c) => c.json({ error: "Predictions route failed to load" }));
}

try {
  const coingeckoModule = require("./coingecko");
  createCoinGeckoRoute = coingeckoModule.createCoinGeckoRoute;
} catch (error) {
  console.error('[Routes] Failed to load coingecko route:', error);
  createCoinGeckoRoute = () => new Hono().get("/", (c) => c.json({ error: "CoinGecko route failed to load" }));
}

try {
  const binanceModule = require("./binance");
  createBinanceRoute = binanceModule.createBinanceRoute;
} catch (error) {
  console.error('[Routes] Failed to load binance route:', error);
  createBinanceRoute = () => new Hono().get("/", (c) => c.json({ error: "Binance route failed to load", details: error?.message }));
}

export function setupRoutes(app: Hono) {
  console.log('[Routes] Setting up routes...');
  
  try {
    const routes = new Hono()
      .route("/example", createExampleRoute())
      .route("/predictions", createPredictionsRoute())
      .route("/coingecko", createCoinGeckoRoute())
      .route("/binance", createBinanceRoute());

    console.log('[Routes] Routes created successfully');
    
    const entry = app.route("/api", routes);
    
    console.log('[Routes] Routes registered successfully');
    
    return entry;
  } catch (error) {
    console.error('[Routes] ERROR during route setup:', error);
    throw error;
  }
}

export type AppType = ReturnType<typeof setupRoutes>;
