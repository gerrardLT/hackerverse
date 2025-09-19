'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { Search, Filter, Users, Hash, FileText, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { apiService, type CommunityPost } from '@/lib/api'
import { AuthGuard } from '@/components/auth/auth-guard'
import { 
  categoryColors, 
  categoryIcons,
  formatTimeAgo,
  type PostCategory
} from '@/lib/community'

interface SearchResults {
  posts?: {
    items: CommunityPost[]
    total: number
    pagination?: any
  }
  users?: {
    items: any[]
    total: number
    pagination?: any
  }
  tags?: {
    items: Array<{
      name: string
      count: number
      postsCount: number
    }>
    total: number
  }
}

export default function CommunitySearchPage() {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const t = useTranslations('community.search')
  const tCommon = useTranslations('common')
  const tCommunity = useTranslations('community')

  // 获取国际化的分类标签
  const getCategoryLabel = (category: PostCategory) => {
    return tCommunity(`categories.${category}`)
  }
  
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [activeTab, setActiveTab] = useState('all')
  const [results, setResults] = useState<SearchResults>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const urlQuery = searchParams.get('q')
    if (urlQuery && urlQuery !== query) {
      setQuery(urlQuery)
      handleSearch(urlQuery)
    }
  }, [searchParams])

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query
    if (!q.trim()) {
      toast({
        title: t('inputRequired'),
        description: t('inputRequiredDesc'),
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await apiService.searchCommunity({
        q: q.trim(),
        type: 'all',
        page: 1,
        limit: 20
      })

      if (response.success && response.data) {
        setResults(response.data.results)
      } else {
        setError(response.error || t('searchFailed'))
      }
    } catch (error) {
      console.error('Search error:', error)
      setError(t('networkError'))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch()
  }

  return (
    <AuthGuard>
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>

        {/* Search Form */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder={t('placeholder')}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('searchButton')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">{t('searching')}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">{t('searchFailed')}</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => handleSearch()}>{t('retry')}</Button>
          </div>
        )}

        {/* Results */}
        {!loading && !error && Object.keys(results).length > 0 && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">{t('tabs.all')}</TabsTrigger>
              <TabsTrigger value="posts">
                {t('tabs.posts', { count: results.posts?.total || 0 })}
              </TabsTrigger>
              <TabsTrigger value="users">
                {t('tabs.users', { count: results.users?.total || 0 })}
              </TabsTrigger>
              <TabsTrigger value="tags">
                {t('tabs.tags', { count: results.tags?.total || 0 })}
              </TabsTrigger>
            </TabsList>

            {/* All Results */}
            <TabsContent value="all" className="space-y-6">
              {/* Posts */}
              {results.posts && results.posts.items.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {t('sections.posts', { count: results.posts.total })}
                  </h3>
                  <div className="space-y-4">
                    {results.posts.items.slice(0, 5).map((post) => (
                      <Card key={post.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={post.author.avatar || "/placeholder.svg"} alt={post.author.name} />
                              <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={categoryColors[post.category]}>
                                  {categoryIcons[post.category]} {getCategoryLabel(post.category)}
                                </Badge>
                              </div>
                              <Link 
                                href={`/community/posts/${post.id}`}
                                className="block hover:text-primary transition-colors"
                              >
                                <h4 className="font-semibold mb-1 line-clamp-1">{post.title}</h4>
                              </Link>
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                {post.excerpt}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>{post.author.name}</span>
                                <span>{formatTimeAgo(post.createdAt, locale)}</span>
                                <span>{t('stats.likes', { count: post.likes })}</span>
                                <span>{t('stats.replies', { count: post.replies })}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {results.posts.total > 5 && (
                    <div className="text-center mt-4">
                      <Button variant="outline" onClick={() => setActiveTab('posts')}>
                        {t('actions.viewAllPosts', { count: results.posts.total })}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Users */}
              {results.users && results.users.items.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    {t('sections.users', { count: results.users.total })}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.users.items.slice(0, 6).map((user) => (
                      <Card key={user.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4 text-center">
                          <Avatar className="w-16 h-16 mx-auto mb-3">
                            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                            <AvatarFallback className="text-lg">{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <h4 className="font-semibold mb-1">{user.name}</h4>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {user.bio || t('stats.noBio')}
                          </p>
                          <div className="flex justify-center gap-4 text-xs text-muted-foreground">
                            <span>{t('stats.posts', { count: user.postsCount })}</span>
                            <span>{t('stats.followers', { count: user.followersCount })}</span>
                            <span>{t('stats.reputation', { count: user.reputation })}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {results.users.total > 6 && (
                    <div className="text-center mt-4">
                      <Button variant="outline" onClick={() => setActiveTab('users')}>
                        {t('actions.viewAllUsers', { count: results.users.total })}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Tags */}
              {results.tags && results.tags.items.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Hash className="w-5 h-5" />
                    {t('sections.tags', { count: results.tags.total })}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {results.tags.items.slice(0, 10).map((tag) => (
                      <Badge 
                        key={tag.name} 
                        variant="outline" 
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                        onClick={() => {
                          setQuery(tag.name)
                          handleSearch(tag.name)
                        }}
                      >
                        #{tag.name} ({tag.count})
                      </Badge>
                    ))}
                  </div>
                  {results.tags.total > 10 && (
                    <div className="text-center mt-4">
                      <Button variant="outline" onClick={() => setActiveTab('tags')}>
                        {t('actions.viewAllTags', { count: results.tags.total })}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Posts Tab */}
            <TabsContent value="posts">
              <div className="space-y-4">
                {results.posts?.items.map((post) => (
                  <Card key={post.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={post.author.avatar || "/placeholder.svg"} alt={post.author.name} />
                          <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={categoryColors[post.category]}>
                              {categoryIcons[post.category]} {getCategoryLabel(post.category)}
                            </Badge>
                          </div>
                          <Link 
                            href={`/community/posts/${post.id}`}
                            className="block hover:text-primary transition-colors"
                          >
                            <h3 className="text-lg font-semibold mb-2 line-clamp-2">{post.title}</h3>
                          </Link>
                          <p className="text-muted-foreground mb-3 line-clamp-2">{post.excerpt}</p>
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center gap-4">
                              <span className="font-medium">{post.author.name}</span>
                              <span>{formatTimeAgo(post.createdAt, locale)}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span>{t('stats.views', { count: post.views })}</span>
                              <span>{t('stats.likes', { count: post.likes })}</span>
                              <span>{t('stats.replies', { count: post.replies })}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.users?.items.map((user) => (
                  <Card key={user.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6 text-center">
                      <Avatar className="w-20 h-20 mx-auto mb-4">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                        <AvatarFallback className="text-xl">{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <h3 className="text-lg font-semibold mb-2">{user.name}</h3>
                      <p className="text-muted-foreground mb-4 line-clamp-3">
                        {user.bio || t('stats.noBio')}
                      </p>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-xl font-bold text-blue-600">{user.postsCount}</div>
                          <div className="text-sm text-muted-foreground">{t('stats.posts', { count: '' }).replace(/\d+\s*/, '')}</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold text-green-600">{user.followersCount}</div>
                          <div className="text-sm text-muted-foreground">{t('stats.followers', { count: '' }).replace(/\d+\s*/, '')}</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold text-purple-600">{user.reputation}</div>
                          <div className="text-sm text-muted-foreground">{t('stats.reputation', { count: '' }).replace(/\d+\s*/, '')}</div>
                        </div>
                      </div>
                      <Button className="w-full mt-4" variant="outline">
                        {t('actions.viewProfile')}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Tags Tab */}
            <TabsContent value="tags">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {results.tags?.items.map((tag) => (
                  <Card 
                    key={tag.name} 
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      setQuery(tag.name)
                      handleSearch(tag.name)
                    }}
                  >
                    <CardContent className="p-4 text-center">
                      <Hash className="w-8 h-8 mx-auto mb-2 text-primary" />
                      <h3 className="font-semibold mb-1">#{tag.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t('stats.postsUsed', { count: tag.count })}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* No Results */}
        {!loading && !error && Object.keys(results).length === 0 && query && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">{t('noResults')}</h3>
            <p className="text-muted-foreground">{t('noResultsDesc')}</p>
          </div>
        )}
      </div>
    </AuthGuard>
  )
}
