import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'

export async function GET(request: NextRequest) {
  try {
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)

    // 获取URL参数
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100) // 最大100条
    const offset = parseInt(searchParams.get('offset') || '0')
    const timeRange = searchParams.get('timeRange') || 'all' // all, week, month, season
    const category = searchParams.get('category') // 分类过滤

    // 构建时间范围条件
    let timeCondition: any = {}
    const now = new Date()
    
    switch (timeRange) {
      case 'week':
        timeCondition.gte = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        timeCondition.gte = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'season':
        // 当前季度的开始时间（假设每3个月为一个季度）
        const currentQuarter = Math.floor(now.getMonth() / 3)
        const seasonStart = new Date(now.getFullYear(), currentQuarter * 3, 1)
        timeCondition.gte = seasonStart
        break
    }

    // 构建声誉记录查询条件
    const reputationWhere: any = {
      isValid: true
    }

    if (Object.keys(timeCondition).length > 0) {
      reputationWhere.createdAt = timeCondition
    }

    if (category) {
      reputationWhere.category = category
    }

    // 获取排行榜数据
    let leaderboardData

    if (timeRange === 'all') {
      // 使用User表的reputationScore字段（更高效）
      leaderboardData = await prisma.user.findMany({
        where: {
          status: 'ACTIVE',
          reputationScore: {
            gt: 0
          }
        },
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          reputationScore: true,
          bio: true,
          skills: true,
          createdAt: true
        },
        orderBy: {
          reputationScore: 'desc'
        },
        take: limit,
        skip: offset
      })

      // 转换格式
      leaderboardData = leaderboardData.map((user, index) => ({
        userId: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        skills: user.skills,
        totalPoints: user.reputationScore,
        rank: offset + index + 1,
        joinedAt: user.createdAt
      }))
    } else {
      // 按时间范围聚合计算（需要查询ReputationRecord）
      const userPointsAgg = await prisma.reputationRecord.groupBy({
        by: ['userId'],
        where: reputationWhere,
        _sum: {
          points: true
        },
        orderBy: {
          _sum: {
            points: 'desc'
          }
        },
        take: limit,
        skip: offset
      })

      // 获取用户信息
      const userIds = userPointsAgg.map(agg => agg.userId)
      const users = await prisma.user.findMany({
        where: {
          id: { in: userIds },
          status: 'ACTIVE'
        },
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          bio: true,
          skills: true,
          createdAt: true
        }
      })

      // 合并数据
      const userMap = new Map(users.map(user => [user.id, user]))
      leaderboardData = userPointsAgg.map((agg, index) => {
        const user = userMap.get(agg.userId)
        return {
          userId: agg.userId,
          username: user?.username || 'Unknown',
          avatarUrl: user?.avatarUrl,
          bio: user?.bio,
          skills: user?.skills,
          totalPoints: agg._sum.points || 0,
          rank: offset + index + 1,
          joinedAt: user?.createdAt
        }
      }).filter(item => item.username !== 'Unknown') // 过滤掉找不到的用户
    }

    // 获取额外统计信息
    const stats = await Promise.all([
      // 总用户数（有声誉积分的）
      prisma.user.count({
        where: {
          status: 'ACTIVE',
          reputationScore: { gt: 0 }
        }
      }),

      // 平均积分
      prisma.user.aggregate({
        where: {
          status: 'ACTIVE',
          reputationScore: { gt: 0 }
        },
        _avg: {
          reputationScore: true
        }
      }),

      // 分类统计（如果没有时间限制）
      timeRange === 'all' ? prisma.reputationRecord.groupBy({
        by: ['category'],
        where: {
          isValid: true
        },
        _sum: {
          points: true
        },
        _count: true
      }) : Promise.resolve([])
    ])

    const [totalUsers, avgScore, categoryStats] = stats

    const responseData = {
      leaderboard: leaderboardData,
      meta: {
        timeRange,
        category,
        totalUsers,
        averageScore: Math.round(avgScore._avg.reputationScore || 0),
        categoryStats: timeRange === 'all' ? categoryStats.map(stat => ({
          category: stat.category,
          totalPoints: stat._sum.points || 0,
          userCount: stat._count
        })) : []
      },
      pagination: {
        limit,
        offset,
        hasMore: leaderboardData.length === limit
      }
    }

    return NextResponse.json({
      success: true,
      data: responseData
    })

  } catch (error) {
    console.error('获取声誉排行榜错误:', error)
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    return NextResponse.json(
      { 
        success: false, 
        error: t('reputation.leaderboard.error') || '获取排行榜失败' 
      },
      { status: 500 }
    )
  }
}
