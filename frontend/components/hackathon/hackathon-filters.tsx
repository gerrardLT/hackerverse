'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
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
    <div className="space-y-4">
      {hasActiveFilters && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t('activeFilters')}</span>
          <button
            onClick={clearAllFilters}
            className="text-sm text-primary hover:underline"
          >
            {t('clearAll')}
          </button>
        </div>
      )}

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.status !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              {t(`statusOptions.${filters.status}`)}
              <X 
                className="ml-1 h-3 w-3 cursor-pointer" 
                onClick={() => updateFilters('status', 'all')}
              />
            </Badge>
          )}
          {filters.technologies.map(tech => (
            <Badge key={tech} variant="secondary" className="text-xs">
              {getTechnologyText(tech)}
              <X 
                className="ml-1 h-3 w-3 cursor-pointer" 
                onClick={() => toggleTechnology(tech)}
              />
            </Badge>
          ))}
        </div>
      )}

      {/* Status Filter */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{t('status')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <RadioGroup 
            value={filters.status} 
            onValueChange={(value) => updateFilters('status', value)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="status-all" />
              <Label htmlFor="status-all" className="text-sm">{t('statusOptions.all')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="upcoming" id="status-upcoming" />
              <Label htmlFor="status-upcoming" className="text-sm">{t('statusOptions.upcoming')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ongoing" id="status-ongoing" />
              <Label htmlFor="status-ongoing" className="text-sm">{t('statusOptions.ongoing')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="completed" id="status-completed" />
              <Label htmlFor="status-completed" className="text-sm">{t('statusOptions.completed')}</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Technology Filter */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{t('technology')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="max-h-48 overflow-y-auto space-y-2">
            {technologies.map(tech => (
              <div key={tech} className="flex items-center space-x-2">
                <Checkbox
                  id={`tech-${tech}`}
                  checked={filters.technologies.includes(tech)}
                  onCheckedChange={() => toggleTechnology(tech)}
                />
                <Label htmlFor={`tech-${tech}`} className="text-sm">
                  {getTechnologyText(tech)}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Prize Range Filter */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{t('prizeRange')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <RadioGroup 
            value={filters.prizeRange} 
            onValueChange={(value) => updateFilters('prizeRange', value)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="prize-all" />
              <Label htmlFor="prize-all" className="text-sm">{t('prizeRangeOptions.all')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="0-1000" id="prize-low" />
              <Label htmlFor="prize-low" className="text-sm">{t('prizeRangeOptions.0-1000')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="1000-10000" id="prize-mid" />
              <Label htmlFor="prize-mid" className="text-sm">{t('prizeRangeOptions.1000-10000')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="10000+" id="prize-high" />
              <Label htmlFor="prize-high" className="text-sm">{t('prizeRangeOptions.10000+')}</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Date Range Filter */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{t('dateRange')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <RadioGroup 
            value={filters.dateRange} 
            onValueChange={(value) => updateFilters('dateRange', value)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="date-all" />
              <Label htmlFor="date-all" className="text-sm">{t('dateRangeOptions.all')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="this-week" id="date-week" />
              <Label htmlFor="date-week" className="text-sm">{t('dateRangeOptions.this-week')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="this-month" id="date-month" />
              <Label htmlFor="date-month" className="text-sm">{t('dateRangeOptions.this-month')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="next-month" id="date-next" />
              <Label htmlFor="date-next" className="text-sm">{t('dateRangeOptions.next-month')}</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  )
}
