"use client";

import { AlertTriangleIcon } from "lucide-react";
import Link from "next/link";
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

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto flex w-full max-w-2xl items-center px-4 py-10 sm:px-6">
      <Empty className="border bg-card/60">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <AlertTriangleIcon aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>500 - Something went wrong</EmptyTitle>
          <EmptyDescription>An unexpected error occurred while loading this page.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button type="button" onClick={reset}>
              Try again
            </Button>
            <Button asChild type="button" variant="outline">
              <Link href="/">Go home</Link>
            </Button>
          </div>
        </EmptyContent>
      </Empty>
    </section>
  );
}
