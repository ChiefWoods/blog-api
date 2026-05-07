"use client";

import { LoaderCircle } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

import discordBlackLogo from "@/assets/discord/Discord-Symbol-Black.png";
import discordWhiteLogo from "@/assets/discord/Discord-Symbol-White.png";
import twitterBlackLogo from "@/assets/twitter/logo-black.png";
import twitterWhiteLogo from "@/assets/twitter/logo-white.png";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { signIn } from "@/lib/auth-client";
import { getErrorMessage } from "@/lib/utils";

type SocialProvider = "discord" | "twitter";

type SocialAuthButtonsProps = {
  callbackURL: string;
  mode: "sign-in" | "sign-up";
  disabled?: boolean;
};

const socialProviders: Array<{ provider: SocialProvider; label: string }> = [
  { provider: "discord", label: "Discord" },
  { provider: "twitter", label: "X" },
];

const socialProviderLogos: Record<
  SocialProvider,
  {
    light: { src: typeof discordBlackLogo; width: number; height: number };
    dark: { src: typeof discordBlackLogo; width: number; height: number };
  }
> = {
  discord: {
    light: {
      src: discordBlackLogo,
      width: 20,
      height: 20,
    },
    dark: {
      src: discordWhiteLogo,
      width: 20,
      height: 20,
    },
  },
  twitter: {
    light: {
      src: twitterBlackLogo,
      width: 16,
      height: 16,
    },
    dark: {
      src: twitterWhiteLogo,
      width: 16,
      height: 16,
    },
  },
};

export function SocialAuthButtons({ callbackURL, mode, disabled }: SocialAuthButtonsProps) {
  const [pendingProvider, setPendingProvider] = useState<SocialProvider | null>(null);

  async function handleSocialAuth(provider: SocialProvider) {
    setPendingProvider(provider);

    await signIn.social(
      {
        provider,
        callbackURL,
        fetchOptions: {
          disableSignal: true,
        },
      },
      {
        disableSignal: true,
        onError: (ctx: { error: unknown }) => {
          toast.error(
            getErrorMessage(ctx.error, "Unable to start social sign-in. Please try again."),
          );
        },
      },
    );

    setPendingProvider(null);
  }

  const actionLabel = mode === "sign-in" ? "Sign in" : "Sign up";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          or
        </span>
        <Separator className="flex-1" />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {socialProviders.map(({ provider, label }) => {
          const isPending = pendingProvider === provider;

          return (
            <Button
              key={provider}
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => void handleSocialAuth(provider)}
              disabled={disabled || pendingProvider !== null}
            >
              {isPending ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <>
                  <span className="sr-only">{`${actionLabel} with ${label}`}</span>
                  <span className="flex items-center gap-2">
                    Continue with
                    <Image
                      src={socialProviderLogos[provider].light.src}
                      width={socialProviderLogos[provider].light.width}
                      height={socialProviderLogos[provider].light.height}
                      alt={`${label} logo`}
                      className="block dark:hidden"
                      preload
                    />
                    <Image
                      src={socialProviderLogos[provider].dark.src}
                      width={socialProviderLogos[provider].dark.width}
                      height={socialProviderLogos[provider].dark.height}
                      alt={`${label} logo`}
                      className="hidden dark:block"
                      preload
                    />
                  </span>
                </>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
