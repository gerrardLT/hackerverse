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
      router.push(`/hackathons?search=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleFocus = () => {
    setShowSuggestions(true)
  }

  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion)
    setShowSuggestions(false)
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
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 p-2 rounded-2xl border bg-background/50 backdrop-blur-sm">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors duration-200" />
                <Input
                  placeholder="Search hackathons by name, category, or technology..."
                  className="pl-12 h-14 text-lg border-0 bg-transparent focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>
              
              {/* Search Filters */}
              <div className="flex gap-2 items-center">
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
                  Virtual
                </Button>
                <Button
                  type="submit"
                  className="h-12 px-6 bg-primary hover:bg-primary/90"
                >
                  Search
                </Button>
              </div>
            </form>

            {/* Search Suggestions */}
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-2 z-10 bg-popover border rounded-xl shadow-lg p-4">
                <SearchSuggestions 
                  onSuggestionClick={handleSuggestionClick}
                  currentQuery={searchQuery}
                />
              </div>
            )}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button size="lg" asChild>
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