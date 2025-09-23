import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getLocaleFromRequest, createTFunction } from '@/lib/i18n'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { reportId: string } }
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

    const { reportId } = params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'

    // 查找报告
    const report = await prisma.customReport.findUnique({
      where: { id: reportId },
      include: {
        creator: {
          select: { id: true, username: true }
        }
      }
    })

    if (!report) {
      return NextResponse.json(
        { success: false, error: t('analytics.report.notFound') },
        { status: 404 }
      )
    }

    // 权限检查
    const hasAccess = 
      report.createdBy === user.id ||
      report.isPublic ||
      (report.sharedWith as any[]).includes(user.id) ||
      ['ADMIN', 'MODERATOR'].includes(user.role)

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: t('common.errors.insufficientPermissions') },
        { status: 403 }
      )
    }

    // 重新生成报告数据（确保数据是最新的）
    const reportData = await generateReportData(report)

    // 根据格式导出数据
    switch (format.toLowerCase()) {
      case 'json':
        return NextResponse.json({
          success: true,
          data: {
            report: {
              id: report.id,
              name: report.name,
              description: report.description,
              createdBy: report.creator.username,
              createdAt: report.createdAt,
              lastExecutedAt: report.lastExecutedAt
            },
            ...reportData,
            exportedAt: new Date().toISOString(),
            format: 'json'
          }
        })

      case 'csv':
        const csvData = convertToCSV(reportData)
        return new NextResponse(csvData, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${report.name}_${new Date().toISOString().split('T')[0]}.csv"`
          }
        })

      case 'excel':
        // 这里可以集成 xlsx 库来生成 Excel 文件
        const excelData = await convertToExcel(reportData, report.name)
        return new NextResponse(excelData, {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${report.name}_${new Date().toISOString().split('T')[0]}.xlsx"`
          }
        })

      case 'pdf':
        // 这里可以集成 puppeteer 或其他 PDF 生成库
        return NextResponse.json(
          { success: false, error: t('analytics.export.pdfNotSupported') },
          { status: 501 }
        )

      default:
        return NextResponse.json(
          { success: false, error: t('analytics.export.unsupportedFormat') },
          { status: 400 }
        )
    }

  } catch (error: any) {
    console.error('Failed to export report:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: t('analytics.export.exportError'),
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// 生成报告数据（简化版本）
async function generateReportData(report: any): Promise<any> {
  // 这里应该根据报告配置重新生成数据
  // 为了简化，我们返回一个基本的数据结构
  
  const data: any = {
    summary: {},
    details: {},
    metadata: {
      reportId: report.id,
      reportName: report.name,
      reportType: report.reportType,
      scope: report.scope,
      generatedAt: new Date().toISOString(),
      hackathonIds: report.hackathonIds
    }
  }

  // 如果有黑客松ID，获取基础统计数据
  if (report.hackathonIds && report.hackathonIds.length > 0) {
    for (const hackathonId of report.hackathonIds) {
      // 获取基础统计
      const [participantCount, projectCount, teamCount] = await Promise.all([
        prisma.participation.count({ where: { hackathonId } }),
        prisma.project.count({ where: { hackathonId } }),
        prisma.team.count({ where: { hackathonId } })
      ])

      data.details[hackathonId] = {
        participants: participantCount,
        projects: projectCount,
        teams: teamCount
      }
    }

    // 生成汇总数据
    data.summary = {
      totalParticipants: Object.values(data.details).reduce(
        (sum: number, detail: any) => sum + detail.participants, 0
      ),
      totalProjects: Object.values(data.details).reduce(
        (sum: number, detail: any) => sum + detail.projects, 0
      ),
      totalTeams: Object.values(data.details).reduce(
        (sum: number, detail: any) => sum + detail.teams, 0
      )
    }
  }

  return data
}

// 转换为CSV格式
function convertToCSV(data: any): string {
  const headers = ['Metric', 'Value']
  const rows = []

  // 添加汇总数据
  if (data.summary) {
    Object.entries(data.summary).forEach(([key, value]) => {
      rows.push([key, String(value)])
    })
  }

  // 添加详细数据
  if (data.details) {
    Object.entries(data.details).forEach(([hackathonId, details]: [string, any]) => {
      rows.push([`Hackathon ${hackathonId}`, ''])
      Object.entries(details).forEach(([key, value]) => {
        rows.push([`  ${key}`, String(value)])
      })
    })
  }

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  return csvContent
}

// 转换为Excel格式（需要安装 xlsx 库）
async function convertToExcel(data: any, reportName: string): Promise<Buffer> {
  // 这里需要实际的 xlsx 库实现
  // 为了演示，我们返回一个模拟的 Excel 文件内容
  
  // 实际实现应该类似：
  // const XLSX = require('xlsx')
  // const workbook = XLSX.utils.book_new()
  // const worksheet = XLSX.utils.json_to_sheet(transformedData)
  // XLSX.utils.book_append_sheet(workbook, worksheet, 'Report')
  // return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  
  // 暂时返回一个简单的文本内容作为占位符
  const content = JSON.stringify(data, null, 2)
  return Buffer.from(content, 'utf-8')
}
