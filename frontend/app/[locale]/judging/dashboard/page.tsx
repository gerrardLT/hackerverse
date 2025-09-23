'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/use-auth'
import { apiService } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Lock, 
  Unlock,
  Filter,
  Search,
  SortAsc,
  SortDesc,
  RefreshCw,
  Eye,
  Star,
  Users,
  Calendar,
  Award,
  TrendingUp,
  BarChart3,
  Timer,
  Shield,
  FileCheck,
  Loader2
} from 'lucide-react'
import { Loading } from '@/components/ui/loading'

// 类型定义
interface DashboardData {
  assignments: any[]
  projects: any[]
  stats: {
    totalAssigned: number
    completed: number
    pending: number
    locked: number
  }
  timeStatus: {
    hasActiveDeadlines: boolean
    nextDeadline: string | null
    gracePeriodActive: boolean
  }
  pagination: {
    limit: number
    offset: number
    total: number
  }
}

interface FilterOptions {
  hackathonId: string
  status: string
  sortBy: string
  sortOrder: string
  search: string
}

const statusOptions = [
  { value: 'all', labelKey: 'judging.dashboard.status.all' },
  { value: 'assigned', labelKey: 'judging.dashboard.status.assigned' },
  { value: 'pending', labelKey: 'judging.dashboard.status.pending' },
  { value: 'completed', labelKey: 'judging.dashboard.status.completed' },
  { value: 'locked', labelKey: 'judging.dashboard.status.locked' }
]

const sortOptions = [
  { value: 'priority', labelKey: 'judging.dashboard.sort.priority' },
  { value: 'deadline', labelKey: 'judging.dashboard.sort.deadline' },
  { value: 'title', labelKey: 'judging.dashboard.sort.title' },
  { value: 'created', labelKey: 'judging.dashboard.sort.created' }
]

/**
 * 专业评委仪表板页面
 * 功能：
 * - 显示分配的项目列表
 * - 高级过滤和搜索
 * - 评审进度跟踪
 * - 时间控制状态显示
 * - 快速评分操作
 */
export default function JudgingDashboardPage() {
  const t = useTranslations()
  const { user, loading: authLoading } = useAuth()
  
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // 过滤器状态
  const [filters, setFilters] = useState<FilterOptions>({
    hackathonId: '',
    status: 'all',
    sortBy: 'priority',
    sortOrder: 'desc',
    search: ''
  })

  // 当前选中的项目（用于详情展示或评分）
  const [selectedProject, setSelectedProject] = useState<any | null>(null)
  const [showProjectDetails, setShowProjectDetails] = useState(false)

  // 初始化标记，避免过滤器useEffect在初次加载时触发
  const isInitializedRef = useRef(false)

  // 检查权限
  const hasJudgePermission = useMemo(() => {
    return user && ['ADMIN', 'MODERATOR', 'JUDGE'].includes(user.role)
  }, [user])

  // 加载仪表板数据
  const loadDashboardData = useCallback(async (showLoading = true) => {
    if (!hasJudgePermission) return

    try {
      if (showLoading) setLoading(true)
      if (!showLoading) setRefreshing(true)
      setError(null)

      const queryParams = new URLSearchParams()
      if (filters.hackathonId) queryParams.set('hackathonId', filters.hackathonId)
      if (filters.status !== 'all') queryParams.set('status', filters.status)
      queryParams.set('sortBy', filters.sortBy)
      queryParams.set('sortOrder', filters.sortOrder)
      queryParams.set('limit', '20')
      queryParams.set('offset', '0')

      // console.log('🎯 加载评委仪表板数据:', queryParams.toString())

      const response = await apiService.get(`/judging/dashboard?${queryParams.toString()}`)

      if (response.success && response.data) {
        setDashboardData(response.data)
        // 标记为已初始化
        if (!isInitializedRef.current) {
          isInitializedRef.current = true
        }
      } else {
        setError(response.error || t('judging.dashboard.errors.loadFailed'))
      }
    } catch (error: any) {
      console.error('❌ 加载仪表板数据失败:', error)
      setError(t('common.errors.networkError'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [filters, hasJudgePermission, t])

  // 初始加载
  useEffect(() => {
    if (hasJudgePermission) {
      loadDashboardData()
    }
  }, [loadDashboardData, hasJudgePermission])

  // 过滤器更改时重新加载（排除初始加载）
  useEffect(() => {
    // 只有在已初始化且有权限时，过滤器变化才重新加载
    if (hasJudgePermission && isInitializedRef.current) {
      const timeoutId = setTimeout(() => {
        loadDashboardData(false)
      }, 300) // 防抖

      return () => clearTimeout(timeoutId)
    }
  }, [filters, hasJudgePermission, loadDashboardData]) // 使用初始化标记而非dashboardData

  // 刷新数据
  const handleRefresh = useCallback(() => {
    loadDashboardData(false)
  }, [loadDashboardData])

  // 搜索处理
  const handleSearch = useCallback((searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm }))
  }, [])

  // 过滤后的项目列表
  const filteredProjects = useMemo(() => {
    if (!dashboardData?.projects) return []

    let projects = dashboardData.projects

    // 文本搜索
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      projects = projects.filter(project =>
        project.title?.toLowerCase().includes(searchTerm) ||
        project.description?.toLowerCase().includes(searchTerm) ||
        project.creator?.username?.toLowerCase().includes(searchTerm)
      )
    }

    return projects
  }, [dashboardData?.projects, filters.search])

  // 时间状态显示
  const renderTimeStatus = () => {
    if (!dashboardData?.timeStatus) return null

    const { hasActiveDeadlines, nextDeadline, gracePeriodActive } = dashboardData.timeStatus

    if (gracePeriodActive) {
      return (
        <Alert className="border-orange-200 bg-orange-50">
          <Timer className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            {t('judging.dashboard.timeStatus.gracePeriod')}
            {nextDeadline && (
              <span className="ml-2 font-medium">
                {t('judging.dashboard.timeStatus.until')} {new Date(nextDeadline).toLocaleString()}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )
    }

    if (hasActiveDeadlines && nextDeadline) {
      const isUrgent = new Date(nextDeadline).getTime() - Date.now() < 24 * 60 * 60 * 1000 // 24小时内

      return (
        <Alert className={isUrgent ? "border-red-200 bg-red-50" : "border-blue-200 bg-blue-50"}>
          <Clock className={`h-4 w-4 ${isUrgent ? 'text-red-600' : 'text-blue-600'}`} />
          <AlertDescription className={isUrgent ? 'text-red-800' : 'text-blue-800'}>
            {t('judging.dashboard.timeStatus.nextDeadline')}: {new Date(nextDeadline).toLocaleString()}
          </AlertDescription>
        </Alert>
      )
    }

    return null
  }

  // 统计卡片
  const renderStatsCards = () => {
    if (!dashboardData?.stats) return null

    const stats = dashboardData.stats
    const completionRate = stats.totalAssigned > 0 
      ? Math.round((stats.completed / stats.totalAssigned) * 100) 
      : 0

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('judging.dashboard.stats.totalAssigned')}</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAssigned}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('judging.dashboard.stats.completed')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <Progress value={completionRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">{completionRate}% {t('judging.dashboard.stats.completion')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('judging.dashboard.stats.pending')}</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('judging.dashboard.stats.locked')}</CardTitle>
            <Lock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.locked}</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 项目卡片
  const renderProjectCard = (project: any) => {
    const hasScore = project.scores && project.scores.length > 0
    const isFinalized = hasScore && project.scores.some((s: any) => s.isFinalized)
    const totalScore = hasScore ? project.scores[0].totalScore : null

    return (
      <Card key={project.id} className="cursor-pointer hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <CardTitle className="text-base line-clamp-2">{project.title}</CardTitle>
            <div className="flex items-center space-x-2">
              {isFinalized && (
                <Badge variant="success" className="text-xs">
                  <Shield className="w-3 h-3 mr-1" />
                  {t('judging.dashboard.project.finalized')}
                </Badge>
              )}
              {totalScore !== null && (
                <Badge variant="outline" className="text-xs font-mono">
                  {Number(totalScore).toFixed(1)}
                </Badge>
              )}
            </div>
          </div>
          
          <CardDescription className="line-clamp-2">
            {project.description || t('judging.dashboard.project.noDescription')}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-0">
          {/* 项目信息 */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="w-4 h-4 mr-2" />
              {project.creator?.username || project.creator?.email}
            </div>

            {project.hackathon && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 mr-2" />
                {project.hackathon.title}
              </div>
            )}

            {project.technologies && Array.isArray(project.technologies) && project.technologies.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {project.technologies.slice(0, 3).map((tech: string) => (
                  <Badge key={tech} variant="secondary" className="text-xs">
                    {tech}
                  </Badge>
                ))}
                {project.technologies.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{project.technologies.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedProject(project)
                setShowProjectDetails(true)
              }}
            >
              <Eye className="w-4 h-4 mr-2" />
              {t('judging.dashboard.project.viewDetails')}
            </Button>

            {!isFinalized && (
              <Button
                size="sm"
                onClick={() => {
                  // TODO: 打开评分表单
                  console.log('开始评分:', project.id)
                }}
              >
                <Star className="w-4 h-4 mr-2" />
                {hasScore ? t('judging.dashboard.project.updateScore') : t('judging.dashboard.project.startScoring')}
              </Button>
            )}
          </div>

          {/* 评分进度 */}
          {hasScore && (
            <div className="mt-3 pt-3 border-t">
              <div className="text-xs text-muted-foreground mb-1">
                {t('judging.dashboard.project.scoringProgress')}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>
                  {Object.keys(project.scores[0]).filter(key => 
                    ['innovation', 'technicalComplexity', 'userExperience', 'businessPotential', 'presentation'].includes(key) && 
                    project.scores[0][key] !== null
                  ).length} / 5 {t('judging.dashboard.project.criteriaScored')}
                </span>
                <span className="text-muted-foreground text-xs">
                  {t('judging.dashboard.project.lastUpdated')}: {new Date(project.scores[0].updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // 如果未登录
  if (authLoading) {
    return <Loading className="min-h-screen" />
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t('common.auth.loginRequired')}</CardTitle>
            <CardDescription>{t('judging.dashboard.errors.authRequired')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/auth/signin'} className="w-full">
              {t('common.auth.login')}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 如果没有权限
  if (!hasJudgePermission) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2 text-red-500" />
              {t('common.errors.accessDenied')}
            </CardTitle>
            <CardDescription>{t('judging.dashboard.errors.judgeOnly')}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // 加载状态
  if (loading) {
    return <Loading className="min-h-screen" />
  }

  // 错误状态
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertTriangle className="w-5 h-5 mr-2" />
              {t('common.errors.loadFailed')}
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => loadDashboardData()} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('common.actions.retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* 页面标题和操作 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{t('judging.dashboard.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('judging.dashboard.subtitle')}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {t('common.actions.refresh')}
          </Button>
        </div>
      </div>

      {/* 时间状态警告 */}
      {renderTimeStatus()}

      {/* 统计卡片 */}
      {renderStatsCards()}

      {/* 过滤器和搜索 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            {t('judging.dashboard.filters.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 状态过滤 */}
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 排序 */}
            <Select
              value={filters.sortBy}
              onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 排序顺序 */}
            <Button
              variant="outline"
              onClick={() => setFilters(prev => ({ 
                ...prev, 
                sortOrder: prev.sortOrder === 'desc' ? 'asc' : 'desc' 
              }))}
              className="flex items-center"
            >
              {filters.sortOrder === 'desc' ? (
                <SortDesc className="w-4 h-4 mr-2" />
              ) : (
                <SortAsc className="w-4 h-4 mr-2" />
              )}
              {t(`judging.dashboard.sort.${filters.sortOrder}`)}
            </Button>

            {/* 搜索 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('judging.dashboard.search.placeholder')}
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 项目列表 */}
      <div className="space-y-4">
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredProjects.map(renderProjectCard)}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <FileCheck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {filters.search || filters.status !== 'all' 
                  ? t('judging.dashboard.empty.noMatches')
                  : t('judging.dashboard.empty.noProjects')
                }
              </h3>
              <p className="text-muted-foreground">
                {filters.search || filters.status !== 'all'
                  ? t('judging.dashboard.empty.tryDifferentFilters')
                  : t('judging.dashboard.empty.waitForAssignment')
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
