import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { BEARER_TOKEN_STORAGE_KEY } from "@/lib/auth-constants";

type AuthClientConfig = {
  fetchOptions?: {
    onSuccess?: (ctx: { response: { headers: { get: (name: string) => string | null } } }) => void;
    auth?: {
      type: string;
      token?: () => string;
    };
  };
};

const createAuthClientMock = vi.fn((config?: AuthClientConfig) => ({
  __config: config,
  signIn: vi.fn(),
  signOut: vi.fn(),
  signUp: vi.fn(),
  useSession: vi.fn(),
}));

vi.mock("better-auth/react", () => ({
  createAuthClient: createAuthClientMock,
}));

describe("lib/auth-client.ts", () => {
  let importedModule: Awaited<typeof import("@/lib/auth-client")>;
  let options: AuthClientConfig;

  beforeAll(async () => {
    importedModule = await import("@/lib/auth-client");
    options = createAuthClientMock.mock.calls[0]?.[0] as AuthClientConfig;
  });

  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates auth client with bearer auth transport", () => {
    const { authClient, signIn, signOut, signUp, useSession } = importedModule;

    expect(authClient).toBeDefined();
    expect(signIn).toBeDefined();
    expect(signOut).toBeDefined();
    expect(signUp).toBeDefined();
    expect(useSession).toBeDefined();

    expect(createAuthClientMock).toHaveBeenCalledTimes(1);
    expect(options.fetchOptions?.auth?.type).toBe("Bearer");
    expect(typeof options.fetchOptions?.auth?.token).toBe("function");
  });

  it("stores bearer token from set-auth-token header and reuses it for auth token", () => {
    const storage = new Map<string, string>();
    const localStorageMock = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
    };

    vi.stubGlobal("window", {
      localStorage: localStorageMock,
    });
    vi.stubGlobal("localStorage", localStorageMock);

    const onSuccess = options.fetchOptions?.onSuccess;
    const tokenGetter = options.fetchOptions?.auth?.token;

    expect(onSuccess).toBeTypeOf("function");
    expect(tokenGetter).toBeTypeOf("function");

    onSuccess?.({
      response: {
        headers: {
          get: (name: string) => (name === "set-auth-token" ? "abc.def.ghi" : null),
        },
      },
    });

    expect(storage.get(BEARER_TOKEN_STORAGE_KEY)).toBe("abc.def.ghi");
    expect(tokenGetter?.()).toBe("abc.def.ghi");
  });
});
