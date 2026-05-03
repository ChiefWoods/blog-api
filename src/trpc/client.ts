import { createTRPCClient, httpBatchLink } from "@trpc/client";

import type { AppRouter } from "@/src/trpc/routers/_app";

import { BEARER_TOKEN_STORAGE_KEY } from "@/lib/auth-constants";

function getBaseUrl() {
  if (typeof window !== "undefined") {
    return "";
  }

  return process.env.BASE_URL;
}

function getBearerToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(BEARER_TOKEN_STORAGE_KEY);
}

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      maxURLLength: 2083,
      headers() {
        const token = getBearerToken();

        if (!token) {
          return {};
        }

        return {
          authorization: `Bearer ${token}`,
        };
      },
    }),
  ],
});
