import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookieName, isAuthEnabled, isValidSession } from "@/lib/auth/session";

const PUBLIC_PREFIXES = ["/login", "/api/cron/", "/api/health"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    isPublicPath(pathname) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.endsWith(".ico")
  ) {
    return NextResponse.next();
  }

  if (!isAuthEnabled()) {
    if (process.env.NODE_ENV === "production" && process.env.REQUIRE_APP_PASSWORD === "true") {
      return new NextResponse("APP_PASSWORD required in production. Set REQUIRE_APP_PASSWORD only after configuring APP_PASSWORD.", {
        status: 503,
      });
    }
    return NextResponse.next();
  }

  const session = request.cookies.get(getSessionCookieName())?.value;
  if (isValidSession(session)) {
    if (pathname === "/login") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/login") {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
