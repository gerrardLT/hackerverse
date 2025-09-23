import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'
import { z } from 'zod'

// Zod schema for score validation
const scoreSubmissionSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  hackathonId: z.string().min(1, 'Hackathon ID is required'),
  scores: z.object({
    innovation: z.number().min(0).max(10).optional(),
    technicalComplexity: z.number().min(0).max(10).optional(),
    userExperience: z.number().min(0).max(10).optional(),
    businessPotential: z.number().min(0).max(10).optional(),
    presentation: z.number().min(0).max(10).optional()
  }),
  comments: z.string().optional(),
  isDraft: z.boolean().optional().default(false)
})

export async function POST(request: NextRequest) {
  const locale = getLocaleFromRequest(request)
  const t = createTFunction(locale)

  try {
    // 验证用户身份
    const user = await auth(request)
    if (!user || !['ADMIN', 'MODERATOR', 'JUDGE'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: t('common.errors.insufficientPermissions') },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = scoreSubmissionSchema.parse(body)

    // 验证评委权限
    const judgeAssignment = await prisma.judge.findFirst({
      where: {
        userId: user.id,
        hackathonId: validatedData.hackathonId
      }
    })

    if (!judgeAssignment && !['ADMIN', 'MODERATOR'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: t('judging.score.notAssigned') },
        { status: 403 }
      )
    }

    // 验证项目存在且属于该黑客松
    const project = await prisma.project.findFirst({
      where: {
        id: validatedData.projectId,
        hackathonId: validatedData.hackathonId
      },
      include: {
        hackathon: {
          select: {
            title: true,
            status: true,
            endDate: true,
            scoringCriteria: {
              where: { isActive: true },
              orderBy: { displayOrder: 'asc' }
            }
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json(
        { success: false, error: t('judging.score.projectNotFound') },
        { status: 404 }
      )
    }

    // 验证黑客松状态
    if (!['ACTIVE', 'COMPLETED'].includes(project.hackathon.status)) {
      return NextResponse.json(
        { success: false, error: t('judging.score.hackathonNotActive') },
        { status: 400 }
      )
    }

    // 获取评分标准
    const criteria = project.hackathon.scoringCriteria
    const requiredCriteria = criteria.filter(c => c.isRequired)

    // 验证必填评分项
    const submittedScores = validatedData.scores
    for (const criterion of requiredCriteria) {
      const fieldName = criterion.criteriaName.toLowerCase().replace(/\s+/g, '')
      if (!(fieldName in submittedScores) || submittedScores[fieldName as keyof typeof submittedScores] === undefined) {
        return NextResponse.json(
          { success: false, error: t('judging.score.missingRequiredCriteria', { criterion: criterion.criteriaName }) },
          { status: 400 }
        )
      }
    }

    // 计算总分
    const scoreValues = Object.values(submittedScores).filter(score => score !== undefined) as number[]
    const totalScore = scoreValues.length > 0 
      ? Number((scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length).toFixed(1))
      : 0

    // 查找现有评分记录
    const existingScore = await prisma.score.findFirst({
      where: {
        projectId: validatedData.projectId,
        judgeId: judgeAssignment?.id || `admin_${user.id}`
      }
    })

    let scoreRecord
    if (existingScore) {
      // 更新现有评分
      scoreRecord = await prisma.score.update({
        where: { id: existingScore.id },
        data: {
          innovation: submittedScores.innovation,
          technicalComplexity: submittedScores.technicalComplexity,
          userExperience: submittedScores.userExperience,
          businessPotential: submittedScores.businessPotential,
          presentation: submittedScores.presentation,
          totalScore,
          comments: validatedData.comments,
          syncStatus: validatedData.isDraft ? 'DRAFT' : 'PENDING'
        }
      })
    } else {
      // 创建新评分记录
      scoreRecord = await prisma.score.create({
        data: {
          projectId: validatedData.projectId,
          judgeId: judgeAssignment?.id || `admin_${user.id}`,
          innovation: submittedScores.innovation,
          technicalComplexity: submittedScores.technicalComplexity,
          userExperience: submittedScores.userExperience,
          businessPotential: submittedScores.businessPotential,
          presentation: submittedScores.presentation,
          totalScore,
          comments: validatedData.comments,
          syncStatus: validatedData.isDraft ? 'DRAFT' : 'PENDING'
        }
      })
    }

    // 如果不是草稿，更新项目的平均分
    if (!validatedData.isDraft) {
      const allScores = await prisma.score.findMany({
        where: {
          projectId: validatedData.projectId,
          syncStatus: { not: 'DRAFT' }
        },
        select: { totalScore: true }
      })

      if (allScores.length > 0) {
        const avgScore = allScores.reduce((sum, score) => sum + (score.totalScore || 0), 0) / allScores.length
        await prisma.project.update({
          where: { id: validatedData.projectId },
          data: { 
            averageScore: Number(avgScore.toFixed(1)),
            status: 'REVIEWED'
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: validatedData.isDraft ? t('judging.score.draftSaved') : t('judging.score.submitted'),
      data: {
        scoreId: scoreRecord.id,
        totalScore: scoreRecord.totalScore,
        isDraft: validatedData.isDraft,
        projectTitle: project.title
      }
    })
  } catch (error: any) {
    console.error('提交评分失败:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: t('judging.score.invalidData'), details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: t('judging.score.submitError') },
      { status: 500 }
    )
  }
}
