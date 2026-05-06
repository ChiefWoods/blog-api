"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { AuthSubmitButton, AuthSwitchLink, AuthTextField } from "@/components/auth/auth-form-parts";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { signIn } from "@/lib/auth-client";
import { signInFormSchema, type SignInFormValues } from "@/lib/form-schema";
import { getCallbackURL, getErrorMessage } from "@/lib/utils";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackURL = getCallbackURL(searchParams.get("callbackURL"));

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInFormSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: true,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await signIn.email(
      {
        email: values.email,
        password: values.password,
        rememberMe: values.rememberMe,
        callbackURL,
      },
      {
        disableSignal: true,
        onSuccess: () => {
          router.replace(callbackURL);
        },
        onError: (ctx) => {
          toast.error(getErrorMessage(ctx.error, "Unable to sign in. Please try again."));
        },
      },
    );
  });

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <AuthTextField
          control={form.control}
          name="email"
          id="sign-in-email"
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
        />

        <AuthTextField
          control={form.control}
          name="password"
          id="sign-in-password"
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
        />

        <Controller
          name="rememberMe"
          control={form.control}
          render={({ field }) => (
            <Field orientation="horizontal">
              <Checkbox
                id="remember-me"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                aria-label="Remember me"
              />
              <FieldContent>
                <FieldLabel htmlFor="remember-me">Remember me</FieldLabel>
                <FieldDescription>Keep me signed in on this device.</FieldDescription>
              </FieldContent>
            </Field>
          )}
        />
      </FieldGroup>

      <AuthSubmitButton
        pending={form.formState.isSubmitting}
        pendingText="Signing in..."
        idleText="Sign in"
      />

      <SocialAuthButtons
        callbackURL={callbackURL}
        mode="sign-in"
        disabled={form.formState.isSubmitting}
      />

      <AuthSwitchLink prompt="Don't have an account?" href="/sign-up" linkText="Sign up" />
    </form>
  );
}
