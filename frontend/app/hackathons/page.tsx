'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { HackathonFilters } from '@/components/hackathon/hackathon-filters'
import { HackathonGrid } from '@/components/hackathon/hackathon-grid'
import { HackathonSearch } from '@/components/hackathon/hackathon-search'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default function HackatonsPage() {
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    status: 'all',
    technologies: [] as string[],
    prizeRange: 'all',
    dateRange: 'all',
  })

  // 从URL参数中读取搜索查询
  useEffect(() => {
    const searchFromUrl = searchParams.get('search')
    if (searchFromUrl) {
      setSearchQuery(searchFromUrl)
    }
  }, [searchParams])

  return (
    <div className="container py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">筛选条件</h2>
              <Button size="sm" asChild>
                <Link href="/hackathons/create">
                  <Plus className="h-4 w-4 mr-2" />
                  创建
                </Link>
              </Button>
            </div>
            <HackathonFilters filters={filters} onFiltersChange={setFilters} />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">
                黑客松
                {searchQuery && (
                  <span className="text-lg font-normal text-muted-foreground ml-2">
                    搜索: "{searchQuery}"
                  </span>
                )}
              </h1>
            </div>
            <HackathonSearch 
              searchQuery={searchQuery} 
              onSearchChange={setSearchQuery} 
            />
          </div>
          
          <HackathonGrid 
            searchQuery={searchQuery} 
            filters={filters} 
          />
        </div>
      </div>
    </div>
  )
}
