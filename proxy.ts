import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const protectedPrefixes = [
  "/dashboard",
  "/studio",
  "/billing",
  "/admin",
];

// Routes that authenticated users should NOT see (redirect to dashboard)
const authRoutes = ["/login", "/register"];

// Auth.js v5 wraps the proxy function via auth()
// We use the inline callback pattern: auth(async (req) => { ... })
export const proxy = auth(async function proxy(req: NextRequest & { auth: unknown }) {
  const session = (req as any).auth;
  const { pathname } = req.nextUrl;

  const isProtected = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Unauthenticated user trying to access protected route → /login
  if (isProtected && !session) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user visiting login/register → /dashboard
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Run on all routes except Next.js internals and static files
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
