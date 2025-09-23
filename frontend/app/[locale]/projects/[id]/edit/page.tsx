'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/use-auth'
import { apiService } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loading } from '@/components/ui/loading'
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  EyeOff, 
  Plus, 
  X, 
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'

interface FormData {
  title: string
  description: string
  technologies: string[]
  tags: string[]
  githubUrl: string
  demoUrl: string
  videoUrl: string
  presentationUrl: string
  isPublic: boolean
  status: 'DRAFT' | 'READY_TO_SUBMIT'
}

interface FormErrors {
  title?: string
  description?: string
  githubUrl?: string
  demoUrl?: string
  videoUrl?: string
  presentationUrl?: string
}

export default function EditProjectPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('projects')
  const { user, loading: authLoading } = useAuth()

  const projectId = params.id as string

  // 状态管理
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    technologies: [],
    tags: [],
    githubUrl: '',
    demoUrl: '',
    videoUrl: '',
    presentationUrl: '',
    isPublic: true,
    status: 'DRAFT'
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [newTechnology, setNewTechnology] = useState('')
  const [newTag, setNewTag] = useState('')

  // 获取项目详情
  const fetchProject = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiService.get(`/projects/${projectId}`)
      
      if (response.success) {
        const projectData = response.data
        setProject(projectData)
        
        // 预填充表单
        setFormData({
          title: projectData.title || '',
          description: projectData.description || '',
          technologies: projectData.technologies || [],
          tags: projectData.tags || [],
          githubUrl: projectData.githubUrl || '',
          demoUrl: projectData.demoUrl || '',
          videoUrl: projectData.videoUrl || '',
          presentationUrl: projectData.presentationUrl || '',
          isPublic: projectData.isPublic,
          status: projectData.status
        })
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

  // 表单验证（纯函数，不修改状态）
  const isFormValid = useCallback(() => {
    if (!formData.title.trim()) return false
    if (formData.title.length > 100) return false
    if (formData.description && formData.description.length > 2000) return false
    
    const urlRegex = /^https?:\/\/[^\s]+$/
    
    if (formData.githubUrl && !urlRegex.test(formData.githubUrl)) return false
    if (formData.demoUrl && !urlRegex.test(formData.demoUrl)) return false
    if (formData.videoUrl && !urlRegex.test(formData.videoUrl)) return false
    if (formData.presentationUrl && !urlRegex.test(formData.presentationUrl)) return false
    
    return true
  }, [formData])

  // 验证并设置错误状态（用于提交时）
  const validateAndSetErrors = useCallback(() => {
    const newErrors: FormErrors = {}
    
    if (!formData.title.trim()) {
      newErrors.title = t('validation.titleRequired')
    } else if (formData.title.length > 100) {
      newErrors.title = t('validation.titleTooLong')
    }
    
    if (formData.description && formData.description.length > 2000) {
      newErrors.description = t('validation.descriptionTooLong')
    }
    
    const urlRegex = /^https?:\/\/[^\s]+$/
    
    if (formData.githubUrl && !urlRegex.test(formData.githubUrl)) {
      newErrors.githubUrl = t('validation.invalidUrl')
    }
    
    if (formData.demoUrl && !urlRegex.test(formData.demoUrl)) {
      newErrors.demoUrl = t('validation.invalidUrl')
    }
    
    if (formData.videoUrl && !urlRegex.test(formData.videoUrl)) {
      newErrors.videoUrl = t('validation.invalidUrl')
    }
    
    if (formData.presentationUrl && !urlRegex.test(formData.presentationUrl)) {
      newErrors.presentationUrl = t('validation.invalidUrl')
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData, t])

  // 计算完成度
  const completionPercentage = useMemo(() => {
    let completed = 0
    const fields = [
      formData.title,
      formData.description,
      formData.technologies.length > 0,
      formData.tags.length > 0,
      formData.githubUrl,
      formData.demoUrl,
      formData.videoUrl,
      formData.presentationUrl
    ]
    
    completed = fields.filter(Boolean).length
    return Math.round((completed / fields.length) * 100)
  }, [formData])

  // 处理保存
  const handleSave = async () => {
    if (!validateAndSetErrors()) {
      return
    }

    try {
      setIsSaving(true)
      setError(null)
      setSuccessMessage(null)

      const response = await apiService.put(`/projects/${projectId}`, formData)

      if (response.success) {
        setSuccessMessage(t('success.projectUpdated'))
        // 刷新项目数据
        await fetchProject()
      } else {
        setError(response.error || t('errors.updateProject'))
      }
    } catch (err: any) {
      console.error('Error updating project:', err)
      setError(err.message || t('errors.updateProject'))
    } finally {
      setIsSaving(false)
    }
  }

  // 添加技术
  const addTechnology = () => {
    if (newTechnology.trim() && !formData.technologies.includes(newTechnology.trim())) {
      setFormData(prev => ({
        ...prev,
        technologies: [...prev.technologies, newTechnology.trim()]
      }))
      setNewTechnology('')
    }
  }

  // 移除技术
  const removeTechnology = (tech: string) => {
    setFormData(prev => ({
      ...prev,
      technologies: prev.technologies.filter(t => t !== tech)
    }))
  }

  // 添加标签
  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  // 移除标签
  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  useEffect(() => {
    if (!authLoading && user) {
      fetchProject()
    }
  }, [projectId, authLoading, user])

  // 自动清除成功消息
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  // 加载状态
  if (authLoading || loading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <Loading className="h-12 w-12" />
          <p className="mt-4 text-center text-muted-foreground">
            {t('loading.project')}
          </p>
        </div>
      </div>
    )
  }

  // 权限检查
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

  // 错误状态
  if (error && !project) {
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

  // 权限检查
  if (project && project.creatorId !== user.id) {
    return (
      <div className="container mx-auto py-6 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">{t('errors.accessDenied')}</h1>
        <Button 
          variant="outline" 
          onClick={() => router.push(`/projects/${projectId}`)}
        >
          {t('actions.viewProject')}
        </Button>
      </div>
    )
  }

  // 状态检查
  if (project && !['DRAFT', 'READY_TO_SUBMIT'].includes(project.status)) {
    return (
      <div className="container mx-auto py-6 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">{t('errors.cannotEditSubmitted')}</h1>
        <Button 
          variant="outline" 
          onClick={() => router.push(`/projects/${projectId}`)}
        >
          {t('actions.viewProject')}
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 头部 */}
        <div className="flex flex-col space-y-4">
          {/* 导航 */}
          <div className="flex items-center text-sm text-muted-foreground">
            <Link href="/projects" className="hover:text-primary">
              {t('title')}
            </Link>
            <span className="mx-2">/</span>
            <Link href={`/projects/${projectId}`} className="hover:text-primary">
              {project?.title}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{t('actions.edit')}</span>
          </div>

          {/* 标题和操作 */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{t('edit.title')}</h1>
              <p className="text-muted-foreground">{t('edit.description')}</p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    {t('create.hidePreview')}
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    {t('create.showPreview')}
                  </>
                )}
              </Button>

              <Button
                onClick={handleSave}
                disabled={isSaving || !isFormValid()}
                className="flex-1 sm:flex-none"
              >
                {isSaving ? (
                  <>
                    <Loading className="h-4 w-4 mr-2" />
                    {t('create.saving')}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {t('actions.save')}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* 状态消息 */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* 主要内容 */}
        <div className={`grid gap-6 ${showPreview ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
          {/* 表单 */}
          <div className="space-y-6">
            {/* 基础信息 */}
            <Card>
              <CardHeader>
                <CardTitle>{t('create.basicInfo')}</CardTitle>
                <CardDescription>{t('create.fillDetails')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 项目标题 */}
                <div className="space-y-2">
                  <Label htmlFor="title">{t('form.title')}</Label>
                  <Input
                    id="title"
                    placeholder={t('form.titlePlaceholder')}
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500">{errors.title}</p>
                  )}
                </div>

                {/* 项目描述 */}
                <div className="space-y-2">
                  <Label htmlFor="description">{t('form.description')}</Label>
                  <Textarea
                    id="description"
                    placeholder={t('form.descriptionPlaceholder')}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className={errors.description ? 'border-red-500' : ''}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500">{errors.description}</p>
                  )}
                </div>

                {/* 可见性设置 */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('form.visibility')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {formData.isPublic ? t('form.publicDescription') : t('form.privateDescription')}
                    </p>
                  </div>
                  <Switch
                    checked={formData.isPublic}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
                  />
                </div>

                {/* 项目状态 */}
                <div className="space-y-2">
                  <Label>{t('form.status')}</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={formData.status === 'DRAFT' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, status: 'DRAFT' }))}
                    >
                      {t('stats.draft')}
                    </Button>
                    <Button
                      type="button"
                      variant={formData.status === 'READY_TO_SUBMIT' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, status: 'READY_TO_SUBMIT' }))}
                    >
                      {t('stats.readyToSubmit')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 技术栈 */}
            <Card>
              <CardHeader>
                <CardTitle>{t('create.techStack')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder={t('form.technologiesPlaceholder')}
                    value={newTechnology}
                    onChange={(e) => setNewTechnology(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTechnology()}
                  />
                  <Button type="button" onClick={addTechnology} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.technologies.map((tech, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tech}
                      <button
                        type="button"
                        onClick={() => removeTechnology(tech)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 标签 */}
            <Card>
              <CardHeader>
                <CardTitle>{t('form.tags')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder={t('form.tagsPlaceholder')}
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button type="button" onClick={addTag} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 项目链接 */}
            <Card>
              <CardHeader>
                <CardTitle>{t('create.links')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="githubUrl">{t('form.githubUrl')}</Label>
                  <Input
                    id="githubUrl"
                    type="url"
                    placeholder={t('form.githubUrlPlaceholder')}
                    value={formData.githubUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, githubUrl: e.target.value }))}
                    className={errors.githubUrl ? 'border-red-500' : ''}
                  />
                  {errors.githubUrl && (
                    <p className="text-sm text-red-500">{errors.githubUrl}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="demoUrl">{t('form.demoUrl')}</Label>
                  <Input
                    id="demoUrl"
                    type="url"
                    placeholder={t('form.demoUrlPlaceholder')}
                    value={formData.demoUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, demoUrl: e.target.value }))}
                    className={errors.demoUrl ? 'border-red-500' : ''}
                  />
                  {errors.demoUrl && (
                    <p className="text-sm text-red-500">{errors.demoUrl}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="videoUrl">{t('form.videoUrl')}</Label>
                  <Input
                    id="videoUrl"
                    type="url"
                    placeholder={t('form.videoUrlPlaceholder')}
                    value={formData.videoUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                    className={errors.videoUrl ? 'border-red-500' : ''}
                  />
                  {errors.videoUrl && (
                    <p className="text-sm text-red-500">{errors.videoUrl}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="presentationUrl">{t('form.presentationUrl')}</Label>
                  <Input
                    id="presentationUrl"
                    type="url"
                    placeholder={t('form.presentationUrlPlaceholder')}
                    value={formData.presentationUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, presentationUrl: e.target.value }))}
                    className={errors.presentationUrl ? 'border-red-500' : ''}
                  />
                  {errors.presentationUrl && (
                    <p className="text-sm text-red-500">{errors.presentationUrl}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 预览面板 */}
          {showPreview && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('create.preview')}</CardTitle>
                  <CardDescription>{t('create.previewDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                  {formData.title ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-bold">{formData.title}</h3>
                        {formData.description && (
                          <p className="text-muted-foreground mt-2">{formData.description}</p>
                        )}
                      </div>

                      {formData.technologies.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">{t('form.technologies')}</h4>
                          <div className="flex flex-wrap gap-1">
                            {formData.technologies.map((tech, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tech}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {formData.tags.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">{t('form.tags')}</h4>
                          <div className="flex flex-wrap gap-1">
                            {formData.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-sm text-muted-foreground">
                        <p>{t('create.completion')}: {completionPercentage}%</p>
                        <p>{t('form.visibility')}: {formData.isPublic ? t('form.public') : t('form.private')}</p>
                        <p>{t('form.status')}: {formData.status === 'DRAFT' ? t('stats.draft') : t('stats.readyToSubmit')}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">{t('create.previewEmpty')}</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
