import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: getSessionMock,
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { id: "mock-prisma-client" },
}));

describe("createTRPCContext", () => {
  beforeEach(() => {
    getSessionMock.mockReset();
  });

  it("returns unauthenticated context when session lookup fails", async () => {
    getSessionMock.mockRejectedValue(new Error("session failed"));

    const { createTRPCContext } = await import("@/src/trpc/context");
    const ctx = await createTRPCContext({ req: new Request("http://localhost/api/trpc") });

    expect(ctx.isAuthenticated).toBe(false);
    expect(ctx.isAdmin).toBe(false);
    expect(ctx.user).toBeNull();
  });

  it("returns authenticated admin context when session and user exist", async () => {
    getSessionMock.mockResolvedValue({
      session: { id: "sess-1" },
      user: {
        id: "user-1",
        name: "Admin",
        email: "admin@example.com",
        isAdmin: true,
      },
    });

    const { createTRPCContext } = await import("@/src/trpc/context");
    const req = new Request("http://localhost/api/trpc");

    const ctx = await createTRPCContext({ req });

    expect(ctx.isAuthenticated).toBe(true);
    expect(ctx.isAdmin).toBe(true);
    expect(ctx.user?.id).toBe("user-1");
  });

  it("treats non-admin authenticated users as non-admin", async () => {
    getSessionMock.mockResolvedValue({
      session: { id: "sess-1" },
      user: {
        id: "user-1",
        name: "Reader",
        email: "reader@example.com",
        isAdmin: false,
      },
    });

    const { createTRPCContext } = await import("@/src/trpc/context");
    const ctx = await createTRPCContext({ req: new Request("http://localhost/api/trpc") });

    expect(ctx.isAuthenticated).toBe(true);
    expect(ctx.isAdmin).toBe(false);
  });
});
