'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp, 
  SlidersHorizontal,
  Tag,
  Code,
  Trophy
} from 'lucide-react'

export interface FilterOptions {
  tracks: { name: string; description: string }[]
  tags: string[]
  technologies: string[]
}

export interface FilterValues {
  search: string
  tags: string[]
  technologies: string[]
  tracks: string[]
  sortBy: 'likes' | 'comments' | 'created' | 'updated'
  sortOrder: 'asc' | 'desc'
}

interface ProjectFilterProps {
  filters: FilterOptions
  values: FilterValues
  onChange: (values: FilterValues) => void
  isLoading?: boolean
  totalResults?: number
}

export function ProjectFilter({ 
  filters, 
  values, 
  onChange, 
  isLoading = false,
  totalResults = 0 
}: ProjectFilterProps) {
  const t = useTranslations('projects.filter')
  const tCommon = useTranslations('common')
  
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchInput, setSearchInput] = useState(values.search)

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== values.search) {
        onChange({ ...values, search: searchInput })
      }
    }, 300)
    
    return () => clearTimeout(timer)
  }, [searchInput, values, onChange])

  const handleTagToggle = (tag: string) => {
    const newTags = values.tags.includes(tag)
      ? values.tags.filter(t => t !== tag)
      : [...values.tags, tag]
    onChange({ ...values, tags: newTags })
  }

  const handleTechnologyToggle = (tech: string) => {
    const newTechs = values.technologies.includes(tech)
      ? values.technologies.filter(t => t !== tech)
      : [...values.technologies, tech]
    onChange({ ...values, technologies: newTechs })
  }

  const handleTrackToggle = (track: string) => {
    const newTracks = values.tracks.includes(track)
      ? values.tracks.filter(t => t !== track)
      : [...values.tracks, track]
    onChange({ ...values, tracks: newTracks })
  }

  const clearFilters = () => {
    setSearchInput('')
    onChange({
      search: '',
      tags: [],
      technologies: [],
      tracks: [],
      sortBy: 'created',
      sortOrder: 'desc'
    })
  }

  const hasActiveFilters = values.search || values.tags.length > 0 || 
                          values.technologies.length > 0 || values.tracks.length > 0

  const activeFilterCount = values.tags.length + values.technologies.length + values.tracks.length

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5" />
            <CardTitle className="text-lg">{t('title')}</CardTitle>
            {totalResults > 0 && (
              <Badge variant="secondary" className="ml-2">
                {t('results', { count: totalResults })}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                {tCommon('clear')}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <CardDescription>
          {t('description')}
          {activeFilterCount > 0 && (
            <span className="ml-2 text-primary">
              {t('activeFilters', { count: activeFilterCount })}
            </span>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 搜索框 */}
        <div className="space-y-2">
          <Label htmlFor="search">{t('search.label')}</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder={t('search.placeholder')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
              disabled={isLoading}
            />
            {searchInput && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchInput('')}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* 排序选项 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t('sort.label')}</Label>
            <Select
              value={values.sortBy}
              onValueChange={(value: any) => onChange({ ...values, sortBy: value })}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created">{t('sort.created')}</SelectItem>
                <SelectItem value="updated">{t('sort.updated')}</SelectItem>
                <SelectItem value="likes">{t('sort.likes')}</SelectItem>
                <SelectItem value="comments">{t('sort.comments')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('order.label')}</Label>
            <Select
              value={values.sortOrder}
              onValueChange={(value: any) => onChange({ ...values, sortOrder: value })}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">{t('order.desc')}</SelectItem>
                <SelectItem value="asc">{t('order.asc')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 高级过滤选项 */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleContent className="space-y-4">
            {/* 赛道过滤 */}
            {filters.tracks.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  <Label>{t('tracks.label')}</Label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filters.tracks.map((track) => (
                    <div key={track.name} className="flex items-center space-x-2">
                      <Checkbox
                        id={`track-${track.name}`}
                        checked={values.tracks.includes(track.name)}
                        onCheckedChange={() => handleTrackToggle(track.name)}
                        disabled={isLoading}
                      />
                      <Label 
                        htmlFor={`track-${track.name}`}
                        className="text-sm cursor-pointer flex-1"
                        title={track.description}
                      >
                        {track.name}
                      </Label>
                    </div>
                  ))}
                </div>
                {values.tracks.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {values.tracks.map((track) => (
                      <Badge key={track} variant="secondary" className="text-xs">
                        {track}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTrackToggle(track)}
                          className="h-auto p-0 ml-1 hover:bg-transparent"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 标签过滤 */}
            {filters.tags.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  <Label>{t('tags.label')}</Label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {filters.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={values.tags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleTagToggle(tag)}
                    >
                      {tag}
                      {values.tags.includes(tag) && (
                        <X className="h-3 w-3 ml-1" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 技术栈过滤 */}
            {filters.technologies.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  <Label>{t('technologies.label')}</Label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {filters.technologies.map((tech) => (
                    <Badge
                      key={tech}
                      variant={values.technologies.includes(tech) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleTechnologyToggle(tech)}
                    >
                      {tech}
                      {values.technologies.includes(tech) && (
                        <X className="h-3 w-3 ml-1" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}
