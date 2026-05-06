"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { deleteCommentAction } from "@/lib/actions";
import { deleteCommentFormSchema, type DeleteCommentFormValues } from "@/lib/form-schema";

type DeleteCommentFormProps = {
  commentId: string;
  path: string;
};

export function DeleteCommentForm({ commentId, path }: DeleteCommentFormProps) {
  const router = useRouter();

  const form = useForm<DeleteCommentFormValues>({
    resolver: zodResolver(deleteCommentFormSchema),
    defaultValues: {
      commentId,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const formData = new FormData();
    formData.set("commentId", values.commentId);

    try {
      await deleteCommentAction(formData, path);
      router.refresh();
      toast.success("Comment deleted.");
    } catch {
      toast.error("Unable to delete comment. Please try again.");
    }
  });

  return (
    <form onSubmit={onSubmit}>
      <Button
        type="submit"
        variant="destructive"
        size="icon-sm"
        aria-label="Delete comment"
        disabled={form.formState.isSubmitting}
      >
        <Trash2Icon aria-hidden="true" />
      </Button>
    </form>
  );
}
