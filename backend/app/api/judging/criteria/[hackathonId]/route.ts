import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'

export async function GET(
  request: NextRequest,
  { params }: { params: { hackathonId: string } }
) {
  const locale = getLocaleFromRequest(request)
  const t = createTFunction(locale)

  try {
    // 验证用户身份
    const user = await auth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: t('common.errors.unauthenticated') },
        { status: 401 }
      )
    }

    const { hackathonId } = params
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    // 验证黑客松存在
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

    // 权限检查：评委、组织者或管理员可以查看
    const isOrganizer = hackathon.organizerId === user.id
    const hasJudgeRole = ['ADMIN', 'MODERATOR', 'JUDGE'].includes(user.role)
    const isAssignedJudge = hasJudgeRole ? await prisma.judge.findFirst({
      where: {
        hackathonId,
        userId: user.id
      }
    }) : null

    if (!isOrganizer && !hasJudgeRole && !isAssignedJudge) {
      return NextResponse.json(
        { success: false, error: t('common.errors.insufficientPermissions') },
        { status: 403 }
      )
    }

    // 构建查询条件
    const whereCondition: any = { hackathonId }
    if (!includeInactive && !['ADMIN', 'MODERATOR'].includes(user.role)) {
      whereCondition.isActive = true
    }

    // 获取评分标准
    const criteria = await prisma.scoringCriteria.findMany({
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
        { displayOrder: 'asc' },
        { createdAt: 'asc' }
      ]
    })

    // 获取默认评分标准（如果没有自定义标准）
    const defaultCriteria = criteria.length === 0 ? [
      {
        criteriaName: 'Innovation',
        description: 'Creativity and uniqueness of the solution',
        weight: 20,
        maxScore: 10,
        minScore: 0,
        isRequired: true,
        criteriaType: 'standard',
        helpText: 'Rate the innovation and creativity of the project'
      },
      {
        criteriaName: 'Technical Complexity',
        description: 'Technical difficulty and implementation quality',
        weight: 20,
        maxScore: 10,
        minScore: 0,
        isRequired: true,
        criteriaType: 'standard',
        helpText: 'Rate the technical complexity and code quality'
      },
      {
        criteriaName: 'User Experience',
        description: 'Usability and user interface design',
        weight: 20,
        maxScore: 10,
        minScore: 0,
        isRequired: true,
        criteriaType: 'standard',
        helpText: 'Rate the user experience and interface design'
      },
      {
        criteriaName: 'Business Potential',
        description: 'Market viability and business model',
        weight: 20,
        maxScore: 10,
        minScore: 0,
        isRequired: true,
        criteriaType: 'standard',
        helpText: 'Rate the business potential and market viability'
      },
      {
        criteriaName: 'Presentation',
        description: 'Quality of project presentation and demo',
        weight: 20,
        maxScore: 10,
        minScore: 0,
        isRequired: true,
        criteriaType: 'standard',
        helpText: 'Rate the presentation quality and demo effectiveness'
      }
    ] : []

    // 计算统计信息
    const activeCriteria = criteria.filter(c => c.isActive)
    const requiredCriteria = activeCriteria.filter(c => c.isRequired)
    const totalWeight = activeCriteria.reduce((sum, c) => sum + Number(c.weight), 0)
    const maxPossibleScore = activeCriteria.reduce((sum, c) => sum + Number(c.maxScore), 0)

    // 获取评分会话信息
    const judgingSessions = await prisma.judgingSession.findMany({
      where: { 
        hackathonId,
        status: { in: ['SCHEDULED', 'ACTIVE'] }
      },
      orderBy: { startTime: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: {
        hackathon: {
          id: hackathon.id,
          title: hackathon.title,
          status: hackathon.status
        },
        criteria: criteria.length > 0 ? criteria : defaultCriteria,
        statistics: {
          totalCriteria: criteria.length,
          activeCriteria: activeCriteria.length,
          requiredCriteria: requiredCriteria.length,
          totalWeight,
          maxPossibleScore,
          isCustom: criteria.length > 0
        },
        judgingSessions,
        permissions: {
          canEdit: isOrganizer || ['ADMIN', 'MODERATOR'].includes(user.role),
          canView: true,
          isOrganizer,
          isJudge: !!isAssignedJudge
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
