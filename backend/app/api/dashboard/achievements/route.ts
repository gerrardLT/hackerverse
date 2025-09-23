import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'

export async function GET(request: NextRequest) {
  try {
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

    // 获取URL参数
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') // 成就分类过滤
    const rarity = searchParams.get('rarity') // 稀有度过滤
    const completed = searchParams.get('completed') // 是否完成过滤

    // 构建查询条件
    const whereCondition: any = {
      userId: user.id,
      isVisible: true
    }

    if (category) {
      whereCondition.category = category
    }

    if (rarity) {
      whereCondition.rarity = rarity
    }

    if (completed !== null) {
      whereCondition.isCompleted = completed === 'true'
    }

    // 检查 UserAchievement 模型是否可用
    if (!(prisma as any).userAchievement) {
      console.log('UserAchievement 模型不可用，返回空数据')
      return NextResponse.json({
        success: true,
        data: {
          achievements: [],
          stats: {
            total: 0,
            completed: 0,
            inProgress: 0,
            byCategory: {},
            byRarity: {},
          }
        }
      })
    }

    // 获取用户成就  
    const achievements = await (prisma as any).userAchievement.findMany({
      where: whereCondition,
      orderBy: [
        { isCompleted: 'desc' }, // 已完成的排在前面
        { completedAt: 'desc' }, // 最新完成的排在前面
        { level: 'desc' }, // 高等级排在前面
        { createdAt: 'desc' }
      ]
    })

    // 获取成就统计
    const stats = await (prisma as any).userAchievement.groupBy({
      by: ['category', 'isCompleted'],
      where: {
        userId: user.id,
        isVisible: true
      },
      _count: true
    })

    // 计算统计数据
    const achievementStats = {
      total: achievements.length,
      completed: achievements.filter((a: any) => a.isCompleted).length,
      inProgress: achievements.filter((a: any) => !a.isCompleted && a.progress > 0).length,
      byCategory: {} as Record<string, { total: number; completed: number }>,
      byRarity: {} as Record<string, { total: number; completed: number }>
    }

    // 按分类统计
    stats.forEach((stat: any) => {
      if (!achievementStats.byCategory[stat.category]) {
        achievementStats.byCategory[stat.category] = { total: 0, completed: 0 }
      }
      achievementStats.byCategory[stat.category].total += stat._count
      if (stat.isCompleted) {
        achievementStats.byCategory[stat.category].completed += stat._count
      }
    })

    // 按稀有度统计
    achievements.forEach((achievement: any) => {
      if (!achievementStats.byRarity[achievement.rarity]) {
        achievementStats.byRarity[achievement.rarity] = { total: 0, completed: 0 }
      }
      achievementStats.byRarity[achievement.rarity].total += 1
      if (achievement.isCompleted) {
        achievementStats.byRarity[achievement.rarity].completed += 1
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        achievements,
        stats: achievementStats
      }
    })

  } catch (error) {
    console.error('获取用户成就错误:', error)
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    return NextResponse.json(
      { success: false, error: t('dashboard.getAchievementsError') },
      { status: 500 }
    )
  }
}

// 创建或更新成就 (内部API，不对外暴露)
export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json()
    const { type, progress } = body

    if (!type) {
      return NextResponse.json(
        { success: false, error: t('dashboard.invalidAchievementData') },
        { status: 400 }
      )
    }

    // 查找现有成就
    const existingAchievement = await (prisma as any).userAchievement.findFirst({
      where: {
        userId: user.id,
        type
      }
    })

    if (existingAchievement) {
      // 更新现有成就进度
      const newProgress = Math.max(existingAchievement.progress, progress || 0)
      const isCompleted = newProgress >= existingAchievement.target

      const updatedAchievement = await (prisma as any).userAchievement.update({
        where: { id: existingAchievement.id },
        data: {
          progress: newProgress,
          isCompleted,
          completedAt: isCompleted && !existingAchievement.isCompleted ? new Date() : existingAchievement.completedAt
        }
      })

      return NextResponse.json({
        success: true,
        data: { achievement: updatedAchievement }
      })
    } else {
      return NextResponse.json(
        { success: false, error: t('dashboard.userNotFound') },
        { status: 404 }
      )
    }

  } catch (error) {
    console.error('更新用户成就错误:', error)
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    return NextResponse.json(
      { success: false, error: t('dashboard.updateAchievementError') },
      { status: 500 }
    )
  }
}
