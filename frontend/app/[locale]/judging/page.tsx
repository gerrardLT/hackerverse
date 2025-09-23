'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/components/ui/use-toast'
import { apiService } from '@/lib/api'
import { 
  CalendarDays, 
  Trophy, 
  Users, 
  FileText, 
  Star, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Eye,
  ExternalLink
} from 'lucide-react'

interface JudgeAssignment {
  id: string
  hackathon: {
    id: string
    title: string
    status: string
    startDate: string
    endDate: string
  }
  judge: {
    id: string
    username: string
    avatarUrl?: string
  }
  role: string
  expertise: string[]
  assignedProjects: Array<{
    id: string
    title: string
    description: string
    status: string
    submittedAt: string
    team?: {
      name: string
      members: Array<{
        user: {
          username: string
          avatarUrl?: string
        }
      }>
    }
  }>
  scoringProgress: {
    total: number
    completed: number
    pending: number
    completionRate: number
  }
}

interface ScoringCriteria {
  id: string
  criteriaName: string
  description?: string
  weight: number
  maxScore: number
  minScore: number
  isRequired: boolean
  helpText?: string
}

export default function JudgingPage() {
  const { user } = useAuth()
  const t = useTranslations('judging')
  const tCommon = useTranslations('common')
  const { toast } = useToast()

  const [assignments, setAssignments] = useState<JudgeAssignment[]>([])
  const [selectedHackathon, setSelectedHackathon] = useState<string>('')
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [criteria, setCriteria] = useState<ScoringCriteria[]>([])
  const [scores, setScores] = useState<Record<string, number>>({})
  const [comments, setComments] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [isDraft, setIsDraft] = useState(false)

  useEffect(() => {
    loadAssignments()
  }, [])

  useEffect(() => {
    if (selectedHackathon) {
      loadCriteria(selectedHackathon)
    }
  }, [selectedHackathon])

  const loadAssignments = async () => {
    try {
      setLoading(true)
      const response = await apiService.request('/judging/assignments')
      if (response.success) {
        setAssignments(response.data.assignments)
        if (response.data.assignments.length > 0) {
          setSelectedHackathon(response.data.assignments[0].hackathon.id)
        }
      } else {
        toast({
          variant: 'destructive',
          title: t('assignments.loadError'),
          description: response.error
        })
      }
    } catch (error) {
      console.error('加载评委分配失败:', error)
      toast({
        variant: 'destructive',
        title: t('assignments.loadError'),
        description: tCommon('errors.networkError')
      })
    } finally {
      setLoading(false)
    }
  }

  const loadCriteria = async (hackathonId: string) => {
    try {
      const response = await apiService.request(`/judging/criteria/${hackathonId}`)
      if (response.success) {
        setCriteria(response.data.criteria)
      }
    } catch (error) {
      console.error('加载评分标准失败:', error)
    }
  }

  const handleProjectSelect = async (project: any) => {
    setSelectedProject(project)
    setScores({})
    setComments('')
    
    // 加载已有评分（如果存在）
    try {
      const response = await apiService.request('/judging/scores', {
        method: 'GET',
        params: { projectId: project.id, judgeId: user?.id }
      })
      if (response.success && response.data.score) {
        const existingScore = response.data.score
        setScores({
          innovation: existingScore.innovation || 0,
          technicalComplexity: existingScore.technicalComplexity || 0,
          userExperience: existingScore.userExperience || 0,
          businessPotential: existingScore.businessPotential || 0,
          presentation: existingScore.presentation || 0
        })
        setComments(existingScore.comments || '')
      }
    } catch (error) {
      console.error('加载现有评分失败:', error)
    }
  }

  const handleScoreChange = (criteriaName: string, value: number) => {
    setScores(prev => ({
      ...prev,
      [criteriaName.toLowerCase().replace(/\s+/g, '')]: value
    }))
  }

  const calculateTotalScore = () => {
    const scoreValues = Object.values(scores).filter(score => score > 0)
    if (scoreValues.length === 0) return 0
    return Number((scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length).toFixed(1))
  }

  const handleSubmitScore = async (draft = false) => {
    if (!selectedProject || !selectedHackathon) return

    // 验证必填评分项
    const requiredCriteria = criteria.filter(c => c.isRequired)
    for (const criterion of requiredCriteria) {
      const fieldName = criterion.criteriaName.toLowerCase().replace(/\s+/g, '')
      if (!scores[fieldName] || scores[fieldName] === 0) {
        toast({
          variant: 'destructive',
          title: t('score.missingRequired'),
          description: t('score.missingRequiredDesc', { criterion: criterion.criteriaName })
        })
        return
      }
    }

    try {
      setSubmitting(true)
      const response = await apiService.request('/judging/score', {
        method: 'POST',
        body: JSON.stringify({
          projectId: selectedProject.id,
          hackathonId: selectedHackathon,
          scores,
          comments,
          isDraft: draft
        })
      })

      if (response.success) {
        toast({
          title: draft ? t('score.draftSaved') : t('score.submitted'),
          description: response.message
        })
        
        // 重新加载分配信息以更新进度
        await loadAssignments()
        
        // 如果是正式提交，清空表单
        if (!draft) {
          setSelectedProject(null)
          setScores({})
          setComments('')
        }
      } else {
        toast({
          variant: 'destructive',
          title: t('score.submitError'),
          description: response.error
        })
      }
    } catch (error) {
      console.error('提交评分失败:', error)
      toast({
        variant: 'destructive',
        title: t('score.submitError'),
        description: tCommon('errors.networkError')
      })
    } finally {
      setSubmitting(false)
    }
  }

  const selectedAssignment = assignments.find(a => a.hackathon.id === selectedHackathon)

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (!user || !['ADMIN', 'MODERATOR', 'JUDGE'].includes(user.role)) {
    return (
      <div className="container mx-auto py-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('unauthorized')}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (assignments.length === 0) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('assignments.title')}</CardTitle>
            <CardDescription>{t('assignments.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">{t('assignments.noAssignments')}</p>
              <p className="text-muted-foreground">{t('assignments.noAssignmentsDesc')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      {/* 黑客松选择 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5" />
            <span>{t('hackathonSelection')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedHackathon} onValueChange={setSelectedHackathon}>
            <SelectTrigger>
              <SelectValue placeholder={t('selectHackathon')} />
            </SelectTrigger>
            <SelectContent>
              {assignments.map(assignment => (
                <SelectItem key={assignment.hackathon.id} value={assignment.hackathon.id}>
                  <div className="flex items-center space-x-2">
                    <span>{assignment.hackathon.title}</span>
                    <Badge variant={assignment.hackathon.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {assignment.hackathon.status}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedAssignment && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：项目列表和进度 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 评分进度 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>{t('progress.title')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t('progress.completed')}</span>
                    <span>{selectedAssignment.scoringProgress.completed}/{selectedAssignment.scoringProgress.total}</span>
                  </div>
                  <Progress value={selectedAssignment.scoringProgress.completionRate} />
                  <p className="text-xs text-muted-foreground">
                    {selectedAssignment.scoringProgress.completionRate}% {t('progress.complete')}
                  </p>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">{t('progress.pending')}</p>
                    <p className="font-medium">{selectedAssignment.scoringProgress.pending}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('progress.total')}</p>
                    <p className="font-medium">{selectedAssignment.scoringProgress.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 分配的项目列表 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>{t('projects.assigned')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedAssignment.assignedProjects.map(project => (
                  <div
                    key={project.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedProject?.id === project.id
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleProjectSelect(project)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium line-clamp-1">{project.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {project.description}
                        </p>
                        {project.team && (
                          <div className="flex items-center space-x-2 mt-2">
                            <Users className="h-3 w-3" />
                            <span className="text-xs text-muted-foreground">
                              {project.team.name}
                            </span>
                          </div>
                        )}
                      </div>
                      <Badge
                        variant={project.status === 'REVIEWED' ? 'default' : 'secondary'}
                        className="ml-2"
                      >
                        {project.status === 'REVIEWED' ? t('status.scored') : t('status.pending')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* 右侧：评分表单 */}
          <div className="lg:col-span-2">
            {selectedProject ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedProject.title}</CardTitle>
                      <CardDescription>{t('score.rateProject')}</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      {selectedProject.demoUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={selectedProject.demoUrl} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4 mr-1" />
                            {t('viewDemo')}
                          </a>
                        </Button>
                      )}
                      {selectedProject.githubUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={selectedProject.githubUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            {t('viewCode')}
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-2">{t('project.description')}</h4>
                    <p className="text-muted-foreground">{selectedProject.description}</p>
                  </div>

                  <Separator />

                  {/* 评分标准 */}
                  <div className="space-y-4">
                    <h4 className="font-medium">{t('criteria.title')}</h4>
                    {criteria.map(criterion => {
                      const fieldName = criterion.criteriaName.toLowerCase().replace(/\s+/g, '')
                      return (
                        <div key={criterion.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="flex items-center space-x-2">
                              <span>{criterion.criteriaName}</span>
                              {criterion.isRequired && <span className="text-red-500">*</span>}
                            </Label>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-muted-foreground">
                                {criterion.minScore}-{criterion.maxScore}
                              </span>
                              <Badge variant="outline">{criterion.weight}%</Badge>
                            </div>
                          </div>
                          
                          {criterion.description && (
                            <p className="text-sm text-muted-foreground">{criterion.description}</p>
                          )}
                          
                          <div className="flex items-center space-x-4">
                            <div className="flex space-x-1">
                              {Array.from({ length: criterion.maxScore }, (_, i) => i + 1).map(value => (
                                <Button
                                  key={value}
                                  variant={scores[fieldName] === value ? 'default' : 'outline'}
                                  size="sm"
                                  className="w-8 h-8 p-0"
                                  onClick={() => handleScoreChange(criterion.criteriaName, value)}
                                >
                                  {value}
                                </Button>
                              ))}
                            </div>
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span className="font-medium">
                                {scores[fieldName] || 0}/{criterion.maxScore}
                              </span>
                            </div>
                          </div>
                          
                          {criterion.helpText && (
                            <p className="text-xs text-muted-foreground italic">
                              {criterion.helpText}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <Separator />

                  {/* 总分显示 */}
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <span className="font-medium">{t('score.total')}</span>
                    <div className="flex items-center space-x-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      <span className="text-xl font-bold">{calculateTotalScore()}/10</span>
                    </div>
                  </div>

                  {/* 评论 */}
                  <div className="space-y-2">
                    <Label htmlFor="comments">{t('score.comments')}</Label>
                    <Textarea
                      id="comments"
                      placeholder={t('score.commentsPlaceholder')}
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      rows={4}
                    />
                  </div>

                  {/* 提交按钮 */}
                  <div className="flex items-center space-x-4">
                    <Button
                      onClick={() => handleSubmitScore(true)}
                      variant="outline"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {t('score.saving')}
                        </>
                      ) : (
                        t('score.saveDraft')
                      )}
                    </Button>
                    <Button
                      onClick={() => handleSubmitScore(false)}
                      disabled={submitting || calculateTotalScore() === 0}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {t('score.submitting')}
                        </>
                      ) : (
                        t('score.submit')
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-16">
                  <div className="text-center">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">{t('selectProject')}</h3>
                    <p className="text-muted-foreground">{t('selectProjectDesc')}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
