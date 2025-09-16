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
          featured: true,
          limit: 3,
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
            {Array.from({ length: 3 }).map((_, index) => (
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
          {hackathons.map((hackathon) => (
            <Card
              key={hackathon.id}
              className="flex flex-col glass dark:glass-dark border-primary/20 hover:border-primary/40 transition-all duration-300 hover:scale-105 group relative overflow-hidden rounded-2xl p-6"
            >
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary`} />

              <CardHeader className="relative pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white`}>
                    <Trophy className="h-6 w-6" /> {/* Using Trophy icon as a placeholder */}
                  </div>
                  <Badge variant="secondary" className="glass border-primary/20">
                    {hackathon.status}
                  </Badge>
                </div>

                <h3 className="text-xl font-bold group-hover:text-primary transition-colors line-clamp-2">
                  {hackathon.title}
                </h3>

                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="mr-2 h-4 w-4" />
                  <span className="font-medium">{Math.ceil((new Date(hackathon.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} {t('daysLeft')}</span>
                </div>
              </CardHeader>

              <CardContent className="flex-1 space-y-4">
                <p className="text-muted-foreground line-clamp-3">
                  {hackathon.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {hackathon.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-xs glass border-accent/30 hover:border-accent/60 transition-colors"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 glass dark:glass-dark rounded-xl">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Trophy className="mr-1 h-4 w-4 text-accent" />
                    </div>
                    <div className="font-bold text-lg">{hackathon.prizePool ? `$${(hackathon.prizePool / 1000).toFixed(1)}K` : 'TBD'}</div>
                    <div className="text-xs text-muted-foreground">{t('prizePool')}</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Users className="mr-1 h-4 w-4 text-primary" />
                    </div>
                    <div className="font-bold text-lg">{hackathon._count?.participations || 0}</div>
                    <div className="text-xs text-muted-foreground">{t('participants')}</div>
                  </div>
                </div>
              </CardContent>

              <CardFooter>
                <Button asChild className="w-full group-hover:animate-glow">
                  <Link href={`/hackathons/${hackathon.id}`}>
                    {hackathon.status === 'Active' ? t('joinHackathon') : t('viewDetails')}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="text-center mt-16">
          <Button
            variant="outline"
            size="lg"
            asChild
            className="glass dark:glass-dark border-primary/20 hover:border-primary/40 bg-transparent"
          >
            <Link href="/hackathons">{t('viewAllHackathons')}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}