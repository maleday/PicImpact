import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1) Basic Auth：只拦页面访问，不拦 API / 静态资源
  const expectedAuth = process.env.ADMIN_AUTH
  const auth = request.headers.get('authorization')

  const isPage =
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/_next') &&
    pathname !== '/favicon.ico'

  if (isPage && expectedAuth && auth !== `Basic ${expectedAuth}`) {
    return new NextResponse('Authentication Required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"',
      },
    })
  }

  // 2) 原有 PicImpact 登录态逻辑
  const sessionCookie = getSessionCookie(request, {
    cookiePrefix: 'pic-impact',
  })

  if (pathname.startsWith('/api/v1') && !sessionCookie) {
    return NextResponse.json(
      { success: false, message: 'authentication failed' },
      { status: 401 }
    )
  }

  if (pathname.startsWith('/admin') && !sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (sessionCookie && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
    '/admin/:path*',
    '/api/v1/:path*',
  ],
}
