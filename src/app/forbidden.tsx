import { ShieldAlertIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function ForbiddenPage() {
  return (
    <section className="mx-auto flex w-full max-w-2xl items-center px-4 py-10 sm:px-6">
      <Empty className="border bg-card/60">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ShieldAlertIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>403 - Access denied</EmptyTitle>
          <EmptyDescription>You do not have permission to access this page.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button asChild type="button" variant="outline">
              <Link href="/">Go home</Link>
            </Button>
          </div>
        </EmptyContent>
      </Empty>
    </section>
  );
}
