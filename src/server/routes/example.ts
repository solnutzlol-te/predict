import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { HelloPayloadSchema } from "../schema";

export function createExampleRoute() {
  const route = new Hono()
    .post("hello", zValidator("json", HelloPayloadSchema), (c) => {
      const data = c.req.valid("json");

      return c.json({
        message: `Hello from server: ${data.message}`,
      });
    })
    .get("time", (c) => {
      return c.json({
        serverTime: Date.now(),
      });
    });

  return route;
}
