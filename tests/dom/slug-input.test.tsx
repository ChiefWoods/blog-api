import type React from "react";

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SlugInput } from "@/components/slug-input";

vi.mock("@/components/ui/input", () => ({
  Input: ({ onInput, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input onInput={onInput} {...props} />
  ),
}));

describe("SlugInput", () => {
  it("replaces whitespace with hyphens", () => {
    render(<SlugInput aria-label="Slug" />);

    const input = screen.getByLabelText("Slug");
    fireEvent.input(input, { target: { value: "hello world  post" } });

    expect(input).toHaveValue("hello-world-post");
  });

  it("preserves value when already normalized", () => {
    render(<SlugInput aria-label="Slug" />);

    const input = screen.getByLabelText("Slug");
    fireEvent.input(input, { target: { value: "already-normalized" } });

    expect(input).toHaveValue("already-normalized");
  });
});
