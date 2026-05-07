import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootPath = fileURLToPath(new URL("./src", import.meta.url));
const projectAlias = {
  "@": rootPath,
  "@/": `${rootPath}/`,
};

export default defineConfig({
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
