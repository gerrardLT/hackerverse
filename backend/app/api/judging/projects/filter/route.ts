import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'
import { z } from 'zod'

// 项目过滤查询参数验证
const projectFilterSchema = z.object({
  hackathonId: z.string().optional(),
  technologies: z.string().optional(), // 逗号分隔的技术栈
  tags: z.string().optional(), // 逗号分隔的标签
  tracks: z.string().optional(), // 逗号分隔的赛道
  status: z.enum(['all', 'draft', 'ready', 'submitted', 'reviewed', 'winner', 'rejected']).optional().default('all'),
  scoreStatus: z.enum(['all', 'unscored', 'partial', 'completed', 'finalized']).optional().default('all'),
  search: z.string().optional(), // 搜索关键词
  sortBy: z.enum(['title', 'created', 'updated', 'score', 'likes', 'comments']).optional().default('created'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  minScore: z.coerce.number().min(0).max(10).optional(),
  maxScore: z.coerce.number().min(0).max(10).optional(),
  dateFrom: z.string().optional(), // ISO日期字符串
  dateTo: z.string().optional(), // ISO日期字符串
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0)
})

/**
 * 高级项目过滤API
 * GET /api/judging/projects/filter
 * 
 * 支持多维度过滤：
 * - hackathonId: 黑客松ID
 * - technologies: 技术栈过滤（逗号分隔）
 * - tags: 标签过滤（逗号分隔）
 * - tracks: 赛道过滤（逗号分隔）
 * - status: 项目状态过滤
 * - scoreStatus: 评分状态过滤
 * - search: 标题和描述搜索
 * - sortBy: 排序字段
 * - sortOrder: 排序顺序
 * - minScore/maxScore: 分数范围过滤
 * - dateFrom/dateTo: 时间范围过滤
 * - limit/offset: 分页参数
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
    const validatedQuery = projectFilterSchema.parse(query)

    console.log('🔍 评委项目过滤查询:', user.id, validatedQuery)

    // 获取评委分配信息
    let judgeAssignments: any[] = []
    if (user.role === 'JUDGE') {
      const judgeFilter: any = { userId: user.id }
      if (validatedQuery.hackathonId) {
        judgeFilter.hackathonId = validatedQuery.hackathonId
      }

      judgeAssignments = await prisma.judge.findMany({
        where: judgeFilter,
        select: {
          id: true,
          hackathonId: true,
          assignedProjects: true
        }
      })
    }

    // 构建项目查询条件
    let projectWhere: any = {}

    // 权限控制：评委只能看到分配给自己的项目
    if (user.role === 'JUDGE' && judgeAssignments.length > 0) {
      const assignedProjectIds: string[] = []
      judgeAssignments.forEach(judge => {
        const projects = Array.isArray(judge.assignedProjects) 
          ? judge.assignedProjects as string[]
          : []
        assignedProjectIds.push(...projects)
      })

      if (assignedProjectIds.length > 0) {
        projectWhere.id = { in: assignedProjectIds }
      } else {
        // 如果没有分配项目，返回空结果
        return NextResponse.json({
          success: true,
          data: {
            projects: [],
            filters: {
              availableTechnologies: [],
              availableTags: [],
              availableTracks: [],
              hackathons: []
            },
            stats: {
              total: 0,
              byStatus: {},
              byScoreStatus: {}
            },
            pagination: {
              limit: validatedQuery.limit,
              offset: validatedQuery.offset,
              total: 0
            }
          }
        })
      }
    }

    // 黑客松过滤
    if (validatedQuery.hackathonId) {
      projectWhere.hackathonId = validatedQuery.hackathonId
    }

    // 项目状态过滤
    if (validatedQuery.status !== 'all') {
      switch (validatedQuery.status) {
        case 'draft':
          projectWhere.status = 'DRAFT'
          break
        case 'ready':
          projectWhere.status = 'READY_TO_SUBMIT'
          break
        case 'submitted':
          projectWhere.status = 'SUBMITTED'
          break
        case 'reviewed':
          projectWhere.status = 'REVIEWED'
          break
        case 'winner':
          projectWhere.status = 'WINNER'
          break
        case 'rejected':
          projectWhere.status = 'REJECTED'
          break
      }
    }

    // 技术栈过滤
    if (validatedQuery.technologies) {
      const techList = validatedQuery.technologies.split(',').map(t => t.trim()).filter(Boolean)
      if (techList.length > 0) {
        projectWhere.technologies = {
          path: '$',
          array_contains: techList
        }
      }
    }

    // 标签过滤
    if (validatedQuery.tags) {
      const tagList = validatedQuery.tags.split(',').map(t => t.trim()).filter(Boolean)
      if (tagList.length > 0) {
        projectWhere.tags = {
          path: '$',
          array_contains: tagList
        }
      }
    }

    // 赛道过滤（通过黑客松的tracks字段）
    if (validatedQuery.tracks) {
      const trackList = validatedQuery.tracks.split(',').map(t => t.trim()).filter(Boolean)
      if (trackList.length > 0) {
        projectWhere.hackathon = {
          tracks: {
            path: '$',
            array_contains: trackList
          }
        }
      }
    }

    // 文本搜索
    if (validatedQuery.search) {
      const searchTerm = validatedQuery.search.trim()
      if (searchTerm) {
        projectWhere.OR = [
          {
            title: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          },
          {
            description: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          }
        ]
      }
    }

    // 时间范围过滤
    const dateFilter: any = {}
    if (validatedQuery.dateFrom) {
      dateFilter.gte = new Date(validatedQuery.dateFrom)
    }
    if (validatedQuery.dateTo) {
      dateFilter.lte = new Date(validatedQuery.dateTo)
    }
    if (Object.keys(dateFilter).length > 0) {
      projectWhere.createdAt = dateFilter
    }

    // 评分状态过滤
    const judgeIds = judgeAssignments.map(j => j.id)
    if (validatedQuery.scoreStatus !== 'all' && judgeIds.length > 0) {
      switch (validatedQuery.scoreStatus) {
        case 'unscored':
          // 未评分
          projectWhere.scores = {
            none: {
              judgeId: { in: judgeIds }
            }
          }
          break
        case 'partial':
          // 部分评分（有评分但未最终确认）
          projectWhere.scores = {
            some: {
              AND: [
                { judgeId: { in: judgeIds } },
                { isFinalized: false }
              ]
            }
          }
          break
        case 'completed':
          // 评分完成（有总分）
          projectWhere.scores = {
            some: {
              AND: [
                { judgeId: { in: judgeIds } },
                { totalScore: { not: null } }
              ]
            }
          }
          break
        case 'finalized':
          // 最终确认
          projectWhere.scores = {
            some: {
              AND: [
                { judgeId: { in: judgeIds } },
                { isFinalized: true }
              ]
            }
          }
          break
      }
    }

    // 构建排序条件
    let orderBy: any = {}
    switch (validatedQuery.sortBy) {
      case 'title':
        orderBy.title = validatedQuery.sortOrder
        break
      case 'created':
        orderBy.createdAt = validatedQuery.sortOrder
        break
      case 'updated':
        orderBy.updatedAt = validatedQuery.sortOrder
        break
      case 'score':
        // 按平均分排序（需要使用聚合查询）
        orderBy.scores = {
          _avg: {
            totalScore: validatedQuery.sortOrder
          }
        }
        break
      case 'likes':
        orderBy.projectLikes = {
          _count: validatedQuery.sortOrder
        }
        break
      case 'comments':
        orderBy.projectComments = {
          _count: validatedQuery.sortOrder
        }
        break
      default:
        orderBy.createdAt = 'desc'
    }

    // 分数范围过滤
    if (validatedQuery.minScore !== undefined || validatedQuery.maxScore !== undefined) {
      const scoreFilter: any = {}
      if (validatedQuery.minScore !== undefined) {
        scoreFilter.gte = validatedQuery.minScore
      }
      if (validatedQuery.maxScore !== undefined) {
        scoreFilter.lte = validatedQuery.maxScore
      }

      if (!projectWhere.scores) {
        projectWhere.scores = {}
      }
      
      if (projectWhere.scores.some) {
        if (Array.isArray(projectWhere.scores.some.AND)) {
          projectWhere.scores.some.AND.push({
            totalScore: scoreFilter
          })
        } else {
          projectWhere.scores.some = {
            AND: [
              projectWhere.scores.some,
              { totalScore: scoreFilter }
            ]
          }
        }
      } else {
        projectWhere.scores.some = {
          totalScore: scoreFilter
        }
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
            status: true,
            tracks: true
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
              },
              take: 5 // 最多显示5个成员
            }
          }
        },
        scores: {
          where: judgeIds.length > 0 ? {
            judgeId: { in: judgeIds }
          } : {},
          select: {
            id: true,
            innovation: true,
            technicalComplexity: true,
            userExperience: true,
            businessPotential: true,
            presentation: true,
            totalScore: true,
            comments: true,
            isFinalized: true,
            finalizedAt: true,
            judge: {
              select: {
                id: true,
                userId: true,
                role: true
              }
            },
            createdAt: true,
            updatedAt: true
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
      orderBy,
      skip: validatedQuery.offset,
      take: validatedQuery.limit
    })

    // 获取过滤器选项数据
    const [availableTechnologies, availableTags, hackathons] = await Promise.all([
      // 获取可用技术栈
      prisma.$queryRaw`
        SELECT DISTINCT jsonb_array_elements_text(technologies) as technology
        FROM hackathon_schema.projects 
        WHERE ${projectWhere.hackathonId ? 
          prisma.$queryRaw`hackathon_id = ${projectWhere.hackathonId}` : 
          prisma.$queryRaw`true`
        }
        ORDER BY technology
      `,
      
      // 获取可用标签
      prisma.$queryRaw`
        SELECT DISTINCT jsonb_array_elements_text(tags) as tag
        FROM hackathon_schema.projects 
        WHERE ${projectWhere.hackathonId ? 
          prisma.$queryRaw`hackathon_id = ${projectWhere.hackathonId}` : 
          prisma.$queryRaw`true`
        }
        ORDER BY tag
      `,
      
      // 获取黑客松列表（评委有权限的）
      user.role === 'JUDGE' ? 
        prisma.hackathon.findMany({
          where: {
            id: {
              in: judgeAssignments.map(j => j.hackathonId)
            }
          },
          select: {
            id: true,
            title: true,
            status: true,
            tracks: true
          }
        }) :
        prisma.hackathon.findMany({
          select: {
            id: true,
            title: true,
            status: true,
            tracks: true
          },
          take: 50, // 限制数量
          orderBy: { createdAt: 'desc' }
        })
    ])

    // 获取统计数据
    const totalCount = await prisma.project.count({
      where: projectWhere
    })

    const statusStats = await prisma.project.groupBy({
      by: ['status'],
      where: projectWhere,
      _count: true
    })

    console.log('✅ 成功获取过滤项目数据:', {
      total: totalCount,
      returned: projects.length,
      filters: {
        technologies: availableTechnologies?.length || 0,
        tags: availableTags?.length || 0,
        hackathons: hackathons.length
      }
    })

    return NextResponse.json({
      success: true,
      data: {
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
            totalComments: project._count.projectComments,
            averageScore: project.scores.length > 0 
              ? project.scores.reduce((sum, score) => 
                  sum + (Number(score.totalScore) || 0), 0) / project.scores.length
              : null
          },
          githubUrl: project.githubUrl,
          demoUrl: project.demoUrl,
          videoUrl: project.videoUrl,
          presentationUrl: project.presentationUrl,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt
        })),
        filters: {
          availableTechnologies: (availableTechnologies as any[])?.map(t => t.technology) || [],
          availableTags: (availableTags as any[])?.map(t => t.tag) || [],
          availableTracks: hackathons.flatMap(h => 
            Array.isArray(h.tracks) ? h.tracks as string[] : []
          ).filter((track, index, arr) => arr.indexOf(track) === index),
          hackathons: hackathons.map(h => ({
            id: h.id,
            title: h.title,
            status: h.status,
            tracks: h.tracks
          }))
        },
        stats: {
          total: totalCount,
          byStatus: statusStats.reduce((acc, stat) => {
            acc[stat.status] = stat._count
            return acc
          }, {} as Record<string, number>)
        },
        pagination: {
          limit: validatedQuery.limit,
          offset: validatedQuery.offset,
          total: totalCount
        }
      }
    })

  } catch (error: any) {
    console.error('❌ 项目过滤查询失败:', error)
    
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
