import { TRPCError } from "@trpc/server";
import { describe, expect, it, vi } from "vitest";

import { appRouter } from "@/src/trpc/routers/_app";

function createMockContext(overrides?: Partial<Record<string, unknown>>) {
  return {
    req: new Request("http://localhost/api/trpc"),
    prisma: {
      post: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      comment: {
        create: vi.fn(),
        delete: vi.fn(),
      },
    },
    session: null,
    user: null,
    isAuthenticated: false,
    isAdmin: false,
    ...overrides,
  };
}

describe("tRPC procedures", () => {
  it("returns published posts with cursor pagination", async () => {
    const ctx = createMockContext();
    const firstPost = {
      id: "post-1",
      title: "One",
      slug: "one",
      excerpt: "first",
      publishedAt: new Date("2026-05-03T00:00:00.000Z"),
      createdAt: new Date("2026-05-03T00:00:00.000Z"),
      author: {
        id: "author-1",
        name: "Admin",
        username: "admin",
        image: null,
      },
    };
    const secondPost = { ...firstPost, id: "post-2", slug: "two" };

    ctx.prisma.post.findMany.mockResolvedValue([firstPost, secondPost]);

    const caller = appRouter.createCaller(ctx as never);
    const result = await caller.post.listPublished({ limit: 1 });

    expect(result.items).toEqual([firstPost]);
    expect(result.nextCursor).toBe("post-1");
    expect(ctx.prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { published: true },
        take: 2,
      }),
    );
  });

  it("throws NOT_FOUND when a published post slug does not exist", async () => {
    const ctx = createMockContext();
    ctx.prisma.post.findFirst.mockResolvedValue(null);

    const caller = appRouter.createCaller(ctx as never);

    await expect(caller.post.getBySlug({ slug: "missing" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    } satisfies Partial<TRPCError>);
  });

  it("blocks comment creation for unauthenticated users", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx as never);

    await expect(caller.comment.create({ postId: "post-1", body: "Hello" })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    expect(ctx.prisma.post.findFirst).not.toHaveBeenCalled();
  });

  it("allows authenticated users to create comments", async () => {
    const ctx = createMockContext({
      user: {
        id: "user-1",
        name: "Reader",
        username: "reader",
        email: "reader@example.com",
        emailVerified: true,
        image: null,
        isAdmin: false,
        createdAt: new Date("2026-05-03T00:00:00.000Z"),
        updatedAt: new Date("2026-05-03T00:00:00.000Z"),
      },
      isAuthenticated: true,
    });

    ctx.prisma.post.findFirst.mockResolvedValue({ id: "post-1" });
    ctx.prisma.comment.create.mockResolvedValue({
      id: "comment-1",
      body: "Nice post",
      createdAt: new Date("2026-05-03T00:00:00.000Z"),
      updatedAt: new Date("2026-05-03T00:00:00.000Z"),
      postId: "post-1",
      author: {
        id: "user-1",
        name: "Reader",
        username: "reader",
        image: null,
      },
    });

    const caller = appRouter.createCaller(ctx as never);
    const result = await caller.comment.create({ postId: "post-1", body: "Nice post" });

    expect(result.id).toBe("comment-1");
    expect(ctx.prisma.comment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          authorId: "user-1",
          postId: "post-1",
        }),
      }),
    );
  });

  it("blocks admin post procedures for non-admin users", async () => {
    const ctx = createMockContext({
      user: {
        id: "user-1",
        name: "Reader",
        username: "reader",
        email: "reader@example.com",
        emailVerified: true,
        image: null,
        isAdmin: false,
        createdAt: new Date("2026-05-03T00:00:00.000Z"),
        updatedAt: new Date("2026-05-03T00:00:00.000Z"),
      },
      isAuthenticated: true,
      isAdmin: false,
    });

    const caller = appRouter.createCaller(ctx as never);

    await expect(caller.post.listAll({ limit: 10 })).rejects.toMatchObject({
      code: "FORBIDDEN",
    } satisfies Partial<TRPCError>);
    expect(ctx.prisma.post.findMany).not.toHaveBeenCalled();
  });
});
