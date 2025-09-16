'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Search, Filter, Plus, TrendingUp, MessageSquare, Users, Eye, Loader2, AlertCircle, Heart, Sparkles, Flame, Clock, Star, Bookmark, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { apiService } from '@/lib/api'
import { AuthGuard } from '@/components/auth/auth-guard'
import { 
  categoryColors,
  categoryIcons,
  formatTimeAgo,
  type PostCategory,
  type CommunityStats
} from '@/lib/community'

interface CommunityPost {
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
  category: 'general' | 'technical' | 'showcase' | 'help' | 'announcement'
  tags: string[]
  createdAt: string
  updatedAt: string
  views: number
  likes: number
  replies: number
  isPinned: boolean
  isLocked: boolean
  lastReplyAt?: string
  lastReplyBy?: {
    id: string
    name: string
    username: string
    avatar?: string
  }
  // 用户态状态
  isLiked?: boolean
  isBookmarked?: boolean
}

interface TopContributor {
  id: string
  name: string
  username: string
  avatar?: string
  reputation: number
  postsCount: number
  repliesCount: number
}

export default function CommunityPage() {
  const t = useTranslations('community')
  const tCommon = useTranslations('common')
  const pageRef = useRef<HTMLDivElement>(null)

  // 获取国际化的分类标签
  const getCategoryLabel = (category: PostCategory) => {
    return t(`categories.${category}`)
  }

  // 所有分类列表
  const categories: PostCategory[] = ['general', 'technical', 'showcase', 'help', 'announcement']
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [stats, setStats] = useState<CommunityStats | null>(null)
  const [topContributors, setTopContributors] = useState<TopContributor[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState('latest')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const { toast } = useToast()

  // 页面进入动画
  useEffect(() => {
    setIsVisible(true)
  }, [])

  useEffect(() => {
    loadCommunityData()
  }, [])

  const loadCommunityData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const postsResponse = await apiService.getCommunityPosts({
        page: 1,
        limit: 50,
        sortBy: sortBy === 'latest' ? 'createdAt' : sortBy === 'popular' ? 'likes' : 'views'
      })
      
      if (postsResponse.success && postsResponse.data) {
        setPosts(postsResponse.data.posts)
        if (postsResponse.data.stats) {
          setStats(postsResponse.data.stats)
          setTopContributors(postsResponse.data.stats.topContributors || [])
        }
      } else {
        setError(postsResponse.error || t('loading.loadingFailed'))
      }
    } catch (error) {
      console.error('加载社区数据失败:', error)
      setError(t('loading.networkError'))
    } finally {
      setLoading(false)
    }
  }

  const handleToggleLike = async (postId: string, currentlyLiked: boolean) => {
    try {
      const response = await apiService.likeCommunityPost(postId)
      if (response.success) {
        // 更新本地状态
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                isLiked: response.data?.isLiked || !currentlyLiked,
                likes: response.data?.likeCount || (currentlyLiked ? post.likes - 1 : post.likes + 1)
              }
            : post
        ))
      }
    } catch (error) {
      console.error(t('loading.toggleLikeFailed'), error)
    }
  }

  const handleToggleBookmark = async (postId: string, currentlyBookmarked: boolean) => {
    try {
      const response = await apiService.bookmarkCommunityPost(postId)
      if (response.success) {
        // 更新本地状态
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, isBookmarked: response.data?.isBookmarked || !currentlyBookmarked }
            : post
        ))
      }
    } catch (error) {
      console.error(t('loading.toggleBookmarkFailed'), error)
    }
  }

  // 筛选和搜索帖子
  const filteredPosts = posts.filter(post => {
    const matchesSearch = !searchQuery || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (Array.isArray(post.tags) && post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
    
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="relative min-h-screen">
        {/* 动态背景 */}
        <div className="absolute inset-0 gradient-mesh opacity-20 -z-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background -z-10" />
        
        <div className="container py-8 relative">
          <div className="flex justify-center py-16">
            <div className="glass border border-primary/20 rounded-2xl p-8 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">{t('loading.community')}</p>
              <p className="text-sm text-muted-foreground">{t('loading.communityDetails')}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="relative min-h-screen">
        {/* 动态背景 */}
        <div className="absolute inset-0 gradient-mesh opacity-20 -z-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background -z-10" />
        
        <div className="container py-8 relative">
          <div className="flex flex-col items-center justify-center py-16 space-y-6">
            <div className="relative">
              <div className="glass border border-destructive/20 rounded-2xl p-8 text-center max-w-md">
                <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4 animate-bounce-gentle" />
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-foreground">{t('loading.failed')}</h3>
                  <p className="text-muted-foreground leading-relaxed">{error}</p>
                  <div className="pt-4">
                    <Button 
                      onClick={loadCommunityData}
                      className="glass hover-lift px-6 py-2 rounded-xl transition-all duration-300 hover:bg-primary/10"
                    >
                      {t('loading.retry')}
                    </Button>
                  </div>
                </div>
              </div>
              {/* 错误状态光环 */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-destructive/10 to-destructive/5 animate-pulse-slow -z-10" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AuthGuard>
      <div ref={pageRef} className="relative min-h-screen">
        {/* 动态背景 */}
        <div className="absolute inset-0 gradient-mesh opacity-20 -z-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background -z-10" />
        
        {/* 顶部装饰性浮动元素 */}
        <div className="absolute top-20 left-10 w-2 h-2 bg-primary/30 rounded-full animate-pulse-slow" />
        <div className="absolute top-32 right-20 w-1 h-1 bg-secondary/40 rounded-full animate-pulse-slow" style={{ animationDelay: '1s' }} />

        <div className="container py-8 relative">
          {/* 现代化页面标题区域 */}
          <div className={`text-center space-y-6 mb-12 transition-all duration-1000 ${isVisible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'}`}>
            <div className="space-y-4">
              <h1 className="text-responsive-lg font-bold tracking-tight">
                <span className="text-gradient animate-shimmer">{t('title')}</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                {t('description')}
              </p>
            </div>

            {/* 顶部操作栏 */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button className="group hover-lift hover-glow bg-primary hover:bg-primary/90" asChild>
                <Link href="/community/new">
                  <Plus className="h-4 w-4 mr-2 transition-transform group-hover:scale-110" />
                  {t('post.publishPost')}
                  <Sparkles className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </Button>
              <Button variant="outline" className="glass hover-lift" asChild>
                <Link href="/community/search">
                  <Search className="h-4 w-4 mr-2" />
                  {t('search.advancedSearch')}
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* 主要内容区域 */}
            <div className="lg:col-span-3 space-y-6">
              {/* 现代化搜索和筛选栏 */}
              <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'}`}>
                <div className="glass border border-primary/10 rounded-2xl p-6 space-y-4">
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* 增强型搜索框 */}
                    <div className="flex-1 relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                      <Input
                        placeholder={t('search.placeholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 h-12 text-base glass border-primary/20 transition-all duration-300 focus:border-primary/40 focus:shadow-glow"
                      />
                    </div>

                    {/* 分类筛选 */}
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-full lg:w-48 h-12 glass border-primary/20">
                        <SelectValue placeholder={t('search.category')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('search.allCategories')}</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {categoryIcons[category]} {getCategoryLabel(category)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* 排序方式 */}
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-full lg:w-40 h-12 glass border-primary/20">
                        <SelectValue placeholder={t('search.sort')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="latest">
                          <Clock className="w-4 h-4 mr-2 inline" />
                          {t('search.latest')}
                        </SelectItem>
                        <SelectItem value="popular">
                          <Flame className="w-4 h-4 mr-2 inline" />
                          {t('search.popular')}
                        </SelectItem>
                        <SelectItem value="replies">
                          <MessageSquare className="w-4 h-4 mr-2 inline" />
                          {t('search.mostReplies')}
                        </SelectItem>
                        <SelectItem value="views">
                          <Eye className="w-4 h-4 mr-2 inline" />
                          {t('search.mostViews')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 筛选结果统计 */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{t('search.resultsCount', { count: filteredPosts.length })}</span>
                    {(searchQuery || selectedCategory !== 'all') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSearchQuery('')
                          setSelectedCategory('all')
                        }}
                        className="text-xs"
                      >
                        清除筛选
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* 现代化帖子列表 */}
              <div className={`space-y-6 transition-all duration-1000 delay-500 ${isVisible ? 'animate-fade-in opacity-100' : 'opacity-0'}`}>
                {filteredPosts.map((post, index) => (
                  <div
                    key={post.id}
                    className="animate-slide-up"
                    style={{ animationDelay: `${600 + index * 100}ms` }}
                  >
                    <div className="group relative glass border border-primary/10 hover:border-primary/30 rounded-2xl p-6 hover-lift hover-glow transition-all duration-500">
                      {/* 背景渐变效果 */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 rounded-2xl" />
                      
                      <div className="flex items-start gap-6">
                        {/* 用户头像 */}
                        <div className="relative">
                          <Avatar className="w-14 h-14 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                            <AvatarImage src={post.author.avatar || "/placeholder.svg"} alt={post.author.name} />
                            <AvatarFallback className="bg-gradient-primary text-primary-foreground text-lg">
                              {post.author.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          {/* 用户声望指示器 */}
                          <div className="absolute -bottom-1 -right-1 bg-gradient-primary text-white text-xs px-1.5 py-0.5 rounded-full">
                            {post.author.reputation}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0 space-y-4">
                          {/* 帖子分类和状态 */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`${categoryColors[post.category]} animate-slide-in shadow-sm`}>
                              {categoryIcons[post.category]} {getCategoryLabel(post.category)}
                            </Badge>
                            {post.isPinned && (
                              <Badge variant="outline" className="text-blue-600 dark:text-blue-400 border-blue-200 animate-slide-in" style={{ animationDelay: '0.1s' }}>
                                📌 {t('post.pinned')}
                              </Badge>
                            )}
                            {post.isLocked && (
                              <Badge variant="outline" className="text-muted-foreground border-muted animate-slide-in" style={{ animationDelay: '0.2s' }}>
                                🔒 {t('post.locked')}
                              </Badge>
                            )}
                            {/* 热门帖子指示器 */}
                            {post.likes > 10 && (
                              <Badge variant="outline" className="text-orange-600 border-orange-200 animate-slide-in" style={{ animationDelay: '0.3s' }}>
                                🔥 热门
                              </Badge>
                            )}
                          </div>
                          
                          {/* 帖子标题和内容 */}
                          <div className="space-y-3">
                            <Link 
                              href={`/community/posts/${post.id}`}
                              className="block group-hover:text-primary transition-colors duration-300"
                            >
                              <h3 className="text-xl font-bold line-clamp-2 leading-tight hover:underline">
                                {post.title}
                              </h3>
                            </Link>
                            
                            <p className="text-muted-foreground line-clamp-3 leading-relaxed">
                              {post.excerpt}
                            </p>
                          </div>
                          
                          {/* 帖子元信息和操作 */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                                  {post.author.name}
                                </span>
                                <span>·</span>
                                <span>{formatTimeAgo(post.createdAt)}</span>
                              </div>
                            </div>
                            
                            {/* 交互操作栏 */}
                            <div className="flex items-center gap-4">
                              {/* 浏览数 */}
                              <div className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                <Eye className="w-4 h-4" />
                                <span>{post.views}</span>
                              </div>

                              {/* 点赞按钮 */}
                              <button 
                                className="flex items-center gap-1 text-sm transition-all duration-300 hover:scale-110"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleToggleLike(post.id, post.isLiked || false)
                                }}
                              >
                                <Heart className={`w-4 h-4 transition-colors ${
                                  post.isLiked 
                                    ? 'text-red-500 fill-current' 
                                    : 'text-muted-foreground hover:text-red-500'
                                }`} />
                                <span className={post.isLiked ? 'text-red-500 font-medium' : 'text-muted-foreground'}>
                                  {post.likes}
                                </span>
                              </button>

                              {/* 回复数 */}
                              <div className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
                                <MessageSquare className="w-4 h-4" />
                                <span>{post.replies}</span>
                              </div>

                              {/* 收藏按钮 */}
                              <button 
                                className="flex items-center gap-1 text-sm transition-all duration-300 hover:scale-110"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleToggleBookmark(post.id, post.isBookmarked || false)
                                }}
                              >
                                <Bookmark className={`w-4 h-4 transition-colors ${
                                  post.isBookmarked 
                                    ? 'text-yellow-500 fill-current' 
                                    : 'text-muted-foreground hover:text-yellow-500'
                                }`} />
                              </button>

                              {/* 分享按钮 */}
                              <button 
                                className="flex items-center gap-1 text-sm transition-all duration-300 hover:scale-110 text-muted-foreground hover:text-primary"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  // TODO: 实现分享功能
                                }}
                              >
                                <Share2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 装饰性边框光效 */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 animate-pulse-slow" />
                    </div>
                  </div>
                ))}
              </div>

              {/* 现代化空状态 */}
              {filteredPosts.length === 0 && (
                <div className={`transition-all duration-1000 delay-700 ${isVisible ? 'animate-fade-in opacity-100' : 'opacity-0'}`}>
                  <div className="flex flex-col items-center justify-center py-16 space-y-6">
                    <div className="relative">
                      <div className="glass rounded-2xl p-12 text-center max-w-md">
                        <div className="w-20 h-20 bg-muted/50 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                          <MessageSquare className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <div className="space-y-3">
                          <h3 className="text-xl font-semibold text-foreground">{t('empty.noPosts')}</h3>
                          <p className="text-muted-foreground leading-relaxed">
                            {searchQuery || selectedCategory !== 'all' 
                              ? t('empty.adjustFilter')
                              : '社区正在等待您的第一篇帖子！'}
                          </p>
                          <div className="pt-4">
                            <Button className="bg-primary hover:bg-primary/90 hover-lift hover-glow" asChild>
                              <Link href="/community/new">
                                <Plus className="w-4 h-4 mr-2" />
                                {t('empty.publishFirst')}
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                      {/* 空状态装饰光环 */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/5 to-secondary/5 animate-pulse-slow -z-10" />
                    </div>
                  </div>
                </div>
              )}
        </div>

            {/* 现代化侧边栏 */}
            <div className="space-y-6">
              {/* 现代化社区统计 */}
              <div className={`transition-all duration-1000 delay-400 ${isVisible ? 'animate-slide-left opacity-100' : 'opacity-0 translate-x-10'}`}>
                <div className="glass border border-primary/10 rounded-2xl p-6 relative overflow-hidden">
                  {/* 背景装饰 */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full -translate-y-6 translate-x-6" />
                  
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-gradient-primary rounded-xl">
                        <TrendingUp className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground">{t('stats.title')}</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="text-center p-4 glass rounded-xl border border-primary/10">
                        <div className="text-3xl font-bold text-gradient mb-1">
                          {stats?.totalPosts || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">{t('stats.totalPosts')}</div>
                      </div>
                      <div className="text-center p-4 glass rounded-xl border border-primary/10">
                        <div className="text-3xl font-bold text-gradient mb-1">
                          {stats?.activeUsers || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">{t('stats.activeUsers')}</div>
                      </div>
                      <div className="text-center p-4 glass rounded-xl border border-primary/10">
                        <div className="text-3xl font-bold text-gradient mb-1">
                          {stats?.totalUsers || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">{t('stats.weeklyPosts')}</div>
                      </div>
                      <div className="text-center p-4 glass rounded-xl border border-primary/10">
                        <div className="text-3xl font-bold text-gradient mb-1">
                          {stats?.totalReplies || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">{t('stats.totalLikes')}</div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-primary/20 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {t('stats.todayPosts')}
                        </span>
                        <span className="font-semibold text-primary">{stats?.todayPosts || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          {t('stats.todayReplies')}
                        </span>
                        <span className="font-semibold text-primary">{stats?.todayReplies || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 现代化顶级贡献者 */}
              <div className={`transition-all duration-1000 delay-600 ${isVisible ? 'animate-slide-left opacity-100' : 'opacity-0 translate-x-10'}`}>
                <div className="glass border border-primary/10 rounded-2xl p-6 relative overflow-hidden">
                  {/* 背景装饰 */}
                  <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-secondary/10 to-primary/10 rounded-full translate-y-6 -translate-x-6" />
                  
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-gradient-primary rounded-xl">
                        <Users className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground">{t('contributors.title')}</h3>
                    </div>

                    <div className="space-y-4">
                      {topContributors.map((contributor, index) => (
                        <div key={contributor.id} className="group flex items-center gap-4 p-3 glass rounded-xl border border-primary/10 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
                          {/* 排名徽章 */}
                          <div className="relative">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold text-white ${
                              index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                              index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-500' :
                              index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                              'bg-gradient-primary'
                            }`}>
                              {index + 1}
                            </div>
                            {index < 3 && (
                              <Star className="absolute -top-1 -right-1 w-3 h-3 text-yellow-400 fill-current" />
                            )}
                          </div>

                          {/* 用户头像 */}
                          <Avatar className="w-10 h-10 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                            <AvatarImage src={contributor.avatar || "/placeholder.svg"} alt={contributor.name} />
                            <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                              {contributor.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>

                          {/* 用户信息 */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                              {contributor.name}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                {contributor.reputation} 声望
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" />
                                {contributor.postsCount} 帖子
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 现代化社区规则 */}
              <div className={`transition-all duration-1000 delay-800 ${isVisible ? 'animate-slide-left opacity-100' : 'opacity-0 translate-x-10'}`}>
                <div className="glass border border-primary/10 rounded-2xl p-6 relative overflow-hidden">
                  {/* 背景装饰 */}
                  <div className="absolute top-0 left-0 w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full -translate-y-4 -translate-x-4" />
                  
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-gradient-primary rounded-xl">
                        <Sparkles className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground">{t('rules.title')}</h3>
                    </div>

                    <div className="space-y-4 text-sm">
                      {[
                        { key: 'rule1', icon: '🤝' },
                        { key: 'rule2', icon: '💬' },
                        { key: 'rule3', icon: '🔒' },
                        { key: 'rule4', icon: '📚' },
                        { key: 'rule5', icon: '⚡' }
                      ].map((rule, index) => (
                        <div 
                          key={rule.key}
                          className="flex items-start gap-3 p-3 glass rounded-xl border border-primary/10 transition-all duration-300 hover:border-primary/30"
                        >
                          <div className="flex items-center justify-center w-8 h-8 bg-gradient-primary rounded-full text-white text-xs font-bold">
                            {rule.icon}
                          </div>
                          <div className="flex-1">
                            <span className="text-foreground leading-relaxed">
                              {t(`rules.${rule.key}`)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 底部行动号召 */}
                    <div className="mt-6 pt-4 border-t border-primary/20">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-3">
                          遵守社区规则，共建和谐氛围
                        </p>
                        <Button size="sm" variant="outline" className="glass hover-lift" asChild>
                          <Link href="/community/guidelines">
                            查看完整规则
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 底部装饰性浮动元素 */}
          <div className="absolute bottom-20 right-10 w-1.5 h-1.5 bg-primary/40 rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-32 left-1/4 w-1 h-1 bg-secondary/30 rounded-full animate-pulse-slow" style={{ animationDelay: '3s' }} />
        </div>
      </div>
    </AuthGuard>
  )
}
