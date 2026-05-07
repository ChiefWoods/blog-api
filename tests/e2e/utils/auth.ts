import { expect, type Page } from "@playwright/test";

type Credentials = {
  username: string;
  email: string;
  password: string;
};

export function uniqueCredentials(prefix: string): Credentials {
  const id = `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const username = id.replace(/[^a-zA-Z0-9_.]/g, "_").slice(0, 24);

  return {
    username,
    email: `${id}@example.com`,
    password: "Password123!",
  };
}

export async function signUp(page: Page, credentials: Credentials) {
  await page.goto("/sign-up");

  await page.getByLabel("Username").fill(credentials.username);
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Password", { exact: true }).fill(credentials.password);
  await page.getByLabel("Confirm password").fill(credentials.password);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByText(`Hi, ${credentials.username}`)).toBeVisible();
}

export async function signIn(page: Page, credentials: Credentials) {
  await page.goto("/sign-in");

  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Password", { exact: true }).fill(credentials.password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL("/");
}

export async function signOut(page: Page) {
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
}
