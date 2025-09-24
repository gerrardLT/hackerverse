import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

// 强制使用Node.js运行时，避免Edge Runtime的crypto模块限制
export const runtime = 'nodejs'

// 获取通知列表
export async function GET(request: NextRequest) {
  try {
    // 从中间件验证过的请求中提取用户信息
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.substring(7)
    const decoded = AuthService.verifyToken(token!)
    
    if (!decoded) {
      return NextResponse.json(
        { error: '用户认证失败' },
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

    // 获取通知列表 (排除过期通知)
    const notifications = await prisma.notification.findMany({
      where: {
        ...where,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      orderBy: [
        { priority: 'desc' }, // 优先级高的在前
        { createdAt: 'desc' }  // 时间新的在前
      ],
      skip,
      take: limit,
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        data: true,
        read: true,
        priority: true,
        category: true,
        actionUrl: true,
        actionLabel: true,
        createdAt: true,
        readAt: true,
        userId: true
      }
    })

    // 获取总数
    const total = await prisma.notification.count({ where })

    // 获取未读数量 (排除过期通知)
    const unreadCount = await prisma.notification.count({
      where: {
        userId: userId,
        read: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
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
    // 从中间件验证过的请求中提取用户信息
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.substring(7)
    const decoded = AuthService.verifyToken(token!)
    
    if (!decoded) {
      return NextResponse.json(
        { error: '用户认证失败' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // 验证请求数据
    const notificationSchema = z.object({
      type: z.enum([
        'TEAM_INVITE', 'TEAM_APPLICATION_APPROVED', 'TEAM_APPLICATION_REJECTED', 'TEAM_MEMBER_JOINED', 'TEAM_STATUS_CHANGED',
        'HACKATHON_STARTING', 'HACKATHON_STARTED', 'HACKATHON_ENDING', 'HACKATHON_ENDED', 'HACKATHON_REGISTRATION_REMINDER', 'HACKATHON_SUBMISSION_REMINDER', 'HACKATHON_RESULTS_ANNOUNCED',
        'PROJECT_LIKED', 'PROJECT_COMMENTED', 'PROJECT_REVIEWED', 'PROJECT_STATUS_CHANGED', 'PRIZE_AWARDED',
        'COMMUNITY_POST_REPLIED', 'COMMUNITY_POST_LIKED', 'COMMUNITY_REPLY_LIKED', 'COMMUNITY_NEW_FOLLOWER', 'COMMUNITY_FOLLOWER_POST',
        'SYSTEM_ANNOUNCEMENT', 'SYSTEM_MAINTENANCE', 'SECURITY_ALERT', 'FEATURE_UPDATE', 'WELCOME_MESSAGE'
      ]),
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
    // 从中间件验证过的请求中提取用户信息
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.substring(7)
    const decoded = AuthService.verifyToken(token!)
    
    if (!decoded) {
      return NextResponse.json(
        { error: '用户认证失败' },
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
          read: true,
          readAt: new Date()
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
          read: true,
          readAt: new Date()
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
    // 从中间件验证过的请求中提取用户信息
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.substring(7)
    const decoded = AuthService.verifyToken(token!)
    
    if (!decoded) {
      return NextResponse.json(
        { error: '用户认证失败' },
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
    case 'TEAM_INVITE':
      return data?.teamId ? `/teams/${data.teamId}` : undefined
    case 'HACKATHON_REMINDER':
      return data?.hackathonId ? `/hackathons/${data.hackathonId}` : undefined
    case 'PROJECT_UPDATE':
      return data?.projectId ? `/projects/${data.projectId}` : undefined
    case 'REVIEW_COMPLETE':
      return data?.hackathonId ? `/hackathons/${data.hackathonId}/results` : undefined
    case 'PRIZE_AWARDED':
      return data?.hackathonId ? `/hackathons/${data.hackathonId}/results` : undefined
    case 'SYSTEM_MESSAGE':
      return data?.actionUrl || undefined
    default:
      return undefined
  }
}

// 辅助函数：根据通知类型获取操作标签
function getActionLabel(type: string): string | undefined {
  switch (type) {
    case 'TEAM_INVITE':
      return '查看邀请'
    case 'HACKATHON_REMINDER':
      return '查看详情'
    case 'PROJECT_UPDATE':
      return '查看评论'
    case 'REVIEW_COMPLETE':
      return '查看结果'
    case 'PRIZE_AWARDED':
      return '查看证书'
    case 'SYSTEM_MESSAGE':
      return '了解更多'
    default:
      return undefined
  }
}

// 辅助函数：根据通知类型获取优先级
function getPriority(type: string): 'low' | 'medium' | 'high' {
  switch (type) {
    case 'TEAM_INVITE':
    case 'REVIEW_COMPLETE':
    case 'PRIZE_AWARDED':
      return 'high'
    case 'HACKATHON_REMINDER':
    case 'SYSTEM_MESSAGE':
      return 'medium'
    case 'PROJECT_UPDATE':
    default:
      return 'low'
  }
}

// 辅助函数：根据通知类型获取分类
function getCategory(type: string): 'team' | 'project' | 'hackathon' | 'system' {
  switch (type) {
    case 'TEAM_INVITE':
      return 'team'
    case 'PROJECT_UPDATE':
      return 'project'
    case 'HACKATHON_REMINDER':
    case 'REVIEW_COMPLETE':
    case 'PRIZE_AWARDED':
      return 'hackathon'
    case 'SYSTEM_MESSAGE':
    default:
      return 'system'
  }
} 