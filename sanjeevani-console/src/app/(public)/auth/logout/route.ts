import { NextResponse, type NextRequest } from "next/server";

import { ROUTES } from "@/constants/global/routes";
import { AUTH_COOKIE } from "@/proxy";

/**
 * A Route Handler rather than a page: Next.js only permits cookie mutation
 * from a Server Action or a Route Handler, so clearing the session during a
 * page render throws instead of signing the user out.
 *
 * Clearing the cookie here - rather than asking the API to invalidate a
 * token - is deliberate: the JWT is stateless and short-lived, and the cookie
 * is the only place the browser holds it.
 */
export function GET(request: NextRequest): NextResponse {
  const response = NextResponse.redirect(
    new URL(ROUTES.AUTH.LOGIN, request.url),
  );

  response.cookies.delete(AUTH_COOKIE);
  response.cookies.delete("requested_destiny");

  // Without this the browser can serve a cached redirect and skip the
  // Set-Cookie headers that actually end the session.
  response.headers.set("Cache-Control", "no-store, max-age=0");

  return response;
}
