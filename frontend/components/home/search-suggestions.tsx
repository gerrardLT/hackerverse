'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Clock, Search } from 'lucide-react'

interface SearchSuggestionsProps {
  onSuggestionClick: (suggestion: string) => void
  currentQuery?: string
}

export function SearchSuggestions({ onSuggestionClick, currentQuery }: SearchSuggestionsProps) {
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [popularSearches, setPopularSearches] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  // 从 localStorage 获取搜索历史和加载热门搜索词
  useEffect(() => {
    // 加载搜索历史
    const loadSearchHistory = () => {
      try {
        const history = localStorage.getItem('hackathon-search-history')
        if (history) {
          const parsedHistory = JSON.parse(history)
          setSearchHistory(parsedHistory.slice(0, 5)) // 只显示最近5个
        }
      } catch (error) {
        console.error('解析搜索历史失败:', error)
      }
    }
      
    // 加载热门搜索词
    const loadPopularSearches = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/search/suggestions')
        const result = await response.json()
          
        if (result.success && result.data?.popularSearches) {
          setPopularSearches(result.data.popularSearches)
        } else {
          // 使用后备数据
          setPopularSearches(['Web3', 'DeFi', 'NFT', '区块链', 'AI', '智能合约', '元宇宙', 'GameFi', 'DAO', 'Layer2'])
        }
      } catch (error) {
        console.error('获取热门搜索词失败:', error)
        // 使用后备数据
        setPopularSearches(['Web3', 'DeFi', 'NFT', '区块链', 'AI', '智能合约', '元宇宙', 'GameFi', 'DAO', 'Layer2'])
      } finally {
        setLoading(false)
      }
    }
      
    loadSearchHistory()
    loadPopularSearches()
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
        console.error('解析搜索历史失败:', error)
      }
    }

    // 移除重复项并将新搜索添加到开头
    searchHistoryArray = searchHistoryArray.filter(item => item !== query)
    searchHistoryArray.unshift(query)
    
    // 只保留最近10个搜索
    searchHistoryArray = searchHistoryArray.slice(0, 10)
    
    localStorage.setItem('hackathon-search-history', JSON.stringify(searchHistoryArray))
    setSearchHistory(searchHistoryArray.slice(0, 5))
  }

  const handleSuggestionClick = (suggestion: string) => {
    saveSearchHistory(suggestion)
    onSuggestionClick(suggestion)
  }

  const clearSearchHistory = () => {
    localStorage.removeItem('hackathon-search-history')
    setSearchHistory([])
  }

  if (!currentQuery && searchHistory.length === 0 && popularSearches.length === 0) {
    return null
  }

  return (
    <div className="mt-4 space-y-4">
      {/* 搜索历史 */}
      {searchHistory.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>搜索历史</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearchHistory}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              清空
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((item, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="cursor-pointer hover:bg-primary/20 hover:text-primary"
                onClick={() => handleSuggestionClick(item)}
              >
                {item}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* 热门搜索 */}
      {popularSearches.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>热门搜索</span>
            {loading && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
          </div>
          <div className="flex flex-wrap gap-2">
            {popularSearches.map((item, index) => (
              <Badge
                key={index}
                variant="outline"
                className="cursor-pointer hover:bg-primary/20 hover:text-primary hover:border-primary"
                onClick={() => handleSuggestionClick(item)}
              >
                {item}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 