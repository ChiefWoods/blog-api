"use client";

import { Share2Icon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function PostShareButton() {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: document.title,
          url,
        });
        return;
      } catch {
        return;
      }
    }

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      } catch {
        setCopied(false);
      }
    }
  }

  return (
    <Button type="button" variant="ghost" size="sm" className="gap-2" onClick={handleShare}>
      <Share2Icon className="size-4" aria-hidden="true" />
      {copied ? "Link copied" : "Share"}
    </Button>
  );
}
