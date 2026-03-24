import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ===== custom basic auth start =====
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
  // ===== custom basic auth end =====

  const sessionCookie = getSessionCookie(request, {
    cookiePrefix: 'pic-impact'
  })

  if (pathname.startsWith('/api/v1') && !sessionCookie) {
    return Response.json(
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
