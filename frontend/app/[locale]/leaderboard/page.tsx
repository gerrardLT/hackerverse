'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Trophy,
  Medal,
  Award,
  TrendingUp,
  Calendar,
  Users,
  BarChart3,
  Filter,
  RefreshCw,
  Star,
  Crown,
  Gem,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { ReputationBadge } from '@/components/reputation/reputation-badge'
import { apiService } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface LeaderboardUser {
  userId: string
  username: string
  avatarUrl?: string
  bio?: string
  skills: string[]
  totalPoints: number
  rank: number
  joinedAt: string
}

interface LeaderboardData {
  leaderboard: LeaderboardUser[]
  meta: {
    timeRange: string
    category?: string
    totalUsers: number
    averageScore: number
    categoryStats: Array<{
      category: string
      totalPoints: number
      userCount: number
    }>
  }
  pagination: {
    limit: number
    offset: number
    hasMore: boolean
  }
}

const TIME_RANGES = [
  { value: 'all', label: 'All Time' },
  { value: 'season', label: 'This Season' },
  { value: 'month', label: 'This Month' },
  { value: 'week', label: 'This Week' }
]

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'general', label: 'General' },
  { value: 'hackathon', label: 'Hackathon' },
  { value: 'project', label: 'Project' },
  { value: 'community', label: 'Community' },
  { value: 'governance', label: 'Governance' }
]

function getRankIcon(rank: number) {
  if (rank === 1) return { icon: Trophy, color: 'text-yellow-500' }
  if (rank === 2) return { icon: Medal, color: 'text-gray-400' }
  if (rank === 3) return { icon: Award, color: 'text-amber-600' }
  return { icon: Star, color: 'text-muted-foreground' }
}

function getRankBadgeVariant(rank: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (rank === 1) return 'default'
  if (rank === 2) return 'secondary'
  if (rank === 3) return 'outline'
  return 'outline'
}

function formatPoints(points: number): string {
  if (points >= 1000000) {
    return `${(points / 1000000).toFixed(1)}M`
  }
  if (points >= 1000) {
    return `${(points / 1000).toFixed(1)}K`
  }
  return points.toString()
}

function UserCard({ user, showRankIcon = false }: { user: LeaderboardUser; showRankIcon?: boolean }) {
  const t = useTranslations('leaderboard')
  const rankConfig = getRankIcon(user.rank)
  const RankIcon = rankConfig.icon

  return (
    <Card className="transition-all hover:shadow-md glass border border-primary/10">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {/* 排名 */}
          <div className="flex flex-col items-center min-w-[60px]">
            {showRankIcon ? (
              <RankIcon className={`w-6 h-6 ${rankConfig.color}`} />
            ) : (
              <div className="text-2xl font-bold text-muted-foreground">
                #{user.rank}
              </div>
            )}
            <Badge variant={getRankBadgeVariant(user.rank)} className="mt-1">
              #{user.rank}
            </Badge>
          </div>

          {/* 用户信息 */}
          <div className="flex items-center gap-3 flex-1">
            <Avatar className="w-12 h-12">
              <AvatarImage src={user.avatarUrl} alt={user.username || 'User'} />
              <AvatarFallback>
                {(user.username || 'U').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <Link 
                href={`/users/${user.userId}`}
                className="font-semibold hover:text-primary transition-colors truncate block"
              >
                {user.username || 'Anonymous User'}
              </Link>
              {user.bio && (
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {user.bio}
                </p>
              )}
              {user.skills && user.skills.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {user.skills.slice(0, 3).map((skill) => (
                    <Badge key={skill} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {user.skills.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{user.skills.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 声誉信息 */}
          <div className="text-right">
            <div className="text-xl font-bold text-primary">
              {formatPoints(user.totalPoints)}
            </div>
            <div className="text-sm text-muted-foreground">
              {t('points')}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {t('joined')} {new Date(user.joinedAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function LeaderboardPage() {
  const t = useTranslations('leaderboard')
  const tCommon = useTranslations('common')
  const { toast } = useToast()

  const [data, setData] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('all')
  const [category, setCategory] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const limit = 20

  const loadLeaderboard = async (page = 1) => {
    try {
      setLoading(true)
      const offset = (page - 1) * limit

      const response = await apiService.getReputationLeaderboard({
        timeRange: timeRange === 'all' ? undefined : timeRange,
        category: category === 'all' ? undefined : category,
        limit,
        offset
      })

      if (response.success) {
        setData(response.data)
        setCurrentPage(page)
      } else {
        toast({
          title: t('loadError'),
          description: response.error || t('loadErrorDesc'),
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('加载排行榜失败:', error)
      toast({
        title: t('loadError'),
        description: t('networkError'),
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLeaderboard(1)
  }, [timeRange, category])

  const handleRefresh = () => {
    loadLeaderboard(currentPage)
  }

  const handlePageChange = (newPage: number) => {
    loadLeaderboard(newPage)
  }

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-gradient animate-shimmer">
          {t('title')}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {t('description')}
        </p>
      </div>

      {/* 统计卡片 */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass border border-primary/10">
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{data.meta.totalUsers}</div>
              <p className="text-sm text-muted-foreground">{t('stats.totalUsers')}</p>
            </CardContent>
          </Card>
          <Card className="glass border border-primary/10">
            <CardContent className="p-4 text-center">
              <BarChart3 className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{formatPoints(data.meta.averageScore)}</div>
              <p className="text-sm text-muted-foreground">{t('stats.averageScore')}</p>
            </CardContent>
          </Card>
          <Card className="glass border border-primary/10">
            <CardContent className="p-4 text-center">
              <Calendar className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">
                {TIME_RANGES.find(r => r.value === timeRange)?.label || 'All Time'}
              </div>
              <p className="text-sm text-muted-foreground">{t('stats.timeRange')}</p>
            </CardContent>
          </Card>
          <Card className="glass border border-primary/10">
            <CardContent className="p-4 text-center">
              <Filter className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">
                {CATEGORIES.find(c => c.value === category)?.label || 'All'}
              </div>
              <p className="text-sm text-muted-foreground">{t('stats.category')}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 筛选和刷新 */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px] glass border border-primary/10">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder={t('filters.timeRange')} />
            </SelectTrigger>
            <SelectContent className="glass border border-primary/10">
              {TIME_RANGES.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {t(`timeRanges.${range.value}`) || range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[180px] glass border border-primary/10">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder={t('filters.category')} />
            </SelectTrigger>
            <SelectContent className="glass border border-primary/10">
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {t(`categories.${cat.value}`) || cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          className="glass border border-primary/10"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {t('refresh')}
        </Button>
      </div>

      {/* 排行榜内容 */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Card key={i} className="glass border border-primary/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[150px]" />
                  </div>
                  <Skeleton className="h-6 w-[80px]" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data?.leaderboard.length ? (
        <>
          {/* 前三名特殊显示 */}
          {data.leaderboard.slice(0, 3).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {data.leaderboard.slice(0, 3).map((user) => (
                <UserCard key={user.userId} user={user} showRankIcon={true} />
              ))}
            </div>
          )}

          {/* 其余排名 */}
          {data.leaderboard.slice(3).length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xl font-semibold">{t('otherRanks')}</h3>
              {data.leaderboard.slice(3).map((user) => (
                <UserCard key={user.userId} user={user} />
              ))}
            </div>
          )}

          {/* 分页 */}
          {data.pagination.hasMore && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="glass"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                {tCommon('previous')}
              </Button>
              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!data.pagination.hasMore}
                className="glass"
              >
                {tCommon('next')}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <Card className="glass border border-primary/10 p-8 text-center">
          <Trophy className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <CardTitle className="text-xl">{t('noData.title')}</CardTitle>
          <CardDescription className="mt-2">{t('noData.description')}</CardDescription>
        </Card>
      )}
    </div>
  )
}
