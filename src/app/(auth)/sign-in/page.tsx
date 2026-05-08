import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/auth-card";
import { SignInForm } from "@/components/auth/sign-in-form";
import { requireGuest } from "@/lib/auth";
import { getCallbackURL } from "@/lib/utils";

type SignInPageProps = {
  searchParams?: Promise<{
    callbackURL?: string | string[];
  }>;
};

export const metadata: Metadata = {
  title: "Sign In",
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const rawCallbackURL = Array.isArray(params?.callbackURL)
    ? (params.callbackURL[0] ?? null)
    : (params?.callbackURL ?? null);
  const callbackURL = getCallbackURL(rawCallbackURL);

  await requireGuest(callbackURL);

  return (
    <>
      <AuthCard
        title="Welcome back"
        description="Sign in to comment on posts and access your account."
      >
        <SignInForm />
      </AuthCard>
    </>
  );
}
