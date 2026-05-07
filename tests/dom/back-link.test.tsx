import type { AnchorHTMLAttributes, ReactNode } from "react";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { BackLink } from "@/components/back-link";

describe("<BackLink />", () => {
  it("renders an anchor pointing at the provided href with the supplied label", () => {
    render(<BackLink href="/blogger/posts" label="Back to dashboard" />);

    const link = screen.getByRole("link", { name: /back to dashboard/i });

    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/blogger/posts");
    expect(link).toHaveTextContent("Back to dashboard");
  });

  it("renders a leading chevron icon for visual affordance", () => {
    const { container } = render(<BackLink href="/" label="Back to posts" />);

    const icon = container.querySelector("svg[data-icon='inline-start']");
    expect(icon).not.toBeNull();
  });

  it("applies the muted-foreground hover styles", () => {
    render(<BackLink href="/posts" label="Back" />);

    const link = screen.getByRole("link", { name: /back/i });

    expect(link.className).toContain("text-muted-foreground");
    expect(link.className).toContain("hover:text-foreground");
  });
});
