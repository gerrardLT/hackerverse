import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'

// 审核请求验证模式
const reviewSchema = z.object({
  action: z.enum(['approve', 'reject', 'flag']),
  reason: z.string().optional(),
  reviewNotes: z.string().optional(),
  severity: z.enum(['low', 'normal', 'high', 'urgent']).optional()
})

interface RouteParams {
  params: {
    id: string
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const body = await request.json()
    
    // 验证请求体
    const validatedData = reviewSchema.parse(body)
    
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
      return NextResponse.json(
        { success: false, error: t('admin.content.modelNotAvailable') },
        { status: 503 }
      )
    }

    // 查找待审核的内容
    const contentReview = await (prisma as any).contentReview.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    })

    if (!contentReview) {
      return NextResponse.json(
        { success: false, error: t('admin.content.notFound') },
        { status: 404 }
      )
    }

    // 检查是否已经审核过
    if (contentReview.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: t('admin.content.alreadyReviewed') },
        { status: 400 }
      )
    }

    // 确定新状态
    let newStatus: string
    switch (validatedData.action) {
      case 'approve':
        newStatus = 'approved'
        break
      case 'reject':
        newStatus = 'rejected'
        break
      case 'flag':
        newStatus = 'flagged'
        break
      default:
        throw new Error('Invalid action')
    }

    // 获取请求IP和User-Agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // 在事务中更新审核状态和记录管理员操作
    const result = await prisma.$transaction(async (tx) => {
      // 更新审核记录
      const updatedReview = await (tx as any).contentReview.update({
        where: { id },
        data: {
          status: newStatus,
          reviewerId: user.id,
          reason: validatedData.reason,
          reviewNotes: validatedData.reviewNotes,
          reviewedAt: new Date()
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              email: true
            }
          },
          reviewer: {
            select: {
              id: true,
              username: true
            }
          }
        }
      })

      // 记录管理员操作
      if ((tx as any).adminAction) {
        await (tx as any).adminAction.create({
          data: {
            adminId: user.id,
            action: `content_${validatedData.action}`,
            targetType: contentReview.contentType,
            targetId: contentReview.contentId,
            targetTitle: contentReview.contentTitle || `${contentReview.contentType}_${contentReview.contentId}`,
            details: {
              reviewId: id,
              originalStatus: contentReview.status,
              newStatus,
              reason: validatedData.reason,
              reviewNotes: validatedData.reviewNotes,
              authorId: contentReview.authorId
            },
            ipAddress,
            userAgent,
            reason: validatedData.reason
          }
        })
      }

      // 如果是拒绝或标记，可能需要对实际内容采取行动
      if (validatedData.action === 'reject' && contentReview.contentType === 'post') {
        try {
          await tx.communityPost.update({
            where: { id: contentReview.contentId },
            data: { isDeleted: true }
          })
        } catch (error) {
          console.error('删除帖子失败:', error)
        }
      }

      return updatedReview
    })

    return NextResponse.json({
      success: true,
      data: result,
      message: t(`admin.content.${validatedData.action}Success`)
    })

  } catch (error) {
    console.error('内容审核操作失败:', error)
    
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: t('validation.invalidData') },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: t('admin.content.reviewError') },
      { status: 500 }
    )
  }
}
