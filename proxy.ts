import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

export async function middleware(request: NextRequest) {
  // --- 1. 新增：全站门禁逻辑 (只有通过这里才能继续) ---
  const auth = request.headers.get('authorization')
  const expectedAuth = process.env.ADMIN_AUTH 

  // 定义哪些路径需要弹框输入密码：除了静态资源和 favicon 之外的所有页面
  const isPageRequest = !request.nextUrl.pathname.startsWith('/_next') && 
                        !request.nextUrl.pathname.startsWith('/api') &&
                        request.nextUrl.pathname !== '/favicon.ico'

  if (isPageRequest && (!expectedAuth || auth !== `Basic ${expectedAuth}`)) {
    return new NextResponse('Authentication Required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"',
      },
    })
  }
  // --- 门禁逻辑结束 ---

  // --- 2. 原有：PicImpact 核心逻辑 (保持不变) ---
  const sessionCookie = getSessionCookie(request, {
    cookiePrefix: 'pic-impact'
  })
  
  // API 权限保护
  if (request.nextUrl.pathname.startsWith('/api/v1') && !sessionCookie) {
    return Response.json(
      { success: false, message: 'authentication failed' },
      { status: 401 }
    )
  }
  
  // 后台跳转逻辑
  if (request.nextUrl.pathname.startsWith('/admin') && !sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // 已登录状态下访问登录页跳转到首页
  if (sessionCookie && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

// 保持原有的配置，确保所有路径都经过这个中间件
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
    '/admin/:path*',
    '/api/v1/:path*',
  ],
}
