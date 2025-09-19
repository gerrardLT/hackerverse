'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, AlertCircle, Bookmark, Heart, MessageSquare, Calendar, ArrowLeft } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { apiService } from '@/lib/api'
import { AuthGuard } from '@/components/auth/auth-guard'
import { formatTimeAgo } from '@/lib/community'

interface BookmarkedPost {
  id: string
  title: string
  content: string
  excerpt?: string
  author: {
    id: string
    name: string
    username: string
    avatar?: string
    reputation: number
  }
  category: string
  tags: string[]
  createdAt: string
  updatedAt: string
  views: number
  likes: number
  replies: number
  bookmarks: number
  isPinned: boolean
  isLocked: boolean
}

export default function BookmarksPage() {
  const { toast } = useToast()
  const t = useTranslations('community.bookmarks')
  const tCommon = useTranslations('common')
  
  const [posts, setPosts] = useState<BookmarkedPost[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    loadBookmarks()
  }, [])

  const loadBookmarks = async (pageNum: number = 1) => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiService.getUserBookmarks({
        page: pageNum,
        limit: 20
      })

      if (response.success && response.data) {
        setPosts(pageNum === 1 ? response.data.posts : [...posts, ...response.data.posts])
        setHasMore(response.data.pagination.page < response.data.pagination.totalPages)
      } else {
        setError(response.error || t('loadError'))
      }
    } catch (error) {
      console.error('Load bookmarks error:', error)
      setError(t('networkError'))
    } finally {
      setLoading(false)
    }
  }

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    loadBookmarks(nextPage)
  }

  const handleUnbookmark = async (postId: string) => {
    try {
      const response = await apiService.bookmarkCommunityPost(postId)
      if (response.success) {
        setPosts(posts.filter(post => post.id !== postId))
        toast({
          title: t('unbookmarkSuccess'),
          description: t('unbookmarkSuccessDesc')
        })
      } else {
        throw new Error(response.error || t('operationFailed'))
      }
    } catch (error) {
      console.error('Unbookmark error:', error)
      toast({
        title: t('operationFailed'),
        description: error instanceof Error ? error.message : t('unbookmarkFailed'),
        variant: 'destructive'
      })
    }
  }

  return (
    <AuthGuard>
      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('backToConsole')}
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Bookmark className="w-8 h-8" />
              {t('title')}
            </h1>
            <p className="text-muted-foreground">{t('subtitle')}</p>
          </div>
        </div>

        {/* Loading */}
        {loading && page === 1 && (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">{t('loading')}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">{t('loadFailed')}</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => loadBookmarks()}>{t('retry')}</Button>
          </div>
        )}

        {/* Posts List */}
        {!loading && !error && (
          <div className="space-y-6">
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <Bookmark className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">{t('empty.title')}</h3>
                <p className="text-muted-foreground mb-4">{t('empty.description')}</p>
                <Button asChild>
                  <Link href="/community">{t('empty.browse')}</Link>
                </Button>
              </div>
            ) : (
              <>
                {posts.map((post) => (
                  <Card key={post.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          {/* Post Title and Content */}
                          <Link 
                            href={`/community/posts/${post.id}`}
                            className="block mb-3 hover:text-primary transition-colors"
                          >
                            <h2 className="text-xl font-semibold mb-2 line-clamp-2">
                              {post.title}
                            </h2>
                            {post.excerpt && (
                              <p className="text-muted-foreground line-clamp-3">{post.excerpt}</p>
                            )}
                          </Link>

                          {/* Author and Meta */}
                          <div className="flex items-center gap-4 mb-3">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarImage 
                                  src={post.author.avatar || "/placeholder.svg"} 
                                  alt={post.author.name} 
                                />
                                <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{post.author.name}</span>
                              <Badge variant="secondary" className="text-xs">
                                {t('reputation', { score: post.author.reputation })}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {formatTimeAgo(post.createdAt, locale)}
                            </div>
                          </div>

                          {/* Category and Tags */}
                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant="outline">{post.category}</Badge>
                            {Array.isArray(post.tags) && post.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>

                          {/* Stats */}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Heart className="w-4 h-4" />
                              {post.likes}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-4 h-4" />
                              {post.replies}
                            </span>
                            <span>{t('views', { count: post.views })}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnbookmark(post.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Bookmark className="w-4 h-4 mr-1 fill-current" />
                            {t('unbookmark')}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Load More */}
                {hasMore && (
                  <div className="text-center py-6">
                    <Button 
                      onClick={handleLoadMore} 
                      disabled={loading}
                      variant="outline"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          {t('loading')}
                        </>
                      ) : (
                        t('loadMore')
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </AuthGuard>
  )
}
