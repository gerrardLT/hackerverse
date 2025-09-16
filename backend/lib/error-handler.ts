import { NextRequest, NextResponse } from 'next/server'
import { ApiResponseHandler, ErrorCode } from './api-response'

// 错误日志接口
export interface ErrorLog {
  timestamp: string
  level: 'error' | 'warn' | 'info'
  message: string
  stack?: string
  requestId?: string
  userId?: string
  endpoint?: string
  method?: string
  userAgent?: string
  ip?: string
  details?: any
}

// 性能监控接口
export interface PerformanceMetric {
  timestamp: string
  endpoint: string
  method: string
  duration: number
  status: number
  userId?: string
  memoryUsage?: NodeJS.MemoryUsage
}

/**
 * 增强的错误处理和日志系统
 */
export class ErrorHandler {
  private static logs: ErrorLog[] = []
  private static metrics: PerformanceMetric[] = []
  private static readonly MAX_LOGS = 1000
  private static readonly MAX_METRICS = 1000

  /**
   * 记录错误日志
   */
  static logError(
    error: Error | string,
    context?: {
      requestId?: string
      userId?: string
      endpoint?: string
      method?: string
      userAgent?: string
      ip?: string
      details?: any
    }
  ): void {
    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      ...context
    }

    // 添加到内存日志（生产环境应该使用外部日志服务）
    this.logs.push(errorLog)
    
    // 保持日志数量在限制内
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.shift()
    }

    // 控制台输出（开发环境）
    if (process.env.NODE_ENV === 'development') {
      console.error('🔴 Error logged:', errorLog)
    }

    // 这里可以集成外部日志服务
    // 例如: Sentry, LogRocket, Datadog 等
    this.sendToExternalLoggingService(errorLog)
  }

  /**
   * 记录警告日志
   */
  static logWarning(
    message: string,
    context?: {
      requestId?: string
      userId?: string
      endpoint?: string
      details?: any
    }
  ): void {
    const warningLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      ...context
    }

    this.logs.push(warningLog)
    
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.shift()
    }

    if (process.env.NODE_ENV === 'development') {
      console.warn('🟡 Warning logged:', warningLog)
    }
  }

  /**
   * 记录信息日志
   */
  static logInfo(
    message: string,
    context?: {
      requestId?: string
      userId?: string
      endpoint?: string
      details?: any
    }
  ): void {
    const infoLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      ...context
    }

    this.logs.push(infoLog)
    
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.shift()
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('🔵 Info logged:', infoLog)
    }
  }

  /**
   * 记录性能指标
   */
  static logPerformance(metric: PerformanceMetric): void {
    this.metrics.push(metric)
    
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift()
    }

    // 性能警告阈值
    if (metric.duration > 3000) { // 3秒以上
      this.logWarning(`Slow API response: ${metric.endpoint}`, {
        endpoint: metric.endpoint,
        details: { duration: metric.duration }
      })
    }
  }

  /**
   * 获取错误日志
   */
  static getLogs(filter?: {
    level?: 'error' | 'warn' | 'info'
    startTime?: Date
    endTime?: Date
    userId?: string
    endpoint?: string
  }): ErrorLog[] {
    let filteredLogs = [...this.logs]

    if (filter) {
      if (filter.level) {
        filteredLogs = filteredLogs.filter(log => log.level === filter.level)
      }
      
      if (filter.startTime) {
        filteredLogs = filteredLogs.filter(log => 
          new Date(log.timestamp) >= filter.startTime!
        )
      }
      
      if (filter.endTime) {
        filteredLogs = filteredLogs.filter(log => 
          new Date(log.timestamp) <= filter.endTime!
        )
      }
      
      if (filter.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === filter.userId)
      }
      
      if (filter.endpoint) {
        filteredLogs = filteredLogs.filter(log => 
          log.endpoint?.includes(filter.endpoint!)
        )
      }
    }

    return filteredLogs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }

  /**
   * 获取性能指标
   */
  static getMetrics(filter?: {
    startTime?: Date
    endTime?: Date
    endpoint?: string
  }): PerformanceMetric[] {
    let filteredMetrics = [...this.metrics]

    if (filter) {
      if (filter.startTime) {
        filteredMetrics = filteredMetrics.filter(metric => 
          new Date(metric.timestamp) >= filter.startTime!
        )
      }
      
      if (filter.endTime) {
        filteredMetrics = filteredMetrics.filter(metric => 
          new Date(metric.timestamp) <= filter.endTime!
        )
      }
      
      if (filter.endpoint) {
        filteredMetrics = filteredMetrics.filter(metric => 
          metric.endpoint.includes(filter.endpoint!)
        )
      }
    }

    return filteredMetrics.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }

  /**
   * 发送到外部日志服务
   */
  private static sendToExternalLoggingService(log: ErrorLog): void {
    // 这里可以集成 Sentry、LogRocket 等服务
    
    // 示例：Sentry 集成
    if (process.env.SENTRY_DSN && typeof window === 'undefined') {
      try {
        // const Sentry = require('@sentry/node')
        // Sentry.captureException(new Error(log.message), {
        //   tags: {
        //     endpoint: log.endpoint,
        //     userId: log.userId
        //   },
        //   extra: log.details
        // })
      } catch (error) {
        console.error('Failed to send to Sentry:', error)
      }
    }

    // 示例：自定义日志服务
    if (process.env.CUSTOM_LOG_ENDPOINT) {
      try {
        fetch(process.env.CUSTOM_LOG_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.LOG_API_TOKEN}`
          },
          body: JSON.stringify(log)
        }).catch(err => {
          console.error('Failed to send to custom log service:', err)
        })
      } catch (error) {
        console.error('Failed to send to custom log service:', error)
      }
    }
  }

  /**
   * 清理旧日志
   */
  static cleanupOldLogs(maxAge: number = 7 * 24 * 60 * 60 * 1000): void {
    const cutoffTime = new Date(Date.now() - maxAge)
    
    this.logs = this.logs.filter(log => 
      new Date(log.timestamp) > cutoffTime
    )
    
    this.metrics = this.metrics.filter(metric => 
      new Date(metric.timestamp) > cutoffTime
    )
  }

  /**
   * 生成错误报告
   */
  static generateErrorReport(timeRange: {
    startTime: Date
    endTime: Date
  }): {
    summary: {
      totalErrors: number
      totalWarnings: number
      totalInfo: number
      avgResponseTime: number
      slowestEndpoints: Array<{
        endpoint: string
        avgDuration: number
        count: number
      }>
    }
    details: {
      logs: ErrorLog[]
      metrics: PerformanceMetric[]
    }
  } {
    const logs = this.getLogs(timeRange)
    const metrics = this.getMetrics(timeRange)

    const errorCount = logs.filter(log => log.level === 'error').length
    const warningCount = logs.filter(log => log.level === 'warn').length
    const infoCount = logs.filter(log => log.level === 'info').length

    const avgResponseTime = metrics.length > 0 
      ? metrics.reduce((sum, metric) => sum + metric.duration, 0) / metrics.length
      : 0

    // 分析最慢的端点
    const endpointStats = new Map<string, { totalDuration: number, count: number }>()
    
    metrics.forEach(metric => {
      const existing = endpointStats.get(metric.endpoint) || { totalDuration: 0, count: 0 }
      endpointStats.set(metric.endpoint, {
        totalDuration: existing.totalDuration + metric.duration,
        count: existing.count + 1
      })
    })

    const slowestEndpoints = Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        avgDuration: stats.totalDuration / stats.count,
        count: stats.count
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 10)

    return {
      summary: {
        totalErrors: errorCount,
        totalWarnings: warningCount,
        totalInfo: infoCount,
        avgResponseTime,
        slowestEndpoints
      },
      details: {
        logs,
        metrics
      }
    }
  }
}

/**
 * API 中间件包装器
 */
export function withErrorHandling(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    const startTime = Date.now()
    const requestId = Math.random().toString(36).substring(2, 15)
    const endpoint = req.nextUrl.pathname
    const method = req.method

    try {
      // 记录请求开始
      ErrorHandler.logInfo(`API request started: ${method} ${endpoint}`, {
        requestId,
        endpoint,
        method,
        userAgent: req.headers.get('user-agent') || undefined,
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined
      })

      // 执行处理器
      const response = await handler(req, context)
      
      // 记录性能指标
      const duration = Date.now() - startTime
      ErrorHandler.logPerformance({
        timestamp: new Date().toISOString(),
        endpoint,
        method,
        duration,
        status: response.status,
        memoryUsage: process.memoryUsage()
      })

      return response

    } catch (error) {
      const duration = Date.now() - startTime

      // 记录错误
      ErrorHandler.logError(error instanceof Error ? error : new Error(String(error)), {
        requestId,
        endpoint,
        method,
        userAgent: req.headers.get('user-agent') || undefined,
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
        details: { duration }
      })

      // 记录失败的性能指标
      ErrorHandler.logPerformance({
        timestamp: new Date().toISOString(),
        endpoint,
        method,
        duration,
        status: 500,
        memoryUsage: process.memoryUsage()
      })

      // 返回统一的错误响应
      return ApiResponseHandler.handleError(error)
    }
  }
}