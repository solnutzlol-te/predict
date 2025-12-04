import { Hono } from "hono";
import { createExampleRoute } from "./example";
import { createPredictionsRoute } from "./predictions";
import { createCoinGeckoRoute } from "./coingecko";
import { createBinanceRoute } from "./binance";

export function setupRoutes(app: Hono) {
  const routes = new Hono()
    .route("/example", createExampleRoute())
    .route("/predictions", createPredictionsRoute())
    .route("/coingecko", createCoinGeckoRoute())
    .route("/binance", createBinanceRoute());

  const entry = app.route("/api", routes);

  return entry;
}

export type AppType = ReturnType<typeof setupRoutes>;
