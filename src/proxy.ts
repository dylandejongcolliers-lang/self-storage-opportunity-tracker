import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// In Next.js 16 the old `middleware.ts` file is renamed to `proxy.ts`.
// This only does a cheap "is a session cookie present?" check so unauthenticated
// visitors to /dashboard get bounced to /login without a flash of content.
// The real cryptographic check happens in the dashboard layout and in every
// Server Action via `requireAuth()`.

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard") && !request.cookies.has("sst_session")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
