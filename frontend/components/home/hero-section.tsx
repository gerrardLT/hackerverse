'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, ArrowRight, Code, Users, Trophy } from 'lucide-react'
import { SearchSuggestions } from './search-suggestions'

export function HeroSection() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!searchQuery.trim()) {
      return
    }

    setIsSearching(true)
    setShowSuggestions(false)
    
    try {
      // 构建搜索URL参数
      const searchParams = new URLSearchParams({
        search: searchQuery.trim(),
        page: '1'
      })
      
      // 跳转到黑客松页面并传递搜索参数
      router.push(`/hackathons?${searchParams.toString()}`)
    } catch (error) {
      console.error('搜索跳转失败:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(e)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion)
    setShowSuggestions(false)
    
    // 自动执行搜索
    const searchParams = new URLSearchParams({
      search: suggestion,
      page: '1'
    })
    router.push(`/hackathons?${searchParams.toString()}`)
  }

  const handleInputFocus = () => {
    setShowSuggestions(true)
  }

  const handleInputBlur = () => {
    // 延迟隐藏建议，以便用户能点击建议项
    setTimeout(() => setShowSuggestions(false), 200)
  }

  return (
    <section className="relative py-20 md:py-32 bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              构建未来
              <span className="text-primary"> 去中心化</span>
              <br />
              黑客松平台
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              基于 IPFS 的开源黑客松平台，连接全球数百万开发者，
              发现创新项目，获得投资机会，构建 Web3 未来！
            </p>
          </div>

          <div className="relative max-w-md mx-auto">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索黑客松..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  disabled={isSearching}
                />
              </div>
              <Button 
                type="submit" 
                size="lg" 
                className="px-8"
                disabled={isSearching || !searchQuery.trim()}
              >
                {isSearching ? '搜索中...' : '开始探索'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            {/* 搜索建议 */}
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card border rounded-lg shadow-lg p-4 z-10">
                <SearchSuggestions 
                  onSuggestionClick={handleSuggestionClick}
                  currentQuery={searchQuery}
                />
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" size="lg" asChild>
              <Link href="/hackathons">
                <Trophy className="mr-2 h-4 w-4" />
                参与黑客松
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/hackathons/create">
                <Users className="mr-2 h-4 w-4" />
                组织活动
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/projects">
                <Code className="mr-2 h-4 w-4" />
                浏览项目
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-32 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
      </div>
    </section>
  )
}
