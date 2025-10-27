'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'
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
  const locale = useLocale()
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
      console.error(t('console.loadCommunityDataFailed'), error)
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
      console.error(t('console.toggleLikeFailed'), error)
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
      console.error(t('console.toggleBookmarkFailed'), error)
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

        {/* 主内容区 - max-width 1280px */}
        <div className="container max-w-[1280px] mx-auto px-4 md:px-6">
          {/* 紧凑头部工具栏 - 80px高度 - Flat Design 2.0 */}
          <div className="h-[80px] flex items-center justify-between border-b border-border/50">
            {/* 左侧：标题+统计 */}
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {stats ? `${stats.totalPosts} ${t('posts')} · ${stats.totalUsers} ${t('members')}` : t('loading.stats')}
              </p>
            </div>

            {/* 右侧：搜索+分类+排序+发帖 */}
            <div className="flex items-center gap-2">
              <div className="relative w-[200px] hidden md:block">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('search.placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 pl-8 text-sm"
                />
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[120px] h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('search.allCategories')}</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {getCategoryLabel(category)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[100px] h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">{t('search.latest')}</SelectItem>
                  <SelectItem value="popular">{t('search.popular')}</SelectItem>
                  <SelectItem value="replies">{t('search.mostReplies')}</SelectItem>
                </SelectContent>
              </Select>

              <Button size="sm" asChild className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                <Link href="/community/new">
                  <Plus className="h-4 w-4 mr-1" />
                  {t('post.publish')}
                </Link>
              </Button>
            </div>
          </div>

          {/* 社区规则 - 可折叠隐藏式 */}
          <details className="mt-4 group">
            <summary className="cursor-pointer list-none">
              <div className="glass-light border border-border/50 rounded-xl p-3 hover:border-primary/30 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">{t('rules.title')}</span>
                    <Badge variant="outline" className="text-xs">5 {t('rules.count')}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground group-open:rotate-180 transition-transform">
                    ▼
                  </div>
                </div>
              </div>
            </summary>
            <div className="mt-2 glass-light border border-border/50 rounded-xl p-4 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {[
                  { key: 'rule1', icon: '🤝' },
                  { key: 'rule2', icon: '💬' },
                  { key: 'rule3', icon: '🔒' },
                  { key: 'rule4', icon: '📚' },
                  { key: 'rule5', icon: '⚡' }
                ].map((rule) => (
                  <div key={rule.key} className="flex items-start gap-2 p-2 rounded-lg hover:bg-primary/5 transition-colors">
                    <span className="text-lg shrink-0">{rule.icon}</span>
                    <span className="text-xs text-muted-foreground leading-tight">
                      {t(`rules.${rule.key}`)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </details>

          {/* 双栏布局：主内容 + 侧边栏(280px) */}
          <div className="py-4 flex flex-col lg:flex-row gap-4">
            {/* 主要内容区域 */}
            <div className="flex-1 min-w-0">

              {/* 紧凑帖子列表 - 80-100px高度 - Flat Design 2.0 */}
              <div className="space-y-2">
                {filteredPosts.map((post, index) => (
                  <Link key={post.id} href={`/community/posts/${post.id}`}>
                    <Card className="border-border/50 hover:border-primary/50 hover:shadow-md transition-all duration-300 hover-lift group cursor-pointer">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          {/* 用户头像 - 紧凑 */}
                          <div className="relative shrink-0">
                            <Avatar className="w-10 h-10 ring-2 ring-border group-hover:ring-primary/40 transition-all">
                              <AvatarImage src={post.author.avatar || "/placeholder.svg"} alt={post.author.name} />
                              <AvatarFallback className="bg-gradient-primary text-primary-foreground text-sm">
                                {post.author.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          
                          <div className="flex-1 min-w-0 space-y-1.5">
                            {/* 第一行：分类+标题 */}
                            <div className="flex items-start gap-2">
                              <Badge className={`${categoryColors[post.category]} text-xs h-5 px-1.5 shrink-0`}>
                                {getCategoryLabel(post.category)}
                              </Badge>
                              {post.isPinned && (
                                <Badge variant="outline" className="text-xs h-5 px-1.5 shrink-0">📌</Badge>
                              )}
                              <h3 className="text-sm font-semibold line-clamp-1 leading-tight group-hover:text-primary transition-colors flex-1 min-w-0">
                                {post.title}
                              </h3>
                            </div>
                            
                            {/* 第二行：摘要 */}
                            <p className="text-xs text-muted-foreground line-clamp-1 leading-tight">
                              {post.excerpt}
                            </p>
                            
                            {/* 第三行：作者+时间+统计 */}
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <span className="font-medium group-hover:text-primary transition-colors">
                                  {post.author.name}
                                </span>
                                <span>·</span>
                                <span>{formatTimeAgo(post.createdAt, locale)}</span>
                              </div>
                              
                              {/* 统计信息 */}
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
                      </CardContent>
                    </Card>
                  </Link>
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
                              : t('waitingForFirstPost')}
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
            <div className="w-full lg:w-[280px] shrink-0 space-y-4">
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
                        <div key={contributor.id} className="group flex items-center gap-3 p-2.5 glass rounded-xl border border-primary/10 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
                          {/* 排名徽章 */}
                          <div className="relative shrink-0">
                            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold text-white ${
                              index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                              index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-500' :
                              index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                              'bg-gradient-primary'
                            }`}>
                              {index + 1}
                            </div>
                            {index < 3 && (
                              <Star className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 text-yellow-400 fill-current" />
                            )}
                          </div>

                          {/* 用户头像 */}
                          <Avatar className="w-9 h-9 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all shrink-0">
                            <AvatarImage src={contributor.avatar || "/placeholder.svg"} alt={contributor.name} />
                            <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                              {contributor.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>

                          {/* 用户信息 */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors leading-tight">
                              {contributor.name}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                              <span className="flex items-center gap-0.5 truncate">
                                <TrendingUp className="w-2.5 h-2.5 shrink-0" />
                                {contributor.reputation}
                              </span>
                              <span className="flex items-center gap-0.5 truncate">
                                <MessageSquare className="w-2.5 h-2.5 shrink-0" />
                                {contributor.postsCount}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
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
