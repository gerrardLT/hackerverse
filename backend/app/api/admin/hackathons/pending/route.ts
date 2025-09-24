import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'

// 查询参数验证模式
const querySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('20'),
  status: z.enum(['PENDING_REVIEW', 'APPROVED', 'REJECTED', 'all']).default('PENDING_REVIEW'),
  priority: z.enum(['low', 'normal', 'high', 'urgent', 'all']).default('all'),
  category: z.enum(['content', 'legal', 'technical', 'business', 'all']).default('all'),
  sortBy: z.enum(['submittedForReviewAt', 'createdAt', 'title', 'prizePool']).default('submittedForReviewAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional()
})

export async function GET(request: NextRequest) {
  try {
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

    // 构建基础查询条件
    const where: any = {}
    
    // 状态过滤
    if (validatedQuery.status !== 'all') {
      where.status = validatedQuery.status
    } else {
      // 如果是"all"，只显示需要审核的状态
      where.status = {
        in: ['PENDING_REVIEW', 'APPROVED', 'REJECTED']
      }
    }
    
    // 搜索条件
    if (validatedQuery.search) {
      where.OR = [
        { title: { contains: validatedQuery.search, mode: 'insensitive' } },
        { description: { contains: validatedQuery.search, mode: 'insensitive' } },
        { organizer: { username: { contains: validatedQuery.search, mode: 'insensitive' } } }
      ]
    }

    // 计算分页
    const skip = (validatedQuery.page - 1) * validatedQuery.limit

    // 构建排序
    const orderBy: any = {}
    orderBy[validatedQuery.sortBy] = validatedQuery.sortOrder


    // 查询待审核黑客松
    const [hackathonsRaw, total] = await Promise.all([
      prisma.hackathon.findMany({
        where,
        skip,
        take: validatedQuery.limit,
        orderBy,
        include: {
          organizer: {
            select: {
              id: true,
              username: true,
              email: true,
              role: true,
              reputationScore: true,
              avatarUrl: true
            }
          },
          reviewer: {
            select: {
              id: true,
              username: true,
              role: true
            }
          },
          hackathonReviews: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 1,
            include: {
              reviewer: {
                select: {
                  username: true
                }
              }
            }
          },
          _count: {
            select: {
              participations: true,
              projects: true,
              teams: true
            }
          }
        }
      }),
      prisma.hackathon.count({ where })
    ])

    // 手动排除 BigInt 字段以避免序列化错误
    const hackathons = hackathonsRaw.map(hackathon => {
      const { blockNumber, gasUsed, ...hackathonWithoutBigInt } = hackathon
      return hackathonWithoutBigInt
    })


    // 获取每个黑客松的详细审核统计
    const enrichedHackathons = await Promise.all(
      hackathons.map(async (hackathon) => {
        const reviewStats = await prisma.hackathonReview.groupBy({
          by: ['status'],
          where: {
            hackathonId: hackathon.id
          },
          _count: true
        })

        // 计算平均评分
        const avgScore = await prisma.hackathonReview.aggregate({
          where: {
            hackathonId: hackathon.id,
            score: { not: null }
          },
          _avg: {
            score: true
          }
        })

        // 计算待审核时间
        const daysSinceSubmission = hackathon.submittedForReviewAt 
          ? Math.floor((Date.now() - new Date(hackathon.submittedForReviewAt).getTime()) / (1000 * 60 * 60 * 24))
          : null

        return {
          ...hackathon,
          reviewStats: reviewStats.reduce((acc, stat) => {
            acc[stat.status] = stat._count
            return acc
          }, {} as Record<string, number>),
          averageScore: avgScore._avg.score,
          daysSinceSubmission,
          isUrgent: daysSinceSubmission !== null && daysSinceSubmission > 7, // 超过7天视为紧急
          latestReview: hackathon.hackathonReviews[0] || null
        }
      })
    )

    const totalPages = Math.ceil(total / validatedQuery.limit)

    return NextResponse.json({
      success: true,
      data: {
        hackathons: enrichedHackathons,
        pagination: {
          page: validatedQuery.page,
          limit: validatedQuery.limit,
          total,
          totalPages
        },
        filters: {
          applied: {
            status: validatedQuery.status,
            priority: validatedQuery.priority,
            category: validatedQuery.category,
            search: validatedQuery.search
          }
        }
      }
    })

  } catch (error) {
    console.error('获取待审核黑客松失败:', error)
    
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: t('validation.invalidParams') },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: t('admin.hackathons.loadError') },
      { status: 500 }
    )
  }
}
