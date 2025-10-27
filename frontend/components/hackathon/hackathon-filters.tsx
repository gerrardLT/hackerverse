'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { X, ChevronDown, Filter } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useDataTranslations } from '@/lib/enum-utils'

interface Filters {
  status: string
  technologies: string[]
  prizeRange: string
  dateRange: string
}

interface HackathonFiltersProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
}

const technologies = [
  'React', 'VueJS', 'Angular', 'NodeJS', 'Python', 'Java',
  'Solidity', 'Rust', 'Go', 'TypeScript', 'JavaScript',
  'Machine Learning', 'Blockchain', 'DeFi', 'NFT', 'Web3', 'IPFS'
]

export function HackathonFilters({ filters, onFiltersChange }: HackathonFiltersProps) {
  const t = useTranslations('hackathons.filters')
  const { getTechnologyText } = useDataTranslations()
  const updateFilters = (key: keyof Filters, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const toggleTechnology = (tech: string) => {
    const newTechnologies = filters.technologies.includes(tech)
      ? filters.technologies.filter(t => t !== tech)
      : [...filters.technologies, tech]
    updateFilters('technologies', newTechnologies)
  }

  const clearAllFilters = () => {
    onFiltersChange({
      status: 'all',
      technologies: [],
      prizeRange: 'all',
      dateRange: 'all'
    })
  }

  const hasActiveFilters = filters.status !== 'all' || 
    filters.technologies.length > 0 || 
    filters.prizeRange !== 'all' || 
    filters.dateRange !== 'all'

  return (
    <div className="space-y-3">
      {/* 紧凑的单行筛选器 */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* 状态筛选 */}
        <Select value={filters.status} onValueChange={(value) => updateFilters('status', value)}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder={t('status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('statusOptions.all')}</SelectItem>
            <SelectItem value="upcoming">{t('statusOptions.upcoming')}</SelectItem>
            <SelectItem value="ongoing">{t('statusOptions.ongoing')}</SelectItem>
            <SelectItem value="completed">{t('statusOptions.completed')}</SelectItem>
          </SelectContent>
        </Select>

        {/* 技术栈筛选 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <Filter className="h-3 w-3 mr-2" />
              {t('technology')}
              {filters.technologies.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1 text-xs">
                  {filters.technologies.length}
                </Badge>
              )}
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 max-h-[400px] overflow-y-auto">
            <DropdownMenuLabel>{t('technology')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {technologies.map(tech => (
              <DropdownMenuCheckboxItem
                key={tech}
                checked={filters.technologies.includes(tech)}
                onCheckedChange={() => toggleTechnology(tech)}
              >
                {getTechnologyText(tech)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 奖金范围筛选 */}
        <Select value={filters.prizeRange} onValueChange={(value) => updateFilters('prizeRange', value)}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder={t('prizeRange')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('prizeRangeOptions.all')}</SelectItem>
            <SelectItem value="0-1000">{t('prizeRangeOptions.0-1000')}</SelectItem>
            <SelectItem value="1000-10000">{t('prizeRangeOptions.1000-10000')}</SelectItem>
            <SelectItem value="10000+">{t('prizeRangeOptions.10000+')}</SelectItem>
          </SelectContent>
        </Select>

        {/* 时间范围筛选 */}
        <Select value={filters.dateRange} onValueChange={(value) => updateFilters('dateRange', value)}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder={t('dateRange')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('dateRangeOptions.all')}</SelectItem>
            <SelectItem value="this-week">{t('dateRangeOptions.this-week')}</SelectItem>
            <SelectItem value="this-month">{t('dateRangeOptions.this-month')}</SelectItem>
            <SelectItem value="next-month">{t('dateRangeOptions.next-month')}</SelectItem>
          </SelectContent>
        </Select>

        {/* 清除筛选 */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-9 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3 mr-1" />
            {t('clearAll')}
          </Button>
        )}
      </div>

      {/* 已选择的筛选标签 */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.status !== 'all' && (
            <Badge variant="secondary" className="text-xs h-6">
              {t(`statusOptions.${filters.status}`)}
              <X 
                className="ml-1 h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => updateFilters('status', 'all')}
              />
            </Badge>
          )}
          {filters.prizeRange !== 'all' && (
            <Badge variant="secondary" className="text-xs h-6">
              {t(`prizeRangeOptions.${filters.prizeRange}`)}
              <X 
                className="ml-1 h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => updateFilters('prizeRange', 'all')}
              />
            </Badge>
          )}
          {filters.dateRange !== 'all' && (
            <Badge variant="secondary" className="text-xs h-6">
              {t(`dateRangeOptions.${filters.dateRange}`)}
              <X 
                className="ml-1 h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => updateFilters('dateRange', 'all')}
              />
            </Badge>
          )}
          {filters.technologies.map(tech => (
            <Badge key={tech} variant="secondary" className="text-xs h-6">
              {getTechnologyText(tech)}
              <X 
                className="ml-1 h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => toggleTechnology(tech)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
