import { decodeJwt } from "jose";
import { NextResponse, type NextRequest } from "next/server";

import { PRIVATE_ROUTE_PREFIXES, ROUTES } from "@/constants/global/routes";

export const AUTH_COOKIE = "authorization_token";
const REQUESTED_DESTINY_COOKIE = "requested_destiny";

const isTokenValid = (token?: string): boolean => {
  if (!token) return false;

  try {
    const { exp } = decodeJwt(token);
    return typeof exp === "number" && exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

/**
 * Two jobs, both of which must happen on the server:
 *
 *  1. Guard private routes against an expired or missing session.
 *  2. Attach the bearer token to every `/proxy/*` call, so the JWT lives only
 *     in an httpOnly cookie and is never readable from client JavaScript.
 */
export default function proxy(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE)?.value;

  if (pathname.startsWith("/proxy/")) {
    if (!isTokenValid(token)) {
      return NextResponse.json(
        {
          success: false,
          data: { detail: "Your session has expired. Please sign in again." },
        },
        { status: 401 },
      );
    }

    const headers = new Headers(request.headers);
    headers.set("authorization", `Bearer ${token}`);
    headers.set("x-request-pathname", pathname);

    return NextResponse.next({ request: { headers } });
  }

  // "/" is matched exactly - as a prefix it would capture every route.
  const isPrivate =
    pathname === "/" ||
    PRIVATE_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isPrivate && !isTokenValid(token)) {
    const response = NextResponse.redirect(
      new URL(ROUTES.AUTH.LOGIN, request.url),
    );

    // Remember where they were headed so login can return them there.
    response.cookies.set(REQUESTED_DESTINY_COOKIE, `${pathname}${search}`, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 300,
      path: "/",
    });
    response.cookies.delete(AUTH_COOKIE);

    return response;
  }

  if (pathname.startsWith("/auth/login") && isTokenValid(token)) {
    return NextResponse.redirect(new URL(ROUTES.DASHBOARD, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets).*)"],
};
