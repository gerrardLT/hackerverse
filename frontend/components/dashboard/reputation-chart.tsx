'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Star,
  TrendingUp,
  Calendar,
  Award,
  BarChart3,
  PieChart,
  Activity,
  ChevronRight,
  Filter,
  Zap
} from 'lucide-react'
import { apiService } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface ReputationRecord {
  id: string
  action: string
  points: number
  multiplier: number
  description?: string
  category: string
  season?: string
  createdAt: string
}

interface ReputationStats {
  totalPoints: number
  level: number
  pointsToNextLevel: number
  nextLevelPoints: number
  progressPercentage: number
  byCategory: Array<{ category: string; points: number; count: number }>
  byAction: Array<{ action: string; points: number; count: number }>
  trend: {
    daily: Array<{ date: string; points: number }>
    cumulative: Array<{ date: string; points: number; cumulative: number }>
  }
}

export function ReputationChart() {
  const { toast } = useToast()
  const t = useTranslations('dashboard.reputation')
  const [records, setRecords] = useState<ReputationRecord[]>([])
  const [stats, setStats] = useState<ReputationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<'overview' | 'records' | 'trends'>('overview')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // 加载声誉数据
  const loadReputationData = async (category?: string, shouldSetLoading = true) => {
    try {
      if (shouldSetLoading) setLoading(true)
      const params: any = { limit: 50 }
      if (category && category !== 'all') params.category = category
      
      const response = await apiService.getDashboardReputation(params)
      
      if (response.success && response.data) {
        setRecords(response.data.records)
        setStats(response.data.stats)
      } else {
          toast({
            title: t('loadFailed'),
            description: t('noRecords'),
            variant: 'destructive'
          })
      }
    } catch (error) {
      console.error('加载声誉数据失败:', error)
      toast({
        title: t('loadFailed'),
        description: t('networkError'),
        variant: 'destructive'
      })
    } finally {
      if (shouldSetLoading) setLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true
    
    const initLoad = async () => {
      if (isMounted) {
        await loadReputationData()
      }
    }
    
    initLoad()
    
    return () => {
      isMounted = false
    }
  }, [])

  // 获取行为类型颜色
  const getActionColor = (action: string) => {
    switch (action) {
      case 'submit_project': return 'text-blue-600 bg-blue-100'
      case 'vote': return 'text-green-600 bg-green-100'
      case 'judge': return 'text-purple-600 bg-purple-100'
      case 'organize': return 'text-orange-600 bg-orange-100'
      case 'participate': return 'text-cyan-600 bg-cyan-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  // 获取分类颜色
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technical': return 'text-blue-600 bg-blue-100'
      case 'community': return 'text-green-600 bg-green-100'
      case 'governance': return 'text-purple-600 bg-purple-100'
      case 'general': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  // 处理分类切换
  const handleCategoryChange = async (category: string) => {
    setSelectedCategory(category)
    await loadReputationData(category === 'all' ? undefined : category)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-6">
      {/* 声誉概览 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 当前等级 */}
        <Card className="glass border border-primary/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-yellow-600">
                    {stats.level}
                  </span>
                  <span className="text-sm text-muted-foreground">{t('level')}</span>
                </div>
                <p className="text-sm text-muted-foreground">{t('currentLevel')}</p>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>{stats.totalPoints}</span>
                    <span>{stats.nextLevelPoints}</span>
                  </div>
                  <Progress value={stats.progressPercentage} className="h-1.5" />
                  <p className="text-xs text-muted-foreground">
                    {t('pointsToUpgrade', { points: stats.pointsToNextLevel })}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 总积分 */}
        <Card className="glass border border-primary/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.totalPoints.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">{t('totalScore')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 积分趋势 */}
        <Card className="glass border border-primary/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  +{stats.trend.daily.slice(-7).reduce((sum, day) => sum + day.points, 0)}
                </p>
                <p className="text-sm text-muted-foreground">{t('last7Days')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 详细分析 */}
      <Tabs value={activeView} onValueChange={(value: any) => setActiveView(value)}>
        <div className="glass border border-primary/10 rounded-2xl p-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">
              <PieChart className="w-4 h-4 mr-2" />
              {t('overview')}
            </TabsTrigger>
            <TabsTrigger value="records">
              <Activity className="w-4 h-4 mr-2" />
              {t('records')}
            </TabsTrigger>
            <TabsTrigger value="trends">
              <BarChart3 className="w-4 h-4 mr-2" />
              {t('analysis')}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* 统计概览 */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 按分类统计 */}
            <Card className="glass border border-primary/10">
              <CardHeader>
                <CardTitle className="text-base">{t('categoryStats')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.byCategory.map((item, index) => (
                    <div key={item.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getCategoryColor(item.category)}>
                            {item.category}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {item.count} {t('times')}
                          </span>
                        </div>
                        <span className="font-medium">
                          {item.points.toLocaleString()} {t('points')}
                        </span>
                      </div>
                      <Progress 
                        value={(item.points / stats.totalPoints) * 100} 
                        className="h-1.5"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 按行为统计 */}
            <Card className="glass border border-primary/10">
              <CardHeader>
                <CardTitle className="text-base">{t('actionStats')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.byAction.slice(0, 5).map((item, index) => (
                    <div key={item.action} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getActionColor(item.action)}>
                            {item.action}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {item.count} {t('times')}
                          </span>
                        </div>
                        <span className="font-medium">
                          {item.points.toLocaleString()} {t('points')}
                        </span>
                      </div>
                      <Progress 
                        value={(item.points / stats.totalPoints) * 100} 
                        className="h-1.5"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 积分记录 */}
        <TabsContent value="records" className="space-y-4">
          {/* 过滤器 */}
          <Card className="glass border border-primary/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleCategoryChange('all')}
                >
                  {t('allCategories')}
                </Button>
                {stats.byCategory.map(item => (
                  <Button
                    key={item.category}
                    variant={selectedCategory === item.category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleCategoryChange(item.category)}
                    className="capitalize"
                  >
                    {item.category}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 记录列表 */}
          <Card className="glass border border-primary/10">
            <CardHeader>
              <CardTitle className="text-base">积分记录</CardTitle>
              <CardDescription>
                查看详细的积分获得记录
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {records.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 glass rounded-lg border border-primary/10">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-lg">
                        <Zap className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge className={getActionColor(record.action)}>
                            {record.action}
                          </Badge>
                          <Badge variant="outline" className={getCategoryColor(record.category)}>
                            {record.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {record.description || `通过 ${record.action} 获得积分`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(record.createdAt).toLocaleString('zh-CN')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        +{record.points}
                      </p>
                      {record.multiplier !== 1 && (
                        <p className="text-xs text-muted-foreground">
                          倍数: {record.multiplier}×
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {records.length === 0 && (
                <div className="text-center py-8">
                  <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">暂无积分记录</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 趋势分析 */}
        <TabsContent value="trends" className="space-y-4">
          <Card className="glass border border-primary/10">
            <CardHeader>
              <CardTitle className="text-base">积分趋势</CardTitle>
              <CardDescription>
                最近30天的积分获得趋势
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* 简化的趋势展示 */}
              <div className="space-y-4">
                <div className="grid grid-cols-7 gap-2">
                  {stats.trend.daily.slice(-7).map((day, index) => (
                    <div key={day.date} className="text-center">
                      <div className={`h-20 bg-gradient-to-t from-primary to-secondary rounded mb-1 flex items-end justify-center text-white text-xs`}
                           style={{ height: `${Math.max(20, (day.points / Math.max(...stats.trend.daily.slice(-7).map(d => d.points))) * 80)}px` }}>
                        {day.points > 0 && day.points}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(day.date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <h4 className="font-medium mb-3">累计积分趋势</h4>
                  <div className="space-y-2">
                    {stats.trend.cumulative.slice(-5).map((point, index, array) => (
                      <div key={point.date} className="flex items-center justify-between p-2 glass rounded">
                        <span className="text-sm">
                          {new Date(point.date).toLocaleDateString('zh-CN')}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {point.cumulative.toLocaleString()}
                          </span>
                          {index > 0 && (
                            <Badge variant="outline" className="text-xs">
                              +{point.cumulative - array[index - 1].cumulative}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
