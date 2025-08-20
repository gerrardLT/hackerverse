'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, SlidersHorizontal } from 'lucide-react'

interface ProjectSearchProps {
  searchQuery: string
  onSearchChange: (query: string) => void
}

export function ProjectSearch({ searchQuery, onSearchChange }: ProjectSearchProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜索项目名称、技术栈、团队..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <div className="flex gap-2">
        <Select defaultValue="latest">
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">最新</SelectItem>
            <SelectItem value="popular">最受欢迎</SelectItem>
            <SelectItem value="rating">评分最高</SelectItem>
            <SelectItem value="prize">奖金最高</SelectItem>
          </SelectContent>
        </Select>
        
        <Button variant="outline" size="icon">
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
