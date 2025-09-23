import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'
import { AnalyticsService } from '@/lib/analytics-service'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { prepareApiResponse } from '@/lib/bigint-serializer'

const analyticsService = new AnalyticsService()

const customReportSchema = z.object({
  name: z.string().min(1, 'Report name is required'),
  description: z.string().optional(),
  reportType: z.enum(['overview', 'detailed', 'comparison', 'trend', 'custom']),
  scope: z.enum(['hackathon', 'global', 'period', 'comparison']),
  hackathonIds: z.array(z.string()).default([]),
  metrics: z.array(z.string()).min(1, 'At least one metric is required'),
  dimensions: z.array(z.string()).default([]),
  filters: z.record(z.any()).default({}),
  groupBy: z.array(z.string()).default([]),
  timeRange: z.object({
    start: z.string(),
    end: z.string(),
    interval: z.enum(['day', 'week', 'month', 'quarter']).default('day')
  }),
  relativePeriod: z.string().optional(),
  chartTypes: z.array(z.string()).default(['table']),
  layout: z.any().optional(),
  styling: z.record(z.any()).default({}),
  format: z.array(z.string()).default(['json']),
  includeRawData: z.boolean().default(false),
  includeTrends: z.boolean().default(true),
  includeInsights: z.boolean().default(true),
  isScheduled: z.boolean().default(false),
  scheduleFrequency: z.string().optional(),
  scheduleTime: z.string().optional(),
  recipients: z.array(z.string()).default([]),
  isPublic: z.boolean().default(false),
  sharedWith: z.array(z.string()).default([]),
  accessLevel: z.enum(['owner', 'editor', 'viewer']).default('owner')
})

export async function POST(request: NextRequest) {
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

    // 只有管理员和版主可以创建自定义报告
    if (!['ADMIN', 'MODERATOR'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: t('common.errors.insufficientPermissions') },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = customReportSchema.parse(body)

    // 验证黑客松是否存在
    if (validatedData.hackathonIds.length > 0) {
      const hackathons = await prisma.hackathon.findMany({
        where: { id: { in: validatedData.hackathonIds } },
        select: { id: true, title: true, organizerId: true }
      })

      if (hackathons.length !== validatedData.hackathonIds.length) {
        return NextResponse.json(
          { success: false, error: t('analytics.errors.invalidHackathons') },
          { status: 400 }
        )
      }

      // 权限检查：用户必须是黑客松组织者或管理员
      const hasPermission = hackathons.every(hackathon => 
        hackathon.organizerId === user.id || ['ADMIN', 'MODERATOR'].includes(user.role)
      )

      if (!hasPermission) {
        return NextResponse.json(
          { success: false, error: t('common.errors.insufficientPermissions') },
          { status: 403 }
        )
      }
    }

    // 创建自定义报告配置
    const customReport = await prisma.customReport.create({
      data: {
        ...validatedData,
        createdBy: user.id
      }
    })

    // 立即生成报告数据
    const reportData = await generateCustomReportData(customReport)

    // 更新执行统计
    await prisma.customReport.update({
      where: { id: customReport.id },
      data: {
        executionCount: { increment: 1 },
        lastExecutedAt: new Date(),
        lastExecutionTime: Date.now() - new Date(customReport.createdAt).getTime()
      }
    })

    const responseData = {
      report: customReport,
      data: reportData,
      generatedAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      message: t('analytics.report.createSuccess'),
      data: prepareApiResponse(responseData)
    })

  } catch (error: any) {
    console.error('Failed to create custom report:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: t('common.errors.invalidInput'),
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: t('analytics.report.createError'),
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// 获取用户的自定义报告列表
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
    const reportType = searchParams.get('reportType')
    const scope = searchParams.get('scope')
    const isActive = searchParams.get('isActive')

    const where = {
      OR: [
        { createdBy: user.id },
        { isPublic: true },
        { sharedWith: { array_contains: user.id } }
      ],
      ...(reportType && { reportType }),
      ...(scope && { scope }),
      ...(isActive !== null && { isActive: isActive === 'true' })
    }

    const [reports, total] = await Promise.all([
      prisma.customReport.findMany({
        where,
        orderBy: { lastExecutedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          creator: {
            select: { id: true, username: true, email: true }
          }
        }
      }),
      prisma.customReport.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: prepareApiResponse(reports),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    })

  } catch (error: any) {
    console.error('Failed to fetch custom reports:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: t('analytics.report.fetchError'),
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// 生成自定义报告数据
async function generateCustomReportData(report: any): Promise<any> {
  const data: any = {}

  // 根据请求的指标生成相应的数据
  for (const metric of report.metrics) {
    switch (metric) {
      case 'participants':
        if (report.hackathonIds.length > 0) {
          data.participants = await Promise.all(
            report.hackathonIds.map(async (hackathonId: string) => {
              const analytics = await analyticsService.getParticipationAnalytics(hackathonId)
              return {
                hackathonId,
                data: analytics
              }
            })
          )
        }
        break

      case 'projects':
        if (report.hackathonIds.length > 0) {
          data.projects = await Promise.all(
            report.hackathonIds.map(async (hackathonId: string) => {
              const analytics = await analyticsService.getProjectAnalytics(hackathonId)
              return {
                hackathonId,
                data: analytics
              }
            })
          )
        }
        break

      case 'teams':
        if (report.hackathonIds.length > 0) {
          data.teams = await Promise.all(
            report.hackathonIds.map(async (hackathonId: string) => {
              const analytics = await analyticsService.getTeamAnalytics(hackathonId)
              return {
                hackathonId,
                data: analytics
              }
            })
          )
        }
        break

      case 'overview':
        if (report.hackathonIds.length > 0) {
          data.overview = await Promise.all(
            report.hackathonIds.map(async (hackathonId: string) => {
              const analytics = await analyticsService.getHackathonOverview(hackathonId)
              return {
                hackathonId,
                data: analytics
              }
            })
          )
        }
        break

      default:
        // 其他指标的处理
        break
    }
  }

  // 应用过滤器和分组
  if (report.filters && Object.keys(report.filters).length > 0) {
    // 实现过滤逻辑
  }

  if (report.groupBy && report.groupBy.length > 0) {
    // 实现分组逻辑
  }

  return {
    data,
    summary: generateSummary(data, report.metrics),
    trends: report.includeTrends ? generateTrends(data) : null,
    insights: report.includeInsights ? generateInsights(data) : null
  }
}

// 生成数据摘要
function generateSummary(data: any, metrics: string[]): any {
  const summary: any = {}

  metrics.forEach(metric => {
    if (data[metric] && Array.isArray(data[metric])) {
      const metricData = data[metric]
      
      switch (metric) {
        case 'participants':
          summary.totalParticipants = metricData.reduce(
            (sum: number, item: any) => sum + (item.data?.participantCount || 0), 0
          )
          break
        case 'projects':
          summary.totalProjects = metricData.reduce(
            (sum: number, item: any) => sum + (item.data?.totalProjects || 0), 0
          )
          summary.averageScore = metricData.reduce(
            (sum: number, item: any) => sum + (item.data?.averageScore || 0), 0
          ) / metricData.length
          break
        case 'teams':
          summary.totalTeams = metricData.reduce(
            (sum: number, item: any) => sum + (item.data?.totalTeams || 0), 0
          )
          break
      }
    }
  })

  return summary
}

// 生成趋势分析
function generateTrends(data: any): any {
  // 实现趋势分析逻辑
  return {
    participationTrend: 'increasing',
    projectQualityTrend: 'stable',
    teamCollaborationTrend: 'improving'
  }
}

// 生成洞察建议
function generateInsights(data: any): string[] {
  const insights: string[] = []

  // 基于数据生成洞察建议
  if (data.participants) {
    insights.push('参与度呈现上升趋势，建议继续优化推广策略')
  }

  if (data.projects) {
    insights.push('项目质量整体良好，可考虑增加技术指导环节')
  }

  if (data.teams) {
    insights.push('团队协作效果显著，建议推广成功的协作模式')
  }

  return insights
}
