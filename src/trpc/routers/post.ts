import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type { Prisma } from "@/generated/prisma/client";

import { adminProcedure, publicProcedure, router } from "@/src/trpc/init";

const listPublishedInput = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(10),
});

const listAllInput = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

const mutablePostFields = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(200).optional(),
  excerpt: z.string().max(500).nullable().optional(),
  contentJson: z.custom<Prisma.InputJsonValue>().optional(),
});

function throwPostConflictError(): never {
  throw new TRPCError({
    code: "CONFLICT",
    message: "Slug already exists.",
  });
}

function isKnownUniqueConstraintError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const errorLike = error as { code?: string; message?: string };
  const message = (errorLike.message ?? "").toLowerCase();

  return errorLike.code === "P2002" || message.includes("unique constraint failed");
}

function isSlugUniqueConstraintError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const errorLike = error as {
    message?: string;
    meta?: { target?: unknown };
  };
  const message = (errorLike.message ?? "").toLowerCase();
  const target = Array.isArray(errorLike.meta?.target)
    ? errorLike.meta.target.map((value) => String(value).toLowerCase())
    : [];

  return target.includes("slug") || message.includes("slug");
}

export const postRouter = router({
  listPublished: publicProcedure.input(listPublishedInput).query(async ({ ctx, input }) => {
    const posts = await ctx.prisma.post.findMany({
      where: {
        published: true,
      },
      take: input.limit + 1,
      cursor: input.cursor ? { id: input.cursor } : undefined,
      skip: input.cursor ? 1 : 0,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        publishedAt: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    });

    const hasMore = posts.length > input.limit;
    const items = hasMore ? posts.slice(0, input.limit) : posts;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return {
      items,
      nextCursor,
    };
  }),

  getBySlug: publicProcedure
    .input(
      z.object({
        slug: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.findFirst({
        where: ctx.isAdmin
          ? {
              slug: input.slug,
            }
          : {
              slug: input.slug,
              published: true,
            },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          published: true,
          contentJson: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
          comments: {
            orderBy: {
              createdAt: "desc",
            },
            select: {
              id: true,
              body: true,
              createdAt: true,
              updatedAt: true,
              author: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  image: true,
                },
              },
            },
          },
        },
      });

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      return post;
    }),

  listAll: adminProcedure.input(listAllInput).query(async ({ ctx, input }) => {
    const posts = await ctx.prisma.post.findMany({
      take: input.limit + 1,
      cursor: input.cursor ? { id: input.cursor } : undefined,
      skip: input.cursor ? 1 : 0,
      orderBy: [{ updatedAt: "desc" }],
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        published: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const hasMore = posts.length > input.limit;
    const items = hasMore ? posts.slice(0, input.limit) : posts;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return {
      items,
      nextCursor,
    };
  }),

  getById: adminProcedure
    .input(
      z.object({
        id: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.post.findUnique({
        where: {
          id: input.id,
        },
        include: {
          comments: {
            orderBy: {
              createdAt: "desc",
            },
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  image: true,
                },
              },
            },
          },
        },
      });
    }),

  create: adminProcedure
    .input(
      mutablePostFields.extend({
        title: z.string().min(1).max(200),
        slug: z.string().min(1).max(200),
        contentJson: z.custom<Prisma.InputJsonValue>(),
        published: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const conflictingPost = await ctx.prisma.post.findFirst({
        where: {
          slug: input.slug,
        },
        select: {
          slug: true,
        },
      });

      if (conflictingPost?.slug === input.slug) {
        throwPostConflictError();
      }

      try {
        return await ctx.prisma.post.create({
          data: {
            title: input.title,
            slug: input.slug,
            excerpt: input.excerpt ?? null,
            contentJson: input.contentJson,
            published: input.published,
            publishedAt: input.published ? new Date() : null,
            authorId: ctx.user.id,
          },
        });
      } catch (error) {
        if (isKnownUniqueConstraintError(error) && isSlugUniqueConstraintError(error)) {
          throwPostConflictError();
        }

        throw error;
      }
    }),

  update: adminProcedure
    .input(
      mutablePostFields.extend({
        id: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.slug) {
        const conflictingPost = await ctx.prisma.post.findFirst({
          where: {
            id: {
              not: input.id,
            },
            slug: input.slug,
          },
          select: {
            slug: true,
          },
        });

        if (conflictingPost?.slug === input.slug) {
          throwPostConflictError();
        }
      }

      try {
        return await ctx.prisma.post.update({
          where: {
            id: input.id,
          },
          data: {
            title: input.title,
            slug: input.slug,
            excerpt: input.excerpt,
            contentJson: input.contentJson,
          },
        });
      } catch (error) {
        if (isKnownUniqueConstraintError(error) && isSlugUniqueConstraintError(error)) {
          throwPostConflictError();
        }

        throw error;
      }
    }),

  publish: adminProcedure
    .input(
      z.object({
        id: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingPost = await ctx.prisma.post.findUnique({
        where: {
          id: input.id,
        },
        select: {
          publishedAt: true,
        },
      });

      if (!existingPost) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      return ctx.prisma.post.update({
        where: {
          id: input.id,
        },
        data: {
          published: true,
          // keep original first-published timestamp when un-hiding
          publishedAt: existingPost.publishedAt ?? new Date(),
        },
      });
    }),

  unpublish: adminProcedure
    .input(
      z.object({
        id: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.post.update({
        where: {
          id: input.id,
        },
        data: {
          published: false,
        },
      });
    }),

  delete: adminProcedure
    .input(
      z.object({
        id: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.post.delete({
        where: {
          id: input.id,
        },
      });
    }),
});
