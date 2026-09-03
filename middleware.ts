import { NextRequest, NextResponse } from "next/server";

// Server-side gate for the entire ops app.
// A valid session cookie is required for every page and API route,
// except the login endpoint and static assets.

const COOKIE_NAME = "ops_session";

// Paths that must stay public (the login flow + framework internals).
const PUBLIC_PATHS = ["/api/auth/login", "/api/auth/check"];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  // Next internals + static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    /\.(png|jpg|jpeg|svg|ico|webp|css|js|woff2?|ttf)$/.test(pathname)
  ) {
    return true;
  }
  return false;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const expected = process.env.OPS_SESSION_SECRET;

  const authed = !!token && !!expected && token === expected;

  if (authed) return NextResponse.next();

  // API routes: return 401 JSON instead of an HTML redirect.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Pages: allow through so the client-side PasswordGate can render the login UI.
  // (The gate calls /api/auth/login, which sets the cookie; API data stays
  //  protected by the 401 above regardless.)
  return NextResponse.next();
}

export const config = {
  // Run on everything except Next internals/static (handled in isPublic too).
  matcher: ["/((?!_next/static|_next/image|favicon.png).*)"],
};
