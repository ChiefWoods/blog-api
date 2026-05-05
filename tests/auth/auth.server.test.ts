import { beforeEach, describe, expect, it, vi } from "vitest";

const betterAuthMock = vi.fn((config: unknown) => ({ config }));
const prismaAdapterMock = vi.fn((prisma: unknown, options: unknown) => ({
  kind: "prisma-adapter",
  prisma,
  options,
}));
const nextCookiesMock = vi.fn(() => ({ id: "next-cookies-plugin" }));

vi.mock("better-auth", () => ({
  betterAuth: betterAuthMock,
}));

vi.mock("better-auth/adapters/prisma", () => ({
  prismaAdapter: prismaAdapterMock,
}));

vi.mock("better-auth/next-js", () => ({
  nextCookies: nextCookiesMock,
  toNextJsHandler: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { id: "mock-prisma-client" },
}));

describe("lib/auth.ts", () => {
  beforeEach(() => {
    betterAuthMock.mockClear();
    prismaAdapterMock.mockClear();
    nextCookiesMock.mockClear();
  });

  it("configures better-auth with prisma adapter and stateless cookie-cache sessions", async () => {
    const { auth } = await import("@/lib/auth");

    expect(auth).toBeDefined();
    expect(prismaAdapterMock).toHaveBeenCalledWith(
      { id: "mock-prisma-client" },
      { provider: "postgresql" },
    );
    expect(nextCookiesMock).toHaveBeenCalledTimes(1);
    expect(betterAuthMock).toHaveBeenCalledTimes(1);

    const call = betterAuthMock.mock.calls[0]?.[0] as {
      plugins: Array<{ id: string }>;
      database: {
        kind: string;
        prisma: unknown;
        options: { provider: string };
      };
      emailAndPassword: { enabled: boolean };
      socialProviders: Record<string, { clientId: string; clientSecret: string }>;
      account: {
        storeStateStrategy: string;
        storeAccountCookie: boolean;
      };
      session: {
        cookieCache: {
          enabled: boolean;
          strategy: string;
          maxAge: number;
          refreshCache: boolean;
        };
      };
    };

    expect(call.emailAndPassword.enabled).toBe(true);
    expect(call.database).toEqual({
      kind: "prisma-adapter",
      prisma: { id: "mock-prisma-client" },
      options: { provider: "postgresql" },
    });
    expect(call.plugins).toEqual([{ id: "next-cookies-plugin" }]);
    expect(call.account).toEqual({
      storeStateStrategy: "cookie",
      storeAccountCookie: true,
    });
    expect(call.session.cookieCache).toEqual({
      enabled: true,
      strategy: "jwt",
      maxAge: 7 * 24 * 60 * 60,
      refreshCache: true,
    });
    expect(Object.keys(call.socialProviders)).toEqual(["google", "apple", "twitter", "discord"]);
  });
});
