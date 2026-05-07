import { BackToDashboardLink } from "@/components/back-to-dashboard-link";
import { NewPostForm } from "@/components/posts/new-post-form";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";

export default async function NewPostPage() {
  await requireAdmin();

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10 sm:px-6">
      <BackToDashboardLink />

      <div className="space-y-2">
        <h1 className="font-heading text-3xl">Create post</h1>
      </div>

      <Card>
        <CardContent>
          <NewPostForm />
        </CardContent>
      </Card>
    </section>
  );
}
