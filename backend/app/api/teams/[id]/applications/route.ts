import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'

// 查询参数验证
const querySchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']).optional(),
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(50)).default('10'),
})

// 获取团队申请列表
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    const teamId = params.id
    
    // 验证用户身份
    const user = await auth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: t('auth.unauthorized') },
        { status: 401 }
      )
    }

    // 解析查询参数
    const { searchParams } = new URL(request.url)
    const validatedQuery = querySchema.parse({
      status: searchParams.get('status') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
    })

    // 检查团队是否存在且用户是否为团队领导
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        id: true,
        name: true,
        leaderId: true
      }
    })

    if (!team) {
      return NextResponse.json(
        { success: false, error: t('teams.notFound') },
        { status: 404 }
      )
    }

    if (team.leaderId !== user.id) {
      return NextResponse.json(
        { success: false, error: t('teams.onlyLeaderCanViewApplications', { fallback: 'Only team leader can view applications' }) },
        { status: 403 }
      )
    }

    // 构建查询条件
    const where: any = {
      teamId: teamId
    }

    if (validatedQuery.status) {
      where.status = validatedQuery.status
    }

    // 计算分页
    const skip = (validatedQuery.page - 1) * validatedQuery.limit

    // 查询申请列表
    const [applications, total] = await Promise.all([
      prisma.teamApplication.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: validatedQuery.limit,
        select: {
          id: true,
          message: true,
          skills: true,
          status: true,
          createdAt: true,
          reviewedAt: true,
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              bio: true,
              skills: true,
              reputationScore: true
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
      prisma.teamApplication.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: {
        applications,
        pagination: {
          page: validatedQuery.page,
          limit: validatedQuery.limit,
          total,
          totalPages: Math.ceil(total / validatedQuery.limit)
        }
      }
    })

  } catch (error) {
    console.error('获取团队申请列表错误:', error)
    
    const locale = getLocaleFromRequest(request)
    const t = createTFunction(locale)
    
    return NextResponse.json(
      { success: false, error: t('teams.getApplicationsError', { fallback: 'Failed to get applications list' }) },
      { status: 500 }
    )
  }
}
