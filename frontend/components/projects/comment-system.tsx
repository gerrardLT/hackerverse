'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  MessageSquare, 
  Reply, 
  Edit, 
  Trash2, 
  Send, 
  Loader2,
  ChevronDown,
  ChevronUp,
  MoreVertical
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { apiService } from '@/lib/api'
import { formatDistanceToNow } from 'date-fns'
import { zhCN, enUS } from 'date-fns/locale'
import { useLocale } from 'next-intl'

interface Comment {
  id: string
  content: string
  isEdited: boolean
  createdAt: string
  updatedAt: string
  editedAt?: string
  parentId?: string
  user: {
    id: string
    username: string
    avatarUrl?: string
  }
  replies?: Comment[]
}

interface CommentSystemProps {
  projectId: string
  className?: string
}

export function CommentSystem({ projectId, className }: CommentSystemProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const t = useTranslations('projects.comments')
  const locale = useLocale()
  
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())

  // 加载评论
  const loadComments = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await apiService.get(`/projects/${projectId}/comments`)
      
      if (response.success) {
        setComments(response.data.comments || [])
      } else {
        throw new Error(response.error || '加载评论失败')
      }
    } catch (error) {
      console.error('加载评论失败:', error)
      toast({
        title: t('loadFailed'),
        description: error instanceof Error ? error.message : t('loadError'),
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [projectId, toast, t])

  useEffect(() => {
    loadComments()
  }, [loadComments])

  // 提交新评论
  const handleSubmitComment = async () => {
    if (!user) {
      toast({
        title: t('loginRequired'),
        description: t('loginRequiredDesc'),
        variant: 'destructive',
      })
      return
    }

    if (!newComment.trim()) {
      toast({
        title: t('contentRequired'),
        description: t('contentRequiredDesc'),
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await apiService.post(`/projects/${projectId}/comments`, {
        content: newComment.trim()
      })

      if (response.success) {
        setNewComment('')
        await loadComments() // 重新加载评论
        toast({
          title: t('submitSuccess'),
          description: t('submitSuccessDesc'),
        })
      } else {
        throw new Error(response.error || '发表评论失败')
      }
    } catch (error) {
      console.error('发表评论失败:', error)
      toast({
        title: t('submitFailed'),
        description: error instanceof Error ? error.message : t('submitError'),
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 提交回复
  const handleSubmitReply = async (parentId: string) => {
    if (!user) return

    if (!replyContent.trim()) {
      toast({
        title: t('contentRequired'),
        description: t('contentRequiredDesc'),
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await apiService.post(`/projects/${projectId}/comments`, {
        content: replyContent.trim(),
        parentId
      })

      if (response.success) {
        setReplyContent('')
        setReplyingTo(null)
        await loadComments()
        toast({
          title: t('replySuccess'),
          description: t('replySuccessDesc'),
        })
      } else {
        throw new Error(response.error || '回复失败')
      }
    } catch (error) {
      console.error('回复失败:', error)
      toast({
        title: t('replyFailed'),
        description: error instanceof Error ? error.message : t('replyError'),
        variant: 'destructive',
      })
    }
  }

  // 编辑评论
  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return

    try {
      const response = await apiService.put(`/projects/${projectId}/comments/${commentId}`, {
        content: editContent.trim()
      })

      if (response.success) {
        setEditingId(null)
        setEditContent('')
        await loadComments()
        toast({
          title: t('editSuccess'),
          description: t('editSuccessDesc'),
        })
      } else {
        throw new Error(response.error || '编辑失败')
      }
    } catch (error) {
      console.error('编辑评论失败:', error)
      toast({
        title: t('editFailed'),
        description: error instanceof Error ? error.message : t('editError'),
        variant: 'destructive',
      })
    }
  }

  // 删除评论
  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await apiService.delete(`/projects/${projectId}/comments/${commentId}`)

      if (response.success) {
        await loadComments()
        toast({
          title: t('deleteSuccess'),
          description: t('deleteSuccessDesc'),
        })
      } else {
        throw new Error(response.error || '删除失败')
      }
    } catch (error) {
      console.error('删除评论失败:', error)
      toast({
        title: t('deleteFailed'),
        description: error instanceof Error ? error.message : t('deleteError'),
        variant: 'destructive',
      })
    }
  }

  // 开始编辑
  const startEdit = (comment: Comment) => {
    setEditingId(comment.id)
    setEditContent(comment.content)
  }

  // 取消编辑
  const cancelEdit = () => {
    setEditingId(null)
    setEditContent('')
  }

  // 开始回复
  const startReply = (commentId: string) => {
    setReplyingTo(commentId)
    setReplyContent('')
  }

  // 取消回复
  const cancelReply = () => {
    setReplyingTo(null)
    setReplyContent('')
  }

  // 切换评论展开
  const toggleExpand = (commentId: string) => {
    const newExpanded = new Set(expandedComments)
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId)
    } else {
      newExpanded.add(commentId)
    }
    setExpandedComments(newExpanded)
  }

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: locale === 'zh' ? zhCN : enUS
    })
  }

  // 渲染单个评论
  const renderComment = (comment: Comment, isReply = false) => {
    const isOwner = user?.id === comment.user.id
    const hasReplies = comment.replies && comment.replies.length > 0
    const isExpanded = expandedComments.has(comment.id)

    return (
      <div key={comment.id} className={`space-y-3 ${isReply ? 'ml-6 pl-4 border-l-2 border-muted' : ''}`}>
        <div className="flex space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment.user.avatarUrl} alt={comment.user.username} />
            <AvatarFallback>{comment.user.username.slice(0, 2)}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-sm">{comment.user.username}</span>
              <span className="text-xs text-muted-foreground">{formatTime(comment.createdAt)}</span>
              {comment.isEdited && (
                <Badge variant="secondary" className="text-xs">
                  {t('edited')}
                </Badge>
              )}
            </div>
            
            {editingId === comment.id ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder={t('editPlaceholder')}
                  rows={3}
                />
                <div className="flex space-x-2">
                  <Button size="sm" onClick={() => handleEditComment(comment.id)}>
                    {t('save')}
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelEdit}>
                    {t('cancel')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground leading-relaxed">
                {comment.content}
              </div>
            )}
            
            <div className="flex items-center space-x-2 text-xs">
              {user && editingId !== comment.id && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startReply(comment.id)}
                  className="h-6 px-2 text-xs"
                >
                  <Reply className="h-3 w-3 mr-1" />
                  {t('reply')}
                </Button>
              )}
              
              {isOwner && editingId !== comment.id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => startEdit(comment)}>
                      <Edit className="h-3 w-3 mr-2" />
                      {t('edit')}
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Trash2 className="h-3 w-3 mr-2" />
                          {t('delete')}
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('deleteConfirm')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('deleteConfirmDesc')}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteComment(comment.id)}>
                            {t('delete')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              {hasReplies && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpand(comment.id)}
                  className="h-6 px-2 text-xs"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-3 w-3 mr-1" />
                  ) : (
                    <ChevronDown className="h-3 w-3 mr-1" />
                  )}
                  {t('replies', { count: comment.replies?.length || 0 })}
                </Button>
              )}
            </div>
            
            {/* 回复表单 */}
            {replyingTo === comment.id && (
              <div className="space-y-2 mt-3">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={t('replyPlaceholder', { username: comment.user.username })}
                  rows={3}
                />
                <div className="flex space-x-2">
                  <Button size="sm" onClick={() => handleSubmitReply(comment.id)}>
                    <Send className="h-3 w-3 mr-1" />
                    {t('submitReply')}
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelReply}>
                    {t('cancel')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* 回复列表 */}
        {hasReplies && isExpanded && (
          <div className="space-y-4">
            {comment.replies?.map((reply) => renderComment(reply, true))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5" />
          <CardTitle>{t('title')}</CardTitle>
          <Badge variant="secondary">{comments.length}</Badge>
        </div>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 新评论表单 */}
        {user ? (
          <div className="space-y-3">
            <div className="flex space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatarUrl} alt={user.username} />
                <AvatarFallback>{user.username.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={t('placeholder')}
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button 
                onClick={handleSubmitComment}
                disabled={isSubmitting || !newComment.trim()}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {t('submit')}
              </Button>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">{t('loginToComment')}</p>
            </CardContent>
          </Card>
        )}
        
        <Separator />
        
        {/* 评论列表 */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : comments.length > 0 ? (
          <div className="space-y-6">
            {comments.map((comment) => renderComment(comment))}
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t('noComments')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
