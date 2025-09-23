import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'

// 审核请求验证模式
const reviewSchema = z.object({
  action: z.enum(['submit', 'approve', 'reject', 'request_changes']),
  status: z.enum(['pending', 'approved', 'rejected', 'under_review']).optional(),
  score: z.number().min(1).max(10).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  category: z.enum(['content', 'legal', 'technical', 'business']).optional(),
  feedback: z.string().optional(),
  rejectionReason: z.string().optional(),
  recommendedChanges: z.string().optional(),
  isPublic: z.boolean().default(false),
  estimatedTime: z.number().min(0).optional(), // 预计审核时间（分钟）
  hackathonStatus: z.enum(['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ACTIVE']).optional()
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

    // 查找黑客松
    const hackathon = await prisma.hackathon.findUnique({
      where: { id },
      include: {
        organizer: {
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

    if (!hackathon) {
      return NextResponse.json(
        { success: false, error: t('admin.hackathons.notFound') },
        { status: 404 }
      )
    }

    // 检查是否可以审核
    if (!['DRAFT', 'PENDING_REVIEW', 'REJECTED'].includes(hackathon.status)) {
      return NextResponse.json(
        { success: false, error: t('admin.hackathons.cannotReview') },
        { status: 400 }
      )
    }

    // 获取请求IP和User-Agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // 确定新的状态
    let newHackathonStatus = hackathon.status
    let reviewStatus = validatedData.status

    switch (validatedData.action) {
      case 'submit':
        newHackathonStatus = 'PENDING_REVIEW'
        reviewStatus = 'pending'
        break
      case 'approve':
        newHackathonStatus = validatedData.hackathonStatus || 'APPROVED'
        reviewStatus = 'approved'
        break
      case 'reject':
        newHackathonStatus = 'REJECTED'
        reviewStatus = 'rejected'
        break
      case 'request_changes':
        newHackathonStatus = 'DRAFT'
        reviewStatus = 'under_review'
        break
    }

    // 计算实际审核时间
    const actualTime = hackathon.submittedForReviewAt 
      ? Math.floor((Date.now() - new Date(hackathon.submittedForReviewAt).getTime()) / (1000 * 60))
      : null

    // 在事务中执行审核操作
    const result = await prisma.$transaction(async (tx) => {
      // 创建审核记录
      const review = await tx.hackathonReview.create({
        data: {
          hackathonId: id,
          reviewerId: user.id,
          action: validatedData.action,
          status: reviewStatus || 'pending',
          score: validatedData.score,
          priority: validatedData.priority,
          category: validatedData.category,
          feedback: validatedData.feedback,
          rejectionReason: validatedData.rejectionReason,
          recommendedChanges: validatedData.recommendedChanges,
          isPublic: validatedData.isPublic,
          estimatedTime: validatedData.estimatedTime,
          actualTime,
          ipAddress,
          userAgent,
          metadata: {
            originalStatus: hackathon.status,
            newStatus: newHackathonStatus,
            userAgent,
            locale
          }
        },
        include: {
          reviewer: {
            select: {
              id: true,
              username: true
            }
          }
        }
      })

      // 更新黑客松状态和审核信息
      const updatedHackathon = await tx.hackathon.update({
        where: { id },
        data: {
          status: newHackathonStatus,
          reviewStatus: reviewStatus,
          reviewerId: user.id,
          reviewNotes: validatedData.feedback,
          reviewedAt: new Date(),
          rejectionReason: validatedData.rejectionReason,
          submittedForReviewAt: validatedData.action === 'submit' ? new Date() : hackathon.submittedForReviewAt
        },
        include: {
          organizer: {
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

      // 记录管理员操作日志
      if ((tx as any).adminAction) {
        await (tx as any).adminAction.create({
          data: {
            adminId: user.id,
            action: `hackathon_${validatedData.action}`,
            targetType: 'hackathon',
            targetId: id,
            targetTitle: hackathon.title,
            details: {
              reviewId: review.id,
              originalStatus: hackathon.status,
              newStatus: newHackathonStatus,
              score: validatedData.score,
              priority: validatedData.priority,
              category: validatedData.category,
              feedback: validatedData.feedback,
              organizerId: hackathon.organizerId
            },
            ipAddress,
            userAgent,
            reason: validatedData.feedback || validatedData.rejectionReason
          }
        })
      }

      return { review, hackathon: updatedHackathon }
    })

    return NextResponse.json({
      success: true,
      data: result,
      message: t(`admin.hackathons.${validatedData.action}Success`)
    })

  } catch (error) {
    console.error('黑客松审核操作失败:', error)
    
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: t('validation.invalidData') },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: t('admin.hackathons.reviewError') },
      { status: 500 }
    )
  }
}
