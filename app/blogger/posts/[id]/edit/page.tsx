import { notFound } from "next/navigation";

import { BackToDashboardLink } from "@/components/back-to-dashboard-link";
import { EditPostForm } from "@/components/posts/edit-post-form";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { extractLexicalSerializedState, extractPostBodyText, formatDateTime } from "@/lib/utils";
import { createServerCaller } from "@/src/trpc/server";

type EditPostPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditPostPage({ params }: EditPostPageProps) {
  await requireAdmin();

  const { id } = await params;

  const caller = await createServerCaller();
  const post = await caller.post.getById({ id });

  if (!post) {
    notFound();
  }
  const currentPost = post;
  const postId = currentPost.id;
  const currentSlug = currentPost.slug;
  const initialSerializedContent = extractLexicalSerializedState(currentPost.contentJson);
  const contentText = extractPostBodyText(currentPost.contentJson);
  const isHidden = !currentPost.published && Boolean(currentPost.publishedAt);
  const postStatus = currentPost.published
    ? "Published"
    : currentPost.publishedAt
      ? "Hidden"
      : "Draft";

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6">
      <BackToDashboardLink />

      <div className="space-y-2">
        <h1 className="font-heading text-3xl">Edit post</h1>
        <p className="text-sm text-muted-foreground">
          Status: {postStatus} • Updated {formatDateTime(currentPost.updatedAt)}
        </p>
      </div>

      <Card>
        <CardContent>
          <EditPostForm
            postId={postId}
            currentSlug={currentSlug}
            initialValues={{
              title: currentPost.title,
              slug: currentPost.slug,
              excerpt: currentPost.excerpt ?? "",
              content: contentText,
            }}
            initialSerializedContent={initialSerializedContent}
            isPublished={currentPost.published}
            isHidden={isHidden}
          />
        </CardContent>
      </Card>
    </section>
  );
}
