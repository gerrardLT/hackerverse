import { NextRequest, NextResponse } from 'next/server'
import { ErrorHandler } from '@/lib/error-handler'
import { ApiResponseHandler } from '@/lib/api-response'
import { auth } from '@/lib/auth'

/**
 * 获取系统监控数据
 * GET /api/admin/system-monitor
 */
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const user = await auth(request)
    if (!user || user.role !== 'ADMIN') {
      return ApiResponseHandler.forbidden('需要管理员权限')
    }

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '24h'
    const type = searchParams.get('type') || 'all'

    // 计算时间范围
    let startTime: Date
    const endTime = new Date()

    switch (timeRange) {
      case '1h':
        startTime = new Date(Date.now() - 60 * 60 * 1000)
        break
      case '6h':
        startTime = new Date(Date.now() - 6 * 60 * 60 * 1000)
        break
      case '24h':
        startTime = new Date(Date.now() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        break
      default:
        startTime = new Date(Date.now() - 24 * 60 * 60 * 1000)
    }

    // 根据请求类型返回数据
    switch (type) {
      case 'logs':
        const logs = ErrorHandler.getLogs({
          startTime,
          endTime
        })
        return ApiResponseHandler.success({
          logs: logs.slice(0, 100), // 限制返回数量
          total: logs.length
        })

      case 'metrics':
        const metrics = ErrorHandler.getMetrics({
          startTime,
          endTime
        })
        return ApiResponseHandler.success({
          metrics: metrics.slice(0, 100),
          total: metrics.length
        })

      case 'report':
        const report = ErrorHandler.generateErrorReport({
          startTime,
          endTime
        })
        return ApiResponseHandler.success(report)

      default:
        // 返回概览数据
        const overviewLogs = ErrorHandler.getLogs({
          startTime,
          endTime
        })
        const overviewMetrics = ErrorHandler.getMetrics({
          startTime,
          endTime
        })

        const overview = {
          timeRange,
          statistics: {
            totalRequests: overviewMetrics.length,
            totalErrors: overviewLogs.filter(log => log.level === 'error').length,
            totalWarnings: overviewLogs.filter(log => log.level === 'warn').length,
            averageResponseTime: overviewMetrics.length > 0 
              ? overviewMetrics.reduce((sum, m) => sum + m.duration, 0) / overviewMetrics.length
              : 0,
            errorRate: overviewMetrics.length > 0 
              ? (overviewLogs.filter(log => log.level === 'error').length / overviewMetrics.length) * 100
              : 0
          },
          recentErrors: overviewLogs
            .filter(log => log.level === 'error')
            .slice(0, 10),
          slowestEndpoints: ErrorHandler.generateErrorReport({
            startTime,
            endTime
          }).summary.slowestEndpoints.slice(0, 5),
          systemHealth: {
            memoryUsage: process.memoryUsage(),
            uptime: process.uptime(),
            nodeVersion: process.version,
            platform: process.platform
          }
        }

        return ApiResponseHandler.success(overview)
    }

  } catch (error) {
    console.error('获取系统监控数据失败:', error)
    return ApiResponseHandler.handleError(error)
  }
}

/**
 * 清理旧日志
 * DELETE /api/admin/system-monitor
 */
export async function DELETE(request: NextRequest) {
  try {
    // 验证管理员权限
    const user = await auth(request)
    if (!user || user.role !== 'ADMIN') {
      return ApiResponseHandler.forbidden('需要管理员权限')
    }

    const { searchParams } = new URL(request.url)
    const maxAge = parseInt(searchParams.get('maxAge') || '7') * 24 * 60 * 60 * 1000 // 默认7天

    // 清理旧日志
    ErrorHandler.cleanupOldLogs(maxAge)

    return ApiResponseHandler.success({
      message: '日志清理完成',
      maxAge: maxAge / (24 * 60 * 60 * 1000) + ' 天'
    })

  } catch (error) {
    console.error('清理日志失败:', error)
    return ApiResponseHandler.handleError(error)
  }
}