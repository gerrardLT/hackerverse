'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar, Users, Trophy, Clock, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import { apiService, type Hackathon } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

export function FeaturedHackathons() {
  const t = useTranslations('home.featured')
  const tCommon = useTranslations('common')
  const [hackathons, setHackathons] = useState<Hackathon[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchFeaturedHackathons = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await apiService.getHackathons({
          limit: 6,
          sortBy: 'startDate',
          sortOrder: 'asc'
        })

        if (response.success && response.data) {
          setHackathons(response.data.hackathons)
        } else {
          setError(response.error || tCommon('errors.fetchFeaturedFailed'))
          toast({
            title: tCommon('errors.loadFailed'),
            description: response.error || tCommon('errors.fetchFeaturedFailedDesc'),
            variant: 'destructive'
          })
        }
      } catch (error) {
        console.error('获取特色黑客松错误:', error)
        setError(tCommon('errors.networkError'))
        toast({
          title: tCommon('errors.networkError'),
          description: tCommon('errors.networkErrorDesc'),
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedHackathons()
  }, [tCommon, toast])

  if (loading) {
    return (
      <section className="py-20 relative">
        <div className="container relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
              {t('title')}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t('subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="flex flex-col overflow-hidden rounded-2xl p-6 group">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                    <Badge variant="secondary" className="animate-pulse">Loading</Badge>
                  </div>
                  <div className="h-6 w-3/4 bg-muted rounded animate-pulse mb-2" />
                  <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div className="h-16 bg-muted rounded animate-pulse" />
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="h-6 w-16 animate-pulse" />
                    <Badge variant="outline" className="h-6 w-20 animate-pulse" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-12 bg-muted rounded animate-pulse" />
                    <div className="h-12 bg-muted rounded animate-pulse" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full animate-pulse" disabled>
                    {tCommon('loading')}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-20 relative">
        <div className="container relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
              {t('title')}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t('subtitle')}
            </p>
          </div>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-16 w-16 text-destructive mb-4" />
            <h3 className="text-xl font-semibold text-destructive mb-2">{tCommon('errors.loadFailed')}</h3>
            <p className="text-muted-foreground max-w-md">{error}</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <div className="flex-1">
      {/* 标题栏 - 紧凑设计 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {t('title')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t('subtitle')}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-primary hover:text-primary/80"
        >
          <Link href="/hackathons" className="flex items-center gap-1">
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* 3×2紧凑网格 - 优化配色 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {hackathons.map((hackathon, index) => {
          const statusColors = {
            'upcoming': 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
            'active': 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
            'ended': 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20',
            'draft': 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20'
          }
          
          return (
            <Link
              key={hackathon.id}
              href={`/hackathons/${hackathon.id}`}
              className={`group block ${index < 6 ? '' : 'hidden'}`}
            >
              <Card className="h-[220px] overflow-hidden glass-light border border-border/50 hover:border-primary/40 hover:shadow-lg transition-all duration-300 hover-lift relative">
                {/* 顶部渐变条 - 增强效果 */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {/* 卡片光晕效果 */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="p-4 h-full flex flex-col relative">
                  {/* 头部：状态徽章 + 标题 */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="text-base font-bold line-clamp-2 flex-1 group-hover:text-primary transition-colors">
                      {hackathon.title}
                    </h3>
                    <Badge 
                      className={`text-xs shrink-0 px-2 py-0.5 border ${statusColors[hackathon.status as keyof typeof statusColors] || statusColors.draft}`}
                    >
                      {hackathon.status}
                    </Badge>
                  </div>

                  {/* 关键信息行 - 优化图标颜色 */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-primary/60" />
                      <span>
                        {(() => {
                          const daysLeft = Math.ceil((new Date(hackathon.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                          if (daysLeft > 0) {
                            return `${daysLeft}d left`;
                          } else if (daysLeft === 0) {
                            return 'Today';
                          } else {
                            return 'Active';
                          }
                        })()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-accent/60" />
                      <span>{hackathon._count?.participations || 0}</span>
                    </div>
                  </div>

                  {/* 技术栈标签 - 优化配色 */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {hackathon.tags.slice(0, 3).map((tag, tagIndex) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className={`text-xs px-2 py-0 h-5 border transition-all group-hover:scale-105 ${
                          tagIndex === 0 ? 'border-primary/30 bg-primary/5 text-primary' :
                          tagIndex === 1 ? 'border-accent/30 bg-accent/5 text-accent' :
                          'border-border/50 bg-background/50'
                        }`}
                      >
                        {tag}
                      </Badge>
                    ))}
                    {hackathon.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs px-2 py-0 h-5 border-border/50">
                        +{hackathon.tags.length - 3}
                      </Badge>
                    )}
                  </div>

                  {/* 底部：奖金 + CTA */}
                  <div className="mt-auto pt-3 border-t border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Trophy className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                      <span className="text-sm font-semibold bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">
                        {hackathon.prizePool ? `$${(hackathon.prizePool / 1000).toFixed(0)}K` : 'TBD'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0 -translate-x-2">
                      View Details
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}