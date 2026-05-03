import { beforeEach, describe, expect, it, vi } from "vitest";

const betterAuthMock = vi.fn((config: unknown) => ({ config }));
const prismaAdapterMock = vi.fn((prisma: unknown, options: unknown) => ({
  kind: "prisma-adapter",
  prisma,
  options,
}));
const nextCookiesMock = vi.fn(() => ({ id: "next-cookies-plugin" }));
const bearerMock = vi.fn(() => ({ id: "bearer-plugin" }));

vi.mock("better-auth", () => ({
  betterAuth: betterAuthMock,
}));

vi.mock("better-auth/adapters/prisma", () => ({
  prismaAdapter: prismaAdapterMock,
}));

vi.mock("better-auth/next-js", () => ({
  nextCookies: nextCookiesMock,
}));

vi.mock("better-auth/plugins/bearer", () => ({
  bearer: bearerMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { id: "mock-prisma-client" },
}));

describe("lib/auth.ts", () => {
  beforeEach(() => {
    betterAuthMock.mockClear();
    prismaAdapterMock.mockClear();
    nextCookiesMock.mockClear();
    bearerMock.mockClear();
  });

  it("configures better-auth with prisma adapter and bearer + next-cookies plugins", async () => {
    const { auth } = await import("@/lib/auth");

    expect(auth).toBeDefined();
    expect(prismaAdapterMock).toHaveBeenCalledWith(
      { id: "mock-prisma-client" },
      { provider: "postgresql" },
    );
    expect(bearerMock).toHaveBeenCalledTimes(1);
    expect(nextCookiesMock).toHaveBeenCalledTimes(1);
    expect(betterAuthMock).toHaveBeenCalledTimes(1);

    const call = betterAuthMock.mock.calls[0]?.[0] as {
      plugins: Array<{ id: string }>;
      emailAndPassword: { enabled: boolean };
      socialProviders: Record<string, { clientId: string; clientSecret: string }>;
    };

    expect(call.emailAndPassword.enabled).toBe(true);
    expect(call.plugins).toEqual([{ id: "bearer-plugin" }, { id: "next-cookies-plugin" }]);
    expect(Object.keys(call.socialProviders)).toEqual(["google", "apple", "twitter", "discord"]);
  });
});
