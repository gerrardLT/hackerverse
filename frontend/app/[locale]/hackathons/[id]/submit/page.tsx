'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, Github, Globe, Video, FileText, Users, Plus, X, Check, AlertCircle, Database, Copy, Code } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { IPFSUpload } from '@/components/ipfs/ipfs-upload'
import { ipfsService, IPFSUploadResult } from '@/lib/ipfs'
import { apiService } from '@/lib/api'

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  skills: string[]
}

export default function SubmitProjectPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const t = useTranslations('hackathons.submit')
  const tCommon = useTranslations('common')
  
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hackathon, setHackathon] = useState<any>(null)
  const [userProject, setUserProject] = useState<any>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  
  // 项目基本信息
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [selectedTrack, setSelectedTrack] = useState('')
  const [selectedTechnologies, setSelectedTechnologies] = useState<string[]>([])
  
  // 团队信息
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: user?.username || '',
      email: user?.email || '',
      role: 'Team Leader',
      skills: []
    }
  ])
  
  // 项目详情
  const [problemStatement, setProblemStatement] = useState('')
  const [solution, setSolution] = useState('')
  const [features, setFeatures] = useState<string[]>([''])
  const [technicalArchitecture, setTechnicalArchitecture] = useState('')
  const [challenges, setChallenges] = useState('')
  const [futureWork, setFutureWork] = useState('')
  
  // 项目资源
  const [githubUrl, setGithubUrl] = useState('')
  const [demoUrl, setDemoUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [presentationUrl, setPresentationUrl] = useState('')
  
  // IPFS 相关
  const [ipfsFiles, setIpfsFiles] = useState<IPFSUploadResult[]>([])
  const [projectMetadataHash, setProjectMetadataHash] = useState('')
  
  // 提交确认
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [allowPublicView, setAllowPublicView] = useState(true)

  useEffect(() => {
    const fetchHackathon = async () => {
      try {
        const response = await apiService.getHackathon(params.id as string)
        if (response.success && response.data) {
          const hackathonData = response.data.hackathon
          setHackathon({
            id: hackathonData.id,
            title: hackathonData.title,
            startDate: hackathonData.startDate,
            endDate: hackathonData.endDate,
            tracks: hackathonData.metadata?.tracks && Array.isArray(hackathonData.metadata.tracks)
              ? hackathonData.metadata.tracks.map((track: any) => track.name || track)
              : hackathonData.categories || ['主赛道'],
            technologies: hackathonData.metadata?.technologies && Array.isArray(hackathonData.metadata.technologies)
              ? hackathonData.metadata.technologies
              : ['React', 'NodeJS', 'TypeScript', 'Solidity'],
            deadline: hackathonData.endDate
          })
        }
      } catch (error) {
        console.error('获取黑客松信息失败:', error)
        toast({
          title: t('messages.loadingFailed'),
          description: t('messages.loadingFailedDesc'),
          variant: 'destructive',
        })
      }
    }

    const checkUserProject = async () => {
      if (!user) return
      
      try {
        // 获取用户在该黑客松中的项目
        const response = await apiService.getUserProjects({ hackathonId: params.id as string })
        if (response.success && response.data && response.data.projects.length > 0) {
          const project = response.data.projects[0] // 用户在该黑客松中的项目
          setUserProject(project)
          setHasSubmitted(true)
        }
      } catch (error) {
        console.error('检查用户项目失败:', error)
      }
    }

    if (params.id) {
      fetchHackathon()
      if (user) {
        checkUserProject()
      }
    }
  }, [params.id, user]) // 移除toast依赖

  if (!user) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t('auth.loginRequired')}</h1>
          <Button asChild>
            <Link href="/auth/signin">{t('auth.login')}</Link>
          </Button>
        </div>
      </div>
    )
  }

  const addTeamMember = () => {
    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: '',
      email: '',
      role: 'Developer',
      skills: []
    }
    setTeamMembers([...teamMembers, newMember])
  }

  const removeTeamMember = (id: string) => {
    setTeamMembers(teamMembers.filter(member => member.id !== id))
  }

  const updateTeamMember = (id: string, field: keyof TeamMember, value: any) => {
    setTeamMembers(teamMembers.map(member => 
      member.id === id ? { ...member, [field]: value } : member
    ))
  }

  const addFeature = () => {
    setFeatures([...features, ''])
  }

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...features]
    newFeatures[index] = value
    setFeatures(newFeatures)
  }

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index))
  }

  const toggleTechnology = (tech: string) => {
    setSelectedTechnologies(prev => 
      prev.includes(tech) 
        ? prev.filter(t => t !== tech)
        : [...prev, tech]
    )
  }

  const handleIPFSUpload = (results: IPFSUploadResult[]) => {
    setIpfsFiles(prev => [...prev, ...results])
    toast({
      title: t('messages.ipfsUploadSuccess'),
      description: t('messages.ipfsUploadSuccessDesc', { count: results.length }),
    })
  }

  const createProjectMetadata = async () => {
    try {
      const metadata = ipfsService.createProjectMetadata({
        name: projectName,
        description: projectDescription,
        team: teamMembers[0]?.name || 'Unknown Team',
        technologies: selectedTechnologies,
        demoUrl,
        githubUrl,
        videoUrl
      })

      // 通过后端API上传到IPFS
      const token = typeof window !== 'undefined' ? localStorage.getItem('hackx-token') : null
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }
      
      const response = await fetch('/api/ipfs/upload', {
        method: 'PUT', // JSON数据使用PUT方法
        headers,
        body: JSON.stringify({ data: metadata, metadata: { name: 'project-metadata.json' } })
      })
      
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || t('messages.uploadFailed'))
      }
      
      setProjectMetadataHash(result.hash)
      
      toast({
        title: t('messages.metadataUploaded'),
        description: t('messages.metadataUploadedDesc'),
      })

      return result.hash
    } catch (error) {
      console.error('Failed to create metadata:', error)
      toast({
        title: t('messages.metadataUploadFailed'),
        description: t('messages.metadataUploadFailedDesc'),
        variant: 'destructive',
      })
      throw error
    }
  }

  // 检查是否可以提交项目（时间限制）
  const canSubmitProject = () => {
    if (!hackathon) return false
    
    const now = new Date()
    const startDate = new Date(hackathon.startDate)
    const endDate = new Date(hackathon.endDate)
    
    return now >= startDate && now <= endDate
  }
  
  const getSubmissionTimeStatus = () => {
    if (!hackathon) return { canSubmit: false, message: t('status.loading') }
    
    const now = new Date()
    const startDate = new Date(hackathon.startDate)
    const endDate = new Date(hackathon.endDate)
    
    if (now < startDate) {
      return {
        canSubmit: false,
        message: t('status.hackathonNotStarted', { startDate: startDate.toLocaleString() })
      }
    } else if (now > endDate) {
      return {
        canSubmit: false,
        message: t('status.hackathonEnded', { endDate: endDate.toLocaleString() })
      }
    } else {
      return {
        canSubmit: true,
        message: t('status.canSubmit', { endDate: endDate.toLocaleString() })
      }
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      // 创建并上传项目元数据到 IPFS
      const metadataHash = await createProjectMetadata()
      
      // 调用后端API提交项目
      const projectData = {
        title: projectName,
        description: projectDescription,
        hackathonId: params.id as string,
        technologies: selectedTechnologies,
        tags: features.filter(f => f.trim()),
        githubUrl: githubUrl || undefined,
        demoUrl: demoUrl || undefined,
        videoUrl: videoUrl || undefined,
        presentationUrl: presentationUrl || undefined,
        ipfsHash: metadataHash,
        isPublic: allowPublicView
      }
      
      console.log('📤 提交项目数据:', projectData)
      
      const response = await apiService.createProject(projectData)
      
      if (response.success) {
        toast({
          title: t('messages.projectSubmitSuccess'),
          description: t('messages.projectSubmitSuccessDesc', { hash: metadataHash.substring(0, 12) }),
        })
        
        router.push(`/hackathons/${params.id}`)
      } else {
        throw new Error(response.error || t('messages.submitFailed'))
      }
    } catch (error) {
      console.error('项目提交失败:', error)
      toast({
        title: t('messages.submitFailed'),
        description: error instanceof Error ? error.message : t('messages.submitFailedDesc'),
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const steps = [
    { id: 1, name: t('steps.1.name'), description: t('steps.1.description') },
    { id: 2, name: t('steps.2.name'), description: t('steps.2.description') },
    { id: 3, name: t('steps.3.name'), description: t('steps.3.description') },
    { id: 4, name: t('steps.4.name'), description: t('steps.4.description') },
    { id: 5, name: t('steps.5.name'), description: t('steps.5.description') }
  ]

  const getStepProgress = () => {
    return (currentStep / steps.length) * 100
  }

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        {hasSubmitted && userProject ? (
          // 已提交项目的显示
          <div className="space-y-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold">{t('status.projectSubmitted')}</h1>
              <p className="text-muted-foreground mt-2">
                {t('status.projectSubmittedDesc', { hackathonTitle: hackathon?.title })}
              </p>
            </div>
            
            <Alert>
              <Check className="h-4 w-4" />
              <AlertDescription>
                {t('status.alreadySubmittedDesc')}
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  {userProject.title || userProject.name}
                </CardTitle>
                <CardDescription>
                  {t('status.submissionTime', { time: new Date(userProject.createdAt).toLocaleString() })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {userProject.description}
                </p>
                
                <div className="flex flex-wrap gap-2">
                  {(userProject.technologies || userProject.tags || []).map((tech: string, index: number) => (
                    <Badge key={index} variant="secondary">{tech}</Badge>
                  ))}
                </div>

                <div className="flex gap-4">
                  {userProject.githubUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={userProject.githubUrl} target="_blank">
                        <Github className="w-4 h-4 mr-2" />
                        {t('buttons.codeRepo')}
                      </Link>
                    </Button>
                  )}
                  {userProject.demoUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={userProject.demoUrl} target="_blank">
                        <Globe className="w-4 h-4 mr-2" />
                        {t('buttons.onlineDemo')}
                      </Link>
                    </Button>
                  )}
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/hackathons/${params.id}`}>
                      {t('buttons.backToHackathon')}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // 正常的提交表单
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold">{t('title')}</h1>
              <p className="text-muted-foreground mt-2">
                {t('description', { hackathonTitle: hackathon?.title || 'Hackathon' })}
              </p>
              <Progress value={getStepProgress()} className="mt-4" />
            </div>

        {/* 步骤指示器 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
                  currentStep > step.id 
                    ? "bg-green-500 text-white" 
                    : currentStep === step.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}>
                  {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
                </div>
                <div className="ml-2 hidden sm:block">
                  <p className={cn(
                    "text-sm font-medium",
                    currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="w-12 h-0.5 bg-muted mx-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            {/* 步骤 1: 项目信息 */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">{t('steps.1.name')}</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="projectName">{t('labels.projectName')} *</Label>
                      <Input
                        id="projectName"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder={t('form.projectNamePlaceholder')}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="projectDescription">{t('labels.projectDescription')} *</Label>
                      <Textarea
                        id="projectDescription"
                        value={projectDescription}
                        onChange={(e) => setProjectDescription(e.target.value)}
                        placeholder={t('placeholders.projectDescShort')}
                        className="mt-1 min-h-[100px]"
                      />
                    </div>

                    <div>
                      <Label>{t('labels.selectTrack')} *</Label>
                      <Select value={selectedTrack} onValueChange={setSelectedTrack}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder={t('form.selectTrackPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {hackathon?.tracks?.map((track: string) => (
                            <SelectItem key={track} value={track}>
                              {track}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>{t('labels.techStack')}</Label>
                      <p className="text-sm text-muted-foreground mb-3">
                        {t('labels.techStackDesc')}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {hackathon?.technologies?.map((tech: string) => (
                          <div key={tech} className="flex items-center space-x-2">
                            <Checkbox
                              id={tech}
                              checked={selectedTechnologies.includes(tech)}
                              onCheckedChange={() => toggleTechnology(tech)}
                            />
                            <Label htmlFor={tech} className="text-sm">
                              {tech}
                            </Label>
                          </div>
                        ))}
                      </div>
                      
                      {selectedTechnologies.length > 0 && (
                        <div className="mt-3">
                          <div className="flex flex-wrap gap-2">
                            {selectedTechnologies.map((tech) => (
                              <Badge key={tech} variant="secondary">
                                {tech}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 步骤 2: 团队组建 */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">{t('labels.teamMembers')}</h3>
                  
                  <div className="space-y-4">
                    {teamMembers.map((member, index) => (
                      <Card key={member.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium">
                              {t('labels.member')} {index + 1} {index === 0 && t('labels.teamLeader')}
                            </h4>
                            {index > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTeamMember(member.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>{t('labels.memberName')} *</Label>
                              <Input
                                value={member.name}
                                onChange={(e) => updateTeamMember(member.id, 'name', e.target.value)}
                                placeholder={t('form.memberNamePlaceholder')}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label>{t('labels.memberEmail')} *</Label>
                              <Input
                                value={member.email}
                                onChange={(e) => updateTeamMember(member.id, 'email', e.target.value)}
                                placeholder={t('form.memberEmailPlaceholder')}
                                className="mt-1"
                              />
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            <Label>{t('labels.memberRole')}</Label>
                            <Select 
                              value={member.role} 
                              onValueChange={(value) => updateTeamMember(member.id, 'role', value)}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Team Leader">{t('roles.teamLeader')}</SelectItem>
                                <SelectItem value="Frontend Developer">{t('roles.frontendDev')}</SelectItem>
                                <SelectItem value="Backend Developer">{t('roles.backendDev')}</SelectItem>
                                <SelectItem value="Smart Contract Developer">{t('roles.smartContractDev')}</SelectItem>
                                <SelectItem value="UI/UX Designer">{t('roles.uiuxDesigner')}</SelectItem>
                                <SelectItem value="Product Manager">{t('roles.productManager')}</SelectItem>
                                <SelectItem value="Other">{t('roles.other')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    <Button variant="outline" onClick={addTeamMember} className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      {t('buttons.addMember')}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* 步骤 3: 项目详情 */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">{t('labels.projectDetails')}</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="problemStatement">{t('labels.problemStatement')} *</Label>
                      <Textarea
                        id="problemStatement"
                        value={problemStatement}
                        onChange={(e) => setProblemStatement(e.target.value)}
                        placeholder={t('placeholders.problemDescription')}
                        className="mt-1 min-h-[100px]"
                      />
                    </div>

                    <div>
                      <Label htmlFor="solution">{t('labels.solution')} *</Label>
                      <Textarea
                        id="solution"
                        value={solution}
                        onChange={(e) => setSolution(e.target.value)}
                        placeholder={t('placeholders.solutionDescription')}
                        className="mt-1 min-h-[120px]"
                      />
                    </div>

                    <div>
                      <Label>{t('labels.keyFeatures')}</Label>
                      <div className="space-y-3 mt-2">
                        {features.map((feature, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={feature}
                              onChange={(e) => updateFeature(index, e.target.value)}
                              placeholder={t('placeholders.featurePlaceholder')}
                              className="flex-1"
                            />
                            {features.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFeature(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button variant="outline" onClick={addFeature} size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          {t('buttons.addFeature')}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="technicalArchitecture">{t('labels.technicalArchitecture')}</Label>
                      <Textarea
                        id="technicalArchitecture"
                        value={technicalArchitecture}
                        onChange={(e) => setTechnicalArchitecture(e.target.value)}
                        placeholder={t('placeholders.technicalArchitecture')}
                        className="mt-1 min-h-[100px]"
                      />
                    </div>

                    <div>
                      <Label htmlFor="challenges">{t('labels.challenges')}</Label>
                      <Textarea
                        id="challenges"
                        value={challenges}
                        onChange={(e) => setChallenges(e.target.value)}
                        placeholder={t('placeholders.challengesDescription')}
                        className="mt-1 min-h-[100px]"
                      />
                    </div>

                    <div>
                      <Label htmlFor="futureWork">{t('labels.futureWork')}</Label>
                      <Textarea
                        id="futureWork"
                        value={futureWork}
                        onChange={(e) => setFutureWork(e.target.value)}
                        placeholder={t('placeholders.futureWorkDescription')}
                        className="mt-1 min-h-[100px]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 步骤 4: IPFS 存储 */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    {t('labels.decentralizedStorage')}
                  </h3>
                  
                  <Alert className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {t('ipfs.description')}
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-6">
                    {/* 项目链接 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">{t('labels.projectLinks')}</CardTitle>
                        <CardDescription>
                          {t('labels.projectLinksDesc')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="githubUrl">{t('labels.githubRepo')} *</Label>
                            <div className="flex mt-1">
                              <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted">
                                <Github className="h-4 w-4" />
                              </div>
                              <Input
                                id="githubUrl"
                                value={githubUrl}
                                onChange={(e) => setGithubUrl(e.target.value)}
                                placeholder="https://github.com/username/repo"
                                className="rounded-l-none"
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="demoUrl">{t('labels.demoLink')}</Label>
                            <div className="flex mt-1">
                              <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted">
                                <Globe className="h-4 w-4" />
                              </div>
                              <Input
                                id="demoUrl"
                                value={demoUrl}
                                onChange={(e) => setDemoUrl(e.target.value)}
                                placeholder="https://your-demo.com"
                                className="rounded-l-none"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="videoUrl">{t('labels.videoDemo')}</Label>
                            <div className="flex mt-1">
                              <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted">
                                <Video className="h-4 w-4" />
                              </div>
                              <Input
                                id="videoUrl"
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                                placeholder="https://youtube.com/watch?v=..."
                                className="rounded-l-none"
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="presentationUrl">{t('labels.projectDocs')}</Label>
                            <div className="flex mt-1">
                              <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted">
                                <FileText className="h-4 w-4" />
                              </div>
                              <Input
                                id="presentationUrl"
                                value={presentationUrl}
                                onChange={(e) => setPresentationUrl(e.target.value)}
                                placeholder="https://docs.google.com/..."
                                className="rounded-l-none"
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* IPFS 文件上传 */}
                    <IPFSUpload
                      onUploadComplete={handleIPFSUpload}
                      acceptedTypes={['image/*', 'video/*', '.pdf', '.doc', '.docx', '.txt', '.md', '.zip']}
                      maxFiles={20}
                      maxFileSize={100}
                      showPreview={true}
                    />

                    {/* 已上传文件统计 */}
                    {ipfsFiles.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">{t('ipfs.storageStats')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div>
                              <div className="text-2xl font-bold text-primary">{ipfsFiles.length}</div>
                              <div className="text-sm text-muted-foreground">{t('ipfs.fileCount')}</div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-primary">
                                {(ipfsFiles.reduce((sum, file) => sum + file.size, 0) / 1024 / 1024).toFixed(1)}MB
                              </div>
                              <div className="text-sm text-muted-foreground">{t('ipfs.totalSize')}</div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-primary">
                                {ipfsFiles.filter(f => f.path.match(/\.(jpg|jpeg|png|gif)$/i)).length}
                              </div>
                              <div className="text-sm text-muted-foreground">{t('ipfs.imageFiles')}</div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-primary">
                                {ipfsFiles.filter(f => f.path.match(/\.(mp4|avi|mov)$/i)).length}
                              </div>
                              <div className="text-sm text-muted-foreground">{t('ipfs.videoFiles')}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 步骤 5: 提交确认 */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">提交确认</h3>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-500" />
                        项目信息确认
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium">项目名称</p>
                          <p className="text-sm text-muted-foreground">{projectName || '未填写'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">参赛赛道</p>
                          <p className="text-sm text-muted-foreground">{selectedTrack || '未选择'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">团队成员</p>
                          <p className="text-sm text-muted-foreground">{teamMembers.length} 人</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">技术栈</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedTechnologies.length > 0 ? selectedTechnologies.join(', ') : '未选择'}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-2">项目资源</p>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>• GitHub: {githubUrl || '未提供'}</p>
                          <p>• 演示链接: {demoUrl || '未提供'}</p>
                          <p>• 演示视频: {videoUrl || '未提供'}</p>
                          <p>• 项目文档: {presentationUrl || '未提供'}</p>
                          <p>• IPFS 文件: {ipfsFiles.length} 个</p>
                        </div>
                      </div>

                      {projectMetadataHash && (
                        <div>
                          <p className="text-sm font-medium mb-2">IPFS 元数据</p>
                          <div className="flex items-center gap-2 p-2 bg-muted rounded">
                            <code className="text-xs font-mono flex-1">
                              {projectMetadataHash}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigator.clipboard.writeText(projectMetadataHash)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="terms"
                        checked={agreedToTerms}
                        onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                      />
                      <Label htmlFor="terms" className="text-sm">
                        我确认项目信息准确无误，同意遵守黑客松规则和条款，
                        并理解所有文件将永久存储在 IPFS 网络中
                      </Label>
                    </div>

                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="public"
                        checked={allowPublicView}
                        onCheckedChange={(checked) => setAllowPublicView(checked as boolean)}
                      />
                      <Label htmlFor="public" className="text-sm">
                        允许公开展示我的项目（推荐）
                      </Label>
                    </div>
                  </div>

                  <Alert>
                    <Database className="h-4 w-4" />
                    <AlertDescription>
                      <strong>IPFS 存储说明：</strong>
                      <ul className="mt-2 space-y-1 text-sm">
                        <li>• 所有文件将存储在去中心化的 IPFS 网络中</li>
                        <li>• 文件一旦上传将无法删除，请确保内容合规</li>
                        <li>• 项目元数据将自动生成并存储</li>
                        <li>• 你可以通过 IPFS 哈希永久访问文件</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            )}

            {/* 导航按钮 */}
            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
              >
                上一步
              </Button>
              
              {currentStep < 5 ? (
                <Button
                  onClick={() => setCurrentStep(Math.min(5, currentStep + 1))}
                  disabled={
                    (currentStep === 1 && (!projectName || !projectDescription || !selectedTrack)) ||
                    (currentStep === 2 && teamMembers.some(m => !m.name || !m.email)) ||
                    (currentStep === 4 && !githubUrl)
                  }
                >
                  下一步
                </Button>
              ) : (
                <div className="space-y-4">
                  {/* 时间状态提示 */}
                  <Alert className={cn(
                    getSubmissionTimeStatus().canSubmit ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"
                  )}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {getSubmissionTimeStatus().message}
                    </AlertDescription>
                  </Alert>
                  
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !agreedToTerms || !canSubmitProject()}
                    className="w-full"
                  >
                    {isSubmitting ? t('messages.submitting') : 
                     !canSubmitProject() ? t('messages.cannotSubmit') : 
                     t('messages.submitToIpfs')}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
          </>
        )}
      </div>
    </div>
  )
}
