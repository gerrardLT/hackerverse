'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Flag,
  User,
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react'
import { apiService } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface ContentReviewItem {
  id: string
  contentType: string
  contentId: string
  contentTitle: string | null
  status: string
  priority: string
  category: string | null
  reportCount: number
  autoFlagged: boolean
  createdAt: string
  author: {
    id: string
    username: string
    email: string
    role: string
  }
  reviewer: {
    id: string
    username: string
  } | null
  contentDetails: {
    title: string
    content?: string
    description?: string
    createdAt: string
    isDeleted?: boolean
  } | null
}

interface ReviewFilters {
  contentType: string
  priority: string
  status: string
  sortBy: string
  sortOrder: string
}

export default function ContentModerationPage() {
  const t = useTranslations('admin.content')
  const tCommon = useTranslations('common')
  const { toast } = useToast()
  
  const [items, setItems] = useState<ContentReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<ReviewFilters>({
    contentType: 'all',
    priority: 'all',
    status: 'pending',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  const [selectedItem, setSelectedItem] = useState<ContentReviewItem | null>(null)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'flag'>('approve')
  const [reviewReason, setReviewReason] = useState('')
  const [reviewNotes, setReviewNotes] = useState('')
  const [reviewing, setReviewing] = useState(false)

  const loadContentReviews = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        ...filters,
        limit: '20'
      })
      
      const response = await apiService.get(`/admin/content/pending?${params}`)
      
      if (response.success) {
        setItems(response.data.items)
      } else {
        toast({
          title: t('loadError'),
          description: response.error || t('unknownError'),
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('获取待审核内容失败:', error)
      toast({
        title: t('loadError'),
        description: t('networkError'),
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContentReviews()
  }, [filters])

  const handleFilterChange = (key: keyof ReviewFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const openReviewDialog = (item: ContentReviewItem, action: 'approve' | 'reject' | 'flag') => {
    setSelectedItem(item)
    setReviewAction(action)
    setReviewReason('')
    setReviewNotes('')
    setReviewDialogOpen(true)
  }

  const handleReview = async () => {
    if (!selectedItem) return
    
    setReviewing(true)
    try {
      const response = await apiService.post(`/admin/content/${selectedItem.id}/review`, {
        action: reviewAction,
        reason: reviewReason,
        reviewNotes: reviewNotes
      })
      
      if (response.success) {
        toast({
          title: t(`${reviewAction}Success`),
          description: response.message,
          variant: 'default'
        })
        
        // 重新加载列表
        await loadContentReviews()
        
        // 关闭对话框
        setReviewDialogOpen(false)
        setSelectedItem(null)
      } else {
        toast({
          title: t('reviewError'),
          description: response.error || t('unknownError'),
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('审核操作失败:', error)
      toast({
        title: t('reviewError'),
        description: t('networkError'),
        variant: 'destructive'
      })
    } finally {
      setReviewing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">{t('status.pending')}</Badge>
      case 'approved':
        return <Badge variant="default">{t('status.approved')}</Badge>
      case 'rejected':
        return <Badge variant="destructive">{t('status.rejected')}</Badge>
      case 'flagged':
        return <Badge variant="outline">{t('status.flagged')}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">{t('priority.urgent')}</Badge>
      case 'high':
        return <Badge variant="secondary">{t('priority.high')}</Badge>
      case 'normal':
        return <Badge variant="outline">{t('priority.normal')}</Badge>
      case 'low':
        return <Badge variant="outline">{t('priority.low')}</Badge>
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 紧凑页面标题 - 80px高度 */}
      <div className="glass-light border border-border/50 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{t('title')}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t('description')}</p>
          </div>
          <Button onClick={loadContentReviews} disabled={loading} size="sm" className="glass hover-lift">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            {tCommon('refresh')}
          </Button>
        </div>
      </div>

      {/* 紧凑筛选器 - 60px高度 */}
      <Card className="glass-light border-border/50">
        <CardHeader className="p-4 pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            {t('filters.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <Select 
              value={filters.contentType} 
              onValueChange={(value) => handleFilterChange('contentType', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.contentType.all')}</SelectItem>
                <SelectItem value="post">{t('filters.contentType.post')}</SelectItem>
                <SelectItem value="project">{t('filters.contentType.project')}</SelectItem>
                <SelectItem value="hackathon">{t('filters.contentType.hackathon')}</SelectItem>
                <SelectItem value="comment">{t('filters.contentType.comment')}</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filters.priority} 
              onValueChange={(value) => handleFilterChange('priority', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.priority.all')}</SelectItem>
                <SelectItem value="urgent">{t('priority.urgent')}</SelectItem>
                <SelectItem value="high">{t('priority.high')}</SelectItem>
                <SelectItem value="normal">{t('priority.normal')}</SelectItem>
                <SelectItem value="low">{t('priority.low')}</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filters.status} 
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">{t('status.pending')}</SelectItem>
                <SelectItem value="approved">{t('status.approved')}</SelectItem>
                <SelectItem value="rejected">{t('status.rejected')}</SelectItem>
                <SelectItem value="flagged">{t('status.flagged')}</SelectItem>
                <SelectItem value="all">{t('filters.status.all')}</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filters.sortBy} 
              onValueChange={(value) => handleFilterChange('sortBy', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">{t('filters.sortBy.createdAt')}</SelectItem>
                <SelectItem value="priority">{t('filters.sortBy.priority')}</SelectItem>
                <SelectItem value="reportCount">{t('filters.sortBy.reportCount')}</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filters.sortOrder} 
              onValueChange={(value) => handleFilterChange('sortOrder', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">{t('filters.sortOrder.desc')}</SelectItem>
                <SelectItem value="asc">{t('filters.sortOrder.asc')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content List */}
      <div className="space-y-4">
        {loading ? (
          // Loading skeleton
          [...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="flex justify-between">
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-6 bg-muted rounded w-16"></div>
                  </div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
                <h3 className="text-lg font-semibold">{t('noContent.title')}</h3>
                <p className="text-muted-foreground">{t('noContent.description')}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          items.map((item) => (
            <Card key={item.id} className="glass-light border-border/50 hover:border-primary/20 transition-all">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* 紧凑Header - 单行显示 */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-sm font-semibold truncate max-w-[300px]">
                          {item.contentDetails?.title || item.contentTitle || `${item.contentType}_${item.contentId}`}
                        </h3>
                        {getStatusBadge(item.status)}
                        {getPriorityBadge(item.priority)}
                        {item.autoFlagged && (
                          <Badge variant="destructive" className="text-xs px-1.5 py-0">
                            <AlertCircle className="h-2.5 w-2.5 mr-0.5" />
                            {t('autoFlagged')}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-0.5">
                          <User className="h-2.5 w-2.5" />
                          {item.author.username}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <Calendar className="h-2.5 w-2.5" />
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <Badge variant="outline" className="text-xs px-1 py-0">{item.contentType}</Badge>
                        {item.reportCount > 0 && (
                          <>
                            <span>•</span>
                            <Badge variant="destructive" className="text-xs px-1.5 py-0">
                              {item.reportCount}
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>

                    {/* 紧凑Actions按钮 */}
                    {item.status === 'pending' && (
                      <div className="flex gap-1.5">
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={() => openReviewDialog(item, 'approve')}
                          className="h-7 text-xs px-2"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {t('actions.approve')}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => openReviewDialog(item, 'reject')}
                          className="h-7 text-xs px-2"
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          {t('actions.reject')}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openReviewDialog(item, 'flag')}
                          className="h-7 text-xs px-2"
                        >
                          <Flag className="h-3 w-3 mr-1" />
                          {t('actions.flag')}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* 紧凑Content Preview */}
                  {item.contentDetails && (
                    <div className="bg-muted/30 p-2.5 rounded-lg">
                      <p className="text-xs line-clamp-2">
                        {item.contentDetails.content || item.contentDetails.description || t('noPreview')}
                      </p>
                    </div>
                  )}

                  {/* 紧凑Additional Info */}
                  {(item.category || item.reviewer) && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {item.category && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0">{item.category}</Badge>
                      )}
                      {item.reviewer && (
                        <span>{t('reviewedBy')}: {item.reviewer.username}</span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' && t('dialog.approve.title')}
              {reviewAction === 'reject' && t('dialog.reject.title')}
              {reviewAction === 'flag' && t('dialog.flag.title')}
            </DialogTitle>
            <DialogDescription>
              {selectedItem && (
                <>
                  {t('dialog.contentInfo')}: {selectedItem.contentDetails?.title || selectedItem.contentTitle}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t('dialog.reason')}</label>
              <Textarea
                placeholder={t('dialog.reasonPlaceholder')}
                value={reviewReason}
                onChange={(e) => setReviewReason(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">{t('dialog.notes')}</label>
              <Textarea
                placeholder={t('dialog.notesPlaceholder')}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setReviewDialogOpen(false)}
              disabled={reviewing}
            >
              {tCommon('cancel')}
            </Button>
            <Button 
              onClick={handleReview}
              disabled={reviewing}
              variant={reviewAction === 'reject' ? 'destructive' : 'default'}
            >
              {reviewing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {t('reviewing')}
                </>
              ) : (
                t(`actions.${reviewAction}`)
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
