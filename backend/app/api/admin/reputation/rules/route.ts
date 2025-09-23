import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'

// 获取声誉规则列表
export async function GET(request: NextRequest) {
  try {
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)

    // 验证管理员权限
    const user = await auth(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: t('admin.unauthorized') || '无权限访问' },
        { status: 403 }
      )
    }

    // 获取URL参数
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const category = searchParams.get('category')
    const isActive = searchParams.get('isActive')
    const difficulty = searchParams.get('difficulty')

    // 构建查询条件
    const whereCondition: any = {}

    if (category) {
      whereCondition.category = category
    }

    if (isActive !== null) {
      whereCondition.isActive = isActive === 'true'
    }

    if (difficulty) {
      whereCondition.difficulty = difficulty
    }

    // 获取规则列表
    const [rules, totalCount] = await Promise.all([
      prisma.reputationRule.findMany({
        where: whereCondition,
        include: {
          creator: {
            select: {
              id: true,
              username: true
            }
          },
          updater: {
            select: {
              id: true,
              username: true
            }
          }
        },
        orderBy: [
          { category: 'asc' },
          { action: 'asc' }
        ],
        take: limit,
        skip: offset
      }),
      
      prisma.reputationRule.count({
        where: whereCondition
      })
    ])

    // 获取使用统计
    const ruleUsageStats = await Promise.all(
      rules.map(async (rule) => {
        const usage = await prisma.reputationRecord.groupBy({
          by: ['action'],
          where: {
            action: rule.action,
            isValid: true,
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 最近30天
            }
          },
          _count: true,
          _sum: {
            points: true
          }
        })

        return {
          ruleId: rule.id,
          action: rule.action,
          recentUsage: usage[0] ? {
            count: usage[0]._count,
            totalPoints: usage[0]._sum.points || 0
          } : { count: 0, totalPoints: 0 }
        }
      })
    )

    const usageMap = new Map(ruleUsageStats.map(stat => [stat.ruleId, stat.recentUsage]))

    // 组合数据
    const rulesWithStats = rules.map(rule => ({
      ...rule,
      usage: usageMap.get(rule.id) || { count: 0, totalPoints: 0 }
    }))

    // 获取分类统计
    const categoryStats = await prisma.reputationRule.groupBy({
      by: ['category'],
      _count: true,
      where: whereCondition
    })

    return NextResponse.json({
      success: true,
      data: {
        rules: rulesWithStats,
        stats: {
          total: totalCount,
          byCategory: categoryStats.map(stat => ({
            category: stat.category,
            count: stat._count
          })),
          activeRules: rules.filter(r => r.isActive).length,
          inactiveRules: rules.filter(r => !r.isActive).length
        },
        pagination: {
          limit,
          offset,
          total: totalCount,
          hasMore: rules.length === limit
        }
      }
    })

  } catch (error) {
    console.error('获取声誉规则错误:', error)
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    return NextResponse.json(
      { 
        success: false, 
        error: t('admin.reputation.rules.fetchError') || '获取声誉规则失败' 
      },
      { status: 500 }
    )
  }
}

// 创建新的声誉规则
export async function POST(request: NextRequest) {
  try {
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)

    // 验证管理员权限
    const user = await auth(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: t('admin.unauthorized') || '无权限访问' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      action,
      actionName,
      description,
      basePoints,
      maxPointsPerDay,
      maxPointsPerSeason,
      category = 'general',
      difficulty = 'normal',
      multiplierRules = {},
      cooldownHours = 0,
      prerequisites = [],
      seasonalBonus = 1.0,
      communityVote = false,
      isActive = true,
      validFrom,
      validUntil
    } = body

    // 验证必填字段
    if (!action || !actionName || basePoints === undefined) {
      return NextResponse.json(
        { success: false, error: t('admin.reputation.rules.missingFields') || '缺少必填字段' },
        { status: 400 }
      )
    }

    // 验证action唯一性
    const existingRule = await prisma.reputationRule.findUnique({
      where: { action }
    })

    if (existingRule) {
      return NextResponse.json(
        { success: false, error: t('admin.reputation.rules.actionExists') || '该行为类型已存在' },
        { status: 400 }
      )
    }

    // 创建新规则
    const newRule = await prisma.reputationRule.create({
      data: {
        action,
        actionName,
        description,
        basePoints: parseInt(basePoints),
        maxPointsPerDay: maxPointsPerDay ? parseInt(maxPointsPerDay) : null,
        maxPointsPerSeason: maxPointsPerSeason ? parseInt(maxPointsPerSeason) : null,
        category,
        difficulty,
        multiplierRules,
        cooldownHours: parseInt(cooldownHours),
        prerequisites,
        seasonalBonus: parseFloat(seasonalBonus),
        communityVote,
        isActive,
        validFrom: validFrom ? new Date(validFrom) : new Date(),
        validUntil: validUntil ? new Date(validUntil) : null,
        createdBy: user.id
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: newRule,
      message: t('admin.reputation.rules.createSuccess') || '声誉规则创建成功'
    })

  } catch (error) {
    console.error('创建声誉规则错误:', error)
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    return NextResponse.json(
      { 
        success: false, 
        error: t('admin.reputation.rules.createError') || '创建声誉规则失败' 
      },
      { status: 500 }
    )
  }
}

// 更新声誉规则
export async function PUT(request: NextRequest) {
  try {
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)

    // 验证管理员权限
    const user = await auth(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: t('admin.unauthorized') || '无权限访问' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: t('admin.reputation.rules.missingId') || '缺少规则ID' },
        { status: 400 }
      )
    }

    // 验证规则是否存在
    const existingRule = await prisma.reputationRule.findUnique({
      where: { id }
    })

    if (!existingRule) {
      return NextResponse.json(
        { success: false, error: t('admin.reputation.rules.notFound') || '规则不存在' },
        { status: 404 }
      )
    }

    // 如果更新action，检查唯一性
    if (updateData.action && updateData.action !== existingRule.action) {
      const actionExists = await prisma.reputationRule.findFirst({
        where: {
          action: updateData.action,
          id: { not: id }
        }
      })

      if (actionExists) {
        return NextResponse.json(
          { success: false, error: t('admin.reputation.rules.actionExists') || '该行为类型已存在' },
          { status: 400 }
        )
      }
    }

    // 处理数值类型字段
    const processedData: any = { ...updateData }
    if (processedData.basePoints !== undefined) {
      processedData.basePoints = parseInt(processedData.basePoints)
    }
    if (processedData.maxPointsPerDay !== undefined) {
      processedData.maxPointsPerDay = processedData.maxPointsPerDay ? parseInt(processedData.maxPointsPerDay) : null
    }
    if (processedData.maxPointsPerSeason !== undefined) {
      processedData.maxPointsPerSeason = processedData.maxPointsPerSeason ? parseInt(processedData.maxPointsPerSeason) : null
    }
    if (processedData.cooldownHours !== undefined) {
      processedData.cooldownHours = parseInt(processedData.cooldownHours)
    }
    if (processedData.seasonalBonus !== undefined) {
      processedData.seasonalBonus = parseFloat(processedData.seasonalBonus)
    }
    if (processedData.validFrom !== undefined) {
      processedData.validFrom = new Date(processedData.validFrom)
    }
    if (processedData.validUntil !== undefined) {
      processedData.validUntil = processedData.validUntil ? new Date(processedData.validUntil) : null
    }

    // 添加更新者信息
    processedData.updatedBy = user.id

    // 更新规则
    const updatedRule = await prisma.reputationRule.update({
      where: { id },
      data: processedData,
      include: {
        creator: {
          select: {
            id: true,
            username: true
          }
        },
        updater: {
          select: {
            id: true,
            username: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedRule,
      message: t('admin.reputation.rules.updateSuccess') || '声誉规则更新成功'
    })

  } catch (error) {
    console.error('更新声誉规则错误:', error)
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    return NextResponse.json(
      { 
        success: false, 
        error: t('admin.reputation.rules.updateError') || '更新声誉规则失败' 
      },
      { status: 500 }
    )
  }
}

// 删除声誉规则
export async function DELETE(request: NextRequest) {
  try {
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)

    // 验证管理员权限
    const user = await auth(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: t('admin.unauthorized') || '无权限访问' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: t('admin.reputation.rules.missingId') || '缺少规则ID' },
        { status: 400 }
      )
    }

    // 验证规则是否存在
    const existingRule = await prisma.reputationRule.findUnique({
      where: { id }
    })

    if (!existingRule) {
      return NextResponse.json(
        { success: false, error: t('admin.reputation.rules.notFound') || '规则不存在' },
        { status: 404 }
      )
    }

    // 检查是否有相关的声誉记录
    const relatedRecords = await prisma.reputationRecord.count({
      where: { action: existingRule.action }
    })

    if (relatedRecords > 0) {
      // 如果有相关记录，只标记为非活跃而不删除
      await prisma.reputationRule.update({
        where: { id },
        data: { 
          isActive: false,
          updatedBy: user.id
        }
      })

      return NextResponse.json({
        success: true,
        message: t('admin.reputation.rules.deactivateSuccess') || '规则已停用（因为存在相关记录）'
      })
    } else {
      // 如果没有相关记录，可以安全删除
      await prisma.reputationRule.delete({
        where: { id }
      })

      return NextResponse.json({
        success: true,
        message: t('admin.reputation.rules.deleteSuccess') || '声誉规则删除成功'
      })
    }

  } catch (error) {
    console.error('删除声誉规则错误:', error)
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    return NextResponse.json(
      { 
        success: false, 
        error: t('admin.reputation.rules.deleteError') || '删除声誉规则失败' 
      },
      { status: 500 }
    )
  }
}
