'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/use-auth'
import { apiService } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import { LikeButton } from '@/components/projects/like-button'
import { CommentSystem } from '@/components/projects/comment-system'
import { 
  Edit, 
  Trash2, 
  ExternalLink, 
  Github, 
  Play, 
  Presentation, 
  Video,
  Calendar,
  Users,
  Trophy,
  Star,
  MessageCircle,
  Heart,
  Share2,
  Settings,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'

interface ProjectDetail {
  id: string
  title: string
  description: string
  status: string
  technologies: string[]
  tags: string[]
  githubUrl?: string
  demoUrl?: string
  videoUrl?: string
  presentationUrl?: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
  averageScore?: number
  isOwner: boolean
  isLiked: boolean
  creator: {
    id: string
    username: string
    avatarUrl?: string
    email: string
  }
  hackathon?: {
    id: string
    title: string
    description: string
    status: string
    startDate: string
    endDate: string
    registrationDeadline: string
    maxParticipants: number
    isPublic: boolean
    tracks: string[]
  }
  team?: {
    id: string
    name: string
    description: string
    status: string
    maxMembers: number
    members: Array<{
      userId: string
      role: string
      joinedAt: string
      user: {
        id: string
        username: string
        avatarUrl?: string
        email: string
      }
    }>
  }
  submissions: Array<{
    id: string
    submittedAt: string
    status: string
    hackathon: {
      id: string
      title: string
      description: string
      status: string
      startDate: string
      endDate: string
    }
  }>
  scores: Array<{
    id: string
    totalScore: number
    innovation: number
    technicalComplexity: number
    userExperience: number
    businessPotential: number
    presentation: number
    judgeId: string
    createdAt: string
    judge: {
      id: string
      userId: string
      user: {
        username: string
        avatarUrl?: string
      }
    }
  }>
  projectLikes: Array<{
    id: string
    userId: string
    createdAt: string
    user: {
      username: string
      avatarUrl?: string
    }
  }>
  projectComments: Array<{
    id: string
    content: string
    userId: string
    parentId?: string
    isEdited: boolean
    createdAt: string
    updatedAt: string
    user: {
      username: string
      avatarUrl?: string
    }
    replies: Array<{
      id: string
      content: string
      userId: string
      parentId: string
      isEdited: boolean
      createdAt: string
      updatedAt: string
      user: {
        username: string
        avatarUrl?: string
      }
    }>
  }>
  _count: {
    projectLikes: number
    projectComments: number
    submissions: number
  }
}

const PROJECT_STATUS_MAP = {
  DRAFT: { color: 'bg-gray-100 text-gray-800', label: 'draft' },
  READY_TO_SUBMIT: { color: 'bg-blue-100 text-blue-800', label: 'readyToSubmit' },
  SUBMITTED: { color: 'bg-green-100 text-green-800', label: 'submitted' },
  REVIEWED: { color: 'bg-purple-100 text-purple-800', label: 'reviewed' },
  WINNER: { color: 'bg-yellow-100 text-yellow-800', label: 'winner' },
  REJECTED: { color: 'bg-red-100 text-red-800', label: 'rejected' }
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('projects')
  const { user, loading: authLoading } = useAuth()
  
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const projectId = params.id as string

  // 获取项目详情
  const fetchProject = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiService.get(`/projects/${projectId}`)
      
      if (response.success) {
        setProject(response.data as ProjectDetail)
      } else {
        setError(response.error || t('errors.fetchProject'))
      }
    } catch (err: any) {
      console.error('Error fetching project:', err)
      setError(err.message || t('errors.fetchProject'))
    } finally {
      setLoading(false)
    }
  }

  // 删除项目
  const handleDeleteProject = async () => {
    if (!confirm(t('actions.deleteWarning', { title: project?.title }))) {
      return
    }

    try {
      setIsDeleting(true)
      
      const response = await apiService.delete(`/projects/${projectId}`)
      
      if (response.success) {
        router.push('/projects')
      } else {
        setError(response.error || t('errors.deleteProject'))
      }
    } catch (err: any) {
      console.error('Error deleting project:', err)
      setError(err.message || t('errors.deleteProject'))
    } finally {
      setIsDeleting(false)
    }
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 获取状态显示
  const getStatusDisplay = (status: string) => {
    const statusInfo = PROJECT_STATUS_MAP[status as keyof typeof PROJECT_STATUS_MAP]
    return {
      color: statusInfo?.color || 'bg-gray-100 text-gray-800',
      label: t(`stats.${statusInfo?.label || 'draft'}`)
    }
  }

  useEffect(() => {
    if (!authLoading) {
      fetchProject()
    }
  }, [projectId, authLoading])

  // 加载状态
  if (authLoading || loading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center">
            <Loader2 className="h-12 w-12 animate-spin" />
          </div>
          <p className="mt-4 text-center text-muted-foreground">
            {t('loading.project')}
          </p>
        </div>
      </div>
    )
  }

  // 错误状态
  if (error) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          
          <div className="mt-6 text-center">
            <Button 
              variant="outline" 
              onClick={() => router.back()}
            >
              {t('actions.goBack')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // 项目不存在
  if (!project) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">{t('errors.projectNotFound')}</h1>
          <Button 
            variant="outline" 
            onClick={() => router.push('/projects')}
          >
            {t('actions.backToProjects')}
          </Button>
        </div>
      </div>
    )
  }

  const statusDisplay = getStatusDisplay(project.status)

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 项目头部 */}
        <div className="flex flex-col space-y-4">
          {/* 导航 */}
          <div className="flex items-center text-sm text-muted-foreground">
            <Link href="/projects" className="hover:text-primary">
              {t('title')}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{project.title}</span>
          </div>

          {/* 项目标题和操作 */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold">{project.title}</h1>
                <Badge className={statusDisplay.color}>
                  {statusDisplay.label}
                </Badge>
              </div>
              
              {project.description && (
                <p className="text-muted-foreground">{project.description}</p>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center gap-2">
              <LikeButton 
                projectId={project.id}
                initialLiked={project.isLiked}
                initialCount={project._count.projectLikes}
                size="sm"
              />
              
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                {t('actions.share')}
              </Button>

              {project.isOwner && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    asChild
                  >
                    <Link href={`/projects/${project.id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      {t('actions.edit')}
                    </Link>
                  </Button>

                  {project.status === 'DRAFT' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleDeleteProject}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {isDeleting ? t('actions.deleting') : t('actions.delete')}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* 项目链接 */}
          {(project.githubUrl || project.demoUrl || project.videoUrl || project.presentationUrl) && (
            <div className="flex flex-wrap gap-2">
              {project.githubUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                    <Github className="h-4 w-4 mr-2" />
                    {t('links.code')}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              )}
              
              {project.demoUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                    <Play className="h-4 w-4 mr-2" />
                    {t('links.demo')}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              )}
              
              {project.videoUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={project.videoUrl} target="_blank" rel="noopener noreferrer">
                    <Video className="h-4 w-4 mr-2" />
                    {t('links.video')}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              )}
              
              {project.presentationUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={project.presentationUrl} target="_blank" rel="noopener noreferrer">
                    <Presentation className="h-4 w-4 mr-2" />
                    {t('links.presentation')}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              )}
            </div>
          )}
        </div>

        {/* 主要内容 */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6">
            <TabsTrigger value="overview">{t('tabs.overview')}</TabsTrigger>
            <TabsTrigger value="team">{t('tabs.team')}</TabsTrigger>
            <TabsTrigger value="submissions">{t('tabs.submissions')}</TabsTrigger>
            <TabsTrigger value="scores">{t('tabs.scores')}</TabsTrigger>
            <TabsTrigger value="activity" className="hidden lg:block">{t('tabs.activity')}</TabsTrigger>
            <TabsTrigger value="comments" className="hidden lg:block">{t('tabs.comments')}</TabsTrigger>
          </TabsList>

          {/* 概览标签页 */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* 项目信息 */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('details.projectInfo')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">{t('form.technologies')}</h4>
                    <div className="flex flex-wrap gap-1">
                      {project.technologies.length > 0 ? (
                        project.technologies.map((tech, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tech}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          {t('empty.noTechnologies')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">{t('form.tags')}</h4>
                    <div className="flex flex-wrap gap-1">
                      {project.tags.length > 0 ? (
                        project.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            #{tag}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          {t('empty.noTags')}
                        </span>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">{t('details.created')}</span>
                      <p className="font-medium">{formatDate(project.createdAt)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('details.updated')}</span>
                      <p className="font-medium">{formatDate(project.updatedAt)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('details.visibility')}</span>
                      <p className="font-medium">
                        {project.isPublic ? t('form.public') : t('form.private')}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('stats.submissions')}</span>
                      <p className="font-medium">{project._count.submissions}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 统计信息 */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('details.statistics')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <Heart className="h-6 w-6 mx-auto mb-2 text-red-500" />
                      <p className="text-2xl font-bold">{project._count.projectLikes}</p>
                      <p className="text-sm text-muted-foreground">{t('interactions.likes')}</p>
                    </div>
                    
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <MessageCircle className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                      <p className="text-2xl font-bold">{project._count.projectComments}</p>
                      <p className="text-sm text-muted-foreground">{t('interactions.comments')}</p>
                    </div>
                    
                    {project.averageScore && (
                      <div className="text-center p-4 bg-muted rounded-lg col-span-2">
                        <Star className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                        <p className="text-2xl font-bold">{project.averageScore.toFixed(1)}</p>
                        <p className="text-sm text-muted-foreground">{t('details.averageScore')}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 创建者信息 */}
            <Card>
              <CardHeader>
                <CardTitle>{t('details.creator')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={project.creator.avatarUrl} />
                    <AvatarFallback>
                      {project.creator.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{project.creator.username}</p>
                    <p className="text-sm text-muted-foreground">{project.creator.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 团队标签页 */}
          <TabsContent value="team">
            {project.team ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {project.team.name}
                  </CardTitle>
                  <CardDescription>{project.team.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      {t('team.members')}: {project.team.members.length} / {project.team.maxMembers}
                    </div>
                    
                    <div className="grid gap-3">
                      {project.team.members.map((member) => (
                        <div key={member.userId} className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.user.avatarUrl} />
                            <AvatarFallback>
                              {member.user.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium">{member.user.username}</p>
                            <p className="text-sm text-muted-foreground">{member.role}</p>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(member.joinedAt)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">{t('team.noTeam')}</h3>
                  <p className="text-muted-foreground">{t('team.individualProject')}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 提交历史标签页 */}
          <TabsContent value="submissions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {t('submissions.title')} ({project.submissions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {project.submissions.length > 0 ? (
                  <div className="space-y-4">
                    {project.submissions.map((submission) => (
                      <div key={submission.id} className="p-4 rounded-lg border">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <h4 className="font-medium">
                              <Link 
                                href={`/hackathons/${submission.hackathon.id}`}
                                className="hover:text-primary"
                              >
                                {submission.hackathon.title}
                              </Link>
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {submission.hackathon.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{t('submissions.submittedAt')}: {formatDate(submission.submittedAt)}</span>
                              <Badge variant={submission.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                {submission.hackathon.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">{t('submissions.empty')}</h3>
                    <p className="text-muted-foreground">{t('submissions.noSubmissions')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 评分标签页 */}
          <TabsContent value="scores">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  {t('scores.title')} ({project.scores.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {project.scores.length > 0 ? (
                  <div className="space-y-4">
                    {project.scores.map((score) => (
                      <div key={score.id} className="p-4 rounded-lg border">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={score.judge.user.avatarUrl} />
                              <AvatarFallback>
                                {score.judge.user.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{score.judge.user.username}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="font-bold">{score.totalScore}/10</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                          <div className="text-center p-2 bg-muted rounded">
                            <p className="font-medium">{score.innovation}</p>
                            <p className="text-xs text-muted-foreground">{t('scores.innovation')}</p>
                          </div>
                          <div className="text-center p-2 bg-muted rounded">
                            <p className="font-medium">{score.technicalComplexity}</p>
                            <p className="text-xs text-muted-foreground">{t('scores.technical')}</p>
                          </div>
                          <div className="text-center p-2 bg-muted rounded">
                            <p className="font-medium">{score.userExperience}</p>
                            <p className="text-xs text-muted-foreground">{t('scores.userExperience')}</p>
                          </div>
                          <div className="text-center p-2 bg-muted rounded">
                            <p className="font-medium">{score.businessPotential}</p>
                            <p className="text-xs text-muted-foreground">{t('scores.business')}</p>
                          </div>
                          <div className="text-center p-2 bg-muted rounded">
                            <p className="font-medium">{score.presentation}</p>
                            <p className="text-xs text-muted-foreground">{t('scores.presentation')}</p>
                          </div>
                        </div>
                        
                        <div className="mt-2 text-xs text-muted-foreground">
                          {formatDate(score.createdAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">{t('scores.empty')}</h3>
                    <p className="text-muted-foreground">{t('scores.noScores')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 活动标签页 */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>{t('activity.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* 这里可以显示项目的活动时间线 */}
                  <div className="text-center py-8">
                    <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">{t('activity.comingSoon')}</h3>
                    <p className="text-muted-foreground">{t('activity.description')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 评论标签页 */}
          <TabsContent value="comments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  {t('comments.title')} ({project._count.projectComments})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CommentSystem projectId={project.id} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
