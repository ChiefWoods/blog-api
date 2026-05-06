import { z } from "zod";

import { USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH } from "@/lib/auth-constants";

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

export const signInFormSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
  rememberMe: z.boolean(),
});

export const signUpFormSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(USERNAME_MIN_LENGTH, `Username must be at least ${USERNAME_MIN_LENGTH} characters.`)
      .max(USERNAME_MAX_LENGTH, `Username must be ${USERNAME_MAX_LENGTH} characters or fewer.`)
      .regex(/^[a-zA-Z0-9_.]+$/, "Use only letters, numbers, underscores, and dots."),
    email: z.email("Enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm your password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export type CreatePostFormValues = z.infer<typeof createPostFormSchema>;
export type UpdatePostFormValues = z.infer<typeof updatePostFormSchema>;
export type CreateCommentFormValues = z.infer<typeof createCommentFormSchema>;
export type DeleteCommentFormValues = z.infer<typeof deleteCommentFormSchema>;
export type SignInFormValues = z.infer<typeof signInFormSchema>;
export type SignUpFormValues = z.infer<typeof signUpFormSchema>;
