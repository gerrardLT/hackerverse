import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'
import { NotificationService } from '@/lib/notification-service'

// 强制使用Node.js运行时
export const runtime = 'nodejs'

// 获取用户通知列表
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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    const result = await NotificationService.getUserNotifications(
      decoded.userId,
      page,
      limit,
      unreadOnly
    )

    return NextResponse.json({
      success: true,
      data: {
        notifications: result.notifications.map(notification => ({
          id: notification.id,
          type: notification.type,
          title: notification.title,
          content: notification.content,
          entityType: notification.entityType,
          entityId: notification.entityId,
          isRead: notification.isRead,
          createdAt: notification.createdAt.toISOString(),
          readAt: notification.readAt?.toISOString(),
          triggerUser: notification.triggerUser ? {
            id: notification.triggerUser.id,
            name: notification.triggerUser.username,
            username: notification.triggerUser.username,
            avatar: notification.triggerUser.avatarUrl
          } : null
        })),
        pagination: result.pagination
      }
    })

  } catch (error) {
    console.error('获取通知列表错误:', error)
    return NextResponse.json(
      { error: '获取通知列表失败' },
      { status: 500 }
    )
  }
}
