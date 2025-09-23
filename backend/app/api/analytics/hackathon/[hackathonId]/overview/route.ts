import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'
import { AnalyticsService } from '@/lib/analytics-service'
import { prisma } from '@/lib/prisma'
import { prepareApiResponse } from '@/lib/bigint-serializer'

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
      where: { id: hackathonId }
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
    const cacheKey = `hackathon:overview:${hackathonId}`
    let data = await analyticsService.getCachedAnalyticsData(cacheKey)

    if (!data) {
      // 生成分析数据
      data = await analyticsService.getHackathonOverview(hackathonId)
      
      // 缓存数据（1小时）
      await analyticsService.cacheAnalyticsData(
        cacheKey,
        'overview',
        data,
        hackathonId,
        3600
      )
    }

    const responseData = {
      ...data,
      hackathon: {
        id: hackathon.id,
        title: hackathon.title,
        status: hackathon.status,
        startDate: hackathon.startDate,
        endDate: hackathon.endDate
      },
      generatedAt: new Date().toISOString(),
      cached: !!data
    }

    return NextResponse.json({
      success: true,
      data: prepareApiResponse(responseData)
    })

  } catch (error: any) {
    console.error('Failed to get hackathon overview analytics:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: t('analytics.errors.overviewFailed'),
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
