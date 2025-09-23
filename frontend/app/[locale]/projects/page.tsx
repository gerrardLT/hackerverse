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
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('description', { total: stats.total })}
          </p>
        </div>
        <Button asChild>
          <Link href="/projects/create">
            <Plus className="w-4 h-4 mr-2" />
            {t('actions.create')}
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <div className="text-xs text-muted-foreground">{t('stats.total')}</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
            <div className="text-xs text-muted-foreground">{t('stats.draft')}</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.readyToSubmit}</div>
            <div className="text-xs text-muted-foreground">{t('stats.readyToSubmit')}</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.submitted}</div>
            <div className="text-xs text-muted-foreground">{t('stats.submitted')}</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.reviewed}</div>
            <div className="text-xs text-muted-foreground">{t('stats.reviewed')}</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.winner}</div>
            <div className="text-xs text-muted-foreground">{t('stats.winner')}</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-xs text-muted-foreground">{t('stats.rejected')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('search.placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updatedAt">{t('sort.updated')}</SelectItem>
                  <SelectItem value="createdAt">{t('sort.created')}</SelectItem>
                  <SelectItem value="title">{t('sort.title')}</SelectItem>
                  <SelectItem value="status">{t('sort.status')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">{t('sort.desc')}</SelectItem>
                  <SelectItem value="asc">{t('sort.asc')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-7 w-full">
          <TabsTrigger value="ALL">{t('tabs.all')}</TabsTrigger>
          <TabsTrigger value="DRAFT">{t('tabs.draft')}</TabsTrigger>
          <TabsTrigger value="READY_TO_SUBMIT">{t('tabs.ready')}</TabsTrigger>
          <TabsTrigger value="SUBMITTED">{t('tabs.submitted')}</TabsTrigger>
          <TabsTrigger value="REVIEWED">{t('tabs.reviewed')}</TabsTrigger>
          <TabsTrigger value="WINNER">{t('tabs.winner')}</TabsTrigger>
          <TabsTrigger value="REJECTED">{t('tabs.rejected')}</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
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
              {/* Projects Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <Card key={project.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg line-clamp-2">{project.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusBadge(project.status, project.statusDisplay)}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/projects/${project.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                {tCommon('view')}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/projects/${project.id}/edit`}>
                                <Edit className="h-4 w-4 mr-2" />
                                {tCommon('edit')}
                              </Link>
                            </DropdownMenuItem>
                            {project.status === 'DRAFT' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => {
                                    setProjectToDelete(project)
                                    setDeleteDialogOpen(true)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {tCommon('delete')}
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
  )
}
