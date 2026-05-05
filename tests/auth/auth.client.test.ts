import { beforeAll, describe, expect, it, vi } from "vitest";

type AuthClientConfig = {
  fetchOptions?: {
    credentials?: string;
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

  it("creates auth client with cookie credentials transport", () => {
    const { authClient, signIn, signOut, signUp, useSession } = importedModule;

    expect(authClient).toBeDefined();
    expect(signIn).toBeDefined();
    expect(signOut).toBeDefined();
    expect(signUp).toBeDefined();
    expect(useSession).toBeDefined();

    expect(createAuthClientMock).toHaveBeenCalledTimes(1);
    expect(options.fetchOptions?.credentials).toBe("include");
  });
});
