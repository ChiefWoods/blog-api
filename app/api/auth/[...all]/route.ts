import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth";

const ALLOWED_METHODS = "GET, POST, OPTIONS";
const ALLOWED_HEADERS = "content-type, authorization";

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

const { GET: authGET, POST: authPOST } = toNextJsHandler(auth);

async function handleWithCors(request: Request, handler: (request: Request) => Promise<Response>) {
  const origin = request.headers.get("origin");
  const allowedOrigin = resolveCorsOrigin(origin);

  if (origin && !allowedOrigin) {
    return new Response("Origin not allowed", { status: 403 });
  }

  const response = await handler(request);
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
  return handleWithCors(request, authGET);
}

export async function POST(request: Request) {
  return handleWithCors(request, authPOST);
}
