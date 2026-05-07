import { expect, test } from "@playwright/test";

import { resetDatabase, seedPublicPosts } from "../utils/db";

test.describe("Public browsing", () => {
  test.beforeEach(async () => {
    await resetDatabase();
    await seedPublicPosts();
  });

  test("shows only published posts on the home page", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Latest posts" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Published E2E Post" })).toBeVisible();
    await expect(page.getByText("Draft E2E Post")).toHaveCount(0);
  });

  test("requires sign in before commenting", async ({ page }) => {
    await page.goto("/posts/published-e2e-post");

    await expect(page.getByRole("heading", { name: "Published E2E Post" })).toBeVisible();
    await expect(page.getByText("Sign in to comment")).toBeVisible();
    await expect(page.getByRole("link", { name: "Go to sign in" })).toBeVisible();
  });
});
