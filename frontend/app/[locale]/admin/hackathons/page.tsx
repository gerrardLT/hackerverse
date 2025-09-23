'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Eye,
  Filter,
  Flag,
  History,
  RefreshCw,
  Search,
  Star,
  User,
  Users,
  XCircle
} from 'lucide-react'
import { apiService } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface HackathonReviewItem {
  id: string
  title: string
  description: string
  status: string
  reviewStatus: string
  prizePool: number
  maxParticipants: number
  startDate: string
  endDate: string
  submittedForReviewAt: string
  reviewedAt: string | null
  daysSinceSubmission: number | null
  isUrgent: boolean
  organizer: {
    id: string
    username: string
    email: string
    role: string
    reputationScore: number
    avatar: string | null
  }
  reviewer: {
    id: string
    username: string
    role: string
  } | null
  _count: {
    participations: number
    projects: number
    teams: number
  }
  reviewStats: Record<string, number>
  averageScore: number | null
  latestReview: {
    id: string
    action: string
    status: string
    feedback: string | null
    createdAt: string
    reviewer: {
      username: string
    }
  } | null
}

interface ReviewFilters {
  status: string
  priority: string
  category: string
  sortBy: string
  sortOrder: string
  search: string
}

export default function HackathonReviewPage() {
  const t = useTranslations('admin.hackathons')
  const tCommon = useTranslations('common')
  const { toast } = useToast()
  
  const [hackathons, setHackathons] = useState<HackathonReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<ReviewFilters>({
    status: 'PENDING_REVIEW',
    priority: 'all',
    category: 'all',
    sortBy: 'submittedForReviewAt',
    sortOrder: 'desc',
    search: ''
  })
  const [selectedHackathon, setSelectedHackathon] = useState<HackathonReviewItem | null>(null)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'request_changes'>('approve')
  const [reviewData, setReviewData] = useState({
    score: 8,
    priority: 'normal',
    category: 'content',
    feedback: '',
    rejectionReason: '',
    recommendedChanges: '',
    isPublic: false
  })
  const [reviewing, setReviewing] = useState(false)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [reviewHistory, setReviewHistory] = useState<any[]>([])

  const loadHackathons = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        ...filters,
        limit: '20'
      })
      
      const response = await apiService.get(`/admin/hackathons/pending?${params}`)
      
      if (response.success) {
        setHackathons((response.data as any)?.hackathons || [])
      } else {
        toast({
          title: t('loadError'),
          description: response.error || t('unknownError'),
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('获取待审核黑客松失败:', error)
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
    loadHackathons()
  }, [filters])

  const handleFilterChange = (key: keyof ReviewFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const openReviewDialog = (hackathon: HackathonReviewItem, action: 'approve' | 'reject' | 'request_changes') => {
    setSelectedHackathon(hackathon)
    setReviewAction(action)
    setReviewData({
      score: 8,
      priority: hackathon.isUrgent ? 'high' : 'normal',
      category: 'content',
      feedback: '',
      rejectionReason: '',
      recommendedChanges: '',
      isPublic: false
    })
    setReviewDialogOpen(true)
  }

  const handleReview = async () => {
    if (!selectedHackathon) return
    
    setReviewing(true)
    try {
      const payload = {
        action: reviewAction,
        ...reviewData,
        hackathonStatus: reviewAction === 'approve' ? 'APPROVED' : undefined
      }
      
      const response = await apiService.post(`/admin/hackathons/${selectedHackathon.id}/review`, payload)
      
      if (response.success) {
        toast({
          title: t(`${reviewAction}Success`),
          description: response.message,
          variant: 'default'
        })
        
        // 重新加载列表
        await loadHackathons()
        
        // 关闭对话框
        setReviewDialogOpen(false)
        setSelectedHackathon(null)
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

  const loadReviewHistory = async (hackathonId: string) => {
    try {
      const response = await apiService.get(`/admin/hackathons/${hackathonId}/review-history`)
      if (response.success) {
        setReviewHistory((response.data as any)?.reviews || [])
        setHistoryDialogOpen(true)
      }
    } catch (error) {
      console.error('获取审核历史失败:', error)
      toast({
        title: t('historyError'),
        description: t('networkError'),
        variant: 'destructive'
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return <Badge variant="secondary">{t('status.pendingReview')}</Badge>
      case 'APPROVED':
        return <Badge variant="default">{t('status.approved')}</Badge>
      case 'REJECTED':
        return <Badge variant="destructive">{t('status.rejected')}</Badge>
      case 'DRAFT':
        return <Badge variant="outline">{t('status.draft')}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityBadge = (isUrgent: boolean, daysSince: number | null) => {
    if (isUrgent) {
      return <Badge variant="destructive">{t('priority.urgent')}</Badge>
    } else if (daysSince && daysSince > 3) {
      return <Badge variant="secondary">{t('priority.high')}</Badge>
    }
    return <Badge variant="outline">{t('priority.normal')}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('title')}</h2>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        
        <Button onClick={loadHackathons} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {tCommon('refresh')}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t('filters.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <Select 
              value={filters.status} 
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING_REVIEW">{t('status.pendingReview')}</SelectItem>
                <SelectItem value="APPROVED">{t('status.approved')}</SelectItem>
                <SelectItem value="REJECTED">{t('status.rejected')}</SelectItem>
                <SelectItem value="all">{t('filters.status.all')}</SelectItem>
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
              </SelectContent>
            </Select>

            <Select 
              value={filters.category} 
              onValueChange={(value) => handleFilterChange('category', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.category.all')}</SelectItem>
                <SelectItem value="content">{t('category.content')}</SelectItem>
                <SelectItem value="legal">{t('category.legal')}</SelectItem>
                <SelectItem value="technical">{t('category.technical')}</SelectItem>
                <SelectItem value="business">{t('category.business')}</SelectItem>
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
                <SelectItem value="submittedForReviewAt">{t('filters.sortBy.submitted')}</SelectItem>
                <SelectItem value="createdAt">{t('filters.sortBy.created')}</SelectItem>
                <SelectItem value="title">{t('filters.sortBy.title')}</SelectItem>
                <SelectItem value="prizePool">{t('filters.sortBy.prizePool')}</SelectItem>
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

            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('filters.searchPlaceholder')}
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hackathons List */}
      <div className="space-y-4">
        {loading ? (
          // Loading skeleton
          [...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="flex justify-between">
                    <div className="h-5 bg-muted rounded w-1/3"></div>
                    <div className="h-6 bg-muted rounded w-20"></div>
                  </div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : hackathons.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto" />
                <h3 className="text-lg font-semibold">{t('noHackathons.title')}</h3>
                <p className="text-muted-foreground">{t('noHackathons.description')}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          hackathons.map((hackathon) => (
            <Card key={hackathon.id} className={hackathon.isUrgent ? 'border-destructive' : ''}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{hackathon.title}</h3>
                        {getStatusBadge(hackathon.status)}
                        {getPriorityBadge(hackathon.isUrgent, hackathon.daysSinceSubmission)}
                        {hackathon.averageScore && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            {hackathon.averageScore.toFixed(1)}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-muted-foreground text-sm line-clamp-2">
                        {hackathon.description}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {hackathon.organizer.username} ({hackathon.organizer.role})
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ${hackathon.prizePool?.toLocaleString() || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {hackathon._count.participations} / {hackathon.maxParticipants || '∞'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {hackathon.daysSinceSubmission !== null 
                            ? `${hackathon.daysSinceSubmission} ${t('daysAgo')}`
                            : t('justSubmitted')
                          }
                        </span>
                      </div>

                      {hackathon.latestReview && (
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">
                            {t('latestReview')} - {hackathon.latestReview.reviewer.username}
                          </p>
                          <p className="text-sm">{hackathon.latestReview.feedback || t('noFeedback')}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      {hackathon.status === 'PENDING_REVIEW' && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="default"
                            onClick={() => openReviewDialog(hackathon, 'approve')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {t('actions.approve')}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => openReviewDialog(hackathon, 'reject')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            {t('actions.reject')}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openReviewDialog(hackathon, 'request_changes')}
                          >
                            <Flag className="h-4 w-4 mr-1" />
                            {t('actions.requestChanges')}
                          </Button>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => loadReviewHistory(hackathon.id)}
                        >
                          <History className="h-4 w-4 mr-1" />
                          {t('actions.history')}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(`/hackathons/${hackathon.id}`, '_blank')}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {t('actions.view')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' && t('dialog.approve.title')}
              {reviewAction === 'reject' && t('dialog.reject.title')}
              {reviewAction === 'request_changes' && t('dialog.requestChanges.title')}
            </DialogTitle>
            <DialogDescription>
              {selectedHackathon && (
                <>
                  {t('dialog.hackathonInfo')}: {selectedHackathon.title}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">{t('dialog.tabs.basic')}</TabsTrigger>
              <TabsTrigger value="advanced">{t('dialog.tabs.advanced')}</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">{t('dialog.score')}</label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={reviewData.score}
                    onChange={(e) => setReviewData(prev => ({
                      ...prev,
                      score: parseInt(e.target.value) || 1
                    }))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">{t('dialog.priority')}</label>
                  <Select
                    value={reviewData.priority}
                    onValueChange={(value) => setReviewData(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{t('priority.low')}</SelectItem>
                      <SelectItem value="normal">{t('priority.normal')}</SelectItem>
                      <SelectItem value="high">{t('priority.high')}</SelectItem>
                      <SelectItem value="urgent">{t('priority.urgent')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">{t('dialog.feedback')}</label>
                <Textarea
                  placeholder={t('dialog.feedbackPlaceholder')}
                  value={reviewData.feedback}
                  onChange={(e) => setReviewData(prev => ({ ...prev, feedback: e.target.value }))}
                  className="mt-1"
                  rows={3}
                />
              </div>

              {reviewAction === 'reject' && (
                <div>
                  <label className="text-sm font-medium">{t('dialog.rejectionReason')}</label>
                  <Textarea
                    placeholder={t('dialog.rejectionReasonPlaceholder')}
                    value={reviewData.rejectionReason}
                    onChange={(e) => setReviewData(prev => ({ ...prev, rejectionReason: e.target.value }))}
                    className="mt-1"
                    rows={3}
                  />
                </div>
              )}

              {reviewAction === 'request_changes' && (
                <div>
                  <label className="text-sm font-medium">{t('dialog.recommendedChanges')}</label>
                  <Textarea
                    placeholder={t('dialog.recommendedChangesPlaceholder')}
                    value={reviewData.recommendedChanges}
                    onChange={(e) => setReviewData(prev => ({ ...prev, recommendedChanges: e.target.value }))}
                    className="mt-1"
                    rows={3}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <div>
                <label className="text-sm font-medium">{t('dialog.category')}</label>
                <Select
                  value={reviewData.category}
                  onValueChange={(value) => setReviewData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="content">{t('category.content')}</SelectItem>
                    <SelectItem value="legal">{t('category.legal')}</SelectItem>
                    <SelectItem value="technical">{t('category.technical')}</SelectItem>
                    <SelectItem value="business">{t('category.business')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={reviewData.isPublic}
                  onChange={(e) => setReviewData(prev => ({ ...prev, isPublic: e.target.checked }))}
                />
                <label htmlFor="isPublic" className="text-sm font-medium">
                  {t('dialog.isPublic')}
                </label>
              </div>
            </TabsContent>
          </Tabs>

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

      {/* Review History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('dialog.history.title')}</DialogTitle>
            <DialogDescription>
              {selectedHackathon && selectedHackathon.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {reviewHistory.map((review, index) => (
              <Card key={review.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={review.status === 'approved' ? 'default' : 
                                      review.status === 'rejected' ? 'destructive' : 'secondary'}>
                          {review.action}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {review.reviewer.username}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {review.feedback && (
                        <p className="text-sm">{review.feedback}</p>
                      )}
                      {review.score && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          <span className="text-sm">{review.score}/10</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <DialogFooter>
            <Button onClick={() => setHistoryDialogOpen(false)}>
              {tCommon('close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
