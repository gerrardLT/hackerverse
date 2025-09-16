import { NextRequest } from 'next/server'
import { ApiResponseHandler } from '@/lib/api-response'
import { AuthService } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

/**
 * POST /api/auth/logout
 * 用户退出登录
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      return ApiResponseHandler.unauthorized('未提供认证token')
    }

    const token = authHeader.substring(7)
    const decoded = AuthService.verifyToken(token)

    if (!decoded) {
      return ApiResponseHandler.unauthorized('Token无效')
    }

    try {
      // 更新用户的最后登出时间
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { 
          updatedAt: new Date()
          // 注意：我们不存储token黑名单，因为JWT是无状态的
          // 在生产环境中，可以考虑使用Redis存储token黑名单
        }
      })

      console.log(`用户 ${decoded.userId} 退出登录`)

      return ApiResponseHandler.success(
        { success: true },
        '退出登录成功'
      )
    } catch (dbError) {
      console.error('更新用户登出状态失败:', dbError)
      // 即使数据库更新失败，也返回成功，因为token在前端已经被删除
      return ApiResponseHandler.success(
        { success: true },
        '退出登录成功'
      )
    }

  } catch (error) {
    console.error('退出登录失败:', error)
    return ApiResponseHandler.internalError('退出登录失败')
  }
}
