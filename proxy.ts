// src/proxy.ts 或 proxy.ts（按你项目实际位置）
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request, {
    cookiePrefix: "pic-impact",
  });

  if (request.nextUrl.pathname.startsWith("/api/v1") && !sessionCookie) {
    return Response.json(
      { success: false, message: "authentication failed" },
      { status: 401 }
    );
  }

  if (request.nextUrl.pathname.startsWith("/admin") && !sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (sessionCookie && request.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
    "/admin/:path*",
    "/api/v1/:path*",
  ],
};
