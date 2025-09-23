'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Activity,
  Calendar,
  Code,
  Trophy,
  Users,
  Star,
  MessageSquare,
  ChevronDown,
  Clock,
  ExternalLink
} from 'lucide-react'
import { apiService } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface ActivityItem {
  id: string
  type: string
  title: string
  description: string
  date: string
  metadata?: any
}

interface ActivityStats {
  total: number
  byType: Record<string, number>
}

export function ActivityTimeline() {
  const { toast } = useToast()
  const t = useTranslations('dashboard.activity')
  
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [stats, setStats] = useState<ActivityStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [activeType, setActiveType] = useState('all')
  const [offset, setOffset] = useState(0)

  // 加载活动数据
  const loadActivities = async (type?: string, reset = false) => {
    try {
      if (reset) {
        setLoading(true)
        setOffset(0)
      } else {
        setLoadingMore(true)
      }

      const currentOffset = reset ? 0 : offset
      const response = await apiService.getDashboardActivity({
        type,
        limit: 10,
        offset: currentOffset
      })

      if (response.success && response.data) {
        const newActivities = response.data.activities || []
        const newStats = response.data.stats || null

        if (reset) {
          setActivities(newActivities)
        } else {
          setActivities(prev => [...prev, ...newActivities])
        }

        setStats(newStats)
        setHasMore(newActivities.length === 10)
        setOffset(currentOffset + newActivities.length)
      }
    } catch (error) {
      console.error('加载活动失败:', error)
      toast({
        title: t('loadFailed'),
        description: t('loadFailedDesc'),
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    let isMounted = true
    
    const initLoad = async () => {
      if (isMounted) {
        await loadActivities()
      }
    }
    
    initLoad()
    
    return () => {
      isMounted = false
    }
  }, [])

  // 获取活动图标
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'hackathon_joined': return <Calendar className="w-4 h-4" />
      case 'project_submitted': return <Code className="w-4 h-4" />
      case 'prize_won': return <Trophy className="w-4 h-4" />
      case 'team_joined': return <Users className="w-4 h-4" />
      case 'project_liked': return <Star className="w-4 h-4" />
      case 'community_posted': return <MessageSquare className="w-4 h-4" />
      case 'reputation_gained': return <Activity className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  // 获取活动颜色
  const getActivityColor = (type: string) => {
    switch (type) {
      case 'hackathon_joined': return 'text-blue-500'
      case 'project_submitted': return 'text-green-500'
      case 'prize_won': return 'text-yellow-500'
      case 'team_joined': return 'text-purple-500'
      case 'project_liked': return 'text-pink-500'
      case 'community_posted': return 'text-cyan-500'
      case 'reputation_gained': return 'text-orange-500'
      default: return 'text-gray-500'
    }
  }

  // 获取活动类型名称
  const getActivityTypeName = (type: string) => {
    return t(`types.${type}`) || t('types.hackathon_joined')
  }

  // 处理类型切换
  const handleTypeChange = async (type: string) => {
    setActiveType(type)
    await loadActivities(type === 'all' ? undefined : type, true)
  }

  // 加载更多
  const handleLoadMore = async () => {
    await loadActivities(activeType === 'all' ? undefined : activeType, false)
  }

  // 格式化时间
  const formatTime = (date: string) => {
    const now = new Date()
    const activityDate = new Date(date)
    const diffInSeconds = Math.floor((now.getTime() - activityDate.getTime()) / 1000)
    
    if (diffInSeconds < 60) return t('time.justNow')
    if (diffInSeconds < 3600) return t('time.minutesAgo', { minutes: Math.floor(diffInSeconds / 60) })
    if (diffInSeconds < 86400) return t('time.hoursAgo', { hours: Math.floor(diffInSeconds / 3600) })
    if (diffInSeconds < 2592000) return t('time.daysAgo', { days: Math.floor(diffInSeconds / 86400) })
    
    return activityDate.toLocaleDateString()
  }

  const activityTypes = stats ? Object.keys(stats.byType) : []

  return (
    <div className="space-y-6">
      {/* 活动统计 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass border border-primary/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-lg font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">{t('totalActivities')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {Object.entries(stats.byType).slice(0, 3).map(([type, count]) => (
            <Card key={type} className="glass border border-primary/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className={getActivityColor(type)}>
                    {getActivityIcon(type)}
                  </div>
                  <div>
                    <p className="text-lg font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">
                      {getActivityTypeName(type)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 活动列表 */}
      <Card className="glass border border-primary/10">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {t('title')}
              </CardTitle>
              <CardDescription>
                {t('description')}
              </CardDescription>
            </div>

            {/* 类型筛选 */}
            {activityTypes.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={activeType === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTypeChange('all')}
                  className="text-xs"
                >
                  {t('all')}
                </Button>
                {activityTypes.map(type => (
                  <Button
                    key={type}
                    variant={activeType === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleTypeChange(type)}
                    className="text-xs"
                  >
                    {getActivityTypeName(type)}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                    <div className="h-3 bg-muted rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div
                  key={`${activity.type}_${activity.id}_${index}`}
                  className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted/30 transition-colors border-l-2 border-l-primary/30"
                >
                  {/* 活动图标 */}
                  <div className={`w-10 h-10 rounded-full bg-background border border-primary/20 flex items-center justify-center ${getActivityColor(activity.type)}`}>
                    {getActivityIcon(activity.type)}
                  </div>

                  {/* 活动内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-foreground truncate">
                        {activity.title}
                      </h4>
                      <Badge variant="secondary" className="text-xs">
                        {getActivityTypeName(activity.type)}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {activity.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(activity.date)}
                      </div>

                      {/* 相关链接 */}
                      {activity.metadata?.url && (
                        <Link 
                          href={activity.metadata.url}
                          className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {t('viewDetails')}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* 加载更多按钮 */}
              {hasMore && (
                <div className="text-center pt-4">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="gap-2"
                  >
                    {loadingMore ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        {t('loading')}
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        {t('loadMore')}
                      </>
                    )}
                  </Button>
                </div>
              )}

              {activities.length === 0 && (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{t('noActivity')}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}