import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

export async function proxy(request: NextRequest) {
  // 1. 你原来的 Basic Auth 门禁
  const auth = request.headers.get('authorization')
  const expectedAuth = process.env.ADMIN_AUTH

  const isPage =
    !request.nextUrl.pathname.startsWith('/api') &&
    !request.nextUrl.pathname.startsWith('/_next') &&
    request.nextUrl.pathname !== '/favicon.ico'

  if (isPage && expectedAuth && auth !== `Basic ${expectedAuth}`) {
    return new NextResponse('Authentication Required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"',
      },
    })
  }

  // 2. 你原来的 session 登录校验
  const sessionCookie = getSessionCookie(request, {
    cookiePrefix: 'pic-impact',
  })

  if (request.nextUrl.pathname.startsWith('/api/v1') && !sessionCookie) {
    return Response.json(
      { success: false, message: 'authentication failed' },
      { status: 401 }
    )
  }

  if (request.nextUrl.pathname.startsWith('/admin') && !sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (sessionCookie && request.nextUrl.pathname === '/login') {
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
