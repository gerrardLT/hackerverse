import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const user = await auth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: '未认证' },
        { status: 401 }
      )
    }

    // 获取URL参数
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const category = searchParams.get('category') // 分类过滤
    const season = searchParams.get('season') // 季度过滤

    // 构建查询条件
    const whereCondition: any = {
      userId: user.id,
      isValid: true
    }

    if (category) {
      whereCondition.category = category
    }

    if (season) {
      whereCondition.season = season
    }

    // 获取声誉记录
    const reputationRecords = await prisma.reputationRecord.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    // 获取声誉统计
    const stats = await Promise.all([
      // 总积分
      prisma.reputationRecord.aggregate({
        where: {
          userId: user.id,
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
          userId: user.id,
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
          userId: user.id,
          isValid: true
        },
        _sum: {
          points: true
        },
        _count: true
      }),

      // 最近30天积分趋势
      prisma.reputationRecord.findMany({
        where: {
          userId: user.id,
          isValid: true,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30天前
          }
        },
        select: {
          points: true,
          createdAt: true,
          category: true
        },
        orderBy: { createdAt: 'asc' }
      })
    ])

    const [totalStats, categoryStats, actionStats, recentRecords] = stats

    // 计算30天积分趋势（按天聚合）
    const dailyPoints: Record<string, number> = {}
    recentRecords.forEach(record => {
      const date = record.createdAt.toISOString().split('T')[0]
      dailyPoints[date] = (dailyPoints[date] || 0) + record.points
    })

    // 生成最近30天的完整日期数组
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000)
      return date.toISOString().split('T')[0]
    })

    const pointsTrend = last30Days.map(date => ({
      date,
      points: dailyPoints[date] || 0
    }))

    // 计算累计积分趋势
    let cumulativePoints = 0
    const cumulativeTrend = pointsTrend.map(day => {
      cumulativePoints += day.points
      return {
        date: day.date,
        points: day.points,
        cumulative: cumulativePoints
      }
    })

    // 声誉等级计算
    const totalPoints = totalStats._sum.points || 0
    const level = Math.floor(totalPoints / 100) + 1
    const nextLevelPoints = level * 100
    const pointsToNextLevel = nextLevelPoints - totalPoints

    const reputationStats = {
      totalPoints,
      level,
      pointsToNextLevel,
      nextLevelPoints,
      progressPercentage: ((totalPoints % 100) / 100) * 100,
      
      byCategory: categoryStats.map(stat => ({
        category: stat.category,
        points: stat._sum.points || 0,
        count: stat._count
      })),
      
      byAction: actionStats.map(stat => ({
        action: stat.action,
        points: stat._sum.points || 0,
        count: stat._count
      })),
      
      trend: {
        daily: pointsTrend,
        cumulative: cumulativeTrend
      }
    }

    return NextResponse.json({
      success: true,
      data: {
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
    console.error('获取声誉记录错误:', error)
    return NextResponse.json(
      { success: false, error: '获取声誉记录失败' },
      { status: 500 }
    )
  }
}
