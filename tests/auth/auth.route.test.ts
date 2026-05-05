import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const authGetMock = vi.fn();
const authPostMock = vi.fn();
const toNextJsHandlerMock = vi.fn();

vi.mock("better-auth/next-js", () => ({
  toNextJsHandler: toNextJsHandlerMock,
  nextCookies: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: { id: "mock-auth" },
}));

describe("/api/auth/[...all] route", () => {
  let GET: (request: Request) => Promise<Response>;
  let POST: (request: Request) => Promise<Response>;
  let OPTIONS: (request: Request) => Promise<Response>;

  beforeAll(async () => {
    toNextJsHandlerMock.mockReturnValue({
      GET: authGetMock,
      POST: authPostMock,
    });

    const route = await import("@/app/api/auth/[...all]/route");
    GET = route.GET;
    POST = route.POST;
    OPTIONS = route.OPTIONS;
  });

  beforeEach(() => {
    authGetMock.mockReset();
    authPostMock.mockReset();
    delete process.env.CORS_ALLOWED_ORIGINS;
  });

  it("handles preflight OPTIONS with CORS headers for allowed origins", async () => {
    process.env.CORS_ALLOWED_ORIGINS = "https://allowed.example";

    const req = new Request("http://localhost/api/auth/sign-in", {
      method: "OPTIONS",
      headers: {
        origin: "https://allowed.example",
      },
    });

    const res = await OPTIONS(req);

    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://allowed.example");
    expect(res.headers.get("Access-Control-Allow-Methods")).toContain("OPTIONS");
  });

  it("rejects disallowed origins before hitting auth handler", async () => {
    process.env.CORS_ALLOWED_ORIGINS = "https://allowed.example";

    const req = new Request("http://localhost/api/auth/session", {
      method: "GET",
      headers: {
        origin: "https://blocked.example",
      },
    });

    const res = await GET(req);

    expect(res.status).toBe(403);
    expect(authGetMock).not.toHaveBeenCalled();
  });

  it("forwards GET request to auth handler and appends CORS headers", async () => {
    process.env.CORS_ALLOWED_ORIGINS = "https://allowed.example";
    authGetMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const req = new Request("http://localhost/api/auth/session", {
      method: "GET",
      headers: {
        origin: "https://allowed.example",
      },
    });

    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(authGetMock).toHaveBeenCalledTimes(1);
    expect(authGetMock).toHaveBeenCalledWith(req);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://allowed.example");
  });

  it("forwards POST request to auth handler and appends CORS headers", async () => {
    process.env.CORS_ALLOWED_ORIGINS = "https://allowed.example";
    authPostMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const req = new Request("http://localhost/api/auth/sign-in", {
      method: "POST",
      headers: {
        origin: "https://allowed.example",
      },
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(authPostMock).toHaveBeenCalledTimes(1);
    expect(authPostMock).toHaveBeenCalledWith(req);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://allowed.example");
  });
});
