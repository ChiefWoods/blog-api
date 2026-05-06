import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { Prisma } from "@/generated/prisma/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCallbackURL(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

export function getErrorMessage(error: unknown, defaultMessage: string) {
  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }

  return defaultMessage;
}

export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function buildPostContentPayload(content: string) {
  const text = content.trim();
  const contentJson: Prisma.InputJsonValue = {
    type: "plain-text",
    text,
  };

  if (!text) {
    return {
      contentJson,
      contentHtml: null,
    };
  }

  return {
    contentJson,
    contentHtml: `<p>${escapeHtml(text).replaceAll("\n", "<br />")}</p>`,
  };
}

export function extractPostBodyText(contentJson: unknown) {
  if (
    contentJson &&
    typeof contentJson === "object" &&
    "text" in contentJson &&
    typeof (contentJson as { text?: unknown }).text === "string"
  ) {
    return (contentJson as { text: string }).text;
  }

  return "";
}
