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
    const includeDrafts = searchParams.get('includeDrafts') === 'true'
    const sortBy = searchParams.get('sortBy') || 'totalScore'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // 验证黑客松存在
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: hackathonId },
      select: {
        id: true,
        title: true,
        status: true,
        organizerId: true,
        endDate: true
      }
    })

    if (!hackathon) {
      return NextResponse.json(
        { success: false, error: t('judging.results.hackathonNotFound') },
        { status: 404 }
      )
    }

    // 权限检查：组织者、评委或管理员可以查看
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

    // 获取黑客松的所有项目
    const projects = await prisma.project.findMany({
      where: {
        hackathonId,
        status: { in: ['SUBMITTED', 'REVIEWED', 'WINNER'] }
      },
      include: {
        team: {
          select: {
            name: true,
            members: {
              include: {
                user: {
                  select: {
                    username: true,
                    avatarUrl: true
                  }
                }
              }
            }
          }
        },
        scores: {
          where: includeDrafts ? {} : { syncStatus: { not: 'DRAFT' } },
          include: {
            judge: {
              include: {
                user: {
                  select: {
                    username: true,
                    avatarUrl: true
                  }
                }
              }
            }
          }
        },
        creator: {
          select: {
            username: true,
            avatarUrl: true
          }
        }
      }
    })

    // 计算每个项目的评分统计
    const projectResults = projects.map(project => {
      const scores = project.scores
      const scoreCount = scores.length

      if (scoreCount === 0) {
        return {
          project: {
            id: project.id,
            title: project.title,
            description: project.description,
            status: project.status,
            submittedAt: project.submittedAt,
            team: project.team,
            creator: project.creator,
            githubUrl: project.githubUrl,
            demoUrl: project.demoUrl,
            videoUrl: project.videoUrl
          },
          scoring: {
            totalScore: 0,
            averageScore: 0,
            scoreCount: 0,
            maxScore: 0,
            minScore: 0,
            standardDeviation: 0,
            scores: [],
            isComplete: false
          }
        }
      }

      // 计算各项统计
      const totalScores = scores.map(s => s.totalScore || 0)
      const averageScore = totalScores.reduce((sum, score) => sum + score, 0) / scoreCount
      const maxScore = Math.max(...totalScores)
      const minScore = Math.min(...totalScores)
      
      // 计算标准差
      const variance = totalScores.reduce((sum, score) => sum + Math.pow(score - averageScore, 2), 0) / scoreCount
      const standardDeviation = Math.sqrt(variance)

      // 分类评分统计
      const categoryScores = {
        innovation: scores.map(s => s.innovation || 0).filter(s => s > 0),
        technicalComplexity: scores.map(s => s.technicalComplexity || 0).filter(s => s > 0),
        userExperience: scores.map(s => s.userExperience || 0).filter(s => s > 0),
        businessPotential: scores.map(s => s.businessPotential || 0).filter(s => s > 0),
        presentation: scores.map(s => s.presentation || 0).filter(s => s > 0)
      }

      const categoryAverages = Object.entries(categoryScores).reduce((acc, [key, values]) => {
        acc[key] = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0
        return acc
      }, {} as Record<string, number>)

      return {
        project: {
          id: project.id,
          title: project.title,
          description: project.description,
          status: project.status,
          submittedAt: project.submittedAt,
          team: project.team,
          creator: project.creator,
          githubUrl: project.githubUrl,
          demoUrl: project.demoUrl,
          videoUrl: project.videoUrl
        },
        scoring: {
          totalScore: Number(averageScore.toFixed(1)),
          averageScore: Number(averageScore.toFixed(1)),
          scoreCount,
          maxScore: Number(maxScore.toFixed(1)),
          minScore: Number(minScore.toFixed(1)),
          standardDeviation: Number(standardDeviation.toFixed(2)),
          categoryAverages,
          scores: scores.map(score => ({
            id: score.id,
            judge: score.judge?.user,
            innovation: score.innovation,
            technicalComplexity: score.technicalComplexity,
            userExperience: score.userExperience,
            businessPotential: score.businessPotential,
            presentation: score.presentation,
            totalScore: score.totalScore,
            comments: score.comments,
            createdAt: score.createdAt,
            isDraft: score.syncStatus === 'DRAFT'
          })),
          isComplete: scores.length > 0 && scores.every(s => s.syncStatus !== 'DRAFT')
        }
      }
    })

    // 排序结果
    projectResults.sort((a, b) => {
      let aValue, bValue
      switch (sortBy) {
        case 'title':
          aValue = a.project.title
          bValue = b.project.title
          break
        case 'scoreCount':
          aValue = a.scoring.scoreCount
          bValue = b.scoring.scoreCount
          break
        case 'submittedAt':
          aValue = new Date(a.project.submittedAt || 0).getTime()
          bValue = new Date(b.project.submittedAt || 0).getTime()
          break
        case 'totalScore':
        default:
          aValue = a.scoring.totalScore
          bValue = b.scoring.totalScore
          break
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    // 添加排名
    projectResults.forEach((result, index) => {
      result.scoring.rank = index + 1
    })

    // 获取评委信息
    const judges = await prisma.judge.findMany({
      where: { hackathonId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        }
      }
    })

    // 计算整体统计
    const completedProjects = projectResults.filter(r => r.scoring.isComplete)
    const averageOverallScore = completedProjects.length > 0 
      ? completedProjects.reduce((sum, r) => sum + r.scoring.totalScore, 0) / completedProjects.length
      : 0

    const statistics = {
      totalProjects: projectResults.length,
      scoredProjects: projectResults.filter(r => r.scoring.scoreCount > 0).length,
      completedProjects: completedProjects.length,
      totalJudges: judges.length,
      averageOverallScore: Number(averageOverallScore.toFixed(1)),
      scoringProgress: projectResults.length > 0 
        ? Math.round((completedProjects.length / projectResults.length) * 100)
        : 0
    }

    return NextResponse.json({
      success: true,
      data: {
        hackathon: {
          id: hackathon.id,
          title: hackathon.title,
          status: hackathon.status,
          endDate: hackathon.endDate
        },
        results: projectResults,
        judges,
        statistics,
        metadata: {
          sortBy,
          sortOrder,
          includeDrafts,
          generatedAt: new Date().toISOString()
        },
        permissions: {
          canViewAll: isOrganizer || ['ADMIN', 'MODERATOR'].includes(user.role),
          canExport: isOrganizer || ['ADMIN', 'MODERATOR'].includes(user.role),
          isOrganizer,
          isJudge: !!isAssignedJudge
        }
      }
    })
  } catch (error) {
    console.error('获取评分结果失败:', error)
    return NextResponse.json(
      { success: false, error: t('judging.results.fetchError') },
      { status: 500 }
    )
  }
}
