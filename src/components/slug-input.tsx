"use client";

import type { ComponentProps } from "react";

import { Input } from "@/components/ui/input";

type SlugInputProps = Omit<ComponentProps<typeof Input>, "onInput"> & {
  onInput?: ComponentProps<typeof Input>["onInput"];
};

export function SlugInput({ onInput, ...props }: SlugInputProps) {
  return (
    <Input
      {...props}
      onInput={(event) => {
        const normalizedValue = event.currentTarget.value.replace(/\s+/g, "-");
        if (normalizedValue !== event.currentTarget.value) {
          event.currentTarget.value = normalizedValue;
        }

        onInput?.(event);
      }}
    />
  );
}
