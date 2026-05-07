import { expect, test } from "@playwright/test";

import { signUp, uniqueCredentials } from "../utils/auth";
import { resetDatabase, seedPublicPosts } from "../utils/db";

test.describe("Authenticated commenter", () => {
  test.beforeEach(async () => {
    await resetDatabase();
    await seedPublicPosts();
  });

  test("can create a comment and cannot access blogger dashboard", async ({ page }) => {
    const commenter = uniqueCredentials("commenter");

    await signUp(page, commenter);

    await expect(page.getByRole("link", { name: "Dashboard" })).toHaveCount(0);

    await page.goto("/blogger/posts");
    await expect(page.getByText("403 - Access denied")).toBeVisible();

    await page.goto("/posts/published-e2e-post");
    await page.getByPlaceholder("Add a comment...").fill("Great article from e2e test.");
    await page.getByRole("button", { name: "Post comment" }).click();

    await expect(page.getByText("Comment posted.")).toBeVisible();
    await expect(page.getByText("Great article from e2e test.")).toBeVisible();
    await expect(page.getByText(`@${commenter.username}`, { exact: true })).toBeVisible();
  });
});
