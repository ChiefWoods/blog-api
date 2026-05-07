import type { SerializedEditorState } from "lexical";

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function plainTextToLexicalSerializedState(content: string): SerializedEditorState {
  const lines = content.split("\n");

  return {
    root: {
      children: lines.map((line) => ({
        type: "paragraph",
        version: 1,
        format: "",
        indent: 0,
        direction: null,
        textFormat: 0,
        textStyle: "",
        children: line
          ? [
              {
                detail: 0,
                format: 0,
                mode: "normal",
                style: "",
                text: line,
                type: "text",
                version: 1,
              },
            ]
          : [],
      })),
      direction: null,
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  };
}

function extractTextFromLexicalNode(node: unknown): string {
  if (!isRecord(node)) {
    return "";
  }

  if (typeof node.text === "string") {
    return node.text;
  }

  if (!Array.isArray(node.children)) {
    return "";
  }

  return node.children.map(extractTextFromLexicalNode).join("");
}

export function extractLexicalSerializedState(contentJson: unknown): SerializedEditorState | null {
  if (!isRecord(contentJson)) {
    return null;
  }

  const root = contentJson.root;
  if (!isRecord(root) || root.type !== "root" || !Array.isArray(root.children)) {
    return null;
  }

  return contentJson as unknown as SerializedEditorState;
}

export function extractPostBodyText(contentJson: unknown) {
  if (isRecord(contentJson) && "text" in contentJson && typeof contentJson.text === "string") {
    return contentJson.text;
  }

  const lexicalState = extractLexicalSerializedState(contentJson);
  if (lexicalState) {
    return lexicalState.root.children.map(extractTextFromLexicalNode).join("\n\n");
  }

  return "";
}
