import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";

type BackLinkProps = {
  href: string;
  label: string;
};

export function BackLink({ href, label }: BackLinkProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-300 hover:text-foreground"
    >
      <ChevronLeftIcon data-icon="inline-start" size={16} />
      {label}
    </Link>
  );
}
