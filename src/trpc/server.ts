import { headers } from "next/headers";

import { createTRPCContext } from "@/trpc/context";
import { appRouter } from "@/trpc/routers/_app";

function getRequestUrl(requestHeaders: Headers) {
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";

  return `${protocol}://${host}/api/trpc`;
}

export async function createServerCaller() {
  const incomingHeaders = await headers();
  const requestHeaders = new Headers(incomingHeaders);
  const req = new Request(getRequestUrl(requestHeaders), {
    headers: requestHeaders,
  });

  const ctx = await createTRPCContext({ req });
  return appRouter.createCaller(ctx);
}
