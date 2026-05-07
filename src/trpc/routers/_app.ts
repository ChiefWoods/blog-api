import { router } from "@/trpc/init";
import { commentRouter } from "@/trpc/routers/comment";
import { postRouter } from "@/trpc/routers/post";

export const appRouter = router({
  post: postRouter,
  comment: commentRouter,
});

export type AppRouter = typeof appRouter;
