import { fileURLToPath } from "node:url";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

const rootPath = fileURLToPath(new URL("./", import.meta.url));
const projectAlias = {
  "@": rootPath,
  "@/": rootPath,
};

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    projects: [
      {
        test: {
          name: "unit",
          environment: "node",
          alias: projectAlias,
          include: ["tests/unit/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "dom",
          environment: "jsdom",
          alias: projectAlias,
          setupFiles: ["tests/dom/setup.ts"],
          include: ["tests/dom/**/*.test.{ts,tsx}"],
        },
      },
    ],
  },
});
