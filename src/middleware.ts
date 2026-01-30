import { NextRequest, NextResponse } from "next/server";
import { proxy } from "./proxy"; // ✅ 如果你的 proxy.ts 在 src 里，这行不用改
// 如果你的 proxy.ts 在 src/lib/proxy.ts，那就改成：import { proxy } from "./lib/proxy";

export async function middleware(request: NextRequest) {
  // 1) Basic 门禁（只拦“页面访问”，不拦 API / 静态资源）
  const expectedAuth = process.env.ADMIN_AUTH; // 在 Vercel 环境变量里配置
  const auth = request.headers.get("authorization");

  const isPage =
    !request.nextUrl.pathname.startsWith("/api") &&
    !request.nextUrl.pathname.startsWith("/_next") &&
    request.nextUrl.pathname !== "/favicon.ico";

  if (isPage && expectedAuth && auth !== `Basic ${expectedAuth}`) {
    return new NextResponse("Authentication Required", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Secure Area"',
      },
    });
  }

  // 2) 执行原有 PicImpact 逻辑
  return proxy(request);
}

// ✅ matcher 放 middleware.ts 里就够了
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
    "/admin/:path*",
    "/api/v1/:path*",
  ],
};
