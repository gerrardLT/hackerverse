'use client'

import { useState, useCallback } from 'react'
import { securityService, type ModerationResult } from '@/lib/security'

export interface ContentModerationHook {
  moderateContent: (content: string, userId: string, contentType: 'post' | 'comment' | 'message') => Promise<ModerationResult>
  isLoading: boolean
  error: string | null
}

export function useContentModeration(): ContentModerationHook {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const moderateContent = useCallback(async (
    content: string, 
    userId: string, 
    contentType: 'post' | 'comment' | 'message'
  ): Promise<ModerationResult> => {
    setIsLoading(true)
    setError(null)

    try {
      // 模拟异步处理
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const result = securityService.moderateContent(content, userId, contentType)
      
      // 如果内容被拒绝，记录违规
      if (result.action === 'reject' && result.violations.length > 0) {
        const highestSeverityViolation = result.violations.reduce((prev, current) => {
          const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 }
          return severityOrder[current.severity as keyof typeof severityOrder] > 
                 severityOrder[prev.severity as keyof typeof severityOrder] ? current : prev
        })

        securityService.recordViolation({
          userId,
          type: 'inappropriate',
          severity: highestSeverityViolation.severity as any,
          content: content.substring(0, 200),
          action: result.action === 'reject' ? 'content_removal' : 'warning'
        })
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '内容审核失败'
      setError(errorMessage)
      
      // 返回默认的安全结果
      return {
        isAllowed: false,
        riskScore: 100,
        violations: [],
        action: 'reject',
        reason: errorMessage
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    moderateContent,
    isLoading,
    error
  }
}
