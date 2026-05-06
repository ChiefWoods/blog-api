"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldError } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { createCommentAction } from "@/lib/actions";
import {
  COMMENT_BODY_MAX_LENGTH,
  createCommentFormSchema,
  type CreateCommentFormValues,
} from "@/lib/form-schema";

type CreateCommentFormProps = {
  postId: string;
  path: string;
};

export function CreateCommentForm({ postId, path }: CreateCommentFormProps) {
  const router = useRouter();

  const form = useForm<CreateCommentFormValues>({
    resolver: zodResolver(createCommentFormSchema),
    defaultValues: {
      body: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const formData = new FormData();
    formData.set("body", values.body);

    try {
      await createCommentAction(formData, postId, path);
      form.reset();
      router.refresh();
      toast.success("Comment posted.");
    } catch {
      toast.error("Unable to post comment. Please try again.");
    }
  });

  return (
    <form className="grid gap-3" onSubmit={onSubmit} noValidate>
      <Controller
        name="body"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldContent>
              <Textarea
                {...field}
                placeholder="Add a comment..."
                minLength={1}
                maxLength={COMMENT_BODY_MAX_LENGTH}
                required
                aria-invalid={fieldState.invalid}
              />
              <FieldError>{fieldState.error?.message}</FieldError>
            </FieldContent>
          </Field>
        )}
      />

      <div className="flex justify-end">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Posting..." : "Post comment"}
        </Button>
      </div>
    </form>
  );
}
