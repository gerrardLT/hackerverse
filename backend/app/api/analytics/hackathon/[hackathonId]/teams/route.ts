import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'
import { AnalyticsService } from '@/lib/analytics-service'
import { prisma } from '@/lib/prisma'

const analyticsService = new AnalyticsService()

export async function GET(
  request: NextRequest,
  { params }: { params: { hackathonId: string } }
) {
  const locale = getLocaleFromRequest(request)
  const t = createTFunction(locale)

  try {
    const user = await auth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: t('common.errors.unauthenticated') },
        { status: 401 }
      )
    }

    const { hackathonId } = params

    // 验证黑客松是否存在
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: hackathonId },
      select: { id: true, title: true, organizerId: true }
    })

    if (!hackathon) {
      return NextResponse.json(
        { success: false, error: t('analytics.errors.hackathonNotFound') },
        { status: 404 }
      )
    }

    // 权限检查：只有黑客松组织者或管理员可以查看分析数据
    if (hackathon.organizerId !== user.id && !['ADMIN', 'MODERATOR'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: t('common.errors.insufficientPermissions') },
        { status: 403 }
      )
    }

    // 检查缓存
    const cacheKey = `hackathon:teams:${hackathonId}`
    let data = await analyticsService.getCachedAnalyticsData(cacheKey)

    if (!data) {
      // 生成团队协作分析数据
      data = await analyticsService.getTeamAnalytics(hackathonId)
      
      // 缓存数据（45分钟）
      await analyticsService.cacheAnalyticsData(
        cacheKey,
        'teams',
        data,
        hackathonId,
        2700
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        hackathon: {
          id: hackathon.id,
          title: hackathon.title
        },
        generatedAt: new Date().toISOString(),
        cached: !!data
      }
    })

  } catch (error: any) {
    console.error('Failed to get team analytics:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: t('analytics.errors.teamsFailed'),
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
