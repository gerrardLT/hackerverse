'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Trophy,
  Calendar,
  Code,
  Users,
  Star,
  TrendingUp,
  Award,
  MessageSquare,
  Target,
  Zap,
  BarChart3,
  Activity
} from 'lucide-react'
import { apiService } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface EnhancedStats {
  hackathons: {
    participated: number
    organized: number
    total: number
  }
  projects: {
    submitted: number
    won: number
    winRate: number
  }
  teams: {
    joined: number
    asJudge: number
  }
  reputation: {
    score: number
    level: number
    pointsToNextLevel: number
    nextLevelPoints: number
    progressPercentage: number
    totalEarned: number
  }
  achievements: {
    completed: number
    total: number
    completionRate: number
  }
  community: {
    posts: number
    replies: number
    likesGiven: number
    followers: number
    following: number
    engagement: number
  }
  trends: {
    participations: Array<{ month: string; count: number }>
    projects: Array<{ month: string; count: number }>
  }
}

export function EnhancedStats() {
  const { toast } = useToast()
  const t = useTranslations('dashboard.enhanced')
  const [stats, setStats] = useState<EnhancedStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true // 防止组件卸载后设置状态
    
    const loadStats = async () => {
      try {
        const response = await apiService.getDashboardStats()
        
        if (isMounted && response.success && response.data) {
          setStats(response.data.stats)
        } else if (isMounted) {
          toast({
            title: t('loadFailed'),
            description: t('noDataError'),
            variant: 'destructive'
          })
        }
      } catch (error) {
        console.error('加载统计数据失败:', error)
        if (isMounted) {
          toast({
            title: t('loadFailed'),
            description: t('networkError'),
            variant: 'destructive'
          })
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadStats()
    
    return () => {
      isMounted = false
    }
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-6">
      {/* 核心统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 黑客松统计 */}
        <Card className="glass border border-primary/10 hover:border-primary/30 transition-all duration-300 hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <Badge variant="outline" className="text-xs">
                {stats.hackathons.organized > 0 ? t('hackathons.organizer') : t('hackathons.participant')}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-gradient">
                {stats.hackathons.total}
              </div>
              <p className="text-sm text-muted-foreground">{t('hackathons.title')}</p>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t('hackathons.participated')}: {stats.hackathons.participated}</span>
                <span>{t('hackathons.organized')}: {stats.hackathons.organized}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 项目统计 */}
        <Card className="glass border border-primary/10 hover:border-primary/30 transition-all duration-300 hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
                <Code className="w-5 h-5 text-white" />
              </div>
              <Badge variant="outline" className="text-xs">
{t('projects.winRate')} {stats.projects.winRate.toFixed(1)}%
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-gradient">
                {stats.projects.submitted}
              </div>
              <p className="text-sm text-muted-foreground">{t('projects.title')}</p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>{t('projects.winningProjects')}</span>
                  <span>{stats.projects.won}</span>
                </div>
                <Progress value={stats.projects.winRate} className="h-1.5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 声誉系统 */}
        <Card className="glass border border-primary/10 hover:border-primary/30 transition-all duration-300 hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl">
                <Star className="w-5 h-5 text-white" />
              </div>
              <Badge variant="outline" className="text-xs">
{stats.reputation.level} {t('reputation.level')}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-gradient">
                {stats.reputation.score.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">{t('reputation.score')}</p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>{t('reputation.progress')}</span>
                  <span>{stats.reputation.pointsToNextLevel} {t('reputation.points')}</span>
                </div>
                <Progress value={stats.reputation.progressPercentage} className="h-1.5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 成就系统 */}
        <Card className="glass border border-primary/10 hover:border-primary/30 transition-all duration-300 hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <Badge variant="outline" className="text-xs">
{stats.achievements.completionRate.toFixed(1)}% {t('achievements.completed')}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-gradient">
                {stats.achievements.completed}
              </div>
              <p className="text-sm text-muted-foreground">{t('achievements.title')}</p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>{t('achievements.totalAchievements')}</span>
                  <span>{stats.achievements.total}</span>
                </div>
                <Progress value={stats.achievements.completionRate} className="h-1.5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 社区与团队统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 团队活动 */}
        <Card className="glass border border-primary/10 hover:border-primary/30 transition-all duration-300 hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-lg font-bold">{stats.teams.joined}</div>
                <p className="text-sm text-muted-foreground">{t('teams.title')}</p>
                {stats.teams.asJudge > 0 && (
                  <Badge variant="secondary" className="text-xs mt-1">
                    {t('teams.asJudge')} {stats.teams.asJudge} {t('teams.times')}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 社区活跃度 */}
        <Card className="glass border border-primary/10 hover:border-primary/30 transition-all duration-300 hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-lg font-bold">{stats.community.engagement}</div>
                <p className="text-sm text-muted-foreground">{t('community.title')}</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {t('community.posts')} {stats.community.posts}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {t('community.replies')} {stats.community.replies}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 社交网络 */}
        <Card className="glass border border-primary/10 hover:border-primary/30 transition-all duration-300 hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-lg font-bold">{stats.community.followers}</div>
                <p className="text-sm text-muted-foreground">{t('social.followers')}</p>
                <Badge variant="outline" className="text-xs mt-1">
                  {t('social.following')} {stats.community.following} {t('social.people')}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 活动趋势 */}
        <Card className="glass border border-primary/10 hover:border-primary/30 transition-all duration-300 hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-lg font-bold">
                  {stats.trends.participations.slice(-3).reduce((sum, month) => sum + month.count, 0)}
                </div>
                <p className="text-sm text-muted-foreground">{t('trend.recent3Months')}</p>
                <div className="flex gap-1 mt-1">
                  {stats.trends.participations.slice(-3).map((month, index) => (
                    <div
                      key={month.month}
                      className={`h-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full`}
                      style={{ width: `${Math.max(4, month.count * 8)}px` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 月度趋势图 */}
      <Card className="glass border border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            {t('trend.monthlyTrend')}
          </CardTitle>
          <CardDescription>
            {t('trend.trendDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* 参与趋势 */}
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {t('trend.participationTrend')}
              </h4>
              <div className="flex items-end gap-2 h-24">
                {stats.trends.participations.map((month, index) => (
                  <div key={month.month} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-cyan-500 rounded-t min-h-[4px] flex items-end justify-center text-white text-xs"
                      style={{ 
                        height: `${Math.max(8, (month.count / Math.max(...stats.trends.participations.map(m => m.count), 1)) * 80)}px` 
                      }}
                    >
                      {month.count > 0 && <span className="pb-1">{month.count}</span>}
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">
                      {month.month.split('-')[1]}{t('trend.month')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 项目趋势 */}
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Code className="w-4 h-4" />
                {t('trend.projectTrend')}
              </h4>
              <div className="flex items-end gap-2 h-24">
                {stats.trends.projects.map((month, index) => (
                  <div key={month.month} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-gradient-to-t from-green-500 to-emerald-500 rounded-t min-h-[4px] flex items-end justify-center text-white text-xs"
                      style={{ 
                        height: `${Math.max(8, (month.count / Math.max(...stats.trends.projects.map(m => m.count), 1)) * 80)}px` 
                      }}
                    >
                      {month.count > 0 && <span className="pb-1">{month.count}</span>}
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">
                      {month.month.split('-')[1]}{t('trend.month')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
