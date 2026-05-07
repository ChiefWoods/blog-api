import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { createTRPCContext } from "@/trpc/context";
import { appRouter } from "@/trpc/routers/_app";

const ALLOWED_METHODS = "GET, POST, OPTIONS";
const ALLOWED_HEADERS = "content-type, authorization, x-trpc-source";

function getAllowedOrigins() {
  const configuredOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configuredOrigins?.length) {
    return configuredOrigins;
  }

  const baseUrlOrigin = process.env.BASE_URL?.trim();
  if (baseUrlOrigin) {
    return [baseUrlOrigin];
  }

  return [];
}

function resolveCorsOrigin(origin: string | null) {
  const allowedOrigins = getAllowedOrigins();

  if (!origin) {
    return null;
  }

  if (allowedOrigins.includes(origin)) {
    return origin;
  }

  return null;
}

function appendCorsHeaders(request: Request, response: Response) {
  const headers = new Headers(response.headers);
  const allowedOrigin = resolveCorsOrigin(request.headers.get("origin"));

  if (allowedOrigin) {
    headers.set("Access-Control-Allow-Origin", allowedOrigin);
    headers.set("Access-Control-Allow-Methods", ALLOWED_METHODS);
    headers.set("Access-Control-Allow-Headers", ALLOWED_HEADERS);
    headers.set("Vary", "Origin");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function handler(request: Request) {
  const origin = request.headers.get("origin");
  const allowedOrigin = resolveCorsOrigin(origin);

  if (origin && !allowedOrigin) {
    return new Response("Origin not allowed", { status: 403 });
  }

  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext: () => createTRPCContext({ req: request }),
  });

  return appendCorsHeaders(request, response);
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  const allowedOrigin = resolveCorsOrigin(origin);

  if (origin && !allowedOrigin) {
    return new Response(null, { status: 403 });
  }

  const headers = new Headers();
  if (allowedOrigin) {
    headers.set("Access-Control-Allow-Origin", allowedOrigin);
    headers.set("Access-Control-Allow-Methods", ALLOWED_METHODS);
    headers.set("Access-Control-Allow-Headers", ALLOWED_HEADERS);
    headers.set("Access-Control-Max-Age", "86400");
    headers.set("Vary", "Origin");
  }

  return new Response(null, {
    status: 204,
    headers,
  });
}

export async function GET(request: Request) {
  return handler(request);
}

export async function POST(request: Request) {
  return handler(request);
}
