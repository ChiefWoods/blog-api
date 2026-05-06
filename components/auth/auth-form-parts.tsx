"use client";

import Link from "next/link";
import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type AuthTextFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  id: string;
  label: string;
  type: React.ComponentProps<typeof Input>["type"];
  autoComplete?: React.ComponentProps<typeof Input>["autoComplete"];
  inputMode?: React.ComponentProps<typeof Input>["inputMode"];
  placeholder?: string;
  description?: string;
};

export function AuthTextField<TFieldValues extends FieldValues>({
  control,
  name,
  id,
  label,
  type,
  autoComplete,
  inputMode,
  placeholder,
  description,
}: AuthTextFieldProps<TFieldValues>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <FieldContent>
            <Input
              {...field}
              id={id}
              type={type}
              autoComplete={autoComplete}
              inputMode={inputMode}
              placeholder={placeholder}
              aria-invalid={fieldState.invalid}
            />
            {description ? <FieldDescription>{description}</FieldDescription> : null}
            <FieldError>{fieldState.error?.message}</FieldError>
          </FieldContent>
        </Field>
      )}
    />
  );
}

export function AuthSubmitButton({
  pending,
  idleText,
  pendingText,
}: {
  pending: boolean;
  idleText: string;
  pendingText: string;
}) {
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? pendingText : idleText}
    </Button>
  );
}

export function AuthSwitchLink({
  prompt,
  href,
  linkText,
}: {
  prompt: string;
  href: string;
  linkText: string;
}) {
  return (
    <p className="text-sm text-muted-foreground">
      {prompt}{" "}
      <Link className="font-medium text-primary underline-offset-4 hover:underline" href={href}>
        {linkText}
      </Link>
    </p>
  );
}
