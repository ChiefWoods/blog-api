import type { AnchorHTMLAttributes, ReactNode } from "react";

import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const usePathnameMock = vi.fn<() => string>();

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

vi.mock("next/navigation", () => ({
  usePathname: () => usePathnameMock(),
}));

import { NavLink } from "@/components/nav-link";

describe("<NavLink />", () => {
  beforeEach(() => {
    usePathnameMock.mockReset();
  });

  afterEach(() => {
    usePathnameMock.mockReset();
  });

  it("applies the active class when the current path matches exactly", () => {
    usePathnameMock.mockReturnValue("/blogger/posts");

    render(
      <NavLink href="/blogger/posts" className="base" activeClassName="is-active">
        Dashboard
      </NavLink>,
    );

    const link = screen.getByRole("link", { name: "Dashboard" });
    expect(link).toHaveClass("base", "is-active");
  });

  it("applies the active class when the current path is nested under href", () => {
    usePathnameMock.mockReturnValue("/blogger/posts/new");

    render(
      <NavLink href="/blogger/posts" className="base" activeClassName="is-active">
        Dashboard
      </NavLink>,
    );

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveClass("is-active");
  });

  it("does not apply the active class when exact is true and the path is nested", () => {
    usePathnameMock.mockReturnValue("/blogger/posts/new");

    render(
      <NavLink href="/blogger/posts" exact className="base" activeClassName="is-active">
        Dashboard
      </NavLink>,
    );

    const link = screen.getByRole("link", { name: "Dashboard" });
    expect(link).toHaveClass("base");
    expect(link).not.toHaveClass("is-active");
  });

  it("does not apply the active class when on an unrelated route", () => {
    usePathnameMock.mockReturnValue("/about");

    render(
      <NavLink href="/blogger/posts" className="base" activeClassName="is-active">
        Dashboard
      </NavLink>,
    );

    const link = screen.getByRole("link", { name: "Dashboard" });
    expect(link).not.toHaveClass("is-active");
  });

  it("falls back to the default active class when none is provided", () => {
    usePathnameMock.mockReturnValue("/blogger/posts");

    render(
      <NavLink href="/blogger/posts" className="base">
        Dashboard
      </NavLink>,
    );

    const link = screen.getByRole("link", { name: "Dashboard" });
    expect(link).toHaveClass("bg-muted", "text-foreground");
  });
});
