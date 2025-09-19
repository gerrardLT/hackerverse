'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Clock, Search } from 'lucide-react'
import { apiService } from '@/lib/api'

// 为防重复请求添加全局标志
declare global {
  interface Window {
    popularSearchesLoading?: boolean
  }
}

interface SearchSuggestionsProps {
  onSuggestionClick: (suggestion: string) => void
  currentQuery?: string
}

export function SearchSuggestions({ onSuggestionClick, currentQuery }: SearchSuggestionsProps) {
  const t = useTranslations('home.hero.searchSuggestions')
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [popularSearches, setPopularSearches] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  // Load search history from localStorage and popular search terms
  useEffect(() => {
    // Load search history
    const loadSearchHistory = () => {
      try {
        const history = localStorage.getItem('hackathon-search-history')
        if (history) {
          const parsedHistory = JSON.parse(history)
          setSearchHistory(parsedHistory.slice(0, 5)) // 只显示最近5个
        }
      } catch (error) {
        console.error(t('history.loadError') + ':', error)
      }
    }
      
    // Load popular search terms with caching and deduplication
    const loadPopularSearches = async () => {
      // 🔄 检查缓存（缓存5分钟）
      const CACHE_KEY = 'hackathon-popular-searches'
      const CACHE_DURATION = 5 * 60 * 1000 // 5分钟
      
      try {
        const cachedData = localStorage.getItem(CACHE_KEY)
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData)
          if (Date.now() - timestamp < CACHE_DURATION) {
            console.log('🔍 使用缓存的热门搜索词:', data)
            setPopularSearches(data)
            return // 使用缓存，不发送请求
          }
        }
      } catch (error) {
        console.error('缓存解析错误:', error)
      }

      // 🚫 防止重复请求
      if (window.popularSearchesLoading) {
        console.log('🔍 搜索建议API请求正在进行中，跳过重复请求')
        return
      }

      try {
        window.popularSearchesLoading = true
        setLoading(true)
        console.log('🔍 ' + t('popular.loadingStart'))
        
        // 使用apiService确保请求到正确的后端端口
        const result = await apiService.request('/search/suggestions', {
          method: 'GET'
        })
        
        console.log('🔍 搜索建议API响应:', result)
          
        if (result.success && result.data?.popularSearches) {
          setPopularSearches(result.data.popularSearches)
          
          // 💾 缓存结果
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            data: result.data.popularSearches,
            timestamp: Date.now()
          }))
          
          console.log('🔍 ' + t('popular.loadSuccess') + ':', result.data.popularSearches)
        } else {
          console.log('🔍 ' + t('popular.fallbackNote'))
          // Use fallback data
          const fallbackTerms = ['Web3', 'DeFi', 'NFT', 'AI', '区块链', '智能合约', 'DAO', 'GameFi']
          setPopularSearches(fallbackTerms)
        }
      } catch (error) {
        console.error('❌ ' + t('popular.loadError') + ':', error)
        // Use fallback data
        const fallbackTerms = ['Web3', 'DeFi', 'NFT', 'AI', '区块链', '智能合约', 'DAO', 'GameFi']
        setPopularSearches(fallbackTerms)
      } finally {
        setLoading(false)
        window.popularSearchesLoading = false
      }
    }
      
    loadSearchHistory()
    loadPopularSearches()
  }, [])

  // Save search history
  const saveSearchHistory = (query: string) => {
    if (!query.trim()) return

    const history = localStorage.getItem('hackathon-search-history')
    let searchHistoryArray: string[] = []
    
    if (history) {
      try {
        searchHistoryArray = JSON.parse(history)
      } catch (error) {
        console.error(t('history.loadError') + ':', error)
      }
    }

    // Remove duplicates and add new search to the beginning
    searchHistoryArray = searchHistoryArray.filter(item => item !== query)
    searchHistoryArray.unshift(query)
    
    // Keep only the last 10 searches
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
      {/* Search History */}
      {searchHistory.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{t('history.title')}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearchHistory}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {t('history.clear')}
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

      {/* Popular Searches */}
      {popularSearches.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>{t('popular.title')}</span>
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