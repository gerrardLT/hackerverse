import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const hackathonId = searchParams.get('hackathonId')
    const judgeId = searchParams.get('judgeId') || user.id

    // 如果是普通评委，只能查看自己的分配
    const canViewAll = ['ADMIN', 'MODERATOR'].includes(user.role)
    const effectiveJudgeId = canViewAll && judgeId !== user.id ? judgeId : user.id

    // 构建查询条件
    const whereCondition: any = {
      userId: effectiveJudgeId
    }
    if (hackathonId) {
      whereCondition.hackathonId = hackathonId
    }

    // 获取评委分配信息
    const judgeAssignments = await prisma.judge.findMany({
      where: whereCondition,
      include: {
        hackathon: {
          select: {
            id: true,
            title: true,
            status: true,
            startDate: true,
            endDate: true,
            judgingSessions: {
              where: {
                status: 'ACTIVE'
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            bio: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // 获取已分配的项目和评分进度
    const assignmentsWithProjects = await Promise.all(
      judgeAssignments.map(async (assignment) => {
        // 解析分配的项目ID
        const assignedProjectIds = Array.isArray(assignment.assignedProjects) 
          ? assignment.assignedProjects as string[]
          : []

        // 获取分配的项目详情
        const projects = assignedProjectIds.length > 0 ? await prisma.project.findMany({
          where: {
            id: { in: assignedProjectIds },
            hackathonId: assignment.hackathonId
          },
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            submittedAt: true,
            team: {
              select: {
                name: true,
                members: {
                  include: {
                    user: {
                      select: { username: true, avatarUrl: true }
                    }
                  }
                }
              }
            }
          }
        }) : []

        // 获取已评分的项目
        const existingScores = await prisma.score.findMany({
          where: {
            judgeId: assignment.id,
            projectId: { in: assignedProjectIds }
          },
          select: {
            projectId: true,
            totalScore: true,
            createdAt: true,
            comments: true
          }
        })

        // 计算评分进度
        const scoredProjectIds = existingScores.map(score => score.projectId)
        const pendingProjects = projects.filter(p => !scoredProjectIds.includes(p.id))
        const completedProjects = projects.filter(p => scoredProjectIds.includes(p.id))

        return {
          id: assignment.id,
          hackathon: assignment.hackathon,
          judge: assignment.user,
          role: assignment.role,
          expertise: assignment.expertise,
          assignedProjects: projects,
          scoringProgress: {
            total: projects.length,
            completed: completedProjects.length,
            pending: pendingProjects.length,
            completionRate: projects.length > 0 ? Math.round((completedProjects.length / projects.length) * 100) : 0
          },
          recentScores: existingScores.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ).slice(0, 5)
        }
      })
    )

    // 统计数据
    const totalAssignments = assignmentsWithProjects.length
    const totalProjects = assignmentsWithProjects.reduce((sum, a) => sum + a.scoringProgress.total, 0)
    const completedProjects = assignmentsWithProjects.reduce((sum, a) => sum + a.scoringProgress.completed, 0)
    const overallProgress = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0

    return NextResponse.json({
      success: true,
      data: {
        assignments: assignmentsWithProjects,
        summary: {
          totalAssignments,
          totalProjects,
          completedProjects,
          pendingProjects: totalProjects - completedProjects,
          overallProgress
        },
        canViewAll
      }
    })
  } catch (error) {
    console.error('获取评委分配失败:', error)
    return NextResponse.json(
      { success: false, error: t('judging.assignments.fetchError') },
      { status: 500 }
    )
  }
}
