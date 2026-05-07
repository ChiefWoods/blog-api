import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    projects: [
      {
        test: {
          name: "unit",
          environment: "node",
          include: ["tests/unit/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "dom",
          environment: "jsdom",
          alias: {
            "@": new URL("./", import.meta.url).pathname,
            "@/": new URL("./", import.meta.url).pathname,
          },
          setupFiles: ["tests/dom/setup.ts"],
          include: ["tests/dom/**/*.test.{ts,tsx}"],
        },
      },
    ],
  },
});
