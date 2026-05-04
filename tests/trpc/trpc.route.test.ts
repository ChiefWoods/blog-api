import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const fetchRequestHandlerMock = vi.fn();
const createTRPCContextMock = vi.fn();

vi.mock("@trpc/server/adapters/fetch", () => ({
  fetchRequestHandler: fetchRequestHandlerMock,
}));

vi.mock("@/src/trpc/context", () => ({
  createTRPCContext: createTRPCContextMock,
}));

describe("/api/trpc/[trpc] route", () => {
  let GET: (request: Request) => Promise<Response>;
  let OPTIONS: (request: Request) => Promise<Response>;

  beforeAll(async () => {
    const route = await import("@/app/api/trpc/[trpc]/route");
    GET = route.GET;
    OPTIONS = route.OPTIONS;
  });

  beforeEach(() => {
    fetchRequestHandlerMock.mockReset();
    createTRPCContextMock.mockReset();
    delete process.env.CORS_ALLOWED_ORIGINS;
  });

  it("handles preflight OPTIONS with CORS headers for allowed origins", async () => {
    process.env.CORS_ALLOWED_ORIGINS = "https://allowed.example";

    const req = new Request("http://localhost/api/trpc/post.listPublished", {
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

  it("rejects disallowed origins before hitting tRPC handler", async () => {
    process.env.CORS_ALLOWED_ORIGINS = "https://allowed.example";

    const req = new Request("http://localhost/api/trpc/post.listPublished", {
      method: "GET",
      headers: {
        origin: "https://blocked.example",
      },
    });

    const res = await GET(req);

    expect(res.status).toBe(403);
    expect(fetchRequestHandlerMock).not.toHaveBeenCalled();
  });

  it("forwards request to fetchRequestHandler and appends CORS headers", async () => {
    process.env.CORS_ALLOWED_ORIGINS = "https://allowed.example";
    fetchRequestHandlerMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    createTRPCContextMock.mockResolvedValue({ id: "ctx" });

    const req = new Request("http://localhost/api/trpc/post.listPublished", {
      method: "GET",
      headers: {
        origin: "https://allowed.example",
      },
    });

    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://allowed.example");
    expect(fetchRequestHandlerMock).toHaveBeenCalledTimes(1);

    const handlerArg = fetchRequestHandlerMock.mock.calls[0]?.[0] as {
      endpoint: string;
      req: Request;
      createContext: () => Promise<unknown>;
    };

    expect(handlerArg.endpoint).toBe("/api/trpc");
    expect(handlerArg.req).toBe(req);

    await handlerArg.createContext();
    expect(createTRPCContextMock).toHaveBeenCalledWith({ req });
  });
});
