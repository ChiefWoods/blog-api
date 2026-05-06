"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { SlugInput } from "@/components/slug-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createPostAction } from "@/lib/actions";
import { createPostFormSchema, type CreatePostFormValues } from "@/lib/form-schema";

export function NewPostForm() {
  const router = useRouter();

  const form = useForm<CreatePostFormValues>({
    resolver: zodResolver(createPostFormSchema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      published: true,
    },
  });

  const published = form.watch("published");
  const submitLabel = published ? "Create post" : "Draft post";

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await createPostAction(values);
      toast.success("Post created successfully.");
      router.replace("/blogger/posts");
    } catch {
      toast.error("Unable to create post. Please try again.");
    }
  });

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <Controller
          name="title"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="new-post-title">Title</FieldLabel>
              <FieldContent>
                <Input
                  {...field}
                  id="new-post-title"
                  placeholder="A clear post title"
                  aria-invalid={fieldState.invalid}
                />
                <FieldError>{fieldState.error?.message}</FieldError>
              </FieldContent>
            </Field>
          )}
        />

        <Controller
          name="slug"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="new-post-slug">Slug</FieldLabel>
              <FieldContent>
                <SlugInput
                  {...field}
                  id="new-post-slug"
                  placeholder="my-post-slug"
                  aria-invalid={fieldState.invalid}
                />
                <FieldError>{fieldState.error?.message}</FieldError>
              </FieldContent>
            </Field>
          )}
        />

        <Controller
          name="excerpt"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="new-post-excerpt">Excerpt</FieldLabel>
              <FieldContent>
                <Textarea
                  {...field}
                  id="new-post-excerpt"
                  placeholder="Short summary for list cards (optional)"
                  aria-invalid={fieldState.invalid}
                />
                <FieldError>{fieldState.error?.message}</FieldError>
              </FieldContent>
            </Field>
          )}
        />

        <Controller
          name="content"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="new-post-content">Content</FieldLabel>
              <FieldContent>
                <Textarea
                  {...field}
                  id="new-post-content"
                  placeholder="Write your post content..."
                  className="max-h-96 min-h-48 overflow-y-auto"
                  aria-invalid={fieldState.invalid}
                />
                <FieldError>{fieldState.error?.message}</FieldError>
              </FieldContent>
            </Field>
          )}
        />

        <Controller
          name="published"
          control={form.control}
          render={({ field }) => (
            <Field orientation="horizontal">
              <Checkbox
                id="new-post-published"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
              <FieldContent>
                <FieldLabel htmlFor="new-post-published" className="cursor-pointer">
                  Publish immediately
                </FieldLabel>
              </FieldContent>
            </Field>
          )}
        />
      </FieldGroup>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving..." : submitLabel}
        </Button>
        <Button asChild type="button" variant="ghost" disabled={form.formState.isSubmitting}>
          <Link href="/blogger/posts">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
