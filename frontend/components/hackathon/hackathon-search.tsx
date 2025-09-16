'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, X, TrendingUp, Clock, Sparkles } from 'lucide-react'

interface HackathonSearchProps {
  searchQuery: string
  onSearchChange: (query: string) => void
}

export function HackathonSearch({ searchQuery, onSearchChange }: HackathonSearchProps) {
  const t = useTranslations('hackathons.search')
  const [isFocused, setIsFocused] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // 热门搜索关键词
  const popularSearches = [
    'Web3', 'DeFi', 'NFT', 'AI', 'Blockchain', 'React', 'Node.js', 'Python'
  ]

  // 加载搜索历史
  useEffect(() => {
    const history = localStorage.getItem('hackathon-search-history')
    if (history) {
      try {
        setSearchHistory(JSON.parse(history).slice(0, 5))
      } catch (error) {
        console.error('Failed to parse search history:', error)
      }
    }
  }, [])

  // 保存搜索历史
  const saveSearchHistory = (query: string) => {
    if (!query.trim()) return

    const history = localStorage.getItem('hackathon-search-history')
    let searchHistoryArray: string[] = []
    
    if (history) {
      try {
        searchHistoryArray = JSON.parse(history)
      } catch (error) {
        console.error('Failed to parse search history:', error)
      }
    }

    // 移除重复项并添加到开头
    searchHistoryArray = searchHistoryArray.filter(item => item !== query)
    searchHistoryArray.unshift(query)
    
    // 只保留最近10个搜索
    searchHistoryArray = searchHistoryArray.slice(0, 10)
    
    localStorage.setItem('hackathon-search-history', JSON.stringify(searchHistoryArray))
    setSearchHistory(searchHistoryArray.slice(0, 5))
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      saveSearchHistory(searchQuery.trim())
      setShowSuggestions(false)
      inputRef.current?.blur()
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    onSearchChange(suggestion)
    saveSearchHistory(suggestion)
    setShowSuggestions(false)
    inputRef.current?.blur()
  }

  const clearSearch = () => {
    onSearchChange('')
    inputRef.current?.focus()
  }

  const clearHistory = () => {
    localStorage.removeItem('hackathon-search-history')
    setSearchHistory([])
  }

  return (
    <div className="relative">
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className={`relative transition-all duration-300 ${isFocused ? 'scale-[1.02]' : ''}`}>
          <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors duration-300 ${
            isFocused ? 'text-primary' : 'text-muted-foreground'
          }`} />
          <Input
            ref={inputRef}
            placeholder={t('placeholder')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => {
              setIsFocused(true)
              setShowSuggestions(true)
            }}
            onBlur={() => {
              setIsFocused(false)
              // 延迟隐藏建议，让用户有时间点击
              setTimeout(() => setShowSuggestions(false), 200)
            }}
            className={`pl-12 pr-20 h-12 text-base glass border-primary/20 transition-all duration-300 ${
              isFocused ? 'border-primary/40 shadow-glow' : 'hover:border-primary/30'
            }`}
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              className="h-8 bg-gradient-primary hover:shadow-glow transition-all"
              disabled={!searchQuery.trim()}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </form>

      {/* 搜索建议面板 */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-2xl shadow-lg p-6 z-50 animate-slide-down">
          <div className="space-y-6">
            {/* 搜索历史 */}
            {searchHistory.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {t('searchHistory')}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearHistory}
                    className="text-xs text-muted-foreground hover:text-destructive"
                  >
                    {t('clearHistory')}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {searchHistory.map((item, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
                      onClick={() => handleSuggestionClick(item)}
                    >
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 热门搜索 */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                {t('popularSearches')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((item, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all group"
                    onClick={() => handleSuggestionClick(item)}
                  >
                    <Sparkles className="h-3 w-3 mr-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {item}
                  </Badge>
                ))}
              </div>
            </div>

            {/* 搜索提示 */}
            <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
              💡 {t('searchTips')}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
