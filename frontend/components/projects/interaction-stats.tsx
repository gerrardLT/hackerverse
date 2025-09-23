'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Heart, 
  MessageSquare, 
  MessageCircle, 
  TrendingUp,
  Users,
  Activity,
  Clock,
  Loader2
} from 'lucide-react'
import { apiService } from '@/lib/api'
import { formatDistanceToNow } from 'date-fns'
import { zhCN, enUS } from 'date-fns/locale'
import { useLocale } from 'next-intl'

interface InteractionData {
  project: {
    id: string
    title: string
    createdAt: string
  }
  stats: {
    likes: number
    comments: number
    feedbacks: number
    engagementScore: number
    daysSinceCreation: number
  }
  userInteractions: {
    isLiked: boolean
    hasCommented: boolean
    hasFeedback: boolean
  }
  recentActivity: {
    comments: Array<{
      id: string
      content: string
      createdAt: string
      user: {
        id: string
        username: string
        avatarUrl?: string
      }
    }>
    likers: Array<{
      user: {
        id: string
        username: string
        avatarUrl?: string
      }
      likedAt: string
    }>
  }
  summary: {
    totalInteractions: number
    mostActiveType: 'likes' | 'comments' | 'feedbacks'
    isActive: boolean
  }
}

interface InteractionStatsProps {
  projectId: string
  className?: string
}

export function InteractionStats({ projectId, className }: InteractionStatsProps) {
  const t = useTranslations('projects.interactions')
  const locale = useLocale()
  
  const [data, setData] = useState<InteractionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadInteractionStats = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await apiService.get(`/projects/${projectId}/interactions`)
        
        if (response.success) {
          setData(response.data)
        } else {
          throw new Error(response.error || '加载统计数据失败')
        }
      } catch (error) {
        console.error('加载交互统计失败:', error)
        setError(error instanceof Error ? error.message : '加载失败')
      } finally {
        setIsLoading(false)
      }
    }

    if (projectId) {
      loadInteractionStats()
    }
  }, [projectId])

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: locale === 'zh' ? zhCN : enUS
    })
  }

  const getEngagementLevel = (score: number) => {
    if (score >= 10) return { level: 'high', color: 'text-green-600', bg: 'bg-green-100' }
    if (score >= 5) return { level: 'medium', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    return { level: 'low', color: 'text-gray-600', bg: 'bg-gray-100' }
  }

  const getMostActiveTypeIcon = (type: string) => {
    switch (type) {
      case 'likes': return <Heart className="h-4 w-4" />
      case 'comments': return <MessageSquare className="h-4 w-4" />
      case 'feedbacks': return <MessageCircle className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const getMostActiveTypeLabel = (type: string) => {
    switch (type) {
      case 'likes': return t('mostActive.likes')
      case 'comments': return t('mostActive.comments')
      case 'feedbacks': return t('mostActive.feedbacks')
      default: return t('mostActive.general')
    }
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-muted-foreground">{t('loading')}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">{error || t('loadError')}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const engagement = getEngagementLevel(data.stats.engagementScore)

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <CardTitle>{t('title')}</CardTitle>
          </div>
          <Badge 
            variant="secondary" 
            className={`${engagement.bg} ${engagement.color}`}
          >
            {t(`engagement.${engagement.level}`)}
          </Badge>
        </div>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 主要统计数据 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-2">
              <Heart className="h-4 w-4 text-red-500" />
              <span className="text-2xl font-bold">{data.stats.likes}</span>
            </div>
            <p className="text-xs text-muted-foreground">{t('stats.likes')}</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-2">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              <span className="text-2xl font-bold">{data.stats.comments}</span>
            </div>
            <p className="text-xs text-muted-foreground">{t('stats.comments')}</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-2">
              <MessageCircle className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">{data.stats.feedbacks}</span>
            </div>
            <p className="text-xs text-muted-foreground">{t('stats.feedbacks')}</p>
          </div>
        </div>

        <Separator />

        {/* 活跃度指标 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">{t('engagementScore')}</span>
            </div>
            <span className="text-sm font-bold">{data.stats.engagementScore}</span>
          </div>
          
          <Progress 
            value={Math.min(data.stats.engagementScore * 5, 100)} 
            className="h-2"
          />
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t('totalInteractions')}: {data.summary.totalInteractions}</span>
            <span>{t('daysSince')}: {data.stats.daysSinceCreation}</span>
          </div>
        </div>

        <Separator />

        {/* 最活跃类型 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getMostActiveTypeIcon(data.summary.mostActiveType)}
            <span className="text-sm font-medium">{t('mostActiveType')}</span>
          </div>
          <span className="text-sm">
            {getMostActiveTypeLabel(data.summary.mostActiveType)}
          </span>
        </div>

        {/* 最近活动 */}
        {(data.recentActivity.comments.length > 0 || data.recentActivity.likers.length > 0) && (
          <>
            <Separator />
            
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>{t('recentActivity')}</span>
              </h4>
              
              {/* 最近评论 */}
              {data.recentActivity.comments.length > 0 && (
                <div className="space-y-3">
                  <h5 className="text-xs text-muted-foreground">{t('recentComments')}</h5>
                  <div className="space-y-2">
                    {data.recentActivity.comments.slice(0, 3).map((comment) => (
                      <div key={comment.id} className="flex space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={comment.user.avatarUrl} alt={comment.user.username} />
                          <AvatarFallback className="text-xs">
                            {comment.user.username.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-medium truncate">
                              {comment.user.username}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 最近点赞 */}
              {data.recentActivity.likers.length > 0 && (
                <div className="space-y-3">
                  <h5 className="text-xs text-muted-foreground">{t('recentLikes')}</h5>
                  <div className="flex items-center space-x-2">
                    <div className="flex -space-x-2">
                      {data.recentActivity.likers.slice(0, 5).map((liker, index) => (
                        <Avatar key={liker.user.id} className="h-6 w-6 border-2 border-background">
                          <AvatarImage src={liker.user.avatarUrl} alt={liker.user.username} />
                          <AvatarFallback className="text-xs">
                            {liker.user.username.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    {data.recentActivity.likers.length > 5 && (
                      <span className="text-xs text-muted-foreground">
                        +{data.recentActivity.likers.length - 5} {t('more')}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* 用户互动状态 */}
        {(data.userInteractions.isLiked || data.userInteractions.hasCommented || data.userInteractions.hasFeedback) && (
          <>
            <Separator />
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>{t('yourInteractions')}</span>
              </h4>
              
              <div className="flex flex-wrap gap-2">
                {data.userInteractions.isLiked && (
                  <Badge variant="secondary" className="text-xs">
                    <Heart className="h-3 w-3 mr-1" />
                    {t('youLiked')}
                  </Badge>
                )}
                {data.userInteractions.hasCommented && (
                  <Badge variant="secondary" className="text-xs">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    {t('youCommented')}
                  </Badge>
                )}
                {data.userInteractions.hasFeedback && (
                  <Badge variant="secondary" className="text-xs">
                    <MessageCircle className="h-3 w-3 mr-1" />
                    {t('youFeedback')}
                  </Badge>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
