import { describe, expect, it } from "vitest";

import {
  COMMENT_BODY_MAX_LENGTH,
  createCommentFormSchema,
  signUpFormSchema,
} from "@/lib/form-schema";

describe("form schemas", () => {
  it("rejects sign-up username with invalid characters", () => {
    const result = signUpFormSchema.safeParse({
      username: "invalid-name",
      email: "user@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
    });

    expect(result.success).toBe(false);
  });

  it("rejects sign-up when passwords do not match", () => {
    const result = signUpFormSchema.safeParse({
      username: "valid_name",
      email: "user@example.com",
      password: "Password123!",
      confirmPassword: "Password123?wrong",
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty comment body after trimming", () => {
    const result = createCommentFormSchema.safeParse({
      body: "   ",
    });

    expect(result.success).toBe(false);
  });

  it("accepts comment body at max length and rejects above max length", () => {
    const valid = createCommentFormSchema.safeParse({
      body: "a".repeat(COMMENT_BODY_MAX_LENGTH),
    });
    const invalid = createCommentFormSchema.safeParse({
      body: "a".repeat(COMMENT_BODY_MAX_LENGTH + 1),
    });

    expect(valid.success).toBe(true);
    expect(invalid.success).toBe(false);
  });
});
