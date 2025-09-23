import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'

// 查询参数验证模式
const querySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('20'),
  includeComments: z.string().transform(v => v === 'true').default('true'),
  status: z.enum(['pending', 'approved', 'rejected', 'under_review', 'all']).default('all'),
  action: z.enum(['submit', 'approve', 'reject', 'request_changes', 'all']).default('all')
})

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())
    
    // 验证查询参数
    const validatedQuery = querySchema.parse(query)
    
    // 获取国际化函数
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)

    // 验证用户身份
    const user = await auth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: t('auth.unauthorized') },
        { status: 401 }
      )
    }

    // 检查用户是否有审核权限
    if (!['ADMIN', 'MODERATOR'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: t('auth.forbidden') },
        { status: 403 }
      )
    }

    // 检查黑客松是否存在
    const hackathon = await prisma.hackathon.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        status: true,
        reviewStatus: true,
        submittedForReviewAt: true,
        reviewedAt: true,
        organizer: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    })

    if (!hackathon) {
      return NextResponse.json(
        { success: false, error: t('admin.hackathons.notFound') },
        { status: 404 }
      )
    }

    // 构建查询条件
    const where: any = {
      hackathonId: id
    }

    if (validatedQuery.status !== 'all') {
      where.status = validatedQuery.status
    }

    if (validatedQuery.action !== 'all') {
      where.action = validatedQuery.action
    }

    // 计算分页
    const skip = (validatedQuery.page - 1) * validatedQuery.limit

    // 查询审核历史
    const [reviews, total] = await Promise.all([
      prisma.hackathonReview.findMany({
        where,
        skip,
        take: validatedQuery.limit,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          reviewer: {
            select: {
              id: true,
              username: true,
              role: true,
              avatarUrl: true
            }
          },
          comments: validatedQuery.includeComments ? {
            orderBy: {
              createdAt: 'asc'
            },
            include: {
              commenter: {
                select: {
                  id: true,
                  username: true,
                  role: true,
                  avatarUrl: true
                }
              },
              replies: {
                include: {
                  commenter: {
                    select: {
                      id: true,
                      username: true,
                      role: true,
                      avatarUrl: true
                    }
                  }
                }
              }
            }
          } : false
        }
      }),
      prisma.hackathonReview.count({ where })
    ])

    // 获取审核统计信息
    const reviewStats = await prisma.hackathonReview.groupBy({
      by: ['status', 'action'],
      where: {
        hackathonId: id
      },
      _count: true,
      _avg: {
        score: true
      }
    })

    // 计算总审核时间
    const totalReviewTime = await prisma.hackathonReview.aggregate({
      where: {
        hackathonId: id,
        actualTime: { not: null }
      },
      _sum: {
        actualTime: true
      },
      _avg: {
        actualTime: true
      }
    })

    // 获取最新审核信息
    const latestReview = reviews[0]

    // 计算审核进度时间线
    const timeline = await prisma.hackathonReview.findMany({
      where: {
        hackathonId: id
      },
      select: {
        action: true,
        status: true,
        createdAt: true,
        reviewer: {
          select: {
            username: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    const totalPages = Math.ceil(total / validatedQuery.limit)

    return NextResponse.json({
      success: true,
      data: {
        hackathon: {
          id: hackathon.id,
          title: hackathon.title,
          status: hackathon.status,
          reviewStatus: hackathon.reviewStatus,
          submittedForReviewAt: hackathon.submittedForReviewAt,
          reviewedAt: hackathon.reviewedAt,
          organizer: hackathon.organizer
        },
        reviews,
        statistics: {
          total,
          byStatus: reviewStats.reduce((acc, stat) => {
            const key = `${stat.status}_${stat.action}`
            acc[key] = {
              count: stat._count,
              averageScore: stat._avg.score
            }
            return acc
          }, {} as Record<string, any>),
          totalReviewTime: totalReviewTime._sum.actualTime || 0,
          averageReviewTime: totalReviewTime._avg.actualTime || 0,
          reviewCount: reviews.length
        },
        timeline,
        latestReview,
        pagination: {
          page: validatedQuery.page,
          limit: validatedQuery.limit,
          total,
          totalPages
        }
      }
    })

  } catch (error) {
    console.error('获取黑客松审核历史失败:', error)
    
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: t('validation.invalidParams') },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: t('admin.hackathons.historyError') },
      { status: 500 }
    )
  }
}
