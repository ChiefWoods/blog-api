import { auth, getIsAdminByUserId } from "@/lib/auth";
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
  const userId =
    user &&
    typeof user === "object" &&
    "id" in user &&
    typeof (user as { id?: unknown }).id === "string"
      ? ((user as { id: string }).id as string)
      : null;

  const isAdmin = userId ? await getIsAdminByUserId(userId) : false;

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
