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
    <div className="relative min-h-screen">
      {/* 动态背景 */}
      <div className="absolute inset-0 gradient-mesh opacity-15 -z-10" />
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-background/90 to-background -z-10" />

      {/* 主内容区 - max-width 1280px */}
      <div className="container max-w-[1280px] mx-auto px-4 md:px-6">
        {/* 紧凑头部工具栏 - 80px高度 - Flat Design 2.0 */}
        <div className="h-[80px] flex items-center justify-between border-b border-border/50">
          {/* 左侧：标题 + 快速统计 */}
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {data ? `${data.meta.totalUsers} ${t('stats.totalUsers')}` : t('description')}
              </p>
            </div>
            {/* 内联统计 */}
            {data && (
              <div className="hidden lg:flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Avg:</span>
                  <span className="font-semibold">{formatPoints(data.meta.averageScore)}</span>
                </div>
                <div className="h-4 w-px bg-border" />
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="font-semibold">
                    {TIME_RANGES.find(r => r.value === timeRange)?.label || 'All Time'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 右侧：筛选器 + 刷新 */}
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="h-9 w-[130px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_RANGES.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {t(`timeRanges.${range.value}`) || range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-9 w-[120px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {t(`categories.${cat.value}`) || cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              onClick={handleRefresh} 
              size="sm"
              variant="ghost"
              className="h-9 w-9 p-0"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* 排行榜内容 */}
        <div className="py-6">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-[48px] bg-muted/20 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : data?.leaderboard.length ? (
            <>
              {/* 前三名紧凑横幅 - 120px高度 - Flat Design 2.0 */}
              {data.leaderboard.slice(0, 3).length > 0 && (
                <div className="h-[120px] grid grid-cols-3 gap-3 mb-4">
                  {data.leaderboard.slice(0, 3).map((user, idx) => {
                    const rankConfig = getRankIcon(user.rank);
                    const RankIcon = rankConfig.icon;
                    const bgColors = [
                      'bg-gradient-to-br from-yellow-500/20 to-orange-500/20',
                      'bg-gradient-to-br from-gray-400/20 to-gray-500/20',
                      'bg-gradient-to-br from-amber-600/20 to-amber-700/20'
                    ];
                    return (
                      <Link
                        key={user.userId}
                        href={`/users/${user.userId}`}
                        className="block group"
                      >
                        <div className={`h-full ${bgColors[idx]} rounded-xl border border-border/50 p-3 hover:border-primary/50 transition-all hover-lift`}>
                          <div className="flex flex-col h-full">
                            {/* 排名图标 */}
                            <div className="flex items-center justify-between mb-2">
                              <RankIcon className={`h-6 w-6 ${rankConfig.color}`} />
                              <Badge variant="outline" className="text-xs">
                                #{user.rank}
                              </Badge>
                            </div>
                            {/* 用户信息 */}
                            <div className="flex items-center gap-2 mb-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatarUrl} />
                                <AvatarFallback className="text-xs">
                                  {user.username?.slice(0, 2).toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                                  {user.username}
                                </p>
                              </div>
                            </div>
                            {/* 积分 */}
                            <div className="mt-auto">
                              <div className="text-xl font-bold text-primary">
                                {formatPoints(user.totalPoints)}
                              </div>
                              <p className="text-xs text-muted-foreground">{t('points')}</p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* 排名列表 - 表格化 48px/行 - Flat Design 2.0 */}
              {data.leaderboard.slice(3).length > 0 && (
                <div className="space-y-1">
                  {data.leaderboard.slice(3).map((user) => (
                    <Link
                      key={user.userId}
                      href={`/users/${user.userId}`}
                      className="block group"
                    >
                      <div className="h-[48px] flex items-center gap-3 px-3 rounded-lg hover:bg-muted/50 border border-transparent hover:border-primary/30 transition-all">
                        {/* 排名 */}
                        <div className="w-[50px] text-center">
                          <span className="text-sm font-semibold text-muted-foreground">
                            #{user.rank}
                          </span>
                        </div>
                        {/* 用户 */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatarUrl} />
                            <AvatarFallback className="text-xs">
                              {user.username?.slice(0, 2).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                              {user.username}
                            </p>
                          </div>
                        </div>
                        {/* 技能标签（隐藏在小屏幕） */}
                        {user.skills && user.skills.length > 0 && (
                          <div className="hidden md:flex gap-1">
                            {user.skills.slice(0, 2).map((skill) => (
                              <Badge key={skill} variant="outline" className="text-xs h-5">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {/* 积分 */}
                        <div className="w-[100px] text-right">
                          <span className="text-sm font-bold text-primary">
                            {formatPoints(user.totalPoints)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* 分页 */}
              {data.pagination.hasMore && (
                <div className="flex justify-center gap-2 mt-6">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    {tCommon('previous')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!data.pagination.hasMore}
                  >
                    {tCommon('next')}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Trophy className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('noData.title')}</h3>
              <p className="text-sm text-muted-foreground">{t('noData.description')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
