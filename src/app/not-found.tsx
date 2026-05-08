"use client";

import { SearchXIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function NotFoundPage() {
  const router = useRouter();

  useEffect(() => {
    document.title = "Page Not Found | Blogga";
  }, []);

  return (
    <section className="mx-auto flex w-full max-w-2xl items-center px-4 py-10 sm:px-6">
      <Empty className="border bg-card/60">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchXIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>404 - Page not found</EmptyTitle>
          <EmptyDescription>
            The page you requested doesn&apos;t exist or may have been moved.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button type="button" onClick={() => router.back()}>
            Go back
          </Button>
        </EmptyContent>
      </Empty>
    </section>
  );
}
