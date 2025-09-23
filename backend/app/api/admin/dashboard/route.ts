import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'

export async function GET(request: NextRequest) {
  try {
    // 获取国际化函数
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)

    // 验证用户身份
    const user = await auth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: t('auth.unauthorized') },
        { status: 401 }
      )
    }

    // 检查用户是否是管理员
    if (user.role !== 'ADMIN' && user.role !== 'MODERATOR') {
      return NextResponse.json(
        { success: false, error: t('auth.forbidden') },
        { status: 403 }
      )
    }

    // 获取管理员仪表板数据
    const [
      // 用户统计
      totalUsers,
      activeUsers,
      newUsersToday,
      bannedUsers,
      
      // 内容统计
      totalHackathons,
      totalProjects,
      totalPosts,
      pendingReviews,
      
      // 活动统计  
      recentRegistrations,
      recentActivity,
      
      // 审核统计
      contentReviewStats,
      
      // 系统统计
      adminActionCount,
      auditLogCount
    ] = await Promise.all([
      // 总用户数
      prisma.user.count(),
      
      // 活跃用户数（最近7天有登录）
      prisma.user.count({
        where: {
          lastLoginAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // 今日新用户
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      
      // 被封禁用户
      prisma.user.count({
        where: {
          status: 'BANNED'
        }
      }),
      
      // 黑客松总数
      prisma.hackathon.count(),
      
      // 项目总数
      prisma.project.count(),
      
      // 帖子总数
      prisma.communityPost.count(),
      
      // 待审核内容数
      (prisma as any).contentReview ? (prisma as any).contentReview.count({
        where: {
          status: 'pending'
        }
      }) : Promise.resolve(0),
      
      // 最近7天注册用户
      prisma.user.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      }),
      
      // 最近管理员操作
      (prisma as any).adminAction ? (prisma as any).adminAction.findMany({
        take: 10,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          admin: {
            select: {
              username: true,
              email: true
            }
          }
        }
      }) : Promise.resolve([]),
      
      // 内容审核统计
      (prisma as any).contentReview ? (prisma as any).contentReview.groupBy({
        by: ['status'],
        _count: true
      }) : Promise.resolve([]),
      
      // 管理员操作数（最近30天）
      (prisma as any).adminAction ? (prisma as any).adminAction.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }) : Promise.resolve(0),
      
      // 审计日志数（最近30天）
      (prisma as any).auditLog ? (prisma as any).auditLog.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }) : Promise.resolve(0)
    ])

    // 构建响应数据
    const dashboardData = {
      userStats: {
        total: totalUsers,
        active: activeUsers,
        newToday: newUsersToday,
        banned: bannedUsers
      },
      contentStats: {
        hackathons: totalHackathons,
        projects: totalProjects,
        posts: totalPosts,
        pendingReviews: pendingReviews
      },
      recentActivity: {
        registrations: recentRegistrations,
        adminActions: recentActivity
      },
      moderationStats: {
        contentReviews: contentReviewStats,
        adminActions: adminActionCount,
        auditLogs: auditLogCount
      }
    }

    return NextResponse.json({
      success: true,
      data: dashboardData
    })

  } catch (error) {
    console.error('获取管理员仪表板数据失败:', error)
    
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    return NextResponse.json(
      { success: false, error: t('admin.dashboard.loadError') },
      { status: 500 }
    )
  }
}
