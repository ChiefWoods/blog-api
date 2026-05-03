import { router } from "@/src/trpc/init";
import { commentRouter } from "@/src/trpc/routers/comment";
import { postRouter } from "@/src/trpc/routers/post";

export const appRouter = router({
  post: postRouter,
  comment: commentRouter,
});

export type AppRouter = typeof appRouter;
