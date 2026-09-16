import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "./server/auth/constants";

/**
 * Edge-safe redirect only: presence of the session cookie, nothing else.
 * Real authorization (validity, expiry, role) is always re-checked against
 * the database in the route handler / server component.
 */
export function proxy(req: NextRequest) {
  const hasSession = req.cookies.has(SESSION_COOKIE_NAME);
  const { pathname } = req.nextUrl;

  const isProtected = pathname.startsWith("/cases") || pathname.startsWith("/admin");
  if (isProtected && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname === "/login" && hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/cases";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/cases/:path*", "/admin/:path*", "/login"],
};
