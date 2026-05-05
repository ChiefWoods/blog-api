"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signUp } from "@/lib/auth-client";
import { USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH } from "@/lib/auth-constants";
import { getCallbackURL, getErrorMessage } from "@/lib/utils";

const signUpSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(USERNAME_MIN_LENGTH, `Username must be at least ${USERNAME_MIN_LENGTH} characters.`)
      .max(USERNAME_MAX_LENGTH, `Username must be ${USERNAME_MAX_LENGTH} characters or fewer.`)
      .regex(/^[a-zA-Z0-9_.]+$/, "Use only letters, numbers, underscores, and dots."),
    email: z.email("Enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm your password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

type SignUpValues = z.infer<typeof signUpSchema>;

export function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackURL = getCallbackURL(searchParams.get("callbackURL"));

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await signUp.email(
      {
        name: values.username,
        username: values.username,
        email: values.email,
        password: values.password,
        callbackURL,
      },
      {
        disableSignal: true,
        onSuccess: () => {
          router.replace(callbackURL);
        },
        onError: (ctx) => {
          toast.error(
            getErrorMessage(ctx.error, "Unable to create your account. Please try again."),
          );
        },
      },
    );
  });

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <Controller
          name="username"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="sign-up-username">Username</FieldLabel>
              <FieldContent>
                <Input
                  {...field}
                  id="sign-up-username"
                  type="text"
                  autoComplete="username"
                  placeholder="your_handle"
                  aria-invalid={fieldState.invalid}
                />
                <FieldDescription>
                  Use {USERNAME_MIN_LENGTH}-{USERNAME_MAX_LENGTH} characters: letters, numbers,
                  underscores, or dots.
                </FieldDescription>
                <FieldError>{fieldState.error?.message}</FieldError>
              </FieldContent>
            </Field>
          )}
        />

        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="sign-up-email">Email</FieldLabel>
              <FieldContent>
                <Input
                  {...field}
                  id="sign-up-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@example.com"
                  aria-invalid={fieldState.invalid}
                />
                <FieldError>{fieldState.error?.message}</FieldError>
              </FieldContent>
            </Field>
          )}
        />

        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="sign-up-password">Password</FieldLabel>
              <FieldContent>
                <Input
                  {...field}
                  id="sign-up-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Create a secure password"
                  aria-invalid={fieldState.invalid}
                />
                <FieldError>{fieldState.error?.message}</FieldError>
              </FieldContent>
            </Field>
          )}
        />

        <Controller
          name="confirmPassword"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="sign-up-confirm-password">Confirm password</FieldLabel>
              <FieldContent>
                <Input
                  {...field}
                  id="sign-up-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  aria-invalid={fieldState.invalid}
                />
                <FieldError>{fieldState.error?.message}</FieldError>
              </FieldContent>
            </Field>
          )}
        />
      </FieldGroup>

      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Creating account..." : "Create account"}
      </Button>

      <p className="text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          className="font-medium text-primary underline-offset-4 hover:underline"
          href="/sign-in"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
