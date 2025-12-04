import { defineConfig } from "@rsbuild/core";
import { resolve } from "path";

/**
 * Vercel-specific server build configuration
 * Builds app.vercel.ts instead of app.prod.ts
 * 
 * IMPORTANT: Excludes pg and pg-native from bundle to avoid native module issues
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
    externals: {
      // Exclude PostgreSQL packages from bundle (they'll be loaded from node_modules)
      pg: "commonjs pg",
      "pg-native": "commonjs pg-native",
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  tools: {
    rspack: {
      // Ignore pg-native optional dependency warnings
      ignoreWarnings: [
        /Can't resolve 'pg-native'/,
        /Module not found.*pg-native/,
      ],
    },
  },
});
