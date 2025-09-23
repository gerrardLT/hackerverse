import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'

// 查询参数验证模式
const querySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('20'),
  contentType: z.enum(['post', 'project', 'hackathon', 'comment', 'all']).default('all'),
  priority: z.enum(['low', 'normal', 'high', 'urgent', 'all']).default('all'),
  status: z.enum(['pending', 'approved', 'rejected', 'flagged', 'all']).default('pending'),
  sortBy: z.enum(['createdAt', 'priority', 'reportCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
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

    // 检查ContentReview模型是否可用
    if (!(prisma as any).contentReview) {
      return NextResponse.json({
        success: true,
        data: {
          items: [],
          pagination: {
            page: validatedQuery.page,
            limit: validatedQuery.limit,
            total: 0,
            totalPages: 0
          }
        }
      })
    }

    // 构建查询条件
    const where: any = {}
    
    if (validatedQuery.contentType !== 'all') {
      where.contentType = validatedQuery.contentType
    }
    
    if (validatedQuery.priority !== 'all') {
      where.priority = validatedQuery.priority
    }
    
    if (validatedQuery.status !== 'all') {
      where.status = validatedQuery.status
    }

    // 计算分页
    const skip = (validatedQuery.page - 1) * validatedQuery.limit

    // 构建排序
    const orderBy: any = {}
    orderBy[validatedQuery.sortBy] = validatedQuery.sortOrder

    // 查询待审核内容
    const [items, total] = await Promise.all([
      (prisma as any).contentReview.findMany({
        where,
        skip,
        take: validatedQuery.limit,
        orderBy,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              email: true,
              role: true
            }
          },
          reviewer: {
            select: {
              id: true,
              username: true
            }
          }
        }
      }),
      (prisma as any).contentReview.count({ where })
    ])

    // 获取实际内容详情
    const enrichedItems = await Promise.all(
      items.map(async (item: any) => {
        let contentDetails = null
        
        try {
          switch (item.contentType) {
            case 'post':
              contentDetails = await prisma.communityPost.findUnique({
                where: { id: item.contentId },
                select: {
                  title: true,
                  content: true,
                  createdAt: true,
                  isDeleted: true
                }
              })
              break
            case 'project':
              contentDetails = await prisma.project.findUnique({
                where: { id: item.contentId },
                select: {
                  title: true,
                  description: true,
                  createdAt: true
                }
              })
              break
            case 'hackathon':
              contentDetails = await prisma.hackathon.findUnique({
                where: { id: item.contentId },
                select: {
                  title: true,
                  description: true,
                  createdAt: true
                }
              })
              break
          }
        } catch (error) {
          console.error(`获取${item.contentType}内容详情失败:`, error)
        }

        return {
          ...item,
          contentDetails
        }
      })
    )

    const totalPages = Math.ceil(total / validatedQuery.limit)

    return NextResponse.json({
      success: true,
      data: {
        items: enrichedItems,
        pagination: {
          page: validatedQuery.page,
          limit: validatedQuery.limit,
          total,
          totalPages
        }
      }
    })

  } catch (error) {
    console.error('获取待审核内容失败:', error)
    
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    return NextResponse.json(
      { success: false, error: t('admin.content.loadError') },
      { status: 500 }
    )
  }
}
