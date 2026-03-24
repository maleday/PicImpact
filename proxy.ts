import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 只对“真正的 HTML 文档请求”做 Basic Auth
  const isHtmlDocument =
    request.method === 'GET' &&
    request.headers.get('accept')?.includes('text/html')

  const isPrefetch =
    request.headers.has('next-router-prefetch') ||
    request.headers.get('purpose') === 'prefetch'

  const expectedAuth = process.env.ADMIN_AUTH
  const auth = request.headers.get('authorization')

  if (expectedAuth && isHtmlDocument && !isPrefetch) {
    if (auth !== `Basic ${expectedAuth}`) {
      return new NextResponse('Authentication Required', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Secure Area"',
        },
      })
    }
  }

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
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
    '/admin/:path*',
    '/api/v1/:path*',
  ],
}
