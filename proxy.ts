import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

// 注意：这里改成了 export default function，这是 Next.js 中间件最标准的写法
export default async function middleware(request: NextRequest) {
  // 1. 获取门禁配置
  const auth = request.headers.get('authorization')
  const expectedAuth = process.env.ADMIN_AUTH 

  // 2. 只有访问页面时才进行门禁检查（排除 API 和 静态资源）
  const isPage = !request.nextUrl.pathname.startsWith('/api') && 
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

  // 3. 原有 PicImpact 逻辑
  const sessionCookie = getSessionCookie(request, {
    cookiePrefix: 'pic-impact'
  })
  
  if (request.nextUrl.pathname.startsWith('/api/v1') && !sessionCookie) {
    // 修复：这里使用 Response.json 确保兼容性
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

// 保持原有的配置
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
    '/admin/:path*',
    '/api/v1/:path*',
  ],
}
