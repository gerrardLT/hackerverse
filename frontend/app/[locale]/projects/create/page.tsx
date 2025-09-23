'use client'

import { useState, useCallback, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { apiService } from '@/lib/api'

// UI Components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'

// Icons
import { 
  ArrowLeft,
  Save,
  Send,
  Plus,
  X,
  Upload,
  Link as LinkIcon,
  Github,
  Globe,
  Video,
  FileText,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

// Types
interface ProjectFormData {
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
  hackathonId?: string
}

interface FormErrors {
  title?: string
  description?: string
  technologies?: string
  tags?: string
  githubUrl?: string
  demoUrl?: string
  videoUrl?: string
  presentationUrl?: string
}

export default function CreateProjectPage() {
  const t = useTranslations('projects')
  const tCommon = useTranslations('common')
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState<ProjectFormData>({
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
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Input states for technologies and tags
  const [techInput, setTechInput] = useState('')
  const [tagInput, setTagInput] = useState('')
  
  // Preview state
  const [showPreview, setShowPreview] = useState(false)
  
  // Save confirmation dialog
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [saveAction, setSaveAction] = useState<'draft' | 'ready'>('draft')

  // Pure validation check (no state updates)
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

  // Validation with error state updates
  const validateForm = useCallback(() => {
    const newErrors: FormErrors = {}
    
    if (!formData.title.trim()) {
      newErrors.title = t('validation.titleRequired')
    } else if (formData.title.length > 100) {
      newErrors.title = t('validation.titleTooLong')
    }
    
    if (formData.description && formData.description.length > 2000) {
      newErrors.description = t('validation.descriptionTooLong')
    }
    
    // URL validation
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


  // Handle form submission
  const handleSubmit = async (status: 'DRAFT' | 'READY_TO_SUBMIT') => {
    if (!validateForm()) {
      toast({
        title: t('validation.error'),
        description: t('validation.fixErrors'),
        variant: 'destructive'
      })
      return
    }

    try {
      setIsLoading(true)
      
      const submitData = {
        ...formData,
        status,
        technologies: formData.technologies.filter(Boolean),
        tags: formData.tags.filter(Boolean)
      }

      const response = await apiService.post('/projects/create', submitData)

      if (response.success) {
        toast({
          title: t('success.created'),
          description: status === 'DRAFT' 
            ? t('success.savedAsDraft')
            : t('success.readyToSubmit')
        })
        
        router.push('/projects')
      } else {
        throw new Error(response.error || 'Failed to create project')
      }
    } catch (err) {
      console.error('Create project error:', err)
      toast({
        title: t('errors.createFailed'),
        description: err instanceof Error ? err.message : t('errors.unknown'),
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-save as draft
  const autoSaveDraft = useCallback(async () => {
    if (!formData.title.trim() || isSaving) return

    try {
      setIsSaving(true)
      
      // Only auto-save if we have a title (minimum requirement)
      const draftData = {
        ...formData,
        status: 'DRAFT' as const,
        technologies: formData.technologies.filter(Boolean),
        tags: formData.tags.filter(Boolean)
      }

      await apiService.post('/projects/create', draftData)

    } catch (err) {
      // Silent fail for auto-save
      console.warn('Auto-save failed:', err)
    } finally {
      setIsSaving(false)
    }
  }, [formData, isSaving])

  // Handle technology input
  const handleTechKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && techInput.trim()) {
      e.preventDefault()
      if (!formData.technologies.includes(techInput.trim())) {
        setFormData(prev => ({
          ...prev,
          technologies: [...prev.technologies, techInput.trim()]
        }))
      }
      setTechInput('')
    }
  }

  // Handle tag input
  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim()]
        }))
      }
      setTagInput('')
    }
  }

  // Remove technology
  const removeTechnology = (tech: string) => {
    setFormData(prev => ({
      ...prev,
      technologies: prev.technologies.filter(t => t !== tech)
    }))
  }

  // Remove tag
  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  // Calculate completion percentage (must be at top level)
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

  // Loading state
  if (authLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
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
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/projects">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {tCommon('back')}
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('create.title')}</h1>
            <p className="text-muted-foreground">{t('create.description')}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isSaving && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
              {t('create.autoSaving')}
            </div>
          )}
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showPreview ? t('create.hidePreview') : t('create.showPreview')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form */}
        <div className={`${showPreview ? 'lg:col-span-8' : 'lg:col-span-8 lg:col-start-3'}`}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('create.projectDetails')}</CardTitle>
                  <CardDescription>{t('create.fillDetails')}</CardDescription>
                </div>
                <div className="text-sm text-muted-foreground">
                  {t('create.completion')}: {completionPercentage}%
                  <Progress value={completionPercentage} className="w-24 mt-1" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t('create.basicInfo')}</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="title">{t('form.title')} *</Label>
                  <Input
                    id="title"
                    placeholder={t('form.titlePlaceholder')}
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className={errors.title ? 'border-red-300' : ''}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600">{errors.title}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t('form.description')}</Label>
                  <Textarea
                    id="description"
                    placeholder={t('form.descriptionPlaceholder')}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className={`min-h-[120px] ${errors.description ? 'border-red-300' : ''}`}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600">{errors.description}</p>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {formData.description.length}/2000 {t('form.characters')}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Technologies */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t('create.techStack')}</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="technologies">{t('form.technologies')}</Label>
                  <Input
                    id="technologies"
                    placeholder={t('form.technologiesPlaceholder')}
                    value={techInput}
                    onChange={(e) => setTechInput(e.target.value)}
                    onKeyPress={handleTechKeyPress}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('form.pressEnterToAdd')}
                  </p>
                  {formData.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.technologies.map((tech, idx) => (
                        <Badge key={idx} variant="secondary" className="gap-1">
                          {tech}
                          <button
                            type="button"
                            onClick={() => removeTechnology(tech)}
                            className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">{t('form.tags')}</Label>
                  <Input
                    id="tags"
                    placeholder={t('form.tagsPlaceholder')}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleTagKeyPress}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('form.pressEnterToAdd')}
                  </p>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags.map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="gap-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Links */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t('create.links')}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="githubUrl" className="flex items-center gap-2">
                      <Github className="w-4 h-4" />
                      {t('form.githubUrl')}
                    </Label>
                    <Input
                      id="githubUrl"
                      placeholder={t('form.githubUrlPlaceholder')}
                      value={formData.githubUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, githubUrl: e.target.value }))}
                      className={errors.githubUrl ? 'border-red-300' : ''}
                    />
                    {errors.githubUrl && (
                      <p className="text-sm text-red-600">{errors.githubUrl}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="demoUrl" className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      {t('form.demoUrl')}
                    </Label>
                    <Input
                      id="demoUrl"
                      placeholder={t('form.demoUrlPlaceholder')}
                      value={formData.demoUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, demoUrl: e.target.value }))}
                      className={errors.demoUrl ? 'border-red-300' : ''}
                    />
                    {errors.demoUrl && (
                      <p className="text-sm text-red-600">{errors.demoUrl}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="videoUrl" className="flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      {t('form.videoUrl')}
                    </Label>
                    <Input
                      id="videoUrl"
                      placeholder={t('form.videoUrlPlaceholder')}
                      value={formData.videoUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                      className={errors.videoUrl ? 'border-red-300' : ''}
                    />
                    {errors.videoUrl && (
                      <p className="text-sm text-red-600">{errors.videoUrl}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="presentationUrl" className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {t('form.presentationUrl')}
                    </Label>
                    <Input
                      id="presentationUrl"
                      placeholder={t('form.presentationUrlPlaceholder')}
                      value={formData.presentationUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, presentationUrl: e.target.value }))}
                      className={errors.presentationUrl ? 'border-red-300' : ''}
                    />
                    {errors.presentationUrl && (
                      <p className="text-sm text-red-600">{errors.presentationUrl}</p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t('create.settings')}</h3>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="isPublic">{t('form.isPublic')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('form.isPublicDescription')}
                    </p>
                  </div>
                  <Switch
                    id="isPublic"
                    checked={formData.isPublic}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button
                  variant="outline"
                  onClick={() => handleSubmit('DRAFT')}
                  disabled={isLoading || !formData.title.trim()}
                  className="flex-1"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? t('create.saving') : t('create.saveAsDraft')}
                </Button>
                <Button
                  onClick={() => handleSubmit('READY_TO_SUBMIT')}
                  disabled={isLoading || !isFormValid()}
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {isLoading ? t('create.saving') : t('create.markAsReady')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div className="lg:col-span-4">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">{t('create.preview')}</CardTitle>
                <CardDescription>{t('create.previewDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.title ? (
                  <>
                    <div>
                      <h3 className="font-semibold text-lg">{formData.title}</h3>
                      <Badge variant="outline" className="mt-1">
                        {formData.status === 'DRAFT' ? t('status.draft') : t('status.ready_to_submit')}
                      </Badge>
                    </div>
                    
                    {formData.description && (
                      <p className="text-sm text-muted-foreground line-clamp-4">
                        {formData.description}
                      </p>
                    )}
                    
                    {formData.technologies.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">{t('form.technologies')}</p>
                        <div className="flex flex-wrap gap-1">
                          {formData.technologies.map((tech, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {formData.tags.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">{t('form.tags')}</p>
                        <div className="flex flex-wrap gap-1">
                          {formData.tags.map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 text-sm">
                      {formData.githubUrl && (
                        <div className="flex items-center gap-2">
                          <Github className="w-3 h-3" />
                          <span className="text-muted-foreground truncate">{formData.githubUrl}</span>
                        </div>
                      )}
                      {formData.demoUrl && (
                        <div className="flex items-center gap-2">
                          <Globe className="w-3 h-3" />
                          <span className="text-muted-foreground truncate">{formData.demoUrl}</span>
                        </div>
                      )}
                      {formData.videoUrl && (
                        <div className="flex items-center gap-2">
                          <Video className="w-3 h-3" />
                          <span className="text-muted-foreground truncate">{formData.videoUrl}</span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                    <p>{t('create.previewEmpty')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
