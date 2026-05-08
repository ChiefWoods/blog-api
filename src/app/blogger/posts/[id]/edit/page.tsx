import type { Metadata } from "next";

import { notFound } from "next/navigation";
import { cache } from "react";

import { BackToDashboardLink } from "@/components/back-to-dashboard-link";
import { EditPostForm } from "@/components/posts/edit-post-form";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import {
  extractLexicalSerializedState,
  extractPostBodyText,
  formatDateTime,
  plainTextToLexicalSerializedState,
} from "@/lib/utils";
import { createServerCaller } from "@/trpc/server";

type EditPostPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const getPostById = cache(async (id: string) => {
  const caller = await createServerCaller();
  return caller.post.getById({ id });
});

export async function generateMetadata({ params }: EditPostPageProps): Promise<Metadata> {
  const { id } = await params;
  const post = await getPostById(id);

  if (!post) {
    return { title: "Edit Post" };
  }

  return {
    title: `Edit: ${post.title}`,
  };
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  await requireAdmin();

  const { id } = await params;
  const post = await getPostById(id);

  if (!post) {
    notFound();
  }
  const currentPost = post;
  const postId = currentPost.id;
  const currentSlug = currentPost.slug;
  const initialSerializedContent =
    extractLexicalSerializedState(currentPost.contentJson) ??
    plainTextToLexicalSerializedState(extractPostBodyText(currentPost.contentJson));
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
              contentJson: initialSerializedContent,
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
