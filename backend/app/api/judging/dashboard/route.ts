import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'
import { z } from 'zod'

// 评委仪表板查询参数验证
const dashboardQuerySchema = z.object({
  hackathonId: z.string().optional(),
  status: z.enum(['all', 'assigned', 'pending', 'completed', 'locked']).optional().default('all'),
  sortBy: z.enum(['priority', 'deadline', 'title', 'created']).optional().default('priority'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0)
})

/**
 * 获取评委专用仪表板数据
 * GET /api/judging/dashboard
 * 
 * 查询参数：
 * - hackathonId?: string - 特定黑客松ID（可选）
 * - status?: 'all' | 'assigned' | 'pending' | 'completed' | 'locked' - 评审状态过滤
 * - sortBy?: 'priority' | 'deadline' | 'title' | 'created' - 排序字段
 * - sortOrder?: 'asc' | 'desc' - 排序顺序
 * - limit?: number - 分页限制（默认20）
 * - offset?: number - 分页偏移（默认0）
 */
export async function GET(request: NextRequest) {
  const locale = getLocaleFromRequest(request)
  const t = createTFunction(locale)

  try {
    // 验证用户身份
    const user = await auth(request)
    if (!user || !['ADMIN', 'MODERATOR', 'JUDGE'].includes(user.role)) {
      return NextResponse.json(
        { 
          success: false, 
          error: t('common.errors.insufficientPermissions'),
          code: 'INSUFFICIENT_PERMISSIONS'
        },
        { status: 403 }
      )
    }

    // 解析查询参数
    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())
    const validatedQuery = dashboardQuerySchema.parse(query)

    console.log('🎯 获取评委仪表板数据:', user.id, validatedQuery)

    // 获取评委信息
    let judgeFilter: any = {
      userId: user.id
    }
    
    // 如果指定了特定黑客松
    if (validatedQuery.hackathonId) {
      judgeFilter.hackathonId = validatedQuery.hackathonId
    }

    const judgeAssignments = await prisma.judge.findMany({
      where: judgeFilter,
      include: {
        hackathon: {
          select: {
            id: true,
            title: true,
            status: true,
            endDate: true,
            judgingSessions: {
              select: {
                id: true,
                name: true,
                startTime: true,
                endTime: true,
                status: true
              }
            }
          }
        }
      }
    })

    if (judgeAssignments.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          assignments: [],
          projects: [],
          stats: {
            totalAssigned: 0,
            completed: 0,
            pending: 0,
            locked: 0
          },
          timeStatus: {
            hasActiveDeadlines: false,
            nextDeadline: null,
            gracePeriodActive: false
          }
        }
      })
    }

    // 获取分配的项目列表
    const hackathonIds = judgeAssignments.map(j => j.hackathonId)
    const assignedProjectIds: string[] = []
    
    // 解析每个评委分配中的项目ID
    judgeAssignments.forEach(judge => {
      const projects = Array.isArray(judge.assignedProjects) 
        ? judge.assignedProjects as string[]
        : []
      assignedProjectIds.push(...projects)
    })

    // 构建项目查询条件
    let projectWhere: any = {
      id: {
        in: assignedProjectIds
      }
    }

    // 根据状态过滤
    if (validatedQuery.status !== 'all') {
      switch (validatedQuery.status) {
        case 'assigned':
          // 已分配但未开始评分
          projectWhere.scores = {
            none: {
              judgeId: {
                in: judgeAssignments.map(j => j.id)
              }
            }
          }
          break
        case 'pending':
          // 有评分但未完成
          projectWhere.scores = {
            some: {
              AND: [
                {
                  judgeId: {
                    in: judgeAssignments.map(j => j.id)
                  }
                },
                {
                  isFinalized: false
                }
              ]
            }
          }
          break
        case 'completed':
          // 评分已完成且最终确认
          projectWhere.scores = {
            some: {
              AND: [
                {
                  judgeId: {
                    in: judgeAssignments.map(j => j.id)
                  }
                },
                {
                  isFinalized: true
                }
              ]
            }
          }
          break
        case 'locked':
          // 评审期已锁定
          projectWhere.hackathon = {
            judgingSessions: {
              some: {
                isLocked: true
              }
            }
          }
          break
      }
    }

    // 获取项目数据
    const projects = await prisma.project.findMany({
      where: projectWhere,
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true
          }
        },
        hackathon: {
          select: {
            id: true,
            title: true,
            endDate: true,
            status: true
          }
        },
        team: {
          select: {
            id: true,
            name: true,
            members: {
              select: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    avatarUrl: true
                  }
                }
              }
            }
          }
        },
        scores: {
          where: {
            judgeId: {
              in: judgeAssignments.map(j => j.id)
            }
          },
          select: {
            id: true,
            innovation: true,
            technicalComplexity: true,
            userExperience: true,
            businessPotential: true,
            presentation: true,
            totalScore: true,
            comments: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            scores: true,
            feedback: true,
            projectLikes: true,
            projectComments: true
          }
        }
      },
      orderBy: (() => {
        switch (validatedQuery.sortBy) {
          case 'priority':
            // 优先级排序：未评分 > 部分评分 > 已完成
            return { createdAt: validatedQuery.sortOrder }
          case 'deadline':
            return { 
              hackathon: {
                endDate: validatedQuery.sortOrder
              }
            }
          case 'title':
            return { title: validatedQuery.sortOrder }
          case 'created':
            return { createdAt: validatedQuery.sortOrder }
          default:
            return { createdAt: 'desc' }
        }
      })(),
      skip: validatedQuery.offset,
      take: validatedQuery.limit
    })

    // 计算统计数据
    const totalAssigned = assignedProjectIds.length
    const completedCount = await prisma.project.count({
      where: {
        id: {
          in: assignedProjectIds
        },
        scores: {
          some: {
            AND: [
              {
                judgeId: {
                  in: judgeAssignments.map(j => j.id)
                }
              },
              {
                totalScore: {
                  not: null
                }
              }
            ]
          }
        }
      }
    })

    const pendingCount = await prisma.project.count({
      where: {
        id: {
          in: assignedProjectIds
        },
        scores: {
          some: {
            AND: [
              {
                judgeId: {
                  in: judgeAssignments.map(j => j.id)
                }
              },
              {
                totalScore: null
              }
            ]
          }
        }
      }
    })

    const lockedCount = await prisma.project.count({
      where: {
        id: {
          in: assignedProjectIds
        }
      }
    })

    // 检查时间状态
    const activeSessions = judgeAssignments.flatMap(j => j.hackathon.judgingSessions)
    const hasActiveDeadlines = activeSessions.some(s => 
      s.status === 'ACTIVE' && 
      new Date(s.endTime) > new Date()
    )
    
    const nextDeadline = activeSessions
      .filter(s => new Date(s.endTime) > new Date())
      .sort((a, b) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime())
      .shift()?.endTime

    const gracePeriodActive = false // 简化处理，暂时禁用宽限期检查

    console.log('✅ 成功获取评委仪表板数据:', {
      assignments: judgeAssignments.length,
      projects: projects.length,
      totalAssigned,
      completed: completedCount,
      pending: pendingCount,
      locked: lockedCount
    })

    return NextResponse.json({
      success: true,
      data: {
        assignments: judgeAssignments.map(assignment => ({
          id: assignment.id,
          hackathon: assignment.hackathon,
          role: assignment.role,
          expertise: assignment.expertise,
          assignedProjectCount: Array.isArray(assignment.assignedProjects) 
            ? (assignment.assignedProjects as string[]).length 
            : 0,
          createdAt: assignment.createdAt
        })),
        projects: projects.map(project => ({
          id: project.id,
          title: project.title,
          description: project.description,
          technologies: project.technologies,
          tags: project.tags,
          status: project.status,
          isPublic: project.isPublic,
          creator: project.creator,
          hackathon: project.hackathon,
          team: project.team,
          scores: project.scores,
          stats: {
            totalScores: project._count.scores,
            totalFeedback: project._count.feedback,
            totalLikes: project._count.projectLikes,
            totalComments: project._count.projectComments
          },
          githubUrl: project.githubUrl,
          demoUrl: project.demoUrl,
          videoUrl: project.videoUrl,
          presentationUrl: project.presentationUrl,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt
        })),
        stats: {
          totalAssigned,
          completed: completedCount,
          pending: pendingCount,
          locked: lockedCount
        },
        timeStatus: {
          hasActiveDeadlines,
          nextDeadline,
          gracePeriodActive
        },
        pagination: {
          limit: validatedQuery.limit,
          offset: validatedQuery.offset,
          total: totalAssigned
        }
      }
    })

  } catch (error: any) {
    console.error('❌ 获取评委仪表板数据失败:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: t('common.errors.invalidInput'),
          code: 'VALIDATION_ERROR',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: t('common.errors.internalServer'),
        code: 'INTERNAL_SERVER_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
