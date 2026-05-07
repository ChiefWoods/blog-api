import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

config({ path: ".env.test" });

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3100";
const databaseURL = process.env.DATABASE_URL;

if (!databaseURL) {
  throw new Error("DATABASE_URL is required for Playwright E2E tests.");
}

export default defineConfig({
  testDir: "./tests/e2e/specs",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "bunx --bun next dev --turbopack --hostname 127.0.0.1 --port 3100",
    url: baseURL,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    env: {
      ...process.env,
      NODE_ENV: "test",
      DATABASE_URL: databaseURL,
      BETTER_AUTH_URL: baseURL,
      BASE_URL: baseURL,
      CORS_ALLOWED_ORIGINS: baseURL,
      BETTER_AUTH_SECRET:
        process.env.BETTER_AUTH_SECRET ?? "e2e-test-secret-should-be-at-least-32-characters",
      TWITTER_CLIENT_ID: process.env.TWITTER_CLIENT_ID ?? "e2e-twitter-client-id",
      TWITTER_CLIENT_SECRET: process.env.TWITTER_CLIENT_SECRET ?? "e2e-twitter-client-secret",
      DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID ?? "e2e-discord-client-id",
      DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET ?? "e2e-discord-client-secret",
    },
  },
});
