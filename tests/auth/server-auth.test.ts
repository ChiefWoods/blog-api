import { beforeEach, describe, expect, it, vi } from "vitest";

const headersMock = vi.fn(async () => new Headers({ cookie: "session=value" }));
const redirectMock = vi.fn();
const findUniqueMock = vi.fn();

vi.mock("next/headers", () => ({
  headers: headersMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: findUniqueMock,
    },
  },
}));

describe("lib/auth.ts server helpers", () => {
  let authModule: typeof import("@/lib/auth");

  beforeEach(() => {
    headersMock.mockClear();
    redirectMock.mockClear();
    findUniqueMock.mockReset();
    vi.restoreAllMocks();
  });

  async function loadAuthModule() {
    authModule ??= await import("@/lib/auth");
    return authModule;
  }

  it("returns session from auth api when lookup succeeds", async () => {
    const { auth, getServerSession } = await loadAuthModule();
    const session = { session: { id: "sess-1" }, user: { id: "user-1" } };
    const getSessionSpy = vi.spyOn(auth.api, "getSession").mockResolvedValue(session as never);
    findUniqueMock.mockResolvedValue({ isAdmin: true });

    const result = await getServerSession();

    expect(result).toEqual({
      ...session,
      user: {
        ...session.user,
        isAdmin: true,
      },
    });
    expect(headersMock).toHaveBeenCalledTimes(1);
    expect(getSessionSpy).toHaveBeenCalledWith({ headers: expect.any(Headers) });
  });

  it("returns null when session lookup throws", async () => {
    const { auth, getServerSession } = await loadAuthModule();
    vi.spyOn(auth.api, "getSession").mockRejectedValue(new Error("lookup failed"));

    const result = await getServerSession();

    expect(result).toBeNull();
  });

  it("redirects guest-only routes when user is already signed in", async () => {
    const { auth, requireGuest } = await loadAuthModule();
    vi.spyOn(auth.api, "getSession").mockResolvedValue({
      session: { id: "sess-1" },
      user: { id: "user-1" },
    } as never);
    findUniqueMock.mockResolvedValue({ isAdmin: false });

    await requireGuest("/posts/hello-world");

    expect(redirectMock).toHaveBeenCalledWith("/posts/hello-world");
  });

  it("throws unauthenticated error when protected route user is not signed in", async () => {
    const { auth, requireAuth } = await loadAuthModule();
    vi.spyOn(auth.api, "getSession").mockResolvedValue(null);

    await expect(requireAuth()).rejects.toMatchObject({
      message: "Authentication required",
    });

    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("returns session for protected routes when user is signed in", async () => {
    const { auth, requireAuth } = await loadAuthModule();
    const session = { session: { id: "sess-1" }, user: { id: "user-1" } };
    vi.spyOn(auth.api, "getSession").mockResolvedValue(session as never);
    findUniqueMock.mockResolvedValue({ isAdmin: false });

    const result = await requireAuth();

    expect(result).toEqual({
      ...session,
      user: {
        ...session.user,
        isAdmin: false,
      },
    });
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("throws unauthenticated error for non-admin users", async () => {
    const { auth, requireAdmin } = await loadAuthModule();
    vi.spyOn(auth.api, "getSession").mockResolvedValue({
      session: { id: "sess-1" },
      user: { id: "user-1" },
    } as never);
    findUniqueMock.mockResolvedValue({ isAdmin: false });

    await expect(requireAdmin()).rejects.toMatchObject({
      message: "Admin access required",
    });

    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("returns session for admin routes when user is admin", async () => {
    const { auth, requireAdmin } = await loadAuthModule();
    const session = { session: { id: "sess-1" }, user: { id: "user-1" } };
    vi.spyOn(auth.api, "getSession").mockResolvedValue(session as never);
    findUniqueMock.mockResolvedValue({ isAdmin: true });

    const result = await requireAdmin();

    expect(result).toEqual({
      ...session,
      user: {
        ...session.user,
        isAdmin: true,
      },
    });
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
