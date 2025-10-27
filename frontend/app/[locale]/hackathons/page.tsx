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
    <div ref={pageRef} className="relative min-h-screen bg-background">
      {/* 主内容容器 - max-width 1280px */}
      <div className="container max-w-[1280px] mx-auto px-4 md:px-6">
        {/* 紧凑头部工具栏 - 80px高度 */}
        <div className={`h-[80px] flex items-center justify-between border-b border-border/50 transition-all duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          {/* 左侧：标题 */}
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">
              {t('title')}
            </h1>
            {searchQuery && (
              <Badge variant="secondary" className="text-xs">
                Search: {searchQuery}
              </Badge>
            )}
          </div>

          {/* 右侧：操作按钮组 */}
          <div className="flex items-center gap-2">
            <HackathonSearch 
              searchQuery={searchQuery} 
              onSearchChange={setSearchQuery} 
            />
            
            {/* 筛选器按钮 */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className={showMobileFilters ? 'bg-primary/10 border-primary' : ''}
            >
              <Filter className="h-4 w-4 mr-1" />
              Filter
              {activeFiltersCount > 0 && (
                <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>

            {/* 视图切换 */}
            <div className="flex items-center gap-1 border border-border rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-7 w-7 p-0"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-7 w-7 p-0"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {/* 创建按钮 */}
            <Button size="sm" asChild className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
              <Link href="/hackathons/create">
                <Plus className="h-4 w-4 mr-1" />
                Create
              </Link>
            </Button>
          </div>
        </div>

        {/* 筛选器面板 - 可折叠 */}
        {showMobileFilters && (
          <div className="my-4 p-4 border border-border/50 rounded-xl bg-muted/30 animate-slide-down">
            <HackathonFilters filters={filters} onFiltersChange={setFilters} />
          </div>
        )}

        {/* 筛选标签栏 - 显示已选筛选项 */}
        {activeFiltersCount > 0 && (
          <div className="h-[40px] flex items-center gap-2 my-2">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {filters.status !== 'all' && (
              <Badge variant="secondary" className="text-xs">
                Status: {filters.status}
                <button
                  onClick={() => setFilters({ ...filters, status: 'all' })}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            )}
            {filters.technologies.map(tech => (
              <Badge key={tech} variant="secondary" className="text-xs">
                {tech}
                <button
                  onClick={() => setFilters({
                    ...filters,
                    technologies: filters.technologies.filter(t => t !== tech)
                  })}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            ))}
            {filters.prizeRange !== 'all' && (
              <Badge variant="secondary" className="text-xs">
                Prize: {filters.prizeRange}
                <button
                  onClick={() => setFilters({ ...filters, prizeRange: 'all' })}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            )}
            {filters.dateRange !== 'all' && (
              <Badge variant="secondary" className="text-xs">
                Date: {filters.dateRange}
                <button
                  onClick={() => setFilters({ ...filters, dateRange: 'all' })}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters({
                status: 'all',
                technologies: [],
                prizeRange: 'all',
                dateRange: 'all'
              })}
              className="text-xs h-6 ml-auto"
            >
              Clear All
            </Button>
          </div>
        )}

        {/* 黑客松网格 - 4列紧凑布局 */}
        <div className={`py-6 transition-all duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          <HackathonGrid 
            searchQuery={searchQuery} 
            filters={filters} 
            viewMode={viewMode}
          />
        </div>
      </div>
    </div>
  )
}
