'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Users, Plus, X, ArrowLeft, Eye } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { apiService } from '@/lib/api'

interface TeamFormData {
  name: string
  description: string
  hackathonId: string
  maxMembers: number
  skills: string[]
  tags: string[]
  isPublic: boolean
}

const techStackOptions = [
  'React', 'VueJS', 'Angular', 'NodeJS', 'Python', 'Java', 'Go', 'Rust',
  'Solidity', 'Web3.js', 'Ethers.js', 'Hardhat', 'Truffle', 'IPFS',
  'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS',
  'TypeScript', 'JavaScript', 'HTML/CSS', 'Tailwind CSS', 'Next.js'
]

const roleOptions = [
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Blockchain Developer', 'UI/UX Designer',
  'Product Manager', 'Data Scientist', 'Machine Learning Engineer', 'Mobile Developer', 'DevOps Engineer',
  'Test Engineer', 'Technical Writer', 'Marketing', 'Business Development'
]

export default function CreateTeamPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const t = useTranslations('teams.create')
  const tCommon = useTranslations('common')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hackathons, setHackathons] = useState<Array<{id: string, title: string, endDate: string}>>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [formData, setFormData] = useState<TeamFormData>({
    name: '',
    description: '',
    hackathonId: '',
    maxMembers: 5,
    skills: [],
    tags: [],
    isPublic: true
  })

  const [newTech, setNewTech] = useState('')
  const [newRole, setNewRole] = useState('')
  
  // 校验错误状态
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({})
  
  // 实时校验函数
  const validateField = (field: keyof TeamFormData, value: any) => {
    const errors = { ...validationErrors }
    
    switch (field) {
      case 'name':
        if (!value) {
          errors.name = t('form.teamNameRequired')
        } else if (value.length < 2) {
          errors.name = t('form.teamNameMinLength')
        } else if (value.length > 50) {
          errors.name = t('validation.nameMaxLength')
        } else {
          delete errors.name
        }
        break
        
      case 'description':
        if (!value) {
          errors.description = t('form.descriptionRequired')
        } else if (value.length < 10) {
          errors.description = t('form.descriptionMinLength')
        } else if (value.length > 500) {
          errors.description = t('validation.descMaxLength')
        } else {
          delete errors.description
        }
        break
        
      case 'hackathonId':
        if (!value) {
          errors.hackathonId = t('form.hackathonRequired')
        } else {
          delete errors.hackathonId
        }
        break
        
      case 'skills':
        if (!Array.isArray(value) || value.length === 0) {
          errors.skills = t('form.skillsRequired')
        } else if (value.length > 10) {
          errors.skills = t('form.skillsMaxLimit')
        } else {
          delete errors.skills
        }
        break
        
      case 'tags':
        if (Array.isArray(value) && value.length > 5) {
          errors.tags = t('validation.tagsMaxCount')
        } else {
          delete errors.tags
        }
        break
        
      case 'maxMembers':
        if (value < 2) {
          errors.maxMembers = t('validation.minMembers')
        } else if (value > 10) {
          errors.maxMembers = t('validation.maxMembersLimit')
        } else {
          delete errors.maxMembers
        }
        break
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // 获取可用的黑客松列表
  useEffect(() => {
    const fetchHackathons = async () => {
      try {
        const response = await apiService.getHackathons({ 
          limit: 100,
          status: 'upcoming,ongoing' // 只获取即将开始和进行中的黑客松
        })
        
        if (response.success && response.data) {
          setHackathons(response.data.hackathons.map(h => ({
            id: h.id,
            title: h.title,
            endDate: h.endDate
          })))
        }
      } catch (error) {
        console.error('Failed to get hackathon list:', error)
        toast({
          title: t('loading.loadFailed'),
          description: t('loading.noHackathons'),
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchHackathons()
    }
  }, [user, toast])

  const handleInputChange = (field: keyof TeamFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // 实时校验
    validateField(field, value)
  }

  const addSkill = (skill: string) => {
    if (skill && !formData.skills.includes(skill)) {
      const newSkills = [...formData.skills, skill]
      setFormData(prev => ({
        ...prev,
        skills: newSkills
      }))
      validateField('skills', newSkills)
    }
    setNewTech('')
  }

  const removeSkill = (skill: string) => {
    const newSkills = formData.skills.filter(s => s !== skill)
    setFormData(prev => ({
      ...prev,
      skills: newSkills
    }))
    validateField('skills', newSkills)
  }

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      const newTags = [...formData.tags, tag]
      setFormData(prev => ({
        ...prev,
        tags: newTags
      }))
      validateField('tags', newTags)
    }
    setNewRole('')
  }

  const removeTag = (tag: string) => {
    const newTags = formData.tags.filter(t => t !== tag)
    setFormData(prev => ({
      ...prev,
      tags: newTags
    }))
    validateField('tags', newTags)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 执行所有字段的校验
    const isNameValid = validateField('name', formData.name)
    const isDescriptionValid = validateField('description', formData.description)
    const isHackathonValid = validateField('hackathonId', formData.hackathonId)
    const isSkillsValid = validateField('skills', formData.skills)
    const isTagsValid = validateField('tags', formData.tags)
    const isMembersValid = validateField('maxMembers', formData.maxMembers)
    
    // 如果有任何校验失败，不提交表单
    if (!isNameValid || !isDescriptionValid || !isHackathonValid || 
        !isSkillsValid || !isTagsValid || !isMembersValid) {
      toast({
        title: t('validation.formValidationFailed'),
        description: t('validation.checkFields'),
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      const response = await apiService.createTeam(formData)
      
      if (response.success) {
        toast({
          title: t('success.teamCreated'),
          description: t('success.teamCreatedDesc')
        })
        
        router.push('/teams')
      } else {
        throw new Error(response.error || t('validation.createFailed'))
      }
    } catch (error) {
      console.error(t('validation.createTeamError'), error)
      toast({
        title: t('validation.createFailed'),
        description: error instanceof Error ? error.message : t('validation.createError'),
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedHackathon = hackathons.find(h => h.id === formData.hackathonId)

  // 检查用户登录状态
  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">{t('auth.loginRequired')}</h1>
          <p className="text-muted-foreground mb-6">{t('auth.loginDesc')}</p>
        </div>
      </div>
    )
  }


  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        {/* 页面头部 */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <Users className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <p className="text-muted-foreground">
              {t('description')}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle>{t('form.teamName')}</CardTitle>
              <CardDescription>
                {t('form.maxMembersDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('form.teamName')} *</Label>
                <Input
                  id="name"
                  placeholder={t('form.teamNamePlaceholder')}
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={validationErrors.name ? "border-red-500" : ""}
                  required
                />
                {validationErrors.name && (
                  <p className="text-sm text-red-500">{validationErrors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('form.description')} *</Label>
                <Textarea
                  id="description"
                  placeholder={t('form.descriptionPlaceholder')}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className={validationErrors.description ? "border-red-500" : ""}
                  rows={3}
                  required
                />
                {validationErrors.description && (
                  <p className="text-sm text-red-500">{validationErrors.description}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {formData.description.length}/500 {tCommon('characters')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hackathon">{t('form.hackathon')} *</Label>
                <Select value={formData.hackathonId} onValueChange={(value) => handleInputChange('hackathonId', value)}>
                  <SelectTrigger className={validationErrors.hackathonId ? "border-red-500" : ""}>
                    <SelectValue placeholder={t('form.hackathonPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoading ? (
                      <SelectItem value="loading" disabled>{tCommon('loading')}</SelectItem>
                    ) : hackathons.length === 0 ? (
                      <SelectItem value="empty" disabled>No hackathons available</SelectItem>
                    ) : (
                      hackathons.map(hackathon => (
                        <SelectItem key={hackathon.id} value={hackathon.id}>
                          <div className="flex flex-col">
                            <span>{hackathon.title}</span>
                            <span className="text-xs text-muted-foreground">
                              {t('hackathon.deadline')}: {new Date(hackathon.endDate).toLocaleDateString()}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {validationErrors.hackathonId && (
                  <p className="text-sm text-red-500">{validationErrors.hackathonId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxMembers">{t('hackathon.teamSize')}</Label>
                <Select value={formData.maxMembers.toString()} onValueChange={(value) => handleInputChange('maxMembers', parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">{t('hackathon.members3')}</SelectItem>
                    <SelectItem value="4">{t('hackathon.members4')}</SelectItem>
                    <SelectItem value="5">{t('hackathon.members5')}</SelectItem>
                    <SelectItem value="6">{t('hackathon.members6')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 技术栈 */}
          <Card>
            <CardHeader>
              <CardTitle>{t('sections.techStack')}</CardTitle>
              <CardDescription>
                {t('sections.techStackDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Select value={newTech} onValueChange={setNewTech}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={t('form.selectTechStack')} />
                  </SelectTrigger>
                  <SelectContent>
                    {techStackOptions.filter(tech => !formData.skills.includes(tech)).map(tech => (
                      <SelectItem key={tech} value={tech}>{tech}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={() => addSkill(newTech)} disabled={!newTech}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {formData.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map(skill => (
                    <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                      {skill}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeSkill(skill)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
              
              {validationErrors.skills && (
                <p className="text-sm text-red-500">{validationErrors.skills}</p>
              )}
              
              <p className="text-xs text-muted-foreground">
                {t('sections.skillsSelected', { count: formData.skills.length })}
              </p>
            </CardContent>
          </Card>

          {/* 团队标签 */}
          <Card>
            <CardHeader>
              <CardTitle>{t('sections.teamTags')}</CardTitle>
              <CardDescription>
                {t('sections.teamTagsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={t('form.selectRole')} />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.filter(role => !formData.tags.includes(role)).map(role => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={() => addTag(newRole)} disabled={!newRole}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="flex items-center gap-1">
                      {tag}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 隐私设置 */}
          <Card>
            <CardHeader>
              <CardTitle>{t('sections.privacy')}</CardTitle>
              <CardDescription>
                {t('sections.privacyDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="isPublic">{t('sections.publicTeamLabel')}</Label>
                  <p className="text-sm text-muted-foreground">{t('sections.publicTeamDesc')}</p>
                </div>
                <Switch
                  id="isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => handleInputChange('isPublic', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* 操作按钮 */}
          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting ? t('actions.creating') : t('actions.createTeam')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
