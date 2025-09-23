import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'
import { z } from 'zod'

// Zod schema for criteria validation
const criteriaSchema = z.object({
  hackathonId: z.string().min(1, 'Hackathon ID is required'),
  criteriaName: z.string().min(1, 'Criteria name is required'),
  description: z.string().optional(),
  weight: z.number().min(0).max(100, 'Weight must be between 0 and 100'),
  maxScore: z.number().min(1).max(100, 'Max score must be between 1 and 100'),
  minScore: z.number().min(0).max(99, 'Min score must be between 0 and 99'),
  displayOrder: z.number().int().min(0).optional(),
  isRequired: z.boolean().optional().default(true),
  isActive: z.boolean().optional().default(true),
  criteriaType: z.enum(['standard', 'custom', 'bonus']).optional().default('standard'),
  helpText: z.string().optional()
})

const batchCriteriaSchema = z.object({
  hackathonId: z.string().min(1, 'Hackathon ID is required'),
  criteria: z.array(criteriaSchema.omit({ hackathonId: true })),
  replaceExisting: z.boolean().optional().default(false)
})

export async function GET(request: NextRequest) {
  const locale = getLocaleFromRequest(request)
  const t = createTFunction(locale)

  try {
    const user = await auth(request)
    if (!user || !['ADMIN', 'MODERATOR'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: t('common.errors.adminRequired') },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const hackathonId = searchParams.get('hackathonId')
    const includeInactive = searchParams.get('includeInactive') === 'true'

    if (!hackathonId) {
      return NextResponse.json(
        { success: false, error: t('judging.criteria.hackathonIdRequired') },
        { status: 400 }
      )
    }

    // 验证黑客松存在且用户有权限
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: hackathonId },
      select: {
        id: true,
        title: true,
        status: true,
        organizerId: true
      }
    })

    if (!hackathon) {
      return NextResponse.json(
        { success: false, error: t('judging.criteria.hackathonNotFound') },
        { status: 404 }
      )
    }

    // 检查权限：管理员或组织者
    if (user.role !== 'ADMIN' && hackathon.organizerId !== user.id) {
      return NextResponse.json(
        { success: false, error: t('common.errors.insufficientPermissions') },
        { status: 403 }
      )
    }

    const whereCondition: any = { hackathonId }
    if (!includeInactive) {
      whereCondition.isActive = true
    }

    const criteria = await prisma.scoringCriteria.findMany({
      where: whereCondition,
      include: {
        creator: {
          select: { username: true }
        },
        updater: {
          select: { username: true }
        }
      },
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      data: {
        hackathon,
        criteria,
        statistics: {
          total: criteria.length,
          active: criteria.filter(c => c.isActive).length,
          required: criteria.filter(c => c.isRequired && c.isActive).length,
          totalWeight: criteria
            .filter(c => c.isActive)
            .reduce((sum, c) => sum + Number(c.weight), 0)
        }
      }
    })
  } catch (error) {
    console.error('获取评分标准失败:', error)
    return NextResponse.json(
      { success: false, error: t('judging.criteria.fetchError') },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const locale = getLocaleFromRequest(request)
  const t = createTFunction(locale)

  try {
    const user = await auth(request)
    if (!user || !['ADMIN', 'MODERATOR'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: t('common.errors.adminRequired') },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // 检查是批量操作还是单个操作
    const isBatch = Array.isArray(body.criteria)
    
    if (isBatch) {
      const validatedData = batchCriteriaSchema.parse(body)
      
      // 验证黑客松存在且用户有权限
      const hackathon = await prisma.hackathon.findUnique({
        where: { id: validatedData.hackathonId },
        select: { id: true, organizerId: true }
      })

      if (!hackathon) {
        return NextResponse.json(
          { success: false, error: t('judging.criteria.hackathonNotFound') },
          { status: 404 }
        )
      }

      if (user.role !== 'ADMIN' && hackathon.organizerId !== user.id) {
        return NextResponse.json(
          { success: false, error: t('common.errors.insufficientPermissions') },
          { status: 403 }
        )
      }

      // 验证权重总和不超过100%
      const totalWeight = validatedData.criteria
        .filter(c => c.isActive !== false)
        .reduce((sum, c) => sum + c.weight, 0)
      
      if (totalWeight > 100) {
        return NextResponse.json(
          { success: false, error: t('judging.criteria.weightExceeds100') },
          { status: 400 }
        )
      }

      await prisma.$transaction(async (tx) => {
        // 如果要替换现有标准，先删除
        if (validatedData.replaceExisting) {
          await tx.scoringCriteria.deleteMany({
            where: { hackathonId: validatedData.hackathonId }
          })
        }

        // 创建新标准
        const createData = validatedData.criteria.map((criterion, index) => ({
          ...criterion,
          hackathonId: validatedData.hackathonId,
          displayOrder: criterion.displayOrder ?? index,
          createdBy: user.id,
          updatedBy: user.id
        }))

        await tx.scoringCriteria.createMany({
          data: createData
        })
      })

      return NextResponse.json({
        success: true,
        message: t('judging.criteria.batchCreateSuccess'),
        data: {
          hackathonId: validatedData.hackathonId,
          criteriaCount: validatedData.criteria.length,
          totalWeight
        }
      })
    } else {
      // 单个标准创建
      const validatedData = criteriaSchema.parse(body)
      
      // 验证黑客松存在且用户有权限
      const hackathon = await prisma.hackathon.findUnique({
        where: { id: validatedData.hackathonId },
        select: { id: true, organizerId: true }
      })

      if (!hackathon) {
        return NextResponse.json(
          { success: false, error: t('judging.criteria.hackathonNotFound') },
          { status: 404 }
        )
      }

      if (user.role !== 'ADMIN' && hackathon.organizerId !== user.id) {
        return NextResponse.json(
          { success: false, error: t('common.errors.insufficientPermissions') },
          { status: 403 }
        )
      }

      // 验证minScore < maxScore
      if (validatedData.minScore >= validatedData.maxScore) {
        return NextResponse.json(
          { success: false, error: t('judging.criteria.invalidScoreRange') },
          { status: 400 }
        )
      }

      // 检查是否会导致权重超过100%
      const existingWeight = await prisma.scoringCriteria.aggregate({
        where: {
          hackathonId: validatedData.hackathonId,
          isActive: true
        },
        _sum: { weight: true }
      })

      const currentTotalWeight = Number(existingWeight._sum.weight || 0)
      if (currentTotalWeight + validatedData.weight > 100) {
        return NextResponse.json(
          { success: false, error: t('judging.criteria.weightWouldExceed100') },
          { status: 400 }
        )
      }

      const newCriterion = await prisma.scoringCriteria.create({
        data: {
          ...validatedData,
          createdBy: user.id,
          updatedBy: user.id
        },
        include: {
          creator: { select: { username: true } },
          updater: { select: { username: true } }
        }
      })

      return NextResponse.json({
        success: true,
        message: t('judging.criteria.createSuccess'),
        data: newCriterion
      })
    }
  } catch (error: any) {
    console.error('创建评分标准失败:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: t('judging.criteria.invalidData'), details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: t('judging.criteria.createError') },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const locale = getLocaleFromRequest(request)
  const t = createTFunction(locale)

  try {
    const user = await auth(request)
    if (!user || !['ADMIN', 'MODERATOR'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: t('common.errors.adminRequired') },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const criteriaId = searchParams.get('id')

    if (!criteriaId) {
      return NextResponse.json(
        { success: false, error: t('judging.criteria.criteriaIdRequired') },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = criteriaSchema.partial().parse(body)

    // 获取现有标准
    const existingCriteria = await prisma.scoringCriteria.findUnique({
      where: { id: criteriaId },
      include: {
        hackathon: {
          select: { organizerId: true }
        }
      }
    })

    if (!existingCriteria) {
      return NextResponse.json(
        { success: false, error: t('judging.criteria.notFound') },
        { status: 404 }
      )
    }

    // 权限检查
    if (user.role !== 'ADMIN' && existingCriteria.hackathon.organizerId !== user.id) {
      return NextResponse.json(
        { success: false, error: t('common.errors.insufficientPermissions') },
        { status: 403 }
      )
    }

    // 如果更新了分数范围，验证有效性
    const newMinScore = validatedData.minScore ?? existingCriteria.minScore
    const newMaxScore = validatedData.maxScore ?? existingCriteria.maxScore
    if (newMinScore >= newMaxScore) {
      return NextResponse.json(
        { success: false, error: t('judging.criteria.invalidScoreRange') },
        { status: 400 }
      )
    }

    const updatedCriteria = await prisma.scoringCriteria.update({
      where: { id: criteriaId },
      data: {
        ...validatedData,
        updatedBy: user.id
      },
      include: {
        creator: { select: { username: true } },
        updater: { select: { username: true } }
      }
    })

    return NextResponse.json({
      success: true,
      message: t('judging.criteria.updateSuccess'),
      data: updatedCriteria
    })
  } catch (error: any) {
    console.error('更新评分标准失败:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: t('judging.criteria.invalidData'), details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: t('judging.criteria.updateError') },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const locale = getLocaleFromRequest(request)
  const t = createTFunction(locale)

  try {
    const user = await auth(request)
    if (!user || !['ADMIN', 'MODERATOR'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: t('common.errors.adminRequired') },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const criteriaId = searchParams.get('id')

    if (!criteriaId) {
      return NextResponse.json(
        { success: false, error: t('judging.criteria.criteriaIdRequired') },
        { status: 400 }
      )
    }

    // 获取现有标准
    const existingCriteria = await prisma.scoringCriteria.findUnique({
      where: { id: criteriaId },
      include: {
        hackathon: {
          select: { organizerId: true }
        }
      }
    })

    if (!existingCriteria) {
      return NextResponse.json(
        { success: false, error: t('judging.criteria.notFound') },
        { status: 404 }
      )
    }

    // 权限检查
    if (user.role !== 'ADMIN' && existingCriteria.hackathon.organizerId !== user.id) {
      return NextResponse.json(
        { success: false, error: t('common.errors.insufficientPermissions') },
        { status: 403 }
      )
    }

    // 检查是否有评分使用了这个标准（可以考虑软删除）
    const relatedScores = await prisma.score.count({
      where: {
        project: {
          hackathonId: existingCriteria.hackathonId
        }
      }
    })

    if (relatedScores > 0) {
      // 如果有相关评分，使用软删除
      await prisma.scoringCriteria.update({
        where: { id: criteriaId },
        data: { 
          isActive: false,
          updatedBy: user.id
        }
      })

      return NextResponse.json({
        success: true,
        message: t('judging.criteria.deactivateSuccess')
      })
    } else {
      // 如果没有相关评分，可以直接删除
      await prisma.scoringCriteria.delete({
        where: { id: criteriaId }
      })

      return NextResponse.json({
        success: true,
        message: t('judging.criteria.deleteSuccess')
      })
    }
  } catch (error) {
    console.error('删除评分标准失败:', error)
    return NextResponse.json(
      { success: false, error: t('judging.criteria.deleteError') },
      { status: 500 }
    )
  }
}
