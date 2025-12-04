import { Hono } from "hono";
import { createExampleRoute } from "./example";
import { createPredictionsRoute } from "./predictions";
import { createCoinGeckoRoute } from "./coingecko";
import { createBinanceRoute } from "./binance";

export function setupRoutes(app: Hono) {
  console.log('[Routes] Setting up routes...');
  
  const routes = new Hono()
    .route("/example", createExampleRoute())
    .route("/predictions", createPredictionsRoute())
    .route("/coingecko", createCoinGeckoRoute())
    .route("/binance", createBinanceRoute());

  console.log('[Routes] Routes created successfully');
  
  const entry = app.route("/api", routes);
  
  console.log('[Routes] Routes registered successfully');
  
  return entry;
}

export type AppType = ReturnType<typeof setupRoutes>;
