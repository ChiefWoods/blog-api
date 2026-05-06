import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";

export function BackToDashboardLink() {
  return (
    <Link
      href="/blogger/posts"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-300 hover:text-foreground"
    >
      <ChevronLeftIcon data-icon="inline-start" size={16} />
      Back to dashboard
    </Link>
  );
}
