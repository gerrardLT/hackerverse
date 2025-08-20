'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Shield, AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useContentModeration } from '@/hooks/use-content-moderation'
import { cn } from '@/lib/utils'

interface SecureFormProps {
  onSubmit: (content: string) => void | Promise<void>
  contentType: 'post' | 'comment' | 'message'
  userId: string
  placeholder?: string
  className?: string
  disabled?: boolean
  minLength?: number
  maxLength?: number
  showRealTimeCheck?: boolean
}

export function SecureForm({
  onSubmit,
  contentType,
  userId,
  placeholder = '输入内容...',
  className,
  disabled = false,
  minLength = 10,
  maxLength = 2000,
  showRealTimeCheck = true
}: SecureFormProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [moderationResult, setModerationResult] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)
  
  const { moderateContent, isLoading: isModerating, error } = useContentModeration()

  // 实时内容检查
  useEffect(() => {
    if (!showRealTimeCheck || !content.trim() || content.length < minLength) {
      setModerationResult(null)
      return
    }

    const debounceTimer = setTimeout(async () => {
      try {
        const result = await moderateContent(content, userId, contentType)
        setModerationResult(result)
      } catch (err) {
        console.error('实时检查失败', err)
      }
    }, 1000)

    return () => clearTimeout(debounceTimer)
  }, [content, moderateContent, userId, contentType, showRealTimeCheck, minLength])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim() || content.length < minLength) {
      return
    }

    setIsSubmitting(true)

    try {
      // 最终安全检查
      const finalCheck = await moderateContent(content, userId, contentType)
      
      if (!finalCheck.isAllowed) {
        setModerationResult(finalCheck)
        return
      }

      // 提交内容
      await onSubmit(content)
      
      // 清空表单
      setContent('')
      setModerationResult(null)
    } catch (err) {
      console.error('提交失败:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-600'
    if (score >= 60) return 'text-orange-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'approve':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'review':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'reject':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Shield className="h-4 w-4 text-gray-600" />
    }
  }

  const isContentValid = content.trim().length >= minLength && content.length <= maxLength
  const canSubmit = isContentValid && !isModerating && !isSubmitting && 
                   (!moderationResult || moderationResult.isAllowed)

  return (
    <div className={cn('space-y-4', className)}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            disabled={disabled || isSubmitting}
            className={cn(
              'min-h-[120px] resize-none',
              moderationResult && !moderationResult.isAllowed && 'border-red-300 focus:border-red-500'
            )}
            maxLength={maxLength}
          />
          
          {/* 字数统计 */}
          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
            <span className={content.length > maxLength * 0.9 ? 'text-orange-600' : ''}>
              {content.length}/{maxLength}
            </span>
          </div>
        </div>

        {/* 实时安全检查结果 */}
        {showRealTimeCheck && moderationResult && (
          <Alert className={moderationResult.isAllowed ? 'border-green-200' : 'border-red-200'}>
            <div className="flex items-center gap-2">
              {getActionIcon(moderationResult.action)}
              <AlertDescription>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">安全检查</span>
                    <Badge className={moderationResult.isAllowed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {moderationResult.action === 'approve' ? '通过' : 
                       moderationResult.action === 'review' ? '需要审核' : '不通过'}
                    </Badge>
                    <span className={`text-sm font-medium ${getRiskColor(moderationResult.riskScore)}`}>
                      风险分数: {moderationResult.riskScore}
                    </span>
                  </div>
                  
                  {moderationResult.violations.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium mb-1">检测到的违规</p>
                      <div className="space-y-1">
                        {moderationResult.violations.map((violation: any, index: number) => (
                          <div key={index} className="text-sm text-red-600">
                            • {violation.type}: {violation.description}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* 错误提示 */}
        {error && (
          <Alert className="border-red-200">
            <AlertDescription className="text-red-600">
              安全检查服务暂时不可用，请稍后重试
            </AlertDescription>
          </Alert>
        )}

        {/* 操作按钮 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>内容将经过安全检查</span>
            {isModerating && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              disabled={!content.trim()}
            >
              {showPreview ? '隐藏预览' : '预览'}
            </Button>
            
            <Button
              type="submit"
              disabled={!canSubmit}
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  提交中...
                </>
              ) : (
                '提交'
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* 预览区域 */}
      {showPreview && content.trim() && (
        <div className="mt-4 p-4 border rounded-lg bg-muted/50">
          <h4 className="font-medium mb-2">预览</h4>
          <div className="prose prose-sm max-w-none">
            {content}
          </div>
        </div>
      )}
    </div>
  )
}
