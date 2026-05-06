import { z } from "zod";

export const POST_TITLE_MAX_LENGTH = 64;
export const POST_SLUG_MAX_LENGTH = 64;
export const POST_EXCERPT_MAX_LENGTH = 256;
export const COMMENT_BODY_MAX_LENGTH = 5000;

const requiredText = (label: string, maxLength: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(maxLength, `${label} must be ${maxLength} characters or fewer.`);

export function normalizeSlug(value: string) {
  return value.trim().replace(/\s+/g, "-");
}

export const postBaseFormSchema = z.object({
  title: requiredText("Title", POST_TITLE_MAX_LENGTH),
  slug: requiredText("Slug", POST_SLUG_MAX_LENGTH),
  excerpt: z
    .string()
    .max(
      POST_EXCERPT_MAX_LENGTH,
      `Excerpt must be ${POST_EXCERPT_MAX_LENGTH} characters or fewer.`,
    ),
  content: z.string(),
});

export const createPostFormSchema = postBaseFormSchema.extend({
  published: z.boolean(),
});

export const updatePostFormSchema = postBaseFormSchema;

export const createCommentFormSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Comment body is required.")
    .max(
      COMMENT_BODY_MAX_LENGTH,
      `Comment must be ${COMMENT_BODY_MAX_LENGTH} characters or fewer.`,
    ),
});

export const deleteCommentFormSchema = z.object({
  commentId: z.string().min(1),
});

export type CreatePostFormValues = z.infer<typeof createPostFormSchema>;
export type UpdatePostFormValues = z.infer<typeof updatePostFormSchema>;
export type CreateCommentFormValues = z.infer<typeof createCommentFormSchema>;
export type DeleteCommentFormValues = z.infer<typeof deleteCommentFormSchema>;
