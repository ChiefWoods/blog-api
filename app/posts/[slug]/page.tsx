import Link from "next/link";
import { notFound } from "next/navigation";

import { BackToPostsLink } from "@/components/back-to-posts-link";
import { PostShareButton } from "@/components/post-share-button";
import { CreateCommentForm } from "@/components/posts/create-comment-form";
import { DeleteCommentForm } from "@/components/posts/delete-comment-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerSession } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";
import { extractPostBodyText } from "@/lib/utils";
import { createServerCaller } from "@/src/trpc/server";

type PostPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const caller = await createServerCaller();
  const session = await getServerSession();
  const isAdmin = Boolean((session?.user as { isAdmin?: boolean } | null)?.isAdmin);
  const path = `/posts/${slug}`;

  let post: Awaited<ReturnType<typeof caller.post.getBySlug>>;
  try {
    post = await caller.post.getBySlug({ slug });
  } catch {
    notFound();
  }
  const postId = post.id;

  const bodyText = extractPostBodyText(post.contentJson);
  const authorDisplayName = post.author.name?.trim() || `@${post.author.username}`;
  const isUnpublished = !post.published;
  const unpublishedState = post.publishedAt ? "hidden" : "draft";
  const publicationDate = post.publishedAt ?? post.createdAt;
  const postTimestampLabel =
    post.updatedAt.getTime() === publicationDate.getTime() ? "Published" : "Updated";

  return (
    <div className="min-h-svh w-full bg-muted/35 px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto w-full max-w-2xl">
        <BackToPostsLink />
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-12">
        <article className="mx-auto w-full max-w-2xl space-y-8">
          {isUnpublished && (
            <Alert className="border-amber-500/35 bg-amber-500/10 text-amber-900 dark:text-amber-100">
              <AlertTitle>
                {unpublishedState === "draft" ? "Draft post preview" : "Hidden post preview"}
              </AlertTitle>
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                {unpublishedState === "draft"
                  ? "This post is still a draft and is not publicly visible."
                  : "This post is hidden and is not currently publicly visible."}
              </AlertDescription>
            </Alert>
          )}

          <section className="space-y-6">
            <h1 className="font-heading text-4xl leading-tight tracking-tight text-foreground sm:text-5xl">
              {post.title}
            </h1>
            <div className="border-t border-border/80 pt-5">
              <p className="text-base font-medium text-foreground">{authorDisplayName}</p>
              <p className="mt-1 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                {postTimestampLabel} {formatDateTime(post.updatedAt)}
              </p>
            </div>
          </section>

          {post.excerpt && (
            <p className="text-base leading-8 text-muted-foreground italic">{post.excerpt}</p>
          )}

          <section className="text-[1.075rem] leading-9 text-foreground/95 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-5 [&_blockquote]:italic [&_h2]:mt-10 [&_h2]:font-heading [&_h2]:text-3xl [&_h3]:mt-8 [&_h3]:font-heading [&_h3]:text-2xl [&_p]:mb-8 [&_ul]:my-7 [&_ul]:list-disc [&_ul]:pl-7">
            {post.contentHtml ? (
              <div dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
            ) : (
              <p className="whitespace-pre-wrap">{bodyText || "No content provided."}</p>
            )}
          </section>

          <div className="flex items-center justify-end border-y border-border/80 py-3">
            <PostShareButton />
          </div>
        </article>

        <section className="mx-auto grid w-full max-w-2xl gap-4">
          <h2 className="font-heading text-2xl">Comments ({post.comments.length})</h2>

          {session?.user ? (
            <Card>
              <CardHeader>
                <CardTitle>Leave a comment</CardTitle>
                <CardDescription>
                  Signed in as @{(session.user as { username?: string }).username ?? "user"}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CreateCommentForm postId={postId} path={path} />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Sign in to comment</CardTitle>
                <CardDescription>
                  <Link
                    className="font-medium text-primary underline-offset-4 hover:underline"
                    href={`/sign-in?callbackURL=${encodeURIComponent(path)}`}
                  >
                    Go to sign in
                  </Link>
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {post.comments.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No comments yet</CardTitle>
                <CardDescription>Be the first to start the discussion.</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            post.comments.map((comment) => (
              <Card key={comment.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">@{comment.author.username}</CardTitle>
                      <CardDescription>{formatDateTime(comment.createdAt)}</CardDescription>
                    </div>
                    {isAdmin ? <DeleteCommentForm commentId={comment.id} path={path} /> : null}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 whitespace-pre-wrap">{comment.body}</p>
                </CardContent>
              </Card>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
