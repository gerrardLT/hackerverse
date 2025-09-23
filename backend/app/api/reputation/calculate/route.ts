import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'

export async function POST(request: NextRequest) {
  try {
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)

    // 验证用户身份（需要管理员权限）
    const user = await auth(request)
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
      return NextResponse.json(
        { success: false, error: t('reputation.unauthorizedCalculate') || '无权限执行声誉计算' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, recalculateAll = false } = body

    let result

    if (recalculateAll) {
      // 重新计算所有用户的声誉积分
      result = await recalculateAllUsersReputation()
    } else if (userId) {
      // 重新计算指定用户的声誉积分
      result = await recalculateUserReputation(userId)
    } else {
      return NextResponse.json(
        { success: false, error: t('reputation.invalidCalculateParams') || '参数无效' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: recalculateAll 
        ? t('reputation.calculateAllSuccess') || '所有用户声誉积分重新计算完成'
        : t('reputation.calculateUserSuccess') || '用户声誉积分重新计算完成'
    })

  } catch (error) {
    console.error('声誉积分计算错误:', error)
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    return NextResponse.json(
      { 
        success: false, 
        error: t('reputation.calculateError') || '声誉积分计算失败' 
      },
      { status: 500 }
    )
  }
}

// 重新计算单个用户的声誉积分
async function recalculateUserReputation(userId: string) {
  // 验证用户是否存在
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true }
  })

  if (!user) {
    throw new Error('用户不存在')
  }

  // 获取用户所有有效的声誉记录
  const reputationRecords = await prisma.reputationRecord.findMany({
    where: {
      userId: userId,
      isValid: true
    },
    select: {
      points: true,
      multiplier: true,
      action: true,
      category: true
    }
  })

  // 计算总积分（考虑倍数）
  const totalPoints = reputationRecords.reduce((sum, record) => {
    const pointsWithMultiplier = Math.round(record.points * (record.multiplier?.toNumber() || 1))
    return sum + pointsWithMultiplier
  }, 0)

  // 更新用户的reputationScore
  await prisma.user.update({
    where: { id: userId },
    data: { reputationScore: totalPoints }
  })

  // 计算统计信息
  const stats = {
    userId,
    username: user.username,
    oldScore: user.reputationScore || 0,
    newScore: totalPoints,
    totalRecords: reputationRecords.length,
    categoryBreakdown: reputationRecords.reduce((acc, record) => {
      const category = record.category || 'general'
      const points = Math.round(record.points * (record.multiplier?.toNumber() || 1))
      acc[category] = (acc[category] || 0) + points
      return acc
    }, {} as Record<string, number>)
  }

  return stats
}

// 重新计算所有用户的声誉积分
async function recalculateAllUsersReputation() {
  // 获取所有活跃用户
  const users = await prisma.user.findMany({
    where: { 
      status: 'ACTIVE'
    },
    select: { 
      id: true, 
      username: true, 
      reputationScore: true 
    }
  })

  const results = []
  let processed = 0
  let errors = 0

  // 批量处理，每次处理50个用户
  const batchSize = 50
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize)
    
    // 并发处理当前批次
    const batchPromises = batch.map(async (user) => {
      try {
        const result = await recalculateUserReputation(user.id)
        processed++
        return result
      } catch (error) {
        console.error(`计算用户 ${user.id} 声誉积分失败:`, error)
        errors++
        return {
          userId: user.id,
          username: user.username,
          error: error instanceof Error ? error.message : '未知错误'
        }
      }
    })

    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)

    // 避免数据库过载，批次间稍作延迟
    if (i + batchSize < users.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  // 计算总体统计
  const summary = {
    totalUsers: users.length,
    processed,
    errors,
    successRate: Math.round((processed / users.length) * 100),
    
    // 积分分布统计
    scoreDistribution: {
      '0-99': 0,
      '100-499': 0,
      '500-999': 0,
      '1000-2499': 0,
      '2500+': 0
    },
    
    topUsers: results
      .filter(r => !r.error && r.newScore > 0)
      .sort((a, b) => (b.newScore || 0) - (a.newScore || 0))
      .slice(0, 10)
      .map(r => ({
        userId: r.userId,
        username: r.username,
        score: r.newScore
      }))
  }

  // 计算积分分布
  results.forEach(result => {
    if (!result.error && result.newScore !== undefined) {
      const score = result.newScore
      if (score < 100) summary.scoreDistribution['0-99']++
      else if (score < 500) summary.scoreDistribution['100-499']++
      else if (score < 1000) summary.scoreDistribution['500-999']++
      else if (score < 2500) summary.scoreDistribution['1000-2499']++
      else summary.scoreDistribution['2500+']++
    }
  })

  return {
    summary,
    details: results
  }
}

// 应用声誉规则（根据配置的规则计算积分）
async function applyReputationRules(action: string, basePoints: number, context: any = {}) {
  try {
    // 获取该行为的规则配置
    const rule = await prisma.reputationRule.findFirst({
      where: {
        action: action,
        isActive: true,
        validFrom: { lte: new Date() },
        OR: [
          { validUntil: null },
          { validUntil: { gt: new Date() } }
        ]
      }
    })

    if (!rule) {
      // 如果没有规则，使用默认基础积分
      return {
        points: basePoints,
        multiplier: 1.0,
        appliedRules: []
      }
    }

    let finalPoints = rule.basePoints
    let multiplier = 1.0
    const appliedRules = [rule.action]

    // 应用倍数规则
    const multiplierRules = rule.multiplierRules as any || {}
    
    // 季节性奖励倍数
    if (rule.seasonalBonus && rule.seasonalBonus.toNumber() !== 1.0) {
      multiplier *= rule.seasonalBonus.toNumber()
      appliedRules.push('seasonal_bonus')
    }

    // 质押倍数（如果用户有质押）
    if (context.stakingTier && multiplierRules.stakingBonus) {
      const stakingMultiplier = multiplierRules.stakingBonus[context.stakingTier] || 1.0
      multiplier *= stakingMultiplier
      appliedRules.push('staking_bonus')
    }

    // 连续参与奖励
    if (context.consecutiveDays && multiplierRules.consecutiveBonus) {
      const consecutiveMultiplier = Math.min(
        1 + (context.consecutiveDays * multiplierRules.consecutiveBonus.increment),
        multiplierRules.consecutiveBonus.maxMultiplier || 2.0
      )
      multiplier *= consecutiveMultiplier
      appliedRules.push('consecutive_bonus')
    }

    return {
      points: finalPoints,
      multiplier,
      appliedRules,
      ruleDetails: {
        ruleName: rule.actionName,
        category: rule.category,
        difficulty: rule.difficulty
      }
    }

  } catch (error) {
    console.error('应用声誉规则错误:', error)
    // 如果规则应用失败，返回默认值
    return {
      points: basePoints,
      multiplier: 1.0,
      appliedRules: [],
      error: error instanceof Error ? error.message : '规则应用失败'
    }
  }
}
