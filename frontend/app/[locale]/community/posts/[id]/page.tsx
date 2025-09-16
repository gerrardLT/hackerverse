'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { apiService } from '@/lib/api'
import { useAuth } from '@/hooks/use-auth'
import { 
  categoryColors, 
  categoryIcons,
  formatTimeAgo,
  type PostCategory
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
  AlertCircle,
  Bookmark,
  X
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
  const { user } = useAuth()
  const t = useTranslations('community.post')
  const tCommon = useTranslations('common')
  const tCommunity = useTranslations('community')
  const postId = params.id as string

  // 获取国际化的分类标签
  const getCategoryLabel = (category: PostCategory) => {
    return tCommunity(`categories.${category}`)
  }
  
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
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null) // 正在回复的评论ID
  const [replyContent, setReplyContent] = useState<Record<string, string>>({}) // 每个回复的内容
  const [authorStats, setAuthorStats] = useState<{
    postsCount: number
    repliesCount: number
    joinedAt: string
  } | null>(null)
  
  // 编辑状态
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (postId && !loading && !post) {
      loadPost()
    }
  }, [postId])
  
  // 防止重复加载的ref
  const loadingRef = useRef(false)

  const loadUserLikeStatus = async (postId: string, replies: CommunityReply[]) => {
    try {
      // 获取帖子点赞状态
      const postLikeResponse = await apiService.getPostLikeStatus(postId)
      if (postLikeResponse.success && postLikeResponse.data) {
        setIsLiked(postLikeResponse.data.isLiked)
      }

      // 获取帖子收藏状态
      const bookmarkResponse = await apiService.getPostBookmarkStatus(postId)
      if (bookmarkResponse.success && bookmarkResponse.data) {
        setIsBookmarked(bookmarkResponse.data.isBookmarked)
      }

      // 获取回复点赞状态
      const replyLikePromises = replies.map(reply => 
        apiService.getReplyLikeStatus(reply.id)
      )
      
      const replyLikeResponses = await Promise.all(replyLikePromises)
      const newLikedReplies = new Set<string>()
      
      replyLikeResponses.forEach((response, index) => {
        if (response.success && response.data?.isLiked) {
          newLikedReplies.add(replies[index].id)
        }
      })
      
      setLikedReplies(newLikedReplies)
    } catch (error) {
      console.error('获取点赞状态失败:', error)
      // 不显示错误提示，因为这不影响主要功能
    }
  }

  const loadPost = async () => {
    // 防止重复调用
    if (loadingRef.current) {
      console.log('🚫 loadPost 已在执行中，跳过重复调用')
      return
    }
    
    try {
      loadingRef.current = true
      setLoading(true)
      setError(null)
      console.log('🔄 开始加载帖子:', postId)
      
      const response = await apiService.getCommunityPost(postId)
      
      if (response.success && response.data) {
        const postData = response.data  // 修复：直接使用 data，而不是 data.post
        setPost(postData)
        setReplies(postData.replies || [])
        setLikeCount(postData.likes)
        
        // 初始化回复点赞数据
        const initialReplyLikes: Record<string, number> = {}
        postData.replies?.forEach(reply => {
          initialReplyLikes[reply.id] = reply.likes
        })
        setReplyLikes(initialReplyLikes)
        
        // 获取用户点赞状态
        await loadUserLikeStatus(postData.id, postData.replies || [])
        
        // 获取作者统计数据
        await loadAuthorStats(postData.author.id)
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
      loadingRef.current = false
      console.log('✅ loadPost 执行完成')
    }
  }

  const handleLike = async () => {
    if (!post) return
    
    try {
      const response = await apiService.likeCommunityPost(post.id)
      
      if (response.success && response.data) {
        setIsLiked(response.data.isLiked)
        setLikeCount(response.data.likeCount)
        
        toast({
          title: response.data?.isLiked ? "点赞成功" : "取消点赞",
          description: response.data?.isLiked ? "感谢您的点赞！" : "已取消对此帖子的点赞",
        })
      } else {
        throw new Error(response.error || '点赞操作失败')
      }
    } catch (error) {
      console.error('点赞错误:', error)
      toast({
        title: '操作失败',
        description: error instanceof Error ? error.message : '点赞操作失败，请重试',
        variant: 'destructive'
      })
    }
  }

  const handleReplyLike = async (replyId: string) => {
    try {
      const response = await apiService.likeCommunityReply(replyId)
      
      if (response.success && response.data) {
        const newLikedReplies = new Set(likedReplies)
        
        if (response.data.isLiked) {
          newLikedReplies.add(replyId)
        } else {
          newLikedReplies.delete(replyId)
        }
        
        setLikedReplies(newLikedReplies)
        setReplyLikes(prev => ({ ...prev, [replyId]: response.data.likeCount }))
        
        toast({
          title: response.data.isLiked ? "点赞成功" : "取消点赞",
          description: response.data.isLiked ? "感谢您的点赞！" : "已取消对回复的点赞",
        })
      } else {
        throw new Error(response.error || '点赞操作失败')
      }
    } catch (error) {
      console.error('回复点赞错误:', error)
      toast({
        title: '操作失败',
        description: error instanceof Error ? error.message : '点赞操作失败，请重试',
        variant: 'destructive'
      })
    }
  }

  const handleBookmark = async () => {
    if (!post) return
    
    try {
      const response = await apiService.bookmarkCommunityPost(post.id)
      
      if (response.success && response.data) {
        setIsBookmarked(response.data.isBookmarked)
        
        toast({
          title: response.data.isBookmarked ? "收藏成功" : "取消收藏",
          description: response.data.isBookmarked ? "已添加到收藏夹" : "已从收藏夹移除",
        })
      } else {
        throw new Error(response.error || '收藏操作失败')
      }
    } catch (error) {
      console.error('收藏错误:', error)
      toast({
        title: '操作失败',
        description: error instanceof Error ? error.message : '收藏操作失败，请重试',
        variant: 'destructive'
      })
    }
  }

  const handleSubmitReply = async () => {
    if (!post || !newReply.trim()) return

    setIsSubmitting(true)
    try {
      const response = await apiService.createCommunityReply(post.id, {
        content: newReply.trim()
      })
      
      if (response.success && response.data) {
        const newReplyObj = response.data.reply
        setReplies(prev => [newReplyObj, ...prev])
        setNewReply('')
        
        toast({
          title: "回复成功",
          description: "您的回复已发布",
        })
      } else {
        throw new Error(response.error || '回复发布失败')
      }
    } catch (error) {
      console.error('回复错误:', error)
      toast({
        title: "回复失败",
        description: error instanceof Error ? error.message : "发布回复时出现错误，请重试",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReplyToReply = async (parentId: string) => {
    if (!post || !replyContent[parentId]?.trim()) return

    setIsSubmitting(true)
    try {
      const response = await apiService.createCommunityReply(post.id, {
        content: replyContent[parentId].trim(),
        parentId
      })
      
      if (response.success && response.data) {
        // 直接将新回复插入到父回复的replies中（若父回复存在），否则回退至平铺
        const newReply = response.data.reply as CommunityReply
        setReplies(prev => {
          // 深拷贝以避免直接修改状态
          const clone = prev.map(r => ({ ...r, replies: r.replies ? [...r.replies] : [] }))
          const parentIndex = clone.findIndex(r => r.id === parentId)
          if (parentIndex !== -1) {
            const parent = clone[parentIndex]
            parent.replies = parent.replies || []
            parent.replies.push(newReply)
            return clone
          }
          // 如果父回复不在第一层（多层嵌套），尝试递归插入
          const insertRecursively = (items: CommunityReply[]): boolean => {
            for (const item of items) {
              if (item.replies && item.replies.length > 0) {
                const found = item.replies.find(r => r.id === parentId)
                if (found) {
                  found.replies = found.replies || []
                  found.replies.push(newReply)
                  return true
                }
                if (insertRecursively(item.replies)) return true
              }
            }
            return false
          }
          if (insertRecursively(clone)) return clone
          // 回退：找不到父级则平铺追加
          return [...clone, newReply]
        })
        
        // 清空回复内容和状态
        setReplyContent(prev => ({ ...prev, [parentId]: '' }))
        setReplyingTo(null)
        
        toast({
          title: "回复成功",
          description: "您的回复已发布",
        })
      } else {
        throw new Error(response.error || '回复发布失败')
      }
    } catch (error) {
      console.error('回复发布错误:', error)
      toast({
        title: "回复失败",
        description: error instanceof Error ? error.message : '网络错误，请重试',
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStartReply = (replyId: string) => {
    setReplyingTo(replyId)
    if (!replyContent[replyId]) {
      setReplyContent(prev => ({ ...prev, [replyId]: '' }))
    }
  }

  const handleCancelReply = (replyId: string) => {
    setReplyingTo(null)
    setReplyContent(prev => ({ ...prev, [replyId]: '' }))
  }

  const loadAuthorStats = async (authorId: string) => {
    try {
      const response = await apiService.getUserPublicStats(authorId)
      if (response.success && response.data) {
        setAuthorStats(response.data)
      }
    } catch (error) {
      console.error('获取作者统计数据失败:', error)
      // 不显示错误提示，因为这不影响主要功能
    }
  }

  const handleStartEdit = () => {
    if (post) {
      setEditTitle(post.title)
      setEditContent(post.content)
      setIsEditing(true)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditTitle('')
    setEditContent('')
  }

  const handleSaveEdit = async () => {
    if (!post || !editTitle.trim() || !editContent.trim()) {
      toast({
        title: "保存失败",
        description: "标题和内容不能为空",
        variant: "destructive"
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await apiService.updateCommunityPost(post.id, {
        title: editTitle.trim(),
        content: editContent.trim()
      })

      if (response.success) {
        // 更新本地状态
        setPost(prev => prev ? {
          ...prev,
          title: editTitle.trim(),
          content: editContent.trim(),
          updatedAt: new Date().toISOString()
        } : null)
        
        setIsEditing(false)
        toast({
          title: "保存成功",
          description: "帖子已更新"
        })
      } else {
        throw new Error(response.error || '更新失败')
      }
    } catch (error) {
      console.error('更新帖子错误:', error)
      toast({
        title: "保存失败",
        description: error instanceof Error ? error.message : '网络错误，请重试',
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeletePost = async () => {
    if (!post) return

    // 二次确认
    if (!confirm(t('post.deleteConfirm'))) {
      return
    }

    try {
      const response = await apiService.deleteCommunityPost(post.id)

      if (response.success) {
        toast({
          title: "删除成功",
          description: "帖子已删除"
        })
        
        // 跳转回社区列表
        window.location.href = '/community'
      } else {
        throw new Error(response.error || '删除失败')
      }
    } catch (error) {
      console.error('删除帖子错误:', error)
      toast({
        title: "删除失败",
        description: error instanceof Error ? error.message : '网络错误，请重试',
        variant: "destructive"
      })
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
              {t('backToCommunity')}
            </Button>
          </Link>
          <Link href="/community/new" className="ml-auto">
            <Button size="sm">
              {t('createPost')}
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
                  
                  {/* 只有作者才能看到编辑和删除按钮 */}
                  {user && post.author.id === user.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleStartEdit}>
                          <Edit className="w-4 h-4 mr-2" />
                          编辑帖子
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDeletePost} className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          删除帖子
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {/* Post Title and Badges */}
                {isEditing ? (
                  <div className="mb-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">标题</label>
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="输入帖子标题..."
                        className="text-xl"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button onClick={handleSaveEdit} disabled={isSaving}>
                        {isSaving ? '保存中...' : '保存'}
                      </Button>
                      <Button variant="outline" onClick={handleCancelEdit}>
                        取消
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      {post.isPinned && <Flag className="w-4 h-4 text-blue-600" />}
                      {post.isLocked && <AlertCircle className="w-4 h-4 text-gray-500" />}
                      <h1 className="text-2xl font-bold text-gray-900">{post.title}</h1>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={categoryColors[post.category]}>
                        {categoryIcons[post.category]} {getCategoryLabel(post.category)}
                      </Badge>
                      {Array.isArray(post.tags) && post.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Post Content */}
                {isEditing ? (
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">内容</label>
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder="输入帖子内容..."
                      rows={10}
                      className="min-h-[200px]"
                    />
                  </div>
                ) : (
                  <div className="prose max-w-none mb-6">
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                      {post.content}
                    </div>
                  </div>
                )}

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
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleBookmark}
                      className={isBookmarked ? 'text-blue-600' : ''}
                    >
                      <Bookmark className={`w-4 h-4 mr-2 ${isBookmarked ? 'fill-current' : ''}`} />
                      {isBookmarked ? '已收藏' : '收藏'}
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
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-xs h-6 px-2"
                              onClick={() => handleStartReply(reply.id)}
                            >
                              回复
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* 回复输入框 */}
                      {replyingTo === reply.id && (
                        <div className="ml-11 mt-4 p-4 bg-gray-50 rounded-lg">
                          <div className="flex gap-3">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src="/placeholder.svg?height=24&width=24" alt="您" />
                              <AvatarFallback className="text-xs">您</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <Textarea
                                value={replyContent[reply.id] || ''}
                                onChange={(e) => setReplyContent(prev => ({ 
                                  ...prev, 
                                  [reply.id]: e.target.value 
                                }))}
                                placeholder={`回复 @${reply.author.name}...`}
                                className="mb-3"
                                rows={2}
                              />
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleCancelReply(reply.id)}
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  取消
                                </Button>
                                <Button 
                                  size="sm"
                                  disabled={!replyContent[reply.id]?.trim() || isSubmitting}
                                  onClick={() => handleReplyToReply(reply.id)}
                                >
                                  {isSubmitting ? '发布中...' : '回复'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 子回复 */}
                      {reply.replies && reply.replies.length > 0 && (
                        <div className="ml-8 mt-4 space-y-4">
                          {reply.replies.map((subReply: any) => (
                            <div key={subReply.id} className="flex gap-3">
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={subReply.author.avatar || "/placeholder.svg"} alt={subReply.author.name} />
                                <AvatarFallback className="text-xs">{subReply.author.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm">{subReply.author.name}</span>
                                  {subReply.author.reputation > 0 && (
                                    <Badge variant="outline" className="text-xs">声望: {subReply.author.reputation}</Badge>
                                  )}
                                  <span className="text-xs text-gray-500">{formatTimeAgo(subReply.createdAt)}</span>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed">{subReply.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

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
                    <span className="font-semibold">
                      {authorStats ? authorStats.postsCount : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">回复数</span>
                    <span className="font-semibold">
                      {authorStats ? authorStats.repliesCount : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">加入时间</span>
                    <span className="font-semibold">
                      {authorStats ? new Date(authorStats.joinedAt).toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: 'long'
                      }) : '-'}
                    </span>
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
