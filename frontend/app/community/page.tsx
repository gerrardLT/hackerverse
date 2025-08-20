'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Plus, TrendingUp, MessageSquare, Users, Eye, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { apiService } from '@/lib/api'
import { 
  categoryLabels, 
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
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [stats, setStats] = useState<CommunityStats | null>(null)
  const [topContributors, setTopContributors] = useState<TopContributor[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState('latest')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadCommunityData()
  }, [])

  const loadCommunityData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [postsResponse, statsResponse] = await Promise.all([
        apiService.getCommunityPosts({
          page: 1,
          limit: 50,
          sortBy: sortBy === 'latest' ? 'createdAt' : sortBy === 'popular' ? 'likes' : 'views'
        }),
        apiService.getCommunityPosts({
          page: 1,
          limit: 1,
          // 这里假设 API 返回统计数据，实际可能需要单独的统计接口
        })
      ])
      
      if (postsResponse.success && postsResponse.data) {
        setPosts(postsResponse.data.posts)
        if (postsResponse.data.stats) {
          setStats(postsResponse.data.stats)
        }
      } else {
        setError(postsResponse.error || '加载社区数据失败')
      }
    } catch (error) {
      console.error('加载社区数据失败:', error)
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
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
      <div className="container py-8">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">加载社区数据中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">加载失败</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadCommunityData}>重试</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">社区讨论</h1>
        <p className="text-muted-foreground">分享想法、提问交流、展示作品</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="搜索帖子、标签或用户..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部分类</SelectItem>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full md:w-32">
                    <SelectValue placeholder="排序" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest">最新</SelectItem>
                    <SelectItem value="popular">最热</SelectItem>
                    <SelectItem value="replies">回复多</SelectItem>
                    <SelectItem value="views">浏览多</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Posts List */}
          <div className="space-y-4">
            {filteredPosts.map((post) => (
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
                          {categoryIcons[post.category]} {categoryLabels[post.category]}
                        </Badge>
                        {post.isPinned && (
                          <Badge variant="outline" className="text-blue-600 dark:text-blue-400">
                            📌 置顶
                          </Badge>
                        )}
                        {post.isLocked && (
                          <Badge variant="outline" className="text-muted-foreground">
                            🔒 已锁定
                          </Badge>
                        )}
                      </div>
                      
                      <Link 
                        href={`/community/posts/${post.id}`}
                        className="block hover:text-primary transition-colors"
                      >
                        <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                          {post.title}
                        </h3>
                      </Link>
                      
                      <p className="text-muted-foreground mb-3 line-clamp-2">
                        {post.excerpt}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span className="font-medium">{post.author.name}</span>
                          <span>{formatTimeAgo(post.createdAt)}</span>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {post.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            {post.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            {post.replies}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">没有找到相关帖子</h3>
                <p className="text-muted-foreground mb-4">尝试调整搜索条件或浏览其他分类</p>
                <Link href="/community/new">
                  <Button>发布第一个帖子</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Community Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                社区统计
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats?.totalPosts || 0}</div>
                  <div className="text-sm text-muted-foreground">总帖子数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats?.totalReplies || 0}</div>
                  <div className="text-sm text-muted-foreground">总回复数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats?.totalUsers || 0}</div>
                  <div className="text-sm text-muted-foreground">注册用户</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats?.activeUsers || 0}</div>
                  <div className="text-sm text-muted-foreground">活跃用户</div>
                </div>
              </div>
              <div className="pt-4 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">今日新帖</span>
                  <span className="font-semibold">{stats?.todayPosts || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">今日回复</span>
                  <span className="font-semibold">{stats?.todayReplies || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Contributors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                热门贡献者
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topContributors.map((contributor, index) => (
                <div key={contributor.id} className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-semibold">
                    {index + 1}
                  </div>
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={contributor.avatar || "/placeholder.svg"} alt={contributor.name} />
                    <AvatarFallback>{contributor.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {contributor.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {contributor.reputation} 声望
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Community Rules */}
          <Card>
            <CardHeader>
              <CardTitle>社区规则</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 font-semibold">1.</span>
                <span>保持友善和尊重，营造良好的讨论氛围</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 font-semibold">2.</span>
                <span>发布有价值的内容，避免灌水和重复</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 font-semibold">3.</span>
                <span>使用合适的分类和标签，便于他人查找</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 font-semibold">4.</span>
                <span>禁止发布违法、有害或不当内容</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 font-semibold">5.</span>
                <span>尊重知识产权，注明引用来源</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
