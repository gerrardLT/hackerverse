'use client'

import { useEffect, useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Users, Trophy, Code, Globe, Loader2, AlertCircle, TrendingUp } from 'lucide-react'
import { apiService } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface Stat {
  icon: React.ReactNode
  value: string
  label: string
  description: string
}

interface StatsData {
  users: { total: number; label: string; description: string }
  hackathons: { total: number; label: string; description: string }
  projects: { total: number; label: string; description: string }
  countries: { total: number; label: string; description: string }
}

export function StatsSection() {
  const t = useTranslations('home.stats')
  const tCommon = useTranslations('common')
  const sectionRef = useRef<HTMLElement>(null)
  const [stats, setStats] = useState<Stat[]>([
    {
      icon: <Users className="h-8 w-8 text-primary transition-all duration-300 group-hover:scale-110 group-hover:text-secondary" />,
      value: '0',
      label: t('users.label'),
      description: t('users.description')
    },
    {
      icon: <Trophy className="h-8 w-8 text-primary transition-all duration-300 group-hover:scale-110 group-hover:text-secondary" />,
      value: '0',
      label: t('hackathons.label'),
      description: t('hackathons.description')
    },
    {
      icon: <Code className="h-8 w-8 text-primary transition-all duration-300 group-hover:scale-110 group-hover:text-secondary" />,
      value: '0',
      label: t('projects.label'),
      description: t('projects.description')
    },
    {
      icon: <Globe className="h-8 w-8 text-primary transition-all duration-300 group-hover:scale-110 group-hover:text-secondary" />,
      value: '0',
      label: t('countries.label'),
      description: t('countries.description')
    },
  ])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await apiService.getStats()
        if (response.success && response.data) {
          const fetchedStats: StatsData = response.data
          setStats([
            {
              icon: <Users className="h-8 w-8 text-primary transition-all duration-300 group-hover:scale-110 group-hover:text-secondary" />,
              value: fetchedStats.users.total.toLocaleString(),
              label: fetchedStats.users.label,
              description: fetchedStats.users.description
            },
            {
              icon: <Trophy className="h-8 w-8 text-primary transition-all duration-300 group-hover:scale-110 group-hover:text-secondary" />,
              value: fetchedStats.hackathons.total.toLocaleString(),
              label: fetchedStats.hackathons.label,
              description: fetchedStats.hackathons.description
            },
            {
              icon: <Code className="h-8 w-8 text-primary transition-all duration-300 group-hover:scale-110 group-hover:text-secondary" />,
              value: fetchedStats.projects.total.toLocaleString(),
              label: fetchedStats.projects.label,
              description: fetchedStats.projects.description
            },
            {
              icon: <Globe className="h-8 w-8 text-primary transition-all duration-300 group-hover:scale-110 group-hover:text-secondary" />,
              value: fetchedStats.countries.total.toLocaleString(),
              label: fetchedStats.countries.label,
              description: fetchedStats.countries.description
            },
          ])
        } else {
          setError(response.error || tCommon('errors.fetchStatsFailed'))
          toast({
            title: tCommon('errors.loadFailed'),
            description: response.error || tCommon('errors.fetchStatsFailedDesc'),
            variant: 'destructive'
          })
        }
      } catch (err) {
        console.error('获取统计数据错误:', err)
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

    if (isVisible) {
      fetchStats()
    }
  }, [isVisible, t, tCommon, toast])

  if (loading) {
    return (
      <section ref={sectionRef} className="py-20 relative">
        <div className="container relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
              {t('title')}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t('subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="relative overflow-hidden rounded-2xl p-8 text-center group">
                <CardContent className="flex flex-col items-center justify-center space-y-6">
                  <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  <div className="h-8 w-3/4 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section ref={sectionRef} className="py-20 relative">
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
    <section ref={sectionRef} className="py-20 relative">
      <div className="container relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
            {t('title')}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`relative overflow-hidden rounded-2xl p-8 text-center group transition-all duration-700 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              {/* 顶部装饰线 */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-primary to-secondary rounded-b-full opacity-60" />

              <div className="relative space-y-6">
                {/* 图标区域 */}
                <div className="flex justify-center">
                  <div className="relative">
                    {stat.icon}
                    {/* 图标光环 */}
                    <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse-slow" />
                  </div>
                </div>

                {/* 数据展示区域 */}
                <div className="space-y-3">
                  {/* 数值 */}
                  <div className="relative">
                    <div className="text-4xl lg:text-5xl font-bold text-gradient leading-none">
                      {stat.value}
                    </div>
                    {/* 数值下方光效 */}
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>

                  {/* 标签 */}
                  <div className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors duration-300">
                    {stat.label}
                  </div>

                  {/* 描述 */}
                  <div className="text-sm text-muted-foreground leading-relaxed px-2">
                    {stat.description}
                  </div>
                </div>
              </div>

              {/* 悬停时的边框光效 */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 animate-pulse-slow" />

              {/* 趋势指示器 */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110">
                <TrendingUp className="h-4 w-4 text-secondary" />
              </div>
            </div>
          ))}
        </div>

        {/* 底部装饰性统计增强 */}
        <div className={`mt-16 text-center transition-all duration-1000 delay-1000 ${isVisible ? 'animate-fade-in opacity-100' : 'opacity-0'}`}>
          <div className="glass rounded-2xl p-6 max-w-2xl mx-auto">
            <p className="text-sm text-muted-foreground">
              🌟 {t('realTimeData')} • 📊 {t('globalMetrics')} • 🚀 {t('growingCommunity')}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}