"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { AuthSubmitButton, AuthSwitchLink, AuthTextField } from "@/components/auth/auth-form-parts";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { FieldGroup } from "@/components/ui/field";
import { signUp } from "@/lib/auth-client";
import { USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH } from "@/lib/auth-constants";
import { signUpFormSchema, type SignUpFormValues } from "@/lib/form-schema";
import { getCallbackURL, getErrorMessage } from "@/lib/utils";

export function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackURL = getCallbackURL(searchParams.get("callbackURL"));

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpFormSchema),
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
          router.refresh();
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
        <AuthTextField
          control={form.control}
          name="username"
          id="sign-up-username"
          label="Username"
          type="text"
          autoComplete="username"
          placeholder="your_handle"
          description={`Use ${USERNAME_MIN_LENGTH}-${USERNAME_MAX_LENGTH} characters: letters, numbers, underscores, or dots.`}
        />

        <AuthTextField
          control={form.control}
          name="email"
          id="sign-up-email"
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
        />

        <AuthTextField
          control={form.control}
          name="password"
          id="sign-up-password"
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="Create a secure password"
        />

        <AuthTextField
          control={form.control}
          name="confirmPassword"
          id="sign-up-confirm-password"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat your password"
        />
      </FieldGroup>

      <AuthSubmitButton
        pending={form.formState.isSubmitting}
        pendingText="Creating account..."
        idleText="Create account"
      />

      <SocialAuthButtons
        callbackURL={callbackURL}
        mode="sign-up"
        disabled={form.formState.isSubmitting}
      />

      <AuthSwitchLink prompt="Already have an account?" href="/sign-in" linkText="Sign in" />
    </form>
  );
}
