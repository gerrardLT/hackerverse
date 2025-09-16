import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

// Edge Runtime兼容的JWT验证函数
async function verifyJWTToken(token: string): Promise<any> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')
    const { payload } = await jwtVerify(token, secret)
    return payload
  } catch (error) {
    console.log('JWT验证失败(Edge Runtime):', error instanceof Error ? error.message : 'Unknown error')
    return null
  }
}

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
async function jwtMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname
  
  // 优先检查公开路径
  const isPublic = PUBLIC_PATHS.some(path => pathname.startsWith(path))
  if (isPublic) {
    return null // 公开路径不需要验证
  }
  
  // 特殊处理：GET请求的公开接口
  if (request.method === 'GET' && (
    pathname.startsWith('/api/hackathons') ||
    pathname.startsWith('/api/stats/public') ||
    pathname.startsWith('/api/community/posts')
  )) {
    return null
  }
  
  // 检查是否是受保护的路径
  const isProtected = PROTECTED_PATHS.some(path => pathname.startsWith(path))
  if (!isProtected) {
    return null // 不在保护路径中，不需要验证
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
  
  // 验证token (使用Edge Runtime兼容的方法)
  const token = authHeader.substring(7)
  const payload = await verifyJWTToken(token)
  
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

export async function middleware(request: NextRequest) {
  // 允许的域名
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://hackx-frontend.vercel.app',
    'https://hackx.vercel.app',
  ]
  
  const origin = request.headers.get('origin')
  
  // 处理预检请求 - 必须在认证检查之前处理
  if (request.method === 'OPTIONS') {
    const headers = new Headers()
    
    if (origin && allowedOrigins.includes(origin)) {
      headers.set('Access-Control-Allow-Origin', origin)
    }
    
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    headers.set('Access-Control-Allow-Credentials', 'true')
    headers.set('Access-Control-Max-Age', '86400') // 24小时缓存
    
    return new NextResponse(null, { status: 200, headers })
  }
  
  // 执行JWT认证检查
  const authResult = await jwtMiddleware(request)
  if (authResult) {
    // 即使认证失败，也要设置CORS头
    if (origin && allowedOrigins.includes(origin)) {
      authResult.headers.set('Access-Control-Allow-Origin', origin)
    }
    authResult.headers.set('Access-Control-Allow-Credentials', 'true')
    return authResult
  }
  
  // 设置CORS头
  const response = NextResponse.next()
  
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  
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
     * 匹配所有API路径进行认证检查，除了以下路径：
     * - 公开认证路径 (signin, signup)
     * - 公开查看路径 (GET hackathons, public stats)
     * - 测试路径 (test/*)
     */
    '/api/((?!auth/signin|auth/signup|auth/github-login|auth/github-callback|stats/public|test/).*)',
  ],
} 