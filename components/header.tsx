import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getServerSession } from "@/lib/auth";

const navLinkClassName =
  "rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

export async function Header() {
  const session = await getServerSession();
  const user = session?.user as
    | { isAdmin?: boolean; name?: string; email?: string | null; image?: string | null }
    | undefined;
  const userImage = user?.image?.trim();
  const avatarFallback =
    user?.name?.trim()?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "U";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex min-h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <nav className="flex items-center gap-1" aria-label="Global">
          <Link href="/" className={navLinkClassName}>
            Blogga
          </Link>
          {user?.isAdmin && (
            <Link href="/blogger/posts" className={navLinkClassName}>
              Dashboard
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-1">
          {session?.user ? (
            <>
              {userImage && (
                <Avatar size="sm">
                  <AvatarImage
                    src={userImage}
                    alt={user?.name ? `${user.name}'s avatar` : "User avatar"}
                  />
                  <AvatarFallback>{avatarFallback}</AvatarFallback>
                </Avatar>
              )}
              <p className="px-3 py-2 text-sm text-muted-foreground">
                {user?.name ? `Hi, ${user.name}` : "Signed in"}
              </p>
              <SignOutButton />
            </>
          ) : (
            <Link href="/sign-in" className={navLinkClassName}>
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
