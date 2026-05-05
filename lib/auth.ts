import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH } from "@/lib/auth-constants";
import { prisma } from "@/lib/prisma";

type BetterAuthUser = {
  email: string;
  username?: unknown;
} & Record<string, unknown>;

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const typedUser = user as BetterAuthUser;
          const existingUsername =
            typeof typedUser.username === "string" ? typedUser.username.trim() : "";

          return {
            data: {
              ...typedUser,
              username: existingUsername.length > 0 ? existingUsername : typedUser.email,
            },
          };
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    twitter: {
      clientId: process.env.TWITTER_CLIENT_ID as string,
      clientSecret: process.env.TWITTER_CLIENT_SECRET as string,
    },
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID as string,
      clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      strategy: "jwt",
      maxAge: 7 * 24 * 60 * 60,
    },
  },
  account: {
    storeStateStrategy: "cookie",
    storeAccountCookie: true,
  },
  plugins: [
    username({
      minUsernameLength: USERNAME_MIN_LENGTH,
      maxUsernameLength: USERNAME_MAX_LENGTH,
    }),
    nextCookies(),
  ],
});

export async function getServerSession() {
  try {
    return await auth.api.getSession({
      headers: await headers(),
    });
  } catch {
    return null;
  }
}

export async function requireGuest(redirectTo: string) {
  const session = await getServerSession();

  if (session?.user) {
    redirect(redirectTo);
  }
}

export async function requireAuth(redirectTo = "/sign-in") {
  const session = await getServerSession();

  if (!session?.user) {
    redirect(redirectTo);
  }

  return session;
}

export async function requireAdmin(redirectTo = "/") {
  const session = await requireAuth("/sign-in");
  const user = session.user as { isAdmin?: boolean };

  if (!user?.isAdmin) {
    redirect(redirectTo);
  }

  return session;
}
