'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { apiService } from '@/lib/api'
import { 
  categoryLabels, 
  categoryColors, 
  categoryIcons,
  formatTimeAgo
} from '@/lib/community'
import { 
  ArrowLeft, 
  Heart, 
  MessageSquare, 
  Eye, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Flag,
  Loader2,
  AlertCircle
} from 'lucide-react'

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

interface CommunityReply {
  id: string
  content: string
  author: {
    id: string
    name: string
    username: string
    avatar?: string
    reputation: number
  }
  createdAt: string
  updatedAt: string
  likes: number
  replies?: CommunityReply[]
}

export default function PostDetailPage() {
  const params = useParams()
  const { toast } = useToast()
  const postId = params.id as string
  
  const [post, setPost] = useState<CommunityPost | null>(null)
  const [replies, setReplies] = useState<CommunityReply[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newReply, setNewReply] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [replyLikes, setReplyLikes] = useState<Record<string, number>>({})
  const [likedReplies, setLikedReplies] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (postId) {
      loadPost()
    }
  }, [postId])

  const loadPost = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiService.getCommunityPost(postId)
      
      if (response.success && response.data) {
        const postData = response.data.post
        setPost(postData)
        setReplies(postData.replies || [])
        setLikeCount(postData.likes)
        
        // 初始化回复点赞数据
        const initialReplyLikes: Record<string, number> = {}
        postData.replies?.forEach(reply => {
          initialReplyLikes[reply.id] = reply.likes
        })
        setReplyLikes(initialReplyLikes)
      } else {
        setError(response.error || '获取帖子失败')
        toast({
          title: '加载失败',
          description: response.error || '无法获取帖子信息',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('获取帖子错误:', error)
      setError('网络错误，请检查网络连接')
      toast({
        title: '网络错误',
        description: '请检查网络连接并重试',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (!post) return
    
    try {
      // 这里需要实现点赞 API
    setIsLiked(!isLiked)
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1)
    
    toast({
      title: isLiked ? "取消点赞" : "点赞成功",
      description: isLiked ? "已取消对此帖子的点赞" : "感谢您的点赞！",
    })
    } catch (error) {
      console.error('点赞错误:', error)
      toast({
        title: '操作失败',
        description: '点赞操作失败，请重试',
        variant: 'destructive'
      })
    }
  }

  const handleReplyLike = async (replyId: string) => {
    const newLikedReplies = new Set(likedReplies)
    const isCurrentlyLiked = likedReplies.has(replyId)
    
    try {
    if (isCurrentlyLiked) {
      newLikedReplies.delete(replyId)
      setReplyLikes(prev => ({ ...prev, [replyId]: prev[replyId] - 1 }))
    } else {
      newLikedReplies.add(replyId)
      setReplyLikes(prev => ({ ...prev, [replyId]: prev[replyId] + 1 }))
    }
    
    setLikedReplies(newLikedReplies)
      
      toast({
        title: isCurrentlyLiked ? "取消点赞" : "点赞成功",
        description: isCurrentlyLiked ? "已取消对回复的点赞" : "感谢您的点赞！",
      })
    } catch (error) {
      console.error('回复点赞错误:', error)
      toast({
        title: '操作失败',
        description: '点赞操作失败，请重试',
        variant: 'destructive'
      })
    }
  }

  const handleSubmitReply = async () => {
    if (!post || !newReply.trim()) return

    setIsSubmitting(true)
    try {
      // 这里需要实现回复 API
      const replyData = {
        content: newReply,
        postId: post.id
      }
      
      // 模拟回复成功
      const newReplyObj: CommunityReply = {
        id: Date.now().toString(),
        content: newReply,
        author: {
          id: 'current-user',
          name: '当前用户',
          username: 'currentuser',
          reputation: 100
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        likes: 0
      }
      
      setReplies(prev => [newReplyObj, ...prev])
      setNewReply('')
      
      toast({
        title: "回复成功",
        description: "您的回复已发布",
      })
    } catch (error) {
      console.error('回复错误:', error)
      toast({
        title: "回复失败",
        description: "发布回复时出现错误，请重试",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">加载帖子中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">加载失败</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadPost}>
            重试
          </Button>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">帖子不存在</h1>
          <p className="text-gray-600 mb-4">您要查看的帖子可能已被删除或不存在。</p>
          <Link href="/community">
            <Button>返回社区</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/community">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回社区
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Post */}
            <Card className="mb-6">
              <CardContent className="p-6">
                {/* Post Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={post.author.avatar || "/placeholder.svg"} alt={post.author.name} />
                      <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{post.author.name}</span>
                        {post.author.reputation > 0 && (
                          <Badge variant="outline" className="text-xs text-gray-600">声望: {post.author.reputation}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{formatTimeAgo(post.createdAt)}</span>
                        <span>•</span>
                        <span>发帖</span>
                      </div>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {}}>
                        <Edit className="w-4 h-4 mr-2" />
                        编辑帖子
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {}}>
                        <Trash2 className="w-4 h-4 mr-2 text-red-600" />
                        删除帖子
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Post Title and Badges */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    {post.isPinned && <Flag className="w-4 h-4 text-blue-600" />}
                    {post.isLocked && <AlertCircle className="w-4 h-4 text-gray-500" />}
                    <h1 className="text-2xl font-bold text-gray-900">{post.title}</h1>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={categoryColors[post.category]}>
                      {categoryIcons[post.category]} {categoryLabels[post.category]}
                    </Badge>
                    {Array.isArray(post.tags) && post.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Post Content */}
                <div className="prose max-w-none mb-6">
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {post.content}
                  </div>
                </div>

                {/* Post Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLike}
                      className={isLiked ? 'text-red-600' : ''}
                    >
                      <Heart className={`w-4 h-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                      {likeCount}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => {}}>
                      分享
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {post.views} 浏览
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      {replies.length} 回复
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Replies Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  回复 ({replies.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {/* New Reply Form */}
                {!post.isLocked && (
                  <form onSubmit={(e) => { e.preventDefault(); handleSubmitReply(); }} className="mb-6">
                    <div className="flex gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src="/placeholder.svg?height=32&width=32" alt="您" />
                        <AvatarFallback>您</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <Textarea
                          value={newReply}
                          onChange={(e) => setNewReply(e.target.value)}
                          placeholder="写下您的回复..."
                          className="mb-3"
                          rows={3}
                        />
                        <div className="flex justify-end">
                          <Button 
                            type="submit" 
                            disabled={!newReply.trim() || isSubmitting}
                            size="sm"
                          >
                            {isSubmitting ? '发布中...' : '发布回复'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </form>
                )}

                {post.isLocked && (
                  <Alert className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      此帖子已被锁定，无法添加新回复。
                    </AlertDescription>
                  </Alert>
                )}

                {/* Replies List */}
                <div className="space-y-6">
                  {replies.map((reply, index) => (
                    <div key={reply.id}>
                      <div className="flex gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={reply.author.avatar || "/placeholder.svg"} alt={reply.author.name} />
                          <AvatarFallback>{reply.author.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-sm">{reply.author.name}</span>
                            {reply.author.reputation > 0 && (
                              <Badge variant="outline" className="text-xs text-gray-600">声望: {reply.author.reputation}</Badge>
                            )}
                            <span className="text-xs text-gray-500">{formatTimeAgo(reply.createdAt)}</span>
                          </div>
                          <p className="text-gray-700 mb-2 leading-relaxed">{reply.content}</p>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className={`text-xs h-6 px-2 ${likedReplies.has(reply.id) ? 'text-blue-600' : ''}`}
                              onClick={() => handleReplyLike(reply.id)}
                            >
                              <Heart className={`w-3 h-3 mr-1 ${likedReplies.has(reply.id) ? 'fill-current' : ''}`} />
                              {replyLikes[reply.id] || 0}
                            </Button>
                            <Button variant="ghost" size="sm" className="text-xs h-6 px-2">
                              回复
                            </Button>
                          </div>
                        </div>
                      </div>
                      {index < replies.length - 1 && <Separator className="mt-6" />}
                    </div>
                  ))}
                </div>

                {replies.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>还没有回复，来发表第一个回复吧！</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Author Info */}
            <Card>
              <CardHeader>
                <CardTitle>作者信息</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={post.author.avatar || "/placeholder.svg"} alt={post.author.name} />
                    <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{post.author.name}</p>
                    <p className="text-sm text-gray-500">声望: {post.author.reputation}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">发帖数</span>
                    <span className="font-semibold">23</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">回复数</span>
                    <span className="font-semibold">89</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">加入时间</span>
                    <span className="font-semibold">2024年1月</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Related Posts */}
            <Card>
              <CardHeader>
                <CardTitle>相关帖子</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* This section will be populated with actual related posts */}
                <p>相关帖子功能待实现</p>
              </CardContent>
            </Card>

            {/* Post Stats */}
            <Card>
              <CardHeader>
                <CardTitle>帖子统计</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">发布时间</span>
                  <span className="font-semibold">{formatTimeAgo(post.createdAt)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">浏览次数</span>
                  <span className="font-semibold">{post.views}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">点赞数</span>
                  <span className="font-semibold">{likeCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">回复数</span>
                  <span className="font-semibold">{replies.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
