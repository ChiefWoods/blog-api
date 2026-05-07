import { expect, test } from "@playwright/test";

import { signUp, uniqueCredentials } from "../utils/auth";
import {
  createPost,
  getUserIdByEmail,
  resetDatabase,
  seedPublicPosts,
  setUserAdminByEmail,
} from "../utils/db";

test.describe("Admin flow", () => {
  test.beforeEach(async () => {
    await resetDatabase();
    await seedPublicPosts();
  });

  test("admin can publish a draft post from dashboard", async ({ page }) => {
    const admin = uniqueCredentials("admin");

    await signUp(page, admin);

    await setUserAdminByEmail(admin.email, true);
    const adminUserId = await getUserIdByEmail(admin.email);
    expect(adminUserId).not.toBeNull();

    await createPost({
      authorId: adminUserId as string,
      title: "Admin Draft Post",
      slug: "admin-draft-post",
      published: false,
      excerpt: "Admin draft excerpt",
    });

    await page.goto("/");
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();

    await page.getByRole("link", { name: "Dashboard" }).click();
    await expect(page.getByRole("heading", { name: "Manage posts" })).toBeVisible();

    await page.getByRole("button", { name: "Publish Admin Draft Post" }).click();
    await expect(page.getByText("Post published.")).toBeVisible();

    await page.goto("/");
    await expect(page.getByRole("link", { name: "Admin Draft Post" })).toBeVisible();
  });
});
