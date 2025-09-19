'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { HackathonFilters } from '@/components/hackathon/hackathon-filters'
import { HackathonGrid } from '@/components/hackathon/hackathon-grid'
import { HackathonSearch } from '@/components/hackathon/hackathon-search'
import { Button } from '@/components/ui/button'
import { Plus, Filter, Grid3x3, List, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function HackatonsPage() {
  const searchParams = useSearchParams()
  const t = useTranslations('hackathons')
  const tCommon = useTranslations('common')
  const pageRef = useRef<HTMLDivElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    status: 'all',
    technologies: [] as string[],
    prizeRange: 'all',
    dateRange: 'all',
  })
  const [isVisible, setIsVisible] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // 页面进入动画
  useEffect(() => {
    setIsVisible(true)
  }, [])

  // 从URL参数中读取搜索查询
  useEffect(() => {
    const searchFromUrl = searchParams.get('search')
    if (searchFromUrl) {
      setSearchQuery(searchFromUrl)
    }
  }, [searchParams])

  const activeFiltersCount = 
    (filters.status !== 'all' ? 1 : 0) +
    filters.technologies.length +
    (filters.prizeRange !== 'all' ? 1 : 0) +
    (filters.dateRange !== 'all' ? 1 : 0)

  return (
    <div ref={pageRef} className="relative min-h-screen">
      {/* 动态背景 */}
      <div className="absolute inset-0 gradient-mesh opacity-20 -z-10" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background -z-10" />
      
      {/* 顶部装饰性浮动元素 */}
      <div className="absolute top-20 left-10 w-2 h-2 bg-primary/30 rounded-full animate-pulse-slow" />
      <div className="absolute top-32 right-20 w-1 h-1 bg-secondary/40 rounded-full animate-pulse-slow" style={{ animationDelay: '1s' }} />

      <div className="container py-8 relative">
        {/* 现代化页面标题区域 */}
        <div className={`text-center space-y-6 mb-12 transition-all duration-1000 ${isVisible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'}`}>
          <div className="space-y-4">
            <h1 className="text-responsive-lg font-bold tracking-tight">
              <span className="text-gradient animate-shimmer">{t('title')}</span>
              {searchQuery && (
                <div className="text-responsive-md font-normal text-muted-foreground mt-2">
                  {t('searchResults', { query: searchQuery })}
                </div>
              )}
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {t('subtitle')}
            </p>
          </div>

          {/* 顶部操作栏 */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button className="group hover-lift hover-glow bg-primary hover:bg-primary/90" asChild>
              <Link href="/hackathons/create">
                <Plus className="h-4 w-4 mr-2 transition-transform group-hover:scale-110" />
                {t('create.title')}
                <Sparkles className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </Button>
            <Button variant="outline" className="glass hover-lift" asChild>
              <Link href="/dashboard?tab=hackathons">
                {t('myHackathons')}
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* 现代化侧边栏筛选器 */}
          <div className="lg:w-80 flex-shrink-0">
            <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'animate-slide-right opacity-100' : 'opacity-0 -translate-x-10'}`}>
              {/* 桌面端筛选器 */}
              <div className="hidden lg:block sticky top-32">
                <div className="glass border border-primary/10 rounded-2xl p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Filter className="h-5 w-5 text-primary" />
                      {t('filters.title')}
                    </h2>
                    {activeFiltersCount > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                          {activeFiltersCount}
                        </span>
                      </div>
                    )}
                  </div>
                  <HackathonFilters filters={filters} onFiltersChange={setFilters} />
                </div>
              </div>

              {/* 移动端筛选器按钮 */}
              <div className="lg:hidden">
                <Button
                  variant="outline"
                  className={`w-full glass hover-lift transition-all ${showMobileFilters ? 'bg-primary/10 border-primary/30' : ''}`}
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {t('filters.title')}
                  {activeFiltersCount > 0 && (
                    <span className="ml-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
                
                {/* 移动端筛选器面板 */}
                {showMobileFilters && (
                  <div className="mt-4 glass border border-primary/10 rounded-2xl p-6 animate-slide-down">
                    <HackathonFilters filters={filters} onFiltersChange={setFilters} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 主要内容区域 */}
          <div className="flex-1 space-y-6 overflow-visible">
            <div className={`transition-all duration-1000 delay-500 overflow-visible ${isVisible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'}`}>
              {/* 搜索和视图控制栏 */}
              <div className="glass border border-primary/10 rounded-2xl p-6 space-y-4 overflow-visible">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* 增强型搜索框 - 添加相对定位确保下拉框正确显示 */}
                  <div className="flex-1 relative" style={{ zIndex: 1001 }}>
                    <HackathonSearch 
                      searchQuery={searchQuery} 
                      onSearchChange={setSearchQuery} 
                    />
                  </div>

                  {/* 视图模式切换 */}
                  <div className="flex items-center gap-2">
                    <div className="glass rounded-xl p-1 flex">
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className={`transition-all ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                      >
                        <Grid3x3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className={`transition-all ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 黑客松网格/列表 */}
            <div className={`transition-all duration-1000 delay-700 ${isVisible ? 'animate-fade-in opacity-100' : 'opacity-0'}`}>
              <HackathonGrid 
                searchQuery={searchQuery} 
                filters={filters} 
                viewMode={viewMode}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
