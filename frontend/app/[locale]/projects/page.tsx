'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { apiService } from '@/lib/api'

// UI Components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'

// Icons
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye,
  Send,
  Calendar,
  Users,
  Heart,
  MessageCircle,
  GitBranch,
  ExternalLink,
  Award,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// Types
interface Project {
  id: string
  title: string
  description: string
  status: string
  statusDisplay: string
  technologies: string[]
  tags: string[]
  githubUrl?: string
  demoUrl?: string
  videoUrl?: string
  presentationUrl?: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
  hackathon?: {
    id: string
    title: string
    status: string
    startDate: string
    endDate: string
  }
  team?: {
    id: string
    name: string
    members: Array<{
      user: {
        id: string
        username: string
        avatarUrl?: string
      }
    }>
  }
  submissions: Array<{
    id: string
    hackathon: {
      id: string
      title: string
      status: string
    }
    submittedAt: string
    status: string
    statusDisplay: string
    notes?: string
    withdrawnAt?: string
    withdrawReason?: string
  }>
  scores: Array<{
    totalScore: number
    innovation: number
    technicalComplexity: number
    userExperience: number
    businessPotential: number
    presentation: number
    judgeId: string
  }>
  averageScore?: number
  stats: {
    likes: number
    comments: number
    submissions: number
  }
}

interface ProjectStats {
  total: number
  draft: number
  readyToSubmit: number
  submitted: number
  reviewed: number
  winner: number
  rejected: number
}

interface ProjectsResponse {
  success: boolean
  data: {
    projects: Project[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasNext: boolean
      hasPrev: boolean
    }
    stats: ProjectStats
    filters: {
      status: string
      search?: string
    }
  }
  error?: string
}

export default function ProjectsPage() {
  const t = useTranslations('projects')
  const tCommon = useTranslations('common')
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  // State
  const [projects, setProjects] = useState<Project[]>([])
  const [stats, setStats] = useState<ProjectStats>({
    total: 0,
    draft: 0,
    readyToSubmit: 0,
    submitted: 0,
    reviewed: 0,
    winner: 0,
    rejected: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filter and search state
  const [activeTab, setActiveTab] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('updatedAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [page, setPage] = useState(1)
  const limit = 12

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    if (!user) return

    try {
      setIsLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        status: activeTab,
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder
      })
      
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim())
      }

      const response = await apiService.get(
        `/users/me/projects?${params.toString()}`
      )

      if (response.success && response.data) {
        const data = response.data as any
        setProjects(data.projects || [])
        setStats(data.stats || {
          total: 0,
          draft: 0,
          readyToSubmit: 0,
          submitted: 0,
          reviewed: 0,
          winner: 0,
          rejected: 0
        })
      } else {
        throw new Error(response.error || 'Failed to fetch projects')
      }
    } catch (err) {
      console.error('Fetch projects error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load projects')
    } finally {
      setIsLoading(false)
    }
  }, [user, activeTab, page, searchQuery, sortBy, sortOrder])

  // Effects
  useEffect(() => {
    if (!authLoading && user) {
      fetchProjects()
    }
  }, [authLoading, user, fetchProjects])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [activeTab, searchQuery, sortBy, sortOrder])

  // Delete project handler
  const handleDeleteProject = async () => {
    if (!projectToDelete) return

    try {
      setIsDeleting(true)
      
      const response = await apiService.delete(`/projects/${projectToDelete.id}`)

      if (response.success) {
        await fetchProjects() // Refresh list
        setDeleteDialogOpen(false)
        setProjectToDelete(null)
      } else {
        throw new Error(response.error || 'Failed to delete project')
      }
    } catch (err) {
      console.error('Delete project error:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete project')
    } finally {
      setIsDeleting(false)
    }
  }

  // Status badges
  const getStatusBadge = (status: string, statusDisplay: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      DRAFT: 'outline',
      READY_TO_SUBMIT: 'default',
      SUBMITTED: 'secondary',
      REVIEWED: 'secondary',
      WINNER: 'default',
      REJECTED: 'destructive'
    }

    const colors: Record<string, string> = {
      DRAFT: 'text-gray-600 border-gray-300',
      READY_TO_SUBMIT: 'text-blue-700 bg-blue-50 border-blue-300',
      SUBMITTED: 'text-green-700 bg-green-50 border-green-300',
      REVIEWED: 'text-purple-700 bg-purple-50 border-purple-300',
      WINNER: 'text-yellow-700 bg-yellow-50 border-yellow-300',
      REJECTED: 'text-red-700 bg-red-50 border-red-300'
    }

    return (
      <Badge 
        variant={variants[status] || 'outline'} 
        className={colors[status] || ''}
      >
        {statusDisplay}
      </Badge>
    )
  }

  // Loading skeleton
  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Auth guard
  if (!user) {
    return (
      <div className="container mx-auto py-6 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">{t('auth.loginRequired')}</h1>
        <Button asChild>
          <Link href="/auth/signin">{t('auth.login')}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 主内容区 - max-width 1280px */}
      <div className="container max-w-[1280px] mx-auto px-4 md:px-6">
        {/* 紧凑头部工具栏 - 80px高度 - Flat Design 2.0 */}
        <div className="h-[80px] flex items-center justify-between border-b border-border/50">
          {/* 左侧：标题+统计 */}
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {stats.total} {t('stats.projectsTotal')}
              </p>
            </div>
            
            {/* 快速统计 */}
            <div className="hidden lg:flex items-center gap-3 ml-4">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span className="text-xs font-medium">{stats.readyToSubmit} {t('stats.ready')}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-50 dark:bg-green-950/20">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-xs font-medium">{stats.submitted} {t('stats.submitted')}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                <span className="text-xs font-medium">{stats.winner} {t('stats.winner')}</span>
              </div>
            </div>
          </div>

          {/* 右侧：搜索+筛选+创建 */}
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

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[110px] h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updatedAt">{t('sort.updated')}</SelectItem>
                <SelectItem value="createdAt">{t('sort.created')}</SelectItem>
                <SelectItem value="title">{t('sort.title')}</SelectItem>
              </SelectContent>
            </Select>

            <Button size="sm" asChild className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
              <Link href="/projects/create">
                <Plus className="h-4 w-4 mr-1" />
                {t('actions.create')}
              </Link>
            </Button>
          </div>
        </div>

        {/* 紧凑Tab系统 - 48px高度 - Flat Design 2.0 */}
        <div className="py-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="bg-muted/30 rounded-xl p-1">
              <TabsList className="h-[48px] w-full grid grid-cols-4 md:grid-cols-7 bg-transparent gap-1 border-0">
                <TabsTrigger value="ALL" className="text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  {t('tabs.all')} <Badge variant="secondary" className="ml-1.5 text-xs">{stats.total}</Badge>
                </TabsTrigger>
                <TabsTrigger value="DRAFT" className="text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  {t('tabs.draft')} <Badge variant="outline" className="ml-1.5 text-xs">{stats.draft}</Badge>
                </TabsTrigger>
                <TabsTrigger value="READY_TO_SUBMIT" className="text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <span className="hidden md:inline">{t('tabs.ready')}</span>
                  <span className="md:hidden">Ready</span>
                  <Badge variant="secondary" className="ml-1.5 text-xs bg-blue-100">{stats.readyToSubmit}</Badge>
                </TabsTrigger>
                <TabsTrigger value="SUBMITTED" className="text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <span className="hidden md:inline">{t('tabs.submitted')}</span>
                  <span className="md:hidden">Submit</span>
                  <Badge variant="secondary" className="ml-1.5 text-xs bg-green-100">{stats.submitted}</Badge>
                </TabsTrigger>
                <TabsTrigger value="REVIEWED" className="text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm hidden md:flex">
                  {t('tabs.reviewed')} <Badge variant="secondary" className="ml-1.5 text-xs bg-purple-100">{stats.reviewed}</Badge>
                </TabsTrigger>
                <TabsTrigger value="WINNER" className="text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm hidden md:flex">
                  {t('tabs.winner')} <Badge variant="secondary" className="ml-1.5 text-xs bg-yellow-100">{stats.winner}</Badge>
                </TabsTrigger>
                <TabsTrigger value="REJECTED" className="text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm hidden md:flex">
                  {t('tabs.rejected')} <Badge variant="secondary" className="ml-1.5 text-xs bg-red-100">{stats.rejected}</Badge>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="mt-4">
          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-red-800">{error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {projects.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-muted-foreground mb-4">
                  {activeTab === 'ALL' ? t('empty.noProjects') : t('empty.noProjectsWithStatus')}
                </div>
                <Button asChild>
                  <Link href="/projects/create">
                    <Plus className="w-4 h-4 mr-2" />
                    {t('actions.createFirst')}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* 紧凑项目网格 - 4列布局 - Flat Design 2.0 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {projects.map((project) => (
                  <Card key={project.id} className="h-[200px] border-border/50 hover:border-primary/50 hover:shadow-lg transition-all duration-300 hover-lift group cursor-pointer"
                        onClick={() => router.push(`/projects/${project.id}`)}>
                    <CardHeader className="pb-2 pt-3 px-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm font-semibold line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                            {project.title}
                          </CardTitle>
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            {getStatusBadge(project.status, project.statusDisplay)}
                            {project.hackathon && (
                              <Badge variant="outline" className="text-xs truncate max-w-[100px] h-5 px-1.5">
                                {project.hackathon.title}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0">
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/projects/${project.id}`}>
                                <Eye className="h-3 w-3 mr-2" />
                                {tCommon('view')}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/projects/${project.id}/edit`}>
                                <Edit className="h-3 w-3 mr-2" />
                                {tCommon('edit')}
                              </Link>
                            </DropdownMenuItem>
                            {project.status === 'DRAFT' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setProjectToDelete(project)
                                    setDeleteDialogOpen(true)
                                  }}
                                >
                                  <Trash2 className="h-3 w-3 mr-2" />
                                  {tCommon('delete')}
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 pt-2 space-y-2">
                      {project.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {project.description}
                        </p>
                      )}
                      
                      {/* Technologies */}
                      {project.technologies && project.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {project.technologies.slice(0, 3).map((tech, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
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

                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            <span>{project.stats.likes}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            <span>{project.stats.comments}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Send className="h-3 w-3" />
                            <span>{project.stats.submissions}</span>
                          </div>
                        </div>
                      </div>

                      {/* Links */}
                      {(project.githubUrl || project.demoUrl) && (
                        <div className="flex gap-2">
                          {project.githubUrl && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                                <GitBranch className="h-3 w-3 mr-1" />
                                {t('links.code')}
                              </a>
                            </Button>
                          )}
                          {project.demoUrl && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                {t('links.demo')}
                              </a>
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Date */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                        </div>
                        {project.averageScore && (
                          <div className="flex items-center gap-1">
                            <Award className="h-3 w-3" />
                            <span>{project.averageScore}/100</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination (if needed) */}
              {/* Add pagination component here if totalPages > 1 */}
            </>
          )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('actions.confirmDelete')}</DialogTitle>
            <DialogDescription>
              {t('actions.deleteWarning', { title: projectToDelete?.title })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProject}
              disabled={isDeleting}
            >
              {isDeleting ? tCommon('deleting') : tCommon('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
