import { createTRPCClient, httpBatchLink } from "@trpc/client";

import type { AppRouter } from "@/src/trpc/routers/_app";

function getBaseUrl() {
  if (typeof window !== "undefined") {
    return "";
  }

  return process.env.BASE_URL;
}

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      maxURLLength: 2083,
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: "include",
        });
      },
    }),
  ],
});
