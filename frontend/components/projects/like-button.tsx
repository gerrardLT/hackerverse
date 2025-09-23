'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Heart, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { apiService } from '@/lib/api'
import { cn } from '@/lib/utils'

interface LikeButtonProps {
  projectId: string
  initialLiked?: boolean
  initialCount?: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'ghost' | 'outline'
  showCount?: boolean
  className?: string
  onLikeChange?: (liked: boolean, count: number) => void
}

export function LikeButton({
  projectId,
  initialLiked = false,
  initialCount = 0,
  size = 'md',
  variant = 'ghost',
  showCount = true,
  className,
  onLikeChange
}: LikeButtonProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const t = useTranslations('projects.like')
  
  const [isLiked, setIsLiked] = useState(initialLiked)
  const [likeCount, setLikeCount] = useState(initialCount)
  const [isLoading, setIsLoading] = useState(false)

  const handleLike = useCallback(async () => {
    if (!user) {
      toast({
        title: t('loginRequired'),
        description: t('loginRequiredDesc'),
        variant: 'destructive',
      })
      return
    }

    if (isLoading) return

    setIsLoading(true)

    try {
      if (isLiked) {
        // 取消点赞
        const response = await apiService.delete(`/projects/${projectId}/like`)
        
        if (response.success) {
          const newCount = response.data.likeCount
          setIsLiked(false)
          setLikeCount(newCount)
          onLikeChange?.(false, newCount)
          
          toast({
            title: t('unlikeSuccess'),
            description: t('unlikeSuccessDesc'),
          })
        } else {
          throw new Error(response.error || t('unlikeFailed'))
        }
      } else {
        // 点赞
        const response = await apiService.post(`/projects/${projectId}/like`)
        
        if (response.success) {
          const newCount = response.data.likeCount
          setIsLiked(true)
          setLikeCount(newCount)
          onLikeChange?.(true, newCount)
          
          toast({
            title: t('likeSuccess'),
            description: t('likeSuccessDesc'),
          })
        } else {
          throw new Error(response.error || t('likeFailed'))
        }
      }
    } catch (error) {
      console.error('点赞操作失败:', error)
      toast({
        title: t('operationFailed'),
        description: error instanceof Error ? error.message : t('networkError'),
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [user, isLiked, isLoading, projectId, onLikeChange, toast, t])

  const sizeClasses = {
    sm: 'h-8 px-2 text-xs',
    md: 'h-9 px-3 text-sm',
    lg: 'h-10 px-4 text-base'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLike}
      disabled={isLoading}
      className={cn(
        'group relative transition-all duration-200',
        isLiked && variant === 'ghost' && 'text-red-600 hover:text-red-700',
        isLiked && variant === 'default' && 'bg-red-600 hover:bg-red-700',
        isLiked && variant === 'outline' && 'border-red-600 text-red-600 hover:bg-red-50',
        sizeClasses[size],
        className
      )}
      aria-label={isLiked ? t('unlike') : t('like')}
    >
      {isLoading ? (
        <Loader2 className={cn('animate-spin', iconSizes[size])} />
      ) : (
        <Heart
          className={cn(
            'transition-all duration-200',
            iconSizes[size],
            isLiked ? 'fill-current scale-110' : 'scale-100 group-hover:scale-110'
          )}
        />
      )}
      
      {showCount && (
        <span className={cn(
          'ml-1 font-medium tabular-nums',
          size === 'sm' && 'ml-1',
          size === 'md' && 'ml-1.5',
          size === 'lg' && 'ml-2'
        )}>
          {likeCount.toLocaleString()}
        </span>
      )}
      
      {/* 点赞动画效果 */}
      {isLiked && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Heart className={cn(
              'text-red-500 fill-current animate-ping opacity-75',
              iconSizes[size]
            )} />
          </div>
        </div>
      )}
    </Button>
  )
}

// 简化版本的点赞按钮，只显示图标
export function SimpleLikeButton({
  projectId,
  initialLiked = false,
  className,
  onLikeChange
}: {
  projectId: string
  initialLiked?: boolean
  className?: string
  onLikeChange?: (liked: boolean) => void
}) {
  return (
    <LikeButton
      projectId={projectId}
      initialLiked={initialLiked}
      size="sm"
      variant="ghost"
      showCount={false}
      className={className}
      onLikeChange={(liked, count) => onLikeChange?.(liked)}
    />
  )
}

// 带计数的点赞按钮
export function LikeButtonWithCount({
  projectId,
  initialLiked = false,
  initialCount = 0,
  className,
  onLikeChange
}: {
  projectId: string
  initialLiked?: boolean
  initialCount?: number
  className?: string
  onLikeChange?: (liked: boolean, count: number) => void
}) {
  return (
    <LikeButton
      projectId={projectId}
      initialLiked={initialLiked}
      initialCount={initialCount}
      size="md"
      variant="outline"
      showCount={true}
      className={className}
      onLikeChange={onLikeChange}
    />
  )
}
