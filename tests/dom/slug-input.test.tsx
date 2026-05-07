import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SlugInput } from "@/components/slug-input";

describe("<SlugInput />", () => {
  it("renders an input control with the provided placeholder", () => {
    render(<SlugInput placeholder="my-post-slug" aria-label="slug" />);

    expect(screen.getByPlaceholderText("my-post-slug")).toBeInTheDocument();
    expect(screen.getByLabelText("slug")).toBeInTheDocument();
  });

  it("normalizes whitespace into dashes as the user types", async () => {
    const user = userEvent.setup();

    render(<SlugInput aria-label="slug" />);

    const input = screen.getByLabelText("slug") as HTMLInputElement;

    await user.type(input, "hello world from claude");

    expect(input.value).toBe("hello-world-from-claude");
  });

  it("collapses runs of consecutive whitespace into a single dash for bulk input", () => {
    render(<SlugInput aria-label="slug" />);

    const input = screen.getByLabelText("slug") as HTMLInputElement;

    fireEvent.input(input, { target: { value: "a   b\tc" } });

    expect(input.value).toBe("a-b-c");
  });

  it("forwards the original onInput handler with the event", async () => {
    const user = userEvent.setup();
    const onInput = vi.fn();

    render(<SlugInput aria-label="slug" onInput={onInput} />);

    const input = screen.getByLabelText("slug") as HTMLInputElement;

    await user.type(input, "ab");

    expect(onInput).toHaveBeenCalled();
    expect(input.value).toBe("ab");
  });

  it("leaves slug-safe input untouched", async () => {
    const user = userEvent.setup();

    render(<SlugInput aria-label="slug" />);

    const input = screen.getByLabelText("slug") as HTMLInputElement;

    await user.type(input, "already-clean");

    expect(input.value).toBe("already-clean");
  });
});
