'use client'

import { useEffect, useState, useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Users, Trophy, Code, Globe, Loader2, AlertCircle, TrendingUp } from 'lucide-react'
import { apiService } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface Stat {
  icon: React.ReactNode
  value: string
  label: string
  gradient: string
}

interface StatsData {
  users: { total: number; label: string; description: string }
  hackathons: { total: number; label: string; description: string }
  projects: { total: number; label: string; description: string }
  countries: { total: number; label: string; description: string }
}

/**
 * StatsSidebar Component - Flat Design 2.0
 * 侧边栏统计卡片，240px宽，垂直排列
 */
export function StatsSidebar() {
  const t = useTranslations('home.stats')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const sectionRef = useRef<HTMLDivElement>(null)
  
  const [stats, setStats] = useState<Stat[]>([
    {
      icon: <Users className="h-5 w-5" />,
      value: '0',
      label: t('users.label'),
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <Trophy className="h-5 w-5" />,
      value: '0',
      label: t('hackathons.label'),
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: <Code className="h-5 w-5" />,
      value: '0',
      label: t('projects.label'),
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: <Globe className="h-5 w-5" />,
      value: '0',
      label: t('countries.label'),
      gradient: 'from-orange-500 to-red-500'
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
        const response = await apiService.getStats(locale)
        if (response.success && response.data) {
          const fetchedStats: StatsData = response.data
          setStats([
            {
              icon: <Users className="h-5 w-5" />,
              value: fetchedStats.users.total.toLocaleString(),
              label: fetchedStats.users.label,
              gradient: 'from-blue-500 to-cyan-500'
            },
            {
              icon: <Trophy className="h-5 w-5" />,
              value: fetchedStats.hackathons.total.toLocaleString(),
              label: fetchedStats.hackathons.label,
              gradient: 'from-purple-500 to-pink-500'
            },
            {
              icon: <Code className="h-5 w-5" />,
              value: fetchedStats.projects.total.toLocaleString(),
              label: fetchedStats.projects.label,
              gradient: 'from-green-500 to-emerald-500'
            },
            {
              icon: <Globe className="h-5 w-5" />,
              value: fetchedStats.countries.total.toLocaleString(),
              label: fetchedStats.countries.label,
              gradient: 'from-orange-500 to-red-500'
            },
          ])
        } else {
          setError(response.error || tCommon('errors.fetchStatsFailed'))
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err)
        setError(tCommon('errors.networkError'))
      } finally {
        setLoading(false)
      }
    }

    if (isVisible) {
      fetchStats()
    }
  }, [isVisible, locale, t, tCommon])

  if (loading) {
    return (
      <div ref={sectionRef} className="w-[240px] space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl p-4 bg-muted/30 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-16 bg-muted rounded" />
                <div className="h-3 w-20 bg-muted rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div ref={sectionRef} className="w-[240px]">
        <div className="rounded-xl p-4 bg-destructive/10 border border-destructive/20">
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{tCommon('errors.loadFailed')}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div ref={sectionRef} className="w-[240px] space-y-3 animate-fade-in">
      {stats.map((stat, index) => (
        <div
          key={index}
          className={`group relative rounded-xl p-4 overflow-hidden transition-all duration-300 hover-lift hover:shadow-lg bg-card/50 backdrop-blur-sm border border-border/30 hover:border-primary/40 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
          style={{ 
            transitionDelay: `${index * 100}ms`
          }}
        >
          {/* 渐变背景 - 更深的暗色模式适配 */}
          <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-[0.08] group-hover:opacity-[0.15] transition-opacity`} />
          
          {/* 微妙的光晕效果 */}
          <div className={`absolute -inset-0.5 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-20 blur-xl transition-opacity -z-10`} />
          
          <div className="relative flex items-center gap-3">
            {/* 图标 - 优化暗色模式下的渐变 */}
            <div className={`flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br ${stat.gradient} text-white shadow-lg group-hover:shadow-xl transition-shadow`}>
              {stat.icon}
            </div>
            
            {/* 数据 */}
            <div className="flex-1 min-w-0">
              <div className="text-2xl font-bold text-foreground truncate group-hover:scale-105 transition-transform">
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {stat.label}
              </div>
            </div>
          </div>

          {/* 趋势指示器 */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <TrendingUp className="h-3 w-3 text-green-500" />
          </div>
          
          {/* 底部高光线 */}
          <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${stat.gradient} opacity-0 group-hover:opacity-60 transition-opacity`} />
        </div>
      ))}
    </div>
  )
}

