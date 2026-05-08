import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/auth-card";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { requireGuest } from "@/lib/auth";
import { getCallbackURL } from "@/lib/utils";

type SignUpPageProps = {
  searchParams?: Promise<{
    callbackURL?: string | string[];
  }>;
};

export const metadata: Metadata = {
  title: "Sign Up",
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;
  const rawCallbackURL = Array.isArray(params?.callbackURL)
    ? (params.callbackURL[0] ?? null)
    : (params?.callbackURL ?? null);
  const callbackURL = getCallbackURL(rawCallbackURL);

  await requireGuest(callbackURL);

  return (
    <>
      <AuthCard
        title="Create your account"
        description="Join the blog to leave comments and follow new posts."
      >
        <SignUpForm />
      </AuthCard>
    </>
  );
}
