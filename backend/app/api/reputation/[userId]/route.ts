import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)

    const { userId } = params
    const currentUser = await auth(request)

    // 验证目标用户是否存在
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        bio: true,
        skills: true,
        reputationScore: true,
        status: true,
        createdAt: true,
        privacySettings: true
      }
    })

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: t('reputation.userNotFound') || '用户不存在' },
        { status: 404 }
      )
    }

    if (targetUser.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: t('reputation.userInactive') || '用户已停用' },
        { status: 403 }
      )
    }

    // 检查隐私设置
    const privacySettings = targetUser.privacySettings as any || {}
    const isOwnProfile = currentUser?.id === userId
    const showDetailedInfo = isOwnProfile || privacySettings.showReputationDetails !== false

    // 获取URL参数
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const category = searchParams.get('category')
    const season = searchParams.get('season')

    // 构建查询条件
    const whereCondition: any = {
      userId: userId,
      isValid: true
    }

    if (category) {
      whereCondition.category = category
    }

    if (season) {
      whereCondition.season = season
    }

    // 获取基础用户信息
    const userInfo = {
      id: targetUser.id,
      username: targetUser.username,
      avatarUrl: targetUser.avatarUrl,
      bio: targetUser.bio,
      skills: targetUser.skills,
      totalReputationScore: targetUser.reputationScore,
      joinedAt: targetUser.createdAt,
      isOwnProfile
    }

    if (!showDetailedInfo) {
      // 只返回基础信息
      return NextResponse.json({
        success: true,
        data: {
          user: userInfo,
          stats: {
            totalPoints: targetUser.reputationScore,
            level: Math.floor((targetUser.reputationScore || 0) / 100) + 1,
            showDetailedInfo: false
          }
        }
      })
    }

    // 获取详细声誉信息
    const [reputationRecords, stats] = await Promise.all([
      // 声誉记录
      prisma.reputationRecord.findMany({
        where: whereCondition,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          user: {
            select: {
              username: true,
              avatarUrl: true
            }
          }
        }
      }),

      // 统计信息
      Promise.all([
        // 总积分
        prisma.reputationRecord.aggregate({
          where: {
            userId: userId,
            isValid: true
          },
          _sum: {
            points: true
          }
        }),

        // 按分类统计
        prisma.reputationRecord.groupBy({
          by: ['category'],
          where: {
            userId: userId,
            isValid: true
          },
          _sum: {
            points: true
          },
          _count: true
        }),

        // 按行为统计
        prisma.reputationRecord.groupBy({
          by: ['action'],
          where: {
            userId: userId,
            isValid: true
          },
          _sum: {
            points: true
          },
          _count: true
        }),

        // 最近活动（30天内的声誉记录）
        prisma.reputationRecord.findMany({
          where: {
            userId: userId,
            isValid: true,
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          },
          select: {
            points: true,
            action: true,
            createdAt: true,
            category: true,
            description: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }),

        // 用户在排行榜中的排名
        prisma.user.count({
          where: {
            status: 'ACTIVE',
            reputationScore: {
              gt: targetUser.reputationScore || 0
            }
          }
        })
      ])
    ])

    const [totalStats, categoryStats, actionStats, recentActivity, higherRankCount] = stats

    // 计算等级和进度
    const totalPoints = totalStats._sum.points || 0
    const level = Math.floor(totalPoints / 100) + 1
    const nextLevelPoints = level * 100
    const pointsToNextLevel = nextLevelPoints - totalPoints
    const currentRank = higherRankCount + 1

    // 计算趋势（最近7天vs前7天）
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const last14Days = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)

    const [recentPoints, previousPoints] = await Promise.all([
      prisma.reputationRecord.aggregate({
        where: {
          userId: userId,
          isValid: true,
          createdAt: { gte: last7Days }
        },
        _sum: { points: true }
      }),
      prisma.reputationRecord.aggregate({
        where: {
          userId: userId,
          isValid: true,
          createdAt: { gte: last14Days, lt: last7Days }
        },
        _sum: { points: true }
      })
    ])

    const recentPointsSum = recentPoints._sum.points || 0
    const previousPointsSum = previousPoints._sum.points || 0
    const trendPercentage = previousPointsSum > 0 
      ? ((recentPointsSum - previousPointsSum) / previousPointsSum) * 100 
      : recentPointsSum > 0 ? 100 : 0

    const reputationStats = {
      totalPoints,
      level,
      pointsToNextLevel,
      nextLevelPoints,
      progressPercentage: ((totalPoints % 100) / 100) * 100,
      currentRank,
      showDetailedInfo: true,
      
      trend: {
        recentPoints: recentPointsSum,
        previousPoints: previousPointsSum,
        percentage: Math.round(trendPercentage * 100) / 100,
        direction: recentPointsSum > previousPointsSum ? 'up' : 
                  recentPointsSum < previousPointsSum ? 'down' : 'stable'
      },
      
      byCategory: categoryStats.map(stat => ({
        category: stat.category,
        points: stat._sum.points || 0,
        count: stat._count,
        percentage: Math.round(((stat._sum.points || 0) / totalPoints) * 100)
      })),
      
      byAction: actionStats.map(stat => ({
        action: stat.action,
        points: stat._sum.points || 0,
        count: stat._count
      })),

      recentActivity: recentActivity.map(activity => ({
        action: activity.action,
        points: activity.points,
        category: activity.category,
        description: activity.description,
        createdAt: activity.createdAt
      }))
    }

    return NextResponse.json({
      success: true,
      data: {
        user: userInfo,
        records: reputationRecords,
        stats: reputationStats,
        pagination: {
          total: await prisma.reputationRecord.count({
            where: whereCondition
          }),
          limit,
          offset,
          hasMore: reputationRecords.length === limit
        }
      }
    })

  } catch (error) {
    console.error('获取用户声誉信息错误:', error)
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    return NextResponse.json(
      { 
        success: false, 
        error: t('reputation.fetchError') || '获取用户声誉信息失败' 
      },
      { status: 500 }
    )
  }
}
