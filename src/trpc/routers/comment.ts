import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { adminProcedure, protectedProcedure, router } from "@/trpc/init";

export const commentRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        postId: z.string().min(1),
        body: z.string().trim().min(1).max(5000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.findFirst({
        where: {
          id: input.postId,
          published: true,
        },
        select: {
          id: true,
        },
      });

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      return ctx.prisma.comment.create({
        data: {
          body: input.body,
          postId: input.postId,
          authorId: ctx.user.id,
        },
        select: {
          id: true,
          body: true,
          createdAt: true,
          updatedAt: true,
          postId: true,
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
    }),

  delete: adminProcedure
    .input(
      z.object({
        id: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.comment.delete({
        where: {
          id: input.id,
        },
      });
    }),
});
