import { defineConfig } from "@rsbuild/core";
import { resolve } from "path";

/**
 * Vercel-specific server build configuration
 * Builds app.vercel.ts instead of app.prod.ts
 */
export default defineConfig({
  source: {
    entry: {
      server: "./src/server/app.vercel.ts",
    },
  },
  output: {
    target: "node",
    cleanDistPath: false,
    filename: {
      js: "[name].cjs",
    },
    legalComments: "none",
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
