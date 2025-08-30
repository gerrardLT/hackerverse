import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from './lib/auth'

// 需要JWT认证的路径
const PROTECTED_PATHS = [
  '/api/users',
  '/api/hackathons',
  '/api/teams', 
  '/api/projects',
  '/api/community',
  '/api/notifications',
  '/api/admin'
]

// 公开访问的路径
const PUBLIC_PATHS = [
  '/api/auth',
  '/api/hackathons', // GET请求公开
]

/**
 * JWT认证中间件
 */
function jwtMiddleware(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname
  
  // 检查是否是受保护的路径
  const isProtected = PROTECTED_PATHS.some(path => pathname.startsWith(path))
  const isPublic = PUBLIC_PATHS.some(path => pathname.startsWith(path))
  
  if (!isProtected || isPublic) {
    return null // 不需要验证
  }
  
  // 特殊处理：GET /api/hackathons 公开访问
  if (pathname.startsWith('/api/hackathons') && request.method === 'GET') {
    return null
  }
  
  // 获取Authorization header
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { 
        success: false, 
        error: '未授权访问，请提供有效的认证token',
        code: 'UNAUTHORIZED'
      },
      { status: 401 }
    )
  }
  
  // 验证token
  const token = authHeader.substring(7)
  const payload = AuthService.verifyToken(token)
  
  if (!payload) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Token无效或已过期',
        code: 'TOKEN_INVALID'
      },
      { status: 401 }
    )
  }
  
  // Token有效，继续处理
  return null
}

export function middleware(request: NextRequest) {
  // 先执行JWT认证检查
  const authResult = jwtMiddleware(request)
  if (authResult) {
    return authResult // 认证失败，返回错误响应
  }
  
  // 设置CORS头
  const response = NextResponse.next()
  
  // 允许的域名
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://hackx-frontend.vercel.app',
    'https://hackx.vercel.app',
  ]
  
  const origin = request.headers.get('origin')
  
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  
  // 处理预检请求
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers: response.headers })
  }
  
  // 安全头
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  return response
}

export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，除了以下开头的路径：
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 