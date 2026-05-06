"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin, requireAuth } from "@/lib/auth";
import {
  createPostFormSchema,
  normalizeSlug,
  type CreatePostFormValues,
  type UpdatePostFormValues,
  updatePostFormSchema,
} from "@/lib/form-schema";
import { createServerCaller } from "@/src/trpc/server";

import { buildPostContentPayload } from "./utils";

function getFormPostId(formData: FormData) {
  const id = formData.get("postId");
  if (typeof id !== "string" || id.length === 0) {
    throw new Error("Post ID is required");
  }
  return id;
}

export async function createPostAction(input: CreatePostFormValues) {
  await requireAdmin();

  const values = createPostFormSchema.parse(input);
  const slug = normalizeSlug(values.slug);
  const { contentJson, contentHtml } = buildPostContentPayload(values.content);

  const actionCaller = await createServerCaller();
  const post = await actionCaller.post.create({
    title: values.title,
    slug,
    excerpt: values.excerpt.trim() ? values.excerpt : null,
    contentJson,
    contentHtml,
    published: values.published,
  });

  revalidatePath("/");
  revalidatePath("/blogger/posts");
  if (values.published) {
    revalidatePath(`/posts/${post.slug}`);
  }
}

export async function updatePostAction(
  input: UpdatePostFormValues & {
    id: string;
    currentSlug: string;
  },
) {
  await requireAdmin();

  const values = updatePostFormSchema.parse(input);
  const slug = normalizeSlug(values.slug);
  const { contentJson, contentHtml } = buildPostContentPayload(values.content);

  const actionCaller = await createServerCaller();
  const updatedPost = await actionCaller.post.update({
    id: input.id,
    title: values.title,
    slug,
    excerpt: values.excerpt.trim() ? values.excerpt : null,
    contentJson,
    contentHtml,
  });

  revalidatePath("/");
  revalidatePath("/blogger/posts");
  revalidatePath(`/blogger/posts/${input.id}/edit`);

  // only revalidate public post pages when this post is published
  if (updatedPost.published) {
    revalidatePath(`/posts/${updatedPost.slug}`);

    // only revalidate old slug if slug changed
    if (input.currentSlug !== updatedPost.slug) {
      revalidatePath(`/posts/${input.currentSlug}`);
    }
  }
}

export async function updateAndPublishPostAction(
  input: UpdatePostFormValues & {
    id: string;
    currentSlug: string;
  },
) {
  await requireAdmin();

  const values = updatePostFormSchema.parse(input);
  const slug = normalizeSlug(values.slug);
  const { contentJson, contentHtml } = buildPostContentPayload(values.content);

  const actionCaller = await createServerCaller();
  await actionCaller.post.update({
    id: input.id,
    title: values.title,
    slug,
    excerpt: values.excerpt.trim() ? values.excerpt : null,
    contentJson,
    contentHtml,
  });

  const publishedPost = await actionCaller.post.publish({ id: input.id });

  revalidatePath("/");
  revalidatePath("/blogger/posts");
  revalidatePath(`/blogger/posts/${input.id}/edit`);
  revalidatePath(`/posts/${publishedPost.slug}`);

  // only revalidate old slug if slug changed
  if (input.currentSlug !== publishedPost.slug) {
    revalidatePath(`/posts/${input.currentSlug}`);
  }
}

export async function publishAction(formData: FormData) {
  await requireAdmin();

  const id = getFormPostId(formData);

  const actionCaller = await createServerCaller();
  const publishedPost = await actionCaller.post.publish({ id });

  revalidatePath("/");
  revalidatePath("/blogger/posts");
  revalidatePath(`/posts/${publishedPost.slug}`);
}

export async function unpublishAction(formData: FormData) {
  await requireAdmin();

  const id = getFormPostId(formData);

  const actionCaller = await createServerCaller();
  const unpublishedPost = await actionCaller.post.unpublish({ id });

  revalidatePath("/");
  revalidatePath("/blogger/posts");
  revalidatePath(`/posts/${unpublishedPost.slug}`);
}

export async function deleteAction(formData: FormData) {
  await requireAdmin();

  const id = getFormPostId(formData);

  const actionCaller = await createServerCaller();
  const deletedPost = await actionCaller.post.delete({ id });

  revalidatePath("/");
  revalidatePath("/blogger/posts");
  revalidatePath(`/posts/${deletedPost.slug}`);
}

export async function createCommentAction(formData: FormData, postId: string, path: string) {
  await requireAuth();

  const bodyValue = formData.get("body");
  if (typeof bodyValue !== "string") {
    return;
  }

  const body = bodyValue.trim();
  if (!body) {
    return;
  }

  const actionCaller = await createServerCaller();
  await actionCaller.comment.create({
    postId,
    body,
  });

  revalidatePath(path);
}

export async function deleteCommentAction(formData: FormData, path: string) {
  await requireAdmin();

  const commentId = formData.get("commentId");
  if (typeof commentId !== "string" || commentId.length === 0) {
    return;
  }

  const actionCaller = await createServerCaller();
  await actionCaller.comment.delete({
    id: commentId,
  });

  revalidatePath(path);
}
