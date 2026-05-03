import { createAuthClient } from "better-auth/react";

const BEARER_TOKEN_STORAGE_KEY = "bearer_token";

export const authClient = createAuthClient({
  fetchOptions: {
    onSuccess: (ctx) => {
      const authToken = ctx.response.headers.get("set-auth-token");
      if (authToken) {
        localStorage.setItem(BEARER_TOKEN_STORAGE_KEY, authToken);
      }
    },
    auth: {
      type: "Bearer",
      token: () => {
        return localStorage.getItem(BEARER_TOKEN_STORAGE_KEY) ?? "";
      },
    },
  },
});

export const { signIn, signOut, signUp, useSession } = authClient;
