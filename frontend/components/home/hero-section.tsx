'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, ArrowRight } from 'lucide-react'
import { SearchSuggestions } from './search-suggestions'

export function HeroSection() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // 💾 保存搜索记录
      saveSearchHistory(searchQuery.trim())
      router.push(`/hackathons?search=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleFocus = () => {
    setShowSuggestions(true)
  }

  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200)
  }

  // 保存搜索历史的函数
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
  }

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion)
    setShowSuggestions(false)
    // 💾 保存搜索记录
    saveSearchHistory(suggestion)
    router.push(`/hackathons?search=${encodeURIComponent(suggestion)}`)
  }

  const handleFilterClick = (filter: string) => {
    router.push(`/hackathons?filter=${filter}`)
  }

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="outline" className="mb-6">
            🚀 Build the Future Together
          </Badge>
          
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
            Welcome to the{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Hackerverse
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-4 font-medium">
            Where Hackers Meet the Metaverse
          </p>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join the premier Web3-powered hackathon platform where developers, innovators, and creators collaborate to build the next generation of decentralized applications in virtual worlds.
          </p>

          {/* Search Section */}
          <div className="relative max-w-2xl mx-auto mb-8">
            <form onSubmit={handleSearch} className="flex items-center gap-4 p-2 rounded-2xl border bg-background/50 backdrop-blur-sm">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors duration-200" />
                <Input
                  placeholder="Search hackathons by name, category, or technology..."
                  className="pl-12 h-12 text-base border-0 bg-transparent focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>
              
              <Button
                type="submit"
                className="h-8 px-6 bg-primary hover:bg-primary/90"
              >
                Search
              </Button>
            </form>
            
            {/* Search Filters - moved below */}
            <div className="flex gap-3 justify-center mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleFilterClick('upcoming')}
                className="text-sm"
              >
                Upcoming
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleFilterClick('virtual')}
                className="text-sm"
              >
                Online
              </Button>
            </div>

            {/* Search Suggestions */}
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 z-[99999] bg-popover border rounded-xl shadow-lg p-4" style={{ marginTop: '-42px' }}>
                <SearchSuggestions 
                  onSuggestionClick={handleSuggestionClick}
                  currentQuery={searchQuery}
                />
              </div>
            )}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button size="default" asChild className="h-10 shadow-2xl shadow-primary/50 drop-shadow-xl hover:shadow-[0_25px_50px_-12px] hover:shadow-primary/60 hover:drop-shadow-2xl transition-all duration-300">
              <Link href="/hackathons">
                Explore Hackathons
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/hackathons/create">
                Create Hackathon
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}