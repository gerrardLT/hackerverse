'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'

interface Filters {
  hackathon: string
  technologies: string[]
  status: string
  sortBy: string
}

interface ProjectFiltersProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
}

const hackathons = [
  'Web3 DeFi 创新挑战赛',
  'AI × 区块链融合大赛',
  'NFT 创作者工具挑战赛',
  '可持续发展科技挑战',
  '游戏与 DApp 开发大赛'
]

const technologies = [
  'React', 'Vue.js', 'Angular', 'Node.js', 'Python', 'Java',
  'Solidity', 'Rust', 'Go', 'TypeScript', 'JavaScript',
  'AI/ML', 'Blockchain', 'DeFi', 'NFT', 'Web3', 'IPFS'
]

export function ProjectFilters({ filters, onFiltersChange }: ProjectFiltersProps) {
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
      hackathon: 'all',
      technologies: [],
      status: 'all',
      sortBy: 'latest'
    })
  }

  const hasActiveFilters = filters.hackathon !== 'all' || 
    filters.technologies.length > 0 || 
    filters.status !== 'all'

  return (
    <div className="space-y-4">
      {hasActiveFilters && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">已选筛选条件</span>
          <button
            onClick={clearAllFilters}
            className="text-sm text-primary hover:underline"
          >
            清除全部
          </button>
        </div>
      )}

      {/* 活跃筛选器 */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.hackathon !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              {hackathons.find(h => h === filters.hackathon) || filters.hackathon}
              <X 
                className="ml-1 h-3 w-3 cursor-pointer" 
                onClick={() => updateFilters('hackathon', 'all')}
              />
            </Badge>
          )}
          {filters.technologies.map(tech => (
            <Badge key={tech} variant="secondary" className="text-xs">
              {tech}
              <X 
                className="ml-1 h-3 w-3 cursor-pointer" 
                onClick={() => toggleTechnology(tech)}
              />
            </Badge>
          ))}
          {filters.status !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              {filters.status === 'winner' ? '获奖项目' : filters.status === 'featured' ? '精选项目' : '其他'}
              <X 
                className="ml-1 h-3 w-3 cursor-pointer" 
                onClick={() => updateFilters('status', 'all')}
              />
            </Badge>
          )}
        </div>
      )}

      {/* 黑客松筛选 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">黑客松活动</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <RadioGroup 
            value={filters.hackathon} 
            onValueChange={(value) => updateFilters('hackathon', value)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="hackathon-all" />
              <Label htmlFor="hackathon-all" className="text-sm">全部</Label>
            </div>
            {hackathons.map(hackathon => (
              <div key={hackathon} className="flex items-center space-x-2">
                <RadioGroupItem value={hackathon} id={`hackathon-${hackathon}`} />
                <Label htmlFor={`hackathon-${hackathon}`} className="text-sm">
                  {hackathon}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* 技术栈筛选 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">技术栈</CardTitle>
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
                  {tech}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 项目状态筛选 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">项目状态</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <RadioGroup 
            value={filters.status} 
            onValueChange={(value) => updateFilters('status', value)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="status-all" />
              <Label htmlFor="status-all" className="text-sm">全部</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="winner" id="status-winner" />
              <Label htmlFor="status-winner" className="text-sm">获奖项目</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="featured" id="status-featured" />
              <Label htmlFor="status-featured" className="text-sm">精选项目</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  )
}
