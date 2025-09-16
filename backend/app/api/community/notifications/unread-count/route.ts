import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'
import { NotificationService } from '@/lib/notification-service'

// 强制使用Node.js运行时
export const runtime = 'nodejs'

// 获取未读通知数量
export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = AuthService.verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: '无效的令牌' },
        { status: 401 }
      )
    }

    const unreadCount = await NotificationService.getUnreadCount(decoded.userId)

    return NextResponse.json({
      success: true,
      data: {
        unreadCount
      }
    })

  } catch (error) {
    console.error('获取未读通知数量错误:', error)
    return NextResponse.json(
      { error: '获取未读通知数量失败' },
      { status: 500 }
    )
  }
}
