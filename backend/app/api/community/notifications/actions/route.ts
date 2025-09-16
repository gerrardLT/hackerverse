import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { AuthService } from '@/lib/auth'
import { NotificationService } from '@/lib/notification-service'

// 强制使用Node.js运行时
export const runtime = 'nodejs'

// 通知操作 (标记已读、删除等)
export async function POST(request: NextRequest) {
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

    const body = await request.json()

    // 验证请求数据
    const actionSchema = z.object({
      action: z.enum(['markRead', 'markAllRead', 'delete']),
      notificationIds: z.array(z.string()).optional()
    })

    const validatedData = actionSchema.parse(body)

    switch (validatedData.action) {
      case 'markRead':
        if (!validatedData.notificationIds || validatedData.notificationIds.length === 0) {
          return NextResponse.json(
            { error: '请提供要标记的通知ID' },
            { status: 400 }
          )
        }
        await NotificationService.markAsRead(validatedData.notificationIds, decoded.userId)
        break

      case 'markAllRead':
        await NotificationService.markAllAsRead(decoded.userId)
        break

      case 'delete':
        if (!validatedData.notificationIds || validatedData.notificationIds.length !== 1) {
          return NextResponse.json(
            { error: '请提供单个要删除的通知ID' },
            { status: 400 }
          )
        }
        await NotificationService.deleteNotification(validatedData.notificationIds[0], decoded.userId)
        break

      default:
        return NextResponse.json(
          { error: '无效的操作类型' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      message: '操作成功'
    })

  } catch (error) {
    console.error('通知操作错误:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '请求数据验证失败', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '操作失败' },
      { status: 500 }
    )
  }
}
