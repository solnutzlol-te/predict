import { AppType } from "@/server/routes";
import { hc } from "hono/client";

export const client = hc<AppType>("");
