'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Trophy,
  TrendingUp,
  Star,
  Award,
  BarChart3,
  Calendar,
  Activity,
  Target,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react'
import { ReputationBadge } from './reputation-badge'
import { apiService } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface ReputationUserProfileProps {
  userId: string
  showPrivateData?: boolean // 是否显示隐私数据（只有管理员或用户本人可以看到）
  compact?: boolean // 紧凑模式
  className?: string
}

interface UserReputationData {
  user: {
    id: string
    username: string
    avatarUrl?: string
    reputationScore: number
    createdAt: string
  }
  totalPoints: number
  records: Array<{
    id: string
    action: string
    points: number
    multiplier: number
    description?: string
    category: string
    season?: string
    createdAt: string
  }>
  byCategory: Array<{
    category: string
    points: number
    count: number
  }>
  byAction: Array<{
    action: string
    points: number
    count: number
  }>
}

function calculateLevel(points: number): number {
  // 等级计算公式：每1000分一级
  return Math.floor(points / 1000) + 1
}

function getPointsToNextLevel(points: number): number {
  const currentLevel = calculateLevel(points)
  const nextLevelPoints = currentLevel * 1000
  return nextLevelPoints - points
}

function formatRelativeTime(dateString: string, t: any): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffInMs = now.getTime() - date.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) return t('time.today')
  if (diffInDays === 1) return t('time.yesterday')
  if (diffInDays <= 7) return t('time.daysAgo', { days: diffInDays })
  if (diffInDays <= 30) return t('time.weeksAgo', { weeks: Math.floor(diffInDays / 7) })
  return t('time.monthsAgo', { months: Math.floor(diffInDays / 30) })
}

export function ReputationUserProfile({ 
  userId, 
  showPrivateData = false, 
  compact = false,
  className 
}: ReputationUserProfileProps) {
  const t = useTranslations('reputation')
  const tCommon = useTranslations('common')
  const { toast } = useToast()

  const [data, setData] = useState<UserReputationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showDetails, setShowDetails] = useState(false)

  const loadUserReputation = async () => {
    try {
      setLoading(true)
      const response = await apiService.getUserReputation(userId)

      if (response.success) {
        setData(response.data)
      } else {
        toast({
          title: t('fetchError'),
          description: response.error || t('networkError'),
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('加载用户声誉失败:', error)
      toast({
        title: t('fetchError'),
        description: t('networkError'),
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUserReputation()
  }, [userId])

  if (loading) {
    return (
      <Card className={cn("glass border border-primary/10", className)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-[200px]" />
            <Skeleton className="h-8 w-[120px]" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card className={cn("glass border border-primary/10", className)}>
        <CardHeader>
          <CardTitle>{t('userNotFound')}</CardTitle>
          <CardDescription>{t('fetchError')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={loadUserReputation} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            {tCommon('retry')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  const level = calculateLevel(data.totalPoints)
  const pointsToNextLevel = getPointsToNextLevel(data.totalPoints)
  const progressPercentage = ((data.totalPoints % 1000) / 1000) * 100

  if (compact) {
    return (
      <Card className={cn("glass border border-primary/10", className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <div className="font-semibold">{data.user.username}</div>
                <div className="text-sm text-muted-foreground">
                  {t('joinedAt', { date: new Date(data.user.createdAt).toLocaleDateString() })}
                </div>
              </div>
            </div>
            <ReputationBadge reputationScore={data.totalPoints} level={level} />
          </div>
          
          {showPrivateData && (
            <div className="mt-3 pt-3 border-t border-primary/10">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-sm text-muted-foreground">{t('categories.total')}</div>
                  <div className="font-semibold">{data.byCategory.length}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{t('records.total')}</div>
                  <div className="font-semibold">{data.records.length}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{t('level')}</div>
                  <div className="font-semibold">{level}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("glass border border-primary/10", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              {t('userProfile.title')}
            </CardTitle>
            <CardDescription>
              {data.user.username} • {t('userProfile.member')} {formatRelativeTime(data.user.createdAt, t)}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {showPrivateData && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            )}
            <ReputationBadge reputationScore={data.totalPoints} level={level} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 等级进度 */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{t('level')} {level}</span>
            <span>{t('pointsToNextLevel', { points: pointsToNextLevel })}</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* 统计概览 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-primary/5">
            <Star className="w-6 h-6 mx-auto mb-1 text-yellow-500" />
            <div className="text-lg font-bold">{data.totalPoints}</div>
            <div className="text-xs text-muted-foreground">{t('totalPoints')}</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-primary/5">
            <Award className="w-6 h-6 mx-auto mb-1 text-blue-500" />
            <div className="text-lg font-bold">{level}</div>
            <div className="text-xs text-muted-foreground">{t('currentLevel')}</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-primary/5">
            <Activity className="w-6 h-6 mx-auto mb-1 text-green-500" />
            <div className="text-lg font-bold">{data.records.length}</div>
            <div className="text-xs text-muted-foreground">{t('totalActivities')}</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-primary/5">
            <Target className="w-6 h-6 mx-auto mb-1 text-purple-500" />
            <div className="text-lg font-bold">{data.byCategory.length}</div>
            <div className="text-xs text-muted-foreground">{t('categories.active')}</div>
          </div>
        </div>

        {/* 详细信息（仅在有权限时显示） */}
        {showPrivateData && showDetails && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">{t('tabs.overview')}</TabsTrigger>
              <TabsTrigger value="categories">{t('tabs.categories')}</TabsTrigger>
              <TabsTrigger value="records">{t('tabs.records')}</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 分类统计 */}
                <Card className="border-primary/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">{t('categoryStats')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {data.byCategory.slice(0, 5).map((category) => (
                      <div key={category.category} className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {t(`categories.${category.category}`) || category.category}
                        </Badge>
                        <span className="text-sm font-medium">{category.points}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* 行为统计 */}
                <Card className="border-primary/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">{t('actionStats')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {data.byAction.slice(0, 5).map((action) => (
                      <div key={action.action} className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{action.action}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs">{action.count}x</span>
                          <span className="text-sm font-medium">{action.points}</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="categories" className="space-y-3">
              {data.byCategory.map((category) => (
                <div key={category.category} className="flex items-center justify-between p-3 rounded-lg bg-primary/5">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">
                      {t(`categories.${category.category}`) || category.category}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {category.count} {t('activities')}
                    </span>
                  </div>
                  <div className="text-lg font-bold">{category.points} {t('points')}</div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="records" className="space-y-3">
              <div className="max-h-64 overflow-y-auto space-y-2">
                {data.records.slice(0, 10).map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 rounded-lg bg-primary/5">
                    <div>
                      <div className="font-medium text-sm">{record.action}</div>
                      {record.description && (
                        <div className="text-xs text-muted-foreground">{record.description}</div>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatRelativeTime(record.createdAt, t)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">+{record.points}</div>
                      {record.multiplier > 1 && (
                        <div className="text-xs text-muted-foreground">×{record.multiplier}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
