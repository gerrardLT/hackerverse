'use client'

import { useState, useEffect } from 'react'
import { ProjectFilters } from '@/components/project/project-filters'
import { ProjectGrid } from '@/components/project/project-grid'
import { ProjectSearch } from '@/components/project/project-search'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, Star, Clock, Trophy } from 'lucide-react'

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<{
    hackathon: string
    technologies: string[]
    status: string
    sortBy: string
  }>({
    hackathon: 'all',
    technologies: [],
    status: 'all',
    sortBy: 'latest'
  })
  const [activeTab, setActiveTab] = useState('all')

  return (
    <div className="container py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* 侧边栏筛选器 */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">筛选项</h2>
              <ProjectFilters filters={filters} onFiltersChange={setFilters} />
            </div>
          </div>
        </div>

        {/* 主要内容 */}
        <div className="flex-1 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">项目展示</h1>
            </div>
            
            <ProjectSearch 
              searchQuery={searchQuery} 
              onSearchChange={setSearchQuery} 
            />

            {/* 项目分类标签 */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  全部项目
                </TabsTrigger>
                <TabsTrigger value="featured" className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  精选项目
                </TabsTrigger>
                <TabsTrigger value="recent" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  最新项目
                </TabsTrigger>
                <TabsTrigger value="winners" className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  获奖项目
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-6">
                <ProjectGrid 
                  searchQuery={searchQuery} 
                  filters={filters}
                  category="all"
                />
              </TabsContent>

              <TabsContent value="featured" className="mt-6">
                <ProjectGrid 
                  searchQuery={searchQuery} 
                  filters={filters}
                  category="featured"
                />
              </TabsContent>

              <TabsContent value="recent" className="mt-6">
                <ProjectGrid 
                  searchQuery={searchQuery} 
                  filters={filters}
                  category="recent"
                />
              </TabsContent>

              <TabsContent value="winners" className="mt-6">
                <ProjectGrid 
                  searchQuery={searchQuery} 
                  filters={filters}
                  category="winners"
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
