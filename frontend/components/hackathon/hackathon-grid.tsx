'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { HackathonCard } from './hackathon-card'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle } from 'lucide-react'
import { dataService } from '@/lib/data-service'
import { HackathonData } from '@/lib/ipfs-data-service'
import { useToast } from '@/hooks/use-toast'
import { getIPFSImageUrl } from '@/lib/utils'

interface HackathonGridProps {
  searchQuery: string
  filters: {
    status: string
    technologies: string[]
    prizeRange: string
    dateRange: string
  }
  viewMode?: 'grid' | 'list'
}

// 前端筛选函数
function filterHackathons(hackathons: HackathonData[], filters: HackathonGridProps['filters']): HackathonData[] {
  return hackathons.filter(hackathon => {
    // 技术栈筛选
    if (filters.technologies.length > 0) {
      // 安全地获取技术栈数据
      const categories = Array.isArray(hackathon.categories) ? hackathon.categories : []
      const tags = Array.isArray(hackathon.tags) ? hackathon.tags : []
      const hackathonTechnologies = [...categories, ...tags]
      
      // 调试信息（仅在开发环境显示）
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 技术栈筛选调试:', {
          hackathon: hackathon.title,
          selectedTech: filters.technologies,
          categories: categories,
          tags: tags,
          combinedTech: hackathonTechnologies,
        })
      }
      
      // 如果黑客松没有任何技术标签，则不显示
      if (hackathonTechnologies.length === 0) {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ 筛选掉:', hackathon.title, '没有技术标签')
        }
        return false
      }
      
      const hasMatchingTech = filters.technologies.some(selectedTech => 
        hackathonTechnologies.some(hackTech => {
          return hackTech.toLowerCase().includes(selectedTech.toLowerCase()) ||
                 selectedTech.toLowerCase().includes(hackTech.toLowerCase())
        })
      )
      
      if (!hasMatchingTech) {
        return false
      }
    }
    
    // 奖金范围筛选
    if (filters.prizeRange !== 'all' && hackathon.prizePool) {
      const prizePool = hackathon.prizePool
      switch (filters.prizeRange) {
        case '0-1000':
          if (prizePool > 1000) return false
          break
        case '1000-10000':
          if (prizePool < 1000 || prizePool > 10000) return false
          break
        case '10000+':
          if (prizePool < 10000) return false
          break
      }
    }
    
    // 时间范围筛选
    if (filters.dateRange !== 'all') {
      const now = new Date()
      const startDate = new Date(hackathon.startDate)
      
      switch (filters.dateRange) {
        case 'this-week':
          const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          if (startDate > nextWeek) return false
          break
        case 'this-month':
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          if (startDate > endOfMonth) return false
          break
        case 'next-month':
          const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
          const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0)
          if (startDate < startOfNextMonth || startDate > endOfNextMonth) return false
          break
      }
    }
    
    return true
  })
}

export function HackathonGrid({ searchQuery, filters, viewMode = 'grid' }: HackathonGridProps) {
  const t = useTranslations('common')
  const [hackathons, setHackathons] = useState<HackathonData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)
  const { toast } = useToast()

  // 获取黑客松数据
  const fetchHackathons = async (pageNum: number = 1, append: boolean = false) => {
    try {
      setLoading(true)
      setError(null)

      // 构建参数
      const params: any = {
        page: pageNum,
        limit: 12,
        search: searchQuery || undefined,
        sortBy: 'createdAt'
      }

      // 处理状态筛选
      if (filters.status !== 'all') {
        params.status = filters.status
      }

      // 调用统一数据服务
      const response: any = await dataService.getHackathons(params)
      
      // 检查响应格式
      let newHackathons: HackathonData[] = []
      let totalCount = 0
      let totalPages = 0
      
      if (Array.isArray(response)) {
        // 如果返回的是数组（旧格式）
        newHackathons = response
        totalCount = response.length
        totalPages = 1
      } else if (response?.data?.hackathons) {
        // 如果返回的是带分页信息的对象（新格式）
        newHackathons = response.data.hackathons
        totalCount = response.data.pagination?.total || newHackathons.length
        totalPages = response.data.pagination?.totalPages || 1
      }
      
      // ⭐ 前端筛选逻辑（只在没有状态筛选时应用，因为状态筛选已在后端处理）
      if (filters.technologies.length > 0 || filters.prizeRange !== 'all' || filters.dateRange !== 'all') {
        console.log('🔍 应用前端筛选，筛选前数量:', newHackathons.length)
        newHackathons = filterHackathons(newHackathons, filters)
        console.log('🔍 应用前端筛选，筛选后数量:', newHackathons.length)
      }
      
      if (append) {
        setHackathons(prev => [...prev, ...newHackathons])
      } else {
        setHackathons(newHackathons)
      }

      setTotal(totalCount)
      setHasMore(pageNum < totalPages) // ⭐ 启用分页功能
      
      console.log(`HackathonGrid: Loaded ${newHackathons.length} hackathons`)
    } catch (error) {
      console.error('获取黑客松列表错误:', error)
      setError(t('errors.networkError'))
      toast({
        title: t('errors.networkError'),
        description: t('errors.networkErrorDesc'),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // 初次加载和筛选条件变化时重新获取数据
  useEffect(() => {
    setPage(1)
    fetchHackathons(1, false)
  }, [searchQuery, filters])

  // 无限滚动检测
  const handleScroll = useCallback(() => {
    if (loading || !hasMore) return
    
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const windowHeight = window.innerHeight
    const documentHeight = document.documentElement.scrollHeight
    
    // 当滚动到距离底部200px时自动加载更多
    if (scrollTop + windowHeight >= documentHeight - 200) {
      handleLoadMore()
    }
  }, [loading, hasMore])

  // 添加滚动监听
  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  // 加载更多
  const handleLoadMore = useCallback(() => {
    if (loading || !hasMore) return
    
    const nextPage = page + 1
    setPage(nextPage)
    fetchHackathons(nextPage, true)
  }, [loading, hasMore, page])

  // 重试加载
  const handleRetry = () => {
    fetchHackathons(1, false)
  }

  // 转换数据格式以匹配组件期望的格式
  const formatHackathonForCard = (hackathon: HackathonData) => ({
    id: hackathon.id,
    title: hackathon.title,
    description: hackathon.description,
    startDate: hackathon.startDate,
    endDate: hackathon.endDate,
    status: getHackathonStatus(hackathon),
    participants: (hackathon as any)._count?.participations || 0,
    totalPrize: hackathon.prizePool ? `$${hackathon.prizePool.toLocaleString()}` : '待定',
    organizer: {
      name: typeof hackathon.organizer === 'object' && hackathon.organizer?.username 
        ? hackathon.organizer.username 
        : (typeof hackathon.organizer === 'string' ? hackathon.organizer : 'Unknown'),
      avatar: '/placeholder.svg?height=40&width=40'
    },
    // 确保tags是数组
    tags: Array.isArray(hackathon.tags) ? hackathon.tags : [],
    coverImage: getIPFSImageUrl(hackathon.metadata?.coverImage, '/placeholder.svg?height=200&width=400'),
    // ⭐ 添加用户参与状态
    userParticipation: (hackathon as any).userParticipation || null,
  })

  // 根据日期判断黑客松状态
  const getHackathonStatus = (hackathon: HackathonData): 'upcoming' | 'ongoing' | 'completed' => {
    const now = new Date()
    const startDate = new Date(hackathon.startDate)
    const endDate = new Date(hackathon.endDate)

    if (now < startDate) return 'upcoming'
    if (now > endDate) return 'completed'
    return 'ongoing'
  }

  if (error && hackathons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6">
        <div className="relative">
          <div className="glass border border-destructive/20 rounded-2xl p-8 text-center max-w-md">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4 animate-bounce-gentle" />
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-foreground">{t('loadingFailure')}</h3>
              <p className="text-muted-foreground leading-relaxed">{error}</p>
              <div className="pt-4">
                <Button 
                  onClick={handleRetry}
                  className="glass hover-lift px-6 py-2 rounded-xl transition-all duration-300 hover:bg-primary/10"
                >
                  {t('retryAction')}
                </Button>
              </div>
            </div>
          </div>
          {/* 错误状态光环 */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-destructive/10 to-destructive/5 animate-pulse-slow -z-10" />
        </div>
      </div>
    )
  }

  const getGridClasses = () => {
    if (viewMode === 'list') {
      return 'space-y-4'
    }
    return 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
  }

  return (
    <div className="space-y-8">
      {/* 结果统计 */}
      {hackathons.length > 0 && !loading && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-medium">{t('foundCount', { count: hackathons.length })}</span>
            {total > hackathons.length && (
              <span>/ {t('totalCount')} {total} 个</span>
            )}
          </div>
          <div className="hidden sm:block">
            <span>{t('viewMode', { mode: viewMode === 'grid' ? t('viewModeGrid') : t('viewModeList') })}</span>
          </div>
        </div>
      )}

      {/* 黑客松网格/列表 */}
      {hackathons.length > 0 ? (
        <div className={`${getGridClasses()} animate-fade-in`}>
          {hackathons.map((hackathon, index) => (
            <div
              key={hackathon.id}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <HackathonCard
                hackathon={formatHackathonForCard(hackathon)}
              />
            </div>
          ))}
        </div>
      ) : !loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-6">
          <div className="relative">
            <div className="glass rounded-2xl p-12 text-center max-w-md">
              <div className="w-16 h-16 bg-muted/50 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                <span className="text-3xl">🏆</span>
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-foreground">{t('noHackathons')}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {searchQuery || filters.status !== 'all' 
                    ? t('noHackathonsDesc') 
                    : t('noHackathonsEmpty')}
                </p>
                {(!searchQuery && filters.status === 'all') && (
                  <div className="pt-4">
                    <Button className="bg-primary hover:bg-primary/90 hover-lift hover-glow" asChild>
                      <Link href="/hackathons/create">
                        {t('createHackathon')}
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
            {/* 空状态装饰光环 */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/5 to-secondary/5 animate-pulse-slow -z-10" />
          </div>
        </div>
      ) : null}

      {/* 现代化加载更多区域 */}
      {hasMore && hackathons.length > 0 && (
        <div className="flex flex-col items-center space-y-6">
          <div className="glass border border-primary/10 rounded-2xl p-6 text-center">
            <Button 
              onClick={handleLoadMore} 
              disabled={loading}
              className="bg-primary hover:bg-primary/90 hover:shadow-glow hover-lift transition-all duration-300 px-8"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('loading')}
                </>
              ) : (
                <>
                  {t('loadMoreHackathons')}
                  <span className="ml-2 text-xs opacity-70">({hackathons.length}/{total})</span>
                </>
              )}
            </Button>
            
            {/* 自动加载提示 */}
            <p className="text-sm text-muted-foreground mt-3">
              💡 {t('scrollToLoad')}
            </p>
          </div>
        </div>
      )}

      {/* 底部自动加载指示器 */}
      {loading && hackathons.length > 0 && (
        <div className="flex justify-center py-8">
          <div className="glass rounded-2xl p-4 flex items-center space-x-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm font-medium">{t('loadingMore')}</span>
          </div>
        </div>
      )}

      {/* 现代化初次加载指示器 */}
      {loading && hackathons.length === 0 && (
        <div className="flex justify-center py-16">
          <div className="glass border border-primary/20 rounded-2xl p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">{t('searchingHackathons')}</p>
            <p className="text-sm text-muted-foreground">{t('findingMatches')}</p>
          </div>
        </div>
      )}

      {/* 页面底部状态栏 */}
      {hackathons.length > 0 && !loading && (
        <div className="glass border-t border-primary/10 rounded-t-2xl p-4 text-center">
          <div className="text-sm text-muted-foreground">
            {t('displayedCount')} <span className="font-medium text-primary">{hackathons.length}</span> 个黑客松
            {total > hackathons.length && (
              <> / {t('totalCount')} <span className="font-medium text-primary">{total}</span> 个</>
            )}
            {!hasMore && total > 0 && (
              <span className="ml-2 text-xs">🎉 {t('allLoaded')}</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
