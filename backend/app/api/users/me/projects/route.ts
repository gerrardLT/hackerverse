import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'

// 查询参数验证schema
const querySchema = z.object({
  status: z.enum(['DRAFT', 'READY_TO_SUBMIT', 'SUBMITTED', 'REVIEWED', 'WINNER', 'REJECTED', 'ALL']).optional().default('ALL'),
  page: z.string().transform(Number).pipe(z.number().min(1)).optional().default(1),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional().default(20),
  sortBy: z.enum(['title', 'status', 'createdAt', 'updatedAt', 'submissions']).optional().default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  search: z.string().optional()
})

export async function OPTIONS() {
  return NextResponse.json(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    },
  })
}

export async function GET(request: NextRequest) {
  try {
    const user = await auth(request)
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)

    // 解析查询参数
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    const validatedQuery = querySchema.parse(queryParams)

    // 构建where条件
    const where: any = {
      creatorId: user.id
    }

    // 状态过滤
    if (validatedQuery.status !== 'ALL') {
      where.status = validatedQuery.status
    }

    // 搜索条件
    if (validatedQuery.search) {
      where.OR = [
        { title: { contains: validatedQuery.search, mode: 'insensitive' } },
        { description: { contains: validatedQuery.search, mode: 'insensitive' } }
      ]
    }

    // 排序条件
    let orderBy: any = {}
    if (validatedQuery.sortBy === 'submissions') {
      // 按提交数量排序需要特殊处理
      orderBy = { submissions: { _count: validatedQuery.sortOrder } }
    } else {
      orderBy[validatedQuery.sortBy] = validatedQuery.sortOrder
    }

    // 分页计算
    const skip = (validatedQuery.page - 1) * validatedQuery.limit
    const take = validatedQuery.limit

    // 查询用户项目（包含提交历史）
    const projects = await prisma.project.findMany({
      where,
      include: {
        hackathon: {
          select: {
            id: true,
            title: true,
            status: true,
            startDate: true,
            endDate: true
          }
        },
        team: {
          select: {
            id: true,
            name: true,
            members: {
              select: {
                userId: true,
                role: true,
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
        submissions: {
          include: {
            hackathon: {
              select: {
                id: true,
                title: true,
                status: true
              }
            }
          },
          orderBy: {
            submittedAt: 'desc'
          }
        },
        scores: {
          select: {
            totalScore: true,
            innovation: true,
            technicalComplexity: true,
            userExperience: true,
            businessPotential: true,
            presentation: true,
            judgeId: true
          }
        },
        _count: {
          select: {
            projectLikes: true,
            projectComments: true,
            submissions: true
          }
        }
      },
      orderBy,
      skip,
      take
    })

    // 获取总数
    const totalCount = await prisma.project.count({ where })

    // 获取状态统计
    const statusStats = await prisma.project.groupBy({
      by: ['status'],
      where: {
        creatorId: user.id
      },
      _count: {
        _all: true
      }
    })

    // 转换项目数据
    const projectsWithDetails = projects.map((project: any) => {
      const averageScore = project.scores?.length > 0 
        ? Math.round(project.scores.reduce((sum: number, scoreItem: any) => 
            sum + Number(scoreItem.totalScore || 0), 0) / project.scores.length)
        : null

      return {
        id: project.id,
        title: project.title,
        description: project.description,
        status: project.status,
        statusDisplay: getProjectStatusDisplay(project.status, t),
        technologies: project.technologies,
        tags: project.tags,
        githubUrl: project.githubUrl,
        demoUrl: project.demoUrl,
        videoUrl: project.videoUrl,
        presentationUrl: project.presentationUrl,
        isPublic: project.isPublic,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        
        // 黑客松信息（原始关联）
        hackathon: project.hackathon,
        
        // 团队信息
        team: project.team,
        
        // 提交历史
        submissions: project.submissions.map((sub: any) => ({
          id: sub.id,
          hackathon: sub.hackathon,
          submittedAt: sub.submittedAt,
          status: sub.status,
          statusDisplay: getSubmissionStatusDisplay(sub.status, t),
          notes: sub.notes,
          withdrawnAt: sub.withdrawnAt,
          withdrawReason: sub.withdrawReason
        })),
        
        // 评分信息
        scores: project.scores,
        averageScore,
        
        // 统计信息
        stats: {
          likes: project._count.projectLikes,
          comments: project._count.projectComments,
          submissions: project._count.submissions
        }
      }
    })

    // 状态统计转换
    const stats = {
      total: totalCount,
      draft: statusStats.find(s => s.status === 'DRAFT')?._count._all || 0,
      readyToSubmit: statusStats.find(s => s.status === 'READY_TO_SUBMIT')?._count._all || 0,
      submitted: statusStats.find(s => s.status === 'SUBMITTED')?._count._all || 0,
      reviewed: statusStats.find(s => s.status === 'REVIEWED')?._count._all || 0,
      winner: statusStats.find(s => s.status === 'WINNER')?._count._all || 0,
      rejected: statusStats.find(s => s.status === 'REJECTED')?._count._all || 0
    }

    return NextResponse.json({
      success: true,
      data: {
        projects: projectsWithDetails,
        pagination: {
          page: validatedQuery.page,
          limit: validatedQuery.limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / validatedQuery.limit),
          hasNext: validatedQuery.page * validatedQuery.limit < totalCount,
          hasPrev: validatedQuery.page > 1
        },
        stats,
        filters: {
          status: validatedQuery.status,
          search: validatedQuery.search
        }
      }
    })

  } catch (error) {
    console.error('获取用户项目数据错误:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch projects' 
    }, { status: 500 })
  }
}

// 辅助函数：获取项目状态显示文本（国际化）
function getProjectStatusDisplay(status: string, t: any): string {
  const statusKey = `projects.status.${status.toLowerCase()}`
  try {
    return t(statusKey)
  } catch {
    return status
  }
}

// 辅助函数：获取提交状态显示文本（国际化）
function getSubmissionStatusDisplay(status: string, t: any): string {
  const statusKey = `projects.submissionStatus.${status.toLowerCase()}`
  try {
    return t(statusKey)
  } catch {
    return status
  }
}