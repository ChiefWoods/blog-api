import { TRPCError } from "@trpc/server";
import { describe, expect, it, vi } from "vitest";

import { appRouter } from "@/trpc/routers/_app";

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

function authenticatedUser(overrides?: Partial<Record<string, unknown>>) {
  return {
    id: "user-1",
    name: "Reader",
    username: "reader",
    email: "reader@example.com",
    emailVerified: true,
    image: null,
    isAdmin: false,
    createdAt: new Date("2026-05-03T00:00:00.000Z"),
    updatedAt: new Date("2026-05-03T00:00:00.000Z"),
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

  it("returns admin post list with cursor pagination", async () => {
    const ctx = createMockContext({
      user: authenticatedUser({ isAdmin: true }),
      isAuthenticated: true,
      isAdmin: true,
    });

    const p1 = { id: "p1", title: "A", slug: "a" };
    const p2 = { id: "p2", title: "B", slug: "b" };
    const p3 = { id: "p3", title: "C", slug: "c" };
    ctx.prisma.post.findMany.mockResolvedValue([p1, p2, p3]);

    const caller = appRouter.createCaller(ctx as never);
    const result = await caller.post.listAll({ limit: 2 });

    expect(result.items).toEqual([p1, p2]);
    expect(result.nextCursor).toBe("p2");
    expect(ctx.prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 3,
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
      user: authenticatedUser(),
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

  it("rejects comment creation for unpublished or missing posts", async () => {
    const ctx = createMockContext({
      user: authenticatedUser(),
      isAuthenticated: true,
    });

    ctx.prisma.post.findFirst.mockResolvedValue(null);

    const caller = appRouter.createCaller(ctx as never);
    await expect(caller.comment.create({ postId: "ghost", body: "Nope" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("blocks admin post procedures for non-admin users", async () => {
    const ctx = createMockContext({
      user: authenticatedUser(),
      isAuthenticated: true,
      isAdmin: false,
    });

    const caller = appRouter.createCaller(ctx as never);

    await expect(caller.post.listAll({ limit: 10 })).rejects.toMatchObject({
      code: "FORBIDDEN",
    } satisfies Partial<TRPCError>);
    expect(ctx.prisma.post.findMany).not.toHaveBeenCalled();
  });

  it("enforces zod input validation for listPublished", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx as never);

    await expect(caller.post.listPublished({ limit: 0 })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("enforces zod input validation for comment.create body", async () => {
    const ctx = createMockContext({
      user: authenticatedUser(),
      isAuthenticated: true,
    });
    const caller = appRouter.createCaller(ctx as never);

    await expect(caller.comment.create({ postId: "post-1", body: "   " })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("enforces zod input validation for post.create fields", async () => {
    const ctx = createMockContext({
      user: authenticatedUser({ isAdmin: true }),
      isAuthenticated: true,
      isAdmin: true,
    });

    const caller = appRouter.createCaller(ctx as never);

    await expect(
      caller.post.create({
        title: "",
        slug: "",
        contentJson: {},
        published: false,
      }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("sets publishedAt when publishing", async () => {
    const ctx = createMockContext({
      user: authenticatedUser({ isAdmin: true }),
      isAuthenticated: true,
      isAdmin: true,
    });

    ctx.prisma.post.findUnique.mockResolvedValue({
      publishedAt: null,
    });
    ctx.prisma.post.update.mockResolvedValue({
      id: "post-1",
      published: true,
      publishedAt: new Date(),
    });
    const caller = appRouter.createCaller(ctx as never);

    await caller.post.publish({ id: "post-1" });

    expect(ctx.prisma.post.findUnique).toHaveBeenCalledWith({
      where: { id: "post-1" },
      select: { publishedAt: true },
    });
    expect(ctx.prisma.post.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "post-1" },
        data: expect.objectContaining({
          published: true,
          publishedAt: expect.any(Date),
        }),
      }),
    );
  });

  it("keeps publish history when unpublishing", async () => {
    const ctx = createMockContext({
      user: authenticatedUser({ isAdmin: true }),
      isAuthenticated: true,
      isAdmin: true,
    });

    ctx.prisma.post.update.mockResolvedValue({
      id: "post-1",
      published: false,
      publishedAt: new Date("2026-05-05T00:00:00.000Z"),
    });
    const caller = appRouter.createCaller(ctx as never);

    await caller.post.unpublish({ id: "post-1" });

    expect(ctx.prisma.post.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "post-1" },
        data: {
          published: false,
        },
      }),
    );
  });

  it("maps duplicate slug errors from database layer to conflict errors", async () => {
    const ctx = createMockContext({
      user: authenticatedUser({ isAdmin: true }),
      isAuthenticated: true,
      isAdmin: true,
    });

    ctx.prisma.post.findFirst.mockResolvedValue(null);
    ctx.prisma.post.create.mockRejectedValue(
      new Error("Unique constraint failed on fields: (`slug`)"),
    );
    const caller = appRouter.createCaller(ctx as never);

    await expect(
      caller.post.create({
        title: "Duplicate",
        slug: "duplicate",
        contentJson: {},
        published: false,
      }),
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message: "Slug already exists.",
    });
  });

  it("throws CONFLICT when updating a post to an existing slug", async () => {
    const ctx = createMockContext({
      user: authenticatedUser({ isAdmin: true }),
      isAuthenticated: true,
      isAdmin: true,
    });

    ctx.prisma.post.findFirst.mockResolvedValue({
      id: "post-2",
      slug: "existing-slug",
      title: "Other title",
    });
    const caller = appRouter.createCaller(ctx as never);

    await expect(
      caller.post.update({
        id: "post-1",
        slug: "existing-slug",
      }),
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message: "Slug already exists.",
    });
    expect(ctx.prisma.post.update).not.toHaveBeenCalled();
  });

  it("propagates relation errors from database layer on comment delete", async () => {
    const ctx = createMockContext({
      user: authenticatedUser({ isAdmin: true }),
      isAuthenticated: true,
      isAdmin: true,
    });

    ctx.prisma.comment.delete.mockRejectedValue(new Error("Record to delete does not exist."));
    const caller = appRouter.createCaller(ctx as never);

    await expect(caller.comment.delete({ id: "missing" })).rejects.toThrow(/does not exist/);
  });
});
