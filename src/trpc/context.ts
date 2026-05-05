import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type CreateTRPCContextOptions = {
  req: Request;
};

export async function createTRPCContext({ req }: CreateTRPCContextOptions) {
  let session: Awaited<ReturnType<typeof auth.api.getSession>> | null = null;

  try {
    session = await auth.api.getSession({
      headers: req.headers,
    });
  } catch {
    session = null;
  }

  const user = session?.user ?? null;
  const isAdmin =
    typeof user === "object" &&
    user !== null &&
    "isAdmin" in user &&
    Boolean((user as { isAdmin?: boolean }).isAdmin);

  return {
    req,
    prisma,
    session: session?.session ?? null,
    user,
    isAuthenticated: Boolean(user),
    isAdmin,
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
