import type { Metadata } from "next";

import { PlusIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { createServerCaller } from "@/trpc/server";

import { BloggerPostsTable } from "../../../components/blogger-posts-table";
import { deleteAction, publishAction, unpublishAction } from "../../../lib/actions";

export const metadata: Metadata = {
  title: "Manage Posts",
};

export default async function BloggerPostsPage() {
  await requireAdmin();

  const caller = await createServerCaller();
  const posts = await caller.post.listAll({ limit: 100 });

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
            Dashboard
          </p>
          <h1 className="font-heading text-3xl">Manage posts</h1>
        </div>
        <Button asChild>
          <Link href="/blogger/posts/new">
            <PlusIcon />
            New post
          </Link>
        </Button>
      </div>

      {posts.items.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No posts yet</CardTitle>
            <CardDescription>Create your first post and start publishing.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <BloggerPostsTable
          posts={posts.items.map((post) => ({
            ...post,
            updatedAt: post.updatedAt.toISOString(),
            publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
          }))}
          publishAction={publishAction}
          unpublishAction={unpublishAction}
          deleteAction={deleteAction}
        />
      )}
    </section>
  );
}
