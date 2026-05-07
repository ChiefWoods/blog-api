import type React from "react";

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NavLink } from "@/components/nav-link";

const usePathnameMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => usePathnameMock(),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    className,
    children,
  }: {
    href: string;
    className?: string;
    children: React.ReactNode;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/utils", () => ({
  cn: (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(" "),
}));

describe("NavLink", () => {
  beforeEach(() => {
    usePathnameMock.mockReset();
  });

  it("marks link active on exact match", () => {
    usePathnameMock.mockReturnValue("/blogger/posts");

    render(<NavLink href="/blogger/posts">Dashboard</NavLink>);

    const link = screen.getByRole("link", { name: "Dashboard" });
    expect(link).toHaveClass("bg-muted");
    expect(link).toHaveClass("text-foreground");
  });

  it("marks link active on nested path when exact is false", () => {
    usePathnameMock.mockReturnValue("/blogger/posts/new");

    render(<NavLink href="/blogger/posts">Dashboard</NavLink>);

    const link = screen.getByRole("link", { name: "Dashboard" });
    expect(link).toHaveClass("bg-muted");
    expect(link).toHaveClass("text-foreground");
  });

  it("does not mark link active on nested path when exact is true", () => {
    usePathnameMock.mockReturnValue("/blogger/posts/new");

    render(
      <NavLink href="/blogger/posts" exact>
        Dashboard
      </NavLink>,
    );

    const link = screen.getByRole("link", { name: "Dashboard" });
    expect(link).not.toHaveClass("bg-muted");
    expect(link).not.toHaveClass("text-foreground");
  });
});
