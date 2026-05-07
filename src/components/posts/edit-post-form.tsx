"use client";

import type { SerializedEditorState } from "lexical";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Editor } from "@/components/editor-x";
import { SlugInput } from "@/components/slug-input";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateAndPublishPostAction, updatePostAction } from "@/lib/actions";
import { updatePostFormSchema, type UpdatePostFormValues } from "@/lib/form-schema";

type EditPostFormProps = {
  postId: string;
  currentSlug: string;
  initialValues: UpdatePostFormValues;
  initialSerializedContent?: SerializedEditorState | null;
  isPublished: boolean;
  isHidden: boolean;
};

export function EditPostForm({
  postId,
  currentSlug,
  initialValues,
  initialSerializedContent,
  isPublished,
  isHidden,
}: EditPostFormProps) {
  const router = useRouter();
  const [submitIntent, setSubmitIntent] = useState<"save" | "publish" | null>(null);

  const form = useForm<UpdatePostFormValues>({
    resolver: zodResolver(updatePostFormSchema),
    defaultValues: initialValues,
  });
  const initialContentState = useMemo(
    () => initialSerializedContent ?? initialValues.contentJson,
    [initialSerializedContent, initialValues.contentJson],
  );

  async function submitWithIntent(intent: "save" | "publish") {
    setSubmitIntent(intent);
    try {
      await form.handleSubmit(async (values) => {
        const payload = {
          id: postId,
          currentSlug,
          ...values,
        };

        if (intent === "publish") {
          const result = await updateAndPublishPostAction(payload);
          if (!result.ok) {
            form.setError(result.field, { message: result.message });
            return;
          }

          toast.success("Post saved and published.");
        } else {
          const result = await updatePostAction(payload);
          if (!result.ok) {
            form.setError(result.field, { message: result.message });
            return;
          }

          toast.success("Post saved.");
        }

        router.replace("/blogger/posts");
      })();
    } catch {
      toast.error("Unable to save post. Please try again.");
    } finally {
      setSubmitIntent(null);
    }
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void submitWithIntent("save");
      }}
      noValidate
    >
      <FieldGroup>
        <Controller
          name="title"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="edit-post-title">Title</FieldLabel>
              <FieldContent>
                <Input {...field} id="edit-post-title" aria-invalid={fieldState.invalid} />
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
              <FieldLabel htmlFor="edit-post-slug">Slug</FieldLabel>
              <FieldContent>
                <SlugInput {...field} id="edit-post-slug" aria-invalid={fieldState.invalid} />
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
              <FieldLabel htmlFor="edit-post-excerpt">Excerpt</FieldLabel>
              <FieldContent>
                <Textarea {...field} id="edit-post-excerpt" aria-invalid={fieldState.invalid} />
                <FieldError>{fieldState.error?.message}</FieldError>
              </FieldContent>
            </Field>
          )}
        />

        <Controller
          name="contentJson"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="edit-post-content">Content</FieldLabel>
              <FieldContent>
                <Editor
                  editorSerializedState={initialContentState}
                  contentEditableId="edit-post-content"
                  contentAriaInvalid={fieldState.invalid}
                  contentAriaDescribedBy="edit-post-content-error"
                  onSerializedChange={field.onChange}
                />
                <FieldError id="edit-post-content-error">{fieldState.error?.message}</FieldError>
              </FieldContent>
            </Field>
          )}
        />
      </FieldGroup>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && submitIntent === "save" ? "Saving..." : "Save"}
        </Button>
        {!isPublished ? (
          <Button
            type="button"
            variant="secondary"
            disabled={form.formState.isSubmitting}
            onClick={() => void submitWithIntent("publish")}
          >
            {form.formState.isSubmitting && submitIntent === "publish"
              ? "Saving and publishing..."
              : isHidden
                ? "Save and unhide"
                : "Save and publish"}
          </Button>
        ) : null}
        <Button asChild type="button" variant="ghost" disabled={form.formState.isSubmitting}>
          <Link href="/blogger/posts">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
