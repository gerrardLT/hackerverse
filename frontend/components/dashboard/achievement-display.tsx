'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  Trophy, 
  Star, 
  Crown, 
  Zap, 
  Target, 
  Award,
  Calendar,
  Filter,
  ChevronRight,
  Sparkles,
  Medal
} from 'lucide-react'
import { apiService } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface Achievement {
  id: string
  type: string
  title: string
  description: string
  icon?: string
  badge?: string
  level: number
  rarity: string
  progress: number
  target: number
  isCompleted: boolean
  completedAt?: string
  category: string
  metadata?: any
}

interface AchievementStats {
  total: number
  completed: number
  inProgress: number
  byCategory: Record<string, { total: number; completed: number }>
  byRarity: Record<string, { total: number; completed: number }>
}

export function AchievementDisplay() {
  const { toast } = useToast()
  const t = useTranslations('dashboard.achievements')
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [stats, setStats] = useState<AchievementStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [activeRarity, setActiveRarity] = useState<string>('all')

  // 加载成就数据
  const loadAchievements = async (category?: string, rarity?: string, shouldSetLoading = true) => {
    try {
      if (shouldSetLoading) setLoading(true)
      const params: any = {}
      if (category && category !== 'all') params.category = category
      if (rarity && rarity !== 'all') params.rarity = rarity
      
      const response = await apiService.getDashboardAchievements(params)
      
      if (response.success && response.data) {
        setAchievements(response.data.achievements)
        setStats(response.data.stats)
      } else {
        toast({
          title: t('loading'),
          description: t('loading'),
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('加载成就数据失败:', error)
      toast({
        title: t('loading'),
        description: t('loading'),
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
        await loadAchievements()
      }
    }
    
    initLoad()
    
    return () => {
      isMounted = false
    }
  }, [])

  // 获取稀有度颜色
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 bg-gray-100'
      case 'rare': return 'text-blue-600 bg-blue-100'
      case 'epic': return 'text-purple-600 bg-purple-100'
      case 'legendary': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  // 获取稀有度图标
  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'common': return Target
      case 'rare': return Star
      case 'epic': return Crown
      case 'legendary': return Trophy
      default: return Award
    }
  }

  // 获取分类图标
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'hackathon': return Calendar
      case 'project': return Zap
      case 'team': return Target
      case 'community': return Sparkles
      default: return Medal
    }
  }

  const categories = stats ? Object.keys(stats.byCategory) : []
  const rarities = ['common', 'rare', 'epic', 'legendary']

  // 过滤成就
  const handleCategoryChange = async (category: string) => {
    setActiveCategory(category)
    await loadAchievements(category === 'all' ? undefined : category, activeRarity === 'all' ? undefined : activeRarity)
  }

  const handleRarityChange = async (rarity: string) => {
    setActiveRarity(rarity)
    await loadAchievements(activeCategory === 'all' ? undefined : activeCategory, rarity === 'all' ? undefined : rarity)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 成就统计 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass border border-primary/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                  <p className="text-sm text-muted-foreground">{t('stats.completed')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border border-primary/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
                  <p className="text-sm text-muted-foreground">{t('stats.inProgress')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border border-primary/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                  </p>
                  <p className="text-sm text-muted-foreground">{t('progress')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 过滤器 */}
      <Card className="glass border border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            {t('filters')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeCategory} onValueChange={handleCategoryChange}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">{t('all')}</TabsTrigger>
              {categories.map(category => (
                <TabsTrigger key={category} value={category} className="capitalize">
                  {t(category)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="mt-4">
            <p className="text-sm font-medium mb-2">{t('rarity')}</p>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={activeRarity === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleRarityChange('all')}
              >
                {t('all')}
              </Button>
              {rarities.map(rarity => {
                const Icon = getRarityIcon(rarity)
                return (
                  <Button
                    key={rarity}
                    variant={activeRarity === rarity ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleRarityChange(rarity)}
                    className="capitalize"
                  >
                    <Icon className="w-3 h-3 mr-1" />
                    {t(rarity)}
                  </Button>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 成就列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((achievement) => {
          const Icon = getCategoryIcon(achievement.category)
          const RarityIcon = getRarityIcon(achievement.rarity)
          const progressPercentage = (achievement.progress / achievement.target) * 100

          return (
            <TooltipProvider key={achievement.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className={`glass border transition-all duration-300 hover-lift cursor-pointer ${
                    achievement.isCompleted 
                      ? 'border-green-200 bg-green-50/30' 
                      : 'border-primary/10 hover:border-primary/30'
                  }`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg ${achievement.isCompleted ? 'bg-green-500' : 'bg-primary'}`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-sm">{achievement.title}</CardTitle>
                            <Badge variant="outline" className={`text-xs ${getRarityColor(achievement.rarity)}`}>
                              <RarityIcon className="w-3 h-3 mr-1" />
                              {t(achievement.rarity)}
                            </Badge>
                          </div>
                        </div>
                        {achievement.isCompleted && (
                          <div className="p-1 bg-green-500 rounded-full">
                            <Trophy className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                        {achievement.description}
                      </p>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span>{t('progress')}</span>
                          <span>
                            {achievement.progress}/{achievement.target}
                          </span>
                        </div>
                        <Progress 
                          value={Math.min(progressPercentage, 100)} 
                          className="h-1.5"
                        />
                      </div>

                      {achievement.completedAt && (
                        <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {t('completedAt')} {new Date(achievement.completedAt).toLocaleDateString()}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <div className="space-y-2">
                    <p className="font-medium">{achievement.title}</p>
                    <p className="text-xs">{achievement.description}</p>
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="outline" className={getRarityColor(achievement.rarity)}>
                        {achievement.rarity}
                      </Badge>
                      <Badge variant="outline">
                        {t('level')} {achievement.level}
                      </Badge>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        })}
      </div>

      {achievements.length === 0 && (
        <Card className="glass border border-primary/10">
          <CardContent className="py-12 text-center">
            <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t('noAchievements')}</p>
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={() => {
                setActiveCategory('all')
                setActiveRarity('all')
                loadAchievements()
              }}
            >
              {t('title')}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
