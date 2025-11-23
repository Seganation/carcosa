import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./vitest.setup.mts"],
    include: [
      "apps/**/*.{test,spec}.{js,ts,jsx,tsx}",
      "packages/**/*.{test,spec}.{js,ts,jsx,tsx}",
    ],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/build/**",
      "**/coverage/**",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["apps/*/src/**", "packages/*/src/**"],
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "**/types/**",
        "**/*.d.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@carcosa/database": path.resolve(__dirname, "packages/database/src"),
      "@carcosa/types": path.resolve(__dirname, "packages/types/src"),
      "@carcosa/storage": path.resolve(__dirname, "packages/storage/src"),
      "@carcosa/sdk": path.resolve(__dirname, "packages/sdk/src"),
    },
  },
});
