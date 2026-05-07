import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { createServerCaller } from "@/trpc/server";

export default async function Page() {
  const caller = await createServerCaller();
  const publishedPosts = await caller.post.listPublished({ limit: 20 });

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6">
      <div className="space-y-2">
        <h1 className="font-heading text-3xl leading-tight sm:text-4xl">Latest posts</h1>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          Open any post to read details and join the discussion.
        </p>
      </div>

      {publishedPosts.items.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No published posts yet</CardTitle>
            <CardDescription>Posts will appear here after an admin publishes them.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:gap-5">
          {publishedPosts.items.map((post) => (
            <li key={post.id}>
              <Link
                href={`/posts/${post.slug}`}
                className="block rounded-2xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <Card className="border border-border/70 bg-card/90 transition-colors hover:border-primary/40">
                  <CardHeader className="space-y-3">
                    <CardTitle className="underline-offset-4 group-hover/card:text-primary group-hover/card:underline">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="flex flex-wrap gap-x-3 gap-y-1 text-xs sm:text-sm">
                      <span>@{post.author.username}</span>
                      <span>{formatDateTime(post.publishedAt ?? post.createdAt)}</span>
                    </CardDescription>
                  </CardHeader>
                  {post.excerpt && (
                    <CardContent>
                      <p className="text-sm leading-6 text-muted-foreground">{post.excerpt}</p>
                    </CardContent>
                  )}
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
