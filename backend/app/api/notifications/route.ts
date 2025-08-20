import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

// 获取通知列表
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

    const userId = decoded.userId

    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // 构建查询条件
    const where: any = {
      userId: userId
    }

    if (category && category !== 'all') {
      where.type = category
    }

    if (unreadOnly) {
      where.read = false
    }

    // 获取通知列表
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    })

    // 获取总数
    const total = await prisma.notification.count({ where })

    // 获取未读数量
    const unreadCount = await prisma.notification.count({
      where: {
        userId: userId,
        read: false
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        notifications: notifications.map(notification => ({
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          read: notification.read,
          createdAt: notification.createdAt.toISOString(),
          userId: notification.userId,
          actionUrl: getActionUrl(notification.type, notification.data),
          actionLabel: getActionLabel(notification.type),
          priority: getPriority(notification.type),
          category: getCategory(notification.type)
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        unreadCount
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

// 创建新通知
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
    const notificationSchema = z.object({
      type: z.string(),
      title: z.string(),
      message: z.string(),
      data: z.any().optional(),
      userId: z.string()
    })

    const validatedData = notificationSchema.parse(body)

    // 创建通知
    const notification = await prisma.notification.create({
      data: {
        type: validatedData.type,
        title: validatedData.title,
        message: validatedData.message,
        data: validatedData.data || {},
        userId: validatedData.userId,
        read: false
      }
    })

    return NextResponse.json({
      success: true,
      message: '通知创建成功',
      data: {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        read: notification.read,
        createdAt: notification.createdAt.toISOString(),
        userId: notification.userId,
        actionUrl: getActionUrl(notification.type, notification.data),
        actionLabel: getActionLabel(notification.type),
        priority: getPriority(notification.type),
        category: getCategory(notification.type)
      }
    })

  } catch (error) {
    console.error('创建通知错误:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '请求数据验证失败', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '创建通知失败' },
      { status: 500 }
    )
  }
}

// 标记通知为已读
export async function PATCH(request: NextRequest) {
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
    const patchSchema = z.object({
      action: z.enum(['markAsRead', 'markAllAsRead']),
      notificationId: z.string().optional()
    })

    const validatedData = patchSchema.parse(body)
    const userId = decoded.userId

    if (validatedData.action === 'markAsRead' && validatedData.notificationId) {
      // 标记单个通知为已读
      const notification = await prisma.notification.updateMany({
        where: {
          id: validatedData.notificationId,
          userId: userId
        },
        data: {
          read: true
        }
      })

      return NextResponse.json({
        success: true,
        message: '通知已标记为已读'
      })

    } else if (validatedData.action === 'markAllAsRead') {
      // 标记所有通知为已读
      await prisma.notification.updateMany({
        where: {
          userId: userId,
          read: false
        },
        data: {
          read: true
        }
      })

      return NextResponse.json({
        success: true,
        message: '所有通知已标记为已读'
      })
    }

    return NextResponse.json(
      { error: '无效的操作' },
      { status: 400 }
    )

  } catch (error) {
    console.error('更新通知错误:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '请求数据验证失败', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '更新通知失败' },
      { status: 500 }
    )
  }
}

// 删除通知
export async function DELETE(request: NextRequest) {
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
    const notificationId = searchParams.get('id')
    const userId = decoded.userId

    if (!notificationId) {
      return NextResponse.json(
        { error: '缺少通知ID' },
        { status: 400 }
      )
    }

    // 删除通知
    await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId: userId
      }
    })

    return NextResponse.json({
      success: true,
      message: '通知删除成功'
    })

  } catch (error) {
    console.error('删除通知错误:', error)
    return NextResponse.json(
      { error: '删除通知失败' },
      { status: 500 }
    )
  }
}

// 辅助函数：根据通知类型获取操作URL
function getActionUrl(type: string, data: any): string | undefined {
  switch (type) {
    case 'team_invite':
      return data?.teamId ? `/teams/${data.teamId}` : undefined
    case 'hackathon_reminder':
      return data?.hackathonId ? `/hackathons/${data.hackathonId}` : undefined
    case 'project_update':
      return data?.projectId ? `/projects/${data.projectId}` : undefined
    case 'review_complete':
      return data?.hackathonId ? `/hackathons/${data.hackathonId}/results` : undefined
    case 'prize_awarded':
      return data?.hackathonId ? `/hackathons/${data.hackathonId}/results` : undefined
    case 'system_message':
      return data?.actionUrl || undefined
    default:
      return undefined
  }
}

// 辅助函数：根据通知类型获取操作标签
function getActionLabel(type: string): string | undefined {
  switch (type) {
    case 'team_invite':
      return '查看邀请'
    case 'hackathon_reminder':
      return '查看详情'
    case 'project_update':
      return '查看评论'
    case 'review_complete':
      return '查看结果'
    case 'prize_awarded':
      return '查看证书'
    case 'system_message':
      return '了解更多'
    default:
      return undefined
  }
}

// 辅助函数：根据通知类型获取优先级
function getPriority(type: string): 'low' | 'medium' | 'high' {
  switch (type) {
    case 'team_invite':
    case 'review_complete':
    case 'prize_awarded':
      return 'high'
    case 'hackathon_reminder':
    case 'system_message':
      return 'medium'
    case 'project_update':
    default:
      return 'low'
  }
}

// 辅助函数：根据通知类型获取分类
function getCategory(type: string): 'team' | 'project' | 'hackathon' | 'system' {
  switch (type) {
    case 'team_invite':
      return 'team'
    case 'project_update':
      return 'project'
    case 'hackathon_reminder':
    case 'review_complete':
    case 'prize_awarded':
      return 'hackathon'
    case 'system_message':
    default:
      return 'system'
  }
} 