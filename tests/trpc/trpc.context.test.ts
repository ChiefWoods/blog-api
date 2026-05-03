import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.fn();
const findUniqueMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: getSessionMock,
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: findUniqueMock,
    },
  },
}));

describe("createTRPCContext", () => {
  beforeEach(() => {
    getSessionMock.mockReset();
    findUniqueMock.mockReset();
  });

  it("returns unauthenticated context when session lookup fails", async () => {
    getSessionMock.mockRejectedValue(new Error("session failed"));

    const { createTRPCContext } = await import("@/src/trpc/context");
    const ctx = await createTRPCContext({ req: new Request("http://localhost/api/trpc") });

    expect(ctx.isAuthenticated).toBe(false);
    expect(ctx.isAdmin).toBe(false);
    expect(ctx.user).toBeNull();
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("returns authenticated admin context when session and user exist", async () => {
    getSessionMock.mockResolvedValue({
      session: { id: "sess-1" },
      user: { id: "user-1" },
    });
    findUniqueMock.mockResolvedValue({
      id: "user-1",
      name: "Admin",
      username: "admin",
      email: "admin@example.com",
      emailVerified: true,
      image: null,
      isAdmin: true,
      createdAt: new Date("2026-05-03T00:00:00.000Z"),
      updatedAt: new Date("2026-05-03T00:00:00.000Z"),
    });

    const { createTRPCContext } = await import("@/src/trpc/context");
    const req = new Request("http://localhost/api/trpc", {
      headers: {
        authorization: "Bearer token",
      },
    });

    const ctx = await createTRPCContext({ req });

    expect(ctx.isAuthenticated).toBe(true);
    expect(ctx.isAdmin).toBe(true);
    expect(ctx.user?.id).toBe("user-1");
    expect(findUniqueMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
      }),
    );
  });
});
